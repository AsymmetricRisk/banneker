/**
 * Complexity ceiling module for Banneker engineer recommendations
 * Prevents over-engineering by extracting project constraints and validating recommendations
 */

/**
 * Indicators used to detect project constraints from survey text
 */
export const COMPLEXITY_INDICATORS = {
  solo_developer: ['solo', 'just me', 'one person', 'by myself', 'side project', 'personal project'],
  budget_constrained: ['budget', 'cost', 'cheap', 'free tier', 'limited resources', 'affordable'],
  time_constrained: ['quick', 'fast', 'mvp', 'prototype', 'deadline', 'asap', 'sprint'],
  experience_level: {
    beginner: ['first time', 'learning', 'new to', 'beginner', 'never used', 'just started'],
    intermediate: ['some experience', 'used before', 'familiar with', 'worked with'],
    expert: ['expert', 'years of experience', 'production at scale', 'senior']
  }
};

/**
 * Extract project constraints from survey data and surveyor notes
 * @param {object} survey - Survey JSON data
 * @param {object} surveyorNotes - Optional surveyor handoff notes
 * @returns {object} Constraints with teamSize, budget, timeline, experience, maxComplexity
 */
export function extractConstraints(survey, surveyorNotes = null) {
  const constraints = {
    teamSize: 'unknown',
    budget: 'unknown',
    timeline: 'unknown',
    experience: 'unknown',
    maxComplexity: 'standard' // standard | minimal | enterprise
  };

  // Collect all text to analyze
  const textsToAnalyze = [];

  // Add project description
  if (survey?.project?.one_liner) {
    textsToAnalyze.push(survey.project.one_liner.toLowerCase());
  }
  if (survey?.project?.problem_statement) {
    textsToAnalyze.push(survey.project.problem_statement.toLowerCase());
  }

  // Add surveyor notes constraints
  if (surveyorNotes?.implicit_constraints) {
    for (const constraint of surveyorNotes.implicit_constraints) {
      textsToAnalyze.push(constraint.toLowerCase());
    }
  }

  // Analyze all collected text
  const allText = textsToAnalyze.join(' ');

  // Check for solo developer
  if (COMPLEXITY_INDICATORS.solo_developer.some(s => allText.includes(s))) {
    constraints.teamSize = 'solo';
    constraints.maxComplexity = 'minimal';
  }

  // Check for budget constraints
  if (COMPLEXITY_INDICATORS.budget_constrained.some(s => allText.includes(s))) {
    constraints.budget = 'constrained';
    constraints.maxComplexity = 'minimal';
  }

  // Check for time constraints (MVP/prototype)
  if (COMPLEXITY_INDICATORS.time_constrained.some(s => allText.includes(s))) {
    constraints.timeline = 'fast';
    constraints.maxComplexity = 'minimal';
  }

  // Check experience level
  if (COMPLEXITY_INDICATORS.experience_level.beginner.some(s => allText.includes(s))) {
    constraints.experience = 'beginner';
  } else if (COMPLEXITY_INDICATORS.experience_level.intermediate.some(s => allText.includes(s))) {
    constraints.experience = 'intermediate';
  } else if (COMPLEXITY_INDICATORS.experience_level.expert.some(s => allText.includes(s))) {
    constraints.experience = 'expert';
  }

  return constraints;
}

/**
 * Check if recommendation exceeds complexity ceiling
 * @param {string} recommendation - Recommendation text to check
 * @param {object} constraints - Constraints from extractConstraints()
 * @returns {object} Result with valid boolean and violations array
 */
export function checkComplexity(recommendation, constraints) {
  const violations = [];

  // Only enforce ceiling for minimal complexity projects
  if (constraints.maxComplexity !== 'minimal') {
    return { valid: true, violations: [] };
  }

  // Over-engineering patterns to flag for minimal complexity projects
  const overEngineeredPatterns = [
    {
      pattern: /microservice/i,
      reason: 'Microservices over-complex for solo/MVP',
      suggestion: 'Consider simpler monolithic approach'
    },
    {
      pattern: /kubernetes|k8s/i,
      reason: 'K8s over-complex for solo/MVP',
      suggestion: 'Consider simpler monolithic approach with managed hosting (Vercel, Railway)'
    },
    {
      pattern: /event.?driven.*architecture/i,
      reason: 'Event-driven architecture over-complex for MVP',
      suggestion: 'Consider simpler monolithic approach with request/response patterns'
    },
    {
      pattern: /distributed.*system/i,
      reason: 'Distributed systems over-complex for solo',
      suggestion: 'Consider simpler monolithic approach'
    }
  ];

  for (const { pattern, reason, suggestion } of overEngineeredPatterns) {
    if (pattern.test(recommendation)) {
      violations.push({
        type: 'over_engineering',
        reason,
        suggestion
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
