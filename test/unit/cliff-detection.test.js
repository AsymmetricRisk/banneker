/**
 * Tests for lib/cliff-detection.js - Cliff signal detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectExplicitCliff, EXPLICIT_CLIFF_SIGNALS, detectImplicitCliff, IMPLICIT_CLIFF_SIGNALS, detectCompound } from '../../lib/cliff-detection.js';

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
    assert.strictEqual(result.signal, "that's beyond my expertise");
  });

  it('detects "i\'m not technical enough" signal', () => {
    const result = detectExplicitCliff("I'm not technical enough to answer that");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signal, "i'm not technical enough");
  });
});

describe('IMPLICIT_CLIFF_SIGNALS', () => {
  it('contains hedging signals', () => {
    assert.ok(IMPLICIT_CLIFF_SIGNALS.hedging.includes('maybe'));
    assert.ok(IMPLICIT_CLIFF_SIGNALS.hedging.includes('perhaps'));
    assert.ok(IMPLICIT_CLIFF_SIGNALS.hedging.includes('i guess'));
  });

  it('contains quality degradation markers', () => {
    assert.ok(IMPLICIT_CLIFF_SIGNALS.quality_markers.includes('um'));
    assert.ok(IMPLICIT_CLIFF_SIGNALS.quality_markers.includes('hmm'));
    assert.ok(IMPLICIT_CLIFF_SIGNALS.quality_markers.includes("let me think"));
  });

  it('contains deferral signals', () => {
    assert.ok(IMPLICIT_CLIFF_SIGNALS.deferrals.includes('whatever works'));
    assert.ok(IMPLICIT_CLIFF_SIGNALS.deferrals.includes('you pick'));
  });
});

describe('detectImplicitCliff', () => {
  it('detects hedging language', () => {
    const result = detectImplicitCliff("Maybe we should use PostgreSQL");
    assert.strictEqual(result.detected, true);
    assert.strictEqual(result.signals[0].category, 'hedging');
    assert.strictEqual(result.signals[0].confidence, 'MEDIUM');
  });

  it('detects quality degradation markers', () => {
    const result = detectImplicitCliff("Um, let me think about that");
    assert.strictEqual(result.detected, true);
    assert.ok(result.signals.some(s => s.category === 'quality_degradation'));
  });

  it('detects deferral patterns', () => {
    const result = detectImplicitCliff("Whatever works, you pick");
    assert.strictEqual(result.detected, true);
    assert.ok(result.signals.some(s => s.category === 'deferral'));
  });

  it('returns multiple signals if present', () => {
    const result = detectImplicitCliff("Maybe, um, whatever works I guess");
    assert.ok(result.signals.length >= 2);
  });

  it('returns detected: false for confident responses', () => {
    const result = detectImplicitCliff("I want PostgreSQL with Redis caching");
    assert.strictEqual(result.detected, false);
    assert.strictEqual(result.signals.length, 0);
  });

  it('is case insensitive', () => {
    const result = detectImplicitCliff("MAYBE we should use React");
    assert.strictEqual(result.detected, true);
  });

  it('preserves original response', () => {
    const original = "Maybe PostgreSQL?";
    const result = detectImplicitCliff(original);
    assert.strictEqual(result.originalResponse, original);
  });
});

describe('detectCompound', () => {
  it('triggers immediately on explicit signal', () => {
    const result = detectCompound("I don't know what to use");
    assert.strictEqual(result.trigger, true);
    assert.strictEqual(result.reason, 'explicit_signal');
    assert.strictEqual(result.confidence, 'HIGH');
  });

  it('does not trigger on single implicit signal', () => {
    const result = detectCompound("Maybe PostgreSQL");
    assert.strictEqual(result.trigger, false);
    assert.strictEqual(result.signalCount, 1);
  });

  it('triggers on 2+ implicit signals in current response', () => {
    const result = detectCompound("Um, maybe, whatever works");
    assert.strictEqual(result.trigger, true);
    assert.strictEqual(result.reason, 'compound_implicit');
    assert.strictEqual(result.confidence, 'MEDIUM');
    assert.ok(result.signalCount >= 2);
  });

  it('triggers when implicit signals accumulate across history', () => {
    const history = [
      { implicitSignals: [{ signal: 'maybe', category: 'hedging' }] },
      { implicitSignals: [] }
    ];
    // Current response has 1 implicit, history has 1 = 2 total
    const result = detectCompound("I guess so", history);
    assert.strictEqual(result.trigger, true);
    assert.strictEqual(result.reason, 'compound_implicit');
  });

  it('uses only last 3 responses from history', () => {
    const history = [
      { implicitSignals: [{ signal: 'old1', category: 'hedging' }] }, // Too old
      { implicitSignals: [{ signal: 'old2', category: 'hedging' }] }, // Too old
      { implicitSignals: [] }, // -3
      { implicitSignals: [] }, // -2
      { implicitSignals: [] }  // -1
    ];
    // Only last 3 have 0 implicit signals, current has 1 = 1 total (no trigger)
    const result = detectCompound("Maybe", history);
    assert.strictEqual(result.trigger, false);
    assert.strictEqual(result.signalCount, 1);
  });

  it('returns detected signals array', () => {
    const result = detectCompound("Maybe, I guess, whatever");
    assert.ok(Array.isArray(result.signals));
    assert.ok(result.signals.length > 0);
  });

  it('does not trigger on confident response', () => {
    const result = detectCompound("Use PostgreSQL with Redis caching");
    assert.strictEqual(result.trigger, false);
    assert.strictEqual(result.signalCount, 0);
  });

  it('explicit signal takes priority over accumulated implicit', () => {
    const history = [
      { implicitSignals: [{ signal: 'maybe', category: 'hedging' }] },
      { implicitSignals: [{ signal: 'um', category: 'quality_degradation' }] }
    ];
    const result = detectCompound("I don't know", history);
    assert.strictEqual(result.trigger, true);
    assert.strictEqual(result.reason, 'explicit_signal');
    assert.strictEqual(result.confidence, 'HIGH');
  });
});
