---
phase: 01-package-scaffolding-installer
plan: 01
subsystem: package-core
tags: [npm, scaffolding, package-structure, cli-entry, constants, stub-files]
requires: []
provides:
  - npm package foundation with bin entry point
  - shared constants module (VERSION, RUNTIMES, BANNEKER_FILES)
  - stub skill files in templates/commands/
  - VERSION file for install detection
affects:
  - 01-02 (test infrastructure will test this package structure)
  - 01-03 (installer will use constants and copy stub files)
  - all future phases (build on this package foundation)
tech-stack:
  added: []
  patterns: [ES modules, zero dependencies, multi-runtime architecture]
key-files:
  created:
    - package.json
    - VERSION
    - .gitignore
    - .npmignore
    - bin/banneker.js
    - lib/constants.js
    - templates/commands/banneker-survey.md
    - templates/commands/banneker-help.md
    - templates/config/.gitkeep
  modified: []
key-decisions:
  - decision: Use ES modules (type: module) throughout package
    rationale: Modern Node.js standard, better for tree-shaking, cleaner imports
    date: 2026-02-02
  - decision: Zero runtime dependencies
    rationale: REQ-INST-007 constraint for security and reliability
    date: 2026-02-02
  - decision: Multi-runtime support from day one
    rationale: Claude Code, OpenCode, and Gemini support baked into constants
    date: 2026-02-02
duration: 1m 6s
completed: 2026-02-02
---

# Phase 01 Plan 01: Package Scaffolding & Structure Summary

**One-liner:** npm package foundation with bin entry, shared constants (VERSION/RUNTIMES/BANNEKER_FILES), and stub skill files for E2E testing

## Objective Achievement

✅ **Objective met:** Created valid npm package skeleton with all foundational files, directory layout, shared constants module, and stub skill files in templates/commands/.

**Deliverables:**
- npm package with correct name, version, bin field, type, engines, files array
- Executable bin/banneker.js with shebang and SIGINT handler
- lib/constants.js exporting VERSION, RUNTIMES, RUNTIME_CHOICES, BANNEKER_FILES
- Stub skill files (banneker-survey.md, banneker-help.md) ready for installer to copy
- VERSION file for install detection
- .gitignore and .npmignore with appropriate exclusions

## Performance

**Execution time:** 1 minute 6 seconds
**Started:** 2026-02-02T19:20:35Z
**Completed:** 2026-02-02T19:21:41Z

**Efficiency notes:**
- Both tasks executed without issues
- All verifications passed on first attempt
- Zero dependencies maintained per REQ-INST-007

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create npm package structure and configuration | 562f518 | package.json, VERSION, .gitignore, .npmignore |
| 2 | Create bin entry point, constants module, and stub skill files | 7097398 | bin/banneker.js, lib/constants.js, templates/commands/*.md, templates/config/.gitkeep |

## Files Created

**Package configuration:**
- `package.json` — npm package manifest with bin entry, engines, files array
- `VERSION` — version file containing 0.2.0 for install detection
- `.gitignore` — excludes node_modules, .DS_Store, *.log
- `.npmignore` — excludes .planning, .banneker, .claude, .git, *.ipynb, guides

**Executable:**
- `bin/banneker.js` — CLI entry point with shebang, SIGINT handler, dynamic installer import

**Shared module:**
- `lib/constants.js` — exports VERSION, RUNTIMES (claude/opencode/gemini configs), RUNTIME_CHOICES, BANNEKER_FILES

**Stub skill files:**
- `templates/commands/banneker-survey.md` — placeholder for survey command (replaced in Phase 4)
- `templates/commands/banneker-help.md` — placeholder for help command (replaced in Phase 3)

**Directory structure:**
- `templates/config/.gitkeep` — placeholder for config templates (added in later phases)

## Files Modified

None (all files created from scratch)

## Decisions Made

**1. ES modules throughout package**
- **Context:** Choosing between CommonJS and ES modules
- **Decision:** Use `"type": "module"` in package.json, ES import/export syntax everywhere
- **Rationale:** Modern Node.js standard, better tree-shaking, cleaner syntax, aligns with current best practices
- **Impact:** All lib modules must use ES syntax, dynamic imports required for conditional loading

**2. Zero runtime dependencies**
- **Context:** REQ-INST-007 constraint forbids runtime dependencies
- **Decision:** Use only Node.js built-ins (node:fs, node:path, node:os, etc.)
- **Rationale:** Security, reliability, minimal attack surface, faster installs
- **Impact:** All functionality must be implemented using Node.js APIs only

**3. Multi-runtime support baked into constants**
- **Context:** Need to support Claude Code, OpenCode, and Gemini from day one
- **Decision:** RUNTIMES object in constants.js maps runtime names to install paths
- **Rationale:** Centralized configuration, easy to extend, single source of truth
- **Impact:** Installer and all future modules reference RUNTIMES for path resolution

**4. Stub skill files for E2E testing**
- **Context:** Need real files for installer to copy during E2E tests
- **Decision:** Create placeholder .md files with clear "stub" markers
- **Rationale:** Enables complete E2E flow testing before real skills implemented
- **Impact:** Real skill files will replace these stubs in Phases 3-9

## Deviations from Plan

None — plan executed exactly as written.

## Known Issues

None. All verifications passed.

## Next Phase Readiness

**Ready for:** Phase 01 Plan 02 (Test Infrastructure)

**Blockers:** None

**Notes:**
- Package structure validated and ready for testing
- Stub files exist for installer E2E verification
- Constants module provides foundation for all future modules
- bin/banneker.js will fail at runtime until lib/installer.js created in Plan 03 (expected behavior)

## Integration Points

**Provides to future phases:**
- `lib/constants.js` — VERSION, RUNTIMES, RUNTIME_CHOICES, BANNEKER_FILES for all modules
- `templates/commands/*.md` — stub files for installer to copy (Plan 03)
- `package.json` bin field — enables `npm link` for local testing
- Directory structure — bin/, lib/, templates/ foundation

**Dependencies:**
- None (first plan in phase)

**Architecture notes:**
- ES modules enable clean imports across all future modules
- RUNTIMES object extensible for future runtime support
- BANNEKER_FILES array tracks installed files for clean uninstall
