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
