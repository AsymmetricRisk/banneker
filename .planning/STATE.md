# Banneker — State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Transform structured discovery interviews into engineering plans, architecture diagrams, and agent-ready HTML appendices
**Current focus:** Milestone v0.3.0 — The Engineer (Phase 15: Polish & Advanced Detection)

## Current Position

Phase: 15 of 15 (Polish & Advanced Detection)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-02-04 — Completed 15-04-PLAN.md

Progress: [###################-] 93% (Phase 15: 4/5 plans complete)

## Current Milestone: v0.3.0

**Goal:** Add `/banneker:engineer` command that shifts from interviewing to engineering mode when users reach their knowledge limits

**Phases:**
- Phase 11: Engineer Agent Core (standalone synthesis) - COMPLETE
- Phase 12: Cliff Detection (signal detection + confirmation) - COMPLETE
- Phase 13: Approval Flow (user approval before merge) - COMPLETE
- Phase 14: Survey Integration (mid-survey takeover) - COMPLETE + VERIFIED
- Phase 15: Polish & Advanced Detection (implicit signals, complexity ceiling) - IN PROGRESS

**Requirements:** 17 total (CLIFF: 4, ENGDOC: 6, APPROVE: 4, ENGINT: 5)

## Performance Metrics

**Velocity:**
- Total plans completed: 32 (v0.2.0)
- Average duration: ~15 min
- Total execution time: ~8 hours

**By Phase (v0.2.0):**

| Phase | Plans | Status |
|-------|-------|--------|
| 1-9 | 31/31 | Complete |
| 10 | 1/2 | In progress |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v0.3.0 work:

- Zero runtime dependencies constraint continues
- Multi-runtime support (Claude Code, OpenCode, Gemini)
- New agent (banneker-engineer) separate from surveyor
- Three-document output: DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md
- Three-document architecture separates gap analysis, options analysis, and concrete proposals (11-01)
- Confidence system uses HIGH (85-90%), MEDIUM (50-85%), LOW (<50%) with probabilistic ranges (11-01)
- All proposals marked "Proposed (awaiting approval)" - no auto-merge to architecture-decisions.json (11-01)
- Minimum viable survey requires Phase 1+2+3 (project + actors + walkthroughs) (11-01)
- Minimum viable survey for engineer: Phases 1-3 required (project, actors, walkthroughs) (11-02)
- Related commands documentation included in orchestrator files for workflow guidance (11-02)
- Section-by-section gap detection with survey path notation (e.g., backend.infrastructure) (11-03)
- Confidence baseline establishment: HIGH (80-100%), MEDIUM (50-79%), LOW (<50%) based on completeness (11-03)
- State management with resume capability: engineer-state.md tracks progress and survey analysis (11-03)
- Partial data behavior: Generate all 3 documents even with incomplete survey, document gaps explicitly (11-03)
- Installer already handles new files via recursive cpSync - no code changes needed for new templates (11-04)
- Installation tests follow pattern: verify file copied + verify content structure (11-04)
- cliff_signals is optional property (not required) to maintain backward compatibility (12-01)
- 14 explicit signal phrases for HIGH confidence detection (12-01)
- Two declined offers before suppression threshold (12-01)
- All detections logged regardless of offer status (audit trail) (12-01)
- Three-option confirmation flow (switch/continue/skip) per CLIFF-02 (12-02)
- Context handoff via surveyor-context.md captures preferences and constraints (12-02)
- Engineer invocation uses standard Skill tool mechanism (12-02)
- Deferred questions re-offered at end of each phase (12-02)
- Longest matching signal wins when response contains overlapping signals (12-03)
- Detection function returns structured result object for flexible handling (12-03)
- TDD pattern for detection logic: RED-GREEN-REFACTOR with separate commits (12-03)
- Atomic write uses backup + .tmp + rename pattern for POSIX safety (13-01)
- Rejection log includes full_decision for potential recovery (13-01)
- Display groups by domain field with global numbered indices (13-01)
- Exported helper functions (parseIndices, formatEditableDecision) for testability (13-02)
- Edit file uses # comment lines with instructional header (13-02)
- Editor fallback chain: $EDITOR -> $VISUAL -> vi (13-02)
- Batch selection defaults to reject-all on too many invalid attempts (13-02)
- CWD swap pattern for testing relative-path libraries in isolation (13-03)
- Phase 1-5 get cliff detection checks; Phase 6 excluded from cliff detection (14-01)
- State fields for cliff tracking: pendingOffer, declinedOffers, cliffSignals, deferredQuestions (14-01)
- surveyor_notes optional field for backward compatibility with existing surveys (14-02)
- Dual handoff: surveyor_notes in survey.json + surveyor-context.md for readable context (14-02)
- Minimum viability threshold at 55% (Phases 1-3 complete) before engineer mode switch (14-02)
- Dual handoff sources: use both when available, either when only one exists (14-04)
- Handoff Context section MANDATORY in DIAGNOSIS.md when handoff context exists (14-04)
- Uncertain topics from handoff map to LOW confidence recommendations (14-04)
- Deferred questions automatically added to gaps list (14-04)
- Implicit signals use MEDIUM confidence vs explicit HIGH (15-01)
- Compound threshold requires 2+ implicit signals across current + last 3 responses (15-01)
- 3 implicit signal categories: hedging (10), quality_markers (7), deferrals (7) (15-01)
- Explicit signals always take priority with immediate HIGH confidence trigger (15-01)
- maxComplexity levels: standard (default), minimal (constrained), enterprise (15-02)
- Solo, budget, timeline constraints all trigger minimal complexity ceiling (15-02)
- Over-engineering patterns: microservices, k8s, event-driven, distributed (15-02)
- Standard complexity projects bypass all checks (no false positives) (15-02)
- Violations include type, reason, and suggestion for alternatives (15-02)
- recentHistory tracks last 5 responses (uses last 3 for compound threshold) (15-03)
- History resets at phase boundaries for contextual detection (15-03)
- MEDIUM confidence offers softer framing than HIGH confidence (15-03)
- Implicit signals logged even when below threshold for analytics (15-03)
- Research limited to 3 WebSearch queries per engineer session (15-04)
- Technology comparisons get high priority for research (15-04)
- Research findings boost confidence by one level (LOW -> MEDIUM) (15-04)
- Complexity violations flagged but not blocked (user can override) (15-04)
- Research skipped if survey completeness > 70% (15-04)

### Blockers/Concerns

- Phase 10 (v0.2.0 Public Launch) has 1 remaining plan before v0.3.0 can start
- Approval flow UX needs validation during Phase 13 planning

## Session Continuity

Last session: 2026-02-04T17:26:50Z
Stopped at: Completed 15-04-PLAN.md (Engineer Integration)
Resume file: None

---
*Last updated: 2026-02-04 — Phase 15 plan 04 complete*
