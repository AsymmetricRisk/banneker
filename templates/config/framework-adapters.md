# Framework Adapters

Configuration reference for Banneker export formats. Each adapter defines the target format, output location, and generation rules.

## GSD Adapter

**Target:** GSD (Get Shit Done) planning framework
**Output directory:** `.planning/`
**Files produced:**
- `PROJECT.md` — Project overview, value proposition, target users
- `REQUIREMENTS.md` — Categorized requirements with REQ-ID format
- `ROADMAP.md` — Dependency-ordered milestone plan

**Required source data:**
- `.banneker/survey.json` (required)
- `.banneker/architecture-decisions.json` (required)

**REQ-ID Format:** `REQ-[CATEGORY]-[NNN]`

**Categories:**
- INST: Installation & Distribution
- FUNC: Functional Requirements (from walkthroughs)
- DATA: Data Model & Backend
- UI: User Interface & Frontend
- SEC: Security
- PERF: Performance
- DOCS: Documentation
- INT: Integrations & External Services

**Priority levels:** must, should, could

**Traceability:** Each requirement cites source survey field path using the format `Source: survey.field.path`

**Roadmap ordering:** Topological sort by dependency — infrastructure first, then auth/data, then core flows, then secondary flows, then polish. No circular dependencies allowed.

**PROJECT.md Structure:**
- Project Overview section with name, one-liner, problem statement
- Technology Stack section with backend/frontend technologies
- Hosting & Infrastructure section with deployment platform
- Key Decisions section with DEC-XXX citations
- Constraints section with technical limitations

**REQUIREMENTS.md Structure:**
- Requirements organized by category (INST, FUNC, DATA, UI, SEC, PERF, DOCS, INT)
- Each requirement has: REQ-ID, description, priority, source field path
- Installation requirements from survey installation/distribution fields
- Functional requirements extracted from walkthrough steps
- Data requirements from backend.data_stores entities
- UI requirements from frontend-focused walkthrough steps
- Security requirements from authentication/authorization decisions
- Performance requirements from scalability/optimization decisions
- Documentation requirements from developer-facing needs
- Integration requirements from backend.integrations

**ROADMAP.md Structure:**
- Milestone-based plan with dependency edges
- Phases ordered using topological sort (earliest dependency-free first)
- Each phase includes: name, description, requirements (REQ-IDs), dependencies (other phase IDs)
- Infrastructure phases before feature phases
- Authentication/data model phases before user-facing flows
- Core functionality before optimization/polish

## Platform Prompt Adapter

**Target:** Dense context document for AI platform consumption
**Output:** `.banneker/exports/platform-prompt.md`
**Word limit:** 4,000 words maximum
**Strategy:** Map-reduce summarization with section-aware truncation

**Required source data:**
- `.banneker/survey.json` (required)
- `.banneker/documents/*.md` (optional, enriches output)

**Sections (in order):**
1. Project Overview — Name, one-liner, problem statement, value proposition
2. Technology Stack — Backend/frontend technologies with rationale
3. Architecture Decisions — Key decisions only (DEC-XXX format)
4. Core Walkthroughs — Condensed user flows showing critical paths
5. Requirements Summary — High-level categorized requirements

**Word budget allocation:**
- Project Overview: 10% (~400 words)
- Technology Stack: 15% (~600 words)
- Architecture Decisions: 25% (~1,000 words)
- Core Walkthroughs: 30% (~1,200 words)
- Requirements Summary: 20% (~800 words)

**Truncation rules:**
- Never truncate mid-sentence (complete sentence or omit entirely)
- Never truncate mid-subsection (complete subsection or omit entirely)
- Priority order within sections: survey data > document excerpts > derived content
- Include footer indicating word count and omitted sections if truncated

**Quality standards:**
- Must respect 4,000 word limit (validate with word count)
- Must include all survey-derived content (survey.json is authoritative)
- May omit document-derived content if word budget exceeded
- Must be readable by AI platforms (Claude, GPT, Gemini, etc.)

## Generic Summary Adapter

**Target:** Concatenated markdown of all planning documents
**Output:** `.banneker/exports/summary.md`
**Strategy:** Direct file concatenation with source comments

**Required source data:**
- `.banneker/documents/*.md` (at least one required)

**Document order:**
1. TECHNICAL-SUMMARY.md (first — high-level overview)
2. STACK.md (second — technology details)
3. INFRASTRUCTURE-ARCHITECTURE.md (third — system architecture)
4. Remaining documents alphabetically

**Format:**
- Project metadata header with name, one-liner, actors, technology stack
- Each document preceded by source comment: `<!-- Source: .banneker/documents/[FILENAME] -->`
- Horizontal rule separator between documents: `---`
- Document content preserved exactly as written (no summarization)
- Footer with generation timestamp

**Quality standards:**
- Must preserve original document formatting (headings, lists, code blocks)
- Must include source comments for all documents
- Must maintain document order as specified
- Must include metadata header with project context

## Context Bundle Adapter

**Target:** Single-file LLM agent context artifact
**Output:** `.banneker/exports/context-bundle.md`
**Strategy:** Selective inclusion — prioritize quality over quantity

**Required source data:**
- `.banneker/survey.json` (required)
- `.banneker/architecture-decisions.json` (optional, recommended)
- `.banneker/documents/*.md` (optional, recommended)

**Inclusion priority:**

**Always include:**
1. Survey data (as formatted JSON in code block)
2. Architecture decisions (as formatted JSON in code block)
3. TECHNICAL-SUMMARY.md (if exists — always include)
4. STACK.md (if exists — always include)
5. INFRASTRUCTURE-ARCHITECTURE.md (if exists — always include)

**Include if exists and adds value:**
6. DEVELOPER-HANDBOOK.md (developer onboarding)
7. TECHNICAL-DRAFT.md (detailed data model and API surface)
8. DESIGN-SYSTEM.md (UI/UX standards)
9. PORTAL-INTEGRATION.md (external service integrations)

**Never include (low value for LLM context):**
- OPERATIONS-RUNBOOK.md (operational procedures too specific)
- LEGAL-PLAN.md (legal content not relevant for technical agents)
- CONTENT-ARCHITECTURE.md (content modeling too specialized)

**Structure:**
```markdown
# [Project Name] — Context Bundle

Generated: [ISO date]

## Survey Data

```json
{survey.json content}
```

## Architecture Decisions

```json
{architecture-decisions.json content}
```

## Planning Documents

### Technical Summary
{TECHNICAL-SUMMARY.md content}

### Technology Stack
{STACK.md content}

### Infrastructure Architecture
{INFRASTRUCTURE-ARCHITECTURE.md content}

[Additional documents if they exist]
```

**Quality standards:**
- Must include survey data and architecture decisions
- Must include at least one planning document (preferably all 3 priority docs)
- Must use proper markdown code blocks for JSON
- Must omit low-value documents (keep bundle focused)
- Optimized for LLM consumption (structured JSON + narrative markdown)
