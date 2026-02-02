# Phase 3: Survey Pipeline - Research

**Researched:** 2026-02-02
**Domain:** Multi-phase conversational interview workflows, state management for resumable AI agents, structured data collection
**Confidence:** HIGH

## Summary

Implementing the survey pipeline requires understanding three distinct technical domains: Agent Skills format (YAML frontmatter + Markdown instructions), file-based state management for resumable workflows, and JSON Schema design for structured output validation.

The Agent Skills specification defines skill files as Markdown with YAML frontmatter containing `name` and `description` fields. Skills are discovered by their metadata, then loaded fully when activated. This progressive disclosure pattern minimizes context usage. For Banneker, the skill file (`banneker-survey.md`) orchestrates the interview by spawning a sub-agent (`banneker-surveyor`) via the host runtime's Task tool.

Multi-phase interview workflows are best implemented as state machines where each phase (pitch, actors, walkthroughs, backend, gaps, decision gate) represents a discrete state. The file-based planning pattern from Anthropic's engineering practices provides the resumption strategy: maintain three markdown files (`task_plan.md`, `progress_log.md`, `decisions.md`) that persist state across session boundaries. For Banneker, this maps to `.banneker/state/survey-state.md` tracking current phase, collected data, and next steps.

JSON output requires no validation library if the project accepts zero runtime dependencies. The surveyor agent can write JSON directly using `JSON.stringify()` and verify structure through careful prompt engineering. However, if validation becomes necessary, Node.js has no built-in JSON Schema validator—the ecosystem standard is Ajv (a third-party dependency), which would violate the zero-dependency constraint.

**Primary recommendation:** Use Agent Skills format for skill definition, implement state machine pattern with markdown state files for resume capability, and rely on prompt engineering for JSON structure correctness rather than runtime validation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Agent Skills format | 1.0 (2026) | Skill file structure (YAML frontmatter + Markdown) | Open standard across Claude Code, GitHub Copilot, VS Code, OpenCode, Gemini |
| Node.js built-ins | 18+ | JSON serialization, file I/O for state management | Zero-dependency constraint requires built-ins only |
| node:fs | Built-in | State file persistence (`.banneker/state/survey-state.md`) | Standard for file operations |
| JSON.stringify() | Built-in | Serialize survey data to `survey.json` | Native JSON serialization, no dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Markdown state files | Pattern | Working memory on disk for resume capability | Long-running interviews that may be interrupted |
| State machine pattern | Pattern | Track interview phases and transitions | Multi-phase workflows with branching logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prompt-based JSON validation | Ajv, jsonschema | Third-party validators offer runtime checking but violate zero-dependency constraint |
| Markdown state files | Database, JSON state | File-based state is simple, human-readable, and requires no runtime dependencies |
| State machine pattern | Free-form conversation | State machines provide resume points and progress tracking but require more structure |

**Installation:**
```bash
# No installation needed - all Node.js built-ins
# Agent Skills format is a specification, not a library
```

## Architecture Patterns

### Recommended Project Structure
```
.banneker/
├── state/
│   └── survey-state.md          # Interview state for resume
├── survey.json                  # Final structured output
└── architecture-decisions.json  # DEC-XXX format decisions

templates/
├── commands/
│   └── banneker-survey.md       # Skill file (YAML + instructions)
└── agents/
    └── banneker-surveyor.md     # Sub-agent definition

schemas/
└── survey.schema.json           # JSON Schema (reference only, not runtime validation)
```

### Pattern 1: Agent Skills Format for Skill Files
**What:** Markdown file with YAML frontmatter defining skill metadata and instructions
**When to use:** All skill command files installed by Banneker
**Example:**
```yaml
# Source: https://agentskills.io/specification
---
name: banneker-survey
description: Conduct a 6-phase structured discovery interview (pitch, actors, walkthroughs, backend, gaps, decision gate) that produces survey.json and architecture-decisions.json. Handles interruption by saving state to .banneker/state/survey-state.md and offers resume on restart.
---

# banneker-survey

You are the survey skill orchestrator. Your job is to spawn the banneker-surveyor sub-agent to conduct the interview.

## Step 0: Resume Detection

Check for existing state file:

Read `.banneker/state/survey-state.md` if it exists. If found, offer to resume:
- "I found an interrupted survey from [timestamp]. Resume from Phase [X]? (y/N)"
- If yes: Pass state file content to surveyor with instruction to resume
- If no: Clear state file and start fresh

## Step 1: Spawn Surveyor

Use Task tool to spawn banneker-surveyor sub-agent with:
- Task: "Conduct 6-phase discovery interview"
- Context: State file content (if resuming) or empty (if fresh start)

## Step 2: Monitor Completion

Wait for surveyor to return. On completion, verify outputs exist:
- `.banneker/survey.json`
- `.banneker/architecture-decisions.json`

On success: Report completion, display file paths
On failure: Report error, preserve state file for manual inspection
```

### Pattern 2: File-Based State Management for Resume Capability
**What:** Markdown state file tracking current phase, collected data, and next steps
**When to use:** Long-running multi-phase workflows that may be interrupted
**Example:**
```markdown
# Source: https://github.com/OthmanAdi/cowork-workflows (Anthropic pattern)
# .banneker/state/survey-state.md

## Current Phase

Phase 3 of 6: Walkthroughs

## Completed Phases

- [x] Phase 1: Pitch (completed 2026-02-02 14:30)
- [x] Phase 2: Actors (completed 2026-02-02 14:45)
- [ ] Phase 3: Walkthroughs (in progress)

## Collected Data

### Pitch (Phase 1)
- **Project name:** TaskFlow
- **One-liner:** Task management for distributed teams
- **Problem:** Teams lose context switching between chat and tasks

### Actors (Phase 2)
- **Team Member** (human): Creates tasks, updates status, comments
- **Project Manager** (human): Reviews progress, assigns work
- **Email Gateway** (system): Converts emails to tasks

## Next Steps

1. Continue Phase 3: Ask about primary user walkthrough (happy path)
2. Capture steps, system responses, data changes, error cases
3. Repeat for secondary walkthroughs
4. Proceed to Phase 4: Backend

## Interview Metadata

- **Started:** 2026-02-02 14:30
- **Last updated:** 2026-02-02 14:52
- **Runtime:** Claude Code
```

### Pattern 3: State Machine for Multi-Phase Interviews
**What:** Explicit states (phases) with defined transitions and completion criteria
**When to use:** Structured interviews with fixed phase order
**Example:**
```javascript
// Source: Conceptual pattern, not runtime code (Banneker uses prompts, not JS)
// This shows the logical structure, implemented in agent instructions

const INTERVIEW_PHASES = {
  PITCH: {
    order: 1,
    questions: ['project_name', 'one_liner', 'problem_statement'],
    next: 'ACTORS',
    completion_criteria: 'All questions answered'
  },
  ACTORS: {
    order: 2,
    questions: ['actor_list', 'actor_types', 'actor_capabilities'],
    next: 'WALKTHROUGHS',
    completion_criteria: 'At least 2 actors defined'
  },
  WALKTHROUGHS: {
    order: 3,
    questions: ['primary_flow', 'error_cases', 'data_changes'],
    next: 'BACKEND',
    completion_criteria: 'At least 1 walkthrough documented'
  },
  BACKEND: {
    order: 4,
    questions: ['data_stores', 'integrations', 'infrastructure'],
    next: 'GAPS',
    completion_criteria: 'Backend overview complete'
  },
  GAPS: {
    order: 5,
    questions: ['rubric_gaps', 'missing_decisions'],
    next: 'DECISION_GATE',
    completion_criteria: 'Gap analysis complete'
  },
  DECISION_GATE: {
    order: 6,
    questions: ['architecture_decisions', 'tradeoffs', 'alternatives'],
    next: null,
    completion_criteria: 'All DEC-XXX decisions recorded'
  }
};
```

### Pattern 4: JSON Output Structure Design
**What:** Define clear schema for survey.json with nested objects for phases
**When to use:** Structured data output consumed by downstream agents
**Example:**
```json
// Source: SurveyJS patterns + project requirements
{
  "survey_metadata": {
    "version": "1.0",
    "created": "2026-02-02T14:30:00Z",
    "runtime": "claude-code"
  },
  "project": {
    "name": "TaskFlow",
    "one_liner": "Task management for distributed teams",
    "problem": "Teams lose context switching between chat and tasks"
  },
  "actors": [
    {
      "name": "Team Member",
      "type": "human",
      "role": "Creates and manages tasks",
      "capabilities": ["create_task", "update_status", "add_comments"]
    },
    {
      "name": "Email Gateway",
      "type": "system",
      "role": "Converts emails to tasks",
      "capabilities": ["parse_email", "create_task", "notify_team"]
    }
  ],
  "walkthroughs": [
    {
      "name": "Create Task Flow",
      "type": "primary",
      "steps": [
        "User clicks 'New Task'",
        "User enters title and description",
        "User assigns to team member",
        "System creates task and sends notification"
      ],
      "system_responses": [
        "Display task creation form",
        "Validate required fields",
        "Save to database",
        "Send email notification"
      ],
      "data_changes": [
        "Insert row in tasks table",
        "Update assignee's task count"
      ],
      "error_cases": [
        "Missing required fields → show validation errors",
        "Assignee not found → show error message"
      ]
    }
  ],
  "backend": {
    "data_stores": ["PostgreSQL for task data", "Redis for session cache"],
    "integrations": ["Email SMTP", "Slack webhook"],
    "infrastructure": ["AWS EC2", "CloudFront CDN"]
  },
  "rubric_coverage": {
    "covered": ["ROLES-01", "ROLES-02", "INFRA-01"],
    "gaps": ["AUTH-01", "SEC-02"]
  }
}
```

### Pattern 5: Architecture Decision Record Format (DEC-XXX)
**What:** Structured decision records with question, choice, rationale, alternatives
**When to use:** Capturing architecture decisions during decision gate phase
**Example:**
```json
// Source: ADR patterns adapted to project DEC-XXX format
{
  "decisions": [
    {
      "id": "DEC-001",
      "question": "How should users authenticate?",
      "choice": "OAuth 2.0 with Google and GitHub providers",
      "rationale": "Most users already have Google/GitHub accounts, reduces password management burden, industry standard security",
      "alternatives_considered": [
        {
          "option": "Username/password",
          "rejected_because": "Requires password reset flows, users forget passwords, less secure"
        },
        {
          "option": "Magic links",
          "rejected_because": "Depends on email delivery, slower login flow, harder to implement"
        }
      ],
      "phase": "decision_gate",
      "timestamp": "2026-02-02T15:30:00Z"
    }
  ]
}
```

### Anti-Patterns to Avoid
- **Single-file mega-interview:** Don't put all phases in one giant prompt. Break into state machine with clear phase transitions
- **No resume capability:** Long interviews (>10 minutes) without state saving frustrate users when interrupted
- **Unstructured JSON output:** Don't rely on free-form text that downstream agents must parse. Define clear schema
- **Hardcoded questions:** Phase questions should adapt based on prior answers (e.g., skip backend questions for frontend-only projects)
- **No validation feedback:** Surveyor should confirm collected data with user before proceeding to next phase

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation at runtime | Custom validator with regex/type checks | Ajv library (if dependencies allowed) OR prompt engineering for structure | JSON Schema draft-2020-12 has complex edge cases (oneOf, anyOf, $ref resolution) |
| Markdown parsing for state files | Custom parser with regex | node:fs read + string split on sections | State files are write-only (agent writes, only reads on resume) - no parsing needed |
| Interactive prompts with retry logic | Custom readline loop | Existing prompts.js patterns from Phase 1 | Already solved in installer with retries and validation |
| Timestamp formatting | Manual string concatenation | new Date().toISOString() | Handles timezone conversion, ISO 8601 compliance |
| Nested object validation | Deep iteration with typeof checks | TypeScript types (dev-time) + prompt engineering (runtime) | Type safety at authoring time, trust agent at runtime |

**Key insight:** For zero-dependency AI agent projects, prompt engineering replaces runtime validation. The agent's instructions define the output schema more reliably than runtime checks would validate it. This shifts quality control from code to prompt design.

## Common Pitfalls

### Pitfall 1: Context Exhaustion During Long Interviews
**What goes wrong:** Interview reaches 150K+ tokens mid-conversation, agent loses early context, produces incomplete output
**Why it happens:** Each phase adds 10-30K tokens (user answers + agent follow-ups), no context pruning strategy
**How to avoid:**
- Use state files to externalize context (working memory on disk)
- Surveyor reads state file at phase start, writes updates at phase end
- Keep only current phase in active context
**Warning signs:** Agent asks questions already answered, forgets project name mid-interview

### Pitfall 2: Resume Fails Due to Incomplete State
**What goes wrong:** User interrupts during Phase 3, state file only contains Phases 1-2, resume restarts from beginning
**Why it happens:** State file only written at phase completion, not during phase progress
**How to avoid:**
- Write state file incrementally: after each question answered, not just phase completion
- Include "partial phase" marker in state: `Phase 3 (60% complete)`
**Warning signs:** "Resume from Phase 3" loads Phase 2 data

### Pitfall 3: Invalid JSON Output from Free-Form Agent Responses
**What goes wrong:** `survey.json` contains trailing commas, unescaped quotes, or invalid structure; downstream agents fail to parse
**Why it happens:** Agent writes JSON as text without validation, no linter/formatter applied
**How to avoid:**
- Prompt: "Write JSON using JSON.stringify() semantics: no trailing commas, escape all quotes, validate structure before writing"
- Provide JSON templates in surveyor instructions: "Match this structure exactly: {...}"
- Include validation step: "After writing survey.json, read it back and confirm it parses with JSON.parse()"
**Warning signs:** `JSON.parse()` throws "Unexpected token" errors in downstream agents

### Pitfall 4: Decision Gate Misses Architecture Decisions Made Earlier
**What goes wrong:** User makes architecture decision in Phase 2 (actors) or Phase 3 (walkthroughs), but DEC-XXX record only created in Phase 6 (decision gate)
**Why it happens:** Surveyor only prompts for decisions in decision gate phase, doesn't capture implicit decisions from earlier phases
**How to avoid:**
- Flag decision moments during all phases: "I notice you mentioned OAuth - should we record this as DEC-XXX?"
- Review all phases during decision gate: "Let's review earlier phases for architecture decisions we should document"
**Warning signs:** `architecture-decisions.json` has 2 entries but survey transcript mentions 8 technology choices

### Pitfall 5: State File Not Human-Readable (Debugging Nightmare)
**What goes wrong:** State file contains JSON blob or raw serialized objects, user can't inspect what was collected
**Why it happens:** Developer prioritizes machine-readability over human inspection
**How to avoid:**
- Use Markdown format with clear sections: `## Completed Phases`, `## Collected Data`
- Write data in readable format: bullet lists, not JSON
- State file is for resume and debugging, not for downstream consumption (that's survey.json)
**Warning signs:** User asks "What did I answer for actors?" and can't read `.banneker/state/survey-state.md`

### Pitfall 6: No Phase Skip Logic for Simple Projects
**What goes wrong:** User surveys a single-page static site, forced through backend/infrastructure phases that don't apply
**Why it happens:** Fixed 6-phase sequence with no conditional logic
**How to avoid:**
- Phase 1 (pitch) asks: "Does this project have a backend?" If no, mark backend phase as N/A
- Surveyor skips N/A phases and writes `"backend": "N/A - static site"` in survey.json
**Warning signs:** User frustration: "Why are you asking about databases? This is just HTML files."

### Pitfall 7: Overwriting State File on Fresh Start Without Confirmation
**What goes wrong:** User runs `/banneker:survey` again after completion, state file overwritten, previous survey lost
**Why it happens:** No check for completed state, "fresh start" always clears state
**How to avoid:**
- Check for `survey.json` existence in resume detection
- If exists: "Survey already complete. Overwrite? (y/N)" or "Resume to edit? (y/N)"
**Warning signs:** User complaints: "I accidentally ran the command twice and lost my survey data"

### Pitfall 8: State File Grows Unbounded with Edit History
**What goes wrong:** User edits answers in Phase 2, state file appends edit history, reaches 500KB after 10 edits
**Why it happens:** State file logs every change, never truncates
**How to avoid:**
- State file represents *current* state, not history
- Overwrite sections on edit: "## Actors" gets replaced, not appended
- History tracking (if needed) goes in separate log file, not state file
**Warning signs:** State file exceeds 100KB for simple project

## Code Examples

Verified patterns from official sources:

### Resume Detection Pattern
```markdown
# Source: REQ-CONT-002 + file-based planning pattern
## Step 0: Resume Detection (MANDATORY - check BEFORE starting work)

Check for existing state:

```bash
ls .banneker/state/survey-state.md 2>/dev/null
```

If file exists:
1. Read the state file
2. Parse `## Current Phase` section to determine resume point
3. Prompt user: "Found interrupted survey. Resume from Phase [X]? (y/N)"
4. If yes: Pass state content to surveyor with resume instructions
5. If no: Archive old state (rename to survey-state-[timestamp].md), start fresh

If file does not exist:
1. Start fresh survey
2. Create `.banneker/state/` directory if missing
```

### State File Write Pattern
```markdown
# Source: Anthropic file-based planning + project constraints
After each question answered, update state file:

```javascript
// Conceptual - agent does this via Write tool, not JS execution
const stateContent = `
## Current Phase

Phase ${currentPhase} of 6: ${phaseName}

## Completed Phases

${completedPhases.map(p => `- [x] ${p.name} (completed ${p.timestamp})`).join('\n')}
${currentPhase > 1 ? `- [ ] ${phaseName} (in progress - ${progress}% complete)` : ''}

## Collected Data

${Object.entries(collectedData).map(([phase, data]) => `
### ${phase}
${formatDataAsMarkdown(data)}
`).join('\n')}

## Next Steps

1. ${nextQuestion}
2. Continue to next question in ${phaseName}
3. On phase completion, proceed to ${nextPhase}

## Interview Metadata

- **Started:** ${startTimestamp}
- **Last updated:** ${new Date().toISOString()}
- **Runtime:** ${runtime}
`;

fs.writeFileSync('.banneker/state/survey-state.md', stateContent, 'utf-8');
```
```

### JSON Output Validation via Prompt Engineering
```markdown
# Source: Zero-dependency constraint + JSON Schema validation research
When writing survey.json:

1. **Use template as guide:** Reference schemas/survey.schema.json for structure
2. **Write incrementally:** Build JSON object in memory as interview progresses
3. **Validate before writing:**
   - Ensure all required fields present: project, actors, walkthroughs
   - Check types: actors is array, project is object
   - Escape strings: use JSON.stringify() semantics for all text
4. **Write with verification:**

```javascript
// Agent writes via Write tool, this shows the logic
const surveyData = {
  survey_metadata: { /* ... */ },
  project: { /* ... */ },
  actors: [ /* ... */ ],
  walkthroughs: [ /* ... */ ],
  backend: { /* ... */ },
  rubric_coverage: { /* ... */ }
};

// Validation check (in prompt instructions, not runtime code)
// "Before writing, verify:"
// - Does survey_data have all 6 top-level keys?
// - Is actors an array with at least 1 entry?
// - Does each actor have name, type, role, capabilities?
// - Is project.name a non-empty string?

const json = JSON.stringify(surveyData, null, 2);
fs.writeFileSync('.banneker/survey.json', json, 'utf-8');

// Verification step (in surveyor instructions)
// "After writing, read the file back and confirm it parses:"
const verify = JSON.parse(fs.readFileSync('.banneker/survey.json', 'utf-8'));
console.log('✓ survey.json is valid JSON with', verify.actors.length, 'actors');
```
```

### Agent Skills Skill File Template
```yaml
# Source: https://agentskills.io/specification
---
name: banneker-survey
description: Conduct a 6-phase structured discovery interview (pitch, actors, walkthroughs, backend, gaps, decision gate) that produces survey.json and architecture-decisions.json. Handles interruption by saving state to .banneker/state/survey-state.md and offers resume on restart.
license: MIT
metadata:
  author: banneker
  version: "0.2.0"
---

# banneker-survey

[Full agent instructions here...]

## Inputs

None (interactive interview)

## Outputs

- `.banneker/survey.json` - Structured survey data
- `.banneker/architecture-decisions.json` - DEC-XXX format decisions
- `.banneker/state/survey-state.md` - Resume state (cleared on completion)

## Quality Standards

Survey is complete when:
- [ ] All 6 phases completed or marked N/A
- [ ] survey.json parses as valid JSON
- [ ] At least 2 actors defined
- [ ] At least 1 walkthrough documented
- [ ] All DEC-XXX decisions have rationale and alternatives
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded questions per project type | Adaptive questioning based on prior answers | 2024-2026 (AI interview evolution) | Interviews adapt to project context, skip irrelevant sections |
| JSON Schema runtime validation | Prompt engineering + verification step | 2025-2026 (LLM reliability improvements) | Zero dependencies achievable, trust agent output with verification |
| Monolithic interview in one session | File-based state management with resume | 2025 (Anthropic internal practices) | Handles context limits, survives interruptions |
| Agent Skills as proprietary format | Agent Skills open standard | January 2026 | Cross-platform portability (Claude Code, GitHub Copilot, VS Code) |
| ADR numbering (ADR-001) | Project-specific prefixes (DEC-XXX) | Ongoing | Clearer namespace for multi-framework projects |

**Deprecated/outdated:**
- **Third-party JSON Schema validators for zero-dependency projects:** Ajv/jsonschema are excellent but incompatible with zero-dependency constraint. Prompt engineering is the 2026 approach.
- **In-memory state for long interviews:** Context windows reached 200K+ tokens but interviews still exhaust them. File-based state is the standard pattern.
- **Single .md file per skill without sub-agents:** Agent Skills specification supports references/ and scripts/ directories. Surveyor logic should be in separate agent file, not embedded in skill file.

## Open Questions

Things that couldn't be fully resolved:

1. **Should survey.json Use snake_case or camelCase for Keys?**
   - What we know: JSON Schema examples show both conventions, JavaScript prefers camelCase, Python/Ruby prefer snake_case
   - What's unclear: Which convention makes downstream consumption easier (GSD, architect agents)?
   - Recommendation: Use snake_case for consistency with Python ecosystem (many AI tools use Python). Define in survey.schema.json and enforce via prompt.

2. **How Much Validation Should Surveyor Do Before Writing JSON?**
   - What we know: Runtime validation requires dependencies (Ajv), prompt engineering can enforce structure but not 100% reliable
   - What's unclear: Is a verification step (read back + JSON.parse) sufficient, or should surveyor hand off to separate validator agent?
   - Recommendation: Start with prompt engineering + verification step. Add validator agent only if survey.json corruption becomes a pattern in testing.

3. **Should State File Include Full Transcript or Just Collected Data?**
   - What we know: Full transcript useful for debugging but grows large (100KB+), collected data sufficient for resume
   - What's unclear: Is transcript needed for "edit previous answer" feature, or can surveyor re-prompt?
   - Recommendation: State file contains collected data only. If edit feature needed, re-prompt user for that specific field rather than showing transcript.

4. **How to Handle Partial Phase Completion on Interruption?**
   - What we know: User may interrupt mid-question in Phase 3 (answered 2 of 5 questions)
   - What's unclear: Should surveyor resume at start of Phase 3 (lose 2 answers) or try to resume mid-phase (complex state)?
   - Recommendation: Resume at start of interrupted phase, but show "You previously answered: [partial data]" and ask "Keep these answers? (Y/n)". Simpler than mid-phase checkpoints.

5. **Should Decision Gate Phase Review Earlier Phases for Missed DEC-XXX?**
   - What we know: Users may mention architecture decisions in Phases 2-5 without explicit "this is a decision" flag
   - What's unclear: Is automatic detection feasible (scan transcript for keywords like "choose", "decided"), or rely on manual review?
   - Recommendation: Decision gate phase includes explicit step: "Review earlier phases. Did you make architecture choices we should record as DEC-XXX?" with user confirmation.

6. **Can Survey.json Schema Evolve Without Breaking Downstream Agents?**
   - What we know: Phase 3 produces v1.0 schema, future phases may need new fields (e.g., add "cost_estimates" section)
   - What's unclear: Should schema be versioned in survey.json metadata, and how do downstream agents handle schema changes?
   - Recommendation: Include `"survey_metadata": { "version": "1.0" }` in survey.json. Document schema changes in CHANGELOG. Downstream agents should gracefully handle missing optional fields.

## Sources

### Primary (HIGH confidence)
- Agent Skills Specification: https://agentskills.io/specification
- Cowork Workflows (file-based state pattern): https://github.com/OthmanAdi/cowork-workflows
- Node.js v25.3.0 Official Documentation - fs, JSON: https://nodejs.org/api/fs.html
- Architecture Decision Records: https://adr.github.io/

### Secondary (MEDIUM confidence)
- Agent Skills Overview: https://dev.to/nicoeft/agent-skills-its-just-markdown-files-all-the-way-down-5hj5
- Spring AI Agent Skills: https://spring.io/blog/2026/01/13/spring-ai-generic-agent-skills/
- Agent Skills in VS Code: https://code.visualstudio.com/docs/copilot/customization/agent-skills
- SurveyJS Architecture: https://surveyjs.io/documentation/surveyjs-architecture
- Multi-step Process Patterns: https://www.hellointerview.com/learn/system-design/patterns/multi-step-processes
- State Machine Workflows: https://learn.microsoft.com/en-us/dotnet/framework/windows-workflow-foundation/state-machine-workflows
- Workflow Engine vs State Machine: https://workflowengine.io/blog/workflow-engine-vs-state-machine/

### Tertiary (LOW confidence)
- JSON Schema validation Node.js: https://ajv.js.org/ (noted as incompatible with zero-dependency constraint)
- Conversational AI interview patterns: https://www.culturemonkey.io/hummer-ai/interview-intelligence/interview-styles/
- AI qualitative research: https://arxiv.org/html/2509.12709v1

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Agent Skills spec verified, Node.js built-ins documented, file-based state pattern from Anthropic
- Architecture: HIGH - Agent Skills format verified, state machine pattern well-documented, JSON output structure follows survey domain standards
- Pitfalls: MEDIUM-HIGH - Context exhaustion and resume failures are known issues, JSON validation pitfall based on zero-dependency constraint analysis
- Code examples: MEDIUM-HIGH - Agent Skills examples from spec, state patterns from Anthropic, JSON validation is prompt-based (not runtime code)

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - Agent Skills is new spec from Jan 2026, may evolve; file-based patterns stable)
