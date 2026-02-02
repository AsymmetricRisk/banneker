# Phase 6: HTML Appendix - Research

**Researched:** 2026-02-02
**Domain:** Markdown-to-HTML compilation, self-contained HTML page generation, document aggregation into static reference manual
**Confidence:** HIGH

## Summary

Phase 6 requires compiling all planning documents and architecture diagrams into a self-contained, dark-themed HTML appendix with an index page and individual section pages. This is fundamentally a document aggregation and transformation problem where markdown files and HTML diagrams are compiled into a cohesive, navigable reference manual that can be viewed in a browser, printed, or shared as standalone files.

Research reveals that the appendix already exists in prototype form at `.banneker/appendix/` with 6 HTML pages (index.html + 5 section pages) and shared.css. The pages follow a consistent structure: appendix-nav breadcrumb bar, header with project metadata, content sections using utility cards and callouts, and a footer. The existing implementation demonstrates the target pattern: external CSS linking to shared.css, semantic HTML with dark-theme design tokens, and responsive layouts using CSS Grid.

The core technical challenge is markdown-to-HTML conversion. The standard approach in 2026 uses dedicated parsing libraries like marked.js (high-speed parser), markdown-it (feature-rich with plugins), or showdown (bidirectional conversion). All three are zero-config, support CommonMark, and integrate seamlessly with Node.js. For Banneker's zero-dependency constraint, this means the markdown parser becomes the ONE external dependency for Phase 6 (justified by the complexity of markdown parsing and the risk of hand-rolling a parser).

For partial appendix generation when documents are missing (REQ-APPENDIX-003), the research points to graceful degradation patterns from REST APIs and GraphQL: detect missing inputs, generate available pages only, report partial completion status, and provide clear error messages for missing content. The banneker-publisher agent should check which documents exist in `.banneker/documents/` and which diagrams exist in `.banneker/diagrams/`, then generate only the section pages for available content while always generating index.html (even if it links to fewer sections).

**Primary recommendation:** Implement banneker-publisher agent that uses marked.js for markdown-to-HTML conversion, reads all documents from `.banneker/documents/` and diagrams from `.banneker/diagrams/`, generates individual section pages by wrapping converted HTML in the appendix page template (with shared.css reference), produces index.html with navigation grid linking to available pages, and handles missing content gracefully by generating partial appendix with clear status reporting.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| marked.js | 12.x (2026) | Markdown-to-HTML parser and compiler | Built for speed, supports CommonMark, low-level API, works in Node.js and browser, active maintenance |
| Node.js built-ins | 18+ | File I/O, path manipulation, JSON parsing | Zero-dependency constraint requires built-ins for file operations |
| CSS Grid with grid-template-areas | CSS3 (2026) | Page layout structure (shared.css already uses this) | Semantic, responsive, established pattern from Phase 5 |
| Template literals | ES6 | HTML page generation from markdown + metadata | Native string templating, no external library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| markdown-it | 14.x | Alternative markdown parser with plugin ecosystem | If extensibility is needed (syntax highlighting, footnotes, custom containers) |
| showdown | 2.x | Bidirectional markdown converter | If HTML-to-markdown conversion is needed in future (not current requirement) |
| CSS Custom Properties | CSS3 | Design system tokens (already defined in shared.css) | Reuse existing dark-theme palette across all pages |
| Accordion pattern | Pattern (already in shared.css) | Expandable document sections (planning-library.html pattern) | Display long markdown content in collapsible sections |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| marked.js | Hand-rolled markdown parser | Hand-rolled parser violates "don't hand-roll" principle; markdown has edge cases (nested lists, code blocks, escaping) that take months to handle correctly |
| Template literals | Template engine (Handlebars, EJS) | Template engines are dependencies; template literals are native ES6 and sufficient for simple page generation |
| External CSS link | Inline all CSS in each page | External CSS link is acceptable per REQ-APPENDIX-001 ("self-contained with shared CSS"), inlining would duplicate 16KB in every page |
| Static section structure | Dynamic page detection | Static structure is simpler and matches existing prototype; dynamic detection adds complexity for little benefit |

**Installation:**
```bash
npm install marked
# marked.js is the ONLY external dependency for Phase 6
# (justified by markdown parsing complexity)
```

## Architecture Patterns

### Recommended Project Structure
```
.banneker/
├── survey.json                      # Input: project metadata
├── documents/
│   ├── TECHNICAL-SUMMARY.md         # Input: markdown documents (4 files)
│   ├── STACK.md
│   ├── INFRASTRUCTURE-ARCHITECTURE.md
│   └── DEVELOPER-HANDBOOK.md
├── diagrams/
│   ├── executive-roadmap.html       # Input: self-contained diagrams (4 files)
│   ├── decision-map.html
│   ├── system-map.html
│   └── architecture-wiring.html
└── appendix/
    ├── shared.css                   # Design system (already exists)
    ├── index.html                   # Landing page with nav grid (generated)
    ├── overview.html                # Section: Executive overview (generated)
    ├── requirements.html            # Section: Requirements matrix (generated)
    ├── infrastructure.html          # Section: Infrastructure (generated)
    ├── security-legal.html          # Section: Security & legal (generated)
    └── planning-library.html        # Section: Full document text (generated)

templates/
├── commands/
│   └── banneker-appendix.md         # Skill file for /banneker:appendix command
└── agents/
    └── banneker-publisher.md        # Sub-agent: compiles appendix pages
```

### Pattern 1: Markdown-to-HTML Conversion with marked.js
**What:** Parse markdown files and convert to HTML with marked.js parser
**When to use:** All document content transformation (TECHNICAL-SUMMARY.md → HTML, etc.)
**Example:**
```javascript
// Source: marked.js official documentation 2026
// https://marked.js.org/

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

// Configure marked for safe, consistent output
marked.setOptions({
  gfm: true,              // GitHub Flavored Markdown
  breaks: false,          // Don't convert \n to <br>
  headerIds: true,        // Generate IDs for headers (for anchor links)
  mangle: false,          // Don't escape email addresses
  sanitize: false,        // Don't sanitize HTML (trust our own markdown)
});

// Convert a markdown document to HTML
function convertMarkdownToHtml(markdownPath) {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const html = marked.parse(markdown);
  return html;
}

// Example: Convert TECHNICAL-SUMMARY.md
const summaryHtml = convertMarkdownToHtml('.banneker/documents/TECHNICAL-SUMMARY.md');

// Result: Clean HTML with semantic tags
// # Heading → <h1>Heading</h1>
// **bold** → <strong>bold</strong>
// - list item → <ul><li>list item</li></ul>
// ```code``` → <pre><code>code</code></pre>
```

### Pattern 2: Appendix Page Template with Shared CSS
**What:** Wrap converted markdown HTML in consistent page structure with navigation
**When to use:** All section pages (overview.html, requirements.html, etc.)
**Example:**
```javascript
// Source: Existing appendix prototype pattern analysis
// .banneker/appendix/overview.html structure

function generateAppendixPage(options) {
  const {
    title,              // "Executive Overview"
    subtitle,           // "Architecture, services, and data layer"
    contentHtml,        // Converted markdown HTML
    projectName,        // "Banneker" from survey.json
    version,            // "v0.2.0"
    prevPage,           // { title: "Index", href: "index.html" }
    nextPage,           // { title: "Requirements", href: "requirements.html" }
    currentPage,        // "overview" (for nav highlighting)
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} -- ${projectName} Engineering Appendix</title>
  <link rel="stylesheet" href="shared.css">
</head>
<body>

<nav class="appendix-nav">
  <div class="breadcrumb">
    <a href="index.html">Appendix</a>
    <span class="sep">/</span>
    <span class="current">${title}</span>
  </div>
  <div class="nav-arrows">
    ${prevPage ? `<a href="${prevPage.href}">Prev: ${prevPage.title}</a>` : ''}
    ${nextPage ? `<a href="${nextPage.href}">Next: ${nextPage.title}</a>` : ''}
  </div>
</nav>

<div class="page">

  <div class="header">
    <h1><span>${title}</span></h1>
    <p class="subtitle">${subtitle}</p>
    <div class="meta">
      <span>${version}</span>
      <span>February 2026</span>
      <span>CLI Tool</span>
    </div>
    <div class="nav-links">
      <a href="index.html">Index</a>
      <a href="overview.html">Overview</a>
      <a href="requirements.html">Requirements</a>
      <a href="infrastructure.html">Infrastructure</a>
      <a href="security-legal.html">Security &amp; Legal</a>
      <a href="planning-library.html">Planning Library</a>
    </div>
  </div>

  ${contentHtml}

  <div class="footer">
    <p>${projectName} Engineering Appendix &middot; ${version} &middot; February 2026</p>
    <p>Generated by <a href="https://github.com/anthropics/banneker">banneker-publisher</a></p>
  </div>

</div>
</body>
</html>`;
}
```

### Pattern 3: Index Page with Navigation Grid
**What:** Landing page with card-based navigation to all section pages
**When to use:** index.html generation - always generated even if sections are missing
**Example:**
```javascript
// Source: Existing index.html pattern analysis
// .banneker/appendix/index.html structure

function generateIndexPage(options) {
  const {
    projectName,        // "Banneker"
    pitch,              // Project pitch from survey.json
    version,            // "v0.2.0"
    pageCount,          // 6 (total section pages available)
    sections,           // Array of available section metadata
  } = options;

  const sectionCards = sections.map((section, idx) => `
    <a href="${section.href}" class="nav-card">
      <span class="card-num">${String(idx + 1).padStart(2, '0')}</span>
      <h3>${section.title}</h3>
      <p>${section.description}</p>
    </a>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} Engineering Appendix</title>
  <link rel="stylesheet" href="shared.css">
</head>
<body>

<nav class="appendix-nav">
  <div class="breadcrumb">
    <span class="current">Appendix Index</span>
  </div>
  <div class="nav-arrows">
    <a href="overview.html">Next: Overview</a>
  </div>
</nav>

<div class="page">

  <div class="header">
    <h1><span>${projectName}</span> Engineering Appendix</h1>
    <p class="subtitle">${pitch}</p>
    <div class="meta">
      <span>${version}</span>
      <span>February 2026</span>
      <span>CLI Tool</span>
      <span>${pageCount} Pages</span>
    </div>
  </div>

  <div class="callout blue">
    <strong>What is this?</strong> This appendix is a self-contained HTML reference manual for the ${projectName} project. It is compiled from planning documents and diagrams by the banneker-publisher sub-agent. Each page below covers a specific aspect of the engineering plan.
  </div>

  <h2><span class="accent" style="color: var(--accent-blue);">Navigation</span>Appendix Pages</h2>

  <div class="nav-grid">
    ${sectionCards}
  </div>

  <div class="footer">
    <p>${projectName} Engineering Appendix &middot; ${version} &middot; February 2026</p>
    <p>Generated by <a href="https://github.com/anthropics/banneker">banneker-publisher</a></p>
  </div>

</div>
</body>
</html>`;
}
```

### Pattern 4: Partial Appendix Generation with Graceful Degradation
**What:** Generate only available sections when documents/diagrams are missing
**When to use:** REQ-APPENDIX-003 - handling incomplete input data
**Example:**
```javascript
// Source: GraphQL partial data handling + REST API error patterns
// https://www.apollographql.com/docs/react/data/error-handling

function collectAvailableContent() {
  const available = {
    documents: [],
    diagrams: [],
    sections: [],
  };

  // Check for markdown documents
  const documentDir = '.banneker/documents/';
  const expectedDocs = [
    'TECHNICAL-SUMMARY.md',
    'STACK.md',
    'INFRASTRUCTURE-ARCHITECTURE.md',
    'DEVELOPER-HANDBOOK.md',
  ];

  expectedDocs.forEach(doc => {
    const docPath = path.join(documentDir, doc);
    if (fs.existsSync(docPath)) {
      available.documents.push({
        name: doc,
        path: docPath,
        size: fs.statSync(docPath).size,
      });
    }
  });

  // Check for HTML diagrams
  const diagramDir = '.banneker/diagrams/';
  const expectedDiagrams = [
    'executive-roadmap.html',
    'decision-map.html',
    'system-map.html',
    'architecture-wiring.html',
  ];

  if (fs.existsSync(diagramDir)) {
    expectedDiagrams.forEach(diagram => {
      const diagramPath = path.join(diagramDir, diagram);
      if (fs.existsSync(diagramPath)) {
        available.diagrams.push({
          name: diagram,
          path: diagramPath,
          size: fs.statSync(diagramPath).size,
        });
      }
    });
  }

  // Determine which sections can be generated
  // Section rules:
  // - overview.html: requires TECHNICAL-SUMMARY.md
  // - requirements.html: requires survey.json (always available)
  // - infrastructure.html: requires INFRASTRUCTURE-ARCHITECTURE.md
  // - security-legal.html: requires architecture-decisions.json (always available)
  // - planning-library.html: requires at least 1 document

  if (available.documents.some(d => d.name === 'TECHNICAL-SUMMARY.md')) {
    available.sections.push('overview');
  }

  // requirements.html can always be generated (uses survey.json)
  available.sections.push('requirements');

  if (available.documents.some(d => d.name === 'INFRASTRUCTURE-ARCHITECTURE.md')) {
    available.sections.push('infrastructure');
  }

  // security-legal.html can always be generated (uses architecture-decisions.json)
  available.sections.push('security-legal');

  if (available.documents.length > 0) {
    available.sections.push('planning-library');
  }

  return available;
}

// Usage in banneker-publisher agent:
const available = collectAvailableContent();

if (available.documents.length === 0) {
  console.warn('⚠️  No documents found in .banneker/documents/');
  console.warn('    Run /banneker:architect to generate planning documents first.');
  console.warn('    Generating minimal appendix with requirements and security-legal pages only.');
}

if (available.diagrams.length === 0) {
  console.warn('⚠️  No diagrams found in .banneker/diagrams/');
  console.warn('    Run /banneker:roadmap to generate architecture diagrams.');
  console.warn('    Appendix will not include diagram references.');
}

// Generate available sections only
available.sections.forEach(section => {
  generateSectionPage(section);
});

// Always generate index.html (even if only 2 sections)
generateIndexPage({
  sections: available.sections.map(s => getSectionMetadata(s)),
  pageCount: available.sections.length + 1, // +1 for index itself
});

console.log(`✓ Generated partial appendix: ${available.sections.length} section pages`);
console.log(`  Available sections: ${available.sections.join(', ')}`);
if (available.documents.length < 4) {
  console.log(`  Missing ${4 - available.documents.length} documents`);
}
if (available.diagrams.length < 4) {
  console.log(`  Missing ${4 - available.diagrams.length} diagrams`);
}
```

### Pattern 5: Accordion-Based Document Display for Planning Library
**What:** Display full markdown content in expandable accordions (existing pattern)
**When to use:** planning-library.html - showing all documents in one page
**Example:**
```javascript
// Source: Existing planning-library.html accordion pattern
// Uses accordion CSS classes from shared.css (lines 468-558)

function generatePlanningLibraryPage(documents) {
  const accordionItems = documents.map((doc, idx) => {
    const docHtml = convertMarkdownToHtml(doc.path);

    return `
    <div class="accordion-item">
      <div class="accordion-header">
        <div class="accordion-toggle">▶</div>
        <div class="accordion-header-content">
          <h4>${doc.title}</h4>
          <div class="doc-meta">${doc.name} · ${formatBytes(doc.size)}</div>
          <p class="doc-purpose">${doc.description}</p>
        </div>
      </div>
      <div class="accordion-body">
        ${docHtml}
      </div>
    </div>
    `;
  }).join('\n');

  return `
  <div class="accordion">
    ${accordionItems}
  </div>

  <script>
    // Accordion interaction (from existing pattern)
    (function() {
      document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.accordion-item');
          const isOpen = item.classList.contains('open');

          // Close all other accordions
          document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('open');
          });

          // Toggle clicked accordion
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      });
    })();
  </script>
  `;
}
```

### Anti-Patterns to Avoid
- **Hand-rolling markdown parser:** Violates "don't hand-roll" principle. Markdown has complex edge cases (nested lists, code blocks, inline HTML, escaping) that take months to handle correctly. Use marked.js.
- **Inline CSS in every page:** Duplicates 16KB of shared.css in each page. Use external `<link rel="stylesheet" href="shared.css">` as existing prototype does.
- **Hardcoded section list:** Makes partial generation difficult. Detect available content dynamically and generate only available sections.
- **Failing when diagrams are missing:** Violates REQ-APPENDIX-003. Generate partial appendix with warning messages for missing content.
- **Not linking diagrams from section pages:** Diagrams should be referenced/embedded in relevant section pages (e.g., executive-roadmap.html embedded in overview.html).
- **Assuming all 4 documents exist:** Early adopters may run `/banneker:appendix` before running `/banneker:architect`. Handle gracefully.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown-to-HTML parsing | Custom regex-based parser | marked.js, markdown-it, or showdown | Markdown has 100+ edge cases (nested lists, code blocks with triple backticks, inline HTML, email auto-linking, escaping). Parsers are battle-tested over years. Hand-rolled parsers break on edge cases. |
| HTML escaping for user content | Manual string replacement | marked.js handles escaping automatically | Escaping has security implications (XSS). Markdown parsers handle `<`, `>`, `&`, quotes correctly. Manual escaping misses edge cases. |
| Detecting available content | Try/catch around fs.readFileSync | fs.existsSync() before reading | existsSync() is explicit and clear. Try/catch is slower and less semantic for missing file checks. |
| Page template rendering | String concatenation with + operator | Template literals with ${} | Template literals are native ES6, readable, support multi-line strings, and avoid escaping issues. |
| Navigation link highlighting | JavaScript DOM manipulation on page load | Static class="current" in server-rendered HTML | Server-side rendering is faster, works without JavaScript, and is more accessible. Avoid client-side nav state. |

**Key insight:** Markdown parsing is a solved problem with mature libraries. The risk of hand-rolling a parser (incomplete spec compliance, edge case bugs, security vulnerabilities) far outweighs the cost of adding marked.js as a dependency. For everything else (page templating, file I/O, HTML generation), use Node.js built-ins.

## Common Pitfalls

### Pitfall 1: Not Handling Missing Documents Gracefully
**What goes wrong:** banneker-publisher expects all 4 documents to exist in `.banneker/documents/`. If TECHNICAL-SUMMARY.md is missing, agent throws error and exits. Result: no appendix generated, poor user experience.

**Why it happens:** Early implementation assumes happy path where user runs commands in order (`/banneker:architect` → `/banneker:roadmap` → `/banneker:appendix`). But users may skip steps, run commands out of order, or documents may be manually deleted.

**How to avoid:**
1. Check for existence of all expected files before starting generation
2. Build list of available documents and diagrams dynamically
3. Generate only sections that have required inputs (e.g., overview.html requires TECHNICAL-SUMMARY.md)
4. Always generate index.html and requirements.html (they use survey.json which always exists)
5. Provide clear warning messages listing missing files and which sections were skipped
6. Report partial completion status: "Generated 3 of 5 section pages (missing: overview, infrastructure)"

**Warning signs:**
- Agent crashes with "ENOENT: no such file or directory" error
- No appendix files generated at all (instead of partial appendix)
- Error messages don't explain which files are missing or how to fix
- User has to debug by manually checking which files exist

### Pitfall 2: Markdown Conversion Produces Unstyled HTML
**What goes wrong:** Markdown headings convert to `<h1>`, `<h2>`, etc., but these don't match the appendix design system. Result: section pages have mismatched heading styles, inconsistent spacing, wrong colors.

**Why it happens:** marked.js produces clean semantic HTML but doesn't apply CSS classes. The converted markdown `# Heading` becomes `<h1>Heading</h1>`, but shared.css expects `<h2><span class="accent">Section</span>Heading</h2>` for accented headers.

**How to avoid:**
1. Post-process converted HTML to add CSS classes where needed
2. OR accept that markdown content uses default semantic HTML styles (which shared.css already styles)
3. Markdown `#` → `<h1>` → styled by `h1 { ... }` in shared.css (already exists)
4. For special formatting (colored spans, badges, callouts), include HTML directly in markdown files (marked.js preserves inline HTML)
5. Test markdown conversion with sample content to verify styling consistency
6. Document markdown conventions for planning documents (e.g., "use `**bold**` not `<strong class="custom">bold</strong>`")

**Warning signs:**
- Converted markdown headings don't match heading styles in manually-crafted sections
- Lists have different bullet styles than utility-grid cards
- Code blocks don't have dark background (shared.css has `pre` styles but maybe not applied)
- Spacing between sections is inconsistent

### Pitfall 3: Index Page Links to Non-Existent Section Pages
**What goes wrong:** index.html navigation grid includes card for "Executive Overview" linking to overview.html, but overview.html wasn't generated because TECHNICAL-SUMMARY.md is missing. Result: 404 error when user clicks link.

**Why it happens:** Index page generation uses hardcoded section list instead of detecting which sections were actually generated.

**How to avoid:**
1. Generate index.html AFTER generating all section pages (not before)
2. Build section list dynamically based on which pages were successfully created
3. Check for existence of each section page before adding link to index: `if (fs.existsSync('.banneker/appendix/overview.html'))`
4. Include metadata about missing sections in index page: "3 of 5 sections available. Missing: overview (requires TECHNICAL-SUMMARY.md), infrastructure (requires INFRASTRUCTURE-ARCHITECTURE.md)"
5. Test with partial content: delete TECHNICAL-SUMMARY.md, run `/banneker:appendix`, verify index.html only links to available pages

**Warning signs:**
- Index page shows "6 Pages" but only 3 section pages exist
- Clicking navigation links results in 404 errors
- No indication in index.html about which sections are missing or why

### Pitfall 4: Diagrams Not Embedded or Linked in Section Pages
**What goes wrong:** architecture diagrams are generated as standalone HTML files in `.banneker/diagrams/`, but no section page links to them or embeds them. Result: diagrams are orphaned, not accessible from appendix navigation.

**Why it happens:** Unclear where diagrams should be integrated. Should they be embedded as `<iframe>`? Linked as separate pages? Included in a dedicated "Diagrams" section?

**How to avoid:**
1. Create dedicated section page: diagrams.html that lists all 4 diagrams with preview images or thumbnails and links to open full diagram
2. OR embed diagrams inline in relevant sections using `<iframe>` (e.g., executive-roadmap.html embedded in overview.html)
3. OR link to diagrams from navigation: add "Diagrams" as a 6th section in nav-links
4. Document the integration approach in planning documents so it's consistent
5. Test diagram accessibility: can user navigate from index → diagrams without guessing URLs?

**Warning signs:**
- Diagrams exist in `.banneker/diagrams/` but aren't mentioned anywhere in appendix pages
- No navigation path to reach diagrams (user must manually type URL)
- Unclear relationship between documents and diagrams (e.g., which diagram corresponds to which document?)

### Pitfall 5: Accordion JavaScript Conflicts with Diagram JavaScript
**What goes wrong:** planning-library.html includes accordion JavaScript for expanding document sections. If a diagram is embedded via `<iframe>`, the diagram's JavaScript (from architecture-wiring.html) interferes with accordion toggle. Result: accordion doesn't expand, or diagram interactions don't work.

**Why it happens:** Both accordion and diagram use global event listeners and DOM manipulation. If diagram is embedded, two sets of JavaScript compete for same event namespace.

**How to avoid:**
1. Wrap all accordion JavaScript in IIFE to scope variables: `(function() { /* accordion code */ })();`
2. Use event delegation on accordion container, not document: `accordionContainer.addEventListener(...)`
3. Diagrams are already IIFE-wrapped (from Phase 5 pattern), so they won't leak globals
4. Avoid embedding diagrams via `<iframe>` if possible (link to them as separate pages instead)
5. Test integration: embed architecture-wiring.html in planning-library.html, verify both accordion and diagram interactions work

**Warning signs:**
- Accordion stops working after diagram is embedded
- Console errors about duplicate event listeners or undefined variables
- Diagram interactions trigger accordion expansion unexpectedly

## Code Examples

Verified patterns from official sources:

### Basic Markdown Conversion with marked.js
```javascript
// Source: marked.js official documentation
// https://marked.js.org/using_advanced

const { marked } = require('marked');
const fs = require('fs');

// Configure marked options
marked.setOptions({
  gfm: true,              // GitHub Flavored Markdown
  breaks: false,          // Don't treat \n as <br>
  headerIds: true,        // Generate IDs for headers (useful for anchor links)
  mangle: false,          // Don't escape email addresses
  pedantic: false,        // Don't be strict about original markdown.pl behavior
});

// Convert markdown file to HTML
function markdownToHtml(filePath) {
  const markdown = fs.readFileSync(filePath, 'utf8');
  const html = marked.parse(markdown);
  return html;
}

// Example: Convert TECHNICAL-SUMMARY.md
const summaryMarkdown = fs.readFileSync('.banneker/documents/TECHNICAL-SUMMARY.md', 'utf8');
const summaryHtml = marked.parse(summaryMarkdown);

// Result (example):
// Input:  # Technical Summary\n\n**Project:** Banneker
// Output: <h1 id="technical-summary">Technical Summary</h1>\n<p><strong>Project:</strong> Banneker</p>
```

### Complete Section Page Generation
```javascript
// Source: Appendix prototype pattern + marked.js integration

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

function generateOverviewPage(survey) {
  // Convert TECHNICAL-SUMMARY.md to HTML
  const summaryPath = '.banneker/documents/TECHNICAL-SUMMARY.md';
  const summaryHtml = marked.parse(fs.readFileSync(summaryPath, 'utf8'));

  // Build page from template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Overview -- ${survey.project.name} Engineering Appendix</title>
  <link rel="stylesheet" href="shared.css">
</head>
<body>

<nav class="appendix-nav">
  <div class="breadcrumb">
    <a href="index.html">Appendix</a>
    <span class="sep">/</span>
    <span class="current">Executive Overview</span>
  </div>
  <div class="nav-arrows">
    <a href="index.html">Prev: Index</a>
    <a href="requirements.html">Next: Requirements</a>
  </div>
</nav>

<div class="page">

  <div class="header">
    <h1><span>Executive Overview</span></h1>
    <p class="subtitle">Architecture, services, and data layer for ${survey.project.name}</p>
    <div class="meta">
      <span>v0.2.0</span>
      <span>February 2026</span>
      <span>${survey.project.type.toUpperCase()}</span>
    </div>
    <div class="nav-links">
      <a href="index.html">Index</a>
      <a href="overview.html">Overview</a>
      <a href="requirements.html">Requirements</a>
      <a href="infrastructure.html">Infrastructure</a>
      <a href="security-legal.html">Security &amp; Legal</a>
      <a href="planning-library.html">Planning Library</a>
    </div>
  </div>

  ${summaryHtml}

  <div class="footer">
    <p>${survey.project.name} Engineering Appendix &middot; v0.2.0 &middot; February 2026</p>
    <p>Generated by <a href="https://github.com/anthropics/banneker">banneker-publisher</a></p>
  </div>

</div>
</body>
</html>`;

  fs.writeFileSync('.banneker/appendix/overview.html', html, 'utf8');
  console.log('✓ Generated overview.html');
}
```

### Partial Appendix with Missing Content Detection
```javascript
// Source: GraphQL error handling patterns + REST API partial response
// https://www.apollographql.com/docs/react/data/error-handling

function generatePartialAppendix() {
  const documentDir = '.banneker/documents/';
  const diagramDir = '.banneker/diagrams/';

  // Detect available documents
  const availableDocs = [
    'TECHNICAL-SUMMARY.md',
    'STACK.md',
    'INFRASTRUCTURE-ARCHITECTURE.md',
    'DEVELOPER-HANDBOOK.md',
  ].filter(doc => fs.existsSync(path.join(documentDir, doc)));

  // Detect available diagrams
  const availableDiagrams = fs.existsSync(diagramDir)
    ? fs.readdirSync(diagramDir).filter(f => f.endsWith('.html'))
    : [];

  console.log(`📄 Documents: ${availableDocs.length}/4 available`);
  console.log(`📊 Diagrams: ${availableDiagrams.length}/4 available`);

  // Determine which sections can be generated
  const sections = [];

  // Overview requires TECHNICAL-SUMMARY.md
  if (availableDocs.includes('TECHNICAL-SUMMARY.md')) {
    sections.push({
      id: 'overview',
      title: 'Executive Overview',
      href: 'overview.html',
      description: 'Architecture, sub-agents, data layer, technology stack',
    });
  } else {
    console.warn('⚠️  Skipping overview.html (requires TECHNICAL-SUMMARY.md)');
  }

  // Requirements can always be generated (uses survey.json)
  sections.push({
    id: 'requirements',
    title: 'Requirements Matrix',
    href: 'requirements.html',
    description: 'Rubric items across categories with coverage status',
  });

  // Infrastructure requires INFRASTRUCTURE-ARCHITECTURE.md
  if (availableDocs.includes('INFRASTRUCTURE-ARCHITECTURE.md')) {
    sections.push({
      id: 'infrastructure',
      title: 'Infrastructure',
      href: 'infrastructure.html',
      description: 'Distribution, CI/CD, filesystem layout, multi-runtime support',
    });
  } else {
    console.warn('⚠️  Skipping infrastructure.html (requires INFRASTRUCTURE-ARCHITECTURE.md)');
  }

  // Security-legal can always be generated (uses architecture-decisions.json)
  sections.push({
    id: 'security-legal',
    title: 'Security & Legal',
    href: 'security-legal.html',
    description: 'Security rubric, secrets management, MIT license, architecture decisions',
  });

  // Planning library requires at least 1 document
  if (availableDocs.length > 0) {
    sections.push({
      id: 'planning-library',
      title: 'Planning Library',
      href: 'planning-library.html',
      description: `Full text of ${availableDocs.length} source documents with expandable accordions`,
    });
  } else {
    console.warn('⚠️  Skipping planning-library.html (no documents available)');
  }

  // Generate each available section
  sections.forEach(section => {
    generateSectionPage(section);
  });

  // Always generate index.html
  generateIndexPage({
    sections,
    pageCount: sections.length + 1, // +1 for index itself
  });

  // Report results
  console.log(`\n✅ Generated partial appendix: ${sections.length} section pages`);
  console.log(`   Pages: index.html, ${sections.map(s => s.href).join(', ')}`);

  if (availableDocs.length < 4) {
    const missing = ['TECHNICAL-SUMMARY.md', 'STACK.md', 'INFRASTRUCTURE-ARCHITECTURE.md', 'DEVELOPER-HANDBOOK.md']
      .filter(d => !availableDocs.includes(d));
    console.log(`\n⚠️  Missing documents: ${missing.join(', ')}`);
    console.log('   Run /banneker:architect to generate planning documents');
  }

  if (availableDiagrams.length < 4) {
    console.log(`\n⚠️  Missing diagrams: ${4 - availableDiagrams.length}/4`);
    console.log('   Run /banneker:roadmap to generate architecture diagrams');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom markdown parsers | marked.js, markdown-it (battle-tested libraries) | 2015-2020 | Reduced bugs, better CommonMark compliance, active maintenance |
| Inline CSS in every page | External shared.css with CSS custom properties | 2020-2026 | Smaller file sizes, easier theme updates, cacheable CSS |
| Monolithic appendix generation | Partial generation with graceful degradation | 2025-2026 | Better UX for incomplete inputs, clearer error messages |
| Server-side rendering with Express/Next.js | Static HTML generation with Node.js built-ins | 2022-2026 | Zero dependencies (except marked.js), portable output, no server needed |
| Manual HTML templating with string concatenation | Template literals with ${} syntax | ES6 (2015+) | Native, readable, avoids escaping issues |

**Deprecated/outdated:**
- **markdown.js (John Gruber's original parser):** Abandoned in 2011. Use marked.js or markdown-it instead.
- **Showdown 1.x:** Breaking changes in 2.x (2019). Use 2.x for modern projects.
- **Inline styles in HTML:** Replaced by external CSS with custom properties for theming. Inline styles have specificity issues.

## Open Questions

Things that couldn't be fully resolved:

1. **Should diagrams be embedded via `<iframe>` or linked as separate pages?**
   - What we know: Diagrams are self-contained HTML files in `.banneker/diagrams/`. They have their own JavaScript for interactivity (architecture-wiring.html).
   - What's unclear: Best UX for accessing diagrams from appendix. Embedding via `<iframe>` shows preview but may cause JavaScript conflicts. Linking as separate pages requires navigation away from appendix.
   - Recommendation: Create dedicated diagrams.html section page that lists all 4 diagrams with thumbnails (screenshot images) and links to open full diagram in new tab. Avoid `<iframe>` embedding to prevent JavaScript conflicts. Link diagrams from overview.html and infrastructure.html where relevant.

2. **What content should each section page include beyond converted markdown?**
   - What we know: Existing prototype pages (overview.html, requirements.html) include custom HTML beyond raw markdown conversion (utility cards, callout boxes, stats bars).
   - What's unclear: Should section pages be pure markdown conversion or manually crafted HTML with markdown snippets? How much customization is needed?
   - Recommendation: Mix approach - planning-library.html is pure markdown conversion with accordions. overview.html and requirements.html have custom HTML layouts that incorporate markdown snippets. infrastructure.html and security-legal.html are mostly markdown conversion with occasional utility cards for highlights.

3. **How should version number be determined for appendix pages?**
   - What we know: Existing pages show "v0.2.0" in header metadata. This should come from survey.json or package.json.
   - What's unclear: survey.json has `"version": "0.1.0"` (project version). package.json has Banneker package version. Which one should appendix pages display?
   - Recommendation: Display project version from survey.json (`survey.version`) in appendix pages. This is the version of the project being planned, not the version of Banneker tool.

4. **Should appendix generation support custom themes or is dark theme sufficient?**
   - What we know: shared.css defines dark-theme design tokens (`:root` custom properties). All pages use this theme.
   - What's unclear: Should banneker-publisher support theme switching (light/dark) or custom color palettes?
   - Recommendation: Dark theme only for initial release. Custom themes are out of scope for Phase 6. Future enhancement: add `--theme` flag to `/banneker:appendix` command for theme selection (read alternate theme.css file).

## Sources

### Primary (HIGH confidence)
- [marked.js Official Documentation](https://marked.js.org/) - marked.js official docs 2026
- [marked.js GitHub Repository](https://github.com/markedjs/marked) - Source code and issues
- [marked.js npm Package](https://www.npmjs.com/package/marked) - Installation and version info
- [Apollo GraphQL Error Handling](https://www.apollographql.com/docs/react/data/error-handling) - Partial data patterns
- [Existing Banneker Appendix Prototype](file:///home/daniel/Documents/banneker/.banneker/appendix/) - Analysis of index.html, shared.css, planning-library.html patterns

### Secondary (MEDIUM confidence)
- [HTML, CSS, and JavaScript in One File: A Complete 2026 Guide](https://copyprogramming.com/howto/how-to-put-html-css-and-js-in-one-single-file) - Self-contained HTML best practices
- [markdown-it Documentation](https://github.com/markdown-it/markdown-it) - Alternative markdown parser
- [Showdown Documentation](https://showdownjs.com/) - Bidirectional markdown converter
- [Quarto Appendices](https://quarto.org/docs/authoring/appendices.html) - Academic appendix patterns
- [REST API Error Handling Best Practices](https://treblle.com/blog/rest-api-error-handling) - Partial response patterns

### Tertiary (LOW confidence)
- [13 Best AI Document Generation Tools for 2026](https://venngage.com/blog/best-ai-document-generator/) - Market survey (commercial focus)
- [SharePoint Document Management Best Practices 2026](https://www.systoolsgroup.com/updates/sharepoint-document-management-best-practices/) - Enterprise patterns (not directly applicable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - marked.js is the de facto standard for Node.js markdown parsing, well-documented and battle-tested
- Architecture: HIGH - Existing appendix prototype provides concrete implementation patterns, marked.js integration is straightforward
- Pitfalls: MEDIUM-HIGH - Graceful degradation patterns verified from GraphQL/REST API sources, some pitfalls inferred from Phase 5 patterns

**Research date:** 2026-02-02
**Valid until:** 30 days (2026-03-04) - Markdown parsing is stable, but document generation patterns and UX conventions evolve
