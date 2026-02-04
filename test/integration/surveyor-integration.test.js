/**
 * Integration tests for surveyor mid-survey takeover flow
 * Tests cliff detection -> offer -> handoff flow and decline flow
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { detectExplicitCliff, EXPLICIT_CLIFF_SIGNALS, detectImplicitCliff, detectCompound, IMPLICIT_CLIFF_SIGNALS } from '../../lib/cliff-detection.js';

describe('Surveyor Integration', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = join(process.cwd(), 'test-temp-surveyor-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, '.banneker', 'state'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Cliff Detection in Survey Context', () => {
    it('should detect cliff signal in survey response', () => {
      const response = "I don't know how to set up the database";
      const result = detectExplicitCliff(response);

      assert.equal(result.detected, true);
      assert.equal(result.confidence, 'HIGH');
      assert.equal(result.signal, "i don't know");
    });

    it('should not trigger on simple confirmations', () => {
      const confirmations = ['yes', 'looks good', 'correct', 'that\'s right'];

      for (const response of confirmations) {
        const result = detectExplicitCliff(response);
        assert.equal(result.detected, false, `Should not detect in: "${response}"`);
      }
    });

    it('should detect multiple signals in conversation', () => {
      const responses = [
        "The project is a task manager",  // No signal
        "Users can create tasks",          // No signal
        "I don't know what database to use",  // Signal
        "Maybe PostgreSQL?",               // No signal
        "Whatever you think is best for caching"  // Signal
      ];

      const detected = responses.filter(r => detectExplicitCliff(r).detected);
      assert.equal(detected.length, 2);
    });

    it('should preserve original response in detection result', () => {
      const original = "I don't know about this topic at all";
      const result = detectExplicitCliff(original);

      assert.equal(result.detected, true);
      assert.equal(result.originalResponse, original);
    });

    it('should handle case-insensitive detection', () => {
      const variations = [
        "I DON'T KNOW about that",
        "Whatever You Think is best",
        "YOU DECIDE for me"
      ];

      for (const response of variations) {
        const result = detectExplicitCliff(response);
        assert.equal(result.detected, true, `Should detect in: "${response}"`);
      }
    });
  });

  describe('Cliff State Tracking', () => {
    it('should build cliff signals array', () => {
      const cliffSignals = [];
      const responses = [
        { phase: 'pitch', question: 'What is your project?', response: 'A task manager' },
        { phase: 'backend', question: 'What database?', response: "I don't know" },
        { phase: 'backend', question: 'Caching strategy?', response: 'Whatever you think' }
      ];

      for (const r of responses) {
        const detection = detectExplicitCliff(r.response);
        if (detection.detected) {
          cliffSignals.push({
            timestamp: new Date().toISOString(),
            phase: r.phase,
            question_context: r.question,
            user_response: r.response,
            detected_signal: detection.signal,
            confidence: detection.confidence,
            mode_switch_offered: false,
            user_accepted: null
          });
        }
      }

      assert.equal(cliffSignals.length, 2);
      assert.equal(cliffSignals[0].phase, 'backend');
      assert.equal(cliffSignals[1].detected_signal, 'whatever you think');
    });

    it('should track declined offers count', () => {
      let declinedOffers = 0;
      const SUPPRESSION_THRESHOLD = 2;

      // Simulate two declines
      declinedOffers++;
      assert.equal(declinedOffers < SUPPRESSION_THRESHOLD, true);

      declinedOffers++;
      assert.equal(declinedOffers >= SUPPRESSION_THRESHOLD, true);

      // Should suppress offers after threshold
      const shouldOffer = declinedOffers < SUPPRESSION_THRESHOLD;
      assert.equal(shouldOffer, false);
    });

    it('should correctly determine when to offer mode switch', () => {
      const shouldOfferModeSwitch = (declinedOffers, detection) => {
        const SUPPRESSION_THRESHOLD = 2;
        return detection.detected &&
               detection.confidence === 'HIGH' &&
               declinedOffers < SUPPRESSION_THRESHOLD;
      };

      // Should offer when no declines and HIGH confidence
      assert.equal(shouldOfferModeSwitch(0, { detected: true, confidence: 'HIGH' }), true);

      // Should offer with 1 decline and HIGH confidence
      assert.equal(shouldOfferModeSwitch(1, { detected: true, confidence: 'HIGH' }), true);

      // Should NOT offer with 2 declines (threshold reached)
      assert.equal(shouldOfferModeSwitch(2, { detected: true, confidence: 'HIGH' }), false);

      // Should NOT offer when no detection
      assert.equal(shouldOfferModeSwitch(0, { detected: false }), false);
    });
  });

  describe('Context Handoff Generation', () => {
    it('should generate surveyor_notes structure', () => {
      const surveyorNotes = {
        generated: new Date().toISOString(),
        phase_at_switch: 'backend',
        cliff_trigger: "I don't know what database to use",
        survey_completeness_percent: 55,
        preferences_observed: ['Prefers managed services', 'Budget-conscious'],
        implicit_constraints: ['Solo developer', 'First production app'],
        confident_topics: ['Problem domain', 'User flows'],
        uncertain_topics: ['Database selection', 'Infrastructure'],
        deferred_questions: [
          { phase: 'backend', question: 'What caching strategy?', deferred_at: new Date().toISOString() }
        ],
        engineer_guidance: ['Start with simple approach', 'Include cost considerations']
      };

      // Verify required fields
      assert.ok(surveyorNotes.generated);
      assert.ok(surveyorNotes.phase_at_switch);

      // Verify arrays are populated
      assert.ok(surveyorNotes.preferences_observed.length > 0);
      assert.ok(surveyorNotes.implicit_constraints.length > 0);
    });

    it('should generate surveyor-context.md content', () => {
      const surveyorNotes = {
        generated: '2026-02-03T10:30:00Z',
        phase_at_switch: 'backend',
        cliff_trigger: "I don't know",
        survey_completeness_percent: 55,
        preferences_observed: ['Prefers managed services'],
        implicit_constraints: ['Solo developer'],
        confident_topics: ['User flows'],
        uncertain_topics: ['Infrastructure'],
        deferred_questions: [],
        engineer_guidance: ['Start simple']
      };

      const contextContent = `---
generated: ${surveyorNotes.generated}
phase_at_switch: ${surveyorNotes.phase_at_switch}
cliff_trigger: "${surveyorNotes.cliff_trigger}"
survey_completeness: ${surveyorNotes.survey_completeness_percent}%
---

## User Preferences Observed

During conversation, user indicated:
${surveyorNotes.preferences_observed.map(p => `- ${p}`).join('\n')}

## Implicit Constraints

${surveyorNotes.implicit_constraints.map(c => `- ${c}`).join('\n')}

## Topics User Felt Confident About

${surveyorNotes.confident_topics.map(t => `- ${t}`).join('\n')}

## Topics User Felt Uncertain About

${surveyorNotes.uncertain_topics.map(t => `- ${t}`).join('\n')}

## Recommendations for Engineer Agent

${surveyorNotes.engineer_guidance.map(g => `- ${g}`).join('\n')}
`;

      assert.ok(contextContent.includes('phase_at_switch: backend'));
      assert.ok(contextContent.includes('Prefers managed services'));
      assert.ok(contextContent.includes('Solo developer'));
    });

    it('should format deferred questions correctly', () => {
      const deferredQuestions = [
        { phase: 'backend', question: 'What database?', deferred_at: '2026-02-03T10:00:00Z' },
        { phase: 'backend', question: 'What cache?', deferred_at: '2026-02-03T10:05:00Z' }
      ];

      const formatted = deferredQuestions.map(q =>
        `- Phase ${q.phase}: "${q.question}" (deferred ${q.deferred_at})`
      ).join('\n');

      assert.ok(formatted.includes('Phase backend'));
      assert.ok(formatted.includes('What database?'));
      assert.ok(formatted.includes('What cache?'));
    });
  });

  describe('Partial Survey JSON Generation', () => {
    it('should generate partial survey with status marker', async () => {
      const partialSurvey = {
        survey_metadata: {
          version: '1.0',
          created: '2026-02-03T10:00:00Z',
          runtime: 'claude-code',
          status: 'partial'
        },
        project: {
          name: 'TaskFlow',
          one_liner: 'A task management app',
          problem: 'Teams need better task tracking'
        },
        actors: [
          { name: 'User', type: 'human', role: 'End user', capabilities: ['create tasks'] }
        ],
        walkthroughs: [
          {
            name: 'Create Task',
            type: 'primary',
            steps: ['Open app', 'Click new', 'Enter details'],
            system_responses: ['Show form', 'Save task'],
            data_changes: ['Task created'],
            error_cases: ['Invalid input']
          }
        ],
        backend: { applicable: 'unknown' },
        rubric_coverage: { covered: ['actors', 'walkthroughs'], gaps: ['backend'] },
        cliff_signals: [],
        surveyor_notes: {
          generated: '2026-02-03T10:30:00Z',
          phase_at_switch: 'backend'
        }
      };

      // Write to temp file
      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      await writeFile(surveyPath, JSON.stringify(partialSurvey, null, 2));

      // Read back and verify
      const content = await readFile(surveyPath, 'utf-8');
      const parsed = JSON.parse(content);

      assert.equal(parsed.survey_metadata.status, 'partial');
      assert.ok(parsed.surveyor_notes);
      assert.equal(parsed.surveyor_notes.phase_at_switch, 'backend');
    });

    it('should compute completeness percentage correctly', () => {
      const computeCompleteness = (phases) => {
        const weights = { pitch: 15, actors: 20, walkthroughs: 20, backend: 20, gaps: 15, decisions: 10 };
        let total = 0;
        for (const phase of phases) {
          total += weights[phase] || 0;
        }
        return total;
      };

      assert.equal(computeCompleteness(['pitch']), 15);
      assert.equal(computeCompleteness(['pitch', 'actors']), 35);
      assert.equal(computeCompleteness(['pitch', 'actors', 'walkthroughs']), 55);
      assert.equal(computeCompleteness(['pitch', 'actors', 'walkthroughs', 'backend']), 75);
    });

    it('should mark backend as unknown for partial surveys', () => {
      const partialBackend = { applicable: 'unknown' };

      // Verify structure is correct for mid-survey switch
      assert.equal(partialBackend.applicable, 'unknown');
      assert.ok(!partialBackend.data_stores);
      assert.ok(!partialBackend.integrations);
    });

    it('should include cliff_signals array in partial survey', async () => {
      const cliffSignals = [
        {
          timestamp: '2026-02-03T10:15:00Z',
          phase: 'backend',
          question_context: 'What database?',
          user_response: "I don't know",
          detected_signal: "i don't know",
          confidence: 'HIGH',
          mode_switch_offered: true,
          user_accepted: true
        }
      ];

      const partialSurvey = {
        survey_metadata: { version: '1.0', created: '2026-02-03T10:00:00Z', runtime: 'claude-code', status: 'partial' },
        project: { name: 'Test', one_liner: 'A test', problem: 'Testing' },
        actors: [{ name: 'User', type: 'human', role: 'Tester', capabilities: ['test'] }],
        walkthroughs: [{ name: 'Test', type: 'primary', steps: ['a'], system_responses: ['b'], data_changes: [], error_cases: [] }],
        backend: { applicable: false },
        rubric_coverage: { covered: [], gaps: [] },
        cliff_signals: cliffSignals,
        surveyor_notes: { generated: '2026-02-03T10:30:00Z', phase_at_switch: 'backend' }
      };

      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      await writeFile(surveyPath, JSON.stringify(partialSurvey, null, 2));

      const content = await readFile(surveyPath, 'utf-8');
      const parsed = JSON.parse(content);

      assert.equal(parsed.cliff_signals.length, 1);
      assert.equal(parsed.cliff_signals[0].user_accepted, true);
    });
  });

  describe('Decline Flow', () => {
    it('should preserve survey state on decline', () => {
      const surveyState = {
        currentPhase: 'backend',
        declinedOffers: 0,
        pendingOffer: { detection: { detected: true, signal: "i don't know" } },
        cliffSignals: []
      };

      // Simulate decline (option 2: continue survey)
      surveyState.declinedOffers++;
      surveyState.pendingOffer.cliffEntry = {
        mode_switch_offered: true,
        user_accepted: false
      };
      surveyState.cliffSignals.push(surveyState.pendingOffer.cliffEntry);
      surveyState.pendingOffer = null;

      assert.equal(surveyState.declinedOffers, 1);
      assert.equal(surveyState.pendingOffer, null);
      assert.equal(surveyState.cliffSignals.length, 1);
      assert.equal(surveyState.cliffSignals[0].user_accepted, false);
    });

    it('should add to deferred questions on skip', () => {
      const surveyState = {
        currentPhase: 'backend',
        deferredQuestions: [],
        pendingOffer: {
          detection: { detected: true },
          question: 'What database?'
        }
      };

      // Simulate skip (option 3)
      surveyState.deferredQuestions.push({
        phase: surveyState.currentPhase,
        question: surveyState.pendingOffer.question,
        deferredAt: new Date().toISOString()
      });
      surveyState.pendingOffer = null;

      assert.equal(surveyState.deferredQuestions.length, 1);
      assert.equal(surveyState.deferredQuestions[0].phase, 'backend');
    });

    it('should continue survey normally after decline', () => {
      const surveyState = {
        currentPhase: 'backend',
        declinedOffers: 1,
        pendingOffer: null,
        cliffSignals: [{ user_accepted: false }]
      };

      // After decline, should be able to continue asking questions
      assert.equal(surveyState.currentPhase, 'backend');
      assert.equal(surveyState.pendingOffer, null);

      // And still detect future cliff signals (below threshold)
      const shouldOffer = surveyState.declinedOffers < 2;
      assert.equal(shouldOffer, true);
    });

    it('should suppress offers after threshold', () => {
      const surveyState = {
        currentPhase: 'backend',
        declinedOffers: 2,
        pendingOffer: null,
        cliffSignals: [
          { user_accepted: false },
          { user_accepted: false }
        ]
      };

      // After 2 declines, should not offer again
      const SUPPRESSION_THRESHOLD = 2;
      const shouldOffer = surveyState.declinedOffers < SUPPRESSION_THRESHOLD;
      assert.equal(shouldOffer, false);

      // But should still log detections
      const detection = detectExplicitCliff("I don't know");
      assert.equal(detection.detected, true);

      // Just don't offer mode switch
      if (detection.detected && !shouldOffer) {
        surveyState.cliffSignals.push({
          ...detection,
          mode_switch_offered: false,  // Logged but not offered
          user_accepted: null
        });
      }

      assert.equal(surveyState.cliffSignals.length, 3);
      assert.equal(surveyState.cliffSignals[2].mode_switch_offered, false);
    });
  });

  describe('Surveyor State File Operations', () => {
    it('should write state file with cliff tracking section', async () => {
      const stateContent = `## Current Phase

Phase 4 of 6: backend

## Cliff Detection State

**Declined offers:** 1
**Pending offer:** false
**Suppression threshold:** 2

### Cliff Signals Detected

- 2026-02-03T10:15:00Z Phase 4: Detected "i don't know" in response to "What database?"
  - Confidence: HIGH
  - Mode switch offered: yes
  - User accepted: no

### Deferred Questions

(none yet)
`;

      const statePath = join(tempDir, '.banneker', 'state', 'survey-state.md');
      await writeFile(statePath, stateContent);

      const readBack = await readFile(statePath, 'utf-8');
      assert.ok(readBack.includes('## Cliff Detection State'));
      assert.ok(readBack.includes('Declined offers:** 1'));
      assert.ok(readBack.includes("Detected \"i don't know\""));
    });

    it('should write context handoff file on mode switch', async () => {
      const contextContent = `---
generated: 2026-02-03T10:30:00Z
phase_at_switch: backend
cliff_trigger: "I don't know what database to use"
survey_completeness: 55%
---

## User Preferences Observed

During conversation, user indicated:
- Prefers managed services

## Implicit Constraints

- Solo developer

## Topics User Felt Confident About

- User flows

## Topics User Felt Uncertain About

- Infrastructure

## Recommendations for Engineer Agent

- Start simple
`;

      const contextPath = join(tempDir, '.banneker', 'state', 'surveyor-context.md');
      await writeFile(contextPath, contextContent);

      const readBack = await readFile(contextPath, 'utf-8');
      assert.ok(readBack.includes('phase_at_switch: backend'));
      assert.ok(readBack.includes('User Preferences Observed'));
      assert.ok(readBack.includes('Recommendations for Engineer Agent'));
    });
  });

  describe('End-to-End Flow Simulation', () => {
    it('should simulate complete cliff detection to handoff flow', async () => {
      // Initialize state
      const surveyState = {
        currentPhase: 'backend',
        declinedOffers: 0,
        pendingOffer: null,
        cliffSignals: [],
        deferredQuestions: [],
        project: { name: 'TaskFlow', one_liner: 'Task manager', problem: 'Tracking tasks' },
        actors: [{ name: 'User', type: 'human', role: 'End user', capabilities: ['manage tasks'] }],
        walkthroughs: [{ name: 'Create', type: 'primary', steps: ['click'], system_responses: ['show'], data_changes: [], error_cases: [] }]
      };

      // Step 1: User response with cliff signal
      const response = "I don't know what database to use";
      const detection = detectExplicitCliff(response);

      // Step 2: Detection should succeed
      assert.equal(detection.detected, true);
      assert.equal(detection.confidence, 'HIGH');

      // Step 3: Create cliff entry
      const cliffEntry = {
        timestamp: new Date().toISOString(),
        phase: surveyState.currentPhase,
        question_context: 'What data stores does this project use?',
        user_response: response,
        detected_signal: detection.signal,
        confidence: detection.confidence,
        mode_switch_offered: false,
        user_accepted: null
      };

      // Step 4: Set pending offer (since declinedOffers < 2)
      surveyState.pendingOffer = { detection, cliffEntry };

      // Step 5: At phase boundary, present offer
      surveyState.pendingOffer.cliffEntry.mode_switch_offered = true;

      // Step 6: User accepts (option 1)
      surveyState.pendingOffer.cliffEntry.user_accepted = true;
      surveyState.cliffSignals.push(surveyState.pendingOffer.cliffEntry);

      // Step 7: Generate surveyor_notes
      const surveyorNotes = {
        generated: new Date().toISOString(),
        phase_at_switch: surveyState.currentPhase,
        cliff_trigger: response,
        survey_completeness_percent: 55,
        preferences_observed: [],
        implicit_constraints: [],
        confident_topics: ['User flows'],
        uncertain_topics: ['Database selection'],
        deferred_questions: surveyState.deferredQuestions,
        engineer_guidance: ['Start with simple approach']
      };

      // Step 8: Build partial survey
      const partialSurvey = {
        survey_metadata: {
          version: '1.0',
          created: new Date().toISOString(),
          runtime: 'claude-code',
          status: 'partial'
        },
        project: surveyState.project,
        actors: surveyState.actors,
        walkthroughs: surveyState.walkthroughs,
        backend: { applicable: 'unknown' },
        rubric_coverage: { covered: ['project', 'actors', 'walkthroughs'], gaps: ['backend', 'gaps', 'decisions'] },
        cliff_signals: surveyState.cliffSignals,
        surveyor_notes: surveyorNotes
      };

      // Step 9: Write files
      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      await writeFile(surveyPath, JSON.stringify(partialSurvey, null, 2));

      const contextPath = join(tempDir, '.banneker', 'state', 'surveyor-context.md');
      await writeFile(contextPath, `# Surveyor Context\nPhase: ${surveyorNotes.phase_at_switch}`);

      // Step 10: Verify files written correctly
      const survey = JSON.parse(await readFile(surveyPath, 'utf-8'));
      assert.equal(survey.survey_metadata.status, 'partial');
      assert.ok(survey.surveyor_notes);
      assert.equal(survey.cliff_signals.length, 1);
      assert.equal(survey.cliff_signals[0].user_accepted, true);

      const context = await readFile(contextPath, 'utf-8');
      assert.ok(context.includes('backend'));
    });
  });

  describe('Engineer Handoff Consumption', () => {
    it('should detect surveyor-context.md presence', async () => {
      // Write surveyor-context.md to temp dir
      const contextPath = join(tempDir, '.banneker', 'state', 'surveyor-context.md');
      const contextContent = `---
generated: 2026-02-03T10:30:00Z
phase_at_switch: backend
cliff_trigger: "I don't know what database to use"
survey_completeness: 55%
---

## User Preferences Observed

- Prefers managed services
- Budget-conscious

## Implicit Constraints

- Solo developer

## Topics User Felt Confident About

- User flows

## Topics User Felt Uncertain About

- Infrastructure

## Recommendations for Engineer Agent

- Start with simple approach
`;
      await writeFile(contextPath, contextContent);

      // Verify file exists (simulating engineer's Step 1a check)
      const content = await readFile(contextPath, 'utf-8');
      assert.ok(content.includes('phase_at_switch: backend'));
      assert.ok(content.includes('Prefers managed services'));
    });

    it('should extract surveyor_notes from partial survey.json', async () => {
      const partialSurvey = {
        survey_metadata: {
          version: '1.0',
          created: '2026-02-03T10:00:00Z',
          runtime: 'claude-code',
          status: 'partial'  // Indicates mid-survey handoff
        },
        project: {
          name: 'TestApp',
          one_liner: 'A test application'
        },
        actors: [{ name: 'User', type: 'human' }],
        walkthroughs: [{ name: 'Test Flow', steps: ['Step 1'] }],
        surveyor_notes: {
          generated: '2026-02-03T10:30:00Z',
          phase_at_switch: 'backend',
          cliff_trigger: "I don't know",
          survey_completeness_percent: 55,
          preferences_observed: ['Prefers managed services'],
          implicit_constraints: ['Solo developer'],
          confident_topics: ['User flows'],
          uncertain_topics: ['Infrastructure', 'Database'],
          deferred_questions: [
            { phase: 'backend', question: 'What caching?', deferred_at: '2026-02-03T10:25:00Z' }
          ],
          engineer_guidance: ['Start simple', 'Include cost analysis']
        }
      };

      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      await writeFile(surveyPath, JSON.stringify(partialSurvey, null, 2));

      // Simulate engineer's Step 1c - extract surveyor_notes
      const content = await readFile(surveyPath, 'utf-8');
      const survey = JSON.parse(content);

      // Verify status check (Step 1b)
      assert.equal(survey.survey_metadata.status, 'partial');

      // Verify surveyor_notes extraction (Step 1c)
      assert.ok(survey.surveyor_notes);
      assert.equal(survey.surveyor_notes.phase_at_switch, 'backend');
      assert.equal(survey.surveyor_notes.survey_completeness_percent, 55);
      assert.deepEqual(survey.surveyor_notes.preferences_observed, ['Prefers managed services']);
      assert.equal(survey.surveyor_notes.deferred_questions.length, 1);
      assert.deepEqual(survey.surveyor_notes.engineer_guidance, ['Start simple', 'Include cost analysis']);
    });

    it('should handle complete survey without handoff context', async () => {
      const completeSurvey = {
        survey_metadata: {
          version: '1.0',
          created: '2026-02-03T10:00:00Z',
          runtime: 'claude-code',
          status: 'complete'  // Normal complete survey
        },
        project: { name: 'TestApp', one_liner: 'A test application' },
        actors: [{ name: 'User', type: 'human' }],
        walkthroughs: [{ name: 'Test Flow', steps: ['Step 1'] }],
        backend: { applicable: true, stack: ['Node.js'] }
        // No surveyor_notes - complete survey
      };

      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      await writeFile(surveyPath, JSON.stringify(completeSurvey, null, 2));

      const content = await readFile(surveyPath, 'utf-8');
      const survey = JSON.parse(content);

      // Verify no handoff context
      assert.equal(survey.survey_metadata.status, 'complete');
      assert.equal(survey.surveyor_notes, undefined);
    });

    it('should map uncertain topics to potential gaps', () => {
      const surveyorNotes = {
        uncertain_topics: ['Infrastructure', 'Database selection', 'Caching strategy'],
        deferred_questions: [
          { phase: 'backend', question: 'What database?', deferred_at: '2026-02-03T10:25:00Z' }
        ]
      };

      // Simulate engineer's gap identification from handoff
      const gapsFromHandoff = [
        ...surveyorNotes.uncertain_topics.map(t => `Uncertainty: ${t}`),
        ...surveyorNotes.deferred_questions.map(q => `Deferred: ${q.question} (${q.phase})`)
      ];

      assert.equal(gapsFromHandoff.length, 4);
      assert.ok(gapsFromHandoff.includes('Uncertainty: Infrastructure'));
      assert.ok(gapsFromHandoff.includes('Deferred: What database? (backend)'));
    });

    it('should prioritize handoff context sources correctly', async () => {
      // Both surveyor-context.md AND surveyor_notes exist
      const contextPath = join(tempDir, '.banneker', 'state', 'surveyor-context.md');
      await writeFile(contextPath, '---\ngenerated: 2026-02-03T10:30:00Z\n---\n\n## User Preferences\n\n- From markdown file');

      const surveyPath = join(tempDir, '.banneker', 'survey.json');
      const survey = {
        survey_metadata: { status: 'partial' },
        project: { name: 'Test' },
        actors: [],
        walkthroughs: [],
        surveyor_notes: {
          generated: '2026-02-03T10:30:00Z',
          phase_at_switch: 'backend',
          preferences_observed: ['From JSON notes']
        }
      };
      await writeFile(surveyPath, JSON.stringify(survey, null, 2));

      // Both sources exist - should use both
      const mdContent = await readFile(contextPath, 'utf-8');
      const jsonContent = JSON.parse(await readFile(surveyPath, 'utf-8'));

      assert.ok(mdContent.includes('From markdown file'));
      assert.ok(jsonContent.surveyor_notes.preferences_observed.includes('From JSON notes'));
    });
  });

  describe('Cliff detection integration', () => {
    describe('Implicit signal detection', () => {
      it('detects hedging across signal categories', () => {
        const hedgingResponse = "Maybe we could use React, perhaps with Next.js";
        const result = detectImplicitCliff(hedgingResponse);

        assert.strictEqual(result.detected, true);
        assert.ok(result.signals.some(s => s.category === 'hedging'));
        assert.strictEqual(result.confidence, 'MEDIUM');
      });

      it('detects quality degradation markers', () => {
        const uncertainResponse = "Hmm, let me think... um, well...";
        const result = detectImplicitCliff(uncertainResponse);

        assert.strictEqual(result.detected, true);
        assert.ok(result.signals.some(s => s.category === 'quality_degradation'));
      });

      it('detects soft deferrals', () => {
        const deferralResponse = "Whatever works, you pick the database";
        const result = detectImplicitCliff(deferralResponse);

        assert.strictEqual(result.detected, true);
        assert.ok(result.signals.some(s => s.category === 'deferral'));
      });
    });

    describe('Compound detection threshold', () => {
      it('does not trigger on single implicit signal', () => {
        const singleSignalResponse = "Maybe PostgreSQL";
        const result = detectCompound(singleSignalResponse, []);

        assert.strictEqual(result.trigger, false);
        assert.strictEqual(result.signalCount, 1);
      });

      it('triggers when accumulating 2+ signals across responses', () => {
        const history = [
          { implicitSignals: [{ signal: 'maybe', category: 'hedging' }] }
        ];
        const currentResponse = "I guess that works";
        const result = detectCompound(currentResponse, history);

        assert.strictEqual(result.trigger, true);
        assert.strictEqual(result.reason, 'compound_implicit');
        assert.strictEqual(result.confidence, 'MEDIUM');
      });

      it('explicit signal overrides compound threshold', () => {
        const explicitResponse = "I don't know what database to use";
        const result = detectCompound(explicitResponse, []);

        assert.strictEqual(result.trigger, true);
        assert.strictEqual(result.reason, 'explicit_signal');
        assert.strictEqual(result.confidence, 'HIGH');
      });

      it('uses only last 3 responses from history', () => {
        // History with 5 responses, signals only in oldest 2
        const history = [
          { implicitSignals: [{ signal: 'maybe', category: 'hedging' }] },
          { implicitSignals: [{ signal: 'perhaps', category: 'hedging' }] },
          { implicitSignals: [] }, // -3
          { implicitSignals: [] }, // -2
          { implicitSignals: [] }  // -1
        ];
        // Current has 1 signal, history (last 3) has 0 = 1 total
        const result = detectCompound("Maybe", history);

        assert.strictEqual(result.trigger, false);
        assert.strictEqual(result.signalCount, 1); // Only current signal counts
      });
    });

    describe('Full survey simulation', () => {
      it('simulates gradual uncertainty accumulation', () => {
        const responses = [
          "I want to build a task management app",        // No signals
          "React seems good, maybe Next.js",              // 1 hedging
          "For the database, hmm, PostgreSQL I guess",    // 2 signals (quality + hedging)
          "Authentication... um, whatever works really"   // 3 signals (quality + deferral)
        ];

        const history = [];
        const results = [];

        for (const response of responses) {
          const implicitResult = detectImplicitCliff(response);
          const compoundResult = detectCompound(response, history);

          results.push({
            response: response.substring(0, 30) + '...',
            implicitSignals: implicitResult.signals.length,
            trigger: compoundResult.trigger,
            reason: compoundResult.reason,
            totalCount: compoundResult.signalCount
          });

          // Add to history for next iteration
          history.push({ implicitSignals: implicitResult.signals });
        }

        // First response: no trigger
        assert.strictEqual(results[0].trigger, false);

        // Second response: 1 signal, no trigger
        assert.strictEqual(results[1].trigger, false);

        // Third or fourth response should trigger (2+ accumulated)
        const triggered = results.some(r => r.trigger && r.reason === 'compound_implicit');
        assert.ok(triggered, 'Should trigger compound detection within 4 responses');
      });
    });
  });
});
