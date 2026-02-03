# Feature Landscape: /banneker:engineer Command

**Domain:** AI-assisted technical decision-making, "take over" mode for knowledge interviews
**Researched:** 2026-02-03
**Confidence:** MEDIUM-HIGH

## Executive Summary

The `/banneker:engineer` command addresses a common pattern in AI-assisted discovery: users often know **what** they want but not **how** to build it. When users reach their knowledge limit during a survey ("I don't know", "whatever you think", "take it from here"), the system should shift from questioning to proposing.

This feature landscape documents expected behaviors for an AI assistant that:
1. Detects when users hit their "knowledge cliff"
2. Offers to transition from interviewer to engineer mode
3. Synthesizes available information to make technical recommendations
4. Presents decisions for user approval (not autonomous execution)

## Table Stakes

Features users expect. Missing = command feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Cliff detection during survey** | Users shouldn't have to explicitly request help; system should recognize when they're stuck | Medium | Pattern matching on phrases + conversational context |
| **Explicit takeover offer** | Users must consent before AI makes decisions for them; autonomy is table stakes for trust | Low | Simple yes/no prompt after cliff detected |
| **DIAGNOSIS.md output** | Users need to see what the system knows before it proposes solutions | Medium | Synthesizes survey.json + partial answers + explicit gaps |
| **RECOMMENDATION.md output** | Options analysis is expected in any decision support tool; can't just dictate | High | Trade-off matrix, pros/cons, context-dependent rankings |
| **ENGINEERING-PROPOSAL.md output** | Final decisions need rationale and approval path | Medium | Concrete choices with DEC-XXX format integration |
| **Approval workflow before execution** | AI should never make permanent changes without user consent | Low | "Do you approve these recommendations? (y/N)" gate |
| **Works with partial survey data** | Cliff can occur mid-interview; system must handle incomplete context | Medium | Graceful degradation, explicit marking of gaps |
| **Standalone invocation** | Post-survey use case: completed survey but user wants help with specific decisions | Low | `/banneker:engineer` as independent command |
| **Transparent reasoning** | Users expect to understand WHY the AI recommends something | Medium | Chain-of-thought in RECOMMENDATION.md, not just conclusions |

## Differentiators

Features that set this command apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Conversational cliff detection** | Detect uncertainty through tone/hedging, not just explicit "I don't know" | High | Requires pattern recognition: "I guess...", "maybe...", "probably should..." |
| **Graduated autonomy levels** | Let user choose: "assist me" vs "propose for me" vs "decide for me" | Medium | Three modes with different output expectations |
| **Confidence ratings per recommendation** | Show HIGH/MEDIUM/LOW confidence on each technical decision | Medium | Helps users focus review effort on uncertain areas |
| **Alternative exploration prompts** | Offer to explore specific alternatives if user questions a recommendation | Medium | "Want me to dig deeper into the serverless option?" |
| **Integration with existing DEC-XXX decisions** | Read `architecture-decisions.json` to avoid contradicting prior choices | Low | Context awareness across the Banneker ecosystem |
| **Research-on-demand for gaps** | Offer to research specific technologies when making recommendations | High | WebSearch/Context7 integration for current information |
| **Edit-before-approve workflow** | Let user modify proposals before accepting | Medium | Round-trip editing of ENGINEERING-PROPOSAL.md |
| **Reasoning traces exportable** | Include chain-of-thought in machine-readable format for downstream agents | Low | JSON reasoning alongside markdown output |
| **Domain-specific templates** | Different proposal structures for web apps vs APIs vs CLI tools | Medium | Conditional template selection based on project type |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Silent autonomous execution** | Users lose trust when AI acts without consent; the "Review Fatigue" trap makes this worse | Always gate on approval; never modify files without explicit "yes" |
| **Single "right answer" framing** | Technical decisions have trade-offs; pretending there's one correct choice undermines credibility | Present options with trade-offs; make recommendations, not mandates |
| **Cliff detection without offer** | Detecting uncertainty then continuing to question is frustrating | Always offer mode switch when cliff detected |
| **Unverified technology claims** | Recommending libraries/tools based on stale training data causes real problems | Research current state before recommending; cite sources |
| **Hiding uncertainty** | Presenting LOW confidence recommendations as HIGH damages trust long-term | Explicit confidence levels on every recommendation |
| **Monolithic proposal document** | 50-page proposal is "review fatigue" incarnate; users will approve without reading | Structured docs: DIAGNOSIS (short) -> RECOMMENDATION (detailed) -> PROPOSAL (actionable) |
| **Immediate implementation after approval** | Users approve decisions, not implementations; conflating these is scope creep | PROPOSAL is for decisions only; implementation is separate workflow |
| **Assuming user incompetence** | "Take over" doesn't mean user has no opinions; they know the problem, not the solution | Collaborative framing: "Based on your requirements, here are options..." |
| **Ignoring project context** | Generic recommendations that ignore survey.json, DEC-XXX history | Always synthesize existing project context before recommending |
| **One-shot proposals** | No opportunity to refine means user rejects entire proposal or accepts with reservations | Iterative approval: per-section or per-decision granularity |

## Cliff Detection Patterns

Signals that indicate user has reached their knowledge limit.

### Explicit Cliff Signals (HIGH confidence)

Direct statements indicating user doesn't know:
- "I don't know"
- "No idea"
- "I'm not sure"
- "Whatever you think"
- "You decide"
- "Take it from here"
- "I'll defer to you"
- "That's beyond my expertise"
- "I'm not technical enough for that"

**Action:** Immediate offer to switch to engineer mode.

### Implicit Cliff Signals (MEDIUM confidence)

Hedging language suggesting uncertainty:
- "I guess..." / "I suppose..."
- "Maybe we should..." / "Probably..."
- "Is [X] a good choice?"
- "What would you recommend?"
- "What's the standard approach?"
- Repeated "I think so?" responses
- Very short answers after detailed earlier responses

**Action:** Probe once ("Would you like me to help with this decision?"), then offer engineer mode if uncertainty continues.

### Context Cliff Signals (LOW confidence)

Pattern changes suggesting cognitive overload:
- Sudden drop in response detail
- Multiple consecutive "N/A" or "skip" responses
- Questions about basic terminology
- Requests to "come back to this later"

**Action:** Offer to pause the interview and switch to engineer mode for the problematic topic.

### Non-Cliff Signals (False Positives)

Statements that sound uncertain but aren't cliff indicators:
- "I haven't decided yet" (means user IS the decision-maker)
- "We're still evaluating" (means decision in progress)
- "The team hasn't aligned" (means user knows, others don't)
- "That depends on budget" (constraint, not knowledge gap)

**Action:** Continue questioning normally; these indicate user capability, not cliff.

## Document Output Specifications

### DIAGNOSIS.md

**Purpose:** Show user what the system understands before proposing solutions.

**Structure:**
```markdown
# Engineering Diagnosis

**Generated:** [timestamp]
**Survey state:** [complete/partial]
**Confidence:** [HIGH/MEDIUM/LOW]

## What We Know

### Project Understanding
[Summary of survey.json: project name, problem, actors, key flows]

### Existing Decisions
[List of DEC-XXX entries from architecture-decisions.json]

### Technology Context
[Any technologies already mentioned or implied]

## What's Missing

### Critical Gaps
[Information needed to make recommendations]

### Secondary Gaps
[Nice-to-have information, not blocking]

### Assumptions Made
[What the system will assume if gaps aren't filled]

## Scope of Engineering Support

Based on gaps, the engineer can help with:
- [ ] [Decision area 1]
- [ ] [Decision area 2]
- [ ] [Decision area 3]

---

*Proceed to RECOMMENDATION.md for options analysis.*
```

**Key principles:**
- Never longer than 2 pages
- Explicit about what's known vs assumed
- Lists gaps so user can fill them before proceeding (optional)
- Sets expectations for what recommendations will cover

### RECOMMENDATION.md

**Purpose:** Present options with trade-offs for user consideration.

**Structure:**
```markdown
# Engineering Recommendations

**Generated:** [timestamp]
**Covers:** [list of decision areas]

## Decision 1: [Topic]

### Context
[Why this decision matters, what it affects]

### Options

| Option | Pros | Cons | Confidence |
|--------|------|------|------------|
| [A] | [list] | [list] | HIGH/MED/LOW |
| [B] | [list] | [list] | HIGH/MED/LOW |
| [C] | [list] | [list] | HIGH/MED/LOW |

### Recommendation

**Recommended:** [Option X]

**Rationale:** [2-3 sentences explaining why, referencing project context]

**Alternatives considered:** [Brief note on why others weren't recommended]

---

## Decision 2: [Topic]
[Same structure]

---

## Summary of Recommendations

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| [1] | [Option X] | [level] |
| [2] | [Option Y] | [level] |

---

*Review these recommendations. When ready, ENGINEERING-PROPOSAL.md will capture final decisions.*
```

**Key principles:**
- Options are always presented, never just one answer
- Trade-offs are explicit and honest
- Confidence levels help user prioritize review
- Recommendations cite project context (survey data, DEC-XXX history)
- Architecture Tradeoff Analysis Method (ATAM) influence on structure

### ENGINEERING-PROPOSAL.md

**Purpose:** Final decisions formatted for approval and integration into DEC-XXX records.

**Structure:**
```markdown
# Engineering Proposal

**Generated:** [timestamp]
**Status:** PENDING APPROVAL

## Proposed Decisions

### DEC-XXX: [Question]

**Choice:** [Recommended option]

**Rationale:** [Why this choice fits the project]

**Alternatives Considered:**
- [Option B]: Rejected because [reason]
- [Option C]: Rejected because [reason]

**Confidence:** [HIGH/MEDIUM/LOW]

---

### DEC-XXX: [Question]
[Same structure]

---

## Implementation Notes

[Brief notes on order of implementation, dependencies between decisions]

## Approval

To approve this proposal:
- Review each DEC-XXX entry
- Modify any decisions you disagree with
- Run `/banneker:engineer --approve` to integrate into architecture-decisions.json

---

*This proposal does not make changes to your project. Approval records decisions for future reference.*
```

**Key principles:**
- DEC-XXX format matches existing architecture-decisions.json
- Approval is explicit and gated
- Implementation is deferred (this command makes decisions, not code)
- User can edit before approving

## Feature Dependencies

```
Cliff Detection ──┬── Survey Integration (uses survey-state.md)
                  │
                  └── Standalone Mode (reads survey.json)
                             │
                             v
                      DIAGNOSIS.md
                             │
                             v
                    RECOMMENDATION.md ──── Trade-off Analysis
                             │
                             v
                   ENGINEERING-PROPOSAL.md
                             │
                             v
                      Approval Gate
                             │
                             v
               architecture-decisions.json (write DEC-XXX)
```

## MVP Recommendation

For MVP `/banneker:engineer` command, prioritize:

### Phase 1: Core Pipeline
1. **Standalone invocation** - `/banneker:engineer` reads survey.json, produces all three documents
2. **DIAGNOSIS.md generation** - Synthesize known information
3. **RECOMMENDATION.md generation** - Options with trade-offs (manual research, no auto-search)
4. **ENGINEERING-PROPOSAL.md generation** - DEC-XXX format decisions
5. **Approval workflow** - Write to architecture-decisions.json on approval

### Phase 2: Survey Integration
1. **Cliff detection (explicit signals)** - Pattern matching on "I don't know" variants
2. **Takeover offer during survey** - Prompt when cliff detected
3. **Partial survey support** - Handle incomplete survey-state.md

### Phase 3: Polish
1. **Implicit cliff detection** - Hedging language patterns
2. **Confidence ratings** - Per-recommendation confidence
3. **Edit-before-approve** - Round-trip editing

### Defer to Post-MVP
- **Research-on-demand** - WebSearch integration (adds significant complexity)
- **Graduated autonomy levels** - Three modes (can start with single "propose" mode)
- **Domain-specific templates** - Different structures per project type

## UX Patterns from Ecosystem

Key learnings from AI assistant UX research:

### The Review Paradox
> "It is often cognitively harder to verify the quality of AI work than to produce it oneself, yet verification is the only role left for humans."

**Implication:** Design for glanceability. DIAGNOSIS.md must be < 2 pages. Summary tables over prose.

### Human-in-the-Loop Fatigue
> "Review Fatigue sets in when humans approve agent actions without true oversight."

**Implication:** Granular approval (per-decision) over monolithic approval (whole proposal). Let user approve high-confidence items quickly.

### Role Statements Build Trust
> "A single sentence role statement should be always visible near the agent entry point."

**Implication:** ENGINEERING-PROPOSAL.md header should clarify: "This document captures decisions. It does not modify your project. You control what gets approved."

### Shift from Reactive to Proactive
> "AI evolving from passive tools (wait for prompt) to active Agentic Systems (pursue goals)."

**Implication:** Cliff detection is proactive (system detects user struggle), but execution is reactive (user must approve). Balance autonomy with control.

### Turning "I Don't Know" into Action
> "The best AI chatbots don't stop at 'I don't know.' They follow up with useful actions."

**Implication:** When system identifies gaps (DIAGNOSIS.md), it should propose how to fill them or proceed with assumptions, not just list problems.

## Competitive Landscape

How other tools handle similar scenarios:

| Tool | Approach | Strength | Weakness |
|------|----------|----------|----------|
| **GitHub Copilot** | Waits for direction; suggests but doesn't push | Non-intrusive; user controls engagement | No proactive help when user stuck |
| **Cursor Agent Mode** | Full autonomy to create files, run commands | Fast for known goals | Can overwhelm users; requires trust |
| **Claude Code** | Conversational with explicit tool calls | Transparent actions; checkpoints | No built-in cliff detection |
| **Lovable** | Intent-to-implementation pipeline | Good for non-technical users | Black box decisions |

**Banneker opportunity:** Explicit cliff detection + structured approval workflow = trust-building alternative to full autonomy.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Over-confident recommendations | HIGH | Explicit confidence levels; cite sources |
| Recommending outdated tech | MEDIUM | Research step before finalizing (Phase 3) |
| Users approve without reading | HIGH | Per-decision approval; summary tables |
| Cliff detection false positives | MEDIUM | Probe before switching modes |
| Contradicting existing DEC-XXX | LOW | Read architecture-decisions.json as context |

## Sources

### Primary (HIGH confidence)
- [Rhythmiq: Why "I Don't Know" Makes AI Chatbots More Trustworthy](https://rhythmiqcx.com/blog/why-i-dont-know-makes-ai-chatbots-more-trustworthy) - Uncertainty handling patterns
- [SEI/CMU: Architecture Tradeoff Analysis Method](https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/) - Trade-off documentation structure
- [Jakob Nielsen: 18 Predictions for 2026](https://jakobnielsenphd.substack.com/p/2026-predictions) - Review Paradox, Audit Interface challenge
- [Vellum: 2026 Guide to AI Agent Workflows](https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns) - Checkpoint-based approval patterns
- [AufaitUX: Agentic AI Design Patterns](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/) - Human-in-the-loop oversight

### Secondary (MEDIUM confidence)
- [ACM: Proactive Conversational AI Survey](https://dl.acm.org/doi/10.1145/3715097) - Clarification need prediction
- [Google Research: AMIE Diagnostic AI](https://research.google/blog/amie-gains-vision-a-research-ai-agent-multi-modal-diagnostic-dialogue/) - Uncertainty-driven questioning
- [BC Campus: Recommendation Reports](https://pressbooks.bccampus.ca/technicalwriting/chapter/longreports/) - Technical writing structure
- [Atlassian: Project Trade-off Analysis](https://www.atlassian.com/team-playbook/plays/trade-offs) - Trade-off matrix methodology
- [UX Collective: The Agentic Era of UX](https://uxdesign.cc/the-agentic-era-of-ux-4b58634e410b) - Delegative UI patterns

### Tertiary (LOW confidence)
- [DEV Community: MCP and AI-Assisted Coding Predictions](https://dev.to/blackgirlbytes/my-predictions-for-mcp-and-ai-assisted-coding-in-2026-16bm) - Market direction
- [Addy Osmani: LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/) - Practitioner workflow patterns
- [Procreator: UX Tips for AI Agents](https://procreator.design/blog/best-ux-tips-when-designing-for-ai-agents/) - Role statement patterns

## Metadata

**Confidence breakdown:**
- Table stakes: HIGH - Based on established agentic UX patterns and Banneker's existing document pipeline
- Differentiators: MEDIUM - Some features require research-phase validation
- Anti-features: HIGH - Well-documented failure modes from ecosystem analysis
- Cliff detection: MEDIUM - Explicit signals well-defined; implicit signals need tuning
- Document specs: MEDIUM-HIGH - Based on ATAM and technical writing best practices

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - agentic UX patterns evolving rapidly)
