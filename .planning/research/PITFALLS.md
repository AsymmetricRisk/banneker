# Domain Pitfalls: /banneker:engineer Auto-Engineering Feature

**Domain:** AI-assisted technical decision-making for interview systems
**Researched:** 2026-02-03
**Milestone:** v0.3.0 — Adding auto-engineering capability to Banneker survey pipeline

---

## Overview

The `/banneker:engineer` command introduces AI-mediated "takeover" functionality: detecting when users hit knowledge limits during surveys, synthesizing partial data into technical recommendations, and producing engineering proposals. This creates a distinct set of pitfalls compared to standard document generation.

These pitfalls are organized by severity and mapped to the phases where they should be addressed during roadmap planning.

---

## Critical Pitfalls

Mistakes that cause user trust erosion, incorrect technical decisions, or require significant rework.

### Pitfall 1: False Positive Cliff Detection (Over-Eager Takeover)

**What goes wrong:** The system detects a "cliff" and offers to take over when the user is simply:
- Thinking out loud before answering
- Using hedging language that is normal speech (e.g., "I think we should...")
- Asking clarifying questions to understand the question better
- Deliberately deferring a decision they plan to make later

**Why it happens:**
- Rule-based detection treats hedging words as uncertainty signals
- No distinction between "I don't know" (genuine gap) and "I'm not sure I understand the question" (clarification needed)
- System optimizes for detection sensitivity over specificity
- Cultural and individual speech patterns vary widely — some people hedge everything

**Consequences:**
- User feels patronized ("I knew the answer, I was just thinking")
- Trust erosion: user stops using natural language to avoid false triggers
- Worse survey data: user becomes terse to avoid detection
- Abandoned usage: user disables feature or abandons tool

**Prevention:**
1. **Require compound signals:** Never trigger on a single marker. Require 2+ signals in same response OR signal + explicit user confirmation
2. **Distinguish question types:** "I'm not sure" after a clarifying question (surveyor just explained something) vs. after a direct question
3. **Add confirmation step:** Before offering takeover, ask: "It sounds like you might want some help with this decision. Would you like me to suggest options, or would you prefer to continue?"
4. **Track user rejection:** If user declines takeover offer 2+ times, increase threshold for future offers in this session
5. **Respect explicit opt-out:** Honor signals like "No, I want to think about this" as hard blocks on future offers for this topic

**Detection (warning signs during development):**
- Test users report feeling interrupted
- High rate of declined takeover offers (>50%)
- Users start giving shorter, less natural responses
- Users explicitly complain about "the AI jumping in"

**Phase to address:** Cliff Detection phase (early) — this is foundational to the feature's UX

**Source:** Research on automation bias in human-AI collaboration ([Springer](https://link.springer.com/article/10.1007/s00146-025-02422-7)) shows that under cognitive load, users either over-rely on AI suggestions OR become frustrated by interruptions, with no middle ground.

---

### Pitfall 2: Over-Engineering Proposals (Complexity Inflation)

**What goes wrong:** The engineer generates proposals that:
- Recommend sophisticated solutions for simple problems
- Add architectural patterns the project doesn't need
- Suggest technologies based on "best practices" rather than project constraints
- Propose microservices for a prototype, Kubernetes for a static site, etc.

**Why it happens:**
- LLMs are trained on content that discusses enterprise patterns
- "Best practices" articles disproportionately cover complex scenarios
- No grounding in actual project scale/timeline/team constraints
- System lacks feedback loop to calibrate complexity to context
- The AI "sounds smart" by suggesting sophisticated solutions

**Consequences:**
- User builds something more complex than needed
- Increased time-to-value
- Technical debt from the start
- User loses confidence in recommendations after realizing overengineering

**Prevention:**
1. **Extract explicit constraints from survey:** Team size, timeline, budget, MVP-vs-production, expected user count
2. **Complexity scoring:** Before proposing, rate complexity against project constraints. If mismatch, flag or downgrade
3. **Start with simplest viable:** Default to simpler approaches. Only suggest complex patterns if user's constraints require them
4. **Include "Why NOT to use" section:** For each recommendation, document when it would be overkill
5. **User-configurable complexity ceiling:** Let user specify: "This is a prototype" or "This is production-scale"

**Detection (warning signs):**
- Proposals consistently recommend managed services, microservices, or multi-database architectures
- "Best practices" cited without context
- No "simple alternative" presented
- User feedback: "This seems like a lot for what I'm building"

**Phase to address:** Document Generation phase — RECOMMENDATION.md and ENGINEERING-PROPOSAL.md templates must enforce simplicity defaults

**Source:** AI-generated code studies ([IEEE Spectrum](https://spectrum.ieee.org/ai-coding-degrades)) show AI consistently produces more complex solutions than necessary, with "complexity creep" being a top complaint. The [iron triangle research](https://www.askflux.ai/blog/ai-generated-code-revisiting-the-iron-triangle-in-2025) confirms AI tools "excel at documentation but struggle with architecture decisions."

---

### Pitfall 3: Context Loss During Mode Switch (Interview to Engineering)

**What goes wrong:** When switching from survey mode to engineering mode:
- Nuance captured in conversational context is lost
- User's implicit priorities (mentioned casually) aren't preserved
- Tone and relationship context resets to formal
- Earlier clarifications about terminology are forgotten

**Why it happens:**
- survey.json captures structured data, not conversational context
- State file tracks phase completion, not conversational nuance
- Engineering agent starts fresh without surveyor's accumulated context
- Token limits force truncation of full conversation history

**Consequences:**
- Recommendations ignore user preferences mentioned conversationally
- Engineering proposal contradicts something user explicitly said earlier
- User has to re-explain constraints already covered
- Proposals feel generic rather than personalized

**Prevention:**
1. **Surveyor notes field:** Add `surveyor_notes` to survey.json capturing conversational observations not in structured fields
2. **Preserve key quotes:** When user makes a strong statement ("I definitely don't want X"), capture verbatim in context
3. **Context handoff document:** Surveyor writes `.banneker/state/surveyor-context.md` summarizing tone, preferences, concerns before engineer spawns
4. **Explicit transition:** Before switching modes, summarize: "Based on our conversation, I understand you want X, prefer Y, and are concerned about Z. Is that right?"
5. **Single-agent continuation:** Consider having surveyor spawn engineer as sub-task rather than full mode switch, preserving context window

**Detection (warning signs):**
- Test users say "But I already told you..."
- Engineering proposals contradict earlier statements
- Recommendations feel generic/impersonal
- User has to re-explain constraints

**Phase to address:** Orchestration phase — define context handoff protocol between surveyor and engineer

**Source:** Research on [context collapse in AI systems](https://mitrix.io/blog/context-collapse-in-ai-systems/) identifies mode switches as primary failure points. [AI context switching challenges](https://dev.to/pullflow/ai-context-switching-the-technical-challenge-reshaping-artificial-intelligence-14g6) research shows context loss at mode boundaries is a "fundamental bottleneck."

---

### Pitfall 4: Silent Confidence (Proposals Without Uncertainty Signals)

**What goes wrong:** Engineering proposals present recommendations with high confidence even when:
- The underlying data is sparse (partial survey)
- Multiple valid approaches exist with genuine tradeoffs
- The recommendation depends on assumptions that should be validated
- The AI is extrapolating beyond what the user actually said

**Why it happens:**
- LLMs generate fluent, confident-sounding text by default
- No built-in mechanism to express calibrated uncertainty
- "I recommend X" sounds more professional than "I'm 60% confident in X"
- System optimizes for actionable output, not honest uncertainty

**Consequences:**
- User implements recommendation without understanding it was a guess
- Critical assumptions go unvalidated
- Problems discovered late in implementation
- User loses trust when confident recommendations fail

**Prevention:**
1. **Explicit confidence markers:** Every recommendation must include confidence level (HIGH/MEDIUM/LOW) with justification
2. **Data sufficiency check:** Before generating recommendation, verify minimum data requirements are met. If not, flag as "low-data recommendation"
3. **Alternative presentation:** For MEDIUM/LOW confidence items, present 2-3 alternatives with tradeoff table rather than single recommendation
4. **Assumption documentation:** Each proposal must list assumptions that should be validated before implementation
5. **User validation step:** For low-confidence recommendations, require explicit user confirmation before finalizing

**Detection (warning signs):**
- All recommendations are presented as equally certain
- No "this depends on..." language
- Assumptions not called out
- User implements recommendations that turn out to be wrong

**Phase to address:** Document Generation phase — DIAGNOSIS.md and RECOMMENDATION.md templates must require confidence markers

**Source:** Simon Willison's characterization of LLMs as ["over-confident and prone to mistakes"](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) directly applies. Research shows [silent failures](https://spectrum.ieee.org/ai-coding-degrades) where AI "generates code that fails to perform as intended but which on the surface seems to run successfully" — proposals exhibit the same pattern.

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or degraded user experience but are recoverable.

### Pitfall 5: Proposal-Survey Mismatch (Ignoring User's Actual Constraints)

**What goes wrong:** Engineering proposals recommend solutions that violate user's explicitly stated constraints:
- "Use PostgreSQL" when user said "must be serverless"
- "Implement OAuth" when user said "no user accounts"
- Complex CI/CD when user said "solo developer, no team"

**Why it happens:**
- Constraint extraction from survey data is incomplete
- Generic best practices override specific user statements
- Engineer doesn't re-read full survey before generating
- Constraints are scattered across phases, not consolidated

**Prevention:**
1. **Constraints summary:** Add `constraints` top-level object to survey.json consolidating all limitations
2. **Pre-generation constraint check:** Before generating any recommendation, load and review constraints
3. **Constraint validation:** After generation, scan proposal for constraint violations
4. **User-visible constraint list:** Show user "I understand your constraints are: [X, Y, Z]" before generating

**Detection (warning signs):**
- User feedback: "I said I couldn't do that"
- Proposals recommend technologies user explicitly ruled out
- Recommendations assume resources (team, budget, time) user doesn't have

**Phase to address:** Survey Integration phase — enhance survey.json schema to consolidate constraints

---

### Pitfall 6: Approval Theater (Fake User Agency)

**What goes wrong:** The system presents approval step but:
- User can only approve or reject entire proposal, not modify parts
- Rejection doesn't offer clear path to revision
- "Approval" is just acknowledging receipt, not genuine choice
- User feels they have to accept because alternatives aren't clear

**Why it happens:**
- Approval step added to check a box, not designed for genuine interaction
- System isn't designed for iterative refinement
- Binary approve/reject is simpler to implement than nuanced feedback

**Consequences:**
- Users approve proposals they don't fully understand
- Users reject without path forward, abandoning feature
- False sense of user control
- Proposals implemented with silent disagreements

**Prevention:**
1. **Granular approval:** Allow section-by-section approval. "Do you agree with the database choice? [Y/N/Modify]"
2. **Modification path:** If user rejects, prompt for specific concerns and regenerate
3. **Comparison view:** Show what changes from current survey.json if proposal is accepted
4. **Partial acceptance:** Allow accepting some recommendations while deferring others
5. **"I want to think about it" option:** Don't force immediate decision. Allow saving proposal for later review

**Detection (warning signs):**
- High approval rate (>90%) suggests rubber-stamping
- Users report feeling "forced to accept"
- No modification requests suggests users don't understand they can modify
- Post-approval complaints about recommendations

**Phase to address:** Approval Flow phase — design genuine decision points, not confirmation dialogs

---

### Pitfall 7: Partial Data Pathologies (Engineering from Fragments)

**What goes wrong:** When engineer runs on incomplete survey (mid-cliff detection):
- Proposals are based on 2 phases of data, missing critical context
- Recommendations assume missing data that would change the answer
- User thinks they got complete recommendations from partial input

**Why it happens:**
- Cliff detection can trigger mid-survey
- System generates confidently from whatever data exists
- No minimum data requirements defined
- "Partial survey" not clearly communicated to user

**Prevention:**
1. **Minimum data requirements:** Define which survey phases are required for each document type
2. **Partial data warnings:** If generating from incomplete survey, display prominent warning
3. **Document-specific prerequisites:** ENGINEERING-PROPOSAL.md requires Phase 4 (Backend) data; DIAGNOSIS.md can run on Phase 1-2 only
4. **Confidence degradation:** Automatically lower confidence for recommendations based on partial data
5. **Missing data callout:** "This recommendation would change if you later specify [X]"

**Detection (warning signs):**
- Proposals from Phase 1-2 only surveys contain backend recommendations
- User confused about why recommendation doesn't match later survey phases
- Recommendations flagged as "assumed" that should be "specified"

**Phase to address:** Document Generation phase — add prerequisite checks before each document type

---

### Pitfall 8: Terminology Drift in Generated Documents

**What goes wrong:** Generated documents use different terms than the user's survey responses:
- Survey says "customer," proposal says "user"
- Survey says "order," proposal says "transaction"
- Survey uses domain-specific jargon, proposal uses generic terms

**Why it happens:**
- Writer agent normalizes to standard terminology
- Term registry doesn't capture user's actual vocabulary
- LLM substitutes synonyms for variety
- No validation that output terms match input terms

**Consequences:**
- User doesn't recognize their own project in the proposal
- Confusion when implementing: "Is 'user' the same as 'customer'?"
- Proposals feel generic rather than project-specific

**Prevention:**
1. **User vocabulary extraction:** Build term map from survey responses
2. **Term pinning:** Require generated documents to use exact user terms for core concepts
3. **Terminology validation:** Post-generation check for term consistency
4. **Glossary inclusion:** Every proposal starts with "In this document: [user term] means [definition]"

**Detection (warning signs):**
- User asks "What do you mean by X?" when X was their own term
- Documents use generic terms where user used specific ones
- Inconsistent terminology within proposal

**Phase to address:** Document Generation phase — extend term registry for engineer documents

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixed.

### Pitfall 9: Cliff Signal Notification Fatigue

**What goes wrong:** System reports every cliff signal verbosely:
- "I detected uncertainty in your response" after every answer
- Long lists of signals overwhelm user
- Same type of signal reported repeatedly without aggregation

**Prevention:**
- Aggregate signals by category, report summary not itemized list
- Only surface high/medium severity in user-facing messages
- Batch notifications: report at phase end, not after each question

**Phase to address:** Cliff Detection phase — notification design

---

### Pitfall 10: Proposal Format Mismatch with Downstream Tools

**What goes wrong:** Generated ENGINEERING-PROPOSAL.md doesn't match format expected by:
- /banneker:architect (can't consume new decisions)
- /banneker:feed (doesn't know about proposal files)
- GSD/OpenClaw export (proposal not included)

**Prevention:**
- Ensure proposal generates DEC-XXX format decisions that architect can consume
- Add proposal documents to feed export manifest
- Test full pipeline: survey -> engineer -> architect -> feed

**Phase to address:** Integration phase — verify proposal outputs work with existing commands

---

### Pitfall 11: Engineer Runs When Not Needed

**What goes wrong:** User runs /banneker:engineer on a complete survey with no cliffs:
- Wastes time generating empty diagnosis
- Confuses user about when to use the command
- Creates unnecessary documents

**Prevention:**
- Check cliff_signals.total_signals before generating
- If 0 signals: "No knowledge cliffs detected. Your survey is complete. Run /banneker:architect to generate planning documents."
- Don't generate empty DIAGNOSIS.md

**Phase to address:** Orchestration phase — add prerequisite check in engineer orchestrator

---

## Integration Pitfalls (Adding to Existing Survey)

Pitfalls specific to integrating engineer with the established survey pipeline.

### Pitfall 12: Survey Flow Disruption

**What goes wrong:** Cliff detection interrupts survey flow in awkward places:
- Detection triggers mid-sentence or mid-explanation
- User loses train of thought
- Survey phase structure becomes unclear

**Prevention:**
- Only offer takeover at phase boundaries, not mid-phase
- Batch cliff signals, report at phase end
- Maintain clear phase progression: complete Phase N, then offer engineering help, then Phase N+1

**Phase to address:** Survey Integration phase — define cliff detection timing rules

---

### Pitfall 13: State File Incompatibility

**What goes wrong:** Engineer creates state files that surveyor can't read, or vice versa:
- Different YAML frontmatter formats
- Incompatible progress tracking structures
- Resume fails because state file format changed

**Prevention:**
- Document state file format in shared reference
- All agents use same parsing code
- Version state file format with backward compatibility

**Phase to address:** State Management phase — standardize state file format

---

### Pitfall 14: Architecture Decision Collision

**What goes wrong:** Engineer proposes DEC-XXX entries that:
- Duplicate existing decisions with different IDs
- Contradict decisions user made explicitly
- Use IDs that conflict with existing numbering

**Prevention:**
- Engineer reads all existing DEC entries before proposing new ones
- New entries use highest existing ID + 1
- Flag any proposed decisions that contradict existing ones
- Mark engineer-proposed decisions distinctly: "DEC-XXX [PROPOSED]"

**Phase to address:** Document Generation phase — decision ID management

---

## Phase-Specific Warnings Summary

| Phase Topic | Likely Pitfall | Priority |
|-------------|---------------|----------|
| Cliff Detection | False positives (P1), Notification fatigue (P9) | Critical |
| Document Generation | Over-engineering (P2), Silent confidence (P4), Partial data (P7), Terminology drift (P8) | Critical |
| Approval Flow | Approval theater (P6) | Moderate |
| Survey Integration | Flow disruption (P12), State incompatibility (P13) | Moderate |
| Orchestration | Context loss (P3), Runs when not needed (P11), Decision collision (P14) | Critical |
| Integration | Format mismatch (P10) | Minor |

---

## Quick Reference: Pre-Implementation Checklist

Before implementing each phase, verify:

- [ ] **Cliff Detection:** Requires compound signals? Confirmation step? User can decline?
- [ ] **Document Generation:** Complexity ceiling? Confidence markers? Constraint validation? Term consistency?
- [ ] **Approval Flow:** Granular options? Modification path? "Think about it" option?
- [ ] **Context Handoff:** Surveyor notes preserved? Key quotes captured? Explicit transition?
- [ ] **State Management:** Format compatible with existing state files? Version field?
- [ ] **Integration:** Outputs consumable by architect/feed? DEC-XXX format correct?

---

## Sources

### Primary (HIGH confidence)
- Existing Banneker codebase patterns: `templates/agents/banneker-*.md`, `templates/commands/banneker-*.md`
- Existing survey flow: `banneker-surveyor.md`, `banneker-survey.md`
- STACK.md research from this milestone: `.planning/research/STACK.md`

### Secondary (MEDIUM confidence)
- [IEEE Spectrum: AI Coding Degrades](https://spectrum.ieee.org/ai-coding-degrades) — silent failures, quality plateau
- [Springer: Automation Bias in Human-AI Collaboration](https://link.springer.com/article/10.1007/s00146-025-02422-7) — over-reliance and trust patterns
- [MITRIX: Context Collapse in AI Systems](https://mitrix.io/blog/context-collapse-in-ai-systems/) — mode switch failures
- [DEV.to: AI Context Switching](https://dev.to/pullflow/ai-context-switching-the-technical-challenge-reshaping-artificial-intelligence-14g6) — context window bottlenecks
- [AI Generated Code Iron Triangle](https://www.askflux.ai/blog/ai-generated-code-revisiting-the-iron-triangle-in-2025) — complexity and architecture limitations
- [Addy Osmani: LLM Coding Workflow 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) — overconfidence patterns

### Tertiary (LOW confidence)
- [ACM: AI Mismatches](https://dl.acm.org/doi/10.1145/3706598.3714098) — mismatch between expected and actual AI performance
- [IBM: AI Agents 2025](https://www.ibm.com/think/insights/ai-agents-2025-expectations-vs-reality) — agent limitations and failures

---

## Metadata

**Confidence breakdown:**
- Critical pitfalls (P1-P4): HIGH — based on documented AI failure modes and existing Banneker patterns
- Moderate pitfalls (P5-P8): MEDIUM — extrapolated from related domains
- Minor pitfalls (P9-P11): MEDIUM — based on general UX patterns
- Integration pitfalls (P12-P14): HIGH — based on direct analysis of existing Banneker code

**Research date:** 2026-02-03
**Valid until:** 60 days (AI assistant patterns evolving; survey integration patterns stable)
