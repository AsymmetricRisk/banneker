---
phase: 12-cliff-detection
plan: 02
subsystem: surveyor
tags: [cliff-detection, mode-switch, confirmation-flow, surveyor-agent, engineer-handoff]

# Dependency graph
requires:
  - phase: 12-01
    provides: cliff_signals schema and EXPLICIT_CLIFF_SIGNALS reference list
  - phase: 11-engineer-agent-core
    provides: Engineer agent for mode switch target
provides:
  - Cliff detection protocol integrated into surveyor agent
  - Three-option confirmation flow for mode switch offers
  - Context handoff template (surveyor-context.md) for engineer spawn
  - Deferred questions protocol for skipped questions
affects: [12-03, 14-survey-integration, 15-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [cliff signal detection in LLM-as-runtime, context handoff between agents]

key-files:
  created: []
  modified: [templates/agents/banneker-surveyor.md]

key-decisions:
  - "Three-option confirmation flow (switch/continue/skip) per CLIFF-02"
  - "Context handoff via surveyor-context.md captures preferences and constraints"
  - "Engineer invocation uses standard Skill tool mechanism"
  - "Deferred questions re-offered at end of each phase"

patterns-established:
  - "Cliff detection pattern: detect -> log -> confirm -> handoff -> spawn"
  - "Agent handoff pattern: context file written before Skill tool invocation"
  - "Deferral pattern: track skipped items, re-offer at phase boundary"

# Metrics
duration: 2min
completed: 2026-02-03
---

# Phase 12 Plan 02: Surveyor Cliff Detection Summary

**Cliff detection protocol with three-option confirmation flow and context handoff integrated into surveyor agent template**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T23:10:14Z
- **Completed:** 2026-02-03T23:11:42Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added cliff detection protocol to surveyor with signal reference, timing rules, and logging protocol
- Integrated three-option confirmation flow per CLIFF-02 requirement
- Documented context handoff template (surveyor-context.md) for engineer agent
- Added deferred questions protocol with end-of-phase re-offer

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cliff signal detection logic to surveyor** - `5ae1990` (feat)
2. **Task 2: Add confirmation flow and mode switch offer** - `6aae922` (feat)

## Files Created/Modified
- `templates/agents/banneker-surveyor.md` - Added Cliff Detection Protocol section with detection algorithm, logging protocol, confirmation flow, context handoff, and deferred questions handling

## Decisions Made
- Three-option confirmation flow (switch to engineering mode / continue survey / skip question) gives user full control over mode switching
- Context handoff via surveyor-context.md captures observed preferences, implicit constraints, and confidence areas for engineer context
- Engineer invocation uses standard Skill tool mechanism - same pattern as all Banneker commands
- Deferred questions are tracked in survey-state.md and re-offered at end of each phase with three options

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Surveyor can now detect cliff signals and offer mode switch with confirmation
- Detection references cliff-detection-signals.md for signal list
- Context handoff template ready for engineer agent consumption
- Next plan (12-03) will integrate the full end-to-end flow with testing

---
*Phase: 12-cliff-detection*
*Completed: 2026-02-03*
