---
phase: 12-cliff-detection
plan: 01
subsystem: surveyor
tags: [cliff-detection, schema, survey, json-schema, mode-switching]

# Dependency graph
requires:
  - phase: 11-engineer-agent-core
    provides: Engineer agent foundation for mode switching target
provides:
  - cliff_signals array schema in survey.json for audit logging
  - EXPLICIT_CLIFF_SIGNALS reference list for surveyor agent
  - Detection algorithm documentation
  - Threshold configuration for declined offer suppression
affects: [12-02, 12-03, 14-survey-integration, 15-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [cliff signal logging with structured metadata]

key-files:
  created: [templates/config/cliff-detection-signals.md]
  modified: [schemas/survey.schema.json]

key-decisions:
  - "cliff_signals is optional property (not required) to maintain backward compatibility"
  - "14 explicit signal phrases for HIGH confidence detection"
  - "Two declined offers before suppression threshold"
  - "All detections logged regardless of offer status (audit trail)"

patterns-established:
  - "Cliff signal logging: timestamp, phase, response, detected_signal, confidence"
  - "Config reference pattern: Markdown file with embedded code blocks for signal lists"

# Metrics
duration: 1min
completed: 2026-02-03
---

# Phase 12 Plan 01: Schema and Signals Config Summary

**cliff_signals array schema added to survey.json with 14 explicit trigger phrases documented in config reference**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-03T23:06:50Z
- **Completed:** 2026-02-03T23:07:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended survey.schema.json with cliff_signals array for audit logging
- Created cliff-detection-signals.md with complete explicit signal list
- Documented detection algorithm and threshold configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend survey.schema.json with cliff_signals array** - `60f5604` (feat)
2. **Task 2: Create cliff-detection-signals.md config reference** - `75f62f8` (feat)

## Files Created/Modified
- `schemas/survey.schema.json` - Added cliff_signals array property with timestamp, phase, user_response, detected_signal, confidence fields
- `templates/config/cliff-detection-signals.md` - Defines EXPLICIT_CLIFF_SIGNALS list, detection algorithm, and threshold configuration

## Decisions Made
- cliff_signals kept as optional property to maintain backward compatibility with existing surveys
- 14 explicit signal phrases chosen for HIGH confidence detection (explicit indicators like "i don't know", "whatever you think")
- Two declined offers threshold before suppression to balance helpfulness with user autonomy
- All detections logged for audit trail regardless of whether mode switch is offered

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema ready for cliff signal logging in survey data
- Signal list ready for surveyor agent integration (Plan 12-02)
- Detection algorithm documented for implementation reference

---
*Phase: 12-cliff-detection*
*Completed: 2026-02-03*
