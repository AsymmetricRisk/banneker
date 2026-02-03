---
phase: 11-engineer-agent-core
plan: 03
subsystem: engineer-agent
tags: [state-management, partial-data, resume-capability, confidence-baseline]

dependencies:
  requires:
    - 11-01: Engineer sub-agent foundation (three-document architecture, confidence system)
  provides:
    - State management for resume-on-interrupt
    - Partial survey data detection and graceful degradation
    - Confidence baseline calibration based on completeness
  affects:
    - 11-04: Command orchestrator integration (needs state management protocol)
    - 12-*: Cliff detection (partial data scenarios common in mid-interview)
    - 14-*: Survey integration (resume capability for mid-survey takeover)

tech-stack:
  added: []
  patterns:
    - State file tracking with frontmatter metadata
    - Resume protocol with dependency loading
    - Section-by-section completeness analysis
    - Confidence baseline establishment (HIGH/MEDIUM/LOW)

key-files:
  created: []
  modified:
    - templates/agents/banneker-engineer.md

decisions:
  - id: ENGINT-02-impl
    title: Section-by-section gap detection with explicit survey path notation
    rationale: Engineer needs to detect partial data at granular level (Phase 1-5) and document gaps using dot notation (e.g., backend.infrastructure) for precise reference
  - id: ENGINT-05-impl
    title: State file with survey analysis persistence
    rationale: State must capture not just progress but also survey analysis (completeness, gaps, baseline) to ensure consistent confidence across resume
  - id: confidence-calibration
    title: Three-tier confidence baseline (HIGH 80-100%, MEDIUM 50-79%, LOW <50%)
    rationale: Survey completeness percentage directly maps to confidence baseline, providing objective calibration point before per-recommendation assessment

metrics:
  duration: 3 minutes
  completed: 2026-02-03
---

# Phase 11 Plan 03: Engineer State Management and Partial Data Summary

**One-liner:** State management with resume capability and partial survey data detection with confidence calibration for engineer sub-agent

## What Was Built

Enhanced the banneker-engineer sub-agent template with comprehensive state management and partial data handling:

### 1. Partial Survey Data Detection (ENGINT-02)

**Section Completeness Detection:**
- Phase 1 (Project): name, one_liner, problem_statement validation
- Phase 2 (Actors): array presence and structure checks
- Phase 3 (Walkthroughs): steps, data_changes, error_cases assessment
- Phase 4 (Backend): conditional checks based on applicable flag
  - data_stores, integrations, hosting, stack gap detection
  - Handles backend.applicable === false as valid (frontend-only)
- Phase 5 (Rubric): rubric_coverage presence and gap propagation

**Completeness Percentage Computation:**
```javascript
function computeCompleteness(survey) {
    const sections = {
        project: survey.project ? 1 : 0,
        actors: survey.actors && survey.actors.length > 0 ? 1 : 0,
        walkthroughs: survey.walkthroughs && survey.walkthroughs.length > 0 ? 1 : 0,
        backend: survey.backend ? (survey.backend.applicable === false ? 1 :
            (survey.backend.data_stores?.length > 0 ? 1 : 0.5)) : 0,
        rubric: survey.rubric_coverage ? 1 : 0,
        decisions: survey.architecture_decisions ? 1 : 0
    };
    const total = Object.values(sections).reduce((a, b) => a + b, 0);
    return Math.round((total / 6) * 100);
}
```

**Confidence Baseline Establishment:**
- 80-100% complete → HIGH baseline (can assign HIGH to well-supported recommendations)
- 50-79% complete → MEDIUM baseline (cap most at MEDIUM)
- <50% complete → LOW baseline (all get LOW unless very well supported)

**Partial Data Behavior:**
- Generate ALL three documents even with incomplete survey
- Explicitly state gaps in DIAGNOSIS.md "What Is Missing" section
- Downgrade confidence for recommendations touching gap areas
- Never invent missing data - document the gap with survey path notation
- Example gap notation: "backend.infrastructure: Hosting details not captured"

### 2. State Management (ENGINT-05)

**State File Structure:**
```markdown
---
command: engineer
status: in-progress
started_at: 2026-02-03T10:00:00Z
last_updated: 2026-02-03T10:15:00Z
items_completed: 1
items_total: 3
current_position: "RECOMMENDATION.md generation"
---

## Survey Analysis
**Survey completeness:** 65%
**Confidence baseline:** MEDIUM
**Identified gaps:** [list]

## Progress
- [x] DIAGNOSIS.md (completed timestamp, size)
- [ ] RECOMMENDATION.md (in progress)
- [ ] ENGINEERING-PROPOSAL.md (pending)

## Generated Documents
[Document metadata: path, timestamp, size, gap count]
```

**State Management Protocol:**
1. Initialize state on first document generation
2. Write state after EACH document completes (DIAGNOSIS, RECOMMENDATION, PROPOSAL)
3. Include document metadata: path, timestamp, size
4. Persist survey analysis: completeness %, baseline, gaps
5. Delete state file on successful completion
6. Preserve state on failure for retry

### 3. Resume Handling

**Resume Protocol:**
1. **Parse state file:**
   - Extract completed documents list
   - Extract survey analysis (completeness, gaps, confidence baseline)
   - Identify current_position

2. **Load dependencies:**
   - If resuming at RECOMMENDATION.md: Read existing DIAGNOSIS.md
   - If resuming at ENGINEERING-PROPOSAL.md: Read both DIAGNOSIS.md and RECOMMENDATION.md

3. **Show resume status:**
   ```
   Resuming engineer session from 2026-02-03T10:00:00Z

   Already completed:
     [x] DIAGNOSIS.md (2847 bytes)

   Remaining:
     [ ] RECOMMENDATION.md
     [ ] ENGINEERING-PROPOSAL.md

   Continuing from RECOMMENDATION.md...
   ```

4. **Continue generation:**
   - Use existing survey analysis (don't re-analyze)
   - Use existing confidence baseline (consistency)
   - Generate remaining documents in order

5. **Maintain consistency:**
   - References between documents must match actual content
   - Gap analysis consistent across all documents

6. **Complete normally:**
   - Delete state file on success
   - Report results including resume history

## Key Decisions Made

### 1. Confidence Baseline Precedes Per-Recommendation Assessment

**Decision:** Establish global confidence baseline from survey completeness before individual recommendation confidence assignment.

**Rationale:** Provides objective starting point. Individual recommendations can adjust up/down based on specific evidence, but baseline ensures overall calibration matches data quality.

**Example:** 55% complete survey → MEDIUM baseline → Individual recommendations can range from LOW (heavy gap impact) to MEDIUM (well-supported by available data) but not HIGH.

### 2. State Includes Survey Analysis, Not Just Progress

**Decision:** State file persists survey completeness percentage, confidence baseline, and identified gaps alongside document progress.

**Rationale:** Resume must maintain consistent confidence assessment. If baseline is recalculated on resume, recommendations might get different confidence levels, breaking consistency between DIAGNOSIS (original) and RECOMMENDATION (resumed).

**Alternative rejected:** Just track document completion → Would require re-analysis on resume → Inconsistent confidence → User confusion.

### 3. Backend Partial Scoring (0.5 for partial presence)

**Decision:** If backend section exists but is incomplete (e.g., applicable=true but no data_stores), score it 0.5 instead of 0 or 1.

**Rationale:** Distinguishes three states:
- 0 = backend section missing entirely (major gap)
- 0.5 = backend section present but incomplete (moderate gap)
- 1 = backend section complete OR explicitly not applicable (no gap)

**Impact:** More accurate completeness percentage reflecting partial information scenarios.

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### `templates/agents/banneker-engineer.md`

**Changes:**
1. Enhanced "Step 2: Analyze Survey Completeness" section:
   - Added section-by-section detection logic (Phase 1-5)
   - Added computeCompleteness() function with 6-section scoring
   - Added confidence baseline establishment rules
   - Added partial data behavior documentation

2. Added comprehensive "State Management (ENGINT-05)" section:
   - State file structure with frontmatter and progress tracking
   - Survey analysis persistence (completeness, baseline, gaps)
   - Write state after each document protocol
   - Delete state on completion protocol
   - Preserve state on failure protocol

3. Updated "Step 3: Generate DIAGNOSIS.md" to write state:
   - Added updateState call after document write
   - Includes document metadata (path, size, timestamp)

4. Updated "Step 4: Generate RECOMMENDATION.md" to write state:
   - Added updateState call after document write
   - Tracks 2/3 documents complete

5. Updated "Step 5: Generate ENGINEERING-PROPOSAL.md" to delete state:
   - Changed from updateState to deleteFile on completion
   - Signals successful generation completion

6. Enhanced "Resume Handling" section:
   - 6-step resume protocol
   - Parse state, load dependencies, show status, continue generation
   - Consistency requirements between documents
   - Example resume status output

**Lines modified:** ~170 additions/modifications across 6 sections

## Verification Results

All verification criteria met:

✓ Partial survey detection logic complete with section-by-section analysis
✓ Survey completeness percentage computation included (computeCompleteness)
✓ Confidence baseline establishment based on completeness (HIGH/MEDIUM/LOW)
✓ State file structure defined with all required fields (frontmatter + sections)
✓ State written after each document completion (3 updateState calls)
✓ Resume protocol documented and implemented (6-step protocol)
✓ State deleted on successful completion (deleteFile call)

**Grep verification:**
- "Analyze Survey Completeness|ENGINT-02|computeCompleteness|Confidence baseline": 9 matches ✓
- "State Management|engineer-state.md|updateState|Resume From State": 14 matches ✓
- "Resume Handling|Resume Protocol": 2 matches ✓

## Requirements Satisfied

### ENGINT-02: Partial Survey Data Detection
**Status:** ✓ Complete

**Implementation:**
- Section-by-section gap detection (Phase 1-5)
- Completeness percentage calculation (6-section scoring)
- Confidence baseline establishment (3-tier system)
- Explicit gap notation with survey paths (e.g., backend.infrastructure)
- Partial data behavior documentation (generate all docs, document gaps)

**Evidence:** Lines 89-236 in banneker-engineer.md

### ENGINT-05: State Tracking for Resume
**Status:** ✓ Complete

**Implementation:**
- State file structure with frontmatter (command, status, timestamps, progress)
- Survey analysis persistence (completeness, baseline, gaps)
- Write state after each document (3 update points)
- Resume protocol (6-step process)
- Delete state on success, preserve on failure

**Evidence:** Lines 87-183 (State Management section) + Lines 1139-1179 (Resume Handling section)

## Testing Notes

**Partial Data Scenarios to Test:**
1. Minimum viable survey (Phase 1-3 only) → Should generate all docs with MEDIUM/LOW baseline
2. Phase 4 missing entirely → backend gap noted, infrastructure recommendations get LOW confidence
3. Phase 4 present but backend.applicable=true with no data_stores → 0.5 backend score, MEDIUM baseline
4. Phase 5 missing → rubric gaps not propagated, but generation continues
5. Complete survey (all phases) → HIGH baseline, high confidence recommendations where well-supported

**Resume Scenarios to Test:**
1. Interrupt after DIAGNOSIS → Resume should skip DIAGNOSIS, generate RECOMMENDATION+PROPOSAL
2. Interrupt after RECOMMENDATION → Resume should skip first 2, generate PROPOSAL only
3. State includes 55% completeness → Resume must use same baseline, not recalculate
4. References from RECOMMENDATION to DIAGNOSIS → Must match actual DIAGNOSIS content

**Expected Behavior:**
- All scenarios: Generate 3 documents (never abort due to partial data beyond minimum)
- Gaps explicitly documented in DIAGNOSIS "What Is Missing" section
- Confidence rationale cites specific gaps from DIAGNOSIS
- State file deleted only on full completion (3/3 documents)

## Next Phase Readiness

**Phase 11 Plan 04 (Command Orchestrator Integration):**
- ✓ State management protocol defined for orchestrator to check
- ✓ Resume capability enables mid-generation recovery
- ✓ Partial data handling ensures robustness in cliff scenarios

**Phase 12 (Cliff Detection):**
- ✓ Partial data scenarios well-defined (minimum viable survey)
- ✓ Confidence degradation clear (baseline + per-recommendation)
- ✓ Gap documentation provides explicit signal of what's missing

**Phase 14 (Survey Integration):**
- ✓ Resume capability critical for mid-survey takeover
- ✓ State persistence enables survey → engineer → resume survey flow
- ✓ Partial data handling allows engineer to run with Phase 1-3 complete

**Blockers:** None

**Concerns:** None - implementation straightforward, no technical debt

## Related Documentation

- 11-01-SUMMARY.md: Engineer sub-agent foundation (three-document architecture)
- 11-RESEARCH.md: Engineer agent domain research (requirements ENGINT-02, ENGINT-05)
- templates/agents/banneker-architect.md: State management pattern reference

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 18b0e9f | feat(11-03): enhance partial survey data detection | templates/agents/banneker-engineer.md |
| 0dfbacd | feat(11-03): implement state management for resume | templates/agents/banneker-engineer.md |

**Total commits:** 2 (atomic per-task commits)
**Duration:** ~3 minutes
**Lines changed:** +172 -49

---

**Status:** ✓ Complete - Engineer sub-agent enhanced with state management and partial data handling
