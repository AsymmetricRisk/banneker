---
name: cliff-detection-signals
description: "Reference configuration for cliff signal detection during surveys. Defines explicit signal phrases and detection thresholds."
version: "1.0"
---

# Cliff Detection Signals

This document defines the explicit cliff signals that trigger mode switch offers during Banneker surveys.

## Explicit Cliff Signals (HIGH Confidence)

These phrases indicate HIGH confidence that the user has reached a knowledge cliff. A single match triggers a mode switch offer.

```javascript
const EXPLICIT_CLIFF_SIGNALS = [
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
```

## Detection Algorithm

1. Normalize user response: `toLowerCase().trim()`
2. Check for exact phrase match using `String.includes()`
3. If match found, log to `cliff_signals` array with confidence: "HIGH"
4. Offer mode switch with two-step confirmation

## Threshold Configuration

| Threshold | Value | Description |
|-----------|-------|-------------|
| Single explicit signal | Trigger | One HIGH confidence match triggers offer |
| Declined offers before suppression | 2 | After 2 declined offers, stop offering for this session |
| Session reset | New survey | Decline counter resets on new survey start |

## Implicit Cliff Signals (MEDIUM Confidence)

Implicit signals indicate uncertainty without explicit declaration. These signals use **compound detection** - requiring 2+ signals across the current response and last 3 responses before triggering a mode switch offer.

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

## Detection Rules

### Explicit Signals (HIGH Confidence)
- **Trigger:** Single match triggers mode switch offer immediately
- **Confidence:** HIGH
- **Example:** "I don't know what database to use" -> immediate offer

### Implicit Signals (MEDIUM Confidence)
- **Trigger:** 2+ signals required across current + last 3 responses
- **Confidence:** MEDIUM
- **History window:** Last 3 responses only (resets at phase boundaries)
- **Example:** "Maybe PostgreSQL" (1 signal) + later "I guess that works" (2 signals) -> compound trigger

### Logging
- All detections logged to `cliff_signals` array in survey.json
- Includes: timestamp, signal, category (explicit/hedging/quality_degradation/deferral), confidence
- Logged regardless of whether threshold met (for analytics)

### State Tracking
Survey state file tracks recent history for compound detection:

```markdown
## Cliff Detection State

**Recent Response History (for compound detection):**

| Response # | Implicit Signals | Categories |
|------------|------------------|------------|
| -3         | 0                | -          |
| -2         | 1                | hedging    |
| -1         | 1                | deferral   |
| Current    | 1                | hedging    |

**Compound signal count:** 3 (threshold: 2)
**Compound trigger:** YES
```

## Notes

- Phase 12 focuses on explicit signals only (HIGH confidence)
- Implicit signal detection (hedging language, quality drop) deferred to Phase 15
- All detections logged regardless of whether offer is made (audit trail)
- Context handoff document written before engineer mode spawn (see surveyor-context.md)
