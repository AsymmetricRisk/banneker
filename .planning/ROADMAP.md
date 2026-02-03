# Banneker — Roadmap

**Current Milestone:** v0.3.0 — The Engineer
**Phases:** 15 (10 from v0.2.0 + 5 for v0.3.0)

## Milestones

- ✅ **v0.2.0 Initial Public Release** - Phases 1-10 (shipped)
- 🚧 **v0.3.0 The Engineer** - Phases 11-15 (in progress)

## Phases

<details>
<summary>v0.2.0 Initial Public Release (Phases 1-10) - SHIPPED</summary>

## Phase 1: Package Scaffolding & Installer

**Goal:** Establish the npm package structure and build a working installer that places skill files for all three runtimes.

**Requirements:** REQ-INST-001, REQ-INST-002, REQ-INST-003, REQ-INST-004, REQ-INST-005, REQ-INST-006, REQ-INST-007

**Success Criteria:**
1. `npx banneker` runs the installer from a local package
2. Interactive prompt lets user select runtime (Claude Code / OpenCode / Gemini)
3. `--claude`, `--opencode`, `--gemini` flags skip the runtime prompt
4. `--global` and `--local` flags control install location without prompting
5. `--uninstall` removes all Banneker files without touching non-Banneker files
6. Existing install detected via VERSION file triggers overwrite prompt
7. Zero third-party dependencies — only Node.js built-ins used

**Complexity:** M

**Dependencies:** None

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Package scaffolding (package.json, bin entry, constants, directory structure)
- [x] 01-02-PLAN.md — TDD: Flag parsing and path resolution modules
- [x] 01-03-PLAN.md — Installer orchestration, prompts, and uninstaller
- [x] 01-04-PLAN.md — Integration tests and end-to-end verification

**Phase 1 Status:** COMPLETE (all 4 plans executed, all success criteria met)

---

## Phase 2: CI/CD Pipeline

**Goal:** Set up automated validation and tag-triggered npm publishing via GitHub Actions.

**Requirements:** REQ-CICD-001, REQ-CICD-002, REQ-CICD-003, REQ-CICD-004, REQ-SEC-001, REQ-SEC-002

**Success Criteria:**
1. Push to any branch triggers validation workflow running full test suite
2. PR creation triggers the same validation workflow
3. Version tag push triggers publish workflow (tests -> npm publish)
4. Unit tests cover installer flag parsing, directory resolution, file copy logic
5. Integration tests validate skill file YAML frontmatter
6. Smoke test runs full install in clean temp directory and verifies files exist
7. Installer checks file permissions before writing to `~/.claude/`

**Complexity:** M

**Dependencies:** Phase 1

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Test infrastructure: reorganize directories, npm scripts, coverage thresholds
- [x] 02-02-PLAN.md — New tests: permission checks, YAML validation, smoke test
- [x] 02-03-PLAN.md — GitHub Actions workflows: validate.yml and publish.yml

**Phase 2 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

## Phase 3: Survey Pipeline

**Goal:** Implement the 6-phase structured discovery interview that produces survey.json and architecture-decisions.json.

**Requirements:** REQ-SURVEY-001, REQ-SURVEY-002, REQ-SURVEY-003, REQ-SURVEY-004, REQ-CONT-001, REQ-CONT-002

**Success Criteria:**
1. `/banneker:survey` command initiates the 6-phase interview
2. Interview covers: pitch, actors, walkthroughs, backend, gaps, decision gate
3. `survey.json` contains project metadata, actors, walkthroughs, backend details, rubric coverage
4. `architecture-decisions.json` contains DEC-XXX format entries with question, choice, rationale, alternatives
5. Interrupting mid-interview saves state to `.banneker/state/survey-state.md`
6. Re-running survey after interruption offers resume from saved state

**Complexity:** L

**Dependencies:** Phase 1

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Surveyor sub-agent and JSON reference schemas
- [x] 03-02-PLAN.md — Survey command orchestrator skill file
- [x] 03-03-PLAN.md — Installer integration for agents directory and tests

**Phase 3 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

## Phase 4: Document Generation

**Goal:** Build the architect and writer agents that transform survey data into planning documents.

**Requirements:** REQ-DOCS-001, REQ-DOCS-002, REQ-DOCS-003, REQ-DOCS-004, REQ-DOCS-005, REQ-DOCS-006

**Success Criteria:**
1. `/banneker:architect` generates conditional document set based on project type
2. TECHNICAL-SUMMARY.md, STACK.md, INFRASTRUCTURE-ARCHITECTURE.md generated for every project
3. Conditional documents generated only when survey signals trigger them
4. Zero generic placeholder content in any generated document
5. Technology, actor, and entity names consistent across all documents
6. Documents cite DEC-XXX decision IDs where relevant
7. Generation follows dependency order (TECHNICAL-SUMMARY and STACK first)

**Complexity:** L

**Dependencies:** Phase 3

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — Architect sub-agent and document catalog reference
- [x] 04-02-PLAN.md — Writer sub-agent for individual document generation
- [x] 04-03-PLAN.md — Architect command orchestrator skill file
- [x] 04-04-PLAN.md — Installer manifest update and tests

**Phase 4 Status:** COMPLETE (all 4 plans executed, all success criteria met)

---

## Phase 5: Architecture Diagrams

**Goal:** Generate the four HTML architecture diagrams in two waves.

**Requirements:** REQ-DIAG-001, REQ-DIAG-002, REQ-DIAG-003, REQ-DIAG-004, REQ-CONT-003

**Success Criteria:**
1. `/banneker:roadmap` generates 4 HTML architecture diagrams
2. Wave 1 produces 3 CSS-only diagrams (executive roadmap, decision map, system map)
3. Wave 2 produces 1 JS-enhanced architecture wiring diagram
4. All diagrams are self-contained HTML with no external dependencies
5. Context budget exhaustion writes handoff file for Wave 2 resume

**Complexity:** M

**Dependencies:** Phase 4

**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Diagrammer sub-agent for HTML diagram generation
- [x] 05-02-PLAN.md — Roadmap command orchestrator skill file
- [x] 05-03-PLAN.md — Installer manifest update and tests

**Phase 5 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

## Phase 6: HTML Appendix

**Goal:** Compile all documents and diagrams into a self-contained dark-themed HTML reference.

**Requirements:** REQ-APPENDIX-001, REQ-APPENDIX-002, REQ-APPENDIX-003

**Success Criteria:**
1. `/banneker:appendix` compiles documents and diagrams into HTML pages
2. `index.html` landing page links to all section pages
3. Individual section pages use shared dark-theme CSS
4. All HTML files are self-contained with no external dependencies
5. Missing documents produce partial appendix (available pages only)

**Complexity:** M

**Dependencies:** Phase 4, Phase 5

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Publisher sub-agent for HTML appendix compilation
- [x] 06-02-PLAN.md — Appendix command orchestrator skill file
- [x] 06-03-PLAN.md — Installer manifest update and tests

**Phase 6 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

## Phase 7: Export & Feed System

**Goal:** Build the export pipeline that transforms Banneker artifacts into formats consumed by downstream frameworks.

**Requirements:** REQ-EXPORT-001, REQ-EXPORT-002, REQ-EXPORT-003, REQ-EXPORT-004, REQ-EXPORT-005, REQ-EXPORT-006

**Success Criteria:**
1. `/banneker:feed` exports to GSD format (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
2. GSD requirements use REQ-ID format with categories and traceability
3. GSD roadmap orders milestones by dependency
4. Platform prompt export produces single document under 4,000 words
5. Generic summary export produces concatenated markdown
6. Context bundle produces single-file agent context artifact

**Complexity:** M

**Dependencies:** Phase 4

**Plans:** 3 plans

Plans:
- [x] 07-01-PLAN.md — Exporter sub-agent for all 4 export formats
- [x] 07-02-PLAN.md — Feed command orchestrator and framework-adapters config
- [x] 07-03-PLAN.md — Installer manifest update and tests

**Phase 7 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

## Phase 8: Brownfield Analysis & Audit

**Goal:** Add the cartographer and auditor capabilities for existing codebases and plan evaluation.

**Requirements:** REQ-ANALYSIS-001, REQ-ANALYSIS-002

**Success Criteria:**
1. `/banneker:document` reads existing codebase and produces structured understanding
2. `/banneker:audit` evaluates plans against engineering completeness rubric
3. Audit produces coverage report with scored categories

**Complexity:** M

**Dependencies:** Phase 4

**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Cartographer sub-agent for codebase analysis
- [x] 08-02-PLAN.md — Auditor sub-agent and completeness rubric config
- [x] 08-03-PLAN.md — Document and audit command orchestrators
- [x] 08-04-PLAN.md — Installer manifest update and tests

**Phase 8 Status:** COMPLETE (all 4 plans executed, all success criteria met)

---

## Phase 9: Polish & Ops

**Goal:** Fill remaining gaps — utility commands, continuation protocol hardening, changelog automation, and security documentation.

**Requirements:** REQ-CONT-001, REQ-CONT-002, REQ-CONT-003, REQ-CICD-005, REQ-SEC-003

**Success Criteria:**
1. `/banneker:plat` generates sitemap and route architecture
2. `/banneker:progress` shows current Banneker state from state files
3. `/banneker:help` displays command reference
4. Continuation protocol writes handoff files on interruption
5. Threat model documented for installer file-write surface

**Complexity:** M

**Dependencies:** Phases 1-8

**Plans:** 4 plans

Plans:
- [x] 09-01-PLAN.md — Help and progress utility commands
- [x] 09-02-PLAN.md — Plat command and plat-generator agent
- [x] 09-03-PLAN.md — STRIDE threat model and changelog automation
- [x] 09-04-PLAN.md — Installer manifest update and tests

**Phase 9 Status:** COMPLETE (all 4 plans executed, all success criteria met)

---

## Phase 10: Public Launch

**Goal:** Publish Banneker 0.2.0 to npm and verify end-to-end installation from the registry.

**Requirements:** REQ-INST-001, REQ-CICD-002

**Success Criteria:**
1. Version 0.2.0 set in package.json and VERSION file
2. All tests green on main branch
3. Tag v0.2.0 triggers GitHub Actions publish to npm
4. `npx banneker` installs correctly from npm in clean environment
5. README includes installation instructions, command reference, quick start

**Complexity:** S

**Dependencies:** Phases 1-9

**Plans:** 2 plans

Plans:
- [x] 10-01-PLAN.md — README creation and package.json metadata enhancement
- [ ] 10-02-PLAN.md — Trusted publisher setup, tag creation, and post-publish verification

**Phase 10 Status:** IN PROGRESS

</details>

---

## v0.3.0 The Engineer

**Milestone Goal:** Add `/banneker:engineer` command that shifts from interviewing to engineering mode when users reach their knowledge limits during surveys.

### Phase 11: Engineer Agent Core

**Goal:** Standalone engineer capability that synthesizes survey data into actionable engineering documents with explicit confidence levels.

**Depends on:** Phase 10 (v0.2.0 complete)

**Requirements:** ENGDOC-01, ENGDOC-02, ENGDOC-03, ENGDOC-04, ENGINT-01, ENGINT-02, ENGINT-05

**Success Criteria** (what must be TRUE):
1. `/banneker:engineer` command runs and reads existing survey.json (if present)
2. DIAGNOSIS.md is generated identifying what is known, what is missing, and where gaps exist
3. RECOMMENDATION.md is generated with options analysis, trade-offs, and alternatives considered
4. ENGINEERING-PROPOSAL.md is generated with concrete decisions in DEC-XXX format
5. Every recommendation includes confidence marker (HIGH/MEDIUM/LOW) with justification
6. Engineer works with partial survey data (mid-interview scenarios produce valid output)
7. Engineer state saved to `.banneker/state/engineer-state.md` enabling resume on interruption

**Plans:** 4 plans

Plans:
- [x] 11-01-PLAN.md — Engineer sub-agent and engineering catalog specs
- [x] 11-02-PLAN.md — Engineer command orchestrator skill file
- [x] 11-03-PLAN.md — State management and partial data handling
- [x] 11-04-PLAN.md — Installer manifest update and tests

**Phase 11 Status:** COMPLETE (all 4 plans executed, all success criteria met)

---

### Phase 12: Cliff Detection

**Goal:** Detect when users reach their knowledge limits during surveys and offer mode switch with explicit confirmation.

**Depends on:** Phase 11

**Requirements:** CLIFF-01, CLIFF-02

**Success Criteria** (what must be TRUE):
1. Explicit cliff signals are detected ("I don't know", "you decide", "take it from here", "whatever you think is best")
2. Cliff signal detection logged to survey.json as `cliff_signals` array with timestamps and context
3. Mode switch is offered only after explicit confirmation from user (no silent takeover)
4. User can decline takeover and continue survey without penalty

**Plans:** 3 plans

Plans:
- [x] 12-01-PLAN.md — Schema extension and cliff detection config reference
- [x] 12-02-PLAN.md — Surveyor modification with detection logic and confirmation flow
- [x] 12-03-PLAN.md — Cliff detection module and tests (TDD)

**Phase 12 Status:** COMPLETE (all 3 plans executed, all success criteria met)

---

### Phase 13: Approval Flow

**Goal:** Granular user approval workflow before any AI-generated decisions merge into the project's decision record.

**Depends on:** Phase 11

**Requirements:** APPROVE-01, APPROVE-02, APPROVE-03, APPROVE-04

**Success Criteria** (what must be TRUE):
1. No decisions merge to architecture-decisions.json without explicit user approval
2. User can approve/reject individual decisions (not all-or-nothing)
3. User can edit proposed decisions before accepting (modify then approve)
4. Summary tables display decisions grouped by category for efficient review
5. Rejected decisions are logged with reason (not silently discarded)

**Plans:** 3 plans

Plans:
- [ ] 13-01-PLAN.md — Core approval lib modules (merge logic, display formatting)
- [ ] 13-02-PLAN.md — Approve command orchestrator and interactive prompts
- [ ] 13-03-PLAN.md — Installer tests and approval workflow integration tests

---

### Phase 14: Survey Integration

**Goal:** Integrate engineer mode into the survey pipeline with proper context handoff when users hit knowledge cliffs mid-interview.

**Depends on:** Phase 12, Phase 13

**Requirements:** ENGINT-03, ENGINT-04

**Success Criteria** (what must be TRUE):
1. Cliff detection during survey triggers offer to switch to engineer mode at phase boundaries
2. Context handoff protocol produces explicit summary of what surveyor learned before switching
3. Handoff summary persisted to survey.json as `surveyor_notes` or `.banneker/state/handoff-context.md`
4. Engineer mode receives full context (no information loss during transition)
5. User can complete survey normally if they decline engineer takeover

**Plans:** TBD

Plans:
- [ ] 14-01: Mid-survey takeover offer at phase boundaries
- [ ] 14-02: Context handoff protocol and surveyor_notes persistence
- [ ] 14-03: Integration tests for survey-to-engineer flow

---

### Phase 15: Polish & Advanced Detection

**Goal:** Add sophisticated cliff detection (implicit signals, compound detection) and engineering safeguards (complexity ceiling, research capability).

**Depends on:** Phase 14

**Requirements:** CLIFF-03, CLIFF-04, ENGDOC-05, ENGDOC-06

**Success Criteria** (what must be TRUE):
1. Implicit cliff signals detected (hedging language, response quality drop, repeated deferrals)
2. Compound signal detection requires 2+ signals before triggering (prevents false positives)
3. Complexity ceiling enforced based on extracted project constraints (prevents over-engineering)
4. Research-on-demand capability available via WebSearch to fill knowledge gaps during synthesis
5. End-to-end pipeline works: survey with cliff -> engineer takeover -> documents -> approval -> merge

**Plans:** TBD

Plans:
- [ ] 15-01: Implicit signal detection patterns and compound logic
- [ ] 15-02: Complexity ceiling configuration and enforcement
- [ ] 15-03: Research-on-demand WebSearch integration
- [ ] 15-04: End-to-end integration tests and installer update

---

## Progress

**Execution Order:** Phases execute in numeric order. v0.3.0 starts at Phase 11.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Package Scaffolding | v0.2.0 | 4/4 | Complete | - |
| 2. CI/CD Pipeline | v0.2.0 | 3/3 | Complete | - |
| 3. Survey Pipeline | v0.2.0 | 3/3 | Complete | - |
| 4. Document Generation | v0.2.0 | 4/4 | Complete | - |
| 5. Architecture Diagrams | v0.2.0 | 3/3 | Complete | - |
| 6. HTML Appendix | v0.2.0 | 3/3 | Complete | - |
| 7. Export & Feed System | v0.2.0 | 3/3 | Complete | - |
| 8. Brownfield Analysis | v0.2.0 | 4/4 | Complete | - |
| 9. Polish & Ops | v0.2.0 | 4/4 | Complete | - |
| 10. Public Launch | v0.2.0 | 1/2 | In progress | - |
| 11. Engineer Agent Core | v0.3.0 | 4/4 | Complete | 2026-02-03 |
| 12. Cliff Detection | v0.3.0 | 3/3 | Complete | 2026-02-03 |
| 13. Approval Flow | v0.3.0 | 0/3 | Not started | - |
| 14. Survey Integration | v0.3.0 | 0/3 | Not started | - |
| 15. Polish & Advanced | v0.3.0 | 0/4 | Not started | - |

---
*Roadmap updated: 2026-02-03 — Phase 13 planned (3 plans created)*
