# Phase 14: Survey Integration - Research

**Researched:** 2026-02-03
**Domain:** AI agent orchestration, mid-conversation mode switching, context handoff protocols
**Confidence:** HIGH

## Summary

Phase 14 integrates the engineer mode (Phase 11-13) into the survey pipeline by implementing mid-survey takeover when users hit knowledge cliffs. The research identified three critical integration points: (1) detecting cliff signals during survey question-answer cycles and offering mode switch at phase boundaries, (2) generating context handoff documents (`surveyor-context.md` or `surveyor_notes` in survey.json) that capture conversational nuances before switching, and (3) invoking the engineer agent via the standard Skill tool mechanism with full context preservation.

The established Banneker pattern for agent invocation uses the Task tool (equivalent to Skill tool in Claude Code terminology) to spawn sub-agents. The surveyor already has cliff detection protocol documented in `templates/agents/banneker-surveyor.md` with explicit signal detection, three-option confirmation flow, and context handoff structure. Phase 14 implements the actual integration logic that connects these documented protocols.

This phase depends on Phase 12 (cliff detection logic in `lib/cliff-detection.js`) and Phase 13 (approval flow for engineer proposals). The surveyor must write partial survey.json before mode switch, persist handoff context, invoke engineer, and support graceful continuation if user declines the takeover offer.

**Primary recommendation:** Implement mid-survey takeover by (1) calling `detectExplicitCliff()` after each substantive response in Phases 1-5, (2) triggering three-option confirmation at phase boundaries, (3) writing `surveyor-context.md` before engineer invocation, (4) persisting `cliff_signals` to survey.json, and (5) using Task tool to spawn `banneker:engineer` with handoff context.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lib/cliff-detection.js | Local | Explicit cliff signal detection | Phase 12 implementation, `detectExplicitCliff()` function |
| Task/Skill tool | Runtime | Agent invocation | Banneker standard for spawning sub-agents |
| Node.js built-ins | 18.0+ | File I/O, JSON manipulation | Zero-dependency constraint (REQ-INST-007) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| survey-state.md | N/A | Survey resume state | Track cliff detection state, deferred questions |
| surveyor-context.md | N/A | Context handoff document | Preserve conversational nuances for engineer |
| survey.json | Schema 1.0 | Structured survey output | Persist cliff_signals array |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Task tool invocation | Direct agent embedding | Task tool is established pattern, provides clean separation |
| surveyor-context.md file | Inline context in Task tool call | File persists for debugging, survives interrupts |
| Phase boundary offers | Immediate offers | Phase boundaries reduce interruption fatigue, allow completing thoughts |

**Installation:**
No installation required - uses existing Phase 12 cliff-detection.js module and established Banneker patterns.

## Architecture Patterns

### Recommended Project Structure
```
templates/
├── agents/
│   └── banneker-surveyor.md     # Extended with integration logic
├── commands/
│   └── banneker-survey.md       # Orchestrator (existing)
│   └── banneker-engineer.md     # Target for mode switch (existing)
└── config/
    └── cliff-detection-signals.md   # Signal configuration (existing)
lib/
└── cliff-detection.js           # Detection logic (Phase 12)
.banneker/
├── survey.json                  # Extended with cliff_signals
└── state/
    ├── survey-state.md          # Extended with cliff tracking
    └── surveyor-context.md      # NEW: Context handoff document
```

### Pattern 1: Phase Boundary Mode Switch Offers
**What:** Detect cliff signals during question-answer cycles, but only offer mode switch at phase boundaries (end of current phase).

**When to use:** Mid-survey takeover to reduce interruption fatigue while still capturing cliff signals in real-time.

**Example:**
```markdown
// Source: banneker-surveyor.md Cliff Detection Protocol
## Detection Timing

During Phases 1-5:
1. After each substantive user response, call detectExplicitCliff()
2. If detected: Log to cliff_signals, set pendingOffer = true
3. At phase boundary: If pendingOffer, present three-option confirmation
4. If user accepts: Write context handoff, invoke engineer
5. If user declines: Increment declinedOffers, continue to next phase
6. If user skips: Mark question as deferred, continue

**Why phase boundaries:**
- Allows user to complete current thought/phase
- Reduces "interruption fatigue" from mid-question offers
- Aligns with survey's natural structure
- Provides cleaner handoff point (complete phase data available)

**Exception - immediate offer:**
- If user response contains explicit "take it from here" or "you decide everything"
- These indicate immediate desire for mode switch, don't wait for phase boundary
```

**Application to Phase 14:** Surveyor tracks `pendingOffer` flag during question cycles. At each phase completion checkpoint, checks flag and presents confirmation if needed.

### Pattern 2: Context Handoff Protocol (ENGINT-04)
**What:** Before invoking engineer, surveyor writes `.banneker/state/surveyor-context.md` capturing conversational nuances not in structured survey.json.

**When to use:** Every mode switch from surveyor to engineer.

**Example:**
```markdown
// Source: banneker-surveyor.md Step 4: Context Handoff
---
generated: 2026-02-03T10:30:00Z
phase_at_switch: backend
cliff_trigger: "I don't know, whatever you think is best"
survey_completeness: 65%
---

## User Preferences Observed

During conversation, user indicated:
- Prefers managed services over self-hosted ("I don't want to manage infrastructure")
- Budget-conscious ("We're a small team with limited resources")
- Prioritizes speed-to-market ("Need to launch in 3 months")

## Implicit Constraints

- Solo developer (user referred to "I" not "we" for technical decisions)
- First production application ("This is my first real project")
- No DevOps experience (asked clarifying questions about "deployment")

## Topics User Felt Confident About

- Problem domain and user needs (detailed walkthrough descriptions)
- UI/UX requirements and flows
- Basic data model structure

## Topics User Felt Uncertain About

- Backend infrastructure choices
- Database selection
- Deployment and hosting
- Security implementation details

## Deferred Questions

- Phase 4, Q2: "What data stores does this project use?" (deferred at 10:25:00Z)

## Recommendations for Engineer Agent

- Start with simplest viable backend approach (user prefers simple)
- Emphasize managed services (user wants low maintenance)
- Include cost considerations in recommendations (budget-conscious)
- Provide educational context (user is learning, not just executing)
```

**Application to Phase 14:** Surveyor extracts preferences from conversation history, identifies confidence patterns, and writes this document before Task tool invocation.

### Pattern 3: Partial Survey Persistence Before Mode Switch
**What:** Write current survey.json state before invoking engineer, even if incomplete.

**When to use:** Mid-survey takeover ensures engineer has access to all collected data.

**Example:**
```javascript
// Source: Derived from banneker-surveyor.md completion protocol
async function prepareForModeSwitch(surveyState, cliffSignal) {
    // 1. Build partial survey.json from current state
    const partialSurvey = {
        survey_metadata: {
            version: "1.0",
            created: new Date().toISOString(),
            runtime: detectRuntime(),
            status: "partial" // Indicates mid-survey state
        },
        project: surveyState.project, // Phase 1 data
        actors: surveyState.actors,   // Phase 2 data
        walkthroughs: surveyState.walkthroughs, // Phase 3 data
        backend: surveyState.backend || { applicable: "unknown" }, // Phase 4 may be partial
        rubric_coverage: surveyState.rubric_coverage || { covered: [], gaps: ["incomplete_survey"] },
        cliff_signals: surveyState.cliffSignals // All detected signals
    };

    // 2. Write partial survey.json
    await writeFile('.banneker/survey.json', JSON.stringify(partialSurvey, null, 2));

    // 3. Write context handoff
    await writeSurveyorContext(surveyState, cliffSignal);

    // 4. Update survey-state.md with mode switch marker
    await updateSurveyState({
        ...surveyState,
        modeSwitchAt: new Date().toISOString(),
        modeSwitchPhase: surveyState.currentPhase,
        modeSwitchReason: cliffSignal.signal
    });
}
```

**Application to Phase 14:** Surveyor MUST write survey.json before engineer invocation. Engineer's minimum viable check (Phases 1-3 required) depends on this data.

### Pattern 4: Task Tool Invocation for Engineer
**What:** Use standard Banneker Task tool pattern to spawn engineer agent with context.

**When to use:** Mode switch execution after user confirms.

**Example:**
```markdown
// Source: Derived from banneker-architect.md Step 3 and banneker-survey.md Step 2
## Invoke Engineer via Task Tool

After writing context handoff documents, invoke the engineer:

**Task name:** "Synthesize engineering documents from partial survey data"
**Agent reference:** banneker-engineer
**Context to pass:**
  - "Mode switch from surveyor mid-survey"
  - "Context handoff at: .banneker/state/surveyor-context.md"
  - "Survey completeness: [X]%"
  - "Cliff trigger: [signal that triggered switch]"
  - "User preferences summary: [key preferences from context]"

**Transition message to user:**
```
Switching to engineering mode...

I've saved our conversation progress:
- Survey data: .banneker/survey.json (Phases 1-[N] captured)
- Context notes: .banneker/state/surveyor-context.md

I'll now analyze what we've discussed and generate:
- DIAGNOSIS.md - What we know, what's missing, where gaps exist
- RECOMMENDATION.md - Options analysis with trade-offs
- ENGINEERING-PROPOSAL.md - Concrete decisions for your approval

All recommendations will require your approval before any decisions are finalized.
```
```

**Application to Phase 14:** Surveyor uses same Task tool pattern as other Banneker commands. Context string provides engineer with mode-switch-specific guidance.

### Pattern 5: Decline Tracking and Suppression
**What:** Track declined mode switch offers, suppress after threshold (2 declines).

**When to use:** Preventing offer fatigue when user repeatedly declines.

**Example:**
```javascript
// Source: banneker-surveyor.md Decline Tracking + cliff-detection-signals.md thresholds
class CliffOfferTracker {
    constructor() {
        this.declinedOffers = 0;
        this.offerThreshold = 2; // From cliff-detection-signals.md
    }

    shouldOfferModeSwitch(detection) {
        // Always log detection regardless of offer
        logCliffSignal(detection);

        // Check suppression threshold
        if (this.declinedOffers >= this.offerThreshold) {
            // Log but don't offer
            logSuppressionEvent(detection, this.declinedOffers);
            return { shouldOffer: false, reason: "threshold_exceeded" };
        }

        // Offer for HIGH confidence signals
        if (detection.confidence === "HIGH") {
            return { shouldOffer: true };
        }

        return { shouldOffer: false, reason: "low_confidence" };
    }

    recordDecline() {
        this.declinedOffers++;
    }

    recordAccept() {
        // Reset on acceptance (allows re-offers if user returns to survey)
        this.declinedOffers = 0;
    }
}
```

**Application to Phase 14:** Surveyor maintains decline counter in survey-state.md. After 2 declines, cliff signals are still logged but offers are suppressed.

### Pattern 6: Deferred Questions Re-Offer
**What:** Questions skipped during cliff detection are re-offered at phase end.

**When to use:** User selects option 3 ("Skip this question for now").

**Example:**
```markdown
// Source: banneker-surveyor.md Deferred Questions section
## End-of-Phase Deferred Question Handling

At the end of each phase, check for deferred questions:

```
Before we move on to [next phase], you skipped a question earlier:
"What data stores does this project use?"

Would you like to:
1. Answer it now
2. Leave it for engineering mode to recommend
3. Mark as "not applicable"

(Type 1, 2, or 3)
```

**If user chooses:**
- **1 (Answer now):** Ask the question, record answer, remove from deferred list
- **2 (Leave for engineer):** Keep in deferred list, engineer sees gap in DIAGNOSIS.md
- **3 (Not applicable):** Mark as N/A, record reason, remove from deferred list
```

**Application to Phase 14:** Surveyor tracks deferred questions in survey-state.md. At phase boundaries, re-offers with three options.

### Anti-Patterns to Avoid

- **Immediate Interruption:** Never offer mode switch mid-sentence or mid-question. Wait for phase boundary or explicit delegation signal.
- **Silent Mode Switch:** NEVER switch modes without explicit user confirmation (CLIFF-02 requirement).
- **Lost Context:** Never invoke engineer without writing surveyor-context.md first. Structured survey.json alone loses conversational nuances.
- **Incomplete survey.json:** Never invoke engineer without first writing current survey state to survey.json. Engineer depends on this file.
- **Infinite Offers:** Never keep offering mode switch after 2 declines. Use suppression threshold to prevent offer fatigue.
- **Unlogged Signals:** Never skip logging cliff signals even when offer is suppressed. Audit trail is required.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cliff signal detection | Custom regex patterns | lib/cliff-detection.js `detectExplicitCliff()` | Phase 12 implementation, tested, includes all 14 signals |
| Agent invocation | Custom spawning logic | Task tool (standard Banneker pattern) | Established pattern in all Banneker commands |
| Confirmation flow | Custom three-option prompt | banneker-surveyor.md CLIFF-02 protocol | Already documented, consistent with other confirmations |
| Context persistence | Inline in Task tool call | surveyor-context.md file | Survives interrupts, available for debugging |
| Decline tracking | Manual counting | survey-state.md tracking | Integrates with existing state management |

**Key insight:** Phase 14 is integration, not invention. The cliff detection logic exists (Phase 12), the engineer exists (Phase 11), the approval flow exists (Phase 13), and the surveyor's cliff detection protocol is documented. Phase 14 connects these existing pieces.

## Common Pitfalls

### Pitfall 1: Offering Mode Switch at Wrong Time
**What goes wrong:** System offers mode switch mid-question or when user is actively explaining something, creating interruption fatigue.

**Why it happens:**
- Detecting cliff signal triggers immediate offer instead of waiting for phase boundary
- No distinction between "user is uncertain" and "user is delegating entire decision"

**How to avoid:**
1. Detect cliff signals in real-time but defer offers to phase boundaries
2. Set `pendingOffer` flag on detection, check at phase completion
3. Exception: Explicit delegation phrases ("take it from here", "you decide everything") trigger immediate offer
4. Track offer timing in survey-state.md for debugging

**Warning signs:**
- Users complain about being "interrupted"
- High decline rate (>70%) on mode switch offers
- Users give shorter answers to avoid triggering detection
- Survey completion rate drops after Phase 14 deployment

### Pitfall 2: Context Loss During Mode Switch
**What goes wrong:** Engineer generates recommendations that contradict user's stated preferences from survey conversation.

**Why it happens:**
- Context handoff document not written before engineer invocation
- surveyor-context.md missing key preferences or constraints
- Engineer doesn't read context document before starting

**How to avoid:**
1. MANDATORY: Write surveyor-context.md before Task tool invocation
2. Include explicit "User Preferences Observed" section with conversation citations
3. Include "Implicit Constraints" section for inferred context (solo developer, budget-conscious, etc.)
4. Include "Topics User Felt Uncertain About" to guide engineer's confidence assessment
5. Engineer agent instruction: Read surveyor-context.md FIRST, reference it in DIAGNOSIS.md

**Warning signs:**
- Engineer proposals contradict survey conversation ("But I said I wanted simple...")
- Recommendations feel generic despite detailed survey
- User has to re-explain constraints after mode switch
- DIAGNOSIS.md doesn't reference surveyor-context.md

### Pitfall 3: Incomplete Survey Data for Engineer
**What goes wrong:** Engineer invoked but survey.json wasn't written first, causing "No survey data found" error.

**Why it happens:**
- Mode switch logic doesn't include survey.json write step
- survey.json write fails but mode switch proceeds anyway
- Race condition between write and engineer invocation

**How to avoid:**
1. MANDATORY sequence: Write survey.json THEN write surveyor-context.md THEN invoke engineer
2. Verify survey.json exists after write before proceeding
3. If write fails, abort mode switch and report error
4. Include `status: "partial"` marker in survey_metadata to indicate mid-survey state

**Warning signs:**
- "No survey data found" error on mode switch
- Engineer starts with empty DIAGNOSIS.md
- survey.json missing phases that were completed
- Race condition errors in logs

### Pitfall 4: Deferred Questions Lost
**What goes wrong:** User skips question during cliff detection, but question is never re-offered and data gap isn't captured.

**Why it happens:**
- Deferred questions not persisted to survey-state.md
- End-of-phase check for deferred questions missing
- Mode switch doesn't include deferred questions in context handoff

**How to avoid:**
1. Persist deferred questions to survey-state.md immediately on skip
2. At phase boundary, check for deferred questions and re-offer with three options
3. Include "Deferred Questions" section in surveyor-context.md
4. Engineer sees deferred questions as explicit gaps in DIAGNOSIS.md

**Warning signs:**
- User says "I thought I could come back to that question"
- survey.json has unexplained gaps
- surveyor-context.md missing deferred question tracking
- DIAGNOSIS.md doesn't mention deferred questions

### Pitfall 5: Decline Tracking Not Persisted
**What goes wrong:** User declines 2 offers, closes terminal, reopens, gets immediately offered again.

**Why it happens:**
- Decline counter stored in memory, not survey-state.md
- Survey resume doesn't restore decline counter
- Threshold check uses wrong counter source

**How to avoid:**
1. Persist `declinedOffers` count to survey-state.md after each decline
2. On survey resume, restore decline counter from state file
3. Threshold check reads from state file, not memory
4. Include decline history in cliff_signals array for audit trail

**Warning signs:**
- User complains "I already said no to this"
- Decline counter resets unexpectedly
- survey-state.md doesn't include declinedOffers field
- Resume scenario triggers immediate offer

## Code Examples

Verified patterns from official sources:

### Detection and Offer Flow (Integration)
```javascript
// Source: Derived from banneker-surveyor.md + lib/cliff-detection.js
import { detectExplicitCliff } from './cliff-detection.js';

async function processUserResponse(response, surveyState, question) {
    // 1. Detect cliff signals
    const detection = detectExplicitCliff(response);

    // 2. Log all detections (CLIFF-01 audit trail)
    if (detection.detected) {
        const cliffEntry = {
            timestamp: new Date().toISOString(),
            phase: surveyState.currentPhase,
            question_context: question,
            user_response: response,
            detected_signal: detection.signal,
            confidence: detection.confidence,
            mode_switch_offered: false, // Updated after offer
            user_accepted: null
        };

        surveyState.cliffSignals = surveyState.cliffSignals || [];
        surveyState.cliffSignals.push(cliffEntry);

        // 3. Set pending offer flag for phase boundary check
        if (shouldOfferModeSwitch(detection, surveyState.declinedOffers)) {
            surveyState.pendingOffer = {
                detection,
                cliffEntry
            };
        }
    }

    // 4. Update state file
    await writeSurveyState(surveyState);

    return { detection, processedResponse: response };
}

function shouldOfferModeSwitch(detection, declinedOffers) {
    // Suppression threshold from cliff-detection-signals.md
    const SUPPRESSION_THRESHOLD = 2;

    if (declinedOffers >= SUPPRESSION_THRESHOLD) {
        return false;
    }

    return detection.confidence === "HIGH";
}
```

### Phase Boundary Offer Check
```javascript
// Source: Derived from banneker-surveyor.md CLIFF-02 confirmation flow
async function onPhaseBoundary(surveyState) {
    // Check for pending offer from cliff detection
    if (surveyState.pendingOffer) {
        const { detection, cliffEntry } = surveyState.pendingOffer;

        // Present three-option confirmation
        const userChoice = await presentModeSwitch(detection);

        // Update cliff entry with offer result
        cliffEntry.mode_switch_offered = true;
        cliffEntry.user_accepted = (userChoice === 1);

        // Handle user choice
        switch (userChoice) {
            case 1: // Switch to engineer mode
                surveyState.declinedOffers = 0; // Reset on accept
                await executeModeSwitch(surveyState, cliffEntry);
                return { action: 'switch_to_engineer' };

            case 2: // Continue survey
                surveyState.declinedOffers++;
                surveyState.pendingOffer = null;
                return { action: 'continue_survey' };

            case 3: // Skip question
                surveyState.declinedOffers++;
                surveyState.deferredQuestions = surveyState.deferredQuestions || [];
                surveyState.deferredQuestions.push({
                    phase: surveyState.currentPhase,
                    question: cliffEntry.question_context,
                    deferredAt: new Date().toISOString()
                });
                surveyState.pendingOffer = null;
                return { action: 'skip_question' };
        }
    }

    // Check for deferred questions to re-offer
    if (surveyState.deferredQuestions?.length > 0) {
        await reofferDeferredQuestions(surveyState);
    }

    return { action: 'continue_to_next_phase' };
}
```

### Mode Switch Execution
```javascript
// Source: Derived from banneker-surveyor.md Step 4-5 + banneker-engineer.md invocation
async function executeModeSwitch(surveyState, cliffEntry) {
    // 1. Write partial survey.json FIRST
    const partialSurvey = buildPartialSurvey(surveyState);
    await writeFile('.banneker/survey.json', JSON.stringify(partialSurvey, null, 2));

    // 2. Write context handoff document
    const contextContent = generateSurveyorContext(surveyState, cliffEntry);
    await writeFile('.banneker/state/surveyor-context.md', contextContent);

    // 3. Update survey-state.md with mode switch marker
    surveyState.modeSwitchAt = new Date().toISOString();
    surveyState.modeSwitchPhase = surveyState.currentPhase;
    surveyState.modeSwitchReason = cliffEntry.detected_signal;
    await writeSurveyState(surveyState);

    // 4. Display transition message to user
    console.log(`
Switching to engineering mode...

I've saved our conversation progress:
- Survey data: .banneker/survey.json (Phases 1-${getPhaseNumber(surveyState.currentPhase)} captured)
- Context notes: .banneker/state/surveyor-context.md

I'll now analyze what we've discussed and generate:
- DIAGNOSIS.md - What we know, what's missing, where gaps exist
- RECOMMENDATION.md - Options analysis with trade-offs
- ENGINEERING-PROPOSAL.md - Concrete decisions for your approval

All recommendations will require your approval before any decisions are finalized.
`);

    // 5. Invoke engineer via Task tool
    // This is executed by the runtime - surveyor agent uses Skill/Task tool
    // Context passed: "Mode switch from surveyor, read .banneker/state/surveyor-context.md first"
}
```

### Context Handoff Document Generation
```javascript
// Source: banneker-surveyor.md Context Handoff template
function generateSurveyorContext(surveyState, cliffEntry) {
    const preferences = extractPreferences(surveyState.conversationHistory);
    const constraints = extractConstraints(surveyState.conversationHistory);
    const confidencePatterns = analyzeConfidencePatterns(surveyState);

    return `---
generated: ${new Date().toISOString()}
phase_at_switch: ${surveyState.currentPhase}
cliff_trigger: "${cliffEntry.user_response}"
survey_completeness: ${computeCompleteness(surveyState)}%
---

## User Preferences Observed

During conversation, user indicated:
${preferences.map(p => `- ${p}`).join('\n')}

## Implicit Constraints

${constraints.map(c => `- ${c}`).join('\n')}

## Topics User Felt Confident About

${confidencePatterns.confident.map(t => `- ${t}`).join('\n')}

## Topics User Felt Uncertain About

${confidencePatterns.uncertain.map(t => `- ${t}`).join('\n')}

## Deferred Questions

${surveyState.deferredQuestions?.map(q =>
    `- Phase ${q.phase}, Q: "${q.question}" (deferred at ${q.deferredAt})`
).join('\n') || '- None'}

## Cliff Signals Detected

${surveyState.cliffSignals?.map(s =>
    `- [${s.timestamp}] Phase ${s.phase}: "${s.detected_signal}" (${s.confidence})`
).join('\n') || '- None'}

## Recommendations for Engineer Agent

${generateEngineerGuidance(preferences, constraints, confidencePatterns)}
`;
}

function generateEngineerGuidance(preferences, constraints, patterns) {
    const guidance = [];

    // Analyze preferences for guidance
    if (preferences.some(p => p.includes('simple') || p.includes('managed'))) {
        guidance.push('- Start with simplest viable approach (user prefers simple)');
    }
    if (preferences.some(p => p.includes('budget') || p.includes('cost') || p.includes('limited'))) {
        guidance.push('- Include cost considerations in recommendations (budget-conscious)');
    }
    if (constraints.some(c => c.includes('solo') || c.includes('first'))) {
        guidance.push('- Provide educational context (user is learning, not just executing)');
    }
    if (patterns.uncertain.length > patterns.confident.length) {
        guidance.push('- Use MEDIUM/LOW confidence markers for most recommendations (user had many uncertainties)');
    }

    return guidance.length > 0 ? guidance.join('\n') : '- No specific guidance (proceed with standard analysis)';
}
```

### Survey State with Cliff Tracking
```markdown
// Source: Derived from banneker-surveyor.md State Management + cliff tracking
---
command: survey
status: in-progress
started_at: 2026-02-03T10:00:00Z
last_updated: 2026-02-03T10:30:00Z
---

## Current Phase

Phase 4 of 6: Backend

## Completed Phases

- [x] Phase 1: Pitch (completed 2026-02-03T10:05:00Z)
- [x] Phase 2: Actors (completed 2026-02-03T10:12:00Z)
- [x] Phase 3: Walkthroughs (completed 2026-02-03T10:25:00Z)
- [ ] Phase 4: Backend (in progress)

## Collected Data

[... standard survey data ...]

## Cliff Detection State

**Declined offers:** 1
**Pending offer:** true
**Suppression threshold:** 2

### Cliff Signals Detected

- [2026-02-03T10:28:00Z] Phase 4: Detected "i don't know" in response to "What data stores does this project use?"
  - Confidence: HIGH
  - Mode switch offered: pending (at phase boundary)
  - User accepted: pending

### Deferred Questions

- Phase 4, Q2: "What data stores does this project use?" (deferred 2026-02-03T10:28:00Z)

## Interview Metadata

- **Started:** 2026-02-03T10:00:00Z
- **Last updated:** 2026-02-03T10:30:00Z
- **Runtime:** claude-code
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No mid-survey mode switch | Phase boundary mode switch offers | v0.3.0 (Phase 14) | Users can get engineering help mid-interview |
| Lost conversational context | surveyor-context.md handoff document | v0.3.0 (Phase 14) | Engineer has full conversational context |
| Inline context in invocation | Persistent context file | v0.3.0 (Phase 14) | Context survives interrupts, enables debugging |
| Immediate cliff offers | Phase boundary offers | v0.3.0 (Phase 14) | Reduced interruption fatigue |
| Binary accept/decline | Three-option (switch/continue/skip) | Phase 12 (CLIFF-02) | Better user control, deferred question support |

**Deprecated/outdated:**
- **Immediate mode switch offers:** Earlier design triggered offers immediately on cliff detection. Current approach waits for phase boundary to reduce interruption fatigue.
- **Context in Task tool call only:** Earlier design passed context inline. Current approach writes persistent file for reliability.

## Open Questions

Things that couldn't be fully resolved:

1. **Handoff Storage Location**
   - What we know: Requirements allow `surveyor_notes` in survey.json OR `.banneker/state/handoff-context.md`
   - What's unclear: Which is preferred? survey.json is self-contained but pollutes structured data; separate file is cleaner but adds file dependency
   - Recommendation: Use both - write `surveyor_notes` summary to survey.json for portability, write detailed `surveyor-context.md` for engineer consumption. This provides both self-contained survey and detailed handoff.

2. **Minimum Completeness for Mode Switch**
   - What we know: Engineer requires Phases 1-3 minimum (project, actors, walkthroughs)
   - What's unclear: Should surveyor block mode switch if Phases 1-3 incomplete?
   - Recommendation: If minimum not met, offer mode switch but warn: "Survey is incomplete (only Phase [X] captured). Engineer analysis will have limited accuracy. Continue anyway? (y/N)". User decides.

3. **Survey Resume After Engineer**
   - What we know: User can resume survey after engineer completes
   - What's unclear: How to handle state? Does survey-state.md persist? Are cliff offers re-enabled?
   - Recommendation: Preserve survey-state.md with `modeSwitchAt` marker. On resume, continue from last phase. Reset `pendingOffer` but preserve `declinedOffers` count. Offer "Resume survey from Phase [N]? (Y/n)" prompt.

4. **Multiple Mode Switches**
   - What we know: User might switch to engineer, come back, switch again
   - What's unclear: Does context handoff accumulate or reset?
   - Recommendation: Accumulate. Each mode switch appends to surveyor-context.md with new timestamp section. Engineer reads latest section plus accumulated history.

## Sources

### Primary (HIGH confidence)
- Banneker codebase: `templates/agents/banneker-surveyor.md` (Cliff Detection Protocol, lines 342-521)
- Banneker codebase: `lib/cliff-detection.js` (detection function, 48 lines)
- Banneker codebase: `templates/config/cliff-detection-signals.md` (signal list, thresholds)
- Banneker codebase: `templates/commands/banneker-engineer.md` (Task tool invocation pattern)
- Banneker codebase: `schemas/survey.schema.json` (cliff_signals array schema)
- Banneker codebase: `.planning/REQUIREMENTS.md` (ENGINT-03, ENGINT-04 requirements)

### Secondary (MEDIUM confidence)
- Phase 12 Research: `.planning/phases/12-cliff-detection/12-RESEARCH.md` (detection patterns, confirmation flow)
- Phase 11 Research: `.planning/phases/11-engineer-agent-core/11-RESEARCH.md` (engineer invocation, state management)
- Phase 13 Research: `.planning/phases/13-approval-flow/13-RESEARCH.md` (approval flow integration)

### Tertiary (LOW confidence)
- Chatbot best practices for human handoff (2026 search results) - Confirmed by Phase 12 research
- Task tool/Skill tool mechanism - Inferred from existing Banneker command patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase (cliff-detection.js, surveyor.md protocol, engineer.md)
- Architecture: HIGH - Integration patterns derived from existing documented protocols
- Pitfalls: HIGH - Based on Phase 12 research (false positives, context loss) and PITFALLS.md analysis

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, integration of existing components)
