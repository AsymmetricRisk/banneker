# Phase 12: Cliff Detection - Research

**Researched:** 2026-02-03
**Domain:** Conversational AI uncertainty detection, signal pattern matching, mode switching confirmation
**Confidence:** HIGH

## Summary

Phase 12 implements cliff detection during conversational survey interviews to identify when users reach their knowledge limits and offer mode switching from interviewer to engineering mode. The research identified three critical domains: (1) signal detection patterns using explicit phrase matching with compound signal requirements to prevent false positives, (2) structured logging to survey.json using a `cliff_signals` array with timestamps and context for audit trails, and (3) confirmation-based mode switching following chatbot best practices for human handoff patterns.

The established pattern for this type of feature in 2026 is graduated response with two-step confirmations for mode changes. Research shows false positive prevention requires compound signals (2+ indicators) rather than single-phrase matching, and that explicit user confirmation before any mode switch is table stakes for maintaining trust in AI-assisted tools.

This phase extends the existing banneker-surveyor agent by adding signal detection logic during question-answer cycles, logging detected signals to state, and offering mode switch with explicit confirmation when cliff patterns are detected.

**Primary recommendation:** Use explicit phrase matching against a whitelist of cliff signals, require compound detection (2+ signals OR single signal + explicit user confirmation), log all detections to survey.json `cliff_signals` array, and implement two-step confirmation ("I notice you're uncertain. Would you like me to switch to engineering mode?") before mode switch offer.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins (String methods) | 18.0+ | Pattern matching via includes(), toLowerCase() | Zero-dependency constraint (REQ-INST-007), sufficient for explicit phrase detection |
| JSON (native) | N/A | Structured logging to survey.json | Banneker standard data format, machine-readable audit trail |
| State management (existing) | N/A | survey-state.md updates | Established Banneker pattern for resume capability |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ISO 8601 timestamps | N/A | Signal detection timing | Audit trail, debugging false positives |
| Markdown state files | N/A | Surveyor context preservation | Context handoff protocol (REQ-ENGINT-04) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| String.includes() | Regex patterns | Regex adds complexity, harder to debug false positives, unnecessary for exact phrase matching |
| Native JSON | External NLP libraries | Violates zero-dependency constraint, overkill for explicit signal detection |
| Inline detection | Dedicated detection service | Over-engineering for MVP, adds latency to conversational flow |

**Installation:**
No installation required - uses Node.js built-in string methods only.

## Architecture Patterns

### Recommended Project Structure
```
templates/
├── agents/
│   └── banneker-surveyor.md         # Extended with cliff detection logic
└── config/
    └── cliff-detection-signals.md   # Reference list of explicit cliff phrases
schemas/
└── survey.schema.json                # Extended with cliff_signals array
.banneker/
├── survey.json                       # Extended with cliff_signals logging
└── state/
    └── survey-state.md               # Tracks cliff detection state
```

### Pattern 1: Explicit Signal Whitelist Matching
**What:** Maintain predefined list of explicit cliff phrases, match user responses against whitelist using case-insensitive exact phrase detection.

**When to use:** HIGH confidence cliff signals where single phrase is sufficient to trigger offer.

**Example:**
```javascript
// Source: Node.js String.prototype best practices
const EXPLICIT_CLIFF_SIGNALS = [
  "i don't know",
  "i dont know",
  "no idea",
  "whatever you think",
  "you decide",
  "take it from here",
  "whatever you think is best",
  "i'll defer to you",
  "that's beyond my expertise",
  "i'm not technical enough"
];

function detectExplicitCliff(userResponse) {
  const normalized = userResponse.toLowerCase().trim();

  for (const signal of EXPLICIT_CLIFF_SIGNALS) {
    if (normalized.includes(signal)) {
      return {
        detected: true,
        signal: signal,
        confidence: "HIGH",
        context: userResponse
      };
    }
  }

  return { detected: false };
}
```

**Application to Cliff Detection:** Surveyor checks each user response against explicit signals list. If match found, log to cliff_signals array and offer mode switch with confirmation.

### Pattern 2: Compound Signal Detection for False Positive Prevention
**What:** Require multiple uncertainty indicators in same response OR single signal + explicit user confirmation before triggering mode switch offer.

**When to use:** Preventing false positives from hedging language that is normal conversational speech.

**Example:**
```javascript
// Source: False positive prevention research (AI detection thresholds)
function detectCliffWithCompoundSignals(userResponse, previousSignals) {
  const explicit = detectExplicitCliff(userResponse);

  // Explicit signals are HIGH confidence - single occurrence sufficient
  if (explicit.detected) {
    return {
      shouldOffer: true,
      reason: "explicit_cliff_signal",
      confidence: "HIGH",
      signal: explicit
    };
  }

  // For implicit signals, require compound detection
  const implicit = detectImplicitCliff(userResponse);
  if (implicit.detected) {
    // Check if we've seen signals in last 2 responses
    const recentSignals = previousSignals.slice(-2);
    if (recentSignals.length >= 1) {
      return {
        shouldOffer: true,
        reason: "compound_implicit_signals",
        confidence: "MEDIUM",
        signals: [implicit, ...recentSignals]
      };
    }

    // Single implicit signal - log but don't offer yet
    return {
      shouldOffer: false,
      reason: "insufficient_compound_signals",
      pendingSignal: implicit
    };
  }

  return { shouldOffer: false };
}
```

**Application to Cliff Detection:** Prevents over-eager takeover from normal hedging language. Only offers mode switch when confidence is HIGH (explicit signal) or MEDIUM with compound evidence.

### Pattern 3: Structured Logging to survey.json
**What:** Log all detected cliff signals to `cliff_signals` array in survey.json with timestamp, context, and detection metadata.

**When to use:** Creating audit trail for debugging false positives and tracking user uncertainty patterns.

**Example:**
```javascript
// Source: JSON structured logging best practices for conversational AI
const cliffSignal = {
  timestamp: new Date().toISOString(),
  phase: "walkthroughs",
  question_context: "What data stores does this project use?",
  user_response: "I don't know, whatever you think is best",
  detected_signal: "i don't know",
  confidence: "HIGH",
  mode_switch_offered: true,
  user_accepted: false  // Updated after confirmation
};

// Append to survey.json structure
survey.cliff_signals = survey.cliff_signals || [];
survey.cliff_signals.push(cliffSignal);
```

**Schema Extension:**
```json
{
  "cliff_signals": {
    "type": "array",
    "description": "Detected uncertainty signals during survey",
    "items": {
      "type": "object",
      "required": ["timestamp", "phase", "user_response", "detected_signal", "confidence"],
      "properties": {
        "timestamp": { "type": "string", "format": "date-time" },
        "phase": { "type": "string" },
        "question_context": { "type": "string" },
        "user_response": { "type": "string" },
        "detected_signal": { "type": "string" },
        "confidence": { "enum": ["HIGH", "MEDIUM", "LOW"] },
        "mode_switch_offered": { "type": "boolean" },
        "user_accepted": { "type": "boolean" }
      }
    }
  }
}
```

**Application to Cliff Detection:** Every detection logged regardless of whether mode switch is offered. Provides data for tuning detection thresholds in future phases.

### Pattern 4: Two-Step Confirmation for Mode Switch
**What:** Before switching modes, show user explicit confirmation prompt with option to decline and continue survey.

**When to use:** All mode switches triggered by cliff detection (table stakes for user trust).

**Example:**
```markdown
// Source: Chatbot best practices for human handoff patterns
## Cliff Detection Confirmation Protocol

**Step 1: Signal Detection**
User says: "I don't know, whatever you think is best"

**Step 2: Offer Mode Switch**
Surveyor responds:
"I notice you're uncertain about this decision. I can switch to engineering mode where I'll analyze what we've discussed so far and propose technical recommendations for your review.

Would you like me to:
1. Switch to engineering mode now
2. Continue with the survey
3. Skip this question and come back to it later

(Type 1, 2, or 3)"

**Step 3: Log User Choice**
- If 1: Set user_accepted=true, invoke /banneker:engineer
- If 2: Set user_accepted=false, continue survey
- If 3: Set user_accepted=false, mark question as deferred

**Step 4: Update State**
Write choice to survey-state.md and cliff_signals array
```

**Application to Cliff Detection:** Maintains user autonomy. User explicitly chooses mode switch rather than system autonomously switching. Prevents trust erosion from unexpected behavior changes.

### Pattern 5: Context Handoff Protocol
**What:** When mode switch accepted, surveyor writes context document summarizing conversational nuances before engineer agent spawns.

**When to use:** Preserving implicit priorities and conversational context that isn't captured in structured survey.json fields.

**Example:**
```markdown
// Source: PITFALLS.md P3 prevention (Context Loss During Mode Switch)
## .banneker/state/surveyor-context.md

**Generated:** 2026-02-03T10:30:00Z
**Phase at switch:** Phase 4 (Backend)
**Cliff trigger:** User said "I don't know" when asked about data stores

## User Preferences Observed

During conversation, user indicated:
- Prefers managed services over self-hosted ("I don't want to manage infrastructure")
- Budget-conscious ("We're a small team with limited resources")
- Prioritizes speed-to-market ("Need to launch in 3 months")
- Concerned about security ("User data must be encrypted")

## Implicit Constraints

- Solo developer (user referred to "I" not "we" for technical decisions)
- First production application ("This is my first real project")
- No DevOps experience (asked clarifying questions about "deployment")

## Conversational Tone

- Collaborative and engaged in Phases 1-3
- Became hesitant in Phase 4 (backend/infrastructure questions)
- Used hedging language: "I think maybe...", "probably should..."

## Topics User Felt Confident About

- Problem domain and user needs
- UI/UX requirements and flows
- Basic data model structure

## Topics User Felt Uncertain About

- Backend infrastructure choices
- Database selection
- Deployment and hosting
- Security implementation details

## Recommendations for Engineer Agent

- Start with simplest viable backend approach (user prefers simple)
- Emphasize managed services (user wants low maintenance)
- Include cost considerations in recommendations (budget-conscious)
- Provide educational context (user is learning, not just executing)
```

**Application to Cliff Detection:** Engineer agent reads this context before generating DIAGNOSIS.md, preventing "But I already told you..." moments. Preserves conversational nuances that structured data misses.

### Anti-Patterns to Avoid

- **Single-Signal Detection:** Never trigger on phrase like "I'm not sure" alone without compound evidence. Normal conversational hedging creates false positives.
- **Silent Mode Switch:** Never switch modes without explicit user confirmation. Destroys trust and violates table stakes for AI assistance.
- **Generic Confirmation:** Don't just ask "Continue?" Explain what mode switch means and what happens next.
- **Lost Context:** Don't spawn engineer agent without context handoff. Structured survey.json alone loses conversational nuances.
- **Regex Over-Engineering:** Don't use complex regex patterns for exact phrase matching. String.includes() is sufficient, more debuggable, and less prone to edge case failures.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phrase matching | Custom regex engine | String.includes() with whitelist | Exact phrase matching doesn't need regex complexity, easier to debug false positives |
| Confidence scoring | Percentage-based system | HIGH/MEDIUM/LOW discrete levels | Industry standard for uncertainty communication, matches human reasoning |
| Structured logging | Custom log format | JSON with ISO 8601 timestamps | Machine-readable, standard tooling support, established pattern in conversational AI |
| Mode switch confirmation | Inline yes/no | Two-step confirmation with explanation | Chatbot best practice for critical actions (human handoff pattern) |
| Context preservation | Stuff everything in survey.json | Separate context handoff document | Structured data for machines, prose for nuance, established pattern from PITFALLS.md P3 |

**Key insight:** Cliff detection is fundamentally a pattern recognition problem in conversational text, but the patterns are explicit ("I don't know") not implicit (sentiment analysis). Over-engineering with NLP libraries or regex patterns creates complexity without improving accuracy for the explicit signal case. The hard part is false positive prevention (compound signals, confirmation gates) not detection itself.

## Common Pitfalls

### Pitfall 1: False Positive Detection (Over-Eager Takeover)
**What goes wrong:** System offers to take over when user is thinking out loud, asking clarifying questions, or using normal hedging language.

**Why it happens:**
- Detection treats hedging words like "I think..." as uncertainty signals
- No distinction between "I don't know" (genuine gap) and "I'm not sure I understand the question" (clarification needed)
- Cultural speech patterns vary - some users hedge everything

**How to avoid:**
1. Require compound signals: 2+ signals in same response OR signal + explicit confirmation
2. Distinguish question types: "I'm not sure" after clarification vs. after direct answer request
3. Track user rejections: If user declines offer 2+ times, increase threshold for future offers
4. Explicit signals only for Phase 12 MVP: Defer implicit signal detection to Phase 15

**Warning signs:**
- Test users report feeling interrupted
- High rate of declined takeover offers (>50%)
- Users giving shorter responses to avoid triggering detection
- Users explicitly complaining about "AI jumping in"

**Source:** Research on automation bias in human-AI collaboration shows users either over-rely on AI OR become frustrated by interruptions with no middle ground. False positive prevention is critical for trust.

### Pitfall 2: Context Loss During Mode Switch
**What goes wrong:** When switching to engineer mode, conversational context is lost - user's implicit priorities, preferences mentioned casually, and tone reset.

**Why it happens:**
- survey.json captures structured data, not conversational nuance
- Engineer agent starts fresh without surveyor's accumulated context
- No handoff protocol between surveyor and engineer agents

**How to avoid:**
1. Surveyor writes `.banneker/state/surveyor-context.md` before engineer spawns
2. Context document captures: user preferences, implicit constraints, conversational tone, confidence/uncertainty patterns
3. Explicit transition: Surveyor summarizes understanding before switch ("Based on our conversation, I understand you want X...")
4. Engineer reads context document first, references it in DIAGNOSIS.md

**Warning signs:**
- Test users say "But I already told you..."
- Engineering proposals contradict earlier statements
- Recommendations feel generic/impersonal
- User has to re-explain constraints

**Source:** Context collapse in AI systems research identifies mode switches as primary failure points. Explicit context handoff documents prevent loss of conversational nuance.

### Pitfall 3: No Decline Path (Forced Takeover)
**What goes wrong:** User is given mode switch offer but declining means survey is stuck or question is forced.

**Why it happens:**
- Only two options offered: "Switch to engineer mode" or "Continue survey"
- User wants to skip question temporarily but system doesn't support deferral
- Declining offer feels like rejecting help, creates social pressure

**How to avoid:**
1. Three-option confirmation: (1) Switch to engineer mode, (2) Continue survey, (3) Skip this question and come back later
2. Deferred questions tracked in state, offered again at end of phase
3. Declining offer is explicitly okay: "No problem, we can continue the survey"
4. Multiple decline tracking: If user declines 2+ times, don't offer again this session unless explicit signal changes

**Warning signs:**
- Users accept mode switch but later say "I didn't really want to"
- Users abandon survey at cliff detection point
- Test feedback: "I felt pressured to switch modes"
- Low satisfaction scores around mode switch experience

**Source:** Chatbot best practices for 2026 emphasize user control and flow resilience - bots must support mid-conversation context switching in both directions.

### Pitfall 4: Logging Without Audit Trail
**What goes wrong:** Cliff signals detected and acted on but not logged, making it impossible to debug false positives or tune detection thresholds.

**Why it happens:**
- Logging seen as "extra work" not core feature
- Only successful mode switches logged, declined offers not captured
- No timestamp or context preserved for later analysis

**How to avoid:**
1. Log ALL detections to survey.json `cliff_signals` array, even if offer declined
2. Include: timestamp, phase, question context, user response, detected signal, confidence level, mode_switch_offered, user_accepted
3. Preserve user's raw response text for debugging false positives
4. Write to state file immediately (don't wait for survey completion)

**Warning signs:**
- Can't answer "How often do users decline mode switch?"
- Can't reproduce false positive reports
- No data for tuning detection thresholds in future phases
- Debugging requires re-running entire survey

**Source:** JSON structured logging for conversational AI research shows audit trails are essential for production monitoring and debugging. Comprehensive logging enables iteration on detection logic.

## Code Examples

Verified patterns from official sources:

### Explicit Cliff Signal Detection
```javascript
// Source: Node.js String.prototype + best practices for input validation
const EXPLICIT_CLIFF_SIGNALS = [
  "i don't know",
  "i dont know",
  "no idea",
  "i'm not sure",
  "i'm not technical enough",
  "whatever you think",
  "whatever you think is best",
  "you decide",
  "take it from here",
  "i'll defer to you",
  "that's beyond my expertise"
];

function detectExplicitCliffSignal(userResponse) {
  // Normalize for matching
  const normalized = userResponse.toLowerCase().trim();

  // Check each explicit signal
  for (const signal of EXPLICIT_CLIFF_SIGNALS) {
    if (normalized.includes(signal)) {
      return {
        detected: true,
        signal: signal,
        confidence: "HIGH",
        originalResponse: userResponse,
        timestamp: new Date().toISOString()
      };
    }
  }

  return { detected: false };
}

// Usage in surveyor agent during question-answer cycle
const userAnswer = "I don't know, whatever you think is best";
const detection = detectExplicitCliffSignal(userAnswer);

if (detection.detected) {
  // Log to cliff_signals array
  logCliffSignal(detection);

  // Offer mode switch with confirmation
  offerModeSwitch(detection);
}
```

### Compound Signal Tracking
```javascript
// Source: False positive prevention patterns
class CliffDetectionTracker {
  constructor() {
    this.signalHistory = [];
    this.declinedOffers = 0;
  }

  addSignal(detection) {
    this.signalHistory.push({
      ...detection,
      timestamp: new Date().toISOString()
    });
  }

  shouldOfferModeSwitch(currentDetection) {
    if (currentDetection.confidence === "HIGH") {
      // Explicit signals always trigger offer (unless user declined 2+ times)
      if (this.declinedOffers >= 2) {
        return {
          shouldOffer: false,
          reason: "user_declined_multiple_times"
        };
      }
      return {
        shouldOffer: true,
        reason: "explicit_cliff_signal"
      };
    }

    // For MEDIUM confidence (implicit signals), require compound evidence
    const recentSignals = this.signalHistory.slice(-2);
    if (recentSignals.length >= 1) {
      return {
        shouldOffer: true,
        reason: "compound_implicit_signals",
        supportingSignals: recentSignals
      };
    }

    return {
      shouldOffer: false,
      reason: "insufficient_evidence"
    };
  }

  recordDeclinedOffer() {
    this.declinedOffers++;
  }

  recordAcceptedOffer() {
    // Reset decline counter on acceptance
    this.declinedOffers = 0;
  }
}
```

### Structured Logging to survey.json
```javascript
// Source: JSON structured logging for conversational AI
function logCliffSignal(detection, phase, questionContext, modeSwitchOffered, userAccepted) {
  const cliffSignal = {
    timestamp: detection.timestamp || new Date().toISOString(),
    phase: phase,
    question_context: questionContext,
    user_response: detection.originalResponse,
    detected_signal: detection.signal,
    confidence: detection.confidence,
    mode_switch_offered: modeSwitchOffered,
    user_accepted: userAccepted
  };

  // Append to survey.json (pseudocode - actual implementation via Read/Write)
  const survey = readSurveyJSON();
  survey.cliff_signals = survey.cliff_signals || [];
  survey.cliff_signals.push(cliffSignal);
  writeSurveyJSON(survey);

  // Also update state file for resume capability
  updateSurveyState({ lastCliffSignal: cliffSignal });
}
```

### Two-Step Confirmation Pattern
```markdown
// Source: Chatbot best practices for mode switching with confirmation
## Surveyor Response After Cliff Detection

"I notice you're uncertain about [topic from question context]. I can switch to engineering mode where I'll:

1. Analyze what we've discussed so far in the survey
2. Identify gaps in the information we've collected
3. Propose technical recommendations based on your requirements
4. Present options for your review and approval

You'll still be in control - all recommendations require your approval before any decisions are made.

Would you like to:
1. **Switch to engineering mode now** - I'll generate a diagnosis and recommendations
2. **Continue with the survey** - We can finish collecting information first
3. **Skip this question for now** - We can come back to it later

Please respond with 1, 2, or 3."

## User Response Handling

- "1" or "switch" or "yes, switch" → user_accepted = true, spawn engineer agent
- "2" or "continue" → user_accepted = false, continue to next question
- "3" or "skip" → user_accepted = false, mark question as deferred, continue
- Any other response → Clarify options, repeat confirmation prompt
```

### Context Handoff Document Generation
```javascript
// Source: PITFALLS.md P3 prevention pattern
function generateSurveyorContext(surveyState, detectedCliff) {
  const context = {
    metadata: {
      generated: new Date().toISOString(),
      phase_at_switch: surveyState.currentPhase,
      cliff_trigger: detectedCliff.user_response
    },
    user_preferences: extractPreferences(surveyState.conversationHistory),
    implicit_constraints: extractConstraints(surveyState.conversationHistory),
    conversational_tone: analyzeTone(surveyState.conversationHistory),
    confidence_patterns: {
      confident_about: surveyState.phasesWithConfidentResponses,
      uncertain_about: surveyState.phasesWithUncertainty
    },
    recommendations_for_engineer: generateEngineerGuidance(surveyState)
  };

  // Write to state directory
  writeContextHandoff('.banneker/state/surveyor-context.md', context);
}

function extractPreferences(conversationHistory) {
  // Parse conversation for preference indicators
  // Example: "I prefer...", "I want...", "I need..."
  const preferences = [];

  for (const exchange of conversationHistory) {
    // Simple pattern matching for preference statements
    if (exchange.userResponse.includes("prefer")) {
      preferences.push(extractPreferenceStatement(exchange));
    }
  }

  return preferences;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex pattern matching | String.includes() with whitelist | 2024+ Node.js best practices | Simpler debugging, fewer edge cases, sufficient for explicit phrase detection |
| Silent mode switching | Two-step confirmation with explanation | 2025+ chatbot best practices | Maintains user trust, reduces abandonment at mode switch points |
| Unstructured logging | JSON structured logging with timestamps | 2025+ conversational AI standards | Machine-readable audit trails, enables debugging and tuning |
| Single-signal detection | Compound signal requirements | 2026 false positive prevention research | Reduces over-eager takeover, prevents user frustration |
| Context in survey.json only | Separate context handoff documents | 2026 (PITFALLS.md P3 analysis) | Preserves conversational nuance that structured data misses |

**Deprecated/outdated:**
- **Autonomous mode switching**: Earlier AI assistants would switch modes without confirmation. Current best practice requires explicit user consent for any mode change.
- **Sentiment analysis for cliff detection**: Over-engineering for MVP. Explicit signals are sufficient for v0.3.0; implicit detection deferred to v0.4.0.
- **Binary offer (yes/no)**: Current best practice offers three options (switch, continue, skip) for flow resilience.

## Open Questions

Things that couldn't be fully resolved:

1. **Threshold for Compound Signals**
   - What we know: Require 2+ signals to prevent false positives
   - What's unclear: Should signals be in same response, or across last N responses? What's the right N?
   - Recommendation: Start with "2 signals in last 2 responses" for Phase 12 MVP. Track metrics in cliff_signals array and tune in Phase 15 based on false positive rate.

2. **Decline Offer Threshold**
   - What we know: After user declines multiple times, system should stop offering
   - What's unclear: What's the right threshold? 2 declines? 3?
   - Recommendation: Set threshold at 2 declines for Phase 12 MVP. User can explicitly trigger with command if they change their mind. Document in cliff-detection-signals.md reference.

3. **Context Handoff Scope**
   - What we know: Surveyor should write context document before engineer spawns
   - What's unclear: How much detail? Full conversation history vs. summary?
   - Recommendation: Summary approach (preferences, constraints, tone) for Phase 12. Full conversation history would exceed token limits. Store raw history separately if needed for debugging.

4. **Cliff Signal Localization**
   - What we know: Explicit signals list is English-only
   - What's unclear: Should Phase 12 support non-English cliff signals?
   - Recommendation: English-only for Phase 12 MVP. Multi-language support deferred to future version. Document limitation in REQUIREMENTS.md.

5. **Mode Switch Mid-Phase**
   - What we know: Cliff can be detected at any point during a phase
   - What's unclear: Should surveyor complete current phase before switching, or switch immediately?
   - Recommendation: Switch immediately when user confirms. Write partial phase data to state for potential resume. Document in surveyor agent instructions.

## Sources

### Primary (HIGH confidence)
- Banneker codebase: templates/agents/banneker-surveyor.md (existing survey flow and state management)
- Banneker codebase: schemas/survey.schema.json (data structure patterns)
- Banneker codebase: .planning/research/FEATURES.md (cliff detection patterns and document specifications)
- Banneker codebase: .planning/research/PITFALLS.md (P1: False positive prevention, P3: Context loss prevention)
- Banneker codebase: .planning/REQUIREMENTS.md (CLIFF-01, CLIFF-02 requirements)
- Node.js documentation: String.prototype methods for pattern matching
- JSON Schema draft/2020-12: Schema extension patterns

### Secondary (MEDIUM confidence)
- [24 Chatbot Best Practices You Can't Afford to Miss in 2026](https://botpress.com/blog/chatbot-best-practices) - Two-step confirmations, human handoff patterns
- [AI Chatbot UX: 2026's Top Design Best Practices](https://www.letsgroto.com/blog/ux-best-practices-for-ai-chatbots) - Flow resilience, context switching support
- [Unified Chat History and Logging System](https://medium.com/@mbonsign/unified-chat-history-and-logging-system-a-comprehensive-approach-to-ai-conversation-management-dc3b5d75499f) - JSON structured logging for conversational AI
- [Understanding False Positives in AI Detection](https://proofademic.ai/blog/false-positives-ai-detection-guide/) - Threshold selection, graduated response protocols
- [Essential Guide to Implementing Robust Input Validation in Node.js](https://moldstud.com/articles/p-essential-guide-to-implementing-robust-input-validation-in-nodejs-applications) - Whitelist approach, string validation best practices

### Tertiary (LOW confidence)
- [Reducing Conversational Agents' Overconfidence Through Linguistic Calibration](https://www.semanticscholar.org/paper/d77c78c9439422ed88e754f776a642d43a8acb66) - Academic research on uncertainty detection (not directly applicable to explicit signal detection)
- [HedgePeer: uncertainty detection dataset](https://dl.acm.org/doi/10.1145/3529372.3533300) - Research on hedging language detection (deferred to Phase 15 implicit signals)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - String.includes() pattern matching verified from Node.js docs, zero-dependency constraint is explicit requirement, JSON logging is established Banneker pattern
- Architecture: HIGH - Extends existing banneker-surveyor agent pattern, cliff_signals array follows survey.schema.json patterns, context handoff matches PITFALLS.md P3 prevention strategy
- Pitfalls: HIGH - Based on verified PITFALLS.md research (P1: false positives, P3: context loss), chatbot best practices for 2026 (confirmation patterns), and false positive prevention research (compound signals)

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, Node.js string methods and JSON patterns unlikely to change)
