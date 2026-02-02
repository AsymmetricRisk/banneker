---
phase: 05-architecture-diagrams
plan: 02
subsystem: diagram-generation
tags: [command-orchestrator, resume-detection, wave-handoff, lifecycle-management]

# Dependency graph
requires:
  - phase: 05-architecture-diagrams
    plan: 01
    provides: banneker-diagrammer sub-agent with two-wave architecture
  - phase: 04-document-generation
    plan: 03
    provides: banneker-architect command pattern for orchestration
provides:
  - banneker-roadmap command orchestrator for diagram generation lifecycle
  - Prerequisite validation for survey.json and architecture-decisions.json
  - Resume detection for interrupted generation and Wave 1 handoff
  - Wave 1/Wave 2 partial completion handling with clear user messaging
affects: [05-03, appendix-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Command orchestrator pattern: prerequisites → resume detection → spawn agent → verify → cleanup
    - Wave handoff detection via .continue-here.md for context budget management
    - Partial completion as normal outcome (Wave 1 only) vs failure (incomplete generation)
    - State file preservation on failure for debugging and resume

key-files:
  created:
    - templates/commands/banneker-roadmap.md
  modified: []

key-decisions:
  - "Three-level resume detection: Wave 1 handoff (.continue-here.md), interrupted generation (diagrammer-state.md), existing diagrams"
  - "Wave 1-only completion is normal outcome with handoff messaging, not error state"
  - "Partial diagram detection (1-3 diagrams) prompts completion vs regeneration"
  - "State cleanup only on full completion (4 diagrams), preserve handoff for Wave 2"
  - "Prerequisites check both survey.json and architecture-decisions.json before spawning agent"

patterns-established:
  - "Pattern 1: Command orchestration lifecycle — check prerequisites, detect resume conditions, spawn sub-agent, verify outputs, clean up state"
  - "Pattern 2: Three-tier resume detection — handoff files (cross-wave) → state files (interrupted) → outputs (completed)"
  - "Pattern 3: Partial completion as success — Wave 1 (3 diagrams) is valid completion point with handoff for Wave 2"
  - "Pattern 4: Context-aware user messaging — different prompts for fresh start, resume, Wave 1 handoff, partial completion"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 5 Plan 02: Roadmap Command Orchestrator Summary

**banneker-roadmap command orchestrates diagram generation lifecycle with prerequisite checks, three-tier resume detection (Wave 1 handoff, interrupted generation, existing diagrams), agent spawning, and output verification**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-02T23:14:49Z
- **Completed:** 2026-02-02T23:16:49Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- Created banneker-roadmap command orchestrator following established pattern from banneker-architect
- Implemented prerequisite checks for survey.json and architecture-decisions.json before spawning diagrammer
- Built three-tier resume detection: Wave 1 handoff (.continue-here.md), interrupted generation (diagrammer-state.md), existing diagrams
- Handled Wave 1-only completion as normal outcome (context budget exhaustion) with clear handoff messaging
- Implemented partial diagram detection (1-3 diagrams) with completion vs regeneration prompts
- Added output verification for all 4 diagrams with size checks (> 500 bytes)
- State cleanup only on full completion (all 4 diagrams), preserving handoff for Wave 2 resume

## Task Commits

Each task was committed atomically:

1. **Task 1: Create banneker-roadmap command orchestrator** - `f022158` (feat)

## Files Created/Modified
- `templates/commands/banneker-roadmap.md` - Command orchestrator for `/banneker:roadmap` with lifecycle management

## Decisions Made
- **Three-tier resume detection:** Wave 1 handoff file (.continue-here.md) checked first for cross-wave resume, then interrupted generation state (diagrammer-state.md), then existing diagram outputs
- **Wave 1 as valid completion point:** When context budget exhausted after Wave 1 (3 CSS-only diagrams), treat as normal outcome with handoff messaging, not error
- **Partial diagram handling:** If 1-3 diagrams exist without state files, prompt user to complete missing diagrams or regenerate all
- **State preservation strategy:** Only delete state files on full completion (4 diagrams); preserve handoff file for Wave 2 resume; preserve state file on failure for debugging
- **Prerequisite enforcement:** Check both survey.json and architecture-decisions.json exist before spawning diagrammer to provide better error messaging
- **Diagram size validation:** Verify each diagram > 500 bytes (HTML diagrams should be substantial) to catch empty file generation failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- banneker-roadmap command ready for installer integration in Phase 5 Plan 03
- Command follows established orchestrator pattern from banneker-architect for consistency
- Wave 1/Wave 2 partial completion handling documented for user-facing workflow
- All 4 diagram outputs specified with verification criteria
- Resume detection covers all scenarios: fresh start, interrupted generation, Wave 1 handoff, completed run

---
*Phase: 05-architecture-diagrams*
*Completed: 2026-02-02*
