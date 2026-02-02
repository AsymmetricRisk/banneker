---
phase: 04-document-generation
plan: 01
subsystem: document-generation
tags: [architect, writer, document-catalog, survey-processing, term-registry, validation]

# Dependency graph
requires:
  - phase: 03-survey-pipeline
    provides: Survey agent that generates survey.json and architecture-decisions.json
provides:
  - Architect agent that orchestrates document generation from survey data
  - Document catalog with conditional selection rules for 10 document types
  - Term registry for naming consistency enforcement across documents
  - 4-wave dependency-ordered generation workflow
  - Validation framework (placeholder detection, term consistency, decision citations)
affects: [04-02-writer-agent, roadmap-generation, phase-planning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Signal detection rules for conditional document generation
    - Term registry pattern for consistency enforcement
    - Multi-wave dependency resolution for ordered generation
    - Three-tier validation (placeholders, terms, citations)

key-files:
  created:
    - templates/agents/banneker-architect.md
    - templates/config/document-catalog.md
  modified: []

key-decisions:
  - "10 document types: 3 always-generated (TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE) + 7 conditional"
  - "Signal detection uses survey.json field patterns to determine applicability"
  - "Term registry built from survey.json ensures consistent naming across all documents"
  - "4-wave generation resolves dependencies (e.g., DEVELOPER-HANDBOOK requires INFRASTRUCTURE-ARCHITECTURE)"
  - "Validation rejects documents with placeholders or term inconsistencies; warns on invalid decision citations"

patterns-established:
  - "Architect as orchestrator, writer as content generator (separation of concerns)"
  - "Conditional document generation based on project type signals (not one-size-fits-all)"
  - "State management for resume capability after interruption"
  - "Term registry extracted once, shared with all writer agents for consistency"

# Metrics
duration: 4min
completed: 2026-02-02
---

# Phase 04 Plan 01: Architect Agent & Document Catalog Summary

**Architect agent with signal detection, term registry, 4-wave dependency resolution, and 3-tier validation for generating 10 project-specific planning documents**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-02T22:34:44Z
- **Completed:** 2026-02-02T22:38:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created document catalog defining 10 document types (3 always-generated, 7 conditional) with signal detection rules, section structures, and quality standards
- Created architect sub-agent that orchestrates document generation: reads survey.json, applies conditional rules, builds term registry, resolves 4-wave dependency order, spawns writer agents, validates outputs
- Established validation framework enforcing REQ-DOCS-003 (placeholder detection), REQ-DOCS-004 (term consistency), and REQ-DOCS-005 (decision citation verification)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create document-catalog.md reference file** - `d4931ed` (feat)
2. **Task 2: Create banneker-architect.md sub-agent** - `7916d8e` (feat)

**Plan metadata:** (included in task commits)

## Files Created/Modified

- `templates/config/document-catalog.md` - Reference file defining 10 document types with conditional selection rules, dependency graph (4 waves), quality standards (placeholder patterns, term consistency, decision citation format)
- `templates/agents/banneker-architect.md` - Architect sub-agent that determines document set via signal detection, builds term registry from survey.json, resolves dependency order, spawns banneker-writer agents, validates outputs against quality standards, manages state for resume

## Decisions Made

**Conditional document generation approach:**
- Not all documents are relevant for all projects (e.g., OPERATIONS-RUNBOOK only for hosted backends, LEGAL-PLAN only if legal coverage exists)
- Signal detection rules check survey.json fields to determine applicability (e.g., TECHNICAL-DRAFT requires backend with data stores)
- Keeps output focused and relevant to project type

**Term registry for consistency:**
- Extract canonical names once from survey.json (project name, actor names, technology names, entity names, integration names)
- Pass to all writer agents to enforce consistent terminology
- Prevents synonyms ("user" vs "customer"), abbreviations ("DB" vs "database"), capitalization inconsistencies ("react" vs "React")

**Dependency-ordered generation:**
- Some documents reference content from others (DEVELOPER-HANDBOOK needs INFRASTRUCTURE-ARCHITECTURE for architecture overview)
- 4-wave approach ensures dependencies are satisfied: Wave 1 (TECHNICAL-SUMMARY, STACK) → Wave 2 (TECHNICAL-DRAFT, INFRASTRUCTURE-ARCHITECTURE) → Wave 3 (DEVELOPER-HANDBOOK) → Wave 4 (independent documents)

**Validation prevents incomplete output:**
- Placeholder check rejects documents with TODO/TBD/FIXME/template syntax (ensures all sections are completed)
- Term consistency check rejects documents that don't match term registry (enforces naming standards)
- Decision citation check warns if DEC-XXX references don't exist (helps catch documentation errors)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 04 Plan 02:** Writer agent implementation
- Architect agent complete with clear spawning interface for writer
- Document catalog provides section structures writer needs to populate
- Term registry pattern established for writer to consume
- Validation requirements defined for writer output

**Next steps:**
1. Implement banneker-writer agent that generates document content using survey data
2. Writer will receive: document type, survey data, decisions, term registry, document structure, dependencies
3. Writer will produce: narrative markdown content matching structure, using term registry, citing decisions with (DEC-XXX)

---
*Phase: 04-document-generation*
*Completed: 2026-02-02*
