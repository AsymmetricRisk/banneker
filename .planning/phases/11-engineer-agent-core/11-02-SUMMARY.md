---
phase: 11-engineer-agent-core
plan: 02
subsystem: cli-orchestration
tags: [orchestrator, engineer, command-entry-point, resume-detection, prerequisite-checking]
requires: [11-01]
provides: [engineer-command-orchestrator]
affects: [13-approval-flow]
tech-stack:
  added: []
  patterns: [orchestrator-sub-agent-pattern, resume-detection, minimum-viability-check]
key-files:
  created: [templates/commands/banneker-engineer.md]
  modified: []
decisions:
  - id: ENGINT-06
    title: Minimum Viable Survey for Engineer
    rationale: Require Phases 1-3 (project, actors, walkthroughs) as minimum for engineering analysis
  - id: ENGINT-07
    title: Related Commands Documentation
    rationale: Include workflow context in command file to guide users through prerequisite and next-step commands
metrics:
  duration: 2min
  completed: 2026-02-03
---

# Phase 11 Plan 02: Engineer Command Orchestrator Summary

**One-liner:** User-facing /banneker:engineer command with prerequisite checks, resume detection, sub-agent spawning, and approval gate messaging

## What Was Built

Created the engineer command orchestrator skill file that serves as the user-facing entry point for `/banneker:engineer`. This orchestrator follows the established banneker-architect.md pattern exactly:

1. **Step 0: Prerequisite Check** - Validates survey.json exists and contains minimum viable data (Phases 1-3: project, actors, walkthroughs)
2. **Step 1: Resume Detection** - Checks for interrupted generation (engineer-state.md) or existing documents, prompts user to resume or restart
3. **Step 2: Directory Structure** - Ensures `.banneker/documents/` and `.banneker/state/` exist
4. **Step 3: Spawn Sub-Agent** - Uses Task tool to spawn banneker-engineer agent with appropriate context (resume or fresh start)
5. **Step 4: Verify Completion** - Confirms all three documents (DIAGNOSIS, RECOMMENDATION, ENGINEERING-PROPOSAL) were generated, displays results

The orchestrator is lean (200 lines) - all document synthesis logic lives in the engineer sub-agent (from Plan 11-01).

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create banneker-engineer.md orchestrator following architect pattern | 598da01 |
| 2 | Add Related Commands section with workflow context | (included in Task 1) |

## Decisions Made

### ENGINT-06: Minimum Viable Survey for Engineer

**Context:** Engineer must handle partial survey data (cliff detection scenario), but needs minimum information to generate meaningful recommendations.

**Decision:** Require Phases 1-3 complete (project with name/one-liner/problem-statement, at least 1 actor, at least 1 walkthrough). Abort if these are missing.

**Rationale:**
- Phases 1-3 provide sufficient context for gap diagnosis and basic recommendations
- Missing backend/rubric sections are handled gracefully by engineer sub-agent (reduced confidence)
- User gets clear error message directing them to complete minimum survey phases

**Consequences:**
- Positive: Clear boundary between "too early" and "cliff detected" scenarios
- Positive: Error messages guide users to exact next action
- Negative: Users who want to skip straight to engineering without survey can't do so

### ENGINT-07: Related Commands Documentation

**Context:** Users need to understand the workflow: survey → engineer → approve-proposal.

**Decision:** Include "Related Commands" section at end of orchestrator referencing prerequisite (/banneker:survey), alternative (/banneker:architect), and next step (/banneker:approve-proposal).

**Rationale:**
- Orchestrator file is user-facing - provides workflow context
- Prevents "what do I do next?" confusion after document generation
- Notes Phase 13 approval flow is "coming in v0.3.0" to set expectations

**Consequences:**
- Positive: Self-documenting workflow guidance
- Positive: Clear expectation that proposals require approval (prevents assumption of auto-merge)
- Neutral: Slight increase in file length (3 lines)

## Key Implementation Details

### Prerequisite Check Structure

The orchestrator performs two-level prerequisite validation:

1. **File existence:** Does `.banneker/survey.json` exist?
2. **Minimum viability:** Does survey contain required sections (project object, actors array with length > 0, walkthroughs array with length > 0)?

This enables helpful error messages:
- "No survey data found" → Run /banneker:survey
- "Survey incomplete" → Continue /banneker:survey to complete Phases 1-3

### Resume Detection Protocol

Follows REQ-CONT-002 exactly:

1. Check for `.banneker/state/engineer-state.md` (interrupted generation)
   - If exists: Parse state, show completed/pending, prompt to resume or restart
2. Check for existing documents (DIAGNOSIS.md, RECOMMENDATION.md, ENGINEERING-PROPOSAL.md)
   - If exist but no state file: Prompt to overwrite or abort
3. If neither: Proceed as fresh start

This ensures users never lose partial work and are always prompted before overwriting.

### Sub-Agent Context Passing

When spawning banneker-engineer sub-agent via Task tool:

- **Resume scenario:** Pass full engineer-state.md content + instruction "Resume from current state. Skip completed documents."
- **Fresh start:** Pass instruction "Fresh start - no prior state. Begin with Step 1: Load and Parse Inputs."

The engineer sub-agent (Plan 11-01) handles the context appropriately.

### Approval Gate Messaging

Critical requirement: Proposals must NOT be auto-merged to architecture-decisions.json (violates user trust).

Orchestrator includes messaging in completion output:
```
IMPORTANT: Proposals in ENGINEERING-PROPOSAL.md are NOT yet approved.

Next steps:
  - Review ENGINEERING-PROPOSAL.md for proposed decisions
  - Run /banneker:approve-proposal to review and approve individual decisions (Phase 13)
```

This sets user expectation that approval is a separate, explicit step.

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **ENGINT-01**: Standalone `/banneker:engineer` command exists (this file is the entry point)
- **ENGINT-02**: Partial survey support via minimum viability check (Phases 1-3 required, 4-6 optional)
- **ENGINT-05**: State tracking via `.banneker/state/engineer-state.md` (resume detection in Step 1)
- **REQ-CONT-002**: Resume detection before starting work (Step 1 checks state file and existing documents)

## Testing Checklist

- [ ] Run /banneker:engineer without survey.json → error "No survey data found"
- [ ] Run with survey.json missing Phase 1 → error "Survey incomplete"
- [ ] Run with survey.json Phases 1-3 complete, Phase 4-6 missing → proceeds (partial data support)
- [ ] Interrupt during document generation → state file created
- [ ] Restart after interrupt → prompt to resume shown
- [ ] Resume after interrupt → skips completed documents, continues from pending
- [ ] Run with existing documents, no state file → prompt to overwrite shown
- [ ] Completion message includes approval gate warning

## Next Phase Readiness

**Blockers:** None

**Enables:**
- Phase 13: Approval flow implementation (can reference "proposals require approval" messaging)
- Phase 12: Testing can validate orchestrator → sub-agent → output flow

**Notes:**
- Orchestrator references `/banneker:approve-proposal` (Phase 13) as "coming in v0.3.0" - update messaging when Phase 13 is implemented
- Related Commands section may need updates as new commands are added to Banneker

## Files Changed

### Created
- `templates/commands/banneker-engineer.md` (200 lines) - Engineer command orchestrator skill file

### Modified
None

## Verification

All plan verification criteria met:
- ✓ File exists at templates/commands/banneker-engineer.md
- ✓ Follows banneker-architect.md orchestrator pattern (Steps 0-4 structure)
- ✓ Prerequisite check for survey.json with minimum viability validation
- ✓ Resume detection with user prompts (state file and existing documents)
- ✓ Sub-agent spawning via Task tool (Step 3)
- ✓ Output verification for all three documents (Step 4)
- ✓ Clear next steps mentioning approval requirement (completion message + Related Commands section)

All task verification criteria met:
- ✓ grep "banneker-engineer" returns 5 results
- ✓ grep "survey.json" returns 8 results
- ✓ grep "engineer-state.md" returns 7 results
- ✓ grep "DIAGNOSIS.md" returns 8 results
- ✓ grep "RECOMMENDATION.md" returns 8 results
- ✓ grep "ENGINEERING-PROPOSAL.md" returns 9 results
- ✓ grep -i "resume" returns 10 results
- ✓ grep "Task" returns 2 results (spawns sub-agent)
- ✓ File is 200 lines (>150 required)

## Lessons Learned

1. **Pattern reuse is powerful** - Following banneker-architect.md pattern exactly meant zero architectural decisions were needed. Step structure, messaging patterns, error handling all copied directly.

2. **Minimum viability is domain-specific** - Architect requires architecture-decisions.json (decision gate output), engineer requires Phases 1-3 of survey.json. Each command defines its own prerequisites based on what it needs to operate.

3. **Resume detection is table stakes** - Every long-running command needs Step 1 resume detection. This is now a Banneker standard pattern (REQ-CONT-002).

4. **Approval gate messaging is critical** - Users will assume generated proposals are approved unless explicitly told otherwise. Orchestrator must include "NOT yet approved" messaging in completion output.

## Links

- **Implements:** Plan 11-02 (Engineer Command Orchestrator)
- **Depends on:** Plan 11-01 (banneker-engineer sub-agent)
- **Enables:** Phase 13 (Approval Flow)
- **Pattern source:** templates/commands/banneker-architect.md (orchestrator pattern)
