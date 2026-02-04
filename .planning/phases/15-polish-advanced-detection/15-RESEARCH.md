# Phase 15: Polish & Advanced Detection - Research

**Researched:** 2026-02-04
**Domain:** Cliff signal detection, complexity management, research integration
**Confidence:** MEDIUM

## Summary

Phase 15 extends Banneker's cliff detection system from explicit signals (14 phrases) to implicit signals (hedging language, response quality degradation, repeated deferrals), adds compound detection logic requiring 2+ signals to prevent false positives, enforces a complexity ceiling based on survey constraints, and enables research-on-demand via WebSearch during engineer synthesis.

The existing cliff-detection.js module provides a clean foundation: the `detectExplicitCliff()` function returns a structured result object that can be extended. The surveyor agent already tracks state fields (pendingOffer, declinedOffers, cliffSignals) that support multi-signal tracking.

**Primary recommendation:** Extend existing cliff-detection.js with `detectImplicitCliff()` and `detectCompound()` functions that return the same structured result format, keeping explicit detection as HIGH confidence and adding MEDIUM confidence for implicit signals.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 18+ | All detection logic | Zero dependency constraint |
| String methods | native | Pattern matching | Simple, fast, no regex needed for most patterns |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| RegExp | native | Complex pattern matching | Hedging phrase detection with word boundaries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| String.includes() | RegExp | Regex for word boundaries to avoid false positives (e.g., "maybe" in "definitely maybe the movie") |
| Simple arrays | Trie data structure | Over-engineering for <50 signal phrases |

## Architecture Patterns

### Recommended Module Structure

```
lib/
├── cliff-detection.js          # Extend existing
│   ├── detectExplicitCliff()   # Existing (HIGH confidence)
│   ├── detectImplicitCliff()   # NEW (MEDIUM confidence)
│   ├── detectCompound()        # NEW (aggregates signals)
│   └── IMPLICIT_CLIFF_SIGNALS  # NEW constant
│
├── complexity-ceiling.js       # NEW
│   ├── extractConstraints()    # From survey data
│   ├── checkComplexity()       # Validate recommendations
│   └── COMPLEXITY_INDICATORS   # Config constant
│
└── research-integration.js     # NEW
    ├── identifyGaps()          # From DIAGNOSIS gaps
    ├── triggerResearch()       # WebSearch orchestration
    └── integrateResults()      # Into RECOMMENDATION
```

### Pattern 1: Multi-Tier Detection with Confidence

**What:** Extend existing detection to return confidence levels that distinguish signal types
**When to use:** All cliff detection calls
**Example:**

```javascript
// lib/cliff-detection.js extension

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
```

### Pattern 2: Compound Detection with Threshold

**What:** Require 2+ signals before triggering mode switch offer for implicit signals
**When to use:** When implicit signals detected (prevents false positives)
**Example:**

```javascript
export function detectCompound(userResponse, recentHistory = []) {
  const explicitResult = detectExplicitCliff(userResponse);
  const implicitResult = detectImplicitCliff(userResponse);

  // Explicit signals always trigger immediately (HIGH confidence)
  if (explicitResult.detected) {
    return {
      trigger: true,
      reason: 'explicit_signal',
      ...explicitResult
    };
  }

  // Count implicit signals in current response
  const currentImplicitCount = implicitResult.signals.length;

  // Count implicit signals in recent history (last 3 responses)
  const historyImplicitCount = recentHistory
    .slice(-3)
    .filter(r => r.implicitSignals?.length > 0)
    .reduce((sum, r) => sum + r.implicitSignals.length, 0);

  const totalImplicit = currentImplicitCount + historyImplicitCount;

  // Compound threshold: 2+ implicit signals needed
  if (totalImplicit >= 2) {
    return {
      trigger: true,
      reason: 'compound_implicit',
      signalCount: totalImplicit,
      confidence: 'MEDIUM',
      signals: implicitResult.signals,
      originalResponse: userResponse
    };
  }

  // Log detection but don't trigger
  return {
    trigger: false,
    signalCount: totalImplicit,
    signals: implicitResult.signals,
    originalResponse: userResponse
  };
}
```

### Pattern 3: Complexity Ceiling Enforcement

**What:** Extract constraints from survey and validate engineer recommendations
**When to use:** During engineer document generation
**Example:**

```javascript
// lib/complexity-ceiling.js

export const COMPLEXITY_INDICATORS = {
  solo_developer: ['solo', 'just me', 'one person', 'by myself', 'side project'],
  budget_constrained: ['budget', 'cost', 'cheap', 'free tier', 'limited resources'],
  time_constrained: ['quick', 'fast', 'mvp', 'prototype', 'deadline'],
  experience_level: {
    beginner: ['first time', 'learning', 'new to', 'beginner', 'never used'],
    intermediate: ['some experience', 'used before', 'familiar with'],
    expert: ['expert', 'years of experience', 'production at scale']
  }
};

export function extractConstraints(survey, surveyorNotes) {
  const constraints = {
    teamSize: 'unknown',
    budget: 'unknown',
    timeline: 'unknown',
    experience: 'unknown',
    maxComplexity: 'standard' // standard | minimal | enterprise
  };

  // Check surveyor notes for preferences/constraints
  if (surveyorNotes?.implicit_constraints) {
    for (const constraint of surveyorNotes.implicit_constraints) {
      const lower = constraint.toLowerCase();

      if (COMPLEXITY_INDICATORS.solo_developer.some(s => lower.includes(s))) {
        constraints.teamSize = 'solo';
        constraints.maxComplexity = 'minimal';
      }
      if (COMPLEXITY_INDICATORS.budget_constrained.some(s => lower.includes(s))) {
        constraints.budget = 'constrained';
        constraints.maxComplexity = 'minimal';
      }
    }
  }

  // Check project type indicators
  if (survey.project?.one_liner) {
    const projectDesc = survey.project.one_liner.toLowerCase();
    if (projectDesc.includes('mvp') || projectDesc.includes('prototype')) {
      constraints.timeline = 'fast';
      constraints.maxComplexity = 'minimal';
    }
  }

  return constraints;
}

export function checkComplexity(recommendation, constraints) {
  const violations = [];

  if (constraints.maxComplexity === 'minimal') {
    // Flag over-engineering for minimal complexity projects
    const overEngineeredPatterns = [
      { pattern: /microservice/i, reason: 'Microservices over-complex for solo/MVP' },
      { pattern: /kubernetes|k8s/i, reason: 'K8s over-complex for solo/MVP' },
      { pattern: /event.?driven.*architecture/i, reason: 'Event-driven over-complex for MVP' },
      { pattern: /distributed/i, reason: 'Distributed systems over-complex for solo' }
    ];

    for (const { pattern, reason } of overEngineeredPatterns) {
      if (pattern.test(recommendation)) {
        violations.push({
          type: 'over_engineering',
          reason,
          suggestion: 'Consider simpler monolithic approach'
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
```

### Pattern 4: Research-on-Demand Integration

**What:** Trigger WebSearch when engineer encounters gaps that research could fill
**When to use:** During RECOMMENDATION.md generation when LOW confidence
**Example:**

```javascript
// lib/research-integration.js

export function identifyResearchableGaps(diagnosisGaps) {
  const researchable = [];

  for (const gap of diagnosisGaps) {
    // Gaps that can be filled with research
    if (gap.includes('best practices') ||
        gap.includes('recommended') ||
        gap.includes('industry standard') ||
        gap.includes('current approach')) {
      researchable.push({
        gap,
        searchQuery: buildSearchQuery(gap),
        priority: 'medium'
      });
    }

    // Technology comparison gaps
    if (gap.includes('vs') || gap.includes('comparison')) {
      researchable.push({
        gap,
        searchQuery: buildSearchQuery(gap),
        priority: 'high'
      });
    }
  }

  return researchable;
}

function buildSearchQuery(gap) {
  // Extract technology names and add year for freshness
  const cleanGap = gap
    .replace(/backend\.|frontend\.|survey\./g, '')
    .replace(/not.?captured|missing|gap/gi, '');

  return `${cleanGap} best practices 2026`;
}

// In engineer agent context:
// Use WebSearch tool when:
// 1. DIAGNOSIS shows gap in technology comparison
// 2. Recommendation would be LOW confidence without research
// 3. User hasn't explicitly deferred the topic
```

### Anti-Patterns to Avoid

- **Over-sensitive detection:** Don't trigger on every "maybe" - require compound signals
- **False positive hedging:** "Maybe we could use React" is different from "I don't know, maybe?"
- **Word boundary issues:** Match "i don't know" but not "hidden knowledge"
- **Research without bounds:** Limit research to 2-3 queries per session to avoid context bloat
- **Complexity ceiling as blocker:** Warn but don't prevent user from choosing complex solutions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sentiment analysis | Custom NLP | Pattern matching with word lists | Survey responses are short, NLP overkill |
| Response quality scoring | ML model | Simple heuristics (length, specificity markers) | Deterministic, testable, no dependencies |
| Research integration | Custom crawler | WebSearch tool | Already available, maintained, safe |

**Key insight:** The cliff detection is fundamentally pattern matching on short text. NLP/ML approaches add complexity without proportional benefit for the 10-50 word responses typical in surveys.

## Common Pitfalls

### Pitfall 1: False Positive Avalanche

**What goes wrong:** Every "maybe" or "I think" triggers cliff detection, annoying users
**Why it happens:** Implicit signals are common in normal speech
**How to avoid:** Compound detection threshold (2+ signals required for implicit)
**Warning signs:** Users declining mode switch repeatedly, high declinedOffers count

### Pitfall 2: Context-Free Detection

**What goes wrong:** "Maybe we should use PostgreSQL" detected as hedging when user is actually being specific
**Why it happens:** Ignoring sentence structure/context
**How to avoid:**
- Check if response contains specific technical choices (proper nouns, version numbers)
- Lower confidence when response also contains specifics
**Warning signs:** Cliff detected on responses with technology names

### Pitfall 3: Research Query Explosion

**What goes wrong:** Engineer spawns 10+ WebSearch queries, burns context budget
**Why it happens:** Every LOW confidence recommendation triggers research
**How to avoid:**
- Limit to 3 research queries per session
- Prioritize gaps that most affect overall confidence
- Skip research if survey completeness > 70%
**Warning signs:** Context window warnings, slow generation

### Pitfall 4: Complexity Ceiling Blocks Valid Choices

**What goes wrong:** Solo developer who actually wants microservices gets blocked
**Why it happens:** Treating ceiling as hard constraint vs advisory
**How to avoid:**
- Present as warning with rationale, not block
- Allow user override with acknowledgment
**Warning signs:** User frustration, overriding ceiling frequently

## Code Examples

### Implicit Signal Configuration

```javascript
// templates/config/cliff-detection-signals.md (new section)

## Implicit Cliff Signals (MEDIUM Confidence)

Implicit signals indicate uncertainty without explicit declaration. Require 2+ signals
(compound detection) before offering mode switch.

### Hedging Language
- "maybe", "perhaps", "possibly"
- "i guess", "i think maybe"
- "not sure if", "could be", "might be"
- "probably", "i suppose"

### Quality Degradation Markers
- "um", "uh", "hmm"
- "well...", "let me think"
- "that's a good question"
- "honestly i'm not"

### Soft Deferrals
- "i'll figure it out later"
- "we can decide later"
- "whatever works", "whatever is easier"
- "any of those", "you pick"
- "dealer's choice"

### Detection Rules

1. **Explicit signals:** Single match = HIGH confidence trigger (existing behavior)
2. **Implicit signals:** 2+ signals in current OR last 3 responses = MEDIUM confidence trigger
3. **Logging:** All detections logged regardless of trigger threshold
4. **History:** Track implicit signals across responses for compound detection
```

### State Extension for Compound Detection

```javascript
// Extension to survey-state.md structure

## Cliff Detection State

**Declined offers:** 0
**Pending offer:** false
**Suppression threshold:** 2

### Recent Response History (for compound detection)

| Response # | Implicit Signals | Explicit Signals |
|------------|------------------|------------------|
| -3         | 0                | 0                |
| -2         | 1 (hedging)      | 0                |
| -1         | 1 (deferral)     | 0                |
| Current    | 1 (hedging)      | 0                |

**Compound signal count:** 3 (threshold: 2)
**Compound trigger:** YES

### Cliff Signals Detected

- [timestamp] Phase 2: Implicit "maybe" (hedging) - no trigger (1/2 threshold)
- [timestamp] Phase 2: Implicit "whatever works" (deferral) - no trigger (2/2 threshold)
- [timestamp] Phase 3: Implicit "i guess" (hedging) - **COMPOUND TRIGGER** (3 signals)
```

### Complexity Ceiling in Engineer Output

```markdown
## Complexity Assessment

**Extracted Constraints:**
- Team size: Solo developer (inferred from "I" vs "we" in survey)
- Budget: Constrained (mentioned "free tier" in backend discussion)
- Timeline: MVP/Fast (project described as "prototype")
- Experience: Intermediate (familiar with React, new to backend)

**Complexity Ceiling:** MINIMAL

### Recommendations Flagged

The following recommendations exceed the minimal complexity ceiling:

| Recommendation | Issue | Alternative |
|----------------|-------|-------------|
| Kubernetes deployment | Over-complex for solo MVP | Vercel/Railway single-instance |
| Event-driven architecture | Over-complex for prototype | Simple request/response API |

**User Override:** These recommendations are flagged, not blocked. If you have specific
reasons for these choices (learning, future scaling), proceed with acknowledgment.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Explicit signals only | Explicit + Implicit | Phase 15 | Catches more uncertainty |
| Single signal trigger | Compound detection | Phase 15 | Fewer false positives |
| Fixed recommendations | Complexity ceiling | Phase 15 | Right-sized solutions |
| Static analysis | Research-on-demand | Phase 15 | Higher confidence recommendations |

## Open Questions

1. **Response history depth**
   - What we know: 3 responses is reasonable for compound detection
   - What's unclear: Should history reset at phase boundaries?
   - Recommendation: Reset at phase boundaries to keep detection contextual

2. **Research query limit**
   - What we know: More research = better confidence but burns context
   - What's unclear: Optimal number of queries
   - Recommendation: Start with 3 max, tune based on feedback

3. **Complexity ceiling strictness**
   - What we know: Users should be warned, not blocked
   - What's unclear: How prominent should warnings be?
   - Recommendation: Include in RECOMMENDATION.md as dedicated section, not inline

## Sources

### Primary (HIGH confidence)

- Existing codebase: `lib/cliff-detection.js` - current implementation patterns
- Existing codebase: `templates/agents/banneker-surveyor.md` - state management patterns
- Existing codebase: `templates/agents/banneker-engineer.md` - document generation patterns

### Secondary (MEDIUM confidence)

- Phase 12 decisions: Detection function structure, TDD pattern
- Phase 14 decisions: State tracking fields, minimum viability thresholds

### Tertiary (LOW confidence)

- Hedging language patterns: Based on linguistic common patterns
- Complexity indicators: Based on common project descriptions

## Metadata

**Confidence breakdown:**
- Implicit detection patterns: MEDIUM - based on linguistic patterns, needs validation
- Compound detection logic: HIGH - clear extension of existing architecture
- Complexity ceiling: MEDIUM - constraint extraction needs real-world tuning
- Research integration: HIGH - uses existing WebSearch tool pattern

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain)
