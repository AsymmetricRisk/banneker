# Phase 11: Engineer Agent Core - Research

**Researched:** 2026-02-03
**Domain:** AI agent orchestration, engineering document synthesis, confidence assessment
**Confidence:** HIGH

## Summary

Phase 11 implements a standalone engineer capability that synthesizes survey data into actionable engineering documents with explicit confidence levels. The engineer agent follows the established Banneker pattern: orchestrator skill file spawns sub-agent, sub-agent generates outputs, state management enables resume-on-interrupt.

The research identified three critical domains: (1) three-document architecture (DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md) with clear dependency flow, (2) confidence level system using HIGH/MEDIUM/LOW markers with probabilistic justifications borrowed from engineering estimation practices, and (3) partial data handling that gracefully operates with incomplete survey.json files from mid-interview cliff scenarios.

**Primary recommendation:** Follow the established banneker-architect → banneker-writer pattern, creating banneker-engineer sub-agent that reads survey.json, identifies gaps, synthesizes recommendations with confidence markers, and generates DEC-XXX proposals for approval. Use Architecture Decision Records (ADR) format for ENGINEERING-PROPOSAL.md structure.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 18.0+ | File I/O, JSON parsing | Zero-dependency constraint (REQ-INST-007) |
| Task() tool | N/A | Sub-agent spawning | Banneker established pattern |
| Read/Write tools | N/A | File operations | Claude Code standard tools |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Markdown templates | N/A | Document structure | All three output documents |
| JSON Schema | draft/2020-12 | survey.json validation | Parsing partial survey data |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node.js built-ins | External libraries (lodash, ajv) | Violates zero-dependency constraint |
| Markdown output | JSON output | Less human-readable, doesn't match Banneker document pattern |
| Single document | Three separate docs | Reduces separation of concerns (diagnosis vs recommendation vs proposal) |

**Installation:**
No installation required - uses Node.js built-ins only.

## Architecture Patterns

### Recommended Project Structure
```
templates/
├── agents/
│   └── banneker-engineer.md       # Sub-agent that generates three docs
├── commands/
│   └── banneker-engineer.md       # Orchestrator skill file
└── config/
    └── engineering-catalog.md     # Document structures, confidence rules
.banneker/
├── survey.json                    # Input (may be partial)
├── architecture-decisions.json    # Output appends here (on approval)
├── documents/
│   ├── DIAGNOSIS.md              # Gap analysis output
│   ├── RECOMMENDATION.md         # Options analysis output
│   └── ENGINEERING-PROPOSAL.md   # DEC-XXX proposals output
└── state/
    └── engineer-state.md         # Resume state
```

### Pattern 1: Orchestrator → Sub-Agent Spawning
**What:** Skill orchestrator handles prerequisites/resume, spawns sub-agent via Task() tool, validates outputs.

**When to use:** All Banneker long-running document generation commands.

**Example:**
```markdown
// Source: templates/commands/banneker-architect.md (lines 90-110)
## Step 3: Spawn Architect Sub-Agent

Use the Task tool to spawn the `banneker-architect` sub-agent:

- **Task name**: "Determine document set and generate planning documents"
- **Agent reference**: `banneker-architect`
- **Context to pass**:
  - If **resuming**: Pass state file content
  - If **fresh start**: Pass "Fresh start" instruction

The architect agent will:
- Load survey.json and architecture-decisions.json
- Determine which documents are applicable
- Generate documents in dependency-ordered waves
- Write state updates after each document
- Delete state file on success
```

**Application to Engineer:** banneker-engineer orchestrator spawns banneker-engineer sub-agent with survey.json (partial or complete), sub-agent generates three documents sequentially (DIAGNOSIS → RECOMMENDATION → PROPOSAL).

### Pattern 2: State Management for Resume Capability
**What:** Write incremental state to `.banneker/state/{command}-state.md`, check for state on startup, offer resume.

**When to use:** Commands that take >30 seconds or have multiple discrete steps.

**Example:**
```markdown
// Source: templates/agents/banneker-architect.md (lines 586-635)
**State File Structure:**

## Architect Generation State

**Started:** 2026-02-02T15:30:00Z
**Last updated:** 2026-02-02T15:45:00Z

## Document Set

Total documents to generate: 7

### Completed Documents

- [x] TECHNICAL-SUMMARY.md (completed 2026-02-02T15:32:00Z)
- [x] STACK.md (completed 2026-02-02T15:38:00Z)

### Pending Documents

- [ ] TECHNICAL-DRAFT.md (Wave 2)
- [ ] DEVELOPER-HANDBOOK.md (Wave 3)

## Current Wave

Wave 3 of 4
```

**Application to Engineer:** Track completion of DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md. If interrupted after DIAGNOSIS, resume shows completed diagnosis and continues to RECOMMENDATION.

### Pattern 3: Confidence Levels with Probabilistic Justification
**What:** Assign HIGH/MEDIUM/LOW confidence to recommendations based on evidence quality, with justification explaining the confidence level.

**When to use:** Engineering recommendations where certainty varies based on available information.

**Example:**
```markdown
// Source: Engineering estimation research (MERAK systems)
**HIGH Confidence (85-90% likelihood):**
- Well-understood work following familiar patterns
- Complete information available from survey
- Standard industry practice with known outcomes

**MEDIUM Confidence (50-85% likelihood):**
- Reasonably well-understood work
- Some information gaps but key constraints known
- Multiple viable options with documented tradeoffs

**LOW Confidence (<50% likelihood):**
- Unexplored territory or new patterns
- Significant information gaps in survey
- Recommendation based on limited evidence
```

**Application to Engineer:** Each recommendation in RECOMMENDATION.md and each decision in ENGINEERING-PROPOSAL.md includes confidence marker with justification citing survey completeness, industry standard clarity, or gap presence.

### Pattern 4: Architecture Decision Records (ADR) Format
**What:** Structured decision documentation with context, decision, consequences, and alternatives considered.

**When to use:** Documenting architectural choices for future reference and team communication.

**Example:**
```markdown
// Source: GitHub joelparkerhenderson/architecture-decision-record
# ADR-001: Use React for Frontend Framework

## Status
Proposed

## Context
Survey indicates web application with interactive UI (3 walkthroughs mention "form", "click", "navigate"). Project type flagged as "web portal".

## Decision
Use React 18+ with TypeScript for frontend framework.

## Consequences
**Positive:**
- Component reusability matches modular UI patterns in walkthroughs
- TypeScript provides type safety for complex state management
- Large ecosystem and hiring pool

**Negative:**
- Learning curve for team unfamiliar with React
- Build tooling complexity (Webpack/Vite required)

## Alternatives Considered
- **Vue.js**: Rejected due to smaller ecosystem for enterprise patterns
- **Vanilla JavaScript**: Rejected due to lack of structure for multi-page app
- **Angular**: Rejected due to steeper learning curve and heavier framework

## Confidence
MEDIUM - Survey confirms need for component-based UI, but specific framework choice based on industry standard practices not explicit user requirement.
```

**Application to Engineer:** ENGINEERING-PROPOSAL.md uses ADR format for each DEC-XXX decision, including confidence marker in a dedicated section.

### Pattern 5: Partial Data Handling with Graceful Degradation
**What:** Detect missing/incomplete survey sections, note gaps in DIAGNOSIS.md, generate recommendations with reduced confidence when data incomplete.

**When to use:** Mid-interview cliff scenarios where survey.json exists but lacks complete Phase 4/5/6 data.

**Example:**
```markdown
// Source: banneker-writer.md (lines 92-97)
**Missing Information:**

- If information is genuinely missing from survey_data for a required section, write: "This section requires additional information not captured in the current survey. Run `/banneker:survey` to update."
- DO NOT insert `[TODO]`, `TBD`, `FIXME`, or any placeholder marker.
- DO NOT make up information not in the survey.
```

**Application to Engineer:** DIAGNOSIS.md explicitly lists missing survey sections. RECOMMENDATION.md generates options with caveats like "Note: Backend infrastructure not captured in survey; recommendation assumes cloud hosting." ENGINEERING-PROPOSAL.md marks decisions as LOW confidence when based on assumptions.

### Anti-Patterns to Avoid

- **Autonomous Decision Execution:** NEVER merge decisions to architecture-decisions.json without user approval. This destroys trust (APPROVE-01 requirement).
- **Single-Document Monolith:** Don't combine diagnosis, recommendation, and proposal into one file. Separation of concerns enables independent review and iteration.
- **Placeholder Pollution:** Zero tolerance for `[TODO]`, `TBD`, `<variable>` markers. State missing information explicitly: "Survey gap: authentication approach not discussed."
- **Invented Survey Data:** Never infer project details not in survey.json. If backend.data_stores is empty, don't assume PostgreSQL. State the gap instead.
- **Confidence Without Justification:** Every HIGH/MEDIUM/LOW marker must include "Confidence rationale:" explaining why this level was assigned.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confidence scoring | Custom percentage system | HIGH/MEDIUM/LOW with probabilistic ranges | Industry-standard estimation practice, matches how engineering teams communicate uncertainty |
| Decision documentation | Custom markdown format | ADR (Architecture Decision Record) format | Established pattern with tooling support, GitHub examples, team familiarity |
| Survey schema validation | String checks and conditionals | JSON Schema validation (Node.js built-in) | Handles complex oneOf/anyOf patterns, provides clear error messages |
| Partial data detection | Manual null checks | Schema-based required field analysis | Comprehensive, catches missing nested properties |
| Document dependencies | Hardcoded generation order | Dependency graph from catalog | Scales to additional documents, explicit reasoning |

**Key insight:** Engineering decision-making and documentation patterns are mature domains with established formats (ADRs), confidence systems (estimation practices), and validation approaches (JSON Schema). Don't reinvent these wheels.

## Common Pitfalls

### Pitfall 1: False Confidence from Incomplete Data
**What goes wrong:** Engineer generates HIGH confidence recommendations based on partial survey that's missing critical backend/infrastructure details.

**Why it happens:** Survey.json parses as valid JSON even when Phase 4 (backend) was skipped or Phase 5 (gaps) wasn't thorough.

**How to avoid:**
1. Check `survey.rubric_coverage.gaps[]` array - if non-empty, flag in DIAGNOSIS.md
2. Validate required sections exist: `backend.applicable` must be present (true or false)
3. If `backend.applicable === true` but `backend.data_stores` is empty or missing, mark as survey gap
4. Downgrade confidence for any recommendation touching areas flagged in gaps array

**Warning signs:**
- DIAGNOSIS.md shows no gaps despite survey being <2KB (suspiciously small)
- RECOMMENDATION.md has all HIGH confidence markers (unrealistic)
- ENGINEERING-PROPOSAL.md proposes database without `backend.data_stores` in survey

### Pitfall 2: Recommendation-Proposal Misalignment
**What goes wrong:** RECOMMENDATION.md discusses three options (PostgreSQL, MongoDB, DynamoDB), but ENGINEERING-PROPOSAL.md proposes MySQL which wasn't analyzed.

**Why it happens:** Engineer sub-agent doesn't maintain cross-document consistency state, generates PROPOSAL independently from RECOMMENDATION.

**How to avoid:**
1. Generate documents sequentially: DIAGNOSIS → RECOMMENDATION → PROPOSAL
2. Pass RECOMMENDATION.md content to PROPOSAL generation step as dependency
3. Validate PROPOSAL decisions only reference technologies/approaches analyzed in RECOMMENDATION
4. Include "Options Considered" section in each PROPOSAL decision citing RECOMMENDATION sections

**Warning signs:**
- grep "PostgreSQL" RECOMMENDATION.md returns results, grep "PostgreSQL" ENGINEERING-PROPOSAL.md returns nothing
- PROPOSAL contains decisions not mentioned in RECOMMENDATION at all
- PROPOSAL decision count < RECOMMENDATION recommendation count (missing decisions)

### Pitfall 3: Approval Gate Bypass Temptation
**What goes wrong:** Engineer writes PROPOSAL directly to architecture-decisions.json without user approval, violating APPROVE-01.

**Why it happens:** Workflow optimization temptation - "why generate JSON just to copy it elsewhere?"

**How to avoid:**
1. ENGINEERING-PROPOSAL.md is markdown, NOT JSON - human-readable format for review
2. Require explicit user command `/banneker:approve-proposal` to merge decisions (Phase 13 implementation)
3. Document approval flow in engineer orchestrator: "Proposals require approval before merging. Run /banneker:approve-proposal to review and approve decisions."
4. State management tracks "proposal generated" but NOT "proposal approved" - separate states

**Warning signs:**
- architecture-decisions.json modified timestamp matches ENGINEERING-PROPOSAL.md (auto-merge)
- No approval prompt in engineer orchestrator completion message
- User doesn't see proposal before decisions appear in architecture-decisions.json

### Pitfall 4: Undocumented Confidence Rationale
**What goes wrong:** Recommendation shows "Confidence: MEDIUM" with no explanation why MEDIUM vs HIGH or LOW.

**Why it happens:** Confidence marker treated as decoration rather than analytical output requiring justification.

**How to avoid:**
1. Template structure requires "Confidence Rationale:" subsection after each recommendation
2. Rationale must cite specific evidence: "MEDIUM confidence: survey provides complete actor/walkthrough data (HIGH for requirements understanding) but lacks infrastructure details (LOW for deployment recommendations), averaging to MEDIUM overall confidence"
3. Validation check: grep all confidence markers, verify each has matching rationale paragraph within 5 lines
4. Quality standard: confidence rationale must reference survey sections by name or flag gaps

**Warning signs:**
- Confidence markers without nearby "Rationale:" keyword
- Rationale that just restates the marker: "Medium confidence because we're moderately confident"
- All confidence rationales identical (copy-paste text)

## Code Examples

Verified patterns from official sources:

### Parsing Partial Survey Data
```javascript
// Source: Node.js JSON.parse + schema validation pattern
const fs = require('fs');

function loadSurveyWithGapDetection(surveyPath) {
    // Read survey file
    const surveyContent = fs.readFileSync(surveyPath, 'utf8');
    const survey = JSON.parse(surveyContent);

    // Detect gaps based on schema requirements
    const gaps = [];

    // Check backend section completeness
    if (survey.backend && survey.backend.applicable === true) {
        if (!survey.backend.data_stores || survey.backend.data_stores.length === 0) {
            gaps.push('backend.data_stores: No data stores defined');
        }
        if (!survey.backend.integrations) {
            gaps.push('backend.integrations: Integrations not captured');
        }
        if (!survey.backend.infrastructure || survey.backend.infrastructure.length === 0) {
            gaps.push('backend.infrastructure: Hosting details missing');
        }
    }

    // Check rubric coverage gaps
    if (survey.rubric_coverage && survey.rubric_coverage.gaps) {
        gaps.push(...survey.rubric_coverage.gaps.map(g => `rubric_gap: ${g}`));
    }

    return { survey, gaps };
}
```

### Confidence Marker with Justification
```markdown
// Source: ADR format + engineering estimation practices
## Recommendation 3: Use PostgreSQL for Relational Data Storage

### Analysis
Survey indicates 3 entities with relationships (User, Task, Project) requiring ACID transactions. Walkthroughs show complex queries ("show all tasks for project grouped by status").

### Recommendation
PostgreSQL 15+ as primary relational database.

### Alternatives Considered
- **MongoDB**: Rejected - relationship complexity better suited to relational model
- **MySQL**: Viable alternative, but PostgreSQL JSON support useful for flexible attributes
- **SQLite**: Rejected - multi-user access patterns from survey require client-server DB

### Confidence
**MEDIUM (60-75% likelihood of correctness)**

**Confidence Rationale:**
- HIGH confidence in need for relational DB (survey explicitly describes entity relationships, complete walkthrough data)
- MEDIUM confidence in PostgreSQL vs MySQL choice (both viable, PostgreSQL chosen based on JSON flexibility but survey doesn't explicitly require JSON storage)
- Survey gaps: No performance requirements discussed (Phase 5 gaps), assumption that standard OLTP performance acceptable
- Survey gaps: No backup/HA requirements mentioned, assuming standard deployment patterns

**Evidence Quality:**
- Complete: Entity structure, relationship patterns
- Partial: Performance requirements, scalability needs
- Missing: Backup strategy, high-availability requirements
```

### State File for Resume
```markdown
// Source: architect-state.md.backup pattern
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

**Confidence baseline:** MEDIUM (complete requirements understanding, incomplete infrastructure/ops understanding)

## Generated Documents

### DIAGNOSIS.md
- Path: .banneker/documents/DIAGNOSIS.md
- Size: 2847 bytes
- Gap count: 5

## Next Steps

1. Generate RECOMMENDATION.md addressing identified gaps
2. Mark recommendations touching gap areas as MEDIUM or LOW confidence
3. Generate ENGINEERING-PROPOSAL.md with ADR format decisions
```

### ADR-Format Decision Template
```markdown
// Source: GitHub joelparkerhenderson/architecture-decision-record
# DEC-XXX: [Decision Title]

**Date:** 2026-02-03
**Status:** Proposed (awaiting approval)
**Context Source:** survey.json Phase [N]

## Context

[What survey data informed this decision? What problem does this solve? What constraints exist?]

## Decision

[The concrete choice being proposed]

## Rationale

[Why this choice over alternatives? What benefits does it provide? What does survey data indicate?]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Tradeoff 1]
- [Constraint 1]

## Alternatives Considered

### Alternative 1: [Name]
**Rejected because:** [Reason]

### Alternative 2: [Name]
**Rejected because:** [Reason]

## Confidence

**[HIGH/MEDIUM/LOW]**

**Confidence Rationale:**
[Why this confidence level? What evidence supports it? What's missing?]

## Dependencies

[What other decisions does this depend on or impact?]

## References

- Survey section: `survey.[path.to.data]`
- Related decisions: DEC-XXX, DEC-YYY
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single ENGINEERING.md document | Three-document split (DIAGNOSIS/RECOMMENDATION/PROPOSAL) | v0.3.0 planning (2026-01) | Separation of concerns enables independent iteration on recommendations without regenerating diagnosis |
| Unstructured confidence ("probably works") | HIGH/MEDIUM/LOW with probabilistic ranges | Engineering estimation best practices (2015+) | Quantifiable uncertainty, stakeholder decision-making clarity |
| Ad-hoc decision logs | ADR (Architecture Decision Record) format | Industry standard (2011+, GitHub adoption 2016+) | Structured rationale, alternative documentation, consequence tracking |
| Complete survey requirement | Partial survey support | v0.3.0 cliff detection feature (2026-01) | Enables mid-interview mode switch when user hits knowledge cliff |
| JSON decision output | Markdown proposal requiring approval | v0.3.0 approval flow (2026-01) | Prevents autonomous decision execution, maintains user trust |

**Deprecated/outdated:**
- **Immediate decision merge**: v0.2.0 and earlier had no approval gate. v0.3.0 requires explicit approval step (APPROVE-01).
- **Single confidence level per document**: Earlier practice was document-level confidence. Current practice is recommendation-level confidence for granular certainty tracking.

## Open Questions

Things that couldn't be fully resolved:

1. **Confidence Level Thresholds**
   - What we know: Industry uses 85-90% for HIGH, 50-85% for MEDIUM, <50% for LOW in engineering estimation
   - What's unclear: How to map survey completeness percentages to confidence levels (is 70% survey complete = MEDIUM confidence for all recommendations, or per-recommendation analysis?)
   - Recommendation: Use per-recommendation analysis. Survey completeness informs baseline, but each recommendation confidence depends on which survey sections it relies on. Document the mapping in engineering-catalog.md.

2. **Minimum Viable Survey for Engineer**
   - What we know: survey.json schema requires `survey_metadata`, `project`, `actors`, `walkthroughs`, `backend`, `rubric_coverage` top-level keys
   - What's unclear: What's the minimum viable subset? Can engineer run with just Phase 1 (pitch)? Or requires Phase 1+2+3 (pitch+actors+walkthroughs)?
   - Recommendation: Minimum viable = Phase 1+2+3 complete (project details, actors, at least 1 walkthrough). This enables gap diagnosis and basic recommendations. Document in ENGINT-02 requirement test cases.

3. **Recommendation Count Heuristics**
   - What we know: RECOMMENDATION.md should analyze options for major architecture areas (frontend framework, backend framework, database, hosting, auth pattern)
   - What's unclear: How many recommendations is too many? Should engineer limit to top 5 decisions, or generate recommendations for all gaps?
   - Recommendation: Generate recommendations for all major architecture areas touched by survey data. If survey is very incomplete (<50% complete), limit to top 5 critical decisions. Document heuristic in engineering-catalog.md.

4. **Cross-Document Validation**
   - What we know: ENGINEERING-PROPOSAL.md decisions must align with RECOMMENDATION.md analysis
   - What's unclear: Should validation be automated (parse both docs, verify proposal decisions cite recommendation sections)? Or manual review?
   - Recommendation: Start with manual validation in Phase 11 (planner notes validation step). Consider automated validation in Phase 15 (polish) if validation failures are common in testing. Flag as potential enhancement.

## Sources

### Primary (HIGH confidence)
- Banneker codebase: templates/agents/banneker-surveyor.md, banneker-architect.md, banneker-writer.md (existing agent patterns)
- Banneker codebase: schemas/survey.schema.json, architecture-decisions.schema.json (data structures)
- Banneker codebase: templates/commands/banneker-architect.md (orchestrator pattern)
- Banneker codebase: .banneker/state/*.md.backup (state management examples)
- Banneker codebase: templates/config/document-catalog.md (document structure patterns)

### Secondary (MEDIUM confidence)
- [Estimating With Confidence Levels - MERAK](https://meraksystems.com/blog/2015/05/15/071-estimating-with-confidence-levels/) - HIGH/MEDIUM/LOW definitions for engineering estimates
- [Architecture Decision Records - GitHub](https://github.com/joelparkerhenderson/architecture-decision-record) - ADR format and examples
- [8 best practices for creating architecture decision records - TechTarget](https://www.techtarget.com/searchapparchitecture/tip/4-best-practices-for-creating-architecture-decision-records) - ADR implementation guidance
- [How to make software architecture trade-off decisions - Medium](https://medium.com/@alex.wauters/how-to-make-architecture-trade-off-decisions-cb23482e1dfe) - Tradeoff analysis methods
- [Effective Gap Analysis for Engineering Managers in 5 Steps](https://www.effectiveem.com/effective-gap-analysis/) - Gap analysis methodology

### Tertiary (LOW confidence)
- [Technical Documentation Trends 2026 - Fluid Topics](https://www.fluidtopics.com/blog/industry-insights/technical-documentation-trends-2026/) - AI-driven gap analysis trends (speculative for 2026, not verified practices)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from existing Banneker codebase patterns, zero-dependency constraint is explicit requirement
- Architecture: HIGH - Three-document structure follows document-catalog.md pattern, orchestrator→sub-agent matches architect/writer pattern, state management matches surveyor/architect pattern
- Pitfalls: MEDIUM - Based on analysis of existing codebase validation patterns and requirement constraints, but not verified through real-world engineer agent testing

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, established patterns unlikely to change)
