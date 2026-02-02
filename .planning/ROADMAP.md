# Banneker — Roadmap

**Milestone:** v0.2.0 — Initial Public Release
**Phases:** 10

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
