# Phase 8: Brownfield Analysis & Audit - Research

**Researched:** 2026-02-02
**Domain:** Codebase analysis, documentation generation, plan evaluation, engineering completeness auditing
**Confidence:** MEDIUM-HIGH

## Summary

Phase 8 implements two distinct capabilities for working with existing codebases and evaluating plan completeness. The `/banneker:document` command analyzes brownfield codebases to produce structured understanding, while `/banneker:audit` evaluates engineering plans against a completeness rubric.

For codebase analysis, the 2026 landscape offers two approaches: (1) AI-friendly codebase packing tools like Repomix that bundle entire repositories into single files optimized for LLM consumption, or (2) AST-based static analysis using tools like ESLint's Espree parser for deeper structural understanding. Given Banneker's zero-dependency constraint and AI-first design, the codebase packing approach is more aligned with the project's architecture—delegate complexity to the LLM rather than implementing custom AST parsing.

For plan auditing, the surveyor agent already defines a completeness rubric with 10 categories (Roles/Actors, Data model, API surface, Authentication/Authorization, Infrastructure, Error handling, Testing strategy, Security considerations, Performance requirements, Deployment process). The audit capability extends this by evaluating whether generated plans adequately address each category, producing a scored coverage report identifying gaps.

Both capabilities follow Banneker's established patterns: skill files as orchestrators, sub-agents for domain logic, markdown state files for resume capability, and JSON output for structured results. The cartographer (document command) reads files using Node.js built-ins and produces codebase understanding documents. The auditor (audit command) reads plan files and rubric definitions, then scores completeness across categories.

**Primary recommendation:** Use file-based codebase scanning with glob patterns for `/banneker:document`, respecting .gitignore via globby library principles (though implemented with Node.js built-ins only). For `/banneker:audit`, implement rubric-based evaluation with scored categories and JSON/Markdown coverage reports.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | File tree traversal, reading source files | Zero-dependency constraint, sufficient for file operations |
| globby patterns | Reference | Glob pattern matching with .gitignore respect | Industry standard for file filtering (concept, not dependency) |
| Markdown output | Format | Human-readable codebase documentation | Matches Banneker's document-first approach |
| JSON scoring | Format | Structured rubric coverage reports | Machine-readable for downstream consumption |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Repomix approach | Pattern | AI-friendly codebase packing methodology | Reference for how to structure codebase summaries |
| ESTree AST | Standard | Abstract syntax tree specification | If deeper code analysis needed beyond file scanning |
| ISO 8601 timestamps | Standard | Date/time formatting in audit reports | Consistent with survey.json metadata |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node.js built-in scanning | Repomix (npm package) | Repomix is comprehensive but adds dependency; built-in scanning sufficient for Banneker's needs |
| Pattern-based file reading | ESLint/Espree AST parsing | AST parsing provides deeper insight but requires complex parsing logic; file-based scanning simpler |
| Markdown coverage reports | HTML dashboards | HTML richer but Markdown portable and LLM-friendly |
| Manual rubric scoring | AI-based evaluation | AI could score plans but introduces variability; explicit rubric rules more deterministic |

**Installation:**
```bash
# No installation needed - all Node.js built-ins
# Repomix and globby concepts inform implementation, not dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
.banneker/
├── codebase-understanding.md    # Output from /banneker:document
├── audit-report.json            # Structured audit results
└── audit-report.md              # Human-readable audit summary

templates/
├── commands/
│   ├── banneker-document.md     # Cartographer orchestrator skill
│   └── banneker-audit.md        # Auditor orchestrator skill
├── agents/
│   ├── banneker-cartographer.md # Codebase analysis agent
│   └── banneker-auditor.md      # Plan evaluation agent
└── config/
    └── completeness-rubric.md   # Engineering completeness categories
```

### Pattern 1: File Tree Traversal with Gitignore Respect
**What:** Recursive directory scanning that respects .gitignore patterns for codebase analysis
**When to use:** `/banneker:document` needs to scan existing codebase without including node_modules, build artifacts
**Example:**
```javascript
// Source: globby principles + Node.js fs.promises
// Conceptual - actual implementation uses agent prompts directing file operations
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

async function scanDirectory(dir, gitignorePatterns = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip .git, node_modules, common build dirs
    if (entry.name.startsWith('.git') ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build') {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await scanDirectory(fullPath, gitignorePatterns));
    } else {
      files.push({ path: fullPath, name: entry.name });
    }
  }

  return files;
}

// In practice, agent instructions guide the AI through this process
// rather than executing JavaScript directly
```

### Pattern 2: Codebase Understanding Document Structure
**What:** Hierarchical markdown document capturing codebase structure, technologies, and patterns
**When to use:** Output format for `/banneker:document` command
**Example:**
```markdown
# Source: Repomix approach + BMAD Method brownfield patterns
# Codebase Understanding: ProjectName

## Project Metadata
- **Type:** [web app/CLI tool/library/API service]
- **Primary Language:** [JavaScript/TypeScript/Python/etc]
- **Framework:** [React/Express/Next.js/etc]
- **Analyzed:** [ISO 8601 timestamp]
- **Total Files:** [count]
- **Total Lines:** [count]

## Directory Structure
```
project-root/
├── src/              # Source code
│   ├── components/  # React components
│   ├── lib/         # Utility libraries
│   └── index.js     # Entry point
├── test/            # Test files
└── package.json     # Dependencies
```

## Technology Stack
- **Frontend:** React 18.2, Tailwind CSS
- **Backend:** Express 4.18, Node.js 18+
- **Database:** PostgreSQL 15
- **Testing:** Jest 29, React Testing Library

## Key Patterns Detected
- **Architecture:** Component-based React with hooks
- **State Management:** Context API + custom hooks
- **Routing:** React Router v6
- **API Communication:** Fetch API with custom wrapper
- **Authentication:** JWT tokens, refresh flow

## Entry Points
- `src/index.js` - Main application entry
- `src/server.js` - Backend server (if backend exists)
- `bin/cli.js` - CLI entry (if CLI tool)

## Configuration Files
- `package.json` - npm dependencies and scripts
- `.env.example` - Environment variable template
- `tsconfig.json` - TypeScript configuration (if TS)

## Notable Patterns
- Custom hooks in `src/hooks/` for shared logic
- API client abstraction in `src/lib/api.js`
- Error boundary components for fault tolerance
```

### Pattern 3: Rubric-Based Plan Evaluation
**What:** Systematic evaluation of plan documents against engineering completeness categories
**When to use:** `/banneker:audit` command evaluating generated plans
**Example:**
```javascript
// Source: Software engineering assessment rubrics + Banneker survey rubric
// Conceptual scoring logic - agent implements via instructions

const COMPLETENESS_RUBRIC = {
  categories: [
    {
      id: 'ROLES-ACTORS',
      name: 'Roles and Actors',
      weight: 1.0,
      criteria: [
        'All user roles identified',
        'System actors documented',
        'Actor capabilities defined'
      ]
    },
    {
      id: 'DATA-MODEL',
      name: 'Data Model',
      weight: 1.5,
      criteria: [
        'Entities and attributes defined',
        'Relationships documented',
        'Constraints specified'
      ]
    },
    {
      id: 'API-SURFACE',
      name: 'API Surface',
      weight: 1.5,
      criteria: [
        'Endpoints defined',
        'Request/response formats documented',
        'Authentication requirements specified'
      ]
    }
    // ... 7 more categories
  ]
};

function scoreCategory(category, planContent) {
  let metCriteria = 0;

  for (const criterion of category.criteria) {
    if (planContainsCriterion(planContent, criterion)) {
      metCriteria++;
    }
  }

  const score = (metCriteria / category.criteria.length) * 100;
  const weighted = score * category.weight;

  return {
    category: category.name,
    score: score.toFixed(1),
    weightedScore: weighted.toFixed(1),
    metCriteria,
    totalCriteria: category.criteria.length,
    gaps: category.criteria.filter(c => !planContainsCriterion(planContent, c))
  };
}
```

### Pattern 4: Coverage Report Output Format
**What:** Dual JSON + Markdown output for audit results
**When to use:** `/banneker:audit` completion, providing both machine and human-readable results
**Example:**
```json
// Source: Code coverage report formats + academic rubric systems
// .banneker/audit-report.json
{
  "audit_metadata": {
    "version": "1.0",
    "audited": "2026-02-02T15:30:00Z",
    "plan_files": [
      ".planning/phases/01-package-scaffolding-installer/01-01-PLAN.md",
      ".planning/phases/01-package-scaffolding-installer/01-02-PLAN.md"
    ]
  },
  "overall_score": {
    "percentage": 78.5,
    "weighted_percentage": 75.2,
    "grade": "B",
    "status": "MOSTLY_COMPLETE"
  },
  "category_scores": [
    {
      "category_id": "ROLES-ACTORS",
      "category_name": "Roles and Actors",
      "score": 100.0,
      "weighted_score": 100.0,
      "weight": 1.0,
      "met_criteria": 3,
      "total_criteria": 3,
      "status": "COMPLETE",
      "gaps": []
    },
    {
      "category_id": "DATA-MODEL",
      "category_name": "Data Model",
      "score": 66.7,
      "weighted_score": 100.0,
      "weight": 1.5,
      "met_criteria": 2,
      "total_criteria": 3,
      "status": "PARTIAL",
      "gaps": ["Constraints not fully specified"]
    }
  ],
  "recommendations": [
    "Add constraint documentation to data model section",
    "Consider adding performance metrics to infrastructure plan",
    "Document error recovery procedures in error handling section"
  ]
}
```

```markdown
# Source: Coverage report markdown formats
# Audit Report

**Audited:** 2026-02-02 15:30:00
**Overall Score:** 78.5% (B)

## Summary

Plans are **MOSTLY COMPLETE** with good coverage across most categories.

| Category | Score | Status | Gaps |
|----------|-------|--------|------|
| Roles and Actors | 100% | ✓ Complete | None |
| Data Model | 66.7% | ⚠ Partial | 1 gap |
| API Surface | 83.3% | ⚠ Partial | 1 gap |
| Authentication/Authorization | 100% | ✓ Complete | None |
| Infrastructure | 50.0% | ✗ Incomplete | 2 gaps |
| Error Handling | 75.0% | ⚠ Partial | 1 gap |
| Testing Strategy | 80.0% | ⚠ Partial | 1 gap |
| Security | 90.0% | ✓ Complete | None |
| Performance | 60.0% | ✗ Incomplete | 2 gaps |
| Deployment | 85.0% | ⚠ Partial | 1 gap |

## Recommendations

1. **High Priority:** Add performance metrics to infrastructure plan
2. **Medium Priority:** Document error recovery procedures
3. **Medium Priority:** Specify database constraints in data model

## Gap Details

### Infrastructure (50.0%)
**Missing:**
- Scalability approach not documented
- Monitoring strategy not defined

### Performance (60.0%)
**Missing:**
- Load testing strategy not mentioned
- Performance SLAs not specified
```

### Pattern 5: State Management for Long-Running Analysis
**What:** Markdown state files tracking codebase scan progress for resume capability
**When to use:** Large codebases (1000+ files) that may exceed context or time limits
**Example:**
```markdown
# Source: Banneker survey state pattern adapted to codebase scanning
# .banneker/state/document-state.md

## Scan Progress

Phase: Analyzing `/src` directory (3 of 8 directories complete)

## Completed Directories

- [x] `/lib` - 45 files, JavaScript utilities (completed 2026-02-02 15:30)
- [x] `/test` - 120 files, Jest test suites (completed 2026-02-02 15:35)
- [x] `/config` - 8 files, Configuration files (completed 2026-02-02 15:36)
- [ ] `/src` - In progress (estimated 200+ files)

## Discovered Patterns

### Technology Stack
- React 18.2 (detected in package.json and imports)
- Express 4.18 (backend server detected)
- PostgreSQL (database connection string in config)

### Architecture Patterns
- Component-based React architecture
- Custom hooks pattern (`src/hooks/*.js`)
- API abstraction layer (`src/lib/api.js`)

## Next Steps

1. Complete `/src` directory scan
2. Analyze `/docs` directory (if exists)
3. Analyze `/scripts` directory (if exists)
4. Compile findings into codebase-understanding.md
5. Delete this state file on completion

## Scan Metadata

- **Started:** 2026-02-02 15:25:00
- **Last updated:** 2026-02-02 15:40:00
- **Files scanned:** 173 of ~400 estimated
- **Runtime:** Claude Code
```

### Anti-Patterns to Avoid
- **Scanning everything:** Don't analyze .git, node_modules, build artifacts. Respect .gitignore and common exclude patterns
- **No progress tracking:** Large codebases (500+ files) need state files for resume capability when context limits hit
- **Binary file reading:** Don't try to analyze images, PDFs, compiled binaries. Focus on source code and text configs
- **Rubric as afterthought:** Define completeness rubric BEFORE writing audit logic, not after
- **Vague audit criteria:** "Testing strategy mentioned" is too vague. Use specific criteria: "Unit test approach documented, E2E test plan defined, coverage targets specified"
- **No weighted scoring:** Some categories (Security, Data Model) matter more than others. Use weights in overall score calculation
- **Missing gap recommendations:** Don't just report gaps - suggest specific actions to fill them

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Glob pattern matching with .gitignore | Custom directory walker with pattern regex | Globby patterns (concept) + Node.js built-ins | .gitignore rules have edge cases (negation, directory-only patterns, wildcards) |
| AST parsing for language analysis | Custom parsers for JS/TS/Python | Repomix approach (file reading + LLM) or reference ESTree spec | Each language has complex grammar; AST parsing is well-solved by language-specific tools |
| Rubric scoring algorithm | Ad-hoc scoring logic | Academic rubric patterns + coverage report standards | Rubric design is a solved problem in education; reuse established patterns |
| File size calculation and token estimation | Byte counting and manual math | Repomix token counting approach (character count * 0.25) | Token counting varies by tokenizer; approximation sufficient for UI |
| Coverage report formatting | Custom markdown table generation | Code coverage report patterns (CodeCoverageSummary, JaCoCo) | Coverage reports have established UX patterns (tables, color coding, percentages) |

**Key insight:** Codebase analysis for brownfield projects is better solved through AI-assisted reading (Repomix approach) than deep static analysis (AST parsing). Banneker's zero-dependency constraint and AI-first design favor simple file reading + LLM comprehension over complex parsing libraries.

## Common Pitfalls

### Pitfall 1: Context Exhaustion on Large Codebases
**What goes wrong:** `/banneker:document` tries to analyze 10,000-file monorepo, hits 200K token context limit mid-analysis, loses partial findings
**Why it happens:** No chunking strategy, attempts to load entire codebase into context at once
**How to avoid:**
- Implement state file tracking which directories have been analyzed
- Process in waves: scan directory tree first, then analyze each subtree
- Write findings incrementally to codebase-understanding.md (append sections)
- Keep only current directory in active context
**Warning signs:** Agent stops responding mid-analysis, "Context length exceeded" errors

### Pitfall 2: Analyzing Generated/Build Files Instead of Source
**What goes wrong:** Cartographer reads `dist/bundle.js` (minified 10MB file) instead of `src/` source, produces useless understanding document
**Why it happens:** No .gitignore respect, scans all files including build artifacts
**How to avoid:**
- Implement .gitignore parsing or hardcode common exclusions (node_modules, dist, build, .git, coverage)
- Check file extensions: prefer .js/.ts/.jsx/.tsx over .min.js
- Skip files over size threshold (e.g., 1MB - likely generated)
**Warning signs:** Codebase understanding document contains minified code, bundler output

### Pitfall 3: Rubric Too Generic to Detect Real Gaps
**What goes wrong:** Auditor scores "Testing strategy" as 100% because plan mentions "use Jest", but doesn't check for unit/integration/E2E breakdown, coverage targets, CI integration
**Why it happens:** Rubric criteria too vague: "Testing strategy mentioned" instead of specific requirements
**How to avoid:**
- Define 3-5 specific criteria per category, not just 1 vague criterion
- Example: Testing category should check: (1) Unit test framework chosen, (2) Integration test approach defined, (3) Coverage targets specified, (4) CI/CD integration planned, (5) Test data strategy documented
- Audit should search for specific terms/patterns, not just category keywords
**Warning signs:** All categories score 90-100% on incomplete plans, no useful gap identification

### Pitfall 4: Audit Report Too Pessimistic or Optimistic
**What goes wrong:** Auditor scores every plan as 40% complete (false negative) or 95% complete (false positive), loses trust
**Why it happens:** Detection heuristics too strict (requires exact keyword match) or too loose (any mention counts)
**How to avoid:**
- Calibrate detection logic with sample plans: test against known complete/incomplete plans
- Use fuzzy matching: if plan discusses "authentication with OAuth" count that for AUTH category even if not exact term
- Weight criteria: some are must-have (score 0 if missing), others are nice-to-have (partial credit)
**Warning signs:** User disagrees with scores: "Plan clearly discusses X but audit says it's missing"

### Pitfall 5: No Actionable Recommendations in Audit Output
**What goes wrong:** Audit report says "Infrastructure category scored 60%" but doesn't tell user what's missing or how to improve
**Why it happens:** Audit only checks presence/absence, doesn't generate suggestions
**How to avoid:**
- For each gap, include specific recommendation: "Add deployment platform choice (AWS/Vercel/Heroku) to infrastructure section"
- Link recommendations to phase/task where gap should be filled
- Prioritize recommendations: HIGH (must fix), MEDIUM (should add), LOW (nice to have)
**Warning signs:** User asks "How do I improve this score?" and can't figure out next steps from report

### Pitfall 6: Binary File Read Failures Crash Analysis
**What goes wrong:** Cartographer tries to read `.png` or `.woff2` file as text, gets garbled output or encoding error, analysis fails
**Why it happens:** No file type filtering, attempts to read all files as UTF-8 text
**How to avoid:**
- Filter by extension: only read text files (.js, .ts, .json, .md, .css, .html, .yaml, etc.)
- Skip binary extensions: .png, .jpg, .pdf, .woff, .ttf, .zip, .tar, .exe, .so, .dylib
- Catch read errors gracefully: log "Skipped [file]: binary/unreadable" and continue
**Warning signs:** "Invalid UTF-8 sequence" errors, analysis stops on media files

### Pitfall 7: Overwriting Existing Codebase Understanding Without Confirmation
**What goes wrong:** User runs `/banneker:document` twice, second run overwrites first analysis, loses manual edits
**Why it happens:** No check for existing codebase-understanding.md, always writes fresh
**How to avoid:**
- Resume detection pattern: check for existing `.banneker/codebase-understanding.md`
- If exists: prompt "Existing analysis found. Overwrite? (y/N)" or "Append new findings? (y/N)"
- Archive pattern: rename old file to `codebase-understanding-[timestamp].md` before new analysis
**Warning signs:** User complaints: "I ran document again and it erased my notes"

### Pitfall 8: Audit Doesn't Account for Plan Dependencies
**What goes wrong:** Auditor scores Phase 1 plan as "incomplete" because it doesn't mention testing strategy, but Phase 2 plan will add tests (documented in roadmap)
**Why it happens:** Audit evaluates each plan file in isolation, doesn't check ROADMAP.md for planned future work
**How to avoid:**
- Audit all plans for a phase together, not individually
- Check ROADMAP.md for deferred items: if rubric category marked "Phase 5" don't penalize Phase 1 for missing it
- Overall score should be cumulative across all completed phases, not per-phase
**Warning signs:** Early phase plans score low but that's expected (foundation first, completeness later)

## Code Examples

Verified patterns from official sources:

### File Tree Scanning with Common Exclusions
```javascript
// Source: globby ignore patterns + Node.js fs.promises
// Conceptual - agent implements via file operation instructions
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const COMMON_EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'out',
  '.DS_Store',
  'thumbs.db'
];

const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz', '.pdf',
  '.exe', '.dll', '.so', '.dylib'
];

async function scanCodebase(rootDir) {
  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip common excludes
      if (COMMON_EXCLUDES.includes(entry.name)) continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        // Skip binary files
        const ext = entry.name.substring(entry.name.lastIndexOf('.'));
        if (BINARY_EXTENSIONS.includes(ext.toLowerCase())) continue;

        files.push({
          path: relative(rootDir, fullPath),
          name: entry.name,
          extension: ext
        });
      }
    }
  }

  await walk(rootDir);
  return files;
}
```

### Rubric Category Definition Structure
```javascript
// Source: Software engineering assessment rubrics + academic grading systems
// Reference structure for completeness-rubric.md

const ENGINEERING_COMPLETENESS_RUBRIC = {
  version: "1.0",
  categories: [
    {
      id: "ROLES-ACTORS",
      name: "Roles and Actors",
      description: "User roles, system actors, and their capabilities",
      weight: 1.0,
      criteria: [
        {
          id: "ROLES-01",
          description: "All human user roles identified and defined",
          check: "Search for: actor, user, role, stakeholder sections"
        },
        {
          id: "ROLES-02",
          description: "System actors (external services, APIs) documented",
          check: "Search for: integration, API, service, system actor"
        },
        {
          id: "ROLES-03",
          description: "Actor capabilities and permissions specified",
          check: "Search for: can, permission, capability, action, CRUD"
        }
      ]
    },
    {
      id: "DATA-MODEL",
      name: "Data Model",
      description: "Data entities, attributes, relationships, constraints",
      weight: 1.5,
      criteria: [
        {
          id: "DATA-01",
          description: "Entities and their attributes defined",
          check: "Search for: entity, model, table, schema, field, attribute"
        },
        {
          id: "DATA-02",
          description: "Relationships between entities documented",
          check: "Search for: relationship, foreign key, references, association"
        },
        {
          id: "DATA-03",
          description: "Constraints and validation rules specified",
          check: "Search for: constraint, validation, required, unique, index"
        }
      ]
    },
    {
      id: "API-SURFACE",
      name: "API Surface",
      description: "API endpoints, request/response formats, authentication",
      weight: 1.5,
      criteria: [
        {
          id: "API-01",
          description: "API endpoints defined with HTTP methods",
          check: "Search for: endpoint, route, GET, POST, PUT, DELETE, API"
        },
        {
          id: "API-02",
          description: "Request/response formats documented",
          check: "Search for: request, response, JSON, body, payload, schema"
        },
        {
          id: "API-03",
          description: "Authentication requirements specified",
          check: "Search for: authentication, authorization, token, JWT, auth"
        }
      ]
    },
    {
      id: "AUTH-AUTHZ",
      name: "Authentication & Authorization",
      description: "User authentication, authorization, and access control",
      weight: 1.5,
      criteria: [
        {
          id: "AUTH-01",
          description: "Authentication mechanism chosen and documented",
          check: "Search for: OAuth, JWT, session, cookie, authentication flow"
        },
        {
          id: "AUTH-02",
          description: "Authorization model defined (RBAC, ABAC, etc)",
          check: "Search for: authorization, permission, role, access control, RBAC"
        },
        {
          id: "AUTH-03",
          description: "Credential storage and security approach specified",
          check: "Search for: password, hash, bcrypt, credential, secret, vault"
        }
      ]
    },
    {
      id: "INFRASTRUCTURE",
      name: "Infrastructure",
      description: "Hosting, deployment, scaling, and infrastructure architecture",
      weight: 1.5,
      criteria: [
        {
          id: "INFRA-01",
          description: "Hosting platform chosen (AWS, Vercel, etc)",
          check: "Search for: hosting, platform, AWS, Vercel, Heroku, cloud, server"
        },
        {
          id: "INFRA-02",
          description: "Scalability approach documented",
          check: "Search for: scaling, horizontal, vertical, load balancer, autoscale"
        },
        {
          id: "INFRA-03",
          description: "Monitoring and observability strategy defined",
          check: "Search for: monitoring, logging, metrics, observability, alert"
        }
      ]
    },
    {
      id: "ERROR-HANDLING",
      name: "Error Handling",
      description: "Error detection, handling, recovery, and user feedback",
      weight: 1.0,
      criteria: [
        {
          id: "ERROR-01",
          description: "Error cases identified for key operations",
          check: "Search for: error case, failure, exception, edge case"
        },
        {
          id: "ERROR-02",
          description: "Error handling strategy documented",
          check: "Search for: error handling, try-catch, error boundary, fallback"
        },
        {
          id: "ERROR-03",
          description: "User-facing error messages and feedback defined",
          check: "Search for: error message, user feedback, notification, toast"
        }
      ]
    },
    {
      id: "TESTING",
      name: "Testing Strategy",
      description: "Unit, integration, E2E testing approach and coverage targets",
      weight: 1.5,
      criteria: [
        {
          id: "TEST-01",
          description: "Unit testing framework and approach chosen",
          check: "Search for: unit test, Jest, Vitest, Mocha, test framework"
        },
        {
          id: "TEST-02",
          description: "Integration testing strategy defined",
          check: "Search for: integration test, API test, database test"
        },
        {
          id: "TEST-03",
          description: "E2E testing approach documented (if applicable)",
          check: "Search for: E2E, end-to-end, Playwright, Cypress, user flow test"
        },
        {
          id: "TEST-04",
          description: "Coverage targets and CI integration specified",
          check: "Search for: coverage, threshold, CI, continuous integration, pipeline"
        }
      ]
    },
    {
      id: "SECURITY",
      name: "Security Considerations",
      description: "Security threats, mitigations, and secure coding practices",
      weight: 2.0,
      criteria: [
        {
          id: "SEC-01",
          description: "Security threats identified (XSS, CSRF, SQL injection, etc)",
          check: "Search for: security, XSS, CSRF, injection, threat, vulnerability"
        },
        {
          id: "SEC-02",
          description: "Mitigation strategies documented for identified threats",
          check: "Search for: mitigation, sanitize, validate, escape, prevention"
        },
        {
          id: "SEC-03",
          description: "Secure coding practices specified",
          check: "Search for: secure coding, input validation, output encoding, HTTPS"
        }
      ]
    },
    {
      id: "PERFORMANCE",
      name: "Performance Requirements",
      description: "Performance targets, optimization strategies, and bottlenecks",
      weight: 1.0,
      criteria: [
        {
          id: "PERF-01",
          description: "Performance targets defined (response time, throughput)",
          check: "Search for: performance, SLA, response time, latency, throughput"
        },
        {
          id: "PERF-02",
          description: "Optimization strategies documented",
          check: "Search for: optimization, caching, CDN, lazy loading, performance"
        },
        {
          id: "PERF-03",
          description: "Potential bottlenecks identified",
          check: "Search for: bottleneck, performance issue, optimization opportunity"
        }
      ]
    },
    {
      id: "DEPLOYMENT",
      name: "Deployment Process",
      description: "Deployment pipeline, environments, rollback, and release process",
      weight: 1.5,
      criteria: [
        {
          id: "DEPLOY-01",
          description: "Deployment environments defined (dev, staging, prod)",
          check: "Search for: environment, dev, staging, production, deployment target"
        },
        {
          id: "DEPLOY-02",
          description: "CI/CD pipeline documented",
          check: "Search for: CI/CD, pipeline, GitHub Actions, deployment automation"
        },
        {
          id: "DEPLOY-03",
          description: "Rollback and release process specified",
          check: "Search for: rollback, release, versioning, deployment strategy, blue-green"
        }
      ]
    }
  ]
};
```

### Audit Scoring Algorithm
```javascript
// Source: Academic rubric scoring + code coverage percentage calculation
// Conceptual logic for auditor agent

function auditPlans(planFiles, rubric) {
  const planContent = planFiles.map(f => readFileSync(f, 'utf-8')).join('\n\n');

  const categoryScores = rubric.categories.map(category => {
    let metCriteria = 0;
    const gaps = [];

    for (const criterion of category.criteria) {
      const met = checkCriterion(planContent, criterion);
      if (met) {
        metCriteria++;
      } else {
        gaps.push(criterion.description);
      }
    }

    const score = (metCriteria / category.criteria.length) * 100;
    const weightedScore = score * category.weight;

    return {
      category_id: category.id,
      category_name: category.name,
      score: parseFloat(score.toFixed(1)),
      weighted_score: parseFloat(weightedScore.toFixed(1)),
      weight: category.weight,
      met_criteria: metCriteria,
      total_criteria: category.criteria.length,
      status: score === 100 ? 'COMPLETE' : score >= 70 ? 'PARTIAL' : 'INCOMPLETE',
      gaps
    };
  });

  // Calculate overall score with weighting
  const totalWeightedScore = categoryScores.reduce((sum, c) => sum + c.weighted_score, 0);
  const totalWeight = rubric.categories.reduce((sum, c) => sum + c.weight, 0);
  const weightedPercentage = totalWeightedScore / totalWeight;

  // Simple percentage (unweighted)
  const totalScore = categoryScores.reduce((sum, c) => sum + c.score, 0);
  const simplePercentage = totalScore / categoryScores.length;

  return {
    audit_metadata: {
      version: "1.0",
      audited: new Date().toISOString(),
      plan_files: planFiles
    },
    overall_score: {
      percentage: parseFloat(simplePercentage.toFixed(1)),
      weighted_percentage: parseFloat(weightedPercentage.toFixed(1)),
      grade: scoreToGrade(weightedPercentage),
      status: scoreToStatus(weightedPercentage)
    },
    category_scores: categoryScores,
    recommendations: generateRecommendations(categoryScores)
  };
}

function checkCriterion(planContent, criterion) {
  // Extract keywords from criterion.check field
  // Example: "Search for: endpoint, route, GET, POST, PUT, DELETE, API"
  const keywords = criterion.check.match(/Search for: (.+)/)?.[1]
    .split(',')
    .map(k => k.trim().toLowerCase());

  if (!keywords) return false;

  const contentLower = planContent.toLowerCase();

  // Criterion met if at least 2 keywords found (fuzzy matching)
  const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
  return matchCount >= Math.min(2, keywords.length);
}

function scoreToGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function scoreToStatus(percentage) {
  if (percentage >= 90) return 'COMPLETE';
  if (percentage >= 70) return 'MOSTLY_COMPLETE';
  if (percentage >= 50) return 'PARTIAL';
  return 'INCOMPLETE';
}

function generateRecommendations(categoryScores) {
  const recommendations = [];

  // High priority: categories with status INCOMPLETE
  const incomplete = categoryScores.filter(c => c.status === 'INCOMPLETE');
  for (const cat of incomplete) {
    for (const gap of cat.gaps) {
      recommendations.push({
        priority: 'HIGH',
        category: cat.category_name,
        action: `Add ${gap.toLowerCase()} to plan documentation`
      });
    }
  }

  // Medium priority: categories with status PARTIAL
  const partial = categoryScores.filter(c => c.status === 'PARTIAL');
  for (const cat of partial) {
    for (const gap of cat.gaps) {
      recommendations.push({
        priority: 'MEDIUM',
        category: cat.category_name,
        action: `Consider adding ${gap.toLowerCase()}`
      });
    }
  }

  return recommendations;
}
```

### Resume State for Codebase Scanning
```markdown
# Source: Banneker survey state pattern
# .banneker/state/document-state.md

## Current Analysis

Scanning: `/src/components` directory (45 of 200 files analyzed)

## Completed Sections

- [x] Project Metadata - Extracted from package.json (completed 2026-02-02 15:30)
- [x] Directory Structure - Tree generated for entire project (completed 2026-02-02 15:32)
- [x] Technology Stack - Identified React 18, Express 4, PostgreSQL 15 (completed 2026-02-02 15:35)
- [ ] Key Patterns - In progress (analyzing component files)

## Discovered Patterns

### Component Patterns (in progress)
- Functional components with hooks (28 files analyzed)
- Custom hooks in `src/hooks/` (useAuth, useApi, useToast)
- Context providers: AuthContext, ThemeContext

### File Organization
- Components: `src/components/*.jsx` (200 files)
- Utilities: `src/lib/*.js` (45 files)
- Tests: `test/**/*.test.js` (120 files co-located)

## Next Steps

1. Complete analysis of remaining component files in `/src/components`
2. Analyze routing structure in `/src/routes`
3. Document API client patterns in `/src/lib/api.js`
4. Write final codebase-understanding.md
5. Delete this state file

## Analysis Metadata

- **Started:** 2026-02-02 15:25:00
- **Last updated:** 2026-02-02 15:40:00
- **Files analyzed:** 173 of 450 total
- **Estimated completion:** 2026-02-02 16:00:00
- **Runtime:** Claude Code
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual codebase documentation | AI-assisted analysis with tools like Repomix | 2025-2026 | LLMs can understand context across thousands of files |
| AST parsing for every language | AI reading source files directly | 2025-2026 | Zero dependencies, works across languages, faster |
| Static analysis only (ESLint, SonarQube) | Hybrid: static + LLM comprehension | 2025-2026 | Pattern detection + semantic understanding |
| Manual plan reviews | Automated rubric-based auditing | 2024-2026 | Consistent evaluation, immediate feedback |
| 100% code coverage obsession | 80% coverage with quality focus | Ongoing (2020s) | Better ROI, focus on critical paths |
| Brownfield via VITA architecture patterns | Spec-Driven Development (Spec Kit) | Nov 2025 | AI-assisted brownfield analysis with constitutions |
| Git-based code search | AI-powered semantic code search | 2025-2026 | Find patterns by meaning, not just keywords |

**Deprecated/outdated:**
- **Heavy AST parsing libraries for codebase analysis:** ESLint/Espree excellent for linting but overkill for documentation. Repomix file-reading approach sufficient with LLM comprehension.
- **100% code coverage as quality metric:** Industry consensus now 80% coverage with focus on critical code paths, not blanket coverage.
- **Manual architecture documentation:** AI can now generate structured documentation from codebases automatically (BMAD Method, Spec Kit).
- **Language-specific documentation generators:** Doxygen (C++), JSDoc (JS), Sphinx (Python) being supplemented/replaced by language-agnostic AI tools.

## Open Questions

Things that couldn't be fully resolved:

1. **How Deep Should Codebase Analysis Go for Banneker's Use Case?**
   - What we know: Full AST parsing provides deep insight, file reading + LLM provides broad understanding
   - What's unclear: Does Banneker need to understand function internals or just high-level architecture?
   - Recommendation: Start with high-level (file structure, imports, exports, technology detection). Add deeper analysis only if users request it.

2. **Should Audit Include Plan Quality or Just Completeness?**
   - What we know: Completeness = "all topics covered", Quality = "topics covered well"
   - What's unclear: Measuring quality requires subjective judgment (is this testing strategy good?)
   - Recommendation: Phase 8 focuses on completeness only. Quality evaluation could be Phase 9+ if needed.

3. **How to Handle Monorepo Codebases with Multiple Projects?**
   - What we know: Single `codebase-understanding.md` may not fit monorepos with 5+ sub-projects
   - What's unclear: Should cartographer generate one document per sub-project or one unified document?
   - Recommendation: Detect monorepo structure (multiple package.json files, lerna.json, nx.json), generate separate understanding documents per project, plus one overview document.

4. **Should Rubric Weights Be User-Configurable?**
   - What we know: Security (weight 2.0) matters more than Performance (weight 1.0) for most projects
   - What's unclear: Do different project types need different rubric weights? (e.g., real-time systems prioritize performance)
   - Recommendation: Start with fixed weights. Add configuration option in Phase 8+ if users need customization.

5. **How to Audit Plans That Reference External Documents?**
   - What we know: Plans may say "See ARCHITECTURE.md for data model" instead of inlining data model
   - What's unclear: Should auditor read referenced documents or just check current plan file?
   - Recommendation: Phase 8 audits plan files only. Phase 9+ could add cross-document reference resolution.

6. **What Granularity for Audit Reports: Per-Phase or Overall?**
   - What we know: Each phase has multiple plan files (01-01-PLAN.md, 01-02-PLAN.md, etc)
   - What's unclear: Report completeness per-plan, per-phase, or across all phases?
   - Recommendation: Default to per-phase aggregation (all plans in phase scored together). Add per-plan detail in report appendix.

## Sources

### Primary (HIGH confidence)
- Repomix Documentation: https://repomix.com/ - AI-friendly codebase packing approach
- Repomix GitHub: https://github.com/yamadashy/repomix - Implementation reference
- Globby Documentation: https://www.npmjs.com/package/globby - .gitignore respect patterns
- Node.js fs.promises API: https://nodejs.org/api/fs.html#promises-api - File operations
- Software Engineering Assessment Rubric: http://ccecc.acm.org/guidance/software-engineering/rubric/ - Rubric categories
- Code Coverage Standards: https://www.atlassian.com/continuous-delivery/software-testing/code-coverage - 80% target

### Secondary (MEDIUM confidence)
- ESLint Espree Parser: https://www.npmjs.com/package/espree - AST parsing reference (not using, but informs alternatives)
- BMAD Method Brownfield Workflow: https://medium.com/@visrow/greenfield-vs-brownfield-in-bmad-method-step-by-step-guide-89521351d81b - document-project pattern
- Spec Kit for Brownfield: https://www.epam.com/insights/ai/blogs/using-spec-kit-for-brownfield-codebase - AI-assisted brownfield analysis
- CodeCoverageSummary: https://github.com/irongut/CodeCoverageSummary - Markdown coverage report format
- Software Testing Documentation: https://testfort.com/blog/important-software-testing-documentation-srs-frs-and-brs - Documentation categories
- Qodo Code Quality Metrics 2026: https://www.qodo.ai/blog/code-quality-metrics-2026/ - Modern metrics trends
- Codebase Digest: https://github.com/kamilstanuch/codebase-digest - Alternative codebase packer (60+ prompts, metrics)
- file-tree-cli: https://github.com/devxprite/file-tree-cli - Modern directory visualization
- SDLC Audit Checklist: https://redwerk.com/blog/sdlc-audit-checklist-auditing-the-software-development-process/ - Audit criteria

### Tertiary (LOW confidence)
- ACCU 2026 Software Engineering Completeness: https://accuconference.org/2025/session/software-engineering-completeness - Conference talk (not published yet)
- Codebase-digest prompts: 60+ coding prompts mentioned but not detailed in search results
- NodeSecure: https://www.in-com.com/blog/top-static-analysis-tools-for-node-js-developers/ - Security-focused analysis (different use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Node.js built-ins documented, Repomix approach verified, globby patterns well-established
- Architecture: MEDIUM-HIGH - File scanning patterns verified, rubric structure from academic sources, coverage reports follow industry standards
- Pitfalls: MEDIUM - Context exhaustion known issue from Banneker survey experience, binary file handling common trap, rubric calibration requires testing
- Code examples: MEDIUM-HIGH - File scanning logic straightforward Node.js, rubric scoring algorithm adapted from academic patterns, needs validation with real plans

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - Repomix is active project, may add features; core patterns stable)
