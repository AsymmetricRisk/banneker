---
phase: 03-survey-pipeline
plan: 02
subsystem: survey-orchestration
tags: [agent-skills, resume-detection, file-based-state, task-spawning]

# Dependency graph
requires:
  - phase: 03-01
    provides: Survey pipeline requirements and specification (REQ-CONT-001, REQ-CONT-002)
provides:
  - Survey command orchestrator that handles resume detection and surveyor spawning
  - Three-scenario handling: fresh start, resume interrupted, overwrite completed
  - Output verification for survey.json and architecture-decisions.json
affects: [03-03-surveyor-agent, 04-survey-testing, future-survey-consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Agent Skills format for command files (YAML frontmatter + Markdown instructions)"
    - "File-based resume detection pattern (check state file before starting)"
    - "Task tool spawning pattern for sub-agents"
    - "Three-stage orchestration: detect → spawn → verify"

key-files:
  created: []
  modified:
    - templates/commands/banneker-survey.md

key-decisions:
  - "Orchestrator is lean - all interview logic delegated to banneker-surveyor sub-agent"
  - "Resume detection checks both interrupted state (survey-state.md) and completed state (survey.json)"
  - "State file preserved on failure for debugging and retry capability"

patterns-established:
  - "Resume detection as Step 0 (MANDATORY per REQ-CONT-002) before any work"
  - "User prompts for three scenarios: resume/fresh/abort for interrupted, overwrite/abort for completed, fresh start if neither"
  - "Output verification checks JSON validity and required structure keys"

# Metrics
duration: 1min
completed: 2026-02-02
---

# Phase 03 Plan 02: Survey Command Orchestrator Summary

**Agent Skills command file orchestrates resume detection, surveyor spawning via Task tool, and output verification for survey.json and architecture-decisions.json**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-02T21:39:59Z
- **Completed:** 2026-02-02T21:40:54Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced stub banneker-survey.md with complete orchestrator implementation
- Implemented resume detection per REQ-CONT-002 (checks survey-state.md and survey.json)
- Three-scenario handling: fresh start, resume from interruption, overwrite completed survey
- Spawns banneker-surveyor sub-agent with proper context (state file or fresh start flag)
- Verifies outputs on completion: JSON validity and required structure keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the survey command skill file** - `64fe04e` (feat)

**Plan metadata:** [Next commit]

## Files Created/Modified
- `templates/commands/banneker-survey.md` - Survey command orchestrator: resume detection → spawn surveyor → verify outputs

## Decisions Made

**1. Orchestrator delegates all interview logic to surveyor sub-agent**
- **Rationale:** Keeps command file lean and focused on lifecycle management (detect/spawn/verify), while surveyor handles complex 6-phase interview logic
- **Impact:** Clear separation of concerns, easier testing, surveyor can be developed independently

**2. Resume detection checks both interrupted and completed states**
- **Rationale:** Users may interrupt mid-interview (survey-state.md exists) or accidentally re-run after completion (survey.json exists) - both need handling
- **Impact:** Prevents data loss, provides clear user prompts for each scenario

**3. State file preserved on verification failure**
- **Rationale:** If surveyor fails to write valid JSON outputs, state file is crucial for debugging and resume capability
- **Impact:** Users can inspect state to understand what was collected, retry without starting over

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Phase 03-03: Implement banneker-surveyor sub-agent (the actual interview conductor)
- The surveyor agent can now be referenced by this orchestrator via Task tool

**Notes:**
- Orchestrator expects surveyor to handle state file writes (REQ-CONT-001)
- Orchestrator expects surveyor to delete state file on successful completion
- Output files must match verification structure: survey.json with 6 top-level keys, architecture-decisions.json with decisions array

**Blockers:** None

---
*Phase: 03-survey-pipeline*
*Completed: 2026-02-02*
