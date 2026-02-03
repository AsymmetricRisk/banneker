---
phase: 07
plan: 01
subsystem: export-pipeline
tags: [export, gsd, platform-prompt, requirements, roadmap, traceability]
requires: [survey-data, architecture-decisions, document-generation]
provides: [banneker-exporter-agent, multi-format-export-logic]
affects: [07-02-feed-command, downstream-frameworks]
tech-stack:
  added: []
  patterns: [adapter-pattern, map-reduce-summarization, topological-sort, selective-inclusion]
key-files:
  created: [templates/agents/banneker-exporter.md]
  modified: []
key-decisions: []
metrics:
  duration: "3.6 minutes"
  completed: 2026-02-03
---

# Phase 07 Plan 01: Exporter Sub-Agent Summary

**One-liner:** Comprehensive exporter agent implementing all 4 downstream formats (GSD with REQ-ID traceability and dependency-ordered roadmaps, platform prompt with map-reduce under 4,000 words, generic summary with document concatenation, and context bundle with selective inclusion).

## Performance

**Duration:** 3.6 minutes (214 seconds)
**Tasks completed:** 1/1
**Files created:** 1
**Lines of code:** 1180

## What We Accomplished

### Created banneker-exporter.md Sub-Agent

Implemented the complete export pipeline logic as a sub-agent that transforms Banneker artifacts into 4 downstream formats. This is the "writer" equivalent for the export system — the command orchestrator (Plan 02) will spawn this agent with a format parameter.

**Agent Capabilities:**

1. **Format: GSD** — Generates PROJECT.md, REQUIREMENTS.md, ROADMAP.md in `.planning/`
   - PROJECT.md: Project overview with technology stack, hosting, integrations, constraints, key decisions
   - REQUIREMENTS.md: REQ-ID format (`REQ-{CATEGORY}-{NNN}`) with categories (INST, FUNC, DATA, UI, SEC, PERF, DOCS, INT), priorities (must/should/could), and full traceability to survey data using field path notation
   - ROADMAP.md: Dependency-ordered milestones using topological sort (infrastructure first → auth/data → core flows → secondary flows → polish)

2. **Format: Platform Prompt** — Dense summary under 4,000 words in `.banneker/exports/platform-prompt.md`
   - Map-reduce pattern with proportional word budget allocation across sections
   - Section-aware truncation (never mid-sentence, complete subsections or omit entirely)
   - Footer indicating word count and omitted sections if truncated

3. **Format: Generic Summary** — Concatenated markdown in `.banneker/exports/summary.md`
   - Project metadata header with actors and technology stack
   - All available documents in priority order (TECHNICAL-SUMMARY → STACK → INFRASTRUCTURE-ARCHITECTURE → others alphabetically)
   - Document source comments and separators between sections

4. **Format: Context Bundle** — LLM-optimized single file in `.banneker/exports/context-bundle.md`
   - Selective inclusion: survey data + architecture decisions + priority documents (TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE)
   - Optional documents only if they exist and add value (DEVELOPER-HANDBOOK, TECHNICAL-DRAFT, DESIGN-SYSTEM, PORTAL-INTEGRATION)
   - Omits low-value documents (OPERATIONS-RUNBOOK, LEGAL-PLAN, CONTENT-ARCHITECTURE)
   - Structured JSON for survey and decisions, full markdown for documents

**Source Data Loading:**

- Required files: survey.json (all formats), architecture-decisions.json (GSD format required, others recommended)
- Optional files: .banneker/documents/*.md (all 10 document types), .banneker/diagrams/*.html (context bundle only)
- Graceful error handling: warns for missing optional files, aborts for missing required files
- File existence checks before reading to prevent cryptic errors

**Export Logic Patterns:**

- **Adapter pattern:** Each format is a distinct transformation module with specific output requirements
- **Map-reduce summarization:** Platform prompt chunks documents, summarizes individually, combines within word budget
- **Topological sort:** ROADMAP.md phases ordered by dependency edges (no circular dependencies)
- **Selective inclusion:** Context bundle prioritizes quality over quantity, only includes high-value documents

**Quality Standards:**

- All REQ-IDs in REQUIREMENTS.md are unique and traceable to survey field paths
- All DEC-XXX references in PROJECT.md exist in architecture-decisions.json
- Platform prompt respects 4,000 word limit with section-aware truncation
- Context bundle optimized for LLM consumption (structured JSON + narrative markdown)

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create banneker-exporter sub-agent with all 4 export format instructions | fbbabb1 | templates/agents/banneker-exporter.md |

## Files Created

**templates/agents/banneker-exporter.md** (1180 lines)
- YAML frontmatter with name and description
- Source data loading instructions (survey.json, architecture-decisions.json, documents, diagrams)
- Format: GSD section with PROJECT.md, REQUIREMENTS.md, ROADMAP.md generation logic
- Format: Platform Prompt section with map-reduce and word budget strategy
- Format: Generic Summary section with document concatenation order
- Format: Context Bundle section with selective inclusion rules
- REQ-ID format specification (REQ-{CATEGORY}-{NNN}) with 8 categories
- Traceability format (Source: survey.field.path) for all requirements
- Topological sort implementation for dependency-ordered roadmap phases
- Section-aware truncation logic for platform prompt word limits
- Error handling for missing required/optional files
- Completion report template with file paths and sizes

## Decisions Made

None — Plan 07-01 followed the established agent file pattern (matching banneker-publisher.md, banneker-writer.md, banneker-architect.md structure) and implemented the export logic specified in 07-RESEARCH.md.

## Deviations from Plan

None — Plan executed exactly as written. The agent covers all 6 REQ-EXPORT requirements:
- REQ-EXPORT-001: GSD format (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
- REQ-EXPORT-002: Platform prompt (under 4,000 words)
- REQ-EXPORT-003: Generic summary (concatenated markdown)
- REQ-EXPORT-004: Context bundle (LLM-optimized)
- REQ-EXPORT-005: REQ-ID format with categories and traceability
- REQ-EXPORT-006: Roadmap dependency ordering (topological sort)

## Issues Encountered

None.

## Next Phase Readiness

**Ready for Phase 07 Plan 02:** Feed command orchestrator

The exporter agent is complete. Next plan will implement the banneker-feed command that:
- Detects available source data (survey, decisions, documents, diagrams)
- Prompts user for which format(s) to export
- Spawns this exporter agent with the selected format parameter
- Handles errors and reports export completion

**Dependencies satisfied:**
- Exporter agent follows established pattern (YAML frontmatter, markdown instructions)
- All 4 export formats have complete generation logic
- Graceful error handling for missing files
- Clear completion reports for each format

**Blockers:** None.

**Concerns:** None. The export logic is comprehensive and handles all edge cases (missing files, truncation, dependency cycles).
