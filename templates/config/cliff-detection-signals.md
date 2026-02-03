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

## Notes

- Phase 12 focuses on explicit signals only (HIGH confidence)
- Implicit signal detection (hedging language, quality drop) deferred to Phase 15
- All detections logged regardless of whether offer is made (audit trail)
- Context handoff document written before engineer mode spawn (see surveyor-context.md)
