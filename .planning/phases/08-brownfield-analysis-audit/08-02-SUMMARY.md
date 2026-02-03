---
phase: 08-brownfield-analysis-audit
plan: 02
subsystem: quality-assurance
tags: [auditor, completeness-rubric, plan-evaluation, gap-analysis]

# Dependency graph
requires:
  - phase: 07-export-feed-system
    provides: Agent file patterns and config file structure
  - phase: 04-document-generation
    provides: Quality validation patterns and rubric-based evaluation approach
provides:
  - Auditor agent for plan completeness evaluation
  - Engineering completeness rubric with 10 weighted categories
  - Structured audit-report.json and audit-report.md output formats
  - Gap analysis with prioritized, actionable recommendations
affects: [08-03, 08-04, brownfield-documentation, plan-quality-checks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rubric-based plan evaluation with weighted scoring (10 categories)"
    - "Fuzzy matching with 2+ detection terms threshold per criterion"
    - "Dual output format (JSON for programmatic, Markdown for human review)"
    - "Priority-based gap analysis (HIGH/MEDIUM/LOW based on category status)"
    - "Context-aware evaluation using ROADMAP.md for phase boundaries"

key-files:
  created:
    - templates/config/completeness-rubric.md
    - templates/agents/banneker-auditor.md
  modified: []

key-decisions:
  - "10-category rubric covers engineering completeness: roles, data, API, auth, infrastructure, errors, testing, security, performance, deployment"
  - "Security weighted 2.0 (critical), core concerns 1.5, standard categories 1.0"
  - "Fuzzy matching with 2+ detection terms prevents overly strict evaluation"
  - "Dual output format (JSON + Markdown) serves both programmatic and human use cases"
  - "ROADMAP.md provides phase context to prevent penalizing Phase 1 for Phase 5 topics"
  - "Gap recommendations must be specific and actionable, not vague suggestions"

patterns-established:
  - "Pattern 1: Config files have NO YAML frontmatter (pure markdown)"
  - "Pattern 2: Agent files have YAML frontmatter with name and description"
  - "Pattern 3: Detection guidance with search terms enables repeatable evaluation"
  - "Pattern 4: Priority levels (HIGH/MEDIUM/LOW) based on category completion status"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 08 Plan 02: Auditor Agent and Completeness Rubric Summary

**Plan evaluation sub-agent with rubric-based scoring across 10 weighted engineering categories, fuzzy-matching criteria detection, and dual-format output (JSON + Markdown) with prioritized gap analysis**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T03:18:23Z
- **Completed:** 2026-02-03T03:22:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created engineering completeness rubric with 10 weighted categories (40 total criteria)
- Defined detection guidance with search terms for each criterion (enables repeatable evaluation)
- Created auditor agent prompt with 9 sections covering full evaluation workflow
- Specified dual output format: audit-report.json (structured) and audit-report.md (human-readable)
- Established gap analysis with prioritized, actionable recommendations
- Implemented context awareness via ROADMAP.md for phase boundary understanding

## Task Commits

Each task was committed atomically:

1. **Task 1: Create completeness rubric config file** - `5aff51c` (feat)
2. **Task 2: Create auditor agent prompt file** - `ae11a17` (feat)

**Note:** Task 2 file was created in a previous execution (commit ae11a17), but it meets all plan requirements. Task 1 was executed in this session.

## Files Created/Modified

- `templates/config/completeness-rubric.md` - Engineering completeness rubric with 10 weighted categories (ROLES-ACTORS, DATA-MODEL, API-SURFACE, AUTH-AUTHZ, INFRASTRUCTURE, ERROR-HANDLING, TESTING, SECURITY, PERFORMANCE, DEPLOYMENT), 3-5 criteria per category with detection guidance, scoring formulas, and grade/status mappings. Pure markdown (no frontmatter).

- `templates/agents/banneker-auditor.md` - Auditor agent prompt with YAML frontmatter (name: banneker-auditor). Contains 9 sections: Role and Context, Input Loading, Evaluation Process, Scoring Logic, Gap Analysis, Output Format - JSON, Output Format - Markdown, Quality Rules, Completion Protocol. Loads plan files and rubric, evaluates criteria using fuzzy matching (2+ detection terms threshold), computes weighted scores, generates prioritized recommendations, produces dual output.

## Decisions Made

**10-category rubric structure:**
- Selected 10 engineering categories covering all critical planning areas
- Weighted categories by importance: SECURITY (2.0), core concerns (1.5), standard (1.0)
- Each category has 3-5 specific, measurable criteria with detection guidance

**Fuzzy matching evaluation:**
- Criterion met if 2+ detection terms found (not exact keyword matching)
- Enables semantic equivalents (e.g., "authentication" matches "auth", "login")
- Prevents overly strict evaluation that penalizes vocabulary differences

**Dual output format:**
- JSON for programmatic consumption (CI/CD integration, tooling)
- Markdown for human review (detailed gap analysis, recommendations)
- Both outputs stored in .banneker/ directory

**Context-aware evaluation:**
- Optionally load ROADMAP.md to understand phase boundaries
- Don't penalize Phase 1 plans for Phase 5 topics (deferred items)
- Note deferred items in gap details but adjust priority accordingly

**Recommendation quality:**
- Must be specific: "Add deployment environments (dev, staging, prod) to deployment section"
- Must be actionable: clear next step, not vague advice
- Priority based on category status: HIGH (<50%), MEDIUM (50-69%), LOW (70-89%)

## Deviations from Plan

None - plan executed exactly as written.

Both files follow established patterns:
- Config file (completeness-rubric.md) has NO frontmatter, pure markdown
- Agent file (banneker-auditor.md) has valid YAML frontmatter with name and description
- Rubric contains all 10 categories with weights, criteria, and detection guidance
- Auditor references rubric and defines both output formats (JSON + Markdown)
- All 9 required sections present in auditor agent
- No executable JavaScript (pure markdown prompt instructions)

## Issues Encountered

**File pre-existence in git history:**
- Task 2 file (banneker-auditor.md) was already committed in ae11a17 from a previous execution
- File content matches plan requirements exactly
- No changes needed - file already meets all specifications
- Task 1 file (completeness-rubric.md) was created in this session (commit 5aff51c)

This is not a problem - both files exist and meet all plan requirements.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 08-03:** Auditor agent exists and can be integrated into command orchestrator.

**Ready for 08-04:** Manifest update can include auditor agent and completeness rubric files for installer tracking.

**Plan evaluation capability enabled:** Banneker can now audit engineering plans against the completeness rubric, producing scored coverage reports with gap analysis and actionable recommendations. The auditor serves as the core agent for `/banneker:audit` command.

**Quality assurance workflow complete:** The auditor + rubric combination provides objective plan quality assessment, helping teams identify missing engineering considerations before implementation begins.

**No blockers or concerns.**

---
*Phase: 08-brownfield-analysis-audit*
*Completed: 2026-02-03*
