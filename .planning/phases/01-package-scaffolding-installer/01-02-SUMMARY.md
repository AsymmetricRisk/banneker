---
phase: 01-package-scaffolding-installer
plan: 02
subsystem: cli-parsing
tags: [tdd, node-test-runner, flag-parsing, path-resolution, util-parseargs]
requires: [01-01]
provides:
  - Flag parsing with validation (lib/flags.js)
  - Runtime path resolution (lib/paths.js)
  - Full test coverage with Node.js test runner
affects: [01-03, 01-04]
tech-stack:
  added: [node:test, node:util.parseArgs, node:os, node:path]
  patterns: [TDD, RED-GREEN-REFACTOR, test-first-development]
key-files:
  created: [lib/flags.js, lib/paths.js, test/flags.test.js, test/paths.test.js]
  modified: []
key-decisions:
  - Used RUNTIME_CHOICES from constants.js for runtime validation consistency
  - Implemented testable path resolution with optional homeDir parameter
  - No test framework needed - Node.js built-in test runner sufficient
duration: 155
completed: 2026-02-02
---

# Phase 01 Plan 02: TDD Core Logic Modules Summary

**One-liner:** TDD implementation of CLI flag parsing with util.parseArgs and multi-runtime path resolution with scope support

## What Was Built

Implemented two core logic modules using strict TDD methodology (RED-GREEN-REFACTOR cycle):

### 1. Flag Parsing Module (lib/flags.js)
- Parses CLI arguments using Node.js util.parseArgs
- Supports all runtime flags: --claude, --opencode, --gemini
- Short flags: -c, -o, -G, -g, -l, -u, -h
- Enforces mutual exclusion rules:
  - Only one runtime flag allowed
  - Cannot specify both --global and --local
- Validates unknown flags in strict mode
- Returns structured object with error handling
- 17 test cases covering all scenarios

### 2. Path Resolution Module (lib/paths.js)
- Resolves install paths for all supported runtimes
- Global scope: absolute paths under home directory
- Local scope: relative paths to current working directory
- Defaults to global scope when scope is null
- Validates runtime and throws errors for invalid inputs
- Uses path.join for cross-platform compatibility
- Testable with optional homeDir parameter
- 12 test cases covering all runtimes and scopes

## Performance

- **Duration:** 2 minutes 35 seconds
- **Started:** 2026-02-02T19:21:12Z
- **Completed:** 2026-02-02T19:23:47Z
- **Test execution:** All 29 tests pass in ~140ms per suite
- **TDD cycles:** 2 features × 3 phases = 6 atomic commits

## Task Commits

| Task | Phase | Commit | Description |
|------|-------|--------|-------------|
| Feature 1: Flag Parsing | RED | 2f15fae | Add failing test for flag parsing (17 test cases) |
| Feature 1: Flag Parsing | GREEN | 977f759 | Implement parseFlags with util.parseArgs |
| Feature 1: Flag Parsing | REFACTOR | ce529f1 | Extract runtime list to constants.js |
| Feature 2: Path Resolution | RED | ad87de5 | Add failing test for path resolution (12 test cases) |
| Feature 2: Path Resolution | GREEN | bf6a024 | Implement resolveInstallPaths with runtime validation |
| Feature 2: Path Resolution | REFACTOR | (none) | No refactoring needed - code already clean |

## Files Created/Modified

### Created
- **lib/flags.js** - CLI flag parsing with util.parseArgs
- **lib/paths.js** - Runtime install path resolution
- **test/flags.test.js** - 17 test cases for flag parsing
- **test/paths.test.js** - 12 test cases for path resolution

### Modified
- None (new modules)

## Key Technical Decisions

### Decision 1: Use constants.js for runtime validation
**Context:** Flag parsing needed list of valid runtimes
**Options:**
1. Hardcode runtime list in flags.js
2. Import RUNTIME_CHOICES from constants.js

**Chosen:** Option 2 - Import from constants.js
**Rationale:**
- Single source of truth for runtime configuration
- Made during REFACTOR phase to improve consistency
- Enables future runtime additions in one place
- Zero performance impact (compile-time import)

**Impact:** lib/flags.js now depends on lib/constants.js

### Decision 2: Make homeDir parameter optional for testing
**Context:** Path resolution needs to construct absolute paths under home directory
**Options:**
1. Always use os.homedir() directly
2. Accept optional homeDir parameter with default to os.homedir()

**Chosen:** Option 2 - Optional parameter with default
**Rationale:**
- Enables deterministic testing with mock home directories
- Production code still uses os.homedir() by default
- No impact on API consumers (parameter is optional)
- Standard testability pattern

**Impact:** All tests use mock homeDir for reproducibility

### Decision 3: Use Node.js built-in test runner
**Context:** TDD plan requires test framework
**Options:**
1. Install Jest or other test framework
2. Use Node.js built-in test runner (node:test)

**Chosen:** Option 2 - Built-in test runner
**Rationale:**
- Aligns with zero runtime dependencies constraint
- Node.js 18+ includes full test runner
- Sufficient features for unit testing (describe, it, assertions)
- No package.json devDependencies needed

**Impact:** Test command: `node --test test/*.test.js`

## Test Coverage

### Flag Parsing (17 tests)
- ✓ All runtime flags (--claude, --opencode, --gemini)
- ✓ All short flags (-c, -o, -G, -g, -l, -u, -h)
- ✓ Scope flags (--global, --local)
- ✓ Special flags (--help, --uninstall)
- ✓ No arguments (interactive mode trigger)
- ✓ Mutual exclusion validation (multiple runtimes)
- ✓ Mutual exclusion validation (global + local)
- ✓ Unknown flag rejection

### Path Resolution (12 tests)
- ✓ Global scope for all runtimes (claude, opencode, gemini)
- ✓ Local scope for all runtimes
- ✓ Null scope defaults to global
- ✓ Invalid runtime error handling
- ✓ Default os.homedir() usage

## Deviations from Plan

None - plan executed exactly as written. All TDD cycles completed successfully with atomic commits for RED, GREEN, and REFACTOR phases.

## Known Issues

None identified. All tests pass, all validation working as expected.

## Next Phase Readiness

### Blockers
None.

### Dependencies Satisfied
- ✓ lib/constants.js exists (from Plan 01-01)
- ✓ RUNTIMES and RUNTIME_CHOICES exported
- ✓ Test infrastructure ready

### Ready for Next Plan (01-03)
**Status:** Ready

Plan 01-03 can now:
- Import parseFlags from lib/flags.js
- Import resolveInstallPaths from lib/paths.js
- Build interactive mode CLI using these validated modules
- Trust that flag parsing and path resolution are fully tested

## Lessons Learned

### What Worked Well
1. **TDD methodology** - Writing tests first exposed edge cases early
2. **Atomic commits** - Each phase (RED-GREEN-REFACTOR) independently revertable
3. **Built-in test runner** - Zero setup, fast execution, clear output
4. **Constants reuse** - Importing from constants.js improved consistency

### What Could Be Improved
1. Consider adding JSDoc type definitions for better IDE support
2. Path resolution could benefit from validation error messages with suggestions

### Recommendations for Future Plans
1. Continue TDD for all modules with clear input/output contracts
2. Keep REFACTOR phase focused on actual improvements (skip if unnecessary)
3. Use mock parameters (like homeDir) for testability from the start
4. Verify all imports are Node.js built-ins before committing

---

**Plan Status:** Complete ✓
**All Success Criteria Met:** Yes
**Ready for Next Plan:** 01-03 (Interactive Mode CLI)
