/**
 * Tests for lib/cliff-detection.js - Cliff signal detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectExplicitCliff, EXPLICIT_CLIFF_SIGNALS } from '../../lib/cliff-detection.js';

describe('EXPLICIT_CLIFF_SIGNALS', () => {
  it('contains expected signals', () => {
    assert.ok(EXPLICIT_CLIFF_SIGNALS.includes("i don't know"));
    assert.ok(EXPLICIT_CLIFF_SIGNALS.includes("whatever you think"));
    assert.ok(EXPLICIT_CLIFF_SIGNALS.includes("you decide"));
    assert.ok(EXPLICIT_CLIFF_SIGNALS.includes("take it from here"));
  });

  it('has at least 10 signals', () => {
    assert.ok(EXPLICIT_CLIFF_SIGNALS.length >= 10);
  });
});

describe('detectExplicitCliff', () => {
  it('detects "i don\'t know" signal', () => {
    const result = detectExplicitCliff("I don't know what database to use");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i don't know");
    assert.strictEqual(result.confidence, "HIGH");
  });

  it('detects "whatever you think" signal', () => {
    const result = detectExplicitCliff("Whatever you think is best for the backend");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "whatever you think");
    assert.strictEqual(result.confidence, "HIGH");
  });

  it('detects "you decide" signal', () => {
    const result = detectExplicitCliff("You decide, I trust your judgment");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "you decide");
    assert.strictEqual(result.confidence, "HIGH");
  });

  it('detects "take it from here" signal', () => {
    const result = detectExplicitCliff("Can you take it from here?");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "take it from here");
    assert.strictEqual(result.confidence, "HIGH");
  });

  it('is case insensitive', () => {
    const result = detectExplicitCliff("I DON'T KNOW about infrastructure");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i don't know");
  });

  it('handles "i dont know" without apostrophe', () => {
    const result = detectExplicitCliff("I dont know the answer");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i dont know");
  });

  it('preserves original response', () => {
    const original = "I don't know, maybe PostgreSQL?";
    const result = detectExplicitCliff(original);
    assert.strictEqual(result.originalResponse, original);
  });

  it('returns detected: false for non-matching response', () => {
    const result = detectExplicitCliff("I want to use PostgreSQL for the database");
    assert.strictEqual(result.detected, false);
  });

  it('returns detected: false for simple confirmations', () => {
    const result = detectExplicitCliff("Yes, that looks correct");
    assert.strictEqual(result.detected, false);
  });

  it('returns detected: false for technical answers', () => {
    const result = detectExplicitCliff("We should use Redis for caching and PostgreSQL for persistence");
    assert.strictEqual(result.detected, false);
  });

  it('detects signals embedded in longer responses', () => {
    const result = detectExplicitCliff("For the database question, I don't know, I've never worked with databases before");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i don't know");
  });

  it('detects "beyond my expertise" signal', () => {
    const result = detectExplicitCliff("That's beyond my expertise, I'm more of a designer");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "beyond my expertise");
  });

  it('detects "i\'m not technical enough" signal', () => {
    const result = detectExplicitCliff("I'm not technical enough to answer that");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i'm not technical enough");
  });
});
