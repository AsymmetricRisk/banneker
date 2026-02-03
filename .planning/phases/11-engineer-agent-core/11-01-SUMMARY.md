---
phase: 11-engineer-agent-core
plan: 01
subsystem: ai-agents
tags: [engineer, adr, confidence-levels, gap-analysis, survey-synthesis]

# Dependency graph
requires:
  - phase: 08-brownfield-analysis-audit
    provides: "Document-catalog pattern for structured generation"
provides:
  - "Engineer sub-agent template for three-document generation"
  - "Engineering catalog defining DIAGNOSIS, RECOMMENDATION, PROPOSAL structures"
  - "Confidence level system (HIGH/MEDIUM/LOW) with probabilistic ranges"
  - "ADR format specification for engineering proposals"
  - "Partial survey handling strategy"
affects: [12-cliff-detection, 13-approval-flow, 14-survey-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-document synthesis: DIAGNOSIS → RECOMMENDATION → PROPOSAL"
    - "Confidence markers with rationale citing survey gaps"
    - "ADR format for decision proposals requiring approval"
    - "State management for resume capability"

key-files:
  created:
    - templates/config/engineering-catalog.md
    - templates/agents/banneker-engineer.md
  modified: []

key-decisions:
  - "Three-document architecture separates gap analysis, options analysis, and concrete proposals"
  - "Confidence system uses HIGH (85-90%), MEDIUM (50-85%), LOW (<50%) with probabilistic ranges"
  - "All proposals marked 'Proposed (awaiting approval)' - no auto-merge to architecture-decisions.json"
  - "Minimum viable survey requires Phase 1+2+3 (project + actors + walkthroughs)"

patterns-established:
  - "Pattern 1: Sequential document generation with dependencies (DIAGNOSIS informs RECOMMENDATION, RECOMMENDATION informs PROPOSAL)"
  - "Pattern 2: Confidence rationale must cite specific survey sections and DIAGNOSIS gaps"
  - "Pattern 3: ADR format includes Context, Decision, Rationale, Consequences, Alternatives, Confidence, Dependencies"
  - "Pattern 4: Partial survey handling with explicit gap statements (no placeholder patterns)"

# Metrics
duration: 5 min
completed: 2026-02-03
---

# Phase 11 Plan 01: Engineer Agent Core Summary

**Engineer sub-agent generates three-document suite (DIAGNOSIS, RECOMMENDATION, ENGINEERING-PROPOSAL) with confidence markers and ADR-format proposals requiring Phase 13 approval**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T22:08:06Z
- **Completed:** 2026-02-03T22:13:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created engineering-catalog.md defining three-document structure with survey mappings, confidence rules, and ADR format
- Created banneker-engineer sub-agent with six-step workflow: Load inputs → Analyze completeness → Generate DIAGNOSIS → Generate RECOMMENDATION → Generate PROPOSAL → Report results
- Established confidence level system with probabilistic ranges (HIGH: 85-90%, MEDIUM: 50-85%, LOW: <50%)
- Documented approval flow requirement: all proposals marked "Proposed (awaiting approval)", no auto-merge

## Task Commits

Each task was committed atomically:

1. **Task 1: Create engineering-catalog.md** - `4f45d4c` (feat)
   - Defines three-document architecture (DIAGNOSIS, RECOMMENDATION, ENGINEERING-PROPOSAL)
   - Specifies confidence level system with probabilistic ranges
   - Documents ADR format for proposals with all required sections
   - Includes survey mappings for each document section
   - Defines partial survey handling strategy
   - Documents approval flow requirements (no auto-merge)

2. **Task 2: Create banneker-engineer.md sub-agent** - `9e7b6c8` (feat)
   - Sub-agent generates three engineering documents sequentially
   - Workflow: Load survey → Analyze completeness → Generate DIAGNOSIS → RECOMMENDATION → PROPOSAL
   - State management enables resume after interruption
   - Handles partial surveys with explicit gap documentation
   - Confidence level system applied to all recommendations and proposals
   - ADR format for all engineering proposals with approval flow
   - Never auto-merges to architecture-decisions.json (requires Phase 13 approval)

## Files Created/Modified

- `templates/config/engineering-catalog.md` (532 lines) - Engineering document catalog defining three-document structure, confidence rules, ADR format, survey mappings, quality standards
- `templates/agents/banneker-engineer.md` (1047 lines) - Engineer sub-agent with six-step workflow for synthesizing survey data into engineering documents with confidence markers

## Decisions Made

1. **Three-document architecture** - Separate DIAGNOSIS (gap analysis), RECOMMENDATION (options analysis), and ENGINEERING-PROPOSAL (ADR decisions) for clear separation of concerns and independent iteration
2. **Confidence system based on engineering estimation** - HIGH/MEDIUM/LOW with probabilistic ranges (85-90%, 50-85%, <50%) borrowed from industry estimation practices
3. **ADR format for proposals** - Architecture Decision Record structure with Context, Decision, Rationale, Consequences, Alternatives, Confidence, Dependencies sections
4. **Approval-first flow** - All proposals marked "Status: Proposed (awaiting approval)" to prevent autonomous decision execution, maintains user trust (APPROVE-01 requirement)
5. **Minimum viable survey** - Phase 1+2+3 (project + actors + walkthroughs) required for engineering analysis
6. **Partial survey handling** - Graceful degradation with explicit gap statements, reduced confidence markers, no placeholder patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 11 Plan 02 (Engineer orchestrator command).

**What's ready:**
- Engineer sub-agent template complete with all six steps
- Engineering catalog defines document structures and rules
- Confidence system fully specified
- ADR format documented
- Partial survey handling strategy established

**Next steps:**
- Plan 02: Create orchestrator command (templates/commands/banneker-engineer.md)
- Plan 03: Create completion tracking schema for metrics
- Plan 04: Integration tests for partial survey scenarios

**Blockers:** None

**Dependencies for next plan:**
- This plan provides engineer sub-agent template that orchestrator will spawn
- Engineering catalog will be referenced by orchestrator for validation

---
*Phase: 11-engineer-agent-core*
*Completed: 2026-02-03*
