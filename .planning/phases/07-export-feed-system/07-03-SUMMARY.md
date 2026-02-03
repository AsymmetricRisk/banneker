---
phase: 07-export-feed-system
plan: 03
subsystem: installer
tags: [manifest, constants, testing, integration-tests, smoke-tests]

# Dependency graph
requires:
  - phase: 07-01
    provides: banneker-exporter agent and framework-adapters config
  - phase: 07-02
    provides: banneker-feed command file
  - phase: 06-03
    provides: pattern for manifest updates and test coverage
provides:
  - Updated BANNEKER_FILES manifest with Phase 7 files
  - Updated AGENT_FILES with banneker-exporter
  - Updated CONFIG_FILES with framework-adapters
  - Integration tests for Phase 7 template files
  - Smoke tests for Phase 7 installation verification
affects: [installer, uninstaller, future-template-files]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase 7 follows same manifest and test pattern as Phase 4, 5, and 6"
    - "Command, agent, and config files tracked in BANNEKER_FILES with appropriate prefixes"

key-files:
  created: []
  modified:
    - lib/constants.js
    - test/integration/skill-validation.test.js
    - test/smoke/full-install.test.js

key-decisions:
  - "Phase 7 files follow established prefix pattern (root for commands, agents/ for agents, config/ for config)"
  - "Command and agent files require YAML frontmatter validation; config files do not have frontmatter"

patterns-established:
  - "Manifest updates follow consistent pattern for each phase: BANNEKER_FILES + type-specific arrays + tests"
  - "Integration tests validate frontmatter structure and name field matches filename for command/agent files"
  - "Config files validated for existence and expected content but no frontmatter check"
  - "Smoke tests verify installation to correct directories (commands, agents, config)"

# Metrics
duration: 2min
completed: 2026-02-03
---

# Phase 7 Plan 3: Installer Manifest Update Summary

**Installer manifest updated with 3 new Phase 7 files (banneker-feed command, banneker-exporter agent, framework-adapters config), comprehensive test coverage added for export and feed system template files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T01:24:52Z
- **Completed:** 2026-02-03T01:26:59Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added banneker-feed command to BANNEKER_FILES manifest
- Added banneker-exporter agent to both BANNEKER_FILES and AGENT_FILES
- Added framework-adapters config to both BANNEKER_FILES and CONFIG_FILES
- Added integration tests validating YAML frontmatter for command and agent files
- Added integration test validating framework-adapters config file existence and content
- Added smoke tests verifying installation of all 3 new files to correct directories
- All existing tests continue to pass (19 integration tests, 3 smoke tests all green - 74 total tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update lib/constants.js with Phase 7 file entries** - `313a730` (feat)
2. **Task 2: Add integration and smoke tests for Phase 7 files** - `20ebe08` (test)

## Files Created/Modified
- `lib/constants.js` - Added banneker-feed.md, agents/banneker-exporter.md, and config/framework-adapters.md to BANNEKER_FILES; added banneker-exporter.md to AGENT_FILES; added framework-adapters.md to CONFIG_FILES
- `test/integration/skill-validation.test.js` - Added 3 new test cases for Phase 7 template files (banneker-feed command, banneker-exporter agent, framework-adapters config)
- `test/smoke/full-install.test.js` - Added verification for banneker-feed command, banneker-exporter agent, and framework-adapters config installation

## Decisions Made

**Follow Phase 6 pattern exactly:** Phase 7 manifest updates followed the exact same pattern established in Phase 4 Plan 04, Phase 5 Plan 03, and Phase 6 Plan 03. Command files are added to BANNEKER_FILES as root-level entries, agent files are added with the `agents/` prefix, config files are added with the `config/` prefix, and the agent/config filenames are also added to their respective type-specific arrays.

**Frontmatter validation for export system files:** Both the banneker-feed command and banneker-exporter agent have YAML frontmatter with `name` and `description` fields. Integration tests validate this frontmatter structure to ensure files are properly formatted for Claude Code runtime discovery.

**Config files have no frontmatter:** Following the established pattern from Phase 4 Decision 04-04, config files like framework-adapters.md do not have YAML frontmatter. Instead, integration tests verify the file exists, has content, and contains expected section headers and references.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tests passed on first run after implementation.

## Next Phase Readiness

- Installer manifest is complete for all Phase 7 deliverables
- All template files (banneker-feed command, banneker-exporter agent, framework-adapters config) are tracked and tested
- Integration and smoke tests provide full coverage for Phase 7 files
- Phase 7 is now complete (3/3 plans)
- Ready for Phase 8 or future phases that add more template files
- No blockers

---
*Phase: 07-export-feed-system*
*Completed: 2026-02-03*
