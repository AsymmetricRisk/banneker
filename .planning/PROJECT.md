# Banneker

## What This Is

Banneker is a project planning and documentation pipeline distributed as an npm package (`npx banneker`). It runs locally inside AI coding assistant runtimes — primarily Claude Code, with support for OpenCode and Gemini — and transforms structured discovery interviews into engineering plans, architecture diagrams, and agent-ready HTML appendices. The tool operates in the developer tooling / project planning domain as a CLI with no server, no database, and no authentication. Eight specialized sub-agents (surveyor, architect, writer, publisher, cartographer, auditor, diagrammer, engineer) perform the actual generation work, spawned via the host runtime's Task tool.

## Core Value

A Developer runs `/banneker:survey` to conduct a 6-phase structured interview capturing project scope, actors, data flows, and architecture decisions. The survey produces `survey.json` and `architecture-decisions.json`, which feed every downstream generation step. From a single interview session, Banneker generates a complete suite of planning documents (technical summary, stack reference, infrastructure architecture, developer handbook), four HTML architecture diagrams, a self-contained dark-themed HTML appendix, and structured exports for GSD, OpenClaw, and Loveable. When users reach their knowledge limits mid-survey, `/banneker:engineer` takes over to synthesize available data into engineering proposals with confidence markers. The Developer reviews output at each stage and feeds the final artifacts into their chosen build framework.

## Requirements

See `.planning/milestones/` for archived requirements by version. Key areas:

- **Distribution:** npm package with multi-runtime installer (DEC-001, DEC-004)
- **Survey Pipeline:** 6-phase structured interview with resume-on-interrupt (DEC-008)
- **Document Generation:** Conditional document set based on project type and survey signals
- **Diagram Generation:** 4 HTML architecture diagrams in 2 waves (CSS-only, then JS wiring)
- **Export System:** GSD, OpenClaw, Loveable, and context bundle formats (DEC-009)
- **CI/CD:** GitHub Actions with tag-triggered npm publish (DEC-007)
- **Engineer Mode:** Cliff detection, three-document synthesis, approval flow (v0.3.0)

### Validated

- ✓ REQ-INST-001 through REQ-INST-007 — v0.2.0 (installer and distribution)
- ✓ REQ-SURVEY-001 through REQ-SURVEY-004 — v0.2.0 (survey pipeline)
- ✓ REQ-DOCS-001 through REQ-DOCS-006 — v0.2.0 (document generation)
- ✓ REQ-DIAG-001 through REQ-DIAG-004 — v0.2.0 (architecture diagrams)
- ✓ REQ-APPENDIX-001 through REQ-APPENDIX-003 — v0.2.0 (HTML appendix)
- ✓ REQ-EXPORT-001 through REQ-EXPORT-006 — v0.2.0 (export system)
- ✓ REQ-ANALYSIS-001, REQ-ANALYSIS-002 — v0.2.0 (brownfield and audit)
- ✓ REQ-CICD-001 through REQ-CICD-005 — v0.2.0 (CI/CD)
- ✓ REQ-SEC-001 through REQ-SEC-003 — v0.2.0 (security)
- ✓ REQ-CONT-001 through REQ-CONT-003 — v0.2.0 (continuation)
- ✓ CLIFF-01 through CLIFF-04 — v0.3.0 (cliff detection)
- ✓ ENGDOC-01 through ENGDOC-06 — v0.3.0 (engineer documents)
- ✓ APPROVE-01 through APPROVE-04 — v0.3.0 (approval flow)
- ✓ ENGINT-01 through ENGINT-05 — v0.3.0 (engineer integration)

### Active

(None — planning next milestone)

### Out of Scope

- Mobile app — web-based CLI tool, no native apps planned
- Autonomous decision execution — destroys user trust; approval gates are table stakes
- Configurable detection sensitivity — defer to v0.4.0 after real-world tuning
- Multi-proposal comparison — single best proposal sufficient for MVP
- Decision rollback/undo — users can manually edit architecture-decisions.json

## Context

### Current State

**Shipped:** v0.3.0 The Engineer (2026-02-04)

Banneker now includes engineer mode for when users reach their knowledge limits during surveys. Cliff detection identifies explicit signals ("I don't know", "you decide") and implicit signals (hedging, quality drop), triggering mode switch offers. The engineer agent synthesizes partial survey data into three documents (DIAGNOSIS, RECOMMENDATION, ENGINEERING-PROPOSAL) with confidence markers. All decisions require explicit user approval before merging.

**Codebase:**
- ~6,000 lines of JavaScript (lib modules + tests)
- 260 tests (unit + integration)
- 8 sub-agents (surveyor, architect, writer, publisher, cartographer, auditor, diagrammer, engineer)
- 11 skill commands

### Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Distribution | npm registry | DEC-001: Proven pattern from GSD, discoverable via npm search |
| Installer Runtime | Node.js >= 18 LTS | Required by npm; LTS ensures broad compatibility |
| Host Runtime | Claude Code / OpenCode / Gemini | DEC-004: Multi-runtime from day one |
| Skill Definitions | Markdown + YAML frontmatter | Native command format for Claude Code; no build step |
| Data Format | JSON | Human-readable, natively parsed by LLM agents |
| Output | Markdown + self-contained HTML | Universal format for documents; HTML for diagrams and appendices |
| Source Control | GitHub (public) | DEC-005: Standard for open-source developer tools |
| CI/CD | GitHub Actions | DEC-007: Tag-triggered publish with automated quality gates |
| Testing | Node.js built-in test runner | DEC-008: Unit, integration, and smoke tests |
| License | MIT | DEC-003: Maximally permissive |

### Hosting

Local CLI tool. No server infrastructure. npm registry hosts the package for distribution. GitHub hosts source and CI/CD. All generation runs on the Developer's local machine.

### Integrations

| Service | Purpose | Critical |
|---------|---------|----------|
| npm registry | Package distribution | Yes |
| GitHub | Source repo, CI/CD | Yes |
| Claude Code | Host runtime, skill discovery, Task tool | Yes |
| GSD | Downstream export consumer | No |
| OpenClaw | Downstream export consumer | No |
| Loveable | Downstream export consumer | No |

## Constraints

- **Zero runtime dependencies:** The installer (`bin/banneker.mjs`) uses only Node.js built-in modules. No `node_modules` at runtime.
- **File-system only:** All data persists as local files in `.banneker/` (project) and `~/.claude/` (global). No external data stores.
- **No authentication:** Local CLI tool with filesystem permissions as the only access control.
- **Prompt before overwrite:** Installer must detect existing installations via `VERSION` file and prompt before replacing files.
- **Pre-1.0 versioning:** Initial publish at 0.2.0 (DEC-006). Semver semantics with breaking changes reserved for post-1.0.

## Key Decisions

| ID | Decision | Choice | Rationale | Outcome |
|----|----------|--------|-----------|---------|
| DEC-001 | Distribution mechanism | npm package (`npx banneker`) | Same proven pattern as GSD; familiar to JS developers; discoverable via npm search | ✓ Good |
| DEC-002 | Package name | `banneker` | Clean and simple, directly matches the project name | ✓ Good |
| DEC-003 | License | MIT | Maximally permissive; most common for developer tools | ✓ Good |
| DEC-004 | Runtime support | Multi-runtime from day one (Claude Code, OpenCode, Gemini) | Broader reach; GSD proves the pattern works; installer logic is reusable | ✓ Good |
| DEC-005 | Source hosting | GitHub public | Standard for open-source developer tools; enables community contributions | ✓ Good |
| DEC-006 | Initial version | 0.2.0 | Ship current state, iterate publicly; pre-1.0 signals active development | ✓ Good |
| DEC-007 | Release pipeline | GitHub Actions (tag-triggered npm publish) | Automated CI ensures quality gates before every publish | ✓ Good |
| DEC-008 | Testing strategy | Full test suite (unit, integration, smoke) | Installer writes to `~/` — needs high confidence before publishing | ✓ Good |
| DEC-009 | Agent context delivery | Context bundle via `/banneker:feed` | Agents need full project context in one loadable artifact; concatenating source markdown avoids lossy conversion | ✓ Good |
| DEC-010 | Engineer architecture | Three-document synthesis (DIAGNOSIS, RECOMMENDATION, PROPOSAL) | Separates gap analysis, options analysis, and concrete decisions; enables granular approval | ✓ Good |
| DEC-011 | Confidence system | HIGH/MEDIUM/LOW with probabilistic ranges | Industry-standard estimation vocabulary; rationale required for each marker | ✓ Good |
| DEC-012 | Cliff detection | Explicit (14 signals) + Implicit (24 signals) with compound threshold | Reduces false positives; respects user agency with confirmation flow | ✓ Good |
| DEC-013 | Approval flow | Per-decision granularity with edit support | Maintains user trust; prevents autonomous decision execution | ✓ Good |
| DEC-014 | Complexity ceiling | Three levels (standard/minimal/enterprise) | Prevents over-engineering for constrained projects; warnings not blocks | ✓ Good |

---
*Last updated: 2026-02-04 after v0.3.0 milestone*
