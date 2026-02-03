# Project Research Summary

**Project:** Banneker v0.3.0 — /banneker:engineer Command
**Domain:** AI-assisted technical decision-making, interview-to-engineering mode transition
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

The `/banneker:engineer` command addresses a fundamental gap in AI-assisted discovery: users often know what they want but not how to build it. When users reach their knowledge limits during surveys ("I don't know", "whatever you think", "take it from here"), the system should shift from questioning mode to proposing mode. Research across all dimensions converges on a clear recommendation: build a new orchestrator agent (banneker-engineer) that operates downstream of the surveyor, producing three structured documents (DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md) that require explicit user approval before decisions merge into architecture-decisions.json.

The recommended approach leverages Banneker's existing patterns: rule-based signal detection (matching the architect's conditional rules), extending banneker-writer for document generation (ensuring term consistency and placeholder validation), and state-file-based resume capability. All research confirms this can be achieved with zero new dependencies — the LLM provides the synthesis capability, while Node.js built-ins handle data persistence. The architecture research is particularly strong, based on direct codebase analysis of existing patterns.

The primary risks are trust-related: false positive cliff detection that patronizes capable users (CRITICAL), over-engineered proposals that inflate complexity beyond project needs (CRITICAL), and context loss during the surveyor-to-engineer handoff (CRITICAL). Mitigation requires compound signal detection (never trigger on single markers), explicit complexity ceilings tied to project constraints, and a structured context handoff protocol. The research uniformly recommends explicit confidence markers on all recommendations — silent certainty is identified as a major failure mode.

## Key Findings

### Recommended Stack

No new dependencies required. The `/banneker:engineer` command extends existing Banneker patterns using Node.js built-ins only.

**Core technologies:**
- **Rule-based cliff detection**: Pattern matching on survey responses — deterministic, transparent, testable
- **JSON signal storage**: Add `cliff_signals` object to survey.json — fits existing single-file-per-artifact principle
- **Agent orchestration via Task tool**: New banneker-engineer spawns banneker-writer for each document — proven pattern from banneker-architect
- **Markdown state files**: `engineer-state.md` tracks document generation progress — enables resume on context exhaustion

**Critical constraint upheld:** Zero runtime dependencies. All synthesis happens via LLM capabilities; all persistence via fs/JSON.

### Expected Features

**Must have (table stakes):**
- Cliff detection during survey — system should recognize when users are stuck without requiring explicit help requests
- Explicit takeover offer — users must consent before AI makes decisions for them
- DIAGNOSIS.md output — show what the system knows before proposing solutions
- RECOMMENDATION.md output — options analysis with tradeoffs, not mandates
- ENGINEERING-PROPOSAL.md output — concrete decisions in DEC-XXX format
- Approval workflow before execution — never modify architecture-decisions.json without explicit consent
- Works with partial survey data — cliff can occur mid-interview
- Standalone invocation — `/banneker:engineer` as independent command for post-survey use
- Transparent reasoning — show WHY recommendations are made

**Should have (differentiators):**
- Conversational cliff detection (hedging language, not just explicit "I don't know")
- Confidence ratings per recommendation (HIGH/MEDIUM/LOW)
- Integration with existing DEC-XXX decisions (avoid contradictions)
- Edit-before-approve workflow

**Defer to v2+:**
- Research-on-demand (WebSearch integration for current tech info)
- Graduated autonomy levels (assist/propose/decide modes)
- Domain-specific templates (different structures per project type)

### Architecture Approach

The engineer command integrates at two points: mid-survey cliff detection as optional takeover, and post-survey standalone invocation. A new agent (banneker-engineer) handles synthesis rather than extending the surveyor, maintaining single-responsibility and cleaner state management. The surveyor detects cliffs and offers handoff; the engineer synthesizes decisions. Documents generate sequentially (DIAGNOSIS -> RECOMMENDATION -> PROPOSAL) with state file checkpoints between each.

**Major components:**
1. **banneker-engineer.md (command)** — User entry point, prerequisite checks, orchestration
2. **banneker-engineer.md (agent)** — Reads context, synthesizes decisions, spawns writer for each document
3. **Modified banneker-surveyor.md** — Cliff detection logic, takeover offer, context handoff
4. **diagnosis-catalog.md (config)** — Cliff signal definitions and severity rules
5. **Extended document-catalog.md** — Specs for three new document types

### Critical Pitfalls

1. **False positive cliff detection** — Compound signals required (never trigger on single marker). Add confirmation step. Track user rejections to raise threshold. Phase: Cliff Detection (CRITICAL)

2. **Over-engineering proposals** — Extract explicit constraints from survey (team size, timeline, MVP vs production). Include complexity ceiling. Default to simplest viable approach. Phase: Document Generation (CRITICAL)

3. **Context loss during mode switch** — Surveyor writes `surveyor_notes` to survey.json capturing conversational observations. Explicit transition summary before handoff. Consider spawning engineer as sub-task. Phase: Orchestration (CRITICAL)

4. **Silent confidence** — Every recommendation requires confidence level (HIGH/MEDIUM/LOW) with justification. For MEDIUM/LOW items, present alternatives, not single recommendations. Document assumptions explicitly. Phase: Document Generation (CRITICAL)

5. **Approval theater** — Granular approval per section/decision, not binary accept/reject. Modification path on rejection. "Think about it" option for deferred decisions. Phase: Approval Flow (MODERATE)

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Engineer Agent Core

**Rationale:** Establish the core synthesis capability before integrating with survey flow. Standalone mode validates document generation independently.

**Delivers:**
- `/banneker:engineer` command that reads survey.json (if exists) and produces three documents
- engineer-state.md for resume capability
- Basic document quality validation

**Addresses features:** Standalone invocation, DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md

**Avoids pitfalls:** Context loss (P3) — start without handoff complexity; Silent confidence (P4) — embed confidence requirements in document specs from the start

### Phase 2: Document Quality (Signal Detection)

**Rationale:** Cliff signal detection logic can be developed independently of survey integration. Define the signals, severity rules, and storage format before wiring into the surveyor.

**Delivers:**
- `cliff_signals` schema extension to survey.json
- Signal detection logic (patterns, categories, severity)
- DIAGNOSIS.md integration with cliff signals

**Uses stack:** Rule-based pattern matching, JSON schema extension

**Avoids pitfalls:** False positives (P1) — validate compound signal logic in isolation

### Phase 3: Approval Flow

**Rationale:** Approval workflow is critical for trust. Must be designed before survey integration so users have a clear path when engineer mode activates mid-survey.

**Delivers:**
- Granular approval (per-decision, not monolithic)
- Merge logic to architecture-decisions.json
- Modification and rejection paths
- "Defer decision" option

**Addresses features:** Approval workflow, transparent reasoning, user agency

**Avoids pitfalls:** Approval theater (P6) — design genuine decision points; Decision collision (P14) — ID management on merge

### Phase 4: Survey Integration

**Rationale:** With standalone engineer working and approval flow defined, integrate cliff detection into the survey pipeline.

**Delivers:**
- Cliff detection during survey phases
- Takeover offer at phase boundaries (not mid-phase)
- Context handoff protocol (surveyor-context.md or surveyor_notes in survey.json)
- Modified survey completion message suggesting `/banneker:engineer` when cliffs detected

**Uses architecture:** surveyor -> engineer handoff, state transfer

**Avoids pitfalls:** Flow disruption (P12) — cliff signals batched to phase boundaries; Context loss (P3) — explicit handoff protocol; State incompatibility (P13) — standardized state format

### Phase 5: Polish and Integration Testing

**Rationale:** End-to-end validation of the full flow: survey with cliff -> engineer takeover -> document generation -> approval -> merge -> architect consumption.

**Delivers:**
- Integration tests for standalone and takeover flows
- Complexity ceiling configuration
- Enhanced confidence markers
- Term consistency validation for engineer documents
- Pipeline test: survey -> engineer -> architect -> feed

**Addresses features:** Confidence ratings, terminology consistency, edit-before-approve

**Avoids pitfalls:** Over-engineering (P2) — complexity ceiling; Terminology drift (P8) — term validation; Format mismatch (P10) — pipeline validation

### Phase Ordering Rationale

- **Sequential document dependencies:** DIAGNOSIS requires context, RECOMMENDATION requires DIAGNOSIS, PROPOSAL requires RECOMMENDATION. Phase 1 establishes this pipeline first.
- **Cliff detection before integration:** Signal detection logic (Phase 2) must be validated before wiring into surveyor (Phase 4) to avoid false positive issues in production.
- **Approval before integration:** Users hitting cliffs mid-survey need a clear approval path immediately. Phase 3 before Phase 4.
- **Integration last:** Survey integration touches existing stable code. Defer until new components are validated.
- **Polish at end:** Complexity ceilings, confidence enhancement, and cross-command integration testing require all components in place.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Approval Flow):** Granular approval UX patterns for AI-generated decisions need validation. How other tools handle partial acceptance.
- **Phase 4 (Survey Integration):** Context handoff is identified as critical failure point. May need iteration on surveyor_notes format.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Agent Core):** Directly mirrors banneker-architect pattern. High-confidence implementation path.
- **Phase 2 (Signal Detection):** Rule-based detection is well-understood. Patterns documented in STACK.md.
- **Phase 5 (Polish):** Testing and configuration. Standard engineering.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; extends existing patterns. Direct codebase analysis. |
| Features | MEDIUM-HIGH | Table stakes well-documented in UX research. Differentiators need user validation. |
| Architecture | HIGH | Based entirely on existing Banneker codebase inspection. Clear component boundaries. |
| Pitfalls | HIGH | Multiple external sources confirm failure modes. Critical pitfalls have documented mitigations. |

**Overall confidence:** HIGH

The research benefits from building on a mature codebase with established patterns. The main uncertainties are in UX nuances (cliff detection sensitivity, approval granularity) that will require user testing.

### Gaps to Address

- **Cliff detection sensitivity tuning:** Research identifies signal categories but optimal thresholds need empirical validation. Plan: start conservative (high threshold), reduce based on user feedback.
- **Implicit cliff signals:** Hedging language patterns ("I guess...", "maybe...") are MEDIUM confidence. Plan: implement explicit signals first (Phase 2), add implicit signals in Phase 5.
- **Complexity ceiling calibration:** "Simplest viable" recommendation depends on project constraints not yet formalized in survey.json. Plan: Phase 2 adds `constraints` field to survey schema.
- **Context window limits during handoff:** Single-agent continuation (surveyor spawns engineer as sub-task) vs full mode switch needs prototyping. Plan: start with full mode switch (simpler), evaluate context loss severity.

## Sources

### Primary (HIGH confidence)
- Existing Banneker codebase: `templates/agents/banneker-*.md`, `templates/commands/banneker-*.md`
- Direct schema analysis: `schemas/*.json`
- State file patterns: `.banneker/state/*.md`

### Secondary (MEDIUM confidence)
- IEEE Spectrum: AI Coding Degrades — complexity inflation, silent failures
- Springer: Automation Bias in Human-AI Collaboration — over-reliance and trust patterns
- MITRIX/DEV.to: Context Collapse in AI Systems — mode switch as primary failure point
- SEI/CMU: Architecture Tradeoff Analysis Method — trade-off documentation structure
- Jakob Nielsen 2026 predictions — Review Paradox, audit interface challenges
- Vellum: AI Agent Workflows — checkpoint-based approval patterns

### Tertiary (LOW confidence)
- Rhythmiq: "I Don't Know" trustworthiness — uncertainty handling patterns
- ACM: AI Mismatches — expectation vs actual performance

---
*Research completed: 2026-02-03*
*Ready for roadmap: yes*
