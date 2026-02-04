/**
 * Tests for lib/complexity-ceiling.js - Complexity ceiling enforcement
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractConstraints, checkComplexity, COMPLEXITY_INDICATORS } from '../../lib/complexity-ceiling.js';

describe('COMPLEXITY_INDICATORS', () => {
  it('contains solo developer indicators', () => {
    assert.ok(COMPLEXITY_INDICATORS.solo_developer.includes('solo'));
    assert.ok(COMPLEXITY_INDICATORS.solo_developer.includes('just me'));
    assert.ok(COMPLEXITY_INDICATORS.solo_developer.includes('side project'));
  });

  it('contains budget constraint indicators', () => {
    assert.ok(COMPLEXITY_INDICATORS.budget_constrained.includes('budget'));
    assert.ok(COMPLEXITY_INDICATORS.budget_constrained.includes('free tier'));
  });

  it('contains time constraint indicators', () => {
    assert.ok(COMPLEXITY_INDICATORS.time_constrained.includes('mvp'));
    assert.ok(COMPLEXITY_INDICATORS.time_constrained.includes('prototype'));
  });

  it('contains experience level indicators', () => {
    assert.ok(COMPLEXITY_INDICATORS.experience_level.beginner.includes('first time'));
    assert.ok(COMPLEXITY_INDICATORS.experience_level.intermediate.includes('some experience'));
  });
});

describe('extractConstraints', () => {
  it('returns default constraints for empty survey', () => {
    const result = extractConstraints({});
    assert.strictEqual(result.teamSize, 'unknown');
    assert.strictEqual(result.budget, 'unknown');
    assert.strictEqual(result.timeline, 'unknown');
    assert.strictEqual(result.experience, 'unknown');
    assert.strictEqual(result.maxComplexity, 'standard');
  });

  it('detects solo developer from project description', () => {
    const survey = {
      project: { one_liner: "A side project I'm building by myself" }
    };
    const result = extractConstraints(survey);
    assert.strictEqual(result.teamSize, 'solo');
    assert.strictEqual(result.maxComplexity, 'minimal');
  });

  it('detects budget constraints from surveyor notes', () => {
    const survey = { project: { name: 'Test' } };
    const surveyorNotes = {
      implicit_constraints: ["User mentioned wanting to stay on free tier"]
    };
    const result = extractConstraints(survey, surveyorNotes);
    assert.strictEqual(result.budget, 'constrained');
    assert.strictEqual(result.maxComplexity, 'minimal');
  });

  it('detects MVP/prototype timeline', () => {
    const survey = {
      project: { one_liner: "Building an MVP to validate the idea" }
    };
    const result = extractConstraints(survey);
    assert.strictEqual(result.timeline, 'fast');
    assert.strictEqual(result.maxComplexity, 'minimal');
  });

  it('detects beginner experience from surveyor notes', () => {
    const survey = { project: { name: 'Test' } };
    const surveyorNotes = {
      implicit_constraints: ["This is my first time building a backend"]
    };
    const result = extractConstraints(survey, surveyorNotes);
    assert.strictEqual(result.experience, 'beginner');
  });

  it('handles missing surveyor notes gracefully', () => {
    const survey = { project: { name: 'Test', one_liner: 'Enterprise app' } };
    const result = extractConstraints(survey, null);
    assert.strictEqual(result.maxComplexity, 'standard');
  });

  it('combines multiple constraints', () => {
    const survey = {
      project: { one_liner: "Solo MVP project on a budget" }
    };
    const surveyorNotes = {
      implicit_constraints: ["Wants to stay on free tier", "Just me working on this"]
    };
    const result = extractConstraints(survey, surveyorNotes);
    assert.strictEqual(result.teamSize, 'solo');
    assert.strictEqual(result.budget, 'constrained');
    assert.strictEqual(result.timeline, 'fast');
    assert.strictEqual(result.maxComplexity, 'minimal');
  });
});

describe('checkComplexity', () => {
  it('returns valid: true for standard complexity', () => {
    const constraints = { maxComplexity: 'standard' };
    const recommendation = "Use microservices with Kubernetes";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.violations.length, 0);
  });

  it('flags microservices for minimal complexity', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Deploy as microservices architecture";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, false);
    assert.ok(result.violations.length > 0);
    assert.ok(result.violations[0].type === 'over_engineering');
    assert.ok(result.violations[0].reason.includes('Microservice'));
  });

  it('flags Kubernetes for minimal complexity', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Deploy to Kubernetes cluster";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, false);
    assert.ok(result.violations.some(v => v.reason.includes('K8s')));
  });

  it('flags event-driven architecture for MVP', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Use event-driven architecture with message queues";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, false);
    assert.ok(result.violations.some(v => v.reason.includes('Event-driven')));
  });

  it('flags distributed systems for solo projects', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Build a distributed system with consensus";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, false);
    assert.ok(result.violations.some(v => v.reason.includes('Distributed')));
  });

  it('allows simple stack for minimal complexity', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Use Next.js with PostgreSQL deployed on Vercel";
    const result = checkComplexity(recommendation, constraints);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.violations.length, 0);
  });

  it('returns suggestions in violations', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Use microservices";
    const result = checkComplexity(recommendation, constraints);
    assert.ok(result.violations[0].suggestion);
    assert.ok(result.violations[0].suggestion.includes('monolithic'));
  });

  it('detects multiple violations', () => {
    const constraints = { maxComplexity: 'minimal' };
    const recommendation = "Deploy microservices on Kubernetes with event-driven patterns";
    const result = checkComplexity(recommendation, constraints);
    assert.ok(result.violations.length >= 2);
  });
});
