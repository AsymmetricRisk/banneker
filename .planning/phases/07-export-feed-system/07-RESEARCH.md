# Phase 7: Export & Feed System - Research

**Researched:** 2026-02-02
**Domain:** Document transformation, multi-format export pipelines, requirements traceability, context bundle generation
**Confidence:** HIGH

## Summary

Phase 7 requires building the export pipeline that transforms Banneker artifacts (survey data, generated documents, diagrams) into formats consumed by downstream frameworks. This is fundamentally a multi-format document transformation problem where a single source of truth (`.banneker/` directory) feeds multiple target formats with different structural requirements.

Research reveals that 2026 export pipeline architectures favor pattern-based transformation over template engines for structured document generation. The key insight is that export systems should act as adapters that understand both source structure and target schema, not generic converters. Google's multi-agent design patterns and modern data pipeline architectures emphasize the medallion pattern: Bronze (raw data), Silver (normalized/cleaned), Gold (curated for specific consumers). For Banneker, this maps to: survey.json/documents (Bronze), transformation logic (Silver), and format-specific exports (Gold).

For GSD format specifically, requirements traceability best practices in 2026 emphasize hierarchical REQ-ID formats with category prefixes (e.g., `REQ-INST-001`) and bidirectional traceability linking requirements to source data. Roadmap dependency ordering follows standard topological sort patterns where milestones are ordered by dependency edges, not arbitrary time markers. For context bundle generation, current best practices favor selective inclusion over complete dumps—providing focused, relevant content rather than overwhelming the LLM with every file. The consensus is that effective context bundles balance completeness with selectivity.

For platform prompt export (under 4,000 words), modern summarization techniques use map-reduce patterns where large document sets are chunked, individually summarized, then combined into a final compressed output. The iterative refinement approach evaluates content in pieces and a final step combines smaller summaries into a single cohesive document.

**Primary recommendation:** Implement an adapter-based export architecture where each format (GSD, platform prompt, generic summary, context bundle) has a dedicated export module that reads `.banneker/` artifacts and produces format-specific outputs following the medallion pattern: read source (Bronze), transform/normalize (Silver), write target (Gold). Use Node.js built-in filesystem operations for file concatenation and avoid third-party template engines—direct JavaScript string composition provides better control and zero dependencies.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` module | 18+ | File reading, writing, directory operations | Zero-dependency constraint requires built-ins; proven for file I/O |
| Node.js `path` module | 18+ | Path resolution and joining | Cross-platform path handling (POSIX and Windows) |
| JSON.parse/stringify | Native | Survey data parsing and potential manifest generation | Native JavaScript, no dependencies |
| Template literals | ES6+ | String composition for markdown generation | More maintainable than concatenation, native to JS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `stream` module | 18+ | Large file concatenation via pipelines | If context bundles exceed memory limits (unlikely for markdown) |
| Topological sort pattern | Pattern | Dependency-ordered roadmap milestone generation | GSD ROADMAP.md generation (REQ-EXPORT-006) |
| Map-reduce pattern | Pattern | Multi-document summarization under word limits | Platform prompt generation (REQ-EXPORT-002) |
| Adapter pattern | Pattern | Format-specific transformation modules | Isolate GSD/platform prompt/generic/context bundle logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct string composition | Template engine (EJS, Handlebars, Pug) | Template engines add dependencies and complexity; string literals with zero deps are simpler |
| Topological sort implementation | `npm` package like `toposort` | Built-in implementation maintains zero-dependency constraint |
| Custom word counter | Library like `word-count` | Trivial to implement with `split(/\s+/).length`; no need for dependency |
| File-by-file reads | Stream-based concatenation | Streams add complexity; markdown files are small enough for direct reads |

**Installation:**
```bash
# No installation needed - all Node.js built-ins
# Banneker already uses Node.js 18+ per package.json
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── exporters/
│   ├── gsd-exporter.js           # GSD format (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
│   ├── platform-prompt-exporter.js  # Dense summary under 4,000 words
│   ├── generic-summary-exporter.js  # Concatenated markdown
│   └── context-bundle-exporter.js   # Agent context optimized bundle

.banneker/
├── exports/
│   ├── platform-prompt.md        # REQ-EXPORT-002 output
│   ├── summary.md                # REQ-EXPORT-003 output
│   └── context-bundle.md         # REQ-EXPORT-004 output

.planning/
├── PROJECT.md                    # REQ-EXPORT-001 GSD format
├── REQUIREMENTS.md               # REQ-EXPORT-001 GSD format
└── ROADMAP.md                    # REQ-EXPORT-001 GSD format

templates/
├── commands/
│   └── banneker-feed.md          # Skill file orchestrating export
└── agents/
    └── banneker-exporter.md      # Sub-agent for export generation
```

### Pattern 1: Adapter-Based Export Architecture
**What:** Each format gets a dedicated exporter module implementing a standard interface
**When to use:** Multi-format export where each target has unique schema/structure requirements
**Example:**
```javascript
// Source: Data pipeline architecture patterns 2026
// https://dagster.io/guides/data-pipeline-architecture-5-design-patterns-with-examples

// lib/exporters/base-exporter.js
class BaseExporter {
  constructor(sourceDir = '.banneker') {
    this.sourceDir = sourceDir;
  }

  async readSurvey() {
    const surveyPath = path.join(this.sourceDir, 'survey.json');
    const content = await fs.readFile(surveyPath, 'utf8');
    return JSON.parse(content);
  }

  async readDocuments() {
    const docsDir = path.join(this.sourceDir, 'documents');
    const files = await fs.readdir(docsDir);
    const docs = {};
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await fs.readFile(path.join(docsDir, file), 'utf8');
      docs[file] = content;
    }
    return docs;
  }

  async export() {
    throw new Error('Subclass must implement export()');
  }
}

// lib/exporters/gsd-exporter.js
class GSDExporter extends BaseExporter {
  async export() {
    const survey = await this.readSurvey();
    const decisions = await this.readDecisions();

    await this.generateProjectMd(survey, decisions);
    await this.generateRequirementsMd(survey);
    await this.generateRoadmapMd(survey);
  }
}
```

### Pattern 2: REQ-ID Categorization and Traceability
**What:** Hierarchical requirement ID format with category prefixes and bidirectional traceability
**When to use:** GSD REQUIREMENTS.md generation (REQ-EXPORT-005)
**Example:**
```javascript
// Source: Requirements traceability best practices 2026
// https://www.testrail.com/blog/requirements-traceability-matrix/

function generateRequirementId(category, number) {
  return `REQ-${category.toUpperCase()}-${String(number).padStart(3, '0')}`;
}

function extractRequirementsFromSurvey(survey) {
  const requirements = [];

  // Installation requirements from project metadata
  requirements.push({
    id: generateRequirementId('INST', 1),
    priority: 'must',
    description: `Distribute as npm package installable via \`npx ${survey.project.name}\``,
    source: 'survey.project.distribution',
    category: 'Installation & Distribution'
  });

  // Functional requirements from walkthroughs
  survey.walkthroughs.forEach((walkthrough, idx) => {
    requirements.push({
      id: generateRequirementId('FUNC', idx + 1),
      priority: walkthrough.critical ? 'must' : 'should',
      description: walkthrough.name,
      source: `survey.walkthroughs[${idx}]`,
      category: 'Functional Requirements'
    });
  });

  return requirements;
}
```

### Pattern 3: Topological Sort for Dependency-Ordered Roadmaps
**What:** Order milestones/phases by dependency graph using topological sort
**When to use:** GSD ROADMAP.md generation (REQ-EXPORT-006)
**Example:**
```javascript
// Source: Roadmap dependency ordering best practices 2026
// https://www.aha.io/support/roadmaps/strategic-roadmaps/releases-and-schedules/release-dependencies

// Zero-dependency topological sort implementation
function topologicalSort(phases) {
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(phaseId) {
    if (visited.has(phaseId)) return;
    if (visiting.has(phaseId)) {
      throw new Error(`Circular dependency detected: ${phaseId}`);
    }

    visiting.add(phaseId);
    const phase = phases.find(p => p.id === phaseId);

    // Visit dependencies first
    if (phase.dependencies) {
      phase.dependencies.forEach(depId => visit(depId));
    }

    visiting.delete(phaseId);
    visited.add(phaseId);
    sorted.push(phase);
  }

  phases.forEach(phase => visit(phase.id));
  return sorted;
}

// Usage for GSD ROADMAP.md
async function generateRoadmapMd(survey) {
  const phases = extractPhasesFromSurvey(survey);
  const ordered = topologicalSort(phases);

  // Generate markdown with dependency-ordered phases
  let markdown = '# Roadmap\n\n';
  ordered.forEach((phase, idx) => {
    markdown += `## Phase ${idx + 1}: ${phase.name}\n\n`;
    markdown += `**Dependencies:** ${phase.dependencies.join(', ') || 'None'}\n\n`;
  });

  await fs.writeFile('.planning/ROADMAP.md', markdown, 'utf8');
}
```

### Pattern 4: Map-Reduce Document Summarization
**What:** Chunk large document sets, summarize individually, then combine into final output
**When to use:** Platform prompt generation under 4,000 word limit (REQ-EXPORT-002)
**Example:**
```javascript
// Source: Long document summarization techniques 2026
// https://cloud.google.com/blog/products/ai-machine-learning/long-document-summarization-with-workflows-and-gemini-models

async function generatePlatformPrompt(documents) {
  // Map phase: extract key points from each document
  const summaries = [];
  for (const [filename, content] of Object.entries(documents)) {
    summaries.push({
      filename,
      wordCount: content.split(/\s+/).length,
      keyPoints: extractKeyPoints(content)  // First 3 paragraphs or headings
    });
  }

  // Reduce phase: combine into single document under 4,000 words
  let output = '# Project Context\n\n';
  let currentWords = 0;
  const targetWords = 4000;

  for (const summary of summaries) {
    const section = formatSummarySection(summary);
    const sectionWords = section.split(/\s+/).length;

    if (currentWords + sectionWords > targetWords) {
      // Truncate to fit
      const allowedWords = targetWords - currentWords;
      const truncated = section.split(/\s+/).slice(0, allowedWords).join(' ');
      output += truncated + '...\n\n';
      break;
    }

    output += section;
    currentWords += sectionWords;
  }

  await fs.writeFile('.banneker/exports/platform-prompt.md', output, 'utf8');
}

function extractKeyPoints(content) {
  // Extract first 3 sections or up to first 500 words
  const sections = content.split(/\n##\s+/);
  return sections.slice(0, 3).join('\n## ');
}
```

### Pattern 5: Context Bundle Selective Inclusion
**What:** Concatenate source files with structured headers for LLM context loading
**When to use:** Context bundle generation (REQ-EXPORT-004)
**Example:**
```javascript
// Source: LLM context management best practices 2026
// https://addyosmani.com/blog/ai-coding-workflow/

async function generateContextBundle() {
  const bundle = [];

  // Header with metadata
  bundle.push('# Banneker Project Context Bundle');
  bundle.push(`Generated: ${new Date().toISOString()}\n`);
  bundle.push('---\n');

  // Survey data (structured)
  const survey = await readJson('.banneker/survey.json');
  bundle.push('## Survey Data\n');
  bundle.push('```json');
  bundle.push(JSON.stringify(survey, null, 2));
  bundle.push('```\n');

  // Generated documents (selective)
  const priorityDocs = [
    'TECHNICAL-SUMMARY.md',
    'STACK.md',
    'INFRASTRUCTURE-ARCHITECTURE.md'
  ];

  for (const docName of priorityDocs) {
    const docPath = `.banneker/documents/${docName}`;
    if (await fileExists(docPath)) {
      const content = await fs.readFile(docPath, 'utf8');
      bundle.push(`## Document: ${docName}\n`);
      bundle.push(content);
      bundle.push('\n---\n');
    }
  }

  // Write bundle
  const bundleContent = bundle.join('\n');
  await fs.writeFile('.banneker/exports/context-bundle.md', bundleContent, 'utf8');
}
```

### Pattern 6: File Concatenation Without Dependencies
**What:** Direct filesystem reads and string joining for markdown concatenation
**When to use:** Generic summary export (REQ-EXPORT-003)
**Example:**
```javascript
// Source: Node.js filesystem operations 2026
// https://nodejs.org/api/fs.html

async function generateGenericSummary() {
  const docsDir = '.banneker/documents';
  const files = await fs.readdir(docsDir);
  const mdFiles = files.filter(f => f.endsWith('.md')).sort();

  const sections = [];

  for (const file of mdFiles) {
    const filePath = path.join(docsDir, file);
    const content = await fs.readFile(filePath, 'utf8');

    sections.push(`<!-- Source: ${file} -->`);
    sections.push(content);
    sections.push('\n---\n');
  }

  const summary = sections.join('\n');
  await fs.writeFile('.banneker/exports/summary.md', summary, 'utf8');
}
```

### Anti-Patterns to Avoid

- **Template engine dependency:** Adding EJS/Handlebars/Pug violates zero-dependency constraint and adds unnecessary complexity for structured document generation
- **Lossy conversion:** Converting markdown → JSON → markdown loses formatting; keep markdown as source of truth
- **Hardcoded paths:** Use `path.join()` and configurable base directories for cross-platform compatibility
- **Monolithic exporter:** Single export function handling all formats creates tight coupling; use adapter pattern instead
- **Missing validation:** Export without validating source data existence leads to partial/broken outputs

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template engines | Custom string replacement system | Template literals with helper functions | Template literals are native, readable, maintainable; custom systems are bug-prone |
| Path manipulation | String concatenation with `/` | `path.join()` and `path.resolve()` | Cross-platform compatibility (Windows vs POSIX); handles edge cases |
| JSON parsing | Regex-based extraction | `JSON.parse()` | Native parser handles all edge cases (escaping, Unicode, nesting) |
| Word counting | Complex regex | `text.split(/\s+/).length` | Simple, accurate, no dependencies |
| File existence checks | Try/catch on readFile | `fs.access()` or check with `stat()` | Clearer intent, proper error handling |

**Key insight:** Node.js built-ins cover 100% of Phase 7 requirements. The temptation is to reach for npm packages, but this phase is purely filesystem + string manipulation, which are Node.js core strengths.

## Common Pitfalls

### Pitfall 1: Hardcoded Configuration in Export Logic
**What goes wrong:** Export paths, format settings, and category mappings are embedded directly in code, making changes require code edits
**Why it happens:** It's faster to hardcode during development than to externalize configuration
**How to avoid:** Define export configurations as constants or load from reference files. For GSD format, requirement categories should be derivable from survey structure, not hardcoded lists.
**Warning signs:** If adding a new requirement category requires editing multiple functions; if changing output paths means touching 5+ files
**Source:** [5 Critical ETL Pipeline Design Pitfalls to Avoid in 2026](https://airbyte.com/data-engineering-resources/etl-pipeline-pitfalls-to-avoid)

### Pitfall 2: Poor Error Handling (Missing Files)
**What goes wrong:** Export assumes all source files exist; missing documents cause cryptic errors or partial outputs
**Why it happens:** Happy-path development without testing error cases
**How to avoid:** Check file existence before reads. For optional documents (conditional generation), handle missing files gracefully. For required files (survey.json), fail fast with clear error messages.
**Warning signs:** Unhandled promise rejections; generic "ENOENT" errors without context; silent failures where some exports succeed but others don't
**Source:** [5 Critical ETL Pipeline Design Pitfalls to Avoid in 2026](https://airbyte.com/data-engineering-resources/etl-pipeline-pitfalls-to-avoid)

### Pitfall 3: Losing Traceability in Requirements Export
**What goes wrong:** Generated REQUIREMENTS.md has REQ-IDs but no links back to source survey data, breaking traceability
**Why it happens:** Focus on format output without considering downstream usage (verification, validation)
**How to avoid:** Include source references in REQUIREMENTS.md comments or metadata. Each REQ-ID should cite the survey field it derives from (e.g., `Source: survey.walkthroughs[2]`).
**Warning signs:** Stakeholders ask "where did REQ-FUNC-005 come from?"; requirements can't be traced to specific survey answers
**Source:** [Requirements Traceability Matrix (RTM): A How-To Guide](https://www.testrail.com/blog/requirements-traceability-matrix/)

### Pitfall 4: Context Bloat in Bundle Generation
**What goes wrong:** Context bundle includes every file, overwhelming LLM with irrelevant information
**Why it happens:** Assumption that "more context is better"
**How to avoid:** Selective inclusion based on priority. Core documents (TECHNICAL-SUMMARY, STACK, INFRASTRUCTURE-ARCHITECTURE) always included. Optional documents only if they exist and are relevant. Survey data in structured format, not raw JSON dump.
**Warning signs:** Context bundle exceeds 50KB; LLM responses become generic or miss key details; token limits exceeded
**Source:** [My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/)

### Pitfall 5: Monolithic Architecture (Single Export Function)
**What goes wrong:** One giant function handles GSD, platform prompt, generic summary, and context bundle; changes break multiple formats
**Why it happens:** Starting simple and never refactoring as complexity grows
**How to avoid:** Adapter pattern from the start. Each format is an independent module implementing a common interface. Shared logic (readSurvey, readDocuments) goes in base class or utilities.
**Warning signs:** Export function exceeds 200 lines; changing GSD format requires testing all other formats; copy-paste between format blocks
**Source:** [Data Pipeline Architecture Patterns](https://www.alation.com/blog/data-pipeline-architecture-patterns/)

### Pitfall 6: Word Count Strategy Fragility (Platform Prompt)
**What goes wrong:** Platform prompt export hard-truncates at 4,000 words mid-sentence or mid-section, producing broken output
**Why it happens:** Naive word counting without content-aware boundaries
**How to avoid:** Chunk by semantic boundaries (sections, paragraphs), not arbitrary word counts. If approaching limit, complete the current section or omit it entirely. Add "..." indicator if truncated.
**Warning signs:** Output ends mid-sentence; critical information cut off; downstream consumers complain about incomplete context
**Source:** [Summarizing Long Documents with LLMs](https://cookbook.openai.com/examples/summarizing_long_documents)

## Code Examples

Verified patterns from official sources and project requirements:

### GSD Requirements Generation with Traceability
```javascript
// Source: Phase 7 requirements REQ-EXPORT-005
// Requirement ID format: REQ-[CATEGORY]-[NUMBER]

import fs from 'fs/promises';
import path from 'path';

class GSDRequirementsGenerator {
  constructor(surveyData) {
    this.survey = surveyData;
    this.categories = {
      INST: 'Installation & Distribution',
      FUNC: 'Functional Requirements',
      DOCS: 'Document Generation',
      EXPORT: 'Export & Feed System',
      PERF: 'Performance',
      SEC: 'Security'
    };
  }

  generateId(category, number) {
    return `REQ-${category}-${String(number).padStart(3, '0')}`;
  }

  extractRequirements() {
    const requirements = [];
    let funcNum = 1;

    // Installation requirements
    requirements.push({
      id: this.generateId('INST', 1),
      priority: 'must',
      description: `Distribute as npm package installable via \`npx ${this.survey.project.name}\``,
      source: 'survey.project.name',
      category: 'INST'
    });

    // Functional requirements from walkthroughs
    this.survey.walkthroughs.forEach((walkthrough, idx) => {
      requirements.push({
        id: this.generateId('FUNC', funcNum++),
        priority: walkthrough.critical ? 'must' : 'should',
        description: walkthrough.description,
        source: `survey.walkthroughs[${idx}]`,
        category: 'FUNC'
      });
    });

    return requirements;
  }

  generateMarkdown() {
    const requirements = this.extractRequirements();
    const grouped = this.groupByCategory(requirements);

    let md = `# ${this.survey.project.name} — Requirements\n\n`;

    for (const [categoryCode, categoryName] of Object.entries(this.categories)) {
      const reqs = grouped[categoryCode] || [];
      if (reqs.length === 0) continue;

      md += `## ${categoryCode}: ${categoryName}\n\n`;

      reqs.forEach(req => {
        const status = req.completed ? '✓' : '';
        md += `- **${req.id}** (${req.priority}) ${status}: ${req.description}. Source: ${req.source}.\n`;
      });

      md += '\n';
    }

    return md;
  }

  groupByCategory(requirements) {
    return requirements.reduce((acc, req) => {
      if (!acc[req.category]) acc[req.category] = [];
      acc[req.category].push(req);
      return acc;
    }, {});
  }

  async write(outputPath = '.planning/REQUIREMENTS.md') {
    const markdown = this.generateMarkdown();
    await fs.writeFile(outputPath, markdown, 'utf8');
  }
}

// Usage
const survey = JSON.parse(await fs.readFile('.banneker/survey.json', 'utf8'));
const generator = new GSDRequirementsGenerator(survey);
await generator.write();
```

### Dependency-Ordered Roadmap Generation
```javascript
// Source: Phase 7 requirements REQ-EXPORT-006
// Topological sort for dependency ordering

class GSDRoadmapGenerator {
  constructor(phases) {
    this.phases = phases;
  }

  topologicalSort() {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (phaseId) => {
      if (visited.has(phaseId)) return;
      if (visiting.has(phaseId)) {
        throw new Error(`Circular dependency detected: ${phaseId}`);
      }

      visiting.add(phaseId);
      const phase = this.phases.find(p => p.id === phaseId);

      if (!phase) {
        throw new Error(`Phase not found: ${phaseId}`);
      }

      // Visit dependencies first (infrastructure before features)
      if (phase.dependencies && phase.dependencies.length > 0) {
        phase.dependencies.forEach(depId => visit(depId));
      }

      visiting.delete(phaseId);
      visited.add(phaseId);
      sorted.push(phase);
    };

    this.phases.forEach(phase => visit(phase.id));
    return sorted;
  }

  generateMarkdown() {
    const ordered = this.topologicalSort();

    let md = `# ${this.phases[0]?.projectName || 'Project'} — Roadmap\n\n`;
    md += `**Milestone:** v${this.phases[0]?.version || '1.0.0'}\n`;
    md += `**Phases:** ${ordered.length}\n\n`;

    ordered.forEach((phase, idx) => {
      md += `## Phase ${idx + 1}: ${phase.name}\n\n`;
      md += `**Goal:** ${phase.goal}\n\n`;

      if (phase.requirements && phase.requirements.length > 0) {
        md += `**Requirements:** ${phase.requirements.join(', ')}\n\n`;
      }

      md += `**Success Criteria:**\n`;
      phase.successCriteria.forEach((criterion, i) => {
        md += `${i + 1}. ${criterion}\n`;
      });
      md += '\n';

      md += `**Complexity:** ${phase.complexity}\n\n`;

      const deps = phase.dependencies && phase.dependencies.length > 0
        ? phase.dependencies.map(d => `Phase ${d}`).join(', ')
        : 'None';
      md += `**Dependencies:** ${deps}\n\n`;
      md += '---\n\n';
    });

    return md;
  }

  async write(outputPath = '.planning/ROADMAP.md') {
    const markdown = this.generateMarkdown();
    await fs.writeFile(outputPath, markdown, 'utf8');
  }
}
```

### Context Bundle with Selective Inclusion
```javascript
// Source: Phase 7 requirements REQ-EXPORT-004
// LLM-optimized context bundle generation

class ContextBundleGenerator {
  constructor(sourceDir = '.banneker') {
    this.sourceDir = sourceDir;
  }

  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async generate() {
    const bundle = [];

    // Header
    bundle.push('# Project Context Bundle');
    bundle.push(`Generated: ${new Date().toISOString()}`);
    bundle.push('');
    bundle.push('This bundle contains project planning artifacts for LLM agent consumption.');
    bundle.push('');
    bundle.push('---');
    bundle.push('');

    // Survey data (structured)
    const surveyPath = path.join(this.sourceDir, 'survey.json');
    if (await this.fileExists(surveyPath)) {
      const survey = JSON.parse(await fs.readFile(surveyPath, 'utf8'));
      bundle.push('## Survey Data');
      bundle.push('');
      bundle.push('```json');
      bundle.push(JSON.stringify(survey, null, 2));
      bundle.push('```');
      bundle.push('');
    }

    // Priority documents (always include if exist)
    const priorityDocs = [
      'TECHNICAL-SUMMARY.md',
      'STACK.md',
      'INFRASTRUCTURE-ARCHITECTURE.md'
    ];

    for (const docName of priorityDocs) {
      const docPath = path.join(this.sourceDir, 'documents', docName);
      if (await this.fileExists(docPath)) {
        const content = await fs.readFile(docPath, 'utf8');
        bundle.push(`## ${docName.replace('.md', '').replace(/-/g, ' ')}`);
        bundle.push('');
        bundle.push(content);
        bundle.push('');
        bundle.push('---');
        bundle.push('');
      }
    }

    // Optional documents (conditional based on existence)
    const optionalDocs = [
      'DEVELOPER-HANDBOOK.md',
      'TECHNICAL-DRAFT.md'
    ];

    for (const docName of optionalDocs) {
      const docPath = path.join(this.sourceDir, 'documents', docName);
      if (await this.fileExists(docPath)) {
        const content = await fs.readFile(docPath, 'utf8');
        bundle.push(`## ${docName.replace('.md', '').replace(/-/g, ' ')}`);
        bundle.push('');
        bundle.push(content);
        bundle.push('');
        bundle.push('---');
        bundle.push('');
      }
    }

    return bundle.join('\n');
  }

  async write(outputPath = '.banneker/exports/context-bundle.md') {
    const content = await this.generate();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content, 'utf8');
  }
}
```

### Platform Prompt with Word Limit
```javascript
// Source: Phase 7 requirements REQ-EXPORT-002
// Dense summary under 4,000 words using map-reduce pattern

class PlatformPromptGenerator {
  constructor(documents, targetWords = 4000) {
    this.documents = documents;
    this.targetWords = targetWords;
  }

  countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  extractSummary(content, maxWords) {
    // Extract first N sections or paragraphs up to maxWords
    const sections = content.split(/\n##\s+/);
    let summary = sections[0]; // Keep intro
    let currentWords = this.countWords(summary);

    for (let i = 1; i < sections.length && currentWords < maxWords; i++) {
      const section = '## ' + sections[i];
      const sectionWords = this.countWords(section);

      if (currentWords + sectionWords <= maxWords) {
        summary += '\n## ' + sections[i];
        currentWords += sectionWords;
      } else {
        // Partial section to fit limit
        const remaining = maxWords - currentWords;
        const words = section.split(/\s+/).slice(0, remaining).join(' ');
        summary += '\n' + words + '...';
        break;
      }
    }

    return summary;
  }

  generate() {
    const output = [];
    output.push('# Project Context (Platform Prompt)');
    output.push('');

    let currentWords = this.countWords(output.join('\n'));
    const wordsPerDoc = Math.floor((this.targetWords - currentWords) / Object.keys(this.documents).length);

    for (const [filename, content] of Object.entries(this.documents)) {
      const title = filename.replace('.md', '').replace(/-/g, ' ');
      output.push(`## ${title}`);
      output.push('');

      const summary = this.extractSummary(content, wordsPerDoc);
      output.push(summary);
      output.push('');

      currentWords = this.countWords(output.join('\n'));
      if (currentWords >= this.targetWords) break;
    }

    return output.join('\n');
  }

  async write(outputPath = '.banneker/exports/platform-prompt.md') {
    const content = this.generate();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content, 'utf8');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Template engines (EJS, Handlebars) | Template literals with helper functions | 2022-2024 ES6+ adoption | Zero dependencies, better IDE support, type safety with TypeScript |
| String concatenation for paths | `path.join()` and `path.resolve()` | Always best practice | Cross-platform compatibility, handles edge cases |
| Callbacks for async file I/O | `async/await` with `fs/promises` | Node.js 14+ (2020) | Cleaner code, better error handling, easier testing |
| Single monolithic export function | Adapter pattern with format-specific modules | 2025-2026 pipeline architecture evolution | Isolation, testability, maintainability |
| Complete data dumps for context | Selective inclusion based on relevance | 2025-2026 LLM context optimization | Better LLM performance, lower token costs, focused outputs |

**Deprecated/outdated:**
- **`fs` callbacks:** Use `fs/promises` instead for async/await patterns
- **npm packages for trivial tasks:** word-count, json-parse wrappers—native solutions are better
- **Hardcoded output paths:** Use configurable base directories and `path.join()`

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal context bundle size**
   - What we know: Selective inclusion beats complete dumps; current documents total ~10K words
   - What's unclear: Whether to include diagrams (HTML), decision log, or just markdown docs
   - Recommendation: Start with survey + 3 priority docs; add more based on feedback. Monitor token usage in downstream agents.

2. **Platform prompt word count enforcement**
   - What we know: 4,000 word target; map-reduce pattern for summarization
   - What's unclear: Whether to truncate at section boundaries or allow overflow if next section is critical
   - Recommendation: Hard cap at 4,000 words with section-aware truncation. Add metadata showing what was omitted.

3. **GSD format version compatibility**
   - What we know: Banneker's own .planning/ directory uses GSD-like format; no official GSD schema found
   - What's unclear: Whether GSD expects specific YAML frontmatter, metadata fields, or strict formatting
   - Recommendation: Match Banneker's own .planning/ files as reference implementation. Verify with actual GSD consumption if integration testing is possible.

## Sources

### Primary (HIGH confidence)
- [Node.js v25 File System Documentation](https://nodejs.org/api/fs.html) - Official Node.js fs module reference
- [Node.js v25 Path Module Documentation](https://nodejs.org/api/path.html) - Official path manipulation reference
- Banneker's own `.planning/` directory - Reference implementation of GSD format
- Phase 4 RESEARCH.md - Multi-agent architecture patterns established in document generation

### Secondary (MEDIUM confidence)
- [Data Pipeline Architecture: 5 Design Patterns](https://dagster.io/guides/data-pipeline-architecture-5-design-patterns-with-examples) - Medallion pattern, adapter architecture
- [Requirements Traceability Matrix (RTM): A How-To Guide](https://www.testrail.com/blog/requirements-traceability-matrix/) - REQ-ID format, traceability best practices
- [My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/) - Context bundle generation, selective inclusion strategies
- [Summarizing Long Documents | OpenAI Cookbook](https://cookbook.openai.com/examples/summarizing_long_documents) - Map-reduce summarization, word limit strategies
- [5 Critical ETL Pipeline Design Pitfalls to Avoid in 2026](https://airbyte.com/data-engineering-resources/etl-pipeline-pitfalls-to-avoid) - Error handling, hardcoded configuration pitfalls
- [Roadmap and Milestones | Aha.io](https://www.aha.io/support/roadmaps/strategic-roadmaps/releases-and-schedules/release-dependencies) - Dependency ordering best practices

### Tertiary (LOW confidence)
- [Why Markdown is the Secret Weapon for Document AI](https://medium.com/@hlcwang/why-markdown-is-the-secret-weapon-for-document-ai-b3fd517a101b) - Markdown as structured text for AI systems
- [GitHub: How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) - AGENTS.md standard for AI agent instructions
- [Data Pipeline Architecture Patterns](https://www.alation.com/blog/data-pipeline-architecture-patterns/) - General pipeline architecture patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All Node.js built-ins with official documentation; zero dependencies verified
- Architecture patterns: HIGH - Adapter pattern proven in Phase 4; topological sort is standard CS; map-reduce well-documented
- Pitfalls: MEDIUM - Derived from general pipeline best practices + project constraints; not phase-specific
- GSD format: MEDIUM - No official GSD schema found; using Banneker's .planning/ as reference implementation

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable domain with established patterns)
