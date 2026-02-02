---
phase: 03
plan: 03
subsystem: installer
tags: [installer, agents, tests, infrastructure]

requires:
  - 03-01  # Agent template and schemas created
  - 03-02  # Orchestrator command created

provides:
  - Agent file installation infrastructure
  - Installer copies agents directory to {runtime}/agents/
  - Uninstaller handles agent file paths
  - Integration tests for agent templates
  - Smoke tests for agent installation

affects:
  - Future phases: Agent files are now tracked and installed alongside commands

tech-stack:
  added: []
  patterns: [multi-directory-install, path-based-file-tracking]

key-files:
  created: []
  modified:
    - lib/constants.js
    - lib/installer.js
    - lib/uninstaller.js
    - test/integration/skill-validation.test.js
    - test/smoke/full-install.test.js

decisions:
  - id: DEC-03-03-01
    question: How should agent files be tracked separately from command files?
    choice: Add agents/ prefix in BANNEKER_FILES array
    rationale: Enables path-based logic for installation/uninstallation to different directories
    alternatives:
      - Separate constant arrays: Would require installer to track multiple lists
      - Single flat list: Would lose information about file location

  - id: DEC-03-03-02
    question: How should uninstaller handle null configDir for backwards compatibility?
    choice: Skip agent files if configDir is null
    rationale: Maintains compatibility with existing tests that pass null
    alternatives:
      - Throw error: Would break existing tests
      - Default to commandsDir: Would install to wrong location

metrics:
  duration: 3m
  completed: 2026-02-02
---

# Phase 03 Plan 03: Installer Support for Agent Files Summary

**One-liner:** Updated installer infrastructure to copy agents directory alongside commands, with full test coverage for agent template validation and installation.

## What Was Done

### Task 1: Update constants, installer, and uninstaller for agents directory (Commit: af8e588)

**Changes:**
- Added `agents/banneker-surveyor.md` to `BANNEKER_FILES` tracking array
- Added new `AGENT_FILES` constant for installer reference
- Updated installer to detect and copy `templates/agents/` directory to `{runtime}/agents/`
- Updated success message to mention agents directory when copied
- Modified uninstaller to handle agent file paths relative to `configDir` instead of `commandsDir`
- Added backwards compatibility in uninstaller for null `configDir`
- Added cleanup logic to remove empty agents directory on uninstall

**Key insight:** Agent files need different path resolution than command files since they install to `{runtime}/agents/` while commands install to `{runtime}/commands/`.

### Task 2: Add integration tests for agent templates (Commit: 5311473)

**Changes:**
- Added test to scan `templates/agents/` directory for `.md` files
- Validated all agent templates have proper YAML frontmatter (name, description fields)
- Enforced meaningful descriptions for agents (>20 characters)
- Added specific test for `banneker-surveyor.md`:
  - Verifies all 6 phases mentioned (pitch, actors, walkthroughs, backend, gaps, decision)
  - Confirms state management via `survey-state.md`
  - Confirms output files (`survey.json`, `architecture-decisions.json`)
- Added test for `banneker-survey.md` command:
  - Validates it's no longer a stub
  - Confirms it references `banneker-surveyor` agent
  - Confirms it mentions `survey-state.md` for resume detection

**Coverage:** All new tests pass, bringing total test count to 63 tests.

### Task 3: End-to-end smoke test for agent file installation (Commit: b34ba7e)

**Changes:**
- Updated smoke test to simulate full installation including agents
- Added `configDir` extraction from `resolveInstallPaths`
- Added agent template directory copying in test simulation
- Updated BANNEKER_FILES verification to handle agent paths (use `configDir` for `agents/*` files)
- Added verification that agents directory exists at correct path
- Added verification that `banneker-surveyor.md` is installed with valid frontmatter

**Result:** Full test suite passes with 63/63 tests (100% pass rate).

## Verification Results

All verification criteria met:

✅ `npm test` passes with all existing and new tests (63/63 passing)
✅ `lib/constants.js` includes `agents/banneker-surveyor.md` in BANNEKER_FILES
✅ `lib/installer.js` copies both commands and agents directories
✅ Template validation tests cover agent files
✅ Smoke test verifies agent installation end-to-end
✅ No regressions - all existing tests continue to pass

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

**Path resolution logic:**
- Command files: `join(commandsDir, filename)` → `~/.claude/commands/banneker-survey.md`
- Agent files: `join(configDir, filename)` → `~/.claude/agents/banneker-surveyor.md`
- VERSION file: `join(commandsDir, 'VERSION')` → `~/.claude/commands/VERSION`

**Install flow:**
1. Create `commandsDir` (`~/.claude/commands/`)
2. Copy `templates/commands/` → `commandsDir`
3. If `templates/agents/` exists:
   - Create `configDir/agents/` (`~/.claude/agents/`)
   - Copy `templates/agents/` → `configDir/agents/`
4. Write VERSION file to `commandsDir`

**Uninstall flow:**
1. Check VERSION file exists (confirms installation)
2. For each file in BANNEKER_FILES:
   - If starts with `agents/`: resolve from `configDir` (skip if null)
   - Otherwise: resolve from `commandsDir`
   - Remove if exists
3. Try to remove empty `agents/` directory (ignore errors)

## Next Phase Readiness

**Ready for:** Phase 03 completion - All survey pipeline infrastructure in place:
- ✅ Agent template created (03-01)
- ✅ Orchestrator command created (03-02)
- ✅ Installer updated (03-03)

**Blockers:** None

**Concerns:** None - installation infrastructure is solid and well-tested.

## Files Changed

| File | Lines Changed | Purpose |
|------|---------------|---------|
| lib/constants.js | +6 -1 | Added agent file tracking |
| lib/installer.js | +27 -5 | Added agents directory copying |
| lib/uninstaller.js | +35 -11 | Added agent file path handling |
| test/integration/skill-validation.test.js | +119 -0 | Added agent template validation |
| test/smoke/full-install.test.js | +42 -7 | Updated for agent installation |

**Total:** 229 insertions, 24 deletions across 5 files

## Test Coverage

**Before:** 54 tests passing
**After:** 63 tests passing (+9 tests)

**New test categories:**
- Agent template YAML frontmatter validation
- Agent-specific content validation (6 phases, state management, outputs)
- Command-to-agent relationship validation
- End-to-end agent installation verification

**Maintained:** 100% test pass rate, zero dependencies constraint

## Decisions Made

**DEC-03-03-01: Agent file tracking via path prefix**
- **Question:** How should agent files be tracked separately from command files?
- **Choice:** Add `agents/` prefix in BANNEKER_FILES array (e.g., `agents/banneker-surveyor.md`)
- **Rationale:** Enables simple path-based logic in installer/uninstaller. A single loop can handle both file types with conditional path resolution.
- **Alternatives considered:**
  - Separate constant arrays (COMMAND_FILES, AGENT_FILES): Requires installer to iterate multiple arrays
  - Single flat list without prefix: Loses information about where files install
- **Impact:** Installer and uninstaller use simple `startsWith('agents/')` check for routing

**DEC-03-03-02: Backwards-compatible null configDir handling**
- **Question:** How should uninstaller handle null configDir parameter?
- **Choice:** Skip agent files if configDir is null, continue with command files
- **Rationale:** Existing tests call `uninstall(commandsDir, null)`. Breaking these would require updating all tests and potentially breaking external code.
- **Alternatives considered:**
  - Throw error on null: Would break existing tests and API
  - Default to commandsDir: Would install agents to wrong location
- **Impact:** Uninstaller is backwards compatible, tests don't need updates

## Integration Points

**Upstream dependencies:**
- Requires `templates/agents/banneker-surveyor.md` from 03-01
- Uses paths returned by `resolveInstallPaths()` from Phase 01

**Downstream impact:**
- Future agent templates can be added to `templates/agents/`
- Must be tracked in BANNEKER_FILES with `agents/` prefix
- Tests automatically validate new agent files (if they match `.md` pattern)

**Cross-cutting concerns:**
- Multi-runtime support maintained (claude, opencode, gemini)
- Zero dependencies constraint preserved
- Permission checks apply to both commandsDir and configDir
