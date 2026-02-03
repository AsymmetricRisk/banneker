# Technology Stack: /banneker:engineer Command

**Project:** Banneker — Auto-Engineering Feature
**Researched:** 2026-02-03
**Constraint:** Zero runtime dependencies (Node.js built-ins only)

---

## Executive Summary

The `/banneker:engineer` command needs to detect "knowledge cliffs" during surveys, synthesize technical decisions from partial data, and produce three new document types (DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md). This research evaluates approaches that fit within Banneker's existing architecture: markdown-based agent definitions, JSON data files, and Node.js built-ins only.

**Recommendation:** Use rule-based cliff detection with structured signals embedded in survey.json, extend the existing banneker-writer agent pattern for document generation, and add a new banneker-engineer orchestrator agent. No new dependencies required.

---

## Stack Context: What Already Exists

Before recommending additions, here is what the milestone inherits:

| Layer | Current Implementation | Relevant For |
|-------|----------------------|--------------|
| Agent runtime | Claude Code Task tool spawns agents from `.md` files | New agent orchestration |
| Data format | JSON (`survey.json`, `architecture-decisions.json`) | Signal storage |
| Document generation | banneker-writer agent with term registry | Output document writing |
| Validation | Placeholder check, term consistency, DEC-XXX citation | Quality gates |
| State management | Markdown state files in `.banneker/state/` | Resume capability |
| Orchestration | banneker-architect coordinates multi-wave generation | Pattern for engineer command |

**Key constraint:** No npm dependencies at runtime. All processing happens via LLM capabilities (text analysis, pattern matching, synthesis) plus Node.js built-ins (fs, path, JSON).

---

## Decision 1: Knowledge Cliff Detection Approach

### Question

How should the system detect when a user hits a "knowledge cliff" — a point where they lack the technical knowledge to answer a survey question confidently?

### Recommended: Rule-Based Signal Detection

**Pattern:** Detect cliff signals from survey response patterns, not NLP sentiment analysis.

**Why rule-based over NLP:**
1. **Zero dependencies** — No external libraries needed
2. **Deterministic** — Same input always produces same signals
3. **Transparent** — Users can understand why something was flagged
4. **LLM-compatible** — The agent's language model provides the "NLP" layer naturally
5. **Fits existing patterns** — Banneker already uses rule-based signal detection in the architect (see `document-catalog.md` conditional rules)

**Cliff signal categories to detect:**

| Signal Type | Detection Pattern | Example |
|-------------|-------------------|---------|
| Explicit uncertainty | Response contains "I don't know", "not sure", "maybe", "I think" | "I think we need a database but I'm not sure which one" |
| Deferred decision | Response contains "later", "decide later", "figure out", "TBD" | "We'll figure out authentication later" |
| Missing rationale | Architecture decision without alternatives_considered | DEC with empty alternatives array |
| Scope avoidance | Backend phase marked N/A when walkthroughs mention data persistence | User says "frontend-only" but walkthrough mentions "saves to server" |
| Terminology confusion | Inconsistent naming within single response | "The database... I mean the server... or whatever stores the data" |
| Copy-paste answers | Response matches common boilerplate | "We'll use industry best practices" |

**Implementation approach:**

```javascript
// In banneker-surveyor during Phase 6 (Decision Gate) or as post-processing
const cliffSignals = {
  explicit_uncertainty: [],
  deferred_decisions: [],
  missing_rationale: [],
  scope_contradictions: [],
  terminology_gaps: []
};

// Example: Detect explicit uncertainty in walkthroughs
survey.walkthroughs.forEach((wt, index) => {
  wt.steps.forEach((step, stepIndex) => {
    if (containsUncertaintyMarkers(step.action) ||
        containsUncertaintyMarkers(step.system_response)) {
      cliffSignals.explicit_uncertainty.push({
        location: `walkthroughs[${index}].steps[${stepIndex}]`,
        text: step.action,
        marker: findUncertaintyMarker(step.action)
      });
    }
  });
});

function containsUncertaintyMarkers(text) {
  const markers = [
    /\bi don't know\b/i,
    /\bnot sure\b/i,
    /\bmaybe\b/i,
    /\bi think\b/i,
    /\bprobably\b/i,
    /\bsomehow\b/i,
    /\bsomething like\b/i,
    /\bwhatever\b/i,
    /\bfigure.{0,10}out\b/i,
    /\bdecide later\b/i,
    /\bTBD\b/i
  ];
  return markers.some(m => m.test(text));
}
```

**Storage location:** Add `cliff_signals` object to `survey.json` after decision gate phase.

```json
{
  "cliff_signals": {
    "detected_at": "2026-02-03T15:30:00Z",
    "total_signals": 7,
    "by_category": {
      "explicit_uncertainty": [
        {"location": "walkthroughs[0].steps[3]", "text": "...", "severity": "medium"}
      ],
      "deferred_decisions": [...],
      "missing_rationale": [...],
      "scope_contradictions": [...]
    },
    "severity_summary": {"high": 2, "medium": 3, "low": 2}
  }
}
```

### Alternative Considered: LLM-as-Analyzer

Use the agent's LLM capabilities to classify uncertainty in free text.

**Pros:**
- More nuanced detection
- Can catch implicit uncertainty that rules miss

**Cons:**
- Non-deterministic (same input may produce different signals)
- Harder to test
- May over-detect (false positives)

**Verdict:** Don't use pure LLM analysis. However, the rule-based approach can be supplemented by the agent noting signals during the interview conversation naturally. The surveyor already has conversational context — it can add a `surveyor_notes` field when it observes confusion.

---

## Decision 2: Signal Collection Timing

### Question

When should cliff signals be detected — during the survey, after the survey, or both?

### Recommended: During + Post-Processing

**Phase 1: During Survey (Real-time)**

The banneker-surveyor agent already conducts a conversational interview. Extend it to note cliff signals in real-time:

```markdown
## Cliff Signal Detection (Addition to banneker-surveyor.md)

During the interview, watch for these patterns:

1. **User expresses uncertainty:** Note in state file under `cliff_signals`
2. **User defers decision:** Ask clarifying question, if still deferred, note signal
3. **User gives contradictory information:** Note contradiction for later analysis
4. **User struggles with terminology:** Offer definitions, note if accepted/rejected

**After each phase:** Update `.banneker/state/survey-state.md` with:
- Cliff signals observed this phase
- Confidence level for this phase (high/medium/low)
- Topics that need follow-up
```

**Phase 2: Post-Processing (Completeness Check)**

After survey completes, run a second pass to detect signals the surveyor might have missed:

- Decisions without alternatives_considered
- Walkthroughs with missing error_cases
- Backend section marked N/A but walkthroughs imply data persistence
- rubric_coverage items marked "partial" or "missing"

**Rationale:** Real-time detection catches conversational signals. Post-processing catches structural omissions. Both are needed for comprehensive coverage.

---

## Decision 3: Document Generation Approach

### Question

How should DIAGNOSIS.md, RECOMMENDATION.md, and ENGINEERING-PROPOSAL.md be generated?

### Recommended: Extend banneker-writer Pattern

The existing banneker-writer agent already generates 10 document types from survey data. Extend this pattern:

**New documents spec:**

| Document | Purpose | Inputs | Trigger |
|----------|---------|--------|---------|
| DIAGNOSIS.md | Summarize cliff signals and their implications | survey.json (with cliff_signals), architecture-decisions.json | cliff_signals.total_signals > 0 |
| RECOMMENDATION.md | Specific, actionable recommendations to resolve cliffs | DIAGNOSIS.md, survey.json, decisions | Always (if DIAGNOSIS generated) |
| ENGINEERING-PROPOSAL.md | Synthesized technical decisions for gaps | survey.json, decisions, recommendations | cliff_signals.deferred_decisions.length > 0 |

**Why extend writer, not new agent:**

1. **Consistency** — Same term registry enforcement, placeholder validation, DEC-XXX citation rules
2. **Reuse** — banneker-writer already handles survey data extraction, section generation
3. **Integration** — Outputs go to same `.banneker/documents/` location
4. **Testing** — Same validation gates apply

**Writer extension:**

Add to `document-catalog.md`:

```markdown
## DIAGNOSIS.md (Conditional)

**Trigger:** `survey.cliff_signals.total_signals > 0`

**Sections:**
1. Executive Summary — How many signals, severity distribution
2. Cliff Analysis — By category with specific locations in survey
3. Impact Assessment — What can't be built without resolving these
4. Recommended Actions — High-level next steps

**Tone:** Diagnostic, non-judgmental. "The survey identified X areas where technical decisions are needed."

## RECOMMENDATION.md (Conditional)

**Trigger:** DIAGNOSIS.md generated

**Sections:**
1. Priority Order — Which cliffs to address first
2. For each cliff:
   - Context (what was said in survey)
   - Options (3-5 concrete technical choices)
   - Tradeoffs table
   - Suggested choice with rationale
3. Implementation Order — Dependency-aware sequencing

**Tone:** Consultative. "Based on your project type, consider X because Y."

## ENGINEERING-PROPOSAL.md (Conditional)

**Trigger:** `survey.cliff_signals.deferred_decisions.length > 0`

**Sections:**
1. Proposed Technical Stack — Concrete technology choices for deferred decisions
2. Architecture Decisions — New DEC-XXX entries for gaps
3. Implementation Approach — Phase structure for proposed additions
4. Validation Criteria — How to know if proposal is right

**Tone:** Prescriptive. "This proposal assumes X, Y, Z. Implementation would require..."
```

---

## Decision 4: Orchestration Architecture

### Question

Should /banneker:engineer be a new command with a new agent, or extend existing commands?

### Recommended: New Orchestrator Agent

**Pattern:** `banneker-engineer.md` orchestrator that:
1. Checks for cliff signals in survey.json
2. Spawns banneker-writer for DIAGNOSIS.md
3. Spawns banneker-writer for RECOMMENDATION.md
4. Spawns banneker-writer for ENGINEERING-PROPOSAL.md
5. Validates all outputs
6. Reports completion

**Why new agent (not extend architect):**

1. **Different purpose** — Architect generates planning docs; Engineer synthesizes missing decisions
2. **Different trigger** — Architect runs on complete surveys; Engineer runs on surveys with gaps
3. **Optional** — Not all surveys need engineering; architect is always needed
4. **User intent** — `/banneker:engineer` communicates "help me figure this out" vs `/banneker:architect` "generate docs"

**Agent file structure:**

```
templates/
  commands/
    banneker-engineer.md       # User-facing command definition
  agents/
    banneker-engineer.md       # Orchestrator agent (spawns writer)
  config/
    diagnosis-catalog.md       # Cliff signal definitions and severity rules
```

**Command file:**

```markdown
---
name: banneker-engineer
description: "Analyze survey for knowledge cliffs and generate technical recommendations. Produces DIAGNOSIS.md, RECOMMENDATION.md, and ENGINEERING-PROPOSAL.md."
---

# banneker-engineer

Spawn the engineer agent to analyze knowledge cliffs in the completed survey.

## Prerequisites

- `.banneker/survey.json` must exist
- Survey should have `cliff_signals` populated (added during Phase 6)

## Behavior

1. Read survey.json and architecture-decisions.json
2. If no cliff_signals or total_signals = 0:
   - Report "No knowledge cliffs detected. Survey is complete."
   - Suggest running /banneker:architect instead
3. If cliff_signals exist:
   - Spawn engineer agent for analysis and document generation
   - Report completion with document list
```

---

## Decision 5: Integration with Survey Pipeline

### Question

How should cliff detection integrate with the existing 6-phase survey?

### Recommended: Enhance Phase 6 (Decision Gate)

**Current Phase 6 behavior:**
- Review all phases for architecture decisions
- Create DEC-XXX records
- User confirms decision log is complete

**Enhanced Phase 6 behavior:**
1. Review all phases for architecture decisions (unchanged)
2. **NEW:** Scan all phases for cliff signals
3. **NEW:** Flag deferred decisions as explicit entries
4. Create DEC-XXX records with optional `status: "deferred"` field
5. **NEW:** Populate `cliff_signals` object in survey.json
6. User confirms decision log is complete
7. **NEW:** If cliff signals detected, suggest running `/banneker:engineer`

**Survey completion message (enhanced):**

```
Survey complete!

Files written:
- .banneker/survey.json (4 actors, 2 walkthroughs, 9 decisions)
- .banneker/architecture-decisions.json

Knowledge Cliff Analysis:
- 3 explicit uncertainties detected
- 2 decisions marked as deferred
- 1 scope contradiction identified

Recommended next step:
  Run /banneker:engineer to generate technical recommendations
  OR
  Run /banneker:architect to proceed with current survey state
```

---

## Decision 6: What NOT to Add

### DO NOT add external NLP libraries

**Temptation:** Use sentiment analysis library to detect uncertainty.

**Why not:**
- Violates zero-dependency constraint
- Adds complexity without proportional benefit
- Rule-based approach is sufficient for this domain

### DO NOT add a database

**Temptation:** Store cliff signals separately from survey.json.

**Why not:**
- Violates single-file-per-artifact principle
- Adds operational complexity
- survey.json already supports nested objects

### DO NOT create a separate cliff-analysis pass

**Temptation:** Run `/banneker:analyze-cliffs` as separate command before `/banneker:engineer`.

**Why not:**
- Adds user friction
- Cliff detection should be automatic during survey
- Engineer command should handle analysis internally

### DO NOT over-engineer severity scoring

**Temptation:** Add weighted scoring algorithm for cliff severity.

**Why not:**
- Simple high/medium/low is sufficient for MVP
- Users don't need numeric scores, they need actionable recommendations
- Can add sophistication later if needed

---

## Implementation Checklist

### Files to Create

| File | Purpose |
|------|---------|
| `templates/commands/banneker-engineer.md` | User command definition |
| `templates/agents/banneker-engineer.md` | Orchestrator agent |
| `templates/config/diagnosis-catalog.md` | Cliff signal definitions |

### Files to Modify

| File | Changes |
|------|---------|
| `templates/agents/banneker-surveyor.md` | Add cliff signal detection during Phase 6 |
| `templates/config/document-catalog.md` | Add DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md specs |
| `templates/agents/banneker-writer.md` | Add generation guidance for 3 new document types |

### survey.json Schema Extension

```json
{
  "cliff_signals": {
    "detected_at": "ISO8601",
    "total_signals": "number",
    "by_category": {
      "explicit_uncertainty": ["CliffSignal[]"],
      "deferred_decisions": ["CliffSignal[]"],
      "missing_rationale": ["CliffSignal[]"],
      "scope_contradictions": ["CliffSignal[]"],
      "terminology_gaps": ["CliffSignal[]"]
    },
    "severity_summary": {
      "high": "number",
      "medium": "number",
      "low": "number"
    }
  }
}
```

### CliffSignal Object

```json
{
  "location": "string (JSON path in survey)",
  "text": "string (relevant excerpt)",
  "marker": "string (what triggered detection)",
  "severity": "high | medium | low",
  "category": "string (signal type)"
}
```

---

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Rule-based cliff detection | HIGH | Matches existing patterns in Banneker, no dependencies |
| During + post-processing timing | HIGH | Covers conversational and structural signals |
| Extend banneker-writer | HIGH | Proven pattern, validates consistency |
| New orchestrator agent | HIGH | Clean separation of concerns |
| Phase 6 integration | HIGH | Minimal disruption to existing survey flow |
| Avoid external dependencies | HIGH | Constraint is explicit in project context |

---

## Sources

- Existing codebase analysis: `templates/agents/banneker-*.md`
- Survey data structure: `.banneker/survey.json`
- Document generation patterns: `templates/config/document-catalog.md`
- Completeness rubric patterns: `templates/config/completeness-rubric.md`

No external sources required — all recommendations are based on extending proven patterns within the existing Banneker architecture.
