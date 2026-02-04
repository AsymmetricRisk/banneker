---
phase: 14-survey-integration
plan: 03
subsystem: testing
tags: [integration-tests, cliff-detection, surveyor, schema-validation]

dependency-graph:
  requires:
    - 14-01 (surveyor agent with cliff detection protocol)
    - 14-02 (schema extensions for surveyor_notes)
  provides:
    - Integration tests for cliff detection -> offer -> handoff flow
    - Tests for decline flow preserving survey continuation
    - Schema validation tests for surveyor_notes and status
    - Installer tests for updated surveyor agent
  affects:
    - 15-polish-and-ops (future implicit signal detection testing)

tech-stack:
  added: []
  patterns:
    - Node.js test runner (node:test)
    - assert/strict for assertions
    - Temp directory isolation for installer tests
    - End-to-end flow simulation

key-files:
  created:
    - test/integration/surveyor-integration.test.js
  modified:
    - test/integration/installer.test.js

decisions: []

metrics:
  duration: ~4m
  completed: 2026-02-04
  tests-added: 9
---

# Phase 14 Plan 03: Integration Tests Summary

**One-liner:** Integration tests verify complete survey-to-engineer flow including cliff detection, decline handling, and schema extensions.

## What Was Built

### New Test File: surveyor-integration.test.js (610 lines)

Created comprehensive integration tests for the survey-to-engineer flow:

1. **Cliff Detection in Survey Context** (5 tests)
   - Detect cliff signal in survey response
   - Avoid false positives on confirmations
   - Detect multiple signals in conversation
   - Preserve original response in detection result
   - Handle case-insensitive detection

2. **Cliff State Tracking** (4 tests)
   - Build cliff signals array correctly
   - Track declined offers count
   - Correctly determine when to offer mode switch
   - Respect suppression threshold

3. **Context Handoff Generation** (3 tests)
   - Generate surveyor_notes structure
   - Generate surveyor-context.md content
   - Format deferred questions correctly

4. **Partial Survey JSON Generation** (4 tests)
   - Generate partial survey with status marker
   - Compute completeness percentage correctly
   - Mark backend as unknown for partial surveys
   - Include cliff_signals array in partial survey

5. **Decline Flow** (4 tests)
   - Preserve survey state on decline
   - Add to deferred questions on skip
   - Continue survey normally after decline
   - Suppress offers after threshold

6. **Surveyor State File Operations** (2 tests)
   - Write state file with cliff tracking section
   - Write context handoff file on mode switch

7. **End-to-End Flow Simulation** (1 test)
   - Complete cliff detection to handoff flow

### Extended Installer Tests

Added to `test/integration/installer.test.js`:

1. **Surveyor Agent Installation (Phase 14)** (5 tests)
   - Copy banneker-surveyor.md to agents directory
   - Verify cliff detection protocol sections
   - Verify cliff tracking state fields
   - Verify phase boundary cliff checks (5 phases)
   - Verify surveyor-context.md documentation

2. **Survey Schema Validation (Phase 14)** (4 tests)
   - Verify surveyor_notes property in schema
   - Verify status enum in survey_metadata
   - Verify cliff_signals as optional array
   - Verify cliff_signal entry structure

## Verification Results

| Check | Status |
|-------|--------|
| Full test suite passes | 195/195 |
| Surveyor Integration tests pass | All passing |
| Test count increase | +9 tests (186 -> 195) |
| surveyor-integration.test.js lines | 610 (>= 100 required) |
| No test regressions | Confirmed |

## Key Patterns Established

1. **Flow Simulation Testing**: End-to-end test simulates complete cliff detection to handoff flow, useful pattern for future integration tests.

2. **State Mutation Testing**: Tests verify state changes through decline/skip/accept flows without mocking.

3. **Schema Validation Testing**: Direct JSON schema parsing and assertion pattern for verifying schema structure.

## Commits

- `25672fa`: test(14-03): add surveyor integration tests
- `2705fd1`: test(14-03): add installer tests for surveyor agent content
- `4c6f2d7`: test(14-03): add schema validation tests for surveyor_notes

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 14 is now complete. All three plans executed successfully:
- 14-01: Surveyor agent modified with cliff detection protocol
- 14-02: Schema extended with surveyor_notes and status
- 14-03: Integration tests verify end-to-end flow

Ready for Phase 15: Polish & Advanced Detection (implicit signals, complexity ceiling).
