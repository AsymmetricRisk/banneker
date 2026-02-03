---
phase: 09-polish-and-ops
plan: 04
subsystem: testing-and-manifests
tags: [installer, manifests, integration-tests, smoke-tests, req-cont-003]
completed: 2026-02-03
duration: 3.2 minutes
requires: [09-01, 09-02]
provides:
  - Phase 9 template files tracked in installer manifests
  - Integration tests for Phase 9 frontmatter validation
  - Smoke tests for Phase 9 installation verification
  - REQ-CONT-003 regression prevention tests
affects: [installer, uninstaller, ci-cd, test-suite]
tech-stack:
  added: []
  patterns:
    - Test-driven manifest updates
    - Continuous validation of handoff file writing
decisions:
  - slug: allow-build-time-devdeps
    title: Allow devDependencies for build-time tooling
    rationale: auto-changelog (Phase 9-03) is build-time only, never shipped to users
    alternatives: [strict-zero-deps-always]
    tradeoffs: Nuanced test logic vs absolute zero-deps simplicity
key-files:
  created: []
  modified:
    - lib/constants.js
    - test/integration/skill-validation.test.js
    - test/integration/installer.test.js
    - test/smoke/full-install.test.js
---

# Phase 09 Plan 04: Manifest and Test Updates for Phase 9 Templates Summary

Phase 9 template files tracked in installer manifests, with integration and smoke tests ensuring correct installation and frontmatter validation. REQ-CONT-003 compliance verified across all long-running commands.

## Tasks Completed

### Task 1: Update installer manifests in constants.js
**Commit:** 689a177

Updated `lib/constants.js` to track all Phase 9 template files:
- Added `banneker-plat.md` to BANNEKER_FILES (command)
- Added `banneker-progress.md` to BANNEKER_FILES (command)
- Added `agents/banneker-plat-generator.md` to BANNEKER_FILES (agent path)
- Added `banneker-plat-generator.md` to AGENT_FILES (agent manifest)
- Maintained alphabetical ordering within each section
- Verified banneker-help.md already existed (no duplicate added)

**Result:** BANNEKER_FILES: 20 → 23 entries, AGENT_FILES: 8 → 9 entries, CONFIG_FILES: 3 (unchanged)

### Task 2: Verify REQ-CONT-003 handoff file writing
**Commit:** 6c0f027

Added regression prevention tests for continuation protocol compliance:
- Created test group in skill-validation.test.js verifying all 8 long-running commands reference handoff/continuation protocol
- Commands verified: survey, architect, roadmap, appendix, feed, document, audit, plat
- Fixed devDependencies test to allow build-time dependencies (auto-changelog from Phase 9-03)
- Changed test from "should have no devDependencies (for now)" to "should allow build-time devDependencies only"

**Result:** All 8 commands verified for `.continue-here.md`, `handoff`, or `REQ-CONT` references. Test prevents future regression.

### Task 3: Add integration and smoke tests for Phase 9 files
**Commit:** 0bb3732

Added comprehensive test coverage for Phase 9 template files:

**Integration tests (skill-validation.test.js):**
- banneker-plat.md frontmatter validation (name + description fields)
- banneker-progress.md frontmatter validation (name + description fields)
- banneker-plat-generator.md frontmatter validation (name + description fields)

**Smoke tests (full-install.test.js):**
- Explicit installation verification for banneker-plat.md
- Explicit installation verification for banneker-progress.md
- Explicit installation verification for banneker-plat-generator.md

**Result:** 87 → 90 tests (3 new), all passing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed devDependencies test for current state**
- **Found during:** Task 2 (test execution revealed failing test)
- **Issue:** Test assumed zero devDependencies, but Phase 9-03 added auto-changelog as build-time dependency
- **Fix:** Updated test to allow build-time devDependencies with explicit allowlist (auto-changelog)
- **Rationale:** Test comment "(for now)" indicated this was expected to change; zero-dependency constraint applies to runtime, not build-time
- **Files modified:** test/integration/installer.test.js
- **Commit:** 6c0f027

## Verification Results

All success criteria met:
- ✅ npm test passes with 0 failures (90/90 tests)
- ✅ BANNEKER_FILES count is 23 (was 20)
- ✅ AGENT_FILES count is 9 (was 8)
- ✅ CONFIG_FILES count is 3 (unchanged)
- ✅ No duplicate entries in any manifest
- ✅ Integration tests validate frontmatter for all 3 new Phase 9 templates
- ✅ Smoke test verifies installation of all 3 new Phase 9 files
- ✅ All 8 long-running commands verified for REQ-CONT-003 handoff file references

## Testing Evidence

```bash
# Manifest counts verified
$ node -e "import {BANNEKER_FILES, AGENT_FILES, CONFIG_FILES} from './lib/constants.js'; console.log('BANNEKER_FILES:', BANNEKER_FILES.length, 'AGENT_FILES:', AGENT_FILES.length, 'CONFIG_FILES:', CONFIG_FILES.length);"
BANNEKER_FILES: 23 AGENT_FILES: 9 CONFIG_FILES: 3

# All tests passing
$ npm test
# tests 90
# pass 90
# fail 0

# REQ-CONT-003 verification
$ for cmd in survey architect roadmap appendix feed document audit plat; do grep -c "continue-here\|handoff\|REQ-CONT" templates/commands/banneker-$cmd.md; done
(all commands: 1+ match)
```

## Decisions Made

**1. Allow devDependencies for build-time tooling**
- **Context:** Phase 9-03 added auto-changelog as devDependency for CI/CD changelog generation
- **Decision:** Update test to allow devDependencies with explicit allowlist, rather than strict zero-deps
- **Rationale:** Zero-dependency constraint is for runtime (published package), not build-time (development/CI)
- **Impact:** Future build-time dependencies require explicit addition to allowlist in test

## Artifacts Created

**Modified files:**
- `lib/constants.js` — Added 3 Phase 9 files to BANNEKER_FILES, 1 to AGENT_FILES
- `test/integration/skill-validation.test.js` — Added 3 frontmatter tests + 8 REQ-CONT-003 tests
- `test/integration/installer.test.js` — Fixed devDependencies test for build-time allowlist
- `test/smoke/full-install.test.js` — Added 3 explicit installation checks for Phase 9 files

**Test coverage:**
- 3 new integration tests for Phase 9 frontmatter validation
- 8 new integration tests for REQ-CONT-003 compliance (prevents regression)
- 3 new smoke test assertions for Phase 9 installation verification

## Next Phase Readiness

**Phase 10 dependencies resolved:**
- All Phase 9 template files are tracked in installer manifests
- Integration tests ensure frontmatter quality for all templates
- Smoke tests verify clean installation flow
- REQ-CONT-003 compliance tests prevent future regression on handoff file writing

**No blockers identified.**

## Metrics

- **Tasks completed:** 3/3
- **Tests added:** 3 integration tests, 8 REQ-CONT-003 tests, 3 smoke test assertions
- **Test suite growth:** 87 → 90 tests (+3.4%)
- **Manifest entries added:** 4 (3 to BANNEKER_FILES, 1 to AGENT_FILES)
- **Commits:** 3 (1 per task, atomic changes)
- **Duration:** ~3.2 minutes
- **Files modified:** 4 (1 source file, 3 test files)

## Notes

This completes Phase 9 of the Banneker project. All 4 plans in Phase 9 (Polish and Operations) are now complete:
- 09-01: Help and Progress commands
- 09-02: PLAT generation command and agent
- 09-03: Security documentation and changelog automation
- 09-04: Manifest and test updates (this plan)

Phase 9 focused on operational polish: user-facing commands for help/progress visibility, PLAT route documentation generation, security/changelog automation for publishing, and comprehensive test coverage for all new templates.

**Phase 9 is complete.**
