# Banneker — Requirements

## REQ-INST: Installation & Distribution

- **REQ-INST-001** (must) ✓: Distribute as npm package installable via `npx banneker`. Source: DEC-001. *Complete: Phase 1*
- **REQ-INST-002** (must) ✓: Installer copies 11 skill command files to the host runtime's commands directory and reference/template files to the config directory. Source: New User walkthrough step 4. *Complete: Phase 1*
- **REQ-INST-003** (must) ✓: Support Claude Code, OpenCode, and Gemini runtimes via `--claude`, `--opencode`, `--gemini` flags and interactive prompt. Source: DEC-004. *Complete: Phase 1*
- **REQ-INST-004** (must) ✓: Detect existing installations via `VERSION` file and prompt before overwriting. Source: New User walkthrough step 4 error case. *Complete: Phase 1*
- **REQ-INST-005** (must) ✓: Support `--uninstall` flag to remove all Banneker files from target directory without affecting non-Banneker files. Source: Installer CLI capabilities. *Complete: Phase 1*
- **REQ-INST-006** (should) ✓: Support `--global` and `--local` flags for non-interactive installation in CI or dotfile bootstrapping. Source: Installer CLI capabilities. *Complete: Phase 1*
- **REQ-INST-007** (must) ✓: Use zero third-party runtime dependencies — Node.js built-in modules only (`fs`, `path`, `readline`, `process`, `child_process`). Source: STACK.md, DEC-008. *Complete: Phase 1*

## REQ-SURVEY: Discovery Interview

- **REQ-SURVEY-001** (must): Conduct a 6-phase structured interview (pitch, actors, walkthroughs, backend, gaps, decision gate). Source: Developer walkthrough step 1.
- **REQ-SURVEY-002** (must): Produce `survey.json` containing project metadata, actors with types/roles/capabilities, walkthroughs with steps/system responses/data changes/error cases, backend details, and rubric coverage. Source: Developer walkthrough step 1.
- **REQ-SURVEY-003** (must): Produce `architecture-decisions.json` with DEC-XXX format entries including question, choice, rationale, and alternatives considered. Source: Developer walkthrough step 1.
- **REQ-SURVEY-004** (must): Save interview state to `.banneker/state/survey-state.md` on interruption and offer resume on next run. Source: Developer walkthrough step 1 error case.

## REQ-DOCS: Document Generation

- **REQ-DOCS-001** (must) ✓: Generate TECHNICAL-SUMMARY.md, STACK.md, and INFRASTRUCTURE-ARCHITECTURE.md for every project. Source: document-catalog.md always-generated rules. *Complete: Phase 4*
- **REQ-DOCS-002** (should) ✓: Conditionally generate TECHNICAL-DRAFT.md, DEVELOPER-HANDBOOK.md, DESIGN-SYSTEM.md, PORTAL-INTEGRATION.md, OPERATIONS-RUNBOOK.md, LEGAL-PLAN.md, and CONTENT-ARCHITECTURE.md based on project type and survey signals. Source: document-catalog.md conditional rules. *Complete: Phase 4*
- **REQ-DOCS-003** (must) ✓: All generated documents must be project-specific with zero generic placeholder content and zero leftover `<!-- BANNEKER: ... -->` template markers. Source: document-catalog.md quality standards. *Complete: Phase 4*
- **REQ-DOCS-004** (must) ✓: Technology names, actor names, and entity names must be consistent across all generated documents. Source: document-catalog.md quality standards. *Complete: Phase 4*
- **REQ-DOCS-005** (must) ✓: Documents must cite DEC-XXX decision IDs from `architecture-decisions.json` where relevant. Source: document-catalog.md quality standards. *Complete: Phase 4*
- **REQ-DOCS-006** (must) ✓: Generate documents in dependency order: TECHNICAL-SUMMARY and STACK first, then TECHNICAL-DRAFT, then INFRASTRUCTURE-ARCHITECTURE, then DEVELOPER-HANDBOOK, then all others. Source: document-catalog.md dependencies. *Complete: Phase 4*

## REQ-DIAG: Architecture Diagrams

- **REQ-DIAG-001** (must) ✓: Generate 4 HTML architecture diagrams: executive roadmap, decision map, system map, and architecture wiring. Source: Developer walkthrough step 4. *Complete: Phase 5*
- **REQ-DIAG-002** (must) ✓: Wave 1 produces 3 CSS-only diagrams; Wave 2 produces 1 JS-enhanced wiring diagram. Source: Developer walkthrough step 4. *Complete: Phase 5*
- **REQ-DIAG-003** (must) ✓: All diagrams are self-contained HTML files with no external dependencies. Source: STACK.md output formats. *Complete: Phase 5*
- **REQ-DIAG-004** (should) ✓: Support context budget handoff — if Wave 1 completes but context is exhausted, write handoff file for Wave 2 resume. Source: Developer walkthrough step 4 error case. *Complete: Phase 5*

## REQ-APPENDIX: HTML Appendix

- **REQ-APPENDIX-001** (must) ✓: Compile all documents and diagrams into self-contained HTML pages with shared dark-theme CSS. Source: Developer walkthrough step 5. *Complete: Phase 6*
- **REQ-APPENDIX-002** (must) ✓: Produce `index.html` landing page and individual section pages in `.banneker/appendix/`. Source: Developer walkthrough step 5. *Complete: Phase 6*
- **REQ-APPENDIX-003** (should) ✓: Generate only pages for available content when some documents are missing. Source: Developer walkthrough step 5 error case. *Complete: Phase 6*

## REQ-EXPORT: Export & Feed System

- **REQ-EXPORT-001** (must) ✓: Export to GSD format: PROJECT.md, REQUIREMENTS.md, ROADMAP.md in `.planning/`. Source: framework-adapters.md GSD adapter. *Complete: Phase 7*
- **REQ-EXPORT-002** (must) ✓: Export to platform prompt format: single dense context document under 4,000 words in `.banneker/exports/platform-prompt.md`. Source: framework-adapters.md platform prompt adapter. *Complete: Phase 7*
- **REQ-EXPORT-003** (must) ✓: Export to generic summary format: concatenated markdown in `.banneker/exports/summary.md`. Source: framework-adapters.md generic adapter. *Complete: Phase 7*
- **REQ-EXPORT-004** (must) ✓: Generate context bundle — single concatenated markdown file optimized for LLM agent context windows. Source: DEC-009, Developer walkthrough step 7. *Complete: Phase 7*
- **REQ-EXPORT-005** (must) ✓: GSD requirements use REQ-ID format (`REQ-[CATEGORY]-[NUMBER]`) with categories, priorities, and traceability to survey data. Source: framework-adapters.md REQUIREMENTS.md generation. *Complete: Phase 7*
- **REQ-EXPORT-006** (must) ✓: GSD roadmap milestones ordered by dependency: infrastructure first, then auth, then core flows, then secondary flows, then polish. Source: framework-adapters.md ROADMAP.md generation. *Complete: Phase 7*

## REQ-ANALYSIS: Brownfield & Audit

- **REQ-ANALYSIS-001** (must): `/banneker:document` reads existing codebase files and produces structured understanding for brownfield projects. Source: banneker-cartographer capabilities.
- **REQ-ANALYSIS-002** (must): `/banneker:audit` evaluates plans against the engineering completeness rubric and produces a coverage report. Source: banneker-auditor capabilities.

## REQ-CICD: CI/CD & Quality

- **REQ-CICD-001** (must) ✓: GitHub Actions validation workflow runs full test suite on every push and PR. Source: DEC-007, CICD-01 through CICD-04. *Complete: Phase 2*
- **REQ-CICD-002** (must) ✓: GitHub Actions publish workflow triggered by version tag runs tests then publishes to npm. Source: DEC-007. *Complete: Phase 2*
- **REQ-CICD-003** (must) ✓: Test suite includes unit tests (installer logic), integration tests (skill file validation), and smoke tests (full install verification). Source: DEC-008. *Complete: Phase 2*
- **REQ-CICD-004** (must) ✓: 100% coverage of installer file-write code paths. Source: TECHNICAL-SUMMARY.md key metrics. *Complete: Phase 2 (enforcement infrastructure in place)*
- **REQ-CICD-005** (should): Changelog automation for releases. Source: rubric partial coverage CICD-05.

## REQ-SEC: Security

- **REQ-SEC-001** (must) ✓: Installer checks file permissions before writing to `~/.claude/`. Source: SEC-01. *Complete: Phase 2*
- **REQ-SEC-002** (must) ✓: Installer prompts before overwriting existing files. Source: SEC-02. *Complete: Phase 2*
- **REQ-SEC-003** (should): Document a formal threat model for the installer's file-write surface. Source: rubric partial coverage SEC-03.

## REQ-CONT: Continuation & State

- **REQ-CONT-001** (must): All long-running commands track progress in `.banneker/state/{command}-state.md`. Source: continuation-protocol.md Method B.
- **REQ-CONT-002** (must): Commands check for continuation state before starting work (resume detection at Step 0). Source: continuation-protocol.md resume detection pattern.
- **REQ-CONT-003** (should) ✓: Write `.banneker/state/.continue-here.md` handoff file when a command cannot continue in the current session. Source: continuation-protocol.md Method C. *Complete: Phase 5*
