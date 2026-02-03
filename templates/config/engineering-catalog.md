# Engineering Catalog

This reference file defines the three engineering documents that Banneker's engineer agent generates from survey data, including confidence level systems, survey mappings, ADR formatting, and quality standards.

## Always-Generated Documents

The engineer agent generates all three documents for every engineering session, regardless of survey completeness. These documents work sequentially: DIAGNOSIS identifies what's known and unknown, RECOMMENDATION analyzes options, and ENGINEERING-PROPOSAL makes concrete decisions in ADR format.

---

### DIAGNOSIS.md

**Purpose:** Gap analysis that explicitly identifies what information exists in the survey, what's missing, and how these gaps affect engineering confidence.

**When Generated:** Always first (Wave 1). Foundation for RECOMMENDATION and PROPOSAL documents.

**Section Structure:**

- **Survey Overview** - Survey metadata, completion status, phase coverage
- **What Is Known** - Summary of captured information organized by survey section
- **What Is Missing** - Explicit enumeration of gaps, incomplete sections, missing details
- **Information Quality Assessment** - Per-section confidence ratings based on completeness
- **Critical Unknowns** - Gaps that significantly affect recommendation confidence
- **Minimum Viable Analysis** - Assessment whether survey provides enough for recommendations

**Survey Mapping:**

- Survey Overview: `survey_metadata.version`, `survey_metadata.completed_at`, phase coverage count
- What Is Known:
  - Project context: `project.name`, `project.one_liner`, `project.problem_statement`
  - Actors: `actors[]` array presence and completeness
  - Walkthroughs: `walkthroughs[]` count and detail level
  - Backend: `backend.applicable`, `backend.stack`, `backend.data_stores`, `backend.integrations`
  - Rubric: `rubric_coverage.covered[]`, `rubric_coverage.gaps[]`
- What Is Missing: Gaps detected from missing keys, empty arrays, or `rubric_coverage.gaps[]`
- Information Quality: Computed from presence/completeness of required sections
- Critical Unknowns: Derived from gap analysis - which missing pieces affect key decisions
- Minimum Viable: Check for Phase 1+2+3 presence (project + actors + walkthroughs)

**Dependencies:** None (first document generated)

**Quality Standards:**
- Must explicitly state "Survey gap:" for each missing piece (no placeholder patterns)
- Must quantify completeness (e.g., "Backend section: 60% complete - stack defined, hosting missing")
- Must cite specific survey section paths (e.g., "backend.infrastructure: not present")

---

### RECOMMENDATION.md

**Purpose:** Options analysis for major architecture areas, with trade-offs, alternatives considered, and confidence markers citing DIAGNOSIS gaps.

**When Generated:** Always second (Wave 2). Depends on DIAGNOSIS for gap awareness.

**Section Structure:**

- **Recommendations Overview** - Summary of architecture areas covered, confidence baseline
- **Frontend Framework Recommendation** - If applicable based on project type
- **Backend Framework Recommendation** - If backend exists or project type implies backend
- **Database Recommendation** - If data storage mentioned in walkthroughs or backend
- **Hosting Platform Recommendation** - If deployment mentioned or backend exists
- **Authentication Pattern Recommendation** - If actors include authentication needs
- **API Design Recommendation** - If backend and frontend separation implied
- **Additional Architecture Recommendations** - Other areas based on survey signals

**For Each Recommendation:**
- **Analysis** - What survey data indicates, what patterns are present
- **Recommendation** - Specific technology/approach recommended
- **Alternatives Considered** - Other viable options with pros/cons
- **Trade-offs** - What you gain vs what you give up
- **Confidence** - HIGH/MEDIUM/LOW marker
- **Confidence Rationale** - Why this level, citing DIAGNOSIS gaps and evidence quality

**Survey Mapping:**

- Frontend Framework:
  - Trigger: `project.type` contains "web", "portal", "app" OR walkthroughs mention UI keywords
  - Evidence: `walkthroughs[].steps` UI patterns, actor interaction patterns
- Backend Framework:
  - Trigger: `backend.applicable === true` OR project implies backend
  - Evidence: `backend.stack[]`, walkthrough data_changes patterns
- Database:
  - Trigger: `backend.data_stores[]` exists OR walkthroughs show data persistence
  - Evidence: `backend.data_stores[].entities`, relationship patterns
- Hosting:
  - Trigger: Backend exists OR deployment mentioned
  - Evidence: `backend.hosting.platform`, `backend.infrastructure[]`
- Authentication:
  - Trigger: `actors[]` includes "User" OR walkthroughs show login/signup
  - Evidence: Actor capabilities, security-related rubric items
- API Design:
  - Trigger: Frontend + backend separation indicated
  - Evidence: Walkthrough data flows, integration patterns

**Dependencies:** Requires DIAGNOSIS.md (references gaps identified there)

**Quality Standards:**
- Every recommendation MUST include "Confidence Rationale:" subsection
- Rationale MUST cite specific DIAGNOSIS sections or survey completeness
- Must analyze at least 2 alternatives for each recommendation (or explain why only 1 option)
- Trade-offs must list both positive and negative consequences
- No HIGH confidence if DIAGNOSIS shows gaps in relevant survey sections

---

### ENGINEERING-PROPOSAL.md

**Purpose:** Concrete architectural decisions in ADR (Architecture Decision Record) format, ready for user approval before merge to architecture-decisions.json.

**When Generated:** Always third (Wave 3). Depends on RECOMMENDATION for options analysis.

**Section Structure:**

- **Proposals Overview** - Count of decisions, approval status, confidence distribution
- **Decision Proposals** - One ADR per major decision from RECOMMENDATION
- **Next Steps** - Approval flow instructions, note about Phase 13 approval command

**ADR Format (Per Decision):**

```markdown
# DEC-XXX: [Decision Title]

**Date:** [ISO timestamp]
**Status:** Proposed (awaiting approval)
**Context Source:** survey.json Phase [N]

## Context

[What survey data informed this decision? What problem does this solve? What constraints exist? Reference RECOMMENDATION section.]

## Decision

[The concrete choice being proposed - specific technology, version, pattern]

## Rationale

[Why this choice over alternatives? What benefits? What RECOMMENDATION analysis supports this? What survey evidence?]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Negative
- [Tradeoff 1]
- [Constraint 1]
- [Learning curve/complexity added]

## Alternatives Considered

### Alternative 1: [Name]
**Rejected because:** [Specific reason from RECOMMENDATION analysis]

### Alternative 2: [Name]
**Rejected because:** [Specific reason from RECOMMENDATION analysis]

## Confidence

**[HIGH/MEDIUM/LOW]**

**Confidence Rationale:**
[Why this level? What DIAGNOSIS gaps affect this? What survey evidence supports it? What's missing?]

## Dependencies

[What other decisions does this depend on? What future decisions does this affect? Use DEC-XXX notation.]

## References

- RECOMMENDATION section: [Section name]
- Survey section: `survey.[path.to.data]`
- Related decisions: DEC-XXX, DEC-YYY
```

**Survey Mapping:**

Each ADR maps to a corresponding RECOMMENDATION section:
- Context: Survey sections cited in RECOMMENDATION analysis
- Decision: The recommended option from RECOMMENDATION
- Rationale: Expanded from RECOMMENDATION rationale
- Consequences: Expanded from RECOMMENDATION trade-offs
- Alternatives: From RECOMMENDATION "Alternatives Considered"
- Confidence: Same as RECOMMENDATION confidence with expanded rationale
- Dependencies: Decision graph (e.g., database choice depends on backend framework)

**Dependencies:** Requires RECOMMENDATION.md (converts recommendations to ADRs)

**Quality Standards:**
- All ADRs must have Status: "Proposed (awaiting approval)" (NOT "Accepted" or "Implemented")
- Every ADR MUST include "Confidence Rationale:" section
- Alternatives MUST match RECOMMENDATION alternatives (no new options introduced)
- Context MUST reference specific survey sections using dot notation
- Dependencies MUST use (DEC-XXX) citation format
- No placeholder patterns - if information is missing, state it explicitly in confidence rationale

---

## Document Dependencies (REQ-ENGDOC-02)

Documents must be generated in sequential order because each depends on the previous:

### Wave 1
- DIAGNOSIS.md (no dependencies)

### Wave 2
- RECOMMENDATION.md (reads DIAGNOSIS for gap awareness)

### Wave 3
- ENGINEERING-PROPOSAL.md (reads RECOMMENDATION for ADR conversion)

**Critical:** Cannot skip DIAGNOSIS. RECOMMENDATION confidence markers require gap analysis from DIAGNOSIS. PROPOSAL ADRs require options analysis from RECOMMENDATION.

---

## Confidence Level System (REQ-ENGDOC-03)

All recommendations and proposals must include confidence markers with probabilistic justification.

### Confidence Definitions

**HIGH Confidence (85-90% likelihood of correctness):**
- Well-understood work following familiar patterns
- Complete information available from survey
- Standard industry practice with documented outcomes
- No significant gaps in relevant survey sections
- Clear evidence from walkthroughs and actor needs

**Examples:**
- "Use React for web application" when survey shows web portal with complex UI interactions
- "PostgreSQL for relational data" when survey defines entities with clear relationships
- "OAuth 2.0 for third-party authentication" when actors include external login

**MEDIUM Confidence (50-85% likelihood of correctness):**
- Reasonably well-understood work
- Some information gaps but key constraints known
- Multiple viable options with documented tradeoffs
- Partial survey data in relevant sections
- Recommendation based on standard practices + available evidence

**Examples:**
- "Next.js for React framework" when survey shows web app but no SSR/SSG requirements captured
- "Hosting on Vercel" when deployment mentioned but no specific constraints in survey
- "JWT for session management" when auth needed but session requirements not detailed

**LOW Confidence (<50% likelihood of correctness):**
- Unexplored territory or new patterns
- Significant information gaps in survey
- Recommendation based on assumptions not validated in survey
- Multiple unknowns affecting the decision
- Fallback to industry defaults due to missing information

**Examples:**
- "PostgreSQL for database" when backend.data_stores is empty but walkthroughs imply persistence
- "Docker deployment" when hosting not mentioned but backend exists
- "REST API" when frontend/backend separation implied but not explicitly discussed

### Confidence Rationale Requirements (REQ-ENGDOC-04)

Every recommendation in RECOMMENDATION.md and every decision in ENGINEERING-PROPOSAL.md MUST include:

**"Confidence Rationale:" subsection** with:
1. **Evidence quality statement** - What survey sections support this, how complete they are
2. **Gap acknowledgment** - What's missing from survey that affects confidence
3. **Assumption documentation** - If LOW/MEDIUM, what assumptions were made
4. **Section citations** - Reference specific survey paths (e.g., "backend.infrastructure: not present")

**Example:**
```markdown
### Confidence

**MEDIUM (60-75% likelihood)**

**Confidence Rationale:**
- HIGH confidence in need for relational database (survey.backend.data_stores shows 5 entities with clear relationships, walkthroughs demonstrate complex queries)
- MEDIUM confidence in PostgreSQL vs MySQL choice (both viable, PostgreSQL chosen for JSON support but survey doesn't explicitly require JSON storage)
- Survey gaps affecting confidence:
  - backend.infrastructure: not present (deployment constraints unknown)
  - Performance requirements: not captured in Phase 5 (scalability assumptions made)
  - Backup/HA requirements: not discussed (assuming standard patterns)
- Assumption: Standard OLTP performance acceptable (not validated in survey)
```

---

## Partial Survey Handling (REQ-ENGINT-02)

The engineer agent must gracefully handle incomplete survey data from mid-interview scenarios.

### Minimum Viable Survey

**Required for engineer to proceed:**
- Phase 1 complete: `project.name`, `project.one_liner`, `project.problem_statement`
- Phase 2 complete: `actors[]` array with at least 1 actor
- Phase 3 complete: `walkthroughs[]` array with at least 1 walkthrough

**If minimum not met:**
```
Error: Insufficient survey data for engineering analysis.

Required:
- Project context (Phase 1)
- Actors (Phase 2)
- At least 1 walkthrough (Phase 3)

Current survey missing: [list missing phases]

Run /banneker:survey to complete required phases.
```

### Partial Survey Strategy

**If survey meets minimum but has gaps:**

1. **DIAGNOSIS.md** must explicitly list all gaps
2. **RECOMMENDATION.md** must note gaps in each recommendation's confidence rationale
3. **ENGINEERING-PROPOSAL.md** must document gaps in ADR context sections
4. **Confidence levels** must be reduced for recommendations touching gap areas

**Example gap handling:**
```markdown
## Frontend Framework Recommendation

### Analysis
Survey shows web application (project.type: "web portal") with 3 walkthroughs demonstrating form interactions, navigation, and data display.

**Survey gap:** UI/UX requirements not captured (Phase 4 frontend section incomplete). Recommendation based on walkthrough patterns only.

### Recommendation
React 18+ with TypeScript

### Confidence
**MEDIUM (60-70% likelihood)**

**Confidence Rationale:**
- HIGH confidence that component-based framework needed (walkthroughs show reusable UI patterns)
- MEDIUM confidence in React specifically (industry standard choice, but survey doesn't capture team familiarity or specific framework preferences)
- Survey gap: frontend.framework preference not captured - assuming team has no existing constraints
```

---

## Quality Standards

### Placeholder Detection (REQ-DOCS-003)

Generated documents must NOT contain any of these placeholder patterns:

- `[TODO`
- `[PLACEHOLDER`
- `TBD`
- `FIXME`
- `XXX`
- `<variable_name>` (angle brackets suggesting template variables)
- `<!-- BANNEKER:` (comment directives)
- `{{` (template syntax)
- `{%` (template syntax)

**Instead of placeholders, use explicit gap statements:**
- Good: "Survey gap: authentication approach not discussed in Phase 4. Recommendation assumes standard OAuth 2.0 pattern."
- Bad: "Authentication: [TODO - determine from survey]"

### Term Consistency (REQ-DOCS-004)

All three documents must use consistent terminology:

| Term Type | Source | Consistency Rule |
|-----------|--------|------------------|
| Project name | `survey.project.name` | Exact match, including capitalization |
| Actor names | `survey.actors[].name` | Exact match for all actor references |
| Technology names | `backend.stack[]` + decisions | Use official names (e.g., "PostgreSQL" not "postgres") |
| Entity names | `backend.data_stores[].entities` | Exact match, including singular/plural |
| Integration names | `backend.integrations[].name` | Exact match for service references |

### Decision Citation Format (REQ-DOCS-005)

When ENGINEERING-PROPOSAL.md references other decisions, use ADR citation format:

**Citation Format:** `(DEC-XXX)` where XXX is zero-padded ID

**Examples:**
- "This decision builds on the backend framework choice (DEC-001)."
- "Database selection depends on hosting platform (DEC-004) and framework ORM support (DEC-001)."

**In Dependencies section:**
```markdown
## Dependencies

Depends on:
- DEC-001: Backend framework (affects ORM choice)
- DEC-004: Hosting platform (affects database options)

Affects:
- DEC-007: Caching strategy (database choice impacts cache design)
```

---

## Approval Flow (REQ-APPROVE-01)

**CRITICAL:** Engineer agent MUST NOT merge proposals to architecture-decisions.json automatically.

### Proposal Generation

All decisions in ENGINEERING-PROPOSAL.md have:
- Status: "Proposed (awaiting approval)"
- Not yet in architecture-decisions.json
- Ready for user review

### Completion Message

After generating all three documents, engineer agent must report:

```markdown
Engineering documents generated:
✓ DIAGNOSIS.md (2.1 KB) - 7 gaps identified
✓ RECOMMENDATION.md (4.7 KB) - 8 recommendations (3 HIGH, 4 MEDIUM, 1 LOW confidence)
✓ ENGINEERING-PROPOSAL.md (6.3 KB) - 8 decisions proposed

**Next steps:**
1. Review DIAGNOSIS.md to understand survey gaps
2. Review RECOMMENDATION.md to evaluate options and confidence levels
3. Review ENGINEERING-PROPOSAL.md to see proposed decisions in ADR format
4. Run /banneker:approve-proposal (Phase 13) to approve and merge decisions

**Note:** Decisions are NOT yet in architecture-decisions.json. They require explicit approval.
```

### No Auto-Merge

Engineer agent must:
- Generate ENGINEERING-PROPOSAL.md as markdown (human-readable)
- NOT parse ADRs into JSON
- NOT write to architecture-decisions.json
- NOT update decision IDs or statuses
- Leave approval for Phase 13 approval flow

---

## State Management (REQ-ENGINT-05)

Engineer agent must track progress for resume capability.

### State File Structure

`.banneker/state/engineer-state.md`:

```markdown
---
command: engineer
status: in-progress
started_at: 2026-02-03T10:00:00Z
items_completed: 1
items_total: 3
current_position: "RECOMMENDATION.md generation"
---

## Progress

- [x] DIAGNOSIS.md (completed 2026-02-03T10:05:00Z)
- [ ] RECOMMENDATION.md (in progress)
- [ ] ENGINEERING-PROPOSAL.md (pending)

## Survey Analysis

**Survey completeness:** 65% (Phases 1-3 complete, Phase 4 partial, Phase 5-6 missing)

**Identified gaps:**
- backend.infrastructure: Hosting details not captured
- rubric_coverage.gaps: ["testing-strategy", "deployment-process", "monitoring"]

**Confidence baseline:** MEDIUM (complete requirements, incomplete infrastructure/ops)

## Generated Documents

### DIAGNOSIS.md
- Path: .banneker/documents/DIAGNOSIS.md
- Size: 2847 bytes
- Gap count: 7

## Next Steps

1. Generate RECOMMENDATION.md addressing identified gaps
2. Mark recommendations touching gap areas as MEDIUM or LOW confidence
3. Generate ENGINEERING-PROPOSAL.md with ADR format decisions
```

### State Updates

After each document completes:
1. Update `items_completed` counter
2. Mark document as complete with timestamp
3. Update `current_position` to next document
4. Save state file

On full completion:
1. Update status to "complete"
2. Add completion timestamp
3. Delete state file (or keep for history)

### Resume Handling

If engineer agent spawns and finds existing state file:
1. Parse completed documents
2. Skip already-generated documents
3. Continue from current_position
4. Use same survey analysis (don't recompute)

---

## Usage Notes

This catalog is a reference for the banneker-engineer sub-agent. It is NOT a user-facing document.

**Engineer agent responsibilities:**
1. Load this catalog during initialization
2. Use section structures as generation templates
3. Apply confidence level definitions consistently
4. Follow ADR format exactly for proposals
5. Track state for resume capability
6. Never auto-merge proposals to architecture-decisions.json

**Quality assurance checklist:**
- [ ] All three documents generated
- [ ] DIAGNOSIS explicitly lists all gaps
- [ ] RECOMMENDATION has confidence rationale for every recommendation
- [ ] ENGINEERING-PROPOSAL uses ADR format with all required sections
- [ ] No placeholder patterns in any document
- [ ] Term consistency across all documents
- [ ] All proposals marked "Status: Proposed (awaiting approval)"
- [ ] Completion message notes that approval is required
