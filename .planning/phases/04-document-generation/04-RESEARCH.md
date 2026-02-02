# Phase 4: Document Generation - Research

**Researched:** 2026-02-02
**Domain:** Multi-agent document generation from structured data, conditional template selection, LLM-based technical writing
**Confidence:** HIGH

## Summary

Phase 4 requires building the architect and writer agents that transform survey data into project-specific planning documents. This is fundamentally a multi-agent orchestration problem where an architect agent determines which documents to generate based on project type signals, and writer agents produce the actual content.

Research reveals that 2026 multi-agent architectures for document generation favor sequential pipeline and hierarchical decomposition patterns. Google's recent guide on multi-agent design patterns identifies sequential pipelines (Parser → Extractor → Summarizer) and generator-critic patterns as optimal for document workflows. The key insight for Banneker is that the architect agent acts as a dispatcher determining document set cardinality, while specialized writer agents handle content generation with built-in quality controls.

For preventing generic placeholder content, the research emphasizes planning-first approaches with explicit rules. Studies show that LLMs produce better output when given detailed specifications upfront rather than vague prompts. The strategy is: specification first, outline second, generation third, with validation checks preventing leftover template markers. For consistency across documents (technology names, actor names, entity names), the research points to ontology-driven validation where a shared term registry from survey.json serves as the source of truth.

Dependency ordering in document generation pipelines follows standard practices from data engineering: declarative dependency graphs with parallel execution where possible. For Banneker, this means TECHNICAL-SUMMARY and STACK must complete before TECHNICAL-DRAFT (which references the stack), and INFRASTRUCTURE-ARCHITECTURE before DEVELOPER-HANDBOOK (which references deployment topology). The architect agent needs a dependency resolver that sequences generation tasks correctly.

**Primary recommendation:** Implement a hierarchical multi-agent architecture where banneker-architect acts as planner/dispatcher (determines document set, sequences generation, validates outputs) and banneker-writer acts as specialized content generator (receives document type + survey data, produces project-specific markdown with zero placeholders, validates against term registry).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Agent Skills format | 1.0 (2026) | Skill and sub-agent definition (YAML frontmatter + Markdown) | Open standard across Claude Code, GitHub Copilot, OpenCode, Gemini |
| Node.js built-ins | 18+ | File I/O, JSON parsing for survey data consumption | Zero-dependency constraint requires built-ins only |
| Task tool | Host runtime API | Spawn sub-agents for parallel/sequential document generation | Native orchestration primitive in Claude Code/OpenCode/Gemini |
| Markdown | CommonMark | Document output format | Universal format, human-readable, consumable by downstream frameworks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Hierarchical decomposition pattern | Pattern | Architect delegates to writer agents, integrates results | Multi-document generation with dependencies |
| Sequential pipeline pattern | Pattern | Document A → Document B when B depends on A | Enforcing dependency order (STACK before TECHNICAL-DRAFT) |
| Generator-critic pattern | Pattern | Writer generates draft, validator checks for placeholders/consistency | Quality control for zero-placeholder requirement |
| Term registry validation | Pattern | Check entity names against survey.json source of truth | Ensure consistency across all documents |
| Dependency graph resolution | Pattern | Topological sort of documents by dependency edges | Determine correct generation order |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Multi-agent architecture | Single monolithic agent | Multi-agent allows parallelization and specialization but adds orchestration complexity |
| Hierarchical decomposition | Flat parallel generation | Hierarchy enables dependency ordering but requires coordination logic |
| File-based term registry | Runtime validation library | File-based is zero-dependency but requires manual checking |
| Prompt-based validation | Schema validation library | Prompt-based is zero-dependency but less reliable than runtime validation |

**Installation:**
```bash
# No installation needed - all Node.js built-ins and prompt engineering
# Agent Skills format is a specification, not a library
```

## Architecture Patterns

### Recommended Project Structure
```
.banneker/
├── survey.json                      # Input: survey data
├── architecture-decisions.json      # Input: decision log with DEC-XXX IDs
├── documents/
│   ├── TECHNICAL-SUMMARY.md         # Always generated (REQ-DOCS-001)
│   ├── STACK.md                     # Always generated (REQ-DOCS-001)
│   ├── INFRASTRUCTURE-ARCHITECTURE.md # Always generated (REQ-DOCS-001)
│   ├── TECHNICAL-DRAFT.md           # Conditional (REQ-DOCS-002)
│   ├── DEVELOPER-HANDBOOK.md        # Conditional (REQ-DOCS-002)
│   ├── DESIGN-SYSTEM.md             # Conditional (REQ-DOCS-002)
│   ├── PORTAL-INTEGRATION.md        # Conditional (REQ-DOCS-002)
│   ├── OPERATIONS-RUNBOOK.md        # Conditional (REQ-DOCS-002)
│   ├── LEGAL-PLAN.md                # Conditional (REQ-DOCS-002)
│   └── CONTENT-ARCHITECTURE.md      # Conditional (REQ-DOCS-002)
└── state/
    └── architect-state.md           # Generation state for resume capability

templates/
├── commands/
│   └── banneker-architect.md        # Skill file orchestrating document generation
├── agents/
│   ├── banneker-architect.md        # Sub-agent: determines document set, sequences generation
│   └── banneker-writer.md           # Sub-agent: generates individual documents
└── references/
    └── document-catalog.md          # Rules for conditional document selection
```

### Pattern 1: Hierarchical Multi-Agent Architecture for Document Generation
**What:** Architect agent plans and delegates, writer agents execute and report back
**When to use:** Multi-document generation with conditional selection and dependencies
**Example:**
```yaml
# Source: Google multi-agent design patterns 2026
# https://www.infoq.com/news/2026/01/multi-agent-design-patterns/

# banneker-architect agent (orchestrator)
---
name: banneker-architect
description: Determines which documents to generate based on project type, sequences generation by dependency order, spawns writer agents, validates outputs
---

# Architect Agent Workflow

## Step 1: Load Inputs
Read survey.json and architecture-decisions.json from .banneker/

## Step 2: Determine Document Set (REQ-DOCS-001, REQ-DOCS-002)
Always generate:
- TECHNICAL-SUMMARY.md
- STACK.md
- INFRASTRUCTURE-ARCHITECTURE.md

Conditionally generate based on survey signals:
- If backend exists: TECHNICAL-DRAFT.md
- If actors include "Developer" and backend exists: DEVELOPER-HANDBOOK.md
- If project.type includes "web" or "portal": DESIGN-SYSTEM.md
- If integrations array length > 0: PORTAL-INTEGRATION.md
- If backend.hosting exists: OPERATIONS-RUNBOOK.md
- If rubric_coverage includes LEGAL-* items: LEGAL-PLAN.md
- If walkthroughs include content-focused flows: CONTENT-ARCHITECTURE.md

## Step 3: Build Dependency Graph (REQ-DOCS-006)
Wave 1 (no dependencies):
- TECHNICAL-SUMMARY.md
- STACK.md

Wave 2 (depends on Wave 1):
- TECHNICAL-DRAFT.md (references STACK.md)

Wave 3 (depends on Wave 1):
- INFRASTRUCTURE-ARCHITECTURE.md

Wave 4 (depends on Wave 3):
- DEVELOPER-HANDBOOK.md (references INFRASTRUCTURE-ARCHITECTURE.md)

Wave 5 (no dependencies on prior waves):
- DESIGN-SYSTEM.md
- PORTAL-INTEGRATION.md
- OPERATIONS-RUNBOOK.md
- LEGAL-PLAN.md
- CONTENT-ARCHITECTURE.md

## Step 4: Execute Waves Sequentially
For each wave:
  For each document in wave (can run in parallel):
    Spawn banneker-writer agent via Task tool with:
      - document_type: "TECHNICAL-SUMMARY"
      - survey_data: (survey.json content)
      - decisions: (architecture-decisions.json content)
      - dependencies: [list of already-generated documents this one references]
    Wait for writer to return
    Validate output (see Pattern 3)

## Step 5: Report Results
List generated documents, report any validation failures
```

### Pattern 2: Conditional Document Selection via Signal Detection
**What:** Analyze survey.json structure to determine which conditional documents apply
**When to use:** REQ-DOCS-002 - generating only documents triggered by project type
**Example:**
```javascript
// Source: Research on conditional document generation 2026
// https://www.docupilot.com/blog/document-generation

// Signal detection logic (pseudocode for prompt engineering)
function determineDocumentSet(survey) {
  const docs = {
    always: ['TECHNICAL-SUMMARY', 'STACK', 'INFRASTRUCTURE-ARCHITECTURE'],
    conditional: []
  };

  // Backend signal
  if (survey.backend && survey.backend.data_stores && survey.backend.data_stores.length > 0) {
    docs.conditional.push('TECHNICAL-DRAFT');
  }

  // Developer actor + backend signal
  const hasDeveloperActor = survey.actors.some(a =>
    a.name.toLowerCase().includes('developer') ||
    a.capabilities.some(c => c.toLowerCase().includes('contribute'))
  );
  if (hasDeveloperActor && survey.backend) {
    docs.conditional.push('DEVELOPER-HANDBOOK');
  }

  // Web/portal signal
  if (survey.project.type && (
    survey.project.type.includes('web') ||
    survey.project.type.includes('portal') ||
    survey.project.type.includes('frontend')
  )) {
    docs.conditional.push('DESIGN-SYSTEM');
  }

  // Integration signal
  if (survey.backend && survey.backend.integrations && survey.backend.integrations.length > 0) {
    docs.conditional.push('PORTAL-INTEGRATION');
  }

  // Hosting signal
  if (survey.backend && survey.backend.hosting && survey.backend.hosting.platform) {
    docs.conditional.push('OPERATIONS-RUNBOOK');
  }

  // Legal coverage signal
  const hasLegalItems = survey.rubric_coverage.covered.some(item => item.startsWith('LEGAL-'));
  if (hasLegalItems) {
    docs.conditional.push('LEGAL-PLAN');
  }

  // Content-heavy signal
  const hasContentFlows = survey.walkthroughs.some(w =>
    w.name.toLowerCase().includes('content') ||
    w.name.toLowerCase().includes('publish') ||
    w.steps.some(s => s.toLowerCase().includes('create') || s.toLowerCase().includes('edit'))
  );
  if (hasContentFlows) {
    docs.conditional.push('CONTENT-ARCHITECTURE');
  }

  return [...docs.always, ...docs.conditional];
}
```

### Pattern 3: Generator-Critic Validation for Zero Placeholders
**What:** After generation, validate document for leftover template markers and consistency violations
**When to use:** REQ-DOCS-003 - ensuring zero generic placeholder content
**Example:**
```markdown
# Source: Research on preventing placeholder content in LLMs 2026
# https://addyo.substack.com/p/my-llm-coding-workflow-going-into

# Validation rules for banneker-writer output

## Placeholder Detection (REQ-DOCS-003)
Scan generated document for these patterns:
- `[TODO: ...]`
- `[PLACEHOLDER: ...]`
- `<!-- ... -->`
- `TBD`, `FIXME`, `XXX`
- Angle bracket variables not replaced: `<project_name>`, `<technology>`
- Generic examples: "e.g., React", "such as PostgreSQL" (should be specific to project)

If any found: REJECT document, report failures to architect

## Consistency Validation (REQ-DOCS-004)
Extract all technology names, actor names, entity names from generated document.
Compare against source of truth from survey.json:
- Technology names must match survey.backend.stack or decisions.choice fields
- Actor names must match survey.actors[].name exactly
- Entity names must match survey.backend.data_stores[].entities

If mismatches found: REJECT document, report inconsistencies

## Decision Citation Validation (REQ-DOCS-005)
Scan document for DEC-XXX references.
Verify each cited decision exists in architecture-decisions.json.
If references to non-existent decisions found: WARN (do not reject, but report)

## Template Marker Validation (REQ-DOCS-003)
Scan for leftover Banneker template instructions:
- `<!-- BANNEKER: ... -->`
- `{{variable}}`
- `{%if ...%}`, `{%for ...%}`

If any found: REJECT document, report failures
```

### Pattern 4: Term Registry for Cross-Document Consistency
**What:** Extract canonical names from survey.json and enforce usage across all documents
**When to use:** REQ-DOCS-004 - ensuring naming consistency
**Example:**
```javascript
// Source: Research on entity consistency in LLM outputs 2026
// https://arxiv.org/html/2502.15924v1 (Chain of Guidance)

// Build term registry from survey.json
function buildTermRegistry(survey, decisions) {
  return {
    projectName: survey.project.name,
    actors: survey.actors.map(a => a.name),
    technologies: [
      ...extractTechFromStack(survey.backend?.stack || []),
      ...decisions.decisions.map(d => d.choice).filter(c => isTechnologyName(c))
    ],
    entities: survey.backend?.data_stores.flatMap(ds => ds.entities || []) || [],
    integrations: survey.backend?.integrations.map(i => i.name) || []
  };
}

// Validation check in banneker-writer
function validateTermConsistency(document, registry) {
  const violations = [];

  // Check project name consistency
  const projectNameVariants = extractProjectReferences(document);
  projectNameVariants.forEach(variant => {
    if (variant !== registry.projectName) {
      violations.push({
        type: 'project_name_mismatch',
        found: variant,
        expected: registry.projectName
      });
    }
  });

  // Check actor name consistency
  const actorReferences = extractActorReferences(document);
  actorReferences.forEach(ref => {
    if (!registry.actors.includes(ref)) {
      violations.push({
        type: 'actor_name_mismatch',
        found: ref,
        expected: registry.actors
      });
    }
  });

  // Similar checks for technologies, entities, integrations

  return violations;
}
```

### Pattern 5: Dependency-Ordered Wave Execution
**What:** Topological sort of documents to determine generation order
**When to use:** REQ-DOCS-006 - ensuring dependency order is respected
**Example:**
```javascript
// Source: Research on pipeline dependency management 2026
// https://www.palantir.com/docs/foundry/building-pipelines/development-best-practices

// Define dependency graph
const dependencies = {
  'TECHNICAL-SUMMARY': [],  // No dependencies
  'STACK': [],              // No dependencies
  'TECHNICAL-DRAFT': ['STACK'],  // Depends on STACK
  'INFRASTRUCTURE-ARCHITECTURE': [],  // No dependencies (references survey data only)
  'DEVELOPER-HANDBOOK': ['INFRASTRUCTURE-ARCHITECTURE'],  // Depends on infrastructure
  'DESIGN-SYSTEM': [],      // No dependencies
  'PORTAL-INTEGRATION': [],  // No dependencies
  'OPERATIONS-RUNBOOK': [], // No dependencies
  'LEGAL-PLAN': [],         // No dependencies
  'CONTENT-ARCHITECTURE': [] // No dependencies
};

// Resolve into waves (levels of dependency graph)
function resolveWaves(docs, dependencies) {
  const waves = [];
  const completed = new Set();

  while (completed.size < docs.length) {
    const wave = docs.filter(doc => {
      // Include if not yet completed and all dependencies are completed
      if (completed.has(doc)) return false;
      const deps = dependencies[doc] || [];
      return deps.every(dep => completed.has(dep));
    });

    if (wave.length === 0) {
      throw new Error('Circular dependency detected');
    }

    waves.push(wave);
    wave.forEach(doc => completed.add(doc));
  }

  return waves;
}

// Example output:
// Wave 1: [TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE, DESIGN-SYSTEM, PORTAL-INTEGRATION, OPERATIONS-RUNBOOK, LEGAL-PLAN, CONTENT-ARCHITECTURE]
// Wave 2: [TECHNICAL-DRAFT]
// Wave 3: [DEVELOPER-HANDBOOK]
```

### Anti-Patterns to Avoid
- **Single monolithic agent for all documents:** Prevents parallelization, makes resume difficult, mixes concerns. Use hierarchical decomposition instead.
- **Generating documents in random order:** Violates REQ-DOCS-006. Use dependency graph resolution.
- **No validation step:** Results in placeholder content slipping through (violates REQ-DOCS-003). Use generator-critic pattern.
- **Hardcoded document selection:** Violates REQ-DOCS-002 conditional generation. Use signal detection based on survey data.
- **Repeating survey data in prompts:** Bloats context. Pass survey.json once, reference sections as needed.
- **Accepting first-draft output:** LLMs need explicit validation against requirements. Always validate.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting if a document is project-specific vs. generic | Custom string matching | Structured validation rules with explicit placeholder patterns | Edge cases: "React" could be project-specific or generic depending on context; validation rules handle this |
| Determining document generation order | Manual sequencing | Dependency graph with topological sort | Manual sequencing breaks when dependencies change; graph resolution handles circular dependencies and computes optimal waves |
| Managing generation state for resume | Custom state tracking | File-based state pattern from Phase 3 research | State tracking requires handling partial completion, errors, and restart - file-based state solves this |
| Validating entity name consistency | String matching | Term registry with canonical source of truth | String matching doesn't handle aliases, abbreviations, or case variations; term registry from survey.json is authoritative |
| Spawning parallel writer agents | Custom process management | Task tool from host runtime | Task tool handles agent lifecycle, error propagation, and completion signaling |

**Key insight:** Document generation is a data transformation pipeline (survey.json → markdown documents) with quality gates. The architecture patterns from data engineering apply: dependency graphs, validation checkpoints, idempotent operations, and state persistence for resume. Don't reinvent these - apply proven patterns from the domain.

## Common Pitfalls

### Pitfall 1: Generating Generic Placeholder Content
**What goes wrong:** Writer agent produces documents with leftover template markers like `[TODO: Add project name]` or generic examples like "e.g., React" instead of project-specific content.

**Why it happens:** LLMs default to generic output when not given specific context or when prompted with vague instructions. Template-based approaches often result in too many formatting errors and unfilled placeholders.

**How to avoid:**
1. Use planning-first approach: specification → outline → generation (not direct generation)
2. Include explicit validation rules in writer agent prompt: "If you are unsure about something or the survey context is missing, flag the section for review rather than inserting a placeholder"
3. Pass complete survey.json context to writer agent, not just summaries
4. Implement generator-critic validation pattern: after generation, scan for patterns like `[TODO`, `TBD`, `<variable>`, generic technology examples
5. Reject documents with any placeholders - no tolerance policy

**Warning signs:**
- Document contains square-bracket markers `[...]`
- Technology names are generic ("e.g., PostgreSQL") instead of specific ("PostgreSQL 15 via Supabase")
- Actor names don't match survey.json actor list exactly
- Sections have "TBD" or "Coming soon" language

### Pitfall 2: Inconsistent Naming Across Documents
**What goes wrong:** TECHNICAL-SUMMARY.md calls an actor "Developer", STACK.md calls it "Contributor", and DEVELOPER-HANDBOOK.md calls it "Engineer". Technology names vary: "Postgres" vs. "PostgreSQL" vs. "pg". Entity names differ: "User" vs. "user" vs. "Users".

**Why it happens:** Each writer agent generates independently without a shared term registry. LLMs use synonyms and aliases freely. No validation enforces consistency.

**How to avoid:**
1. Build term registry from survey.json before generating any documents
2. Include registry in every writer agent's context: "Use these exact names: Project='Banneker', Actors=['Developer', 'New User', ...], Technologies=['PostgreSQL', 'Node.js', ...]"
3. Implement consistency validation: extract all names from generated document, compare against registry, report mismatches
4. Make consistency violations a rejection criteria (not just warnings)

**Warning signs:**
- Same concept referred to with different names in different documents
- Mixed capitalization for same term ("user" vs. "User")
- Technology names don't match survey.backend.stack entries
- Actor references don't match survey.actors[].name

### Pitfall 3: Violating Dependency Order
**What goes wrong:** TECHNICAL-DRAFT.md is generated before STACK.md, but TECHNICAL-DRAFT references the stack. Result: TECHNICAL-DRAFT has incorrect or missing stack references.

**Why it happens:** No explicit dependency tracking. Documents generated in alphabetical order or random order rather than dependency order.

**How to avoid:**
1. Define dependency graph explicitly in architect agent
2. Use topological sort to compute wave order
3. Pass already-generated documents as context when generating dependent documents
4. Track completion state: mark documents as completed only after validation passes
5. If resume is needed, reload state and skip already-completed documents

**Warning signs:**
- Document A references content from Document B, but Document B was generated later
- Inconsistencies between documents that should match (stack list in TECHNICAL-DRAFT doesn't match STACK.md)
- Documents fail validation because referenced documents don't exist yet

### Pitfall 4: Missing Conditional Documents
**What goes wrong:** Project has backend with multiple integrations, but PORTAL-INTEGRATION.md is not generated. Or project type is "frontend-only" but TECHNICAL-DRAFT.md is generated anyway (wasted context).

**Why it happens:** Conditional generation logic is hardcoded or incomplete. Signal detection doesn't check all relevant survey fields.

**How to avoid:**
1. Enumerate all document types with explicit conditions in document-catalog.md reference file
2. Implement signal detection that checks multiple survey fields for each condition
3. Log which signals were detected and which documents were triggered
4. Include "why generated" metadata in architect state: "PORTAL-INTEGRATION: triggered by integrations.length=3"
5. Test with diverse survey.json fixtures: frontend-only, backend-only, full-stack, CLI tool, etc.

**Warning signs:**
- Generated document set doesn't match project type (e.g., OPERATIONS-RUNBOOK for a CLI tool with no hosting)
- Missing documents that should exist based on survey data (e.g., no DEVELOPER-HANDBOOK despite having Developer actor and GitHub repo)
- Unused conditionals in document-catalog.md that are never triggered

### Pitfall 5: Not Citing Decision IDs
**What goes wrong:** TECHNICAL-SUMMARY.md explains "we chose PostgreSQL for better JSON support" but doesn't cite the DEC-XXX ID. Result: no traceability to architecture-decisions.json.

**Why it happens:** Writer agent doesn't know to cite decisions, or decisions aren't passed in context.

**How to avoid:**
1. Pass architecture-decisions.json to writer agent along with survey.json
2. Include explicit instruction: "When mentioning an architectural choice, cite the decision ID in parentheses, e.g., 'PostgreSQL for JSON support (DEC-007)'"
3. Implement citation validation: scan generated document for decision references, verify each DEC-XXX exists in architecture-decisions.json
4. Report missing citations as warnings (not rejections, since not all content requires decision citations)

**Warning signs:**
- Technical choices mentioned without decision IDs
- Decision IDs appear but don't exist in architecture-decisions.json (typos: "DEC-7" instead of "DEC-007")
- Inconsistency between decision rationale in architecture-decisions.json and explanation in documents

## Code Examples

Verified patterns from official sources:

### Architect Agent Orchestration Pattern
```markdown
# Source: Google multi-agent design patterns (hierarchical decomposition)
# https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/

---
name: banneker-architect
description: Orchestrates document generation from survey data
---

# Banneker Architect Agent

You are the architect agent. You determine which documents to generate, sequence them by dependency order, and spawn writer agents to produce each document.

## Inputs
- .banneker/survey.json (project survey data)
- .banneker/architecture-decisions.json (decision log)

## Outputs
- .banneker/documents/*.md (generated planning documents)
- .banneker/state/architect-state.md (generation state for resume)

## Workflow

### Step 1: Load Inputs
Read survey.json and architecture-decisions.json.

### Step 2: Determine Document Set
Always generate (REQ-DOCS-001):
- TECHNICAL-SUMMARY.md
- STACK.md
- INFRASTRUCTURE-ARCHITECTURE.md

Apply conditional logic (REQ-DOCS-002):
```
IF survey.backend exists:
  → Generate TECHNICAL-DRAFT.md

IF survey.actors contains "Developer" AND survey.backend exists:
  → Generate DEVELOPER-HANDBOOK.md

IF survey.project.type includes "web" OR "portal":
  → Generate DESIGN-SYSTEM.md

IF survey.backend.integrations.length > 0:
  → Generate PORTAL-INTEGRATION.md

IF survey.backend.hosting exists:
  → Generate OPERATIONS-RUNBOOK.md

IF survey.rubric_coverage.covered includes LEGAL-* items:
  → Generate LEGAL-PLAN.md

IF survey.walkthroughs includes content-focused flows:
  → Generate CONTENT-ARCHITECTURE.md
```

### Step 3: Build Term Registry
Extract canonical names from survey.json for consistency validation:
```javascript
{
  projectName: survey.project.name,
  actors: survey.actors.map(a => a.name),
  technologies: [...],
  entities: [...]
}
```

### Step 4: Resolve Dependency Order
Compute generation waves:
- Wave 1 (parallel): TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE, [other no-dependency docs]
- Wave 2 (depends on Wave 1): TECHNICAL-DRAFT
- Wave 3 (depends on Wave 1): DEVELOPER-HANDBOOK

### Step 5: Execute Waves
For each wave:
  For each document in wave:
    Spawn banneker-writer agent via Task tool:
      - document_type: "TECHNICAL-SUMMARY"
      - survey_data: (survey.json)
      - decisions: (architecture-decisions.json)
      - term_registry: (canonical names)
      - dependencies: [list of already-generated documents]
    Wait for completion
    Validate output (check for placeholders, consistency, citations)
    If validation fails: reject, report errors, stop
    If validation passes: mark document complete, continue

### Step 6: Report Results
List all generated documents, report any failures, update state file.
```

### Writer Agent with Validation Pattern
```markdown
# Source: Research on LLM prompt engineering for document generation 2026
# https://platform.openai.com/docs/guides/prompt-engineering

---
name: banneker-writer
description: Generates individual planning documents from survey data with validation
---

# Banneker Writer Agent

You are a writer agent specialized in generating project-specific technical documentation.

## Inputs (passed by architect)
- document_type: Which document to generate (e.g., "TECHNICAL-SUMMARY")
- survey_data: Complete survey.json content
- decisions: Complete architecture-decisions.json content
- term_registry: Canonical names to use (project, actors, technologies, entities)
- dependencies: List of already-generated documents this one may reference

## Output
- Single markdown document at .banneker/documents/{document_type}.md

## Instructions

### Phase 1: Planning
Before writing, create an outline:
1. Review document type requirements (section structure for this document type)
2. Extract relevant data from survey_data
3. Identify which decisions from decisions to cite
4. Check dependencies for content to reference

### Phase 2: Generation
Write the document section by section:
- Use term_registry for ALL names (exact matches required)
- Cite decision IDs when mentioning architectural choices: (DEC-XXX)
- Reference dependencies by name: "see STACK.md for technology details"
- Be project-specific: use actual technology names from survey, not generic examples
- NO placeholders: if information is missing from survey, state it explicitly rather than inserting [TODO]

### Phase 3: Validation
Before returning, validate your output:

Check for placeholders (REQ-DOCS-003):
- Scan for: [TODO], [PLACEHOLDER], TBD, FIXME, XXX, <variable>
- Scan for: <!-- BANNEKER: ... -->, {{...}}, {%...%}
- If found: REJECT document, report specific violations

Check for consistency (REQ-DOCS-004):
- Extract all project name mentions → must match term_registry.projectName exactly
- Extract all actor names → must match term_registry.actors exactly
- Extract all technology names → must match term_registry.technologies
- Extract all entity names → must match term_registry.entities
- If mismatches found: REJECT document, report violations

Check for decision citations (REQ-DOCS-005):
- Extract all DEC-XXX references
- Verify each exists in decisions
- If non-existent references found: WARN (do not reject)

### Phase 4: Return
Write validated document to .banneker/documents/{document_type}.md.
Report validation results to architect.
```

### Conditional Document Selection Logic
```javascript
// Source: Research on conditional document generation 2026
// https://www.docupilot.com/blog/document-generation

// This is pseudocode showing the logic for architect agent prompt engineering

function determineDocumentSet(survey) {
  const docs = {
    always: [
      'TECHNICAL-SUMMARY',
      'STACK',
      'INFRASTRUCTURE-ARCHITECTURE'
    ],
    conditional: []
  };

  // Backend existence check
  if (survey.backend &&
      survey.backend.data_stores &&
      survey.backend.data_stores.length > 0) {
    docs.conditional.push('TECHNICAL-DRAFT');
  }

  // Developer actor + backend check
  const hasDeveloperActor = survey.actors.some(actor => {
    const nameLower = actor.name.toLowerCase();
    const hasDevCapability = actor.capabilities.some(cap =>
      cap.toLowerCase().includes('contribute') ||
      cap.toLowerCase().includes('develop') ||
      cap.toLowerCase().includes('code')
    );
    return nameLower.includes('developer') ||
           nameLower.includes('contributor') ||
           hasDevCapability;
  });

  if (hasDeveloperActor && survey.backend) {
    docs.conditional.push('DEVELOPER-HANDBOOK');
  }

  // Web/portal project type check
  const typeLower = (survey.project.type || '').toLowerCase();
  const isWeb = typeLower.includes('web') ||
                typeLower.includes('portal') ||
                typeLower.includes('frontend') ||
                survey.walkthroughs.some(w =>
                  w.name.toLowerCase().includes('ui') ||
                  w.name.toLowerCase().includes('portal')
                );

  if (isWeb) {
    docs.conditional.push('DESIGN-SYSTEM');
  }

  // Integration existence check
  if (survey.backend &&
      survey.backend.integrations &&
      survey.backend.integrations.length > 0) {
    docs.conditional.push('PORTAL-INTEGRATION');
  }

  // Hosting/infrastructure check
  if (survey.backend &&
      survey.backend.hosting &&
      survey.backend.hosting.platform) {
    docs.conditional.push('OPERATIONS-RUNBOOK');
  }

  // Legal rubric coverage check
  const hasLegalCoverage = survey.rubric_coverage.covered.some(item =>
    item.startsWith('LEGAL-')
  );

  if (hasLegalCoverage) {
    docs.conditional.push('LEGAL-PLAN');
  }

  // Content-heavy workflow check
  const hasContentFlows = survey.walkthroughs.some(walkthrough => {
    const nameLower = walkthrough.name.toLowerCase();
    const hasContentSteps = walkthrough.steps.some(step => {
      const stepLower = step.toLowerCase();
      return stepLower.includes('create') ||
             stepLower.includes('edit') ||
             stepLower.includes('publish') ||
             stepLower.includes('content');
    });
    return nameLower.includes('content') ||
           nameLower.includes('publish') ||
           hasContentSteps;
  });

  if (hasContentFlows) {
    docs.conditional.push('CONTENT-ARCHITECTURE');
  }

  return {
    always: docs.always,
    conditional: docs.conditional,
    all: [...docs.always, ...docs.conditional]
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-agent document generation | Multi-agent hierarchical architecture (planner + specialists) | 2025-2026 | Enables parallelization, specialization, and quality gates. Google's 8 patterns study published Jan 2026 |
| Template filling with string replacement | LLM-based generation with validation | 2024-2025 | More flexible content but requires explicit validation rules to prevent placeholders |
| Manual dependency tracking | Dependency graph with topological sort | Established pattern from data engineering | Automatic wave computation, handles circular dependency detection |
| Generic validation checks | Domain-specific validation rules (placeholder patterns, term registries) | 2025-2026 | Higher quality, project-specific output with zero tolerance for placeholders |
| Sequential execution only | Wave-based parallel execution within dependency constraints | 2025-2026 | Faster generation for independent documents while respecting dependencies |

**Deprecated/outdated:**
- **Template string replacement:** Replaced by LLM generation with validation. String replacement is brittle and can't handle narrative content.
- **Single monolithic generation prompt:** Replaced by hierarchical multi-agent architecture. Monolithic prompts exceed context limits and mix concerns.
- **No validation step:** Replaced by generator-critic pattern. LLM outputs must be validated before acceptance.

## Open Questions

Things that couldn't be fully resolved:

1. **What is the optimal wave parallelization strategy?**
   - What we know: Documents with no dependencies can be generated in parallel within a wave
   - What's unclear: What is the optimal number of parallel writer agents? Does spawning 7 agents in Wave 1 exceed context budget? Should we batch to 3 at a time?
   - Recommendation: Start with full parallelization (all docs in wave simultaneously), monitor context usage, implement batching if needed

2. **How should we handle validation failures mid-wave?**
   - What we know: If a document fails validation, architect should reject it and report errors
   - What's unclear: Should architect retry generation with corrected prompt? Should architect stop all generation and report failure? Should architect continue with other documents and report partial completion?
   - Recommendation: Stop on first failure, report error details, preserve state for resume. Rationale: cascading errors likely if one document fails (indicates survey data issue)

3. **What level of detail is required in document-catalog.md reference file?**
   - What we know: document-catalog.md should define conditional generation rules, document structure, and quality standards
   - What's unclear: Should it include full section-by-section templates? Should it include example content? How much should be in the reference file vs. in agent prompts?
   - Recommendation: Include document structure (section titles), conditional rules (if/then logic), quality standards (no placeholders, cite decisions). Do NOT include full templates (too rigid). Let writer agent determine narrative style based on survey data.

4. **Should term registry validation be warnings or rejections?**
   - What we know: Consistency is required per REQ-DOCS-004
   - What's unclear: Should a single term mismatch reject the entire document? What about legitimate aliases (e.g., "PostgreSQL" vs. "Postgres")?
   - Recommendation: Reject on exact name mismatches for actors (since survey.json is authoritative). Warn on technology name variations (allow common abbreviations). Build an alias map if needed.

## Sources

### Primary (HIGH confidence)
- [Google's Eight Essential Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/) - InfoQ 2026
- [Developer's guide to multi-agent patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/) - Google Developers Blog 2026
- [Prompt Engineering | OpenAI API](https://platform.openai.com/docs/guides/prompt-engineering) - OpenAI official docs
- [My LLM coding workflow going into 2026](https://addyo.substack.com/p/my-llm-coding-workflow-going-into) - Addy Osmani 2026

### Secondary (MEDIUM confidence)
- [LLM Based Multi-Agent Generation of Semi-structured Documents](https://arxiv.org/html/2402.14871v1) - ArXiv 2024
- [Improving Consistency in Large Language Models through Chain of Guidance](https://arxiv.org/html/2502.15924v1) - ArXiv 2025
- [What Is Document Generation? Complete Guide 2026](https://www.docupilot.com/blog/document-generation) - Docupilot
- [Techniques for Managing Dependency Between Data Pipelines](https://alirezasadeghi1.medium.com/techniques-for-managing-dependency-between-data-pipelines-a2f18d28757) - Medium 2025
- [Building pipelines - Best practices](https://www.palantir.com/docs/foundry/building-pipelines/development-best-practices) - Palantir Foundry docs
- [6 Technical Documentation Trends to Watch in 2026](https://www.fluidtopics.com/blog/industry-insights/technical-documentation-trends-2026/) - Fluid Topics 2026

### Tertiary (LOW confidence)
- [Markdown vs. HTML for LLM Context: Optimizing Performance & Cost](https://www.searchcans.com/blog/markdown-vs-html-llm-context-optimization-2026/) - SearchCans 2026 (claims from single source, not verified)
- [Rise of the Markdown Agent](https://medium.com/@mrsirsh/rise-of-the-markdown-agent-89b20d61c704) - Medium 2024 (conceptual, not empirical)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Agent Skills format verified from Phase 3 research, multi-agent patterns verified from Google/Anthropic sources
- Architecture: HIGH - Hierarchical decomposition and sequential pipeline patterns are established, validated by multiple sources
- Pitfalls: HIGH - Placeholder detection and consistency validation patterns verified from prompt engineering research, dependency ordering verified from data pipeline best practices

**Research date:** 2026-02-02
**Valid until:** 30 days (2026-03-04) - multi-agent patterns are stable, but LLM prompt engineering techniques evolve rapidly
