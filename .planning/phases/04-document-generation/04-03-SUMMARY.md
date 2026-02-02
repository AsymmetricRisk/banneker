---
phase: 04-document-generation
plan: 03
title: "Architect Command Orchestrator"
one_liner: "User-facing command that orchestrates document generation lifecycle with prerequisite checking, resume detection, and output verification"
subsystem: "document-generation"
tags: ["commands", "orchestration", "lifecycle-management", "resume", "verification"]

requires:
  - "04-01: Architect sub-agent for document generation logic"
  - "04-02: Writer sub-agent for individual document generation"
  - "03-02: Survey command pattern for orchestration structure"

provides:
  - "/banneker:architect command entry point"
  - "Prerequisite validation (survey.json, architecture-decisions.json)"
  - "Resume detection for interrupted generation"
  - "Output verification for generated documents"

affects:
  - "04-04: Integration testing will test full command → agent flow"
  - "Future: Roadmap and appendix phases will follow this orchestration pattern"

tech-stack:
  added: []
  patterns: ["Command orchestrator pattern", "Prerequisite checking", "State-based resume detection"]

key-files:
  created:
    - "templates/commands/banneker-architect.md"
  modified: []

decisions:
  - id: "ARCH-CMD-001"
    summary: "Prerequisite checks for survey and decision data"
    rationale: "Document generation requires both survey.json and architecture-decisions.json; check both before spawning agent"
    alternatives: "Check only survey.json and let architect fail on missing decisions"
    impact: "Better UX with clear error messages upfront"

  - id: "ARCH-CMD-002"
    summary: "Dual resume detection (state file + existing documents)"
    rationale: "Handles both interrupted generation (state file) and existing completed generation (documents)"
    alternatives: "Check only state file"
    impact: "Prevents accidental overwrites of completed documents"

  - id: "ARCH-CMD-003"
    summary: "Verify 3 required documents in completion check"
    rationale: "TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE are always generated per REQ-DOCS-001"
    alternatives: "Trust architect without verification"
    impact: "Catch silent failures before user notices"

metrics:
  duration: "1 minute"
  completed: "2026-02-02"
---

# Phase 04 Plan 03: Architect Command Orchestrator Summary

One-liner: User-facing command that orchestrates document generation lifecycle with prerequisite checking, resume detection, and output verification.

## What Was Built

Created `templates/commands/banneker-architect.md` — the user-facing entry point for `/banneker:architect` command.

**Architecture:**
- **Step 0**: Prerequisite Check — Verifies survey.json and architecture-decisions.json exist before proceeding
- **Step 1**: Resume Detection — Handles interrupted generation (state file) and existing documents
- **Step 2**: Ensure Directory Structure — Creates .banneker/documents/ and .banneker/state/
- **Step 3**: Spawn Architect Sub-Agent — Uses Task tool to spawn banneker-architect agent
- **Step 4**: Verify Completion — Checks for 3 required documents and counts total

**Pattern consistency:**
Mirrors `templates/commands/banneker-survey.md` structure exactly:
- YAML frontmatter with name + description
- Numbered steps (Step 0 → Step N)
- Resume detection as Step 1 (REQ-CONT-002)
- Sub-agent spawning via Task tool
- Output verification with success/failure messages
- Requirements coverage section

## Decisions Made

### ARCH-CMD-001: Prerequisite checks for survey and decision data
**Context:** Document generation requires both survey.json (project data) and architecture-decisions.json (decision context).

**Decision:** Check both files in Step 0 before spawning architect agent.

**Alternatives considered:**
- Check only survey.json and let architect fail on missing decisions

**Rationale:** Better UX with clear error messages upfront. User immediately knows they need to run /banneker:survey first.

**Impact:** Prevents confusing failures inside sub-agent execution.

---

### ARCH-CMD-002: Dual resume detection (state file + existing documents)
**Context:** Resume detection must handle both interrupted generation (state file exists) and completed generation (documents exist).

**Decision:** Step 1 checks for `.banneker/state/architect-state.md` first, then checks for `.banneker/documents/*.md` if no state file.

**Alternatives considered:**
- Check only state file and assume documents are incomplete if state exists
- Check only documents and ignore state file

**Rationale:** Handles both scenarios per REQ-CONT-002. State file indicates work-in-progress (resume). Documents without state indicates completed work (prompt to overwrite).

**Impact:** Prevents data loss from accidental overwrites. Gives user clear choice to resume interrupted work or start fresh.

---

### ARCH-CMD-003: Verify 3 required documents in completion check
**Context:** Per REQ-DOCS-001, three documents are always generated regardless of project type: TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE.

**Decision:** Step 4 explicitly checks for these 3 files with cat commands and verifies non-empty (> 100 bytes).

**Alternatives considered:**
- Trust architect agent without verification
- Check for any .md files in .banneker/documents/

**Rationale:** Catch silent failures. If architect agent crashes or network interrupts during file write, orchestrator detects it immediately.

**Impact:** Clear failure messages with preserved state file for debugging. User knows exactly which documents are missing.

## Deviations from Plan

None — plan executed exactly as written.

## Implementation Notes

### Command Orchestrator Pattern
The banneker-architect command follows the established orchestrator pattern:
1. **Lean command file** — Only lifecycle management (check → spawn → verify)
2. **Heavy agent file** — All business logic lives in templates/agents/banneker-architect.md
3. **Clear separation** — Command doesn't know how architect generates documents, only verifies outputs

### Prerequisite Chain
Dependency chain enforced by prerequisite checks:
1. `/banneker:survey` → Creates survey.json + architecture-decisions.json
2. `/banneker:architect` → Requires both files, generates documents
3. `/banneker:roadmap` → Will require documents (future phase)

### Resume Detection Behavior
**Scenario A: Fresh start**
- No state file, no documents → Proceed to Step 2

**Scenario B: Interrupted generation**
- State file exists → Prompt to resume or start fresh
- If resume: Pass state content to architect agent
- If start fresh: Delete state file and proceed

**Scenario C: Completed generation**
- Documents exist but no state file → Prompt to overwrite or abort
- If overwrite: Proceed to Step 2 (architect will overwrite)
- If abort: Exit cleanly

### Output Verification
**Success criteria:**
- TECHNICAL-SUMMARY.md exists and > 100 bytes
- STACK.md exists and > 100 bytes
- INFRASTRUCTURE-ARCHITECTURE.md exists and > 100 bytes
- Count total documents with `ls .banneker/documents/*.md | wc -l`

**Failure behavior:**
- List missing required documents
- Preserve state file at `.banneker/state/architect-state.md` for debugging
- Instruct user to run `/banneker:architect` again to resume

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| REQ-CONT-001 | ✓ | Step 1 reads `.banneker/state/architect-state.md` for resume detection |
| REQ-CONT-002 | ✓ | Step 1 MANDATORY resume detection before spawning architect |
| REQ-DOCS-001 | ✓ | Step 4 verifies 3 always-generated documents exist |
| REQ-DOCS-002 | ✓ | Step 4 counts total documents (includes conditionals) |

## Testing Strategy

**Unit-level:**
- Not applicable — command files are integration points, tested via full-stack tests

**Integration-level (04-04):**
- Fresh start: No state, no documents → Spawns architect → Verifies outputs
- Resume interrupted: State file exists → Passes state to architect → Verifies completion
- Resume with existing docs: Documents exist, no state → User declines overwrite → Aborts cleanly
- Missing prerequisites: No survey.json → Error message → Aborts
- Missing prerequisites: No architecture-decisions.json → Error message → Aborts

**Validation:**
- Command spawns architect agent correctly with Task tool
- State file content passed to architect on resume
- Output verification catches missing documents

## Next Phase Readiness

**Unblocks:**
- 04-04: Integration testing for full command → agent → output flow

**Prerequisites for next work:**
- None

**Known issues:**
- None

## File Inventory

### Created (1 file, 189 lines)

**templates/commands/banneker-architect.md** (189 lines)
- User-facing command orchestrator
- YAML frontmatter: name, description
- Step 0: Prerequisite checks (survey.json, architecture-decisions.json)
- Step 1: Resume detection (state file + existing documents)
- Step 2: Directory structure creation
- Step 3: Architect sub-agent spawning via Task tool
- Step 4: Output verification (3 required docs + count total)
- Requirements coverage: REQ-CONT-001, REQ-CONT-002, REQ-DOCS-001, REQ-DOCS-002

### Modified

None

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 449de93 | feat | Create banneker-architect command orchestrator |

---

**Phase 04 status:** 3/4 plans complete
**Next:** 04-04 Integration Testing
