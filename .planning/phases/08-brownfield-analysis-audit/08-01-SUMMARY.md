---
phase: 08-brownfield-analysis-audit
plan: 01
subsystem: brownfield-analysis
tags: [cartographer, codebase-analysis, scanning, documentation]

# Dependency graph
requires:
  - phase: 07-export-feed-system
    provides: Exporter agent pattern for multi-format output generation
provides:
  - Cartographer agent for brownfield codebase analysis
  - 4-phase scanning strategy (metadata, structure, technology, architecture)
  - State management for resume capability on large codebases
  - Structured codebase-understanding.md output format
affects: [08-02, 08-03, 08-04, brownfield-onboarding, codebase-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "4-phase progressive codebase scanning (metadata → structure → technology → architecture)"
    - "CLI tool-based analysis using Glob/Grep/Read (zero runtime dependencies)"
    - "State file for resume on context exhaustion (.banneker/state/document-state.md)"
    - "Project-specific findings requirement (no generic placeholders)"

key-files:
  created:
    - templates/agents/banneker-cartographer.md
  modified: []

key-decisions:
  - "4-phase scanning strategy enables progressive analysis with resume capability"
  - "State file persists progress for large codebases that exhaust context"
  - "CLI tools (Glob/Grep/Read) for analysis - no runtime dependencies"
  - "Output to .banneker/codebase-understanding.md for brownfield project onboarding"
  - "File exclusion rules prevent scanning binaries, generated files, and dependencies"
  - "Quality rules enforce project-specific findings (actual file paths, versions, patterns)"

patterns-established:
  - "Pattern 1: Progressive multi-phase analysis with state tracking"
  - "Pattern 2: Project type detection from manifest files (package.json, Cargo.toml, etc.)"
  - "Pattern 3: Technology stack extraction from dependencies and config files"
  - "Pattern 4: Architecture pattern identification from code organization"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 08 Plan 01: Cartographer Agent Summary

**Brownfield codebase analysis agent with 4-phase progressive scanning, CLI-based technology detection, and structured codebase-understanding.md output**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T03:17:25Z
- **Completed:** 2026-02-03T03:22:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created cartographer agent prompt file with YAML frontmatter
- Defined 4-phase scanning strategy (metadata → structure → technology → architecture)
- Established file exclusion rules for binaries, generated files, and dependencies
- Specified structured output format for codebase-understanding.md
- Implemented state management for resume capability on large codebases
- Documented quality rules requiring project-specific findings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cartographer agent prompt file** - `5aff51c` (feat)

**Note:** File was previously committed in context of 08-02 but meets all 08-01 requirements.

## Files Created/Modified
- `templates/agents/banneker-cartographer.md` - Cartographer agent prompt file with 4-phase scanning strategy, file exclusion rules, output structure, state management, and completion protocol

## Decisions Made

**CLI-based analysis approach:**
- Use Glob/Grep/Read tools for file scanning (zero runtime dependencies)
- No JavaScript execution - pure prompt-based agent instructions
- Enable multi-language project support (Node.js, Rust, Python, Go, Java, PHP, C#)

**4-phase progressive scanning:**
- Phase 1: Project metadata extraction (detect type, framework, version)
- Phase 2: Directory structure mapping (tree generation with exclusions)
- Phase 3: Technology and pattern detection (dependencies, config files)
- Phase 4: Architecture pattern identification (component structure, API patterns, data flow)

**State management strategy:**
- Write progress to `.banneker/state/document-state.md` after each phase
- Enable resume from last incomplete phase on context exhaustion
- Delete state file only on successful completion

**Quality enforcement:**
- Every statement must be project-specific (no "e.g." or "typically")
- List actual file paths found in codebase
- Report actual dependency versions from lockfiles
- Write "None detected" for empty sections (no placeholders)

**File exclusion rules:**
- Skip directories: node_modules, .git, dist, build, coverage, __pycache__, .venv, target
- Skip binaries: images, fonts, archives, executables, documents
- Skip generated files: .min.js, bundle.*, chunk.*, source maps
- Skip files over 500KB (likely generated)

## Deviations from Plan

None - plan executed exactly as written. File meets all requirements:
- Valid YAML frontmatter with name "banneker-cartographer"
- Contains all 7 required sections (Role, Scan Strategy, File Exclusion, Output Structure, State Management, Quality Rules, Completion Protocol)
- Does NOT reference survey.json or architecture-decisions.json (brownfield analysis works with raw codebases)
- References correct output paths (.banneker/codebase-understanding.md, .banneker/state/document-state.md)
- No JavaScript execution code (pure markdown prompt instructions)

## Issues Encountered

None - straightforward agent file creation following established pattern from banneker-exporter.md and banneker-surveyor.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 08-02:** Cartographer agent exists and can be tested against real codebases.

**Ready for 08-03:** Document command orchestrator can reference cartographer agent template.

**Ready for 08-04:** Manifest update can include cartographer agent file for installer tracking.

**Brownfield onboarding enabled:** Banneker can now analyze existing codebases, not just greenfield surveys. The cartographer produces structured understanding documents that downstream agents (architect, roadmap, appendix) can consume.

**No blockers or concerns.**

---
*Phase: 08-brownfield-analysis-audit*
*Completed: 2026-02-03*
