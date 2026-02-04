/**
 * Cliff detection module for Banneker surveys
 * Detects explicit signals indicating user has reached knowledge limits
 */

/**
 * Explicit cliff signal phrases (HIGH confidence)
 * A single match triggers mode switch offer
 */
export const EXPLICIT_CLIFF_SIGNALS = [
  "i don't know",
  "i dont know",
  "no idea",
  "i'm not sure",
  "i'm not technical enough",
  "whatever you think",
  "whatever you think is best",
  "you decide",
  "take it from here",
  "i'll defer to you",
  "that's beyond my expertise",
  "beyond my expertise",
  "not my area",
  "out of my depth"
];

/**
 * Detect explicit cliff signals in user response
 * @param {string} userResponse - User's response text
 * @returns {object} Detection result with detected, signal, confidence, originalResponse
 */
export function detectExplicitCliff(userResponse) {
  const normalized = userResponse.toLowerCase().trim();

  for (const signal of EXPLICIT_CLIFF_SIGNALS) {
    if (normalized.includes(signal)) {
      return {
        detected: true,
        signal: signal,
        confidence: "HIGH",
        originalResponse: userResponse
      };
    }
  }

  return { detected: false };
}

/**
 * Implicit cliff signal phrases organized by category (MEDIUM confidence)
 * Require compound detection (2+ signals) before triggering mode switch
 */
export const IMPLICIT_CLIFF_SIGNALS = {
  hedging: [
    "maybe", "perhaps", "possibly", "i guess", "i think maybe",
    "not sure if", "could be", "might be", "probably", "i suppose"
  ],
  quality_markers: [
    "um", "uh", "hmm", "well...", "let me think",
    "that's a good question", "honestly i'm not"
  ],
  deferrals: [
    "i'll figure it out later", "we can decide later",
    "whatever works", "whatever is easier", "any of those",
    "you pick", "dealer's choice"
  ]
};

/**
 * Detect implicit cliff signals in user response
 * @param {string} userResponse - User's response text
 * @returns {object} Detection result with detected, signals array, confidence, originalResponse
 */
export function detectImplicitCliff(userResponse) {
  const normalized = userResponse.toLowerCase().trim();
  const detected = [];

  // Check hedging patterns
  for (const signal of IMPLICIT_CLIFF_SIGNALS.hedging) {
    if (normalized.includes(signal)) {
      detected.push({
        signal,
        category: 'hedging',
        confidence: 'MEDIUM'
      });
    }
  }

  // Check quality degradation patterns
  for (const signal of IMPLICIT_CLIFF_SIGNALS.quality_markers) {
    if (normalized.includes(signal)) {
      detected.push({
        signal,
        category: 'quality_degradation',
        confidence: 'MEDIUM'
      });
    }
  }

  // Check deferral patterns
  for (const signal of IMPLICIT_CLIFF_SIGNALS.deferrals) {
    if (normalized.includes(signal)) {
      detected.push({
        signal,
        category: 'deferral',
        confidence: 'MEDIUM'
      });
    }
  }

  return {
    detected: detected.length > 0,
    signals: detected,
    confidence: detected.length > 0 ? 'MEDIUM' : null,
    originalResponse: userResponse
  };
}
