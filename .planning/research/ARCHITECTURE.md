# Architecture Patterns: Engineer Command Integration

**Domain:** /banneker:engineer command integration with existing survey pipeline
**Researched:** 2026-02-03
**Confidence:** HIGH (based on codebase analysis)

## Executive Summary

The `/banneker:engineer` command integrates with the existing Banneker pipeline at two points: (1) mid-survey cliff detection as an optional takeover, and (2) post-survey standalone invocation. The command produces three documents (DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md) that follow the existing document generation patterns but with a distinct flow: the engineer agent synthesizes decisions autonomously rather than extracting them from user interviews.

The recommended architecture is a **new agent (banneker-engineer)** with a **new command (banneker-engineer.md)**, rather than extending the surveyor. The engineer operates downstream of survey but upstream of architecture-decisions.json merge, requiring user approval before decisions become authoritative.

## Existing Architecture Overview

### Current Component Structure

```
Commands (user entry points)           Agents (Task-spawned workers)
------------------------------------   ------------------------------------
banneker-survey.md                     banneker-surveyor.md
  |                                      |
  +--spawns via Task tool-------------->+
  |                                      |
  +--verifies outputs                    +--writes survey.json
                                         +--writes architecture-decisions.json
                                         +--manages survey-state.md

banneker-architect.md                  banneker-architect.md (agent)
  |                                      |
  +--spawns via Task tool-------------->+
  |                                      |
  +--verifies documents                  +--spawns banneker-writer per doc
                                         +--validates outputs
                                         +--manages architect-state.md
```

### Data Flow (Current)

```
User Interview
     |
     v
+------------------+
| survey.json      |  (project, actors, walkthroughs, backend, rubric)
+------------------+
     |
     v
+---------------------------+
| architecture-decisions.json | (DEC-XXX records with rationale)
+---------------------------+
     |
     v
+------------------+
| banneker-architect |
+------------------+
     |
     v
+------------------+
| .banneker/documents/*.md |
+------------------+
```

### State Management Pattern

All long-running commands use `.banneker/state/{command}-state.md` files:
- YAML frontmatter: command, status, started_at, items_completed, items_total, current_position
- Markdown body: progress checklist, context, next steps
- Deleted on successful completion
- Preserved on failure for resume

## Engineer Command Integration Points

### Integration Point 1: Mid-Survey Cliff Detection

**Location:** Inside `banneker-surveyor` agent, during any of the 6 phases.

**Trigger signals** (phrases indicating user has reached knowledge limit):
- "I don't know"
- "whatever you think"
- "take it from here"
- "you decide"
- "I'm not sure about the technical details"
- "just pick something reasonable"

**Integration mechanism:**

```
During survey phase N:
  |
  +--User response matches cliff pattern
  |
  v
+---------------------------+
| Surveyor detects cliff    |
+---------------------------+
  |
  v
+---------------------------+
| Surveyor offers takeover: |
| "I can switch to engineer |
|  mode and make technical  |
|  decisions for you. Want  |
|  me to take it from here?"|
+---------------------------+
  |
  +--User accepts--> Surveyor saves state, transfers to engineer
  |
  +--User declines--> Surveyor continues interview normally
```

**State transfer on takeover:**

The surveyor must write its current state to `survey-state.md` with:
- All phases completed so far
- Partial data from current phase
- Flag: `cliff_detected: true`
- Flag: `transfer_to_engineer: true`
- Timestamp of transfer

The engineer then reads this state and continues from whatever context exists.

### Integration Point 2: Post-Survey Standalone

**Location:** After `survey.json` and `architecture-decisions.json` exist.

**Trigger:** User runs `/banneker:engineer` directly.

**Integration mechanism:**

```
User runs /banneker:engineer
     |
     v
+---------------------------+
| Check for survey.json     |
+---------------------------+
  |
  +--Exists--> Engineer has full context
  |
  +--Missing--> Engineer has minimal context (project directory only)
```

The engineer can operate with:
1. **Full context:** survey.json + architecture-decisions.json exist
2. **Partial context:** survey.json exists but incomplete
3. **Minimal context:** No survey data, only codebase files

## Recommended Architecture

### New vs Modified Components

| Component | Action | Rationale |
|-----------|--------|-----------|
| `banneker-engineer.md` (command) | **NEW** | New entry point for standalone invocation |
| `banneker-engineer.md` (agent) | **NEW** | Distinct behavior from surveyor: synthesizes vs extracts |
| `banneker-surveyor.md` (agent) | **MODIFY** | Add cliff detection + transfer-to-engineer logic |
| `banneker-survey.md` (command) | **MODIFY** | Handle engineer takeover path in verification step |

### Why New Agent vs Extending Surveyor

**Arguments for new agent:**
1. **Different cognitive mode:** Surveyor extracts; engineer synthesizes
2. **Different input sources:** Surveyor needs user; engineer can work from context alone
3. **Different outputs:** Surveyor produces JSON; engineer produces documents
4. **Cleaner resume logic:** Separate state files, separate completion criteria
5. **Testability:** Can test engineer independently of survey flow

**Arguments against extending surveyor (rejected):**
1. Would bloat surveyor with conditional paths
2. Would complicate state file interpretation
3. Would make the "interview vs takeover" boundary fuzzy

**Decision:** New agent is cleaner. The surveyor stays focused on interviewing; the engineer stays focused on decision-making.

### Component Boundaries

```
+------------------------+     +------------------------+
| banneker-survey.md     |     | banneker-engineer.md   |
| (command)              |     | (command)              |
+------------------------+     +------------------------+
         |                              |
         v                              v
+------------------------+     +------------------------+
| banneker-surveyor.md   |     | banneker-engineer.md   |
| (agent)                |     | (agent)                |
+------------------------+     +------------------------+
         |                              |
         | detects cliff                | reads survey context
         | offers takeover              | synthesizes decisions
         |                              | produces 3 documents
         v                              v
+------------------------+     +------------------------+
| survey-state.md        |     | engineer-state.md      |
| (with transfer flag)   |     | (tracks 3 docs)        |
+------------------------+     +------------------------+
```

### Data Flow for Engineer Documents

```
Input Sources (any combination):
+------------------+     +---------------------------+     +------------------+
| survey.json      |     | architecture-decisions.json |   | Codebase files   |
| (if exists)      |     | (if exists)               |     | (always available)|
+------------------+     +---------------------------+     +------------------+
         |                         |                              |
         +-------------------------+------------------------------+
                                   |
                                   v
                     +---------------------------+
                     | banneker-engineer (agent) |
                     +---------------------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+------------------+     +---------------------+     +------------------------+
| DIAGNOSIS.md     |     | RECOMMENDATION.md   |     | ENGINEERING-PROPOSAL.md|
| (what we know,   |     | (what we should     |     | (specific decisions    |
|  what we don't)  |     |  consider)          |     |  with rationale)       |
+------------------+     +---------------------+     +------------------------+
                                   |
                                   v
                     +---------------------------+
                     | User reviews proposal     |
                     +---------------------------+
                                   |
         +-------------------------+
         |                         |
         v                         v
+------------------+     +---------------------------+
| User approves    |     | User requests changes     |
| (merge to arch-  |     | (engineer revises)        |
| decisions.json)  |     |                           |
+------------------+     +---------------------------+
```

## Three Output Documents

### DIAGNOSIS.md

**Purpose:** Surface what the engineer knows and what gaps exist.

**Sections:**
1. **Context Summary** - What information is available (survey data, existing decisions, codebase signals)
2. **Known Constraints** - Explicit constraints from survey or existing decisions
3. **Inferred Constraints** - Constraints the engineer deduces from codebase or project type
4. **Knowledge Gaps** - What's missing that would inform decisions
5. **Assumptions Made** - Explicit statement of assumptions the engineer is making

**Generation order:** First (no dependencies)

### RECOMMENDATION.md

**Purpose:** Present options and tradeoffs for key decisions.

**Sections:**
1. **Decisions Required** - List of architectural decisions that need to be made
2. **Options Analysis** - For each decision: options, pros/cons, tradeoffs
3. **Dependencies Between Decisions** - Which decisions constrain others
4. **Risk Assessment** - Risks associated with different paths
5. **Recommended Approach** - Engineer's suggested path with rationale

**Generation order:** Second (depends on DIAGNOSIS.md)

### ENGINEERING-PROPOSAL.md

**Purpose:** Concrete decisions ready for approval.

**Sections:**
1. **Proposed Decisions** - DEC-XXX format decisions with question, choice, rationale, alternatives
2. **Implementation Implications** - What each decision means for the build
3. **Sequencing** - Suggested order of implementation
4. **Open Questions** - Items that still need user input
5. **Approval Request** - Explicit ask: "Approve these decisions? (Y/n/edit)"

**Generation order:** Third (depends on RECOMMENDATION.md)

## Approval Flow Before Architecture Merge

**Critical:** Engineer-produced decisions must NOT automatically merge into `architecture-decisions.json`. The user must approve.

```
Engineer completes ENGINEERING-PROPOSAL.md
     |
     v
+---------------------------+
| Engineer presents summary |
| to user with decision     |
| list and asks for approval|
+---------------------------+
     |
     +--User approves all--> Merge all DEC-XXX to architecture-decisions.json
     |
     +--User approves some--> Merge approved, flag others for revision
     |
     +--User rejects--> No merge, user may re-run engineer with guidance
     |
     +--User requests edits--> Engineer revises proposal
```

**Merge mechanism:**

1. Read existing `architecture-decisions.json`
2. Determine next DEC-XXX number (e.g., if DEC-009 exists, new ones start at DEC-010)
3. Append approved decisions with new IDs
4. Write updated JSON
5. Update ENGINEERING-PROPOSAL.md to reflect merged IDs

## State Management for Engineer

### engineer-state.md Structure

```yaml
---
command: engineer
status: in-progress
started_at: 2026-02-03T14:00:00Z
items_completed: 1
items_total: 4
current_position: "Document 2: RECOMMENDATION.md"
source: "standalone"  # or "survey-takeover"
survey_phase_at_takeover: null  # or "Phase 3: Walkthroughs"
---

## Progress

- [x] DIAGNOSIS.md (completed 2026-02-03T14:05:00Z)
- [ ] RECOMMENDATION.md (in progress)
- [ ] ENGINEERING-PROPOSAL.md
- [ ] User approval

## Context Sources

- survey.json: yes (complete)
- architecture-decisions.json: yes (9 decisions)
- codebase files: yes (analyzed)

## Proposed Decisions

- ENG-001: Database choice (pending)
- ENG-002: Auth mechanism (pending)
- ENG-003: Deployment platform (pending)

## Approval Status

Awaiting user review.
```

### Resume Scenarios

| Scenario | Detected By | Resume Action |
|----------|-------------|---------------|
| Engineer interrupted mid-DIAGNOSIS | `items_completed: 0`, DIAGNOSIS.md missing | Restart DIAGNOSIS generation |
| Engineer interrupted mid-RECOMMENDATION | `items_completed: 1`, RECOMMENDATION.md missing | Resume from RECOMMENDATION |
| Engineer waiting for approval | `current_position: "User approval"` | Re-present proposal |
| Survey transferred to engineer | `source: "survey-takeover"` | Continue from transfer point |

## Suggested Build Order

Based on dependencies and integration complexity:

### Phase 1: Engineer Agent Core (no survey integration yet)

**Files to create:**
- `templates/agents/banneker-engineer.md` - Agent definition
- `templates/commands/banneker-engineer.md` - Command orchestrator
- `schemas/engineering-proposal.schema.json` - Schema for ENG-XXX decisions

**Success criteria:**
- `/banneker:engineer` runs standalone
- Reads existing survey.json if present
- Produces DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md
- Manages engineer-state.md for resume

### Phase 2: Approval Flow

**Files to modify:**
- `templates/commands/banneker-engineer.md` - Add approval prompting
- `schemas/architecture-decisions.schema.json` - (may need source field)

**Success criteria:**
- Engineer presents decisions for approval
- User can approve all, approve some, reject, or request edits
- Approved decisions merge into architecture-decisions.json
- State tracks approval status

### Phase 3: Survey Cliff Detection

**Files to modify:**
- `templates/agents/banneker-surveyor.md` - Add cliff detection logic
- `templates/commands/banneker-survey.md` - Handle takeover path

**Success criteria:**
- Surveyor detects cliff phrases during interview
- Surveyor offers takeover option
- On acceptance, surveyor saves state with transfer flag
- Engineer picks up from transferred state

### Phase 4: Integration Testing

**Files to create:**
- Integration tests for standalone engineer flow
- Integration tests for survey takeover flow
- Integration tests for approval merge flow

**Success criteria:**
- All three document types validate against quality rules
- Decisions merge correctly with existing architecture-decisions.json
- Resume works for all interruption scenarios
- Takeover path produces same quality output as standalone

## Anti-Patterns to Avoid

### Anti-Pattern 1: Automatic Decision Merge

**What goes wrong:** Engineer decisions bypass user approval and pollute architecture-decisions.json with unwanted choices.

**Why bad:** User loses agency over their project's technical direction.

**Prevention:** Always require explicit approval before merge. Never auto-merge.

### Anti-Pattern 2: Surveyor Becomes Engineer

**What goes wrong:** Adding engineer logic to surveyor creates a "god agent" that does both interviewing and decision-making.

**Why bad:** Violates single-responsibility, makes testing harder, confuses state management.

**Prevention:** Keep surveyor and engineer as separate agents. Surveyor only detects cliff and transfers; engineer only synthesizes.

### Anti-Pattern 3: Ignoring Existing Decisions

**What goes wrong:** Engineer generates decisions that conflict with already-approved DEC-XXX records.

**Why bad:** Creates inconsistency in architecture-decisions.json.

**Prevention:** Engineer must read and respect existing decisions. Flag conflicts explicitly.

### Anti-Pattern 4: Stateless Document Generation

**What goes wrong:** Engineer generates all three documents in one pass without state tracking.

**Why bad:** Context budget exhaustion loses all progress.

**Prevention:** Follow existing pattern: state file updated after each document, resume from interruption point.

## Sources

- Codebase analysis: `/home/daniel/Documents/banneker/templates/agents/*.md`
- Codebase analysis: `/home/daniel/Documents/banneker/templates/commands/*.md`
- Schema analysis: `/home/daniel/Documents/banneker/schemas/*.json`
- State file analysis: `/home/daniel/Documents/banneker/.banneker/state/*.md.backup`
- Project documentation: `/home/daniel/Documents/banneker/.planning/PROJECT.md`

**Confidence level:** HIGH - All findings based on direct codebase inspection.
