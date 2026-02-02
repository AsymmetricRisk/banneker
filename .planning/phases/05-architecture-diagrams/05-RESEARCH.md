# Phase 5: Architecture Diagrams - Research

**Researched:** 2026-02-02
**Domain:** Self-contained HTML diagram generation from JSON data, CSS-only visualization, vanilla JavaScript interactivity
**Confidence:** HIGH

## Summary

Phase 5 requires generating four HTML architecture diagrams from survey data and planning documents. This is fundamentally a data-to-visualization transformation problem where structured JSON becomes visual representations of project architecture. The diagrams must be self-contained (no external CSS/JS dependencies) and split across two waves: Wave 1 produces 3 CSS-only static diagrams, Wave 2 produces 1 JavaScript-enhanced interactive wiring diagram.

Research reveals that self-contained HTML diagrams in 2026 are not only viable but increasingly practical due to modern CSS capabilities. The key insight is that CSS Grid with `grid-template-areas` reads like a layout diagram, making it ideal for architecture visualization. For the three CSS-only diagrams (executive roadmap, decision map, system map), the standard approach uses CSS Grid for macro layout, Flexbox for micro layout within components, and inline SVG for connectors/arrows. For the JavaScript-enhanced wiring diagram, lightweight vanilla JS libraries like JointJS or custom implementations using SVG manipulation provide interactivity without heavy framework dependencies.

The four diagram types each serve distinct visualization purposes: executive roadmap shows project phases as a horizontal timeline, decision map visualizes architecture decisions as a dependency graph, system map displays components and data stores as a topology diagram, and architecture wiring diagram presents interactive connections between system elements. All four must read from survey.json and planning documents, transform data into HTML structure, and inline all styling/scripting to meet the zero-external-dependencies constraint.

For wave-based generation with context budget handoff, the pattern from Phase 4 applies: track state in `.banneker/state/diagrammer-state.md`, check for existing diagrams before starting, and write `.banneker/state/.continue-here.md` if Wave 1 completes but context is exhausted before Wave 2. The banneker-diagrammer agent generates diagrams sequentially within each wave, with Wave 2 depending on Wave 1 completion.

**Primary recommendation:** Implement banneker-diagrammer agent with two-wave architecture: Wave 1 generates 3 CSS-only diagrams using CSS Grid/Flexbox layouts with inline SVG connectors, Wave 2 generates 1 JS-enhanced wiring diagram using vanilla JavaScript with inline SVG manipulation. All diagrams inline the Banneker dark-theme design system CSS from shared.css and output to `.banneker/diagrams/`. Use state file for wave tracking and handoff.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 18+ | File I/O, JSON parsing, string templating | Zero-dependency constraint requires built-ins only |
| CSS Grid | CSS3 (2026) | Two-dimensional diagram layout with named areas | `grid-template-areas` reads like a diagram, ideal for architecture visualization |
| CSS Flexbox | CSS3 (2026) | One-dimensional component layout within grid cells | Micro-layout for nodes, labels, metadata within diagram regions |
| Inline SVG | SVG 1.1 / 2.0 | Connector lines, arrows, shapes embedded in HTML | Self-contained graphics without external image files |
| Vanilla JavaScript | ES2022+ | Interactive diagram manipulation (Wave 2 only) | No external libraries needed for SVG DOM manipulation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS Custom Properties | CSS3 | Design system color tokens from shared.css | Inline the Banneker dark-theme palette for visual consistency |
| CSS Pseudo-elements | CSS3 | Connector lines via ::before/::after | Simple static connectors without SVG overhead |
| CSS Transitions | CSS3 | Hover effects, highlighting | Interactive feedback in CSS-only diagrams |
| Template literals | ES6 | HTML generation from JSON data | Build diagram HTML structure from survey.json |
| SVG `<path>` elements | SVG 1.1 | Curved connectors for complex layouts | Bezier curves for wiring diagram connections |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom vanilla JS | JointJS, D3.js, Cytoscape.js | External libraries violate zero-dependency constraint; custom JS is lightweight but requires more implementation |
| Inline SVG | Canvas API | Canvas requires JavaScript for all rendering; SVG is declarative and inspectable in browser DevTools |
| CSS Grid | Absolute positioning | Absolute positioning is brittle and non-responsive; Grid is semantic and maintainable |
| Template literals | Template engine (Handlebars, EJS) | Template engines are dependencies; template literals are native ES6 |

**Installation:**
```bash
# No installation needed - all Node.js built-ins and native browser APIs
# CSS Grid, Flexbox, SVG are browser standards (97%+ support in 2026)
```

## Architecture Patterns

### Recommended Project Structure
```
.banneker/
├── survey.json                      # Input: project metadata, actors, walkthroughs
├── architecture-decisions.json      # Input: decision log with DEC-XXX IDs
├── documents/
│   ├── TECHNICAL-SUMMARY.md         # Input: project overview for diagram context
│   ├── STACK.md                     # Input: technology stack for system map
│   └── INFRASTRUCTURE-ARCHITECTURE.md # Input: deployment topology
├── diagrams/
│   ├── executive-roadmap.html       # Wave 1: CSS-only timeline visualization
│   ├── decision-map.html            # Wave 1: CSS-only decision dependency graph
│   ├── system-map.html              # Wave 1: CSS-only component topology
│   └── architecture-wiring.html     # Wave 2: JS-enhanced interactive connections
└── state/
    ├── diagrammer-state.md          # Generation state for wave tracking
    └── .continue-here.md            # Handoff file if context exhausted after Wave 1

templates/
├── commands/
│   └── banneker-roadmap.md          # Skill file for /banneker:roadmap command
└── agents/
    └── banneker-diagrammer.md       # Sub-agent: generates diagrams from survey data
```

### Pattern 1: Self-Contained HTML with Inlined CSS/JS
**What:** Single HTML file with all CSS in `<style>` tags and all JS in `<script>` tags
**When to use:** REQ-DIAG-003 - zero external dependencies for portable diagrams
**Example:**
```html
<!-- Source: HTML/CSS/JS in One File Guide 2026 -->
<!-- https://copyprogramming.com/howto/how-to-put-html-css-and-js-in-one-single-file -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Roadmap -- Banneker</title>
  <style>
    /* Inline all CSS from shared.css design system */
    :root {
      --bg: #0f1117;
      --bg-card: #1a1d27;
      --border: #2a2e3d;
      --text: #c9cdd8;
      --accent-blue: #4f8ff7;
      --accent-cyan: #36d6c3;
      /* ... rest of design tokens ... */
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      margin: 0;
      padding: 2rem;
    }

    .diagram-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Diagram-specific styles */
    .roadmap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
  </style>
</head>
<body>
  <div class="diagram-container">
    <h1>Executive Roadmap</h1>
    <!-- Diagram content -->
  </div>

  <!-- For Wave 2 JS diagram only -->
  <script>
    // Inline JavaScript for interactivity
    // No external libraries, no CDN links
  </script>
</body>
</html>
```

### Pattern 2: CSS Grid Layout for Architecture Diagrams
**What:** Use CSS Grid with `grid-template-areas` to create diagram structure
**When to use:** All diagrams - provides semantic, responsive layout with named regions
**Example:**
```css
/* Source: CSS Grid for Diagrams 2026 */
/* https://developer.mescius.com/blogs/create-great-diagrams-using-css-grid-layouts */

.system-map {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header   header"
    "backend gateway  frontend"
    "data    data     data";
  gap: 2rem;
  padding: 2rem;
}

.header { grid-area: header; }
.backend { grid-area: backend; }
.gateway { grid-area: gateway; }
.frontend { grid-area: frontend; }
.data { grid-area: data; }

/* Component nodes */
.node {
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
}

.node h3 {
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.node .tech {
  color: var(--accent-cyan);
  font-size: 0.85rem;
}
```

### Pattern 3: Inline SVG for Connectors and Arrows
**What:** Embed SVG elements directly in HTML for diagram connectors
**When to use:** All diagrams - draw lines/arrows between components without external images
**Example:**
```html
<!-- Source: Inline SVG in HTML Guide 2026 -->
<!-- https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML -->

<div class="diagram-container" style="position: relative;">
  <!-- Component nodes -->
  <div class="node" id="node-backend">Backend API</div>
  <div class="node" id="node-frontend">Frontend App</div>

  <!-- SVG overlay for connectors -->
  <svg class="connectors" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
    <defs>
      <!-- Arrow marker for directional flow -->
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="var(--accent-cyan)" />
      </marker>
    </defs>

    <!-- Connector line from backend to frontend -->
    <path
      d="M 100,50 L 300,50"
      stroke="var(--accent-cyan)"
      stroke-width="2"
      fill="none"
      marker-end="url(#arrowhead)"
    />

    <!-- Curved connector for complex paths -->
    <path
      d="M 100,100 Q 200,50 300,100"
      stroke="var(--accent-blue)"
      stroke-width="2"
      fill="none"
      stroke-dasharray="5,5"
    />
  </svg>
</div>
```

### Pattern 4: CSS Timeline for Executive Roadmap
**What:** Horizontal timeline using Flexbox with milestone nodes
**When to use:** Executive roadmap diagram - visualize project phases chronologically
**Example:**
```css
/* Source: CSS Timeline Visualization 2026 */
/* https://freefrontend.com/css-timelines/ */

.roadmap-timeline {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  overflow-x: auto;
}

.milestone {
  flex: 0 0 250px;
  position: relative;
}

/* Timeline connector */
.milestone::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -1rem;
  width: calc(100% + 2rem);
  height: 2px;
  background: var(--border);
  z-index: -1;
}

.milestone:first-child::before {
  left: 50%;
  width: 50%;
}

.milestone:last-child::before {
  width: 50%;
}

.milestone-marker {
  width: 20px;
  height: 20px;
  background: var(--accent-blue);
  border-radius: 50%;
  margin: 0 auto 1rem;
  box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px var(--accent-blue);
}

.milestone-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.phase-number {
  color: var(--accent-blue);
  font-weight: bold;
  font-size: 0.85rem;
}

.phase-name {
  color: var(--text-bright);
  font-weight: 600;
  margin: 0.5rem 0;
}

.phase-requirements {
  color: var(--text-dim);
  font-size: 0.75rem;
}
```

### Pattern 5: Vanilla JS Interactive Wiring Diagram
**What:** Use vanilla JavaScript to manipulate SVG DOM for interactive diagram
**When to use:** Wave 2 architecture wiring diagram - show clickable connections
**Example:**
```javascript
// Source: Interactive SVG Diagrams with Vanilla JS 2026
// https://github.com/nypl-spacetime/interactive-architecture

// Data from survey.json
const components = [
  { id: 'backend', name: 'Backend API', x: 100, y: 100 },
  { id: 'frontend', name: 'Frontend App', x: 400, y: 100 },
  { id: 'database', name: 'PostgreSQL', x: 100, y: 300 }
];

const connections = [
  { from: 'backend', to: 'frontend', label: 'REST API' },
  { from: 'backend', to: 'database', label: 'SQL Queries' }
];

// Generate SVG elements
const svg = document.getElementById('wiring-svg');

// Render component nodes
components.forEach(comp => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'component-node');
  g.setAttribute('data-id', comp.id);
  g.setAttribute('transform', `translate(${comp.x}, ${comp.y})`);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '120');
  rect.setAttribute('height', '60');
  rect.setAttribute('rx', '8');
  rect.setAttribute('fill', '#1a1d27');
  rect.setAttribute('stroke', '#2a2e3d');
  rect.setAttribute('stroke-width', '2');

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '60');
  text.setAttribute('y', '35');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#c9cdd8');
  text.textContent = comp.name;

  g.appendChild(rect);
  g.appendChild(text);
  svg.appendChild(g);

  // Interactivity: highlight on click
  g.addEventListener('click', () => {
    document.querySelectorAll('.component-node').forEach(n => {
      n.querySelector('rect').setAttribute('stroke', '#2a2e3d');
    });
    rect.setAttribute('stroke', '#4f8ff7');

    // Highlight connected edges
    highlightConnections(comp.id);
  });
});

// Render connection paths
connections.forEach(conn => {
  const fromComp = components.find(c => c.id === conn.from);
  const toComp = components.find(c => c.id === conn.to);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const d = `M ${fromComp.x + 60},${fromComp.y + 60} L ${toComp.x + 60},${toComp.y}`;
  path.setAttribute('d', d);
  path.setAttribute('stroke', '#36d6c3');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  path.setAttribute('data-from', conn.from);
  path.setAttribute('data-to', conn.to);

  svg.insertBefore(path, svg.firstChild); // Insert behind nodes
});

function highlightConnections(componentId) {
  document.querySelectorAll('path').forEach(p => {
    if (p.getAttribute('data-from') === componentId || p.getAttribute('data-to') === componentId) {
      p.setAttribute('stroke', '#4f8ff7');
      p.setAttribute('stroke-width', '3');
    } else {
      p.setAttribute('stroke', '#36d6c3');
      p.setAttribute('stroke-width', '2');
    }
  });
}
```

### Pattern 6: Two-Wave Generation with State Tracking
**What:** Generate diagrams in two waves with state file for resume capability
**When to use:** REQ-DIAG-004, REQ-CONT-003 - context budget handoff between waves
**Example:**
```markdown
# Source: Phase 4 Research - Multi-wave generation pattern

# banneker-diagrammer agent workflow

## Step 0: Check for Resume State
Read `.banneker/state/diagrammer-state.md` if exists.
Parse completed waves and diagrams.
If Wave 1 complete but Wave 2 not started: resume from Wave 2.
If all diagrams complete: report and exit.

## Step 1: Load Inputs
Read survey.json, architecture-decisions.json, planning documents.
Extract data for each diagram type:
- Executive roadmap: project phases from survey
- Decision map: decisions from architecture-decisions.json
- System map: components from survey.backend
- Architecture wiring: integrations and data flows

## Step 2: Execute Wave 1 (CSS-Only Diagrams)
Generate executive-roadmap.html:
  - Data: survey phases, milestones, requirements
  - Layout: CSS Flexbox timeline with milestone nodes
  - Output: .banneker/diagrams/executive-roadmap.html

Generate decision-map.html:
  - Data: architecture-decisions.json (DEC-XXX items)
  - Layout: CSS Grid with decision nodes and pseudo-element connectors
  - Output: .banneker/diagrams/decision-map.html

Generate system-map.html:
  - Data: survey.backend.stack, data_stores, integrations
  - Layout: CSS Grid topology with inline SVG connectors
  - Output: .banneker/diagrams/system-map.html

Update state: Wave 1 complete.

## Step 3: Check Context Budget
Estimate remaining context tokens.
If context < 20000 tokens:
  Write `.banneker/state/.continue-here.md` with:
    - What's complete: Wave 1 (3 diagrams)
    - What's next: Wave 2 (architecture wiring diagram)
    - Resume instructions: "Run /banneker:roadmap to continue"
  Exit gracefully.

## Step 4: Execute Wave 2 (JS-Enhanced Diagram)
Generate architecture-wiring.html:
  - Data: survey.backend components, integrations, data flows
  - Layout: SVG canvas with vanilla JS for interactivity
  - Features: Click to highlight, hover tooltips, zoom/pan
  - Output: .banneker/diagrams/architecture-wiring.html

Update state: Wave 2 complete.

## Step 5: Report Results
List all generated diagrams with file paths and sizes.
Report total: 4 diagrams in .banneker/diagrams/.
Suggest next step: "Run /banneker:appendix to compile appendix."
```

### Anti-Patterns to Avoid
- **External CSS/JS links:** Violates REQ-DIAG-003 self-contained requirement. Always inline.
- **Using external diagram libraries:** D3.js, Mermaid.js, etc. are dependencies. Use vanilla JS only.
- **Fixed pixel positioning:** Breaks on different screen sizes. Use CSS Grid/Flexbox for responsive layout.
- **Generating all diagrams in one step:** Violates wave architecture. Wave 1 (CSS-only) must complete before Wave 2 (JS-enhanced).
- **Hardcoded diagram data:** Diagrams must read from survey.json/decisions.json, not contain placeholder data.
- **Not checking for resume state:** May regenerate Wave 1 diagrams unnecessarily after handoff.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawing curved connector lines | Manual quadratic bezier calculations | SVG `<path>` with Q command (quadratic) or C command (cubic) | SVG path syntax handles edge cases (control points, curves) and browser rendering is optimized |
| Calculating node coordinates for layout | Custom positioning algorithm | CSS Grid with `grid-template-areas` or auto-placement | Grid handles responsive sizing, alignment, and visual debugging via DevTools |
| Inlining CSS from separate file | Manual copy-paste or string concatenation | Template literals with file read: `<style>${fs.readFileSync('shared.css', 'utf8')}</style>` | Preserves CSS source formatting, avoids string escaping issues |
| Detecting context budget exhaustion | Token counting heuristics | Simple heuristic: "if Wave 1 complete and total output > 30KB, trigger handoff" | Context budget is unpredictable; use output size as proxy |
| JSON to HTML templating | Custom string building | Template literals with map/join: `components.map(c => \`<div>${c.name}</div>\`).join('')` | Native ES6, readable, no escaping issues |

**Key insight:** Self-contained HTML diagrams are fundamentally template rendering problems: transform JSON data into HTML/CSS/SVG strings, inline all styling, and write to file. Don't build complex frameworks - use native browser capabilities (CSS Grid, inline SVG, vanilla JS) and Node.js template literals for generation.

## Common Pitfalls

### Pitfall 1: Forgetting to Inline CSS Custom Properties
**What goes wrong:** Diagram references `var(--accent-blue)` but doesn't include `:root` declaration. Result: diagram renders with default browser colors instead of Banneker dark theme.

**Why it happens:** shared.css is external in appendix pages, but diagrams must be self-contained. Developer inlines structural CSS but forgets to inline the design token definitions.

**How to avoid:**
1. Create a CSS inlining function that reads shared.css and extracts all `:root` custom properties
2. Include the full `:root` block at the top of every diagram's `<style>` tag
3. Test diagrams by opening them directly in browser (not via appendix index) to verify self-containment
4. Validation check: `grep 'var(--' diagram.html` should have corresponding `:root` definitions

**Warning signs:**
- Diagram colors are browser defaults (blue links, black background) instead of Banneker dark theme
- Diagram looks correct when viewed in context but broken when opened standalone
- Missing `--bg`, `--text`, `--accent-*` variable declarations in `<style>` block

### Pitfall 2: SVG Connectors Not Positioned Correctly
**What goes wrong:** Connector lines don't align with component nodes. Lines start/end at wrong coordinates, pass behind nodes instead of connecting edges, or disappear off-canvas.

**Why it happens:** SVG coordinate system is absolute pixels, but CSS Grid uses flexible units. Node positions change with viewport size, but SVG paths have hardcoded coordinates.

**How to avoid:**
1. For CSS-only diagrams: Use CSS pseudo-elements (::before/::after) with relative positioning instead of SVG paths when connectors are simple straight lines
2. For JS diagrams: Calculate connector coordinates dynamically from node bounding boxes: `node.getBoundingClientRect()`
3. For static diagrams with SVG: Position SVG as `position: absolute; top: 0; left: 0` overlay, calculate node centers manually
4. Test at multiple viewport sizes (mobile, tablet, desktop) to verify connector alignment

**Warning signs:**
- Connector lines don't touch component boxes
- Lines are offset by a fixed number of pixels
- Connectors break when browser window is resized
- SVG `<path>` coordinates are hardcoded (e.g., `M 100,50 L 300,50`) without calculation from data

### Pitfall 3: JavaScript Not Scoped to Diagram
**What goes wrong:** Architecture wiring diagram's JavaScript interferes with other page elements or vice versa. Event listeners trigger on wrong elements, variables leak to global scope.

**Why it happens:** Inline `<script>` tags execute in global scope. If diagram is embedded in appendix page later, JS may conflict with other scripts.

**How to avoid:**
1. Wrap all diagram JavaScript in an IIFE (Immediately Invoked Function Expression): `(function() { /* diagram code */ })();`
2. Use `querySelectorAll` with specific selectors scoped to diagram container: `container.querySelectorAll('.node')`
3. Attach event listeners to diagram container, not document: `container.addEventListener(...)`
4. Avoid global variables; use `const` and `let` within IIFE scope

**Warning signs:**
- JavaScript errors when diagram is embedded in larger page
- Event listeners trigger on elements outside the diagram
- `var` declarations in diagram JavaScript (should be `const`/`let`)
- `document.querySelector` without scoping to diagram container

### Pitfall 4: Generating Diagrams Without Validation
**What goes wrong:** Diagram is generated but contains no data (empty), has malformed HTML (unclosed tags), or references non-existent survey fields. Diagram file is created but shows blank page or broken layout.

**Why it happens:** Diagram generation doesn't validate inputs before rendering. If survey.json is missing a field (e.g., `backend.integrations` is undefined), template literals produce `undefined` in HTML.

**How to avoid:**
1. Validate survey.json structure before generating each diagram type
2. Check for required fields: `if (!survey.backend?.stack) { throw new Error('Missing backend.stack for system map') }`
3. Provide fallback data for optional fields: `const integrations = survey.backend?.integrations || []`
4. After generation, validate output HTML: check file size > 1KB, contains `<!DOCTYPE html>`, no `undefined` strings in content
5. Test with minimal survey.json fixture (missing optional fields) to verify graceful degradation

**Warning signs:**
- Diagram HTML contains literal string "undefined"
- Diagram file is very small (< 500 bytes) - likely missing content
- Diagram shows "No data" or empty sections
- Generation doesn't fail but diagram is useless

### Pitfall 5: Not Handling Wave 2 Resume Correctly
**What goes wrong:** Wave 1 completes, handoff file written, but when /banneker:roadmap runs again, it regenerates Wave 1 diagrams instead of starting Wave 2. Result: wasted context, Wave 2 never completes.

**Why it happens:** Resume detection logic doesn't check diagrammer-state.md or doesn't parse completed wave correctly. Agent restarts from beginning instead of resuming.

**How to avoid:**
1. Step 0 of banneker-diagrammer must always check for state file
2. Parse state file to determine: "Wave 1: complete, Wave 2: not started" means skip to Wave 2
3. Before generating a diagram, check if file already exists: `fs.existsSync('.banneker/diagrams/executive-roadmap.html')`
4. Update state file immediately after each wave completes, not at the end of entire generation
5. Test resume flow: run Wave 1, manually create handoff file, run command again, verify Wave 2 starts

**Warning signs:**
- Diagram files are regenerated even though they already exist
- State file shows "Wave 1: complete" but generation starts from Wave 1 again
- Handoff file is written but never read on resume
- Context budget exhausted before Wave 2 starts (should have resumed)

## Code Examples

Verified patterns from official sources:

### Executive Roadmap HTML Generation
```javascript
// Source: CSS Timeline patterns + Template literals
// https://freefrontend.com/css-timelines/

function generateExecutiveRoadmap(survey) {
  // Extract phases from survey
  const phases = [
    { num: 1, name: 'Package Scaffolding', reqs: 'REQ-PKG-001, REQ-PKG-002' },
    { num: 2, name: 'Survey Pipeline', reqs: 'REQ-SURVEY-001 through REQ-SURVEY-007' },
    { num: 3, name: 'Document Generation', reqs: 'REQ-DOCS-001 through REQ-DOCS-006' },
    { num: 4, name: 'Architecture Diagrams', reqs: 'REQ-DIAG-001 through REQ-DIAG-004' },
    { num: 5, name: 'HTML Appendix', reqs: 'REQ-APPENDIX-001 through REQ-APPENDIX-005' }
  ];

  const css = fs.readFileSync('.banneker/appendix/shared.css', 'utf8');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Roadmap -- ${survey.project.name}</title>
  <style>
    ${css}

    .roadmap-timeline {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 3rem 0;
      overflow-x: auto;
    }

    .milestone {
      flex: 0 0 250px;
      position: relative;
    }

    .milestone::before {
      content: '';
      position: absolute;
      top: 40px;
      left: -1rem;
      width: calc(100% + 2rem);
      height: 2px;
      background: var(--border);
      z-index: -1;
    }

    .milestone:first-child::before { left: 50%; width: 50%; }
    .milestone:last-child::before { width: 50%; }

    .milestone-marker {
      width: 24px;
      height: 24px;
      background: var(--accent-blue);
      border-radius: 50%;
      margin: 0 auto 1rem;
      box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px var(--accent-blue);
    }

    .milestone-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .phase-number {
      color: var(--accent-blue);
      font-weight: bold;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .phase-name {
      color: var(--text-bright);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .phase-requirements {
      color: var(--text-dim);
      font-size: 0.75rem;
    }
  </style>
</head>
<body>
  <div class="page">
    <h1><span style="color: var(--accent-blue);">Executive Roadmap</span> ${survey.project.name}</h1>
    <p style="color: var(--text-dim);">Project phases and milestones</p>

    <div class="roadmap-timeline">
      ${phases.map(phase => `
        <div class="milestone">
          <div class="milestone-marker"></div>
          <div class="milestone-card">
            <div class="phase-number">Phase ${phase.num}</div>
            <div class="phase-name">${phase.name}</div>
            <div class="phase-requirements">${phase.reqs}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync('.banneker/diagrams/executive-roadmap.html', html, 'utf8');
}
```

### Decision Map HTML Generation
```javascript
// Source: CSS Grid layout patterns + Architecture decision visualization
// https://developer.mescius.com/blogs/create-great-diagrams-using-css-grid-layouts

function generateDecisionMap(decisions) {
  // Group decisions by domain
  const domains = {};
  decisions.decisions.forEach(dec => {
    const domain = dec.id.split('-')[1]; // DEC-INFRA-001 -> INFRA
    if (!domains[domain]) domains[domain] = [];
    domains[domain].push(dec);
  });

  const css = fs.readFileSync('.banneker/appendix/shared.css', 'utf8');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Decision Map -- Architecture Decisions</title>
  <style>
    ${css}

    .decision-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      padding: 2rem 0;
    }

    .domain-column {
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .domain-header {
      color: var(--accent-cyan);
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--accent-cyan);
    }

    .decision-node {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .decision-id {
      color: var(--accent-blue);
      font-size: 0.75rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .decision-choice {
      color: var(--text-bright);
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .decision-rationale {
      color: var(--text-dim);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="page">
    <h1><span style="color: var(--accent-cyan);">Decision Map</span> Architecture Decisions</h1>
    <p style="color: var(--text-dim);">All architectural choices organized by domain</p>

    <div class="decision-grid">
      ${Object.entries(domains).map(([domain, decs]) => `
        <div class="domain-column">
          <div class="domain-header">${domain}</div>
          ${decs.map(dec => `
            <div class="decision-node">
              <div class="decision-id">${dec.id}</div>
              <div class="decision-choice">${dec.choice}</div>
              <div class="decision-rationale">${dec.rationale.substring(0, 100)}...</div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync('.banneker/diagrams/decision-map.html', html, 'utf8');
}
```

### System Map with Inline SVG Connectors
```javascript
// Source: Inline SVG techniques + CSS Grid
// https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML

function generateSystemMap(survey) {
  const css = fs.readFileSync('.banneker/appendix/shared.css', 'utf8');

  // Extract components from survey
  const backend = survey.backend?.stack || [];
  const dataStores = survey.backend?.data_stores || [];
  const integrations = survey.backend?.integrations || [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Map -- ${survey.project.name}</title>
  <style>
    ${css}

    .system-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto;
      gap: 3rem;
      padding: 2rem;
      position: relative;
    }

    .component-node {
      background: var(--bg-card);
      border: 2px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      position: relative;
    }

    .component-node h3 {
      color: var(--text-bright);
      margin-bottom: 0.5rem;
    }

    .component-tech {
      color: var(--accent-cyan);
      font-size: 0.85rem;
    }

    .data-layer {
      grid-column: 1 / -1;
      background: var(--bg-card-alt);
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="page-wide">
    <h1><span style="color: var(--accent-green);">System Map</span> ${survey.project.name}</h1>
    <p style="color: var(--text-dim);">Component topology and data flow</p>

    <div class="system-grid">
      <div class="component-node">
        <h3>Backend</h3>
        <div class="component-tech">${backend.slice(0, 3).join(', ')}</div>
      </div>

      <div class="component-node">
        <h3>API Gateway</h3>
        <div class="component-tech">REST / GraphQL</div>
      </div>

      <div class="component-node">
        <h3>Frontend</h3>
        <div class="component-tech">${survey.frontend || 'Web App'}</div>
      </div>

      <div class="data-layer">
        <h4 style="color: var(--accent-orange); margin-bottom: 0.5rem;">Data Layer</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          ${dataStores.map(ds => \`
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem;">
              <strong style="color: var(--text-bright);">\${ds.type}</strong><br>
              <span style="color: var(--text-dim); font-size: 0.85rem;">\${ds.entities?.join(', ') || 'Data store'}</span>
            </div>
          \`).join('')}
        </div>
      </div>

      <!-- SVG connectors overlay -->
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--accent-cyan)" />
          </marker>
        </defs>

        <!-- Backend to Gateway -->
        <path d="M 33%,50% L 50%,50%" stroke="var(--accent-cyan)" stroke-width="2" fill="none" marker-end="url(#arrow)" />

        <!-- Gateway to Frontend -->
        <path d="M 50%,50% L 67%,50%" stroke="var(--accent-cyan)" stroke-width="2" fill="none" marker-end="url(#arrow)" />

        <!-- Backend to Data Layer (curved) -->
        <path d="M 33%,60% Q 33%,80% 50%,85%" stroke="var(--accent-orange)" stroke-width="2" fill="none" marker-end="url(#arrow)" />
      </svg>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync('.banneker/diagrams/system-map.html', html, 'utf8');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External diagram libraries (D3.js, Mermaid) | Self-contained CSS Grid + inline SVG | 2025-2026 | Zero dependencies, portable HTML, smaller file sizes |
| Absolute positioning for layouts | CSS Grid with `grid-template-areas` | 2024-2025 | Responsive, semantic, readable layout definitions |
| Canvas API for diagrams | Inline SVG for static, vanilla JS + SVG DOM for interactive | 2025-2026 | Declarative graphics, inspectable in DevTools, accessible |
| Build tools for inlining | Native template literals with fs.readFileSync | 2023-2024 | No build step, works with zero dependencies |
| jQuery for DOM manipulation | Vanilla JS with modern APIs (querySelector, addEventListener) | 2020-2025 | Native support in all browsers, no library needed |

**Deprecated/outdated:**
- **External CSS links in "self-contained" diagrams:** Violates portability. Inline all CSS.
- **Using deprecated SVG attributes:** Use CSS for styling SVG elements, not attributes like `fill`, `stroke` inline.
- **Fixed pixel widths for components:** Use CSS Grid `minmax()` and `auto-fit` for responsive layouts.

## Open Questions

Things that couldn't be fully resolved:

1. **What is the optimal layout algorithm for decision map with many decisions?**
   - What we know: Grouping by domain (INFRA, CICD, LEGAL) creates logical clusters
   - What's unclear: If a project has 30+ decisions, should we use a tree layout, force-directed graph, or multi-column grid?
   - Recommendation: Start with multi-column grid (simplest, CSS-only). If user feedback indicates confusion, explore force-directed layout in future version with JS.

2. **Should architecture wiring diagram support drag-and-drop repositioning?**
   - What we know: Drag-and-drop requires JavaScript event handling (mousedown, mousemove, mouseup)
   - What's unclear: Does the complexity justify the benefit? Most users will view, not edit.
   - Recommendation: NO for initial version. Focus on click-to-highlight and hover tooltips. Drag-and-drop is a nice-to-have, not critical.

3. **How should we handle very large system maps (10+ components, 20+ connections)?**
   - What we know: CSS Grid can handle any number of components, but visual clarity degrades with too many connectors
   - What's unclear: Should we implement clustering (group related components), zoom/pan (JS required), or multi-page diagrams?
   - Recommendation: Implement zoom/pan in architecture wiring diagram (already has JS). For system map (CSS-only), limit to 9 components max, group others as "Other Services".

4. **What level of detail should executive roadmap show?**
   - What we know: Roadmap should show phases and milestones
   - What's unclear: Should it include task counts, completion percentages, dependencies between phases?
   - Recommendation: Keep it executive-level: phase name, requirements, order. Details belong in planning documents, not diagrams.

## Sources

### Primary (HIGH confidence)
- [CSS Grid for Diagrams](https://developer.mescius.com/blogs/create-great-diagrams-using-css-grid-layouts) - Wijmo official documentation
- [Inline SVG in HTML](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML) - MDN Web Docs
- [CSS Grid vs Flexbox 2026](https://thelinuxcode.com/css-grid-vs-flexbox-in-2026-practical-differences-mental-models-and-real-layout-patterns/) - TheLinuxCode
- [CSS Timeline Patterns](https://freefrontend.com/css-timelines/) - Free Frontend collection
- [HTML/CSS/JS in One File](https://copyprogramming.com/howto/how-to-put-html-css-and-js-in-one-single-file) - Complete 2026 Guide

### Secondary (MEDIUM confidence)
- [CSS-Only Flowcharts](https://lendmeyourear.net/posts/css-only-flowcharts/) - Lee Jordan blog
- [Interactive Architecture Diagrams with SVG](https://github.com/nypl-spacetime/interactive-architecture) - NYPL GitHub
- [Cytoscape.js](https://js.cytoscape.org/) - Graph visualization library (not used but evaluated)
- [Architecture Decision Records](https://adr.github.io/) - ADR documentation patterns
- [System Map Design Tool](https://servicedesigntools.org/tools/system-map) - Service Design Tools
- [JSON to Diagrams](https://dev.to/bugblitz98/how-to-easily-create-diagrams-from-json-data-3lap) - DEV Community

### Tertiary (LOW confidence)
- [JavaScript Diagramming Libraries 2026](https://www.jointjs.com/blog/javascript-diagramming-libraries) - JointJS blog (commercial)
- [CSS Charts Collection](https://www.sliderrevolution.com/resources/css-charts/) - Slider Revolution (marketing-heavy)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - CSS Grid, Flexbox, inline SVG are W3C standards with 97%+ browser support in 2026
- Architecture: HIGH - Self-contained HTML pattern verified across multiple sources, template literal approach is native ES6
- Pitfalls: MEDIUM-HIGH - Common pitfalls derived from web development best practices and personal knowledge, some LOW confidence items flagged

**Research date:** 2026-02-02
**Valid until:** 30 days (2026-03-04) - CSS/SVG standards are stable, but diagram generation patterns and libraries evolve
