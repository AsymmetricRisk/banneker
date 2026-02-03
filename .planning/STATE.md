# Banneker — State

## Current Position

Phase: 09 of 10 (Polish and Operations)
Plan: 03 of 04 complete
Status: In progress
Last activity: 2026-02-03 — Completed 09-03-PLAN.md (Security and Changelog Automation)

Progress: ███████████████ 97% (29/30 plans estimated)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** Transform structured discovery interviews into engineering plans, architecture diagrams, and agent-ready HTML appendices
**Current focus:** Milestone 1 — Package Scaffolding & Installer

## Current Milestone: v0.2.0

**Goal:** Build Banneker from specification to published npm package

**Current milestone scope:** Milestone 1 — Package Scaffolding & Installer

## Accumulated Context

- Zero runtime dependencies constraint (Node.js built-ins only)
- Multi-runtime support from day one (Claude Code, OpenCode, Gemini)
- Installer writes to `~/` — needs high confidence before publishing
- Pre-1.0 versioning at 0.2.0

## Decisions Ledger

| Phase-Plan | Decision | Impact | Date |
|------------|----------|--------|------|
| 01-01 | Use ES modules throughout package | All lib modules use ES import/export syntax | 2026-02-02 |
| 01-01 | Multi-runtime support baked into constants | RUNTIMES object provides centralized runtime configs | 2026-02-02 |
| 01-02 | Use Node.js built-in test runner | Zero test dependencies, use node:test for TDD | 2026-02-02 |
| 01-02 | Import RUNTIME_CHOICES in flags.js | Single source of truth for runtime validation | 2026-02-02 |
| 01-02 | Optional homeDir parameter in paths.js | Enables deterministic testing with mock directories | 2026-02-02 |
| 01-03 | Prompt retry logic with max 3 attempts | Balances UX and prevents infinite loops in interactive mode | 2026-02-02 |
| 01-03 | Default to global scope when no flag | Per REQ-INST-006, installer defaults to global installation | 2026-02-02 |
| 01-03 | BANNEKER_FILES manifest for uninstall | Safe uninstall only removes tracked files, prevents user data loss | 2026-02-02 |
| 02-01 | Tiered test directory structure | unit/integration/smoke directories for CI optimization | 2026-02-02 |
| 02-01 | Use node:test programmatic API | Coverage enforcement via run() API with strict thresholds | 2026-02-02 |
| 02-01 | Enforce 100% coverage on installer code paths | Only lib/installer.js, lib/paths.js, lib/flags.js require 100% coverage | 2026-02-02 |
| 02-02 | Export checkWritePermission() for testability | Made permission checking function exportable for unit test isolation | 2026-02-02 |
| 02-02 | Walk directory tree for permission checks | checkWritePermission walks up to existing directory for access verification | 2026-02-02 |
| 02-03 | Trigger validation on all branches | Push to any branch triggers CI per REQ-CICD-001 "every push" | 2026-02-02 |
| 02-03 | Use Node 24.x for publish workflow | Trusted publishing requires npm 11.5.1+ which ships with Node 24.x | 2026-02-02 |
| 02-03 | Separate validation and publish workflows | Clear failure isolation, independent retry capability | 2026-02-02 |
| 02-03 | Include environment protection for publishing | Allows manual approval configuration for packages writing to ~/ | 2026-02-02 |
| 03-01 | Use snake_case for JSON keys | Python ecosystem compatibility for downstream tools | 2026-02-02 |
| 03-01 | Reference schemas only (no runtime validation) | Zero-dependency constraint prevents using Ajv/jsonschema, rely on prompt engineering | 2026-02-02 |
| 03-01 | State file in Markdown format | Human-readable for debugging, structured for agent parsing on resume | 2026-02-02 |
| 03-01 | Decision capture throughout interview | Phase 6 reviews all phases for implicit decisions, not just asking at end | 2026-02-02 |
| 03-01 | Skip logic for frontend-only projects | Phase 1 asks about backend, Phase 4 writes applicable:false if not needed | 2026-02-02 |
| 03-02 | Orchestrator delegates interview logic to surveyor | Command file focused on lifecycle (detect/spawn/verify), surveyor handles 6-phase interview | 2026-02-02 |
| 03-02 | Resume detection checks interrupted and completed states | Handles survey-state.md (interrupted) and survey.json (completed) to prevent data loss | 2026-02-02 |
| 03-02 | State file preserved on verification failure | Enables debugging and retry without starting over | 2026-02-02 |
| 03-03 | Agent file tracking via path prefix | BANNEKER_FILES uses agents/ prefix for path-based routing in installer/uninstaller | 2026-02-02 |
| 03-03 | Backwards-compatible null configDir handling | Uninstaller skips agent files if configDir is null for test compatibility | 2026-02-02 |
| 04-01 | 10 document types with conditional generation | 3 always (TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE) + 7 conditional based on survey signals | 2026-02-02 |
| 04-01 | Signal detection for document applicability | Survey.json field patterns determine which documents are relevant for project type | 2026-02-02 |
| 04-01 | Term registry for naming consistency | Extract canonical names once from survey.json, enforce across all documents | 2026-02-02 |
| 04-01 | 4-wave dependency-ordered generation | Wave 1 (TECHNICAL-SUMMARY, STACK) → Wave 2 (TECHNICAL-DRAFT, INFRASTRUCTURE-ARCHITECTURE) → Wave 3 (DEVELOPER-HANDBOOK) → Wave 4 (independent) | 2026-02-02 |
| 04-01 | 3-tier validation framework | Placeholder detection (rejects), term consistency (rejects), decision citations (warns) | 2026-02-02 |
| 04-02 | Writer agent self-validates before returning | Catches placeholders, naming inconsistencies, invalid citations during generation | 2026-02-02 |
| 04-02 | Zero-tolerance policy for generic examples | Every sentence must be project-specific, no "e.g., React" or "such as PostgreSQL" | 2026-02-02 |
| 04-02 | 3-phase generation workflow | Planning → Generation → Self-Validation for each document | 2026-02-02 |
| 04-02 | Document-specific data mappings | Each of 10 types has explicit guidance on survey data → section content mapping | 2026-02-02 |
| 04-03 | Prerequisite checks for survey and decision data | banneker-architect command checks both files before spawning agent for better UX | 2026-02-02 |
| 04-03 | Dual resume detection (state file + existing documents) | Handles both interrupted generation and completed generation to prevent data loss | 2026-02-02 |
| 04-03 | Verify 3 required documents in completion check | Explicitly checks TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE to catch silent failures | 2026-02-02 |
| 04-04 | Config file prefix pattern | Config files follow same prefix-based routing as agents (config/ prefix routes to {runtime}/config/) | 2026-02-02 |
| 04-04 | Config files have no frontmatter | Unlike agent and command files, config files are pure markdown without YAML frontmatter delimiters | 2026-02-02 |
| 05-01 | Two-wave diagram generation architecture | Wave 1 generates 3 CSS-only diagrams, Wave 2 generates 1 JS-enhanced diagram for context budget management | 2026-02-02 |
| 05-01 | Self-contained HTML diagrams with inlined CSS/JS | Every diagram must inline complete :root CSS custom properties block and all JavaScript to ensure zero external dependencies | 2026-02-02 |
| 05-01 | CSS Grid with grid-template-areas for diagrams | Semantic layout pattern where grid area names read like an architecture diagram | 2026-02-02 |
| 05-01 | IIFE-wrapped JavaScript for scoped interactivity | All Wave 2 JavaScript wrapped in Immediately Invoked Function Expression to prevent global scope pollution | 2026-02-02 |
| 05-01 | State tracking and context budget handoff | Use diagrammer-state.md for wave tracking, write .continue-here.md if context exhausted between waves | 2026-02-02 |
| 05-02 | Three-tier resume detection for diagrams | Wave 1 handoff (.continue-here.md), interrupted generation (diagrammer-state.md), existing diagram outputs | 2026-02-02 |
| 05-02 | Wave 1-only as valid completion point | Context budget exhaustion after 3 CSS-only diagrams is normal outcome with handoff, not error | 2026-02-02 |
| 05-02 | State cleanup only on full completion | Preserve handoff for Wave 2 resume, preserve state on failure for debugging | 2026-02-02 |
| 05-03 | Follow Phase 4 pattern for manifest updates | Command and agent files use established prefix pattern, both require frontmatter validation | 2026-02-02 |
| 05-03 | Phase 5 files tracked in BANNEKER_FILES and AGENT_FILES | banneker-roadmap.md and agents/banneker-diagrammer.md added to manifests | 2026-02-02 |
| 06-01 | LLM-based markdown-to-HTML conversion | Agent manually converts markdown using LLM's knowledge instead of marked.js dependency | 2026-02-03 |
| 06-03 | Phase 6 follows same manifest pattern | banneker-appendix.md and agents/banneker-publisher.md follow established prefix and testing pattern | 2026-02-03 |
| 06-01 | Partial appendix generation as first-class feature | Detect available content, generate only available sections, report partial status with clear warnings | 2026-02-03 |
| 06-01 | Diagrams linked (not embedded) from section pages | Use target="_blank" links instead of iframe to avoid JavaScript conflicts between accordion and diagram code | 2026-02-03 |
| 06-01 | Index page generated last | Generate all section pages first, then build index.html based on which sections actually exist to prevent 404 errors | 2026-02-03 |
| 06-02 | Survey and architecture-decisions are hard prerequisites | Command aborts if survey.json or architecture-decisions.json missing (required for all pages) | 2026-02-03 |
| 06-02 | Documents and diagrams are NOT prerequisites | REQ-APPENDIX-003 requires partial appendix generation, missing content triggers warnings only | 2026-02-03 |
| 06-02 | Three-tier appendix completion messaging | Full (6 pages), partial (3-5 pages), minimal (2 pages) with appropriate user guidance | 2026-02-03 |
| 06-02 | Minimum viable appendix is index + 2 sections | State cleanup only on minimum viable completion threshold | 2026-02-03 |
| 07-03 | Phase 7 files follow established prefix pattern | banneker-feed.md, agents/banneker-exporter.md, config/framework-adapters.md tracked in manifests | 2026-02-03 |
| 07-03 | Config files validated differently than command/agent | Config files checked for existence and content but no frontmatter validation | 2026-02-03 |
| 08-01 | 4-phase progressive codebase scanning | Metadata → structure → technology → architecture for comprehensive analysis | 2026-02-03 |
| 08-01 | CLI-based analysis (Glob/Grep/Read) | Zero runtime dependencies, uses built-in CLI tools for file scanning | 2026-02-03 |
| 08-01 | State file for resume capability | .banneker/state/document-state.md enables resume on large codebases | 2026-02-03 |
| 08-01 | Project-specific findings requirement | No generic placeholders, actual file paths/versions/patterns only | 2026-02-03 |
| 08-01 | File exclusion rules for analysis | Skip node_modules, binaries, generated files, files over 500KB | 2026-02-03 |
| 08-02 | 10-category rubric for plan evaluation | ROLES-ACTORS, DATA-MODEL, API-SURFACE, AUTH-AUTHZ, INFRASTRUCTURE, ERROR-HANDLING, TESTING, SECURITY, PERFORMANCE, DEPLOYMENT | 2026-02-03 |
| 08-02 | Security weighted 2.0 (critical) | Security category has highest weight for scoring | 2026-02-03 |
| 08-02 | Fuzzy matching with 2+ detection terms | Criterion met if 2+ detection terms found, enables semantic equivalents | 2026-02-03 |
| 08-02 | Dual output format (JSON + Markdown) | audit-report.json for programmatic use, audit-report.md for human review | 2026-02-03 |
| 08-02 | ROADMAP.md provides phase context | Prevents penalizing Phase 1 for Phase 5 topics (deferred items) | 2026-02-03 |
| 08-02 | Gap recommendations must be actionable | Specific next steps with section references, not vague advice | 2026-02-03 |
| 08-03 | Document command works without survey.json | Brownfield-first design - analyzes raw codebases | 2026-02-03 |
| 08-03 | Audit command discovers plans from 3 sources | Works with GSD, Banneker, or standalone plan files | 2026-02-03 |
| 08-03 | Command orchestrators delegate to agents | Clean separation: orchestrators manage state/resume/verify, agents do domain work | 2026-02-03 |
| 09-01 | Help command dynamically discovers commands but falls back to hardcoded list | Works in both installed environment and development environment | 2026-02-03 |
| 09-01 | Progress command uses bash commands to parse state files | Zero runtime dependencies, uses grep/sed for YAML frontmatter parsing | 2026-02-03 |
| 09-01 | Neither help nor progress use orchestrator pattern | Both are stateless read-only commands (no resume detection or state tracking) | 2026-02-03 |
| 09-02 | Route extraction uses regex patterns for URL paths, page references, and API endpoints | Scan action and system_response for navigation patterns | 2026-02-03 |
| 09-02 | Authentication inference is conservative (protected by default unless explicitly public) | Auth boundary visualization shows public/authenticated/admin zones | 2026-02-03 |
| 09-02 | No generic placeholders allowed in route documentation | All routes must be traceable to walkthrough steps | 2026-02-03 |
| 09-02 | State tracking follows established plat-state.md pattern for resume capability | REQ-CONT-001 compliance for route generation | 2026-02-03 |
| 09-03 | auto-changelog as devDependency only (build-time, never shipped to users) | Zero-dependency runtime constraint applies to published package only | 2026-02-03 |
| 09-03 | Changelog generation in GitHub Actions publish workflow | REQ-CICD-005 requires automation, not user-facing command | 2026-02-03 |
| 09-03 | STRIDE analysis covers installer home directory writes and .banneker/ project writes | Comprehensive security documentation covering all file-write operations | 2026-02-03 |
| 09-03 | GitHub Security Advisories as primary vulnerability reporting channel | Standard GitHub security workflow with coordinated disclosure | 2026-02-03 |

## Blockers/Concerns

- **Publishing blocker:** npm publishing requires npmjs.com OIDC trusted publisher configuration (user-facing setup)
  - Repository: owner/banneker
  - Workflow: publish.yml
  - Environment: npm-production
  - Not blocking next phase development

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 09-03-PLAN.md (Security and Changelog Automation)
Resume file: None

---
*Last updated: 2026-02-03 — Phase 09 in progress (3/4 plans complete)*
