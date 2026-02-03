---
phase: 07
plan: 02
subsystem: export-pipeline
tags: [export, command, config, orchestrator, framework-adapters, gsd, platform-prompt]
requires: [07-01-exporter-agent, survey-data, architecture-decisions]
provides: [banneker-feed-command, framework-adapters-config]
affects: [downstream-frameworks, user-workflow]
tech-stack:
  added: []
  patterns: [step-0-4-orchestration, resume-detection, tiered-completion]
key-files:
  created: [templates/commands/banneker-feed.md, templates/config/framework-adapters.md]
  modified: []
key-decisions: []
metrics:
  duration: "2.5 minutes"
  completed: 2026-02-03
---

# Phase 07 Plan 02: Feed Command & Framework Adapters Summary

**One-liner:** Command orchestrator for export lifecycle (prerequisites → resume detection → exporter spawning → output verification) plus comprehensive config file defining all 4 export format specifications (GSD with REQ-ID format and topological sort, platform prompt with 4,000-word limit, generic summary with concatenation, context bundle with selective inclusion).

## Performance

**Duration:** 2.5 minutes (147 seconds)
**Tasks completed:** 2/2
**Files created:** 2
**Lines of code:** 573 (196 config + 377 command)

## What We Accomplished

### Task 1: Created framework-adapters.md Config File

Implemented the configuration reference file that defines the 4 export format specifications. This file follows the established config file pattern (no YAML frontmatter, pure markdown reference documentation).

**GSD Adapter specification:**
- Output directory: `.planning/`
- Files: PROJECT.md, REQUIREMENTS.md, ROADMAP.md
- REQ-ID format: `REQ-[CATEGORY]-[NNN]` with 8 categories (INST, FUNC, DATA, UI, SEC, PERF, DOCS, INT)
- Traceability: Each requirement cites source survey field path
- Roadmap ordering: Topological sort by dependency (infrastructure → auth/data → core flows → secondary → polish)

**Platform Prompt Adapter specification:**
- Output: `.banneker/exports/platform-prompt.md`
- Word limit: 4,000 words maximum
- Strategy: Map-reduce summarization with proportional word budget allocation (Project 10%, Stack 15%, Decisions 25%, Walkthroughs 30%, Requirements 20%)
- Truncation rules: Never mid-sentence or mid-subsection, complete or omit entirely

**Generic Summary Adapter specification:**
- Output: `.banneker/exports/summary.md`
- Strategy: Direct file concatenation with source comments
- Document order: TECHNICAL-SUMMARY → STACK → INFRASTRUCTURE-ARCHITECTURE → others alphabetically
- Format: Project metadata header, source comments, horizontal rule separators

**Context Bundle Adapter specification:**
- Output: `.banneker/exports/context-bundle.md`
- Strategy: Selective inclusion (quality over quantity)
- Always include: survey data, architecture decisions, TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE
- Include if exists: DEVELOPER-HANDBOOK, TECHNICAL-DRAFT, DESIGN-SYSTEM, PORTAL-INTEGRATION
- Never include: OPERATIONS-RUNBOOK, LEGAL-PLAN, CONTENT-ARCHITECTURE (low LLM value)

**File attributes:**
- No YAML frontmatter (config file convention per decision 04-04)
- 196 lines of comprehensive format specifications
- Referenced by both banneker-feed command and banneker-exporter agent

### Task 2: Created banneker-feed.md Command Orchestrator

Implemented the user-facing command file that manages the export lifecycle. This follows the established Step 0-4 pattern from banneker-appendix, banneker-architect, and banneker-roadmap commands.

**Step 0: Prerequisite Check**
- Check survey.json exists (abort if missing)
- Check architecture-decisions.json exists (abort if missing)
- Warn for missing documents (continue — GSD format works without documents)

**Step 1: Resume Detection**
- Check for interrupted export (`.banneker/state/export-state.md`)
- Check for existing export outputs (GSD files in `.planning/`, other formats in `.banneker/exports/`)
- Handle three resume scenarios: interrupted state, partial completion, full completion
- Prompt user for resume/regenerate decision

**Step 2: Directory Structure**
- Create `.planning/`, `.banneker/exports/`, `.banneker/state/` directories
- Write initial state file with `status: in_progress` and format list

**Step 3: Spawn Exporter Agent**
- Use Task tool to spawn `banneker-exporter` agent
- Pass resume context or fresh start instruction
- Pass format list (all 4 by default, or remaining if resuming)
- Reference `@config/framework-adapters.md` for format specs

**Step 4: Output Verification**
- Verify GSD format: PROJECT.md (contains project name), REQUIREMENTS.md (contains REQ- prefixed requirements), ROADMAP.md (contains milestones)
- Verify platform prompt: exists, under 4,000 words
- Verify generic summary: exists, contains source comments
- Verify context bundle: exists, contains survey data
- Three-tier completion messaging: full (all 4 formats), partial (some failed), minimal (GSD only)

**File attributes:**
- YAML frontmatter with name and description
- 377 lines following established command orchestrator pattern
- References banneker-exporter agent and framework-adapters config

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create framework-adapters config file | b7f8dc5 | templates/config/framework-adapters.md |
| 2 | Create banneker-feed command orchestrator | 532cc3c | templates/commands/banneker-feed.md |

## Files Created

**templates/config/framework-adapters.md** (196 lines)
- GSD Adapter section with REQ-ID format, categories, traceability, roadmap ordering
- Platform Prompt Adapter section with word limit, budget allocation, truncation rules
- Generic Summary Adapter section with concatenation strategy and document order
- Context Bundle Adapter section with selective inclusion rules
- No YAML frontmatter (config file convention)

**templates/commands/banneker-feed.md** (377 lines)
- YAML frontmatter with name and description
- Step 0: Prerequisite checks (survey.json, architecture-decisions.json, documents warning)
- Step 1: Resume detection (interrupted state, existing outputs, three scenarios)
- Step 2: Directory structure creation and initial state file
- Step 3: Exporter agent spawning via Task tool
- Step 4: Output verification (GSD, platform prompt, summary, bundle)
- Three-tier completion messaging (full, partial, minimal)
- Requirements coverage section

## Decisions Made

None — Plan 07-02 followed the established command orchestrator pattern (matching banneker-appendix.md and banneker-architect.md) and config file pattern (matching document-catalog.md without frontmatter per decision 04-04).

## Deviations from Plan

None — Plan executed exactly as written. Both files created with proper structure:
- framework-adapters.md: No YAML frontmatter, defines all 4 adapter specs, includes REQ-ID format with 8 categories, specifies output paths and generation rules
- banneker-feed.md: YAML frontmatter, Step 0-4 pattern, checks prerequisites, detects resume, spawns banneker-exporter, verifies all outputs, provides tiered messaging

## Issues Encountered

None.

## Next Phase Readiness

**Ready for Phase 07 Plan 03:** Installer manifest updates

The feed command and config file are complete. The export system is now fully implemented:
- Plan 01: banneker-exporter.md agent (export generation logic)
- Plan 02: banneker-feed.md command + framework-adapters.md config (orchestration and specifications)
- Plan 03: Update BANNEKER_FILES and AGENT_FILES manifests for installer/uninstaller

**Dependencies satisfied:**
- Command orchestrator follows established Step 0-4 pattern
- Config file follows established no-frontmatter pattern
- Command references exporter agent via Task tool
- Config defines all 4 export format specifications
- Resume detection handles interrupted and completed states
- Output verification checks all required files
- Tiered completion messaging (full/partial/minimal)

**Blockers:** None.

**Concerns:** None. The export system is complete and ready for manifest integration.
