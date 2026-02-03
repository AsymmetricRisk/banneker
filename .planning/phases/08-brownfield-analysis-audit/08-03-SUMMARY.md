---
phase: 08-brownfield-analysis-audit
plan: 03
subsystem: command-layer
type: feature

tags: [orchestrator, command-files, brownfield, audit, lifecycle-management]

requires: ["08-01", "08-02"]
provides:
  - "/banneker:document command orchestrator"
  - "/banneker:audit command orchestrator"
affects: ["installer-manifest"]

tech-stack:
  added: []
  patterns: ["command-lifecycle-pattern", "prerequisite-check", "resume-detection", "spawn-verify"]

key-files:
  created:
    - templates/commands/banneker-document.md
    - templates/commands/banneker-audit.md
  modified: []

decisions:
  - id: "banneker-document-no-survey-prereq"
    summary: "Document command works without survey.json"
    rationale: "Brownfield-first design - analyzes raw codebases"
  - id: "banneker-audit-multi-source-discovery"
    summary: "Audit command discovers plans from 3 sources"
    rationale: "Works with GSD, Banneker, or standalone plan files"
  - id: "command-orchestrators-delegate-to-agents"
    summary: "Command files handle lifecycle, agents handle work"
    rationale: "Clean separation: orchestrators manage state/resume/verify, agents do domain work"

metrics:
  duration: "~4 minutes"
  complexity: low
  files_created: 2
  lines_added: 393

completed: 2026-02-03
---

# Phase 08 Plan 03: Command Orchestrator Files Summary

**One-liner:** Created `/banneker:document` and `/banneker:audit` command orchestrators following established lifecycle pattern with brownfield-first prerequisite checks.

## What Was Built

Created two command orchestrator files that serve as user-facing entry points for codebase analysis and plan evaluation:

1. **banneker-document.md** - Manages codebase analysis lifecycle
   - Prerequisite: Project indicators (package.json, Cargo.toml, etc.) - NO survey.json required
   - Spawns banneker-cartographer agent for scanning
   - Handles interrupted scans and existing analyses
   - Verifies output and state file cleanup

2. **banneker-audit.md** - Manages plan evaluation lifecycle
   - Prerequisite: Plan files from .planning/, .banneker/, or current directory
   - Spawns banneker-auditor agent with plan file list and rubric config
   - Handles existing report detection
   - Displays grade and percentage on completion

Both commands follow the established 4-step lifecycle pattern:
- Step 0: Prerequisite Check (MANDATORY)
- Step 1: Resume Detection
- Step 2: Ensure Directory Structure / Spawn Sub-Agent
- Step 3: Completion Verification

## Architecture & Design

### Command Lifecycle Pattern

All Banneker commands follow a consistent orchestrator pattern:

```
User invokes /banneker:command
  ↓
Step 0: Check prerequisites (data files, project indicators)
  ↓
Step 1: Detect resume conditions (state files, existing outputs)
  ↓
Step 2: Spawn sub-agent via Task tool
  ↓
Sub-agent executes domain work
  ↓
Step 3: Verify outputs, display results
  ↓
Clean up state on success, preserve on failure
```

### Brownfield-First Design

**banneker-document.md** breaks from the typical survey.json prerequisite:
- Works on raw codebases with zero Banneker state
- Only checks for project indicators (build files, src/ directory)
- Designed for onboarding existing projects

**banneker-audit.md** similarly works without survey data:
- Discovers plan files from multiple sources
- Evaluates any markdown plan files against rubric
- Works with GSD, Banneker, or standalone plans

### Orchestrator Responsibilities

Command files handle **lifecycle management only**:
1. Prerequisite validation
2. Resume/overwrite detection
3. Spawning sub-agents via Task tool
4. Completion verification
5. User messaging

Command files do NOT contain:
- Domain logic (scanning, scoring, analysis)
- File processing algorithms
- Data transformations

All domain work lives in the sub-agents (banneker-cartographer, banneker-auditor).

## Key Implementation Details

### banneker-document.md

**Prerequisite Check:**
```bash
test -f package.json || test -f Cargo.toml || test -f pyproject.toml || test -f go.mod || test -f Makefile || test -f pom.xml || test -f build.gradle || test -f *.sln || test -d src
```
Checks for project indicators, NOT survey.json.

**Three Resume Conditions:**
1. Interrupted scan (document-state.md exists)
2. Existing analysis (codebase-understanding.md exists)
3. Fresh start (neither exists)

**Completion Verification:**
- Checks codebase-understanding.md exists and has content
- Checks document-state.md does NOT exist (cleanup = success)
- Partial completion (both exist) = context exhaustion, suggests resume

### banneker-audit.md

**Multi-Source Plan Discovery:**
```bash
# GSD-style projects
find .planning/phases -name "*PLAN.md" 2>/dev/null

# Banneker projects
ls .banneker/*.md 2>/dev/null

# Loose plan files
ls *[Pp][Ll][Aa][Nn]*.md 2>/dev/null
```

**Resume Detection:**
- Checks for existing audit-report.json
- Offers re-audit or keep existing report
- No state file (audit is single-shot, not incremental)

**Completion Verification:**
- Validates both JSON and Markdown reports
- Extracts and displays grade/percentage
- Grade-based messaging (warns if C or below)

## Decisions Made

### 1. Document Command Works Without survey.json

**Decision:** banneker-document.md does NOT require survey.json as prerequisite.

**Rationale:**
- Designed for brownfield projects with no prior Banneker state
- First step in onboarding existing codebases
- Only checks for project indicators (build files, package managers)

**Impact:**
- Enables /banneker:document as entry point for brownfield analysis
- Different prerequisite pattern than survey/architect/feed commands
- Cartographer agent must handle projects with zero context

### 2. Audit Command Discovers Plans from Multiple Sources

**Decision:** banneker-audit.md searches 3 locations for plan files:
1. .planning/phases/*PLAN.md (GSD projects)
2. .banneker/*.md (Banneker projects)
3. *plan*.md (standalone files)

**Rationale:**
- Works across different project structures
- Enables audit on partial Banneker setups
- Supports evaluating individual plan files

**Impact:**
- More flexible than hardcoded .planning/ path
- Requires plan file discovery logic in Step 0
- Lists discovered plans to user before auditing

### 3. Command Orchestrators Delegate All Domain Work

**Decision:** Command files contain ZERO domain logic. All work delegated to sub-agents.

**Rationale:**
- Separation of concerns: lifecycle vs. domain logic
- Agents are testable in isolation
- Commands stay lean and consistent
- Easier to maintain (change scanning logic = edit agent, not command)

**Impact:**
- Command files average ~180-200 lines (lifecycle only)
- Agent files contain 500-1000+ lines (domain work)
- Clear boundary: commands orchestrate, agents execute

## Testing & Validation

### Verification Performed

**banneker-document.md:**
- ✓ Valid YAML frontmatter with name: banneker-document
- ✓ All 4 steps present (Step 0-3)
- ✓ Step 0 checks project indicators (NOT survey.json)
- ✓ Step 1 handles 3 resume conditions
- ✓ Step 2 spawns banneker-cartographer agent
- ✓ Step 3 verifies output and state cleanup

**banneker-audit.md:**
- ✓ Valid YAML frontmatter with name: banneker-audit
- ✓ All 4 steps present (Step 0-3)
- ✓ Step 0 discovers plan files from 3 sources
- ✓ Step 1 handles existing report detection
- ✓ Step 2 spawns banneker-auditor with plan list and rubric path
- ✓ Step 3 reads and displays grade from JSON report

### What Still Needs Testing

Runtime testing will occur when:
1. **banneker-document.md** tested on actual codebase (requires cartographer agent)
2. **banneker-audit.md** tested on plan files (requires auditor agent and rubric)
3. Resume conditions tested with interrupted state files
4. Completion verification tested with actual outputs

These commands are orchestrators only - they cannot be unit tested in isolation. Integration testing happens when sub-agents are available.

## Next Phase Readiness

### Unblocks

- Phase 08 Plan 04: Manifest and Test Updates (requires these command files for manifest)

### Dependencies

- **Requires cartographer agent** (08-01) for /banneker:document to function
- **Requires auditor agent** (08-02) for /banneker:audit to function
- **Requires completeness rubric** (08-02) for auditor scoring

### Blockers/Concerns

None. Both command files are complete and follow established patterns.

## Deviations from Plan

None - plan executed exactly as written.

Both tasks completed without deviations:
1. Created banneker-document.md with lifecycle pattern ✓
2. Created banneker-audit.md with lifecycle pattern ✓

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 574665a | feat | Create document command orchestrator |
| 1a6785a | feat | Create audit command orchestrator |

## File Manifest

**Created:**
- `/home/daniel/Documents/banneker/templates/commands/banneker-document.md` (186 lines)
- `/home/daniel/Documents/banneker/templates/commands/banneker-audit.md` (207 lines)

**Modified:**
- None

## What's Next

**Immediate next step:** Plan 08-04 - Manifest and Test Updates

1. Add banneker-document.md and banneker-audit.md to BANNEKER_FILES manifest
2. Add validation tests for both command files
3. Verify frontmatter format and Step 0-3 structure

**Phase 08 completion:** After Plan 08-04, Phase 08 (Brownfield Analysis Audit) is complete.

**Phase 09:** Integration & Publishing (installer updates, npm publish workflow)
