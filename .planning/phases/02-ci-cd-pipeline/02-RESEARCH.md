# Phase 2: CI/CD Pipeline - Research

**Researched:** 2026-02-02
**Domain:** GitHub Actions CI/CD for Node.js package publishing
**Confidence:** HIGH

## Summary

CI/CD for npm packages in 2026 uses GitHub Actions with two distinct workflows: validation (runs on every push/PR) and publish (runs on version tags). The standard approach leverages GitHub Actions' OIDC-based trusted publishing to npm, eliminating long-lived tokens. Node.js 18+ includes a built-in test runner (node:test) that requires no dependencies and provides coverage reporting through command-line flags.

The validation workflow runs the full test suite using `node --test --experimental-test-coverage` with matrix testing across Node.js versions. The publish workflow triggers on tag pushes matching semantic versioning patterns (v*.*.*), runs validation again as a safety gate, then publishes using `npm publish` with provenance attestation automatically generated via trusted publishing.

Key security practices include: minimal GITHUB_TOKEN permissions (contents: read, id-token: write), `--ignore-scripts` flag during install/publish, separate workflows to prevent publish failures from contaminating CI status, and environment protection rules requiring manual approval before publishing to production npm registry.

**Primary recommendation:** Use separate validation and publish workflows with GitHub Actions environments, OIDC trusted publishing (Node 24.x required), and node:test built-in runner with coverage thresholds.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GitHub Actions | Latest | CI/CD orchestration | Native GitHub integration, free for public repos, OIDC support |
| Node.js built-in test runner | Node 18+ | Unit/integration testing | Zero dependencies, built into Node.js, sufficient for CLI tools |
| actions/checkout | v4 | Repository checkout | Official GitHub action, handles git state correctly |
| actions/setup-node | v4 | Node.js environment setup | Official action, handles npm auth, supports caching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:assert | Built-in | Test assertions | Default assertion library for node:test |
| LCOV reporter | Built-in | Coverage output | Industry standard format for coverage visualization |
| npm ci | Built-in | Deterministic installs | Lock file integrity, faster than npm install |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test | Jest/Vitest | External test frameworks offer more features but add dependencies (violates zero-dependency constraint) |
| GitHub Actions | CircleCI/Travis | Other CI platforms work but GitHub Actions has tighter integration and OIDC trusted publishing support |
| Trusted publishing | Long-lived NPM_TOKEN | Token-based auth simpler but less secure (tokens can leak, no automatic provenance) |

**Installation:**
```bash
# No installation needed - GitHub Actions workflows are YAML files
# Node.js test runner is built-in to Node.js 18+
```

## Architecture Patterns

### Recommended Project Structure
```
.github/
├── workflows/
│   ├── validate.yml          # Runs on push/PR - full test suite
│   └── publish.yml           # Runs on tag - tests then publishes
test/
├── unit/                     # Unit tests for individual modules
├── integration/              # Integration tests for full flows
└── smoke/                    # Smoke tests for end-to-end validation
```

### Pattern 1: Separate Validation and Publish Workflows
**What:** Two distinct workflows - one for validation (always runs), one for publishing (tag-triggered only)
**When to use:** Always. Prevents publish failures from contaminating CI status, allows independent retry of publish without re-running full CI.
**Example:**
```yaml
# Source: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions
# .github/workflows/validate.yml
name: Validate
on:
  push:
    branches: ['main', 'develop']
  pull_request:
    branches: ['main']

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci --ignore-scripts
      - run: node --test --experimental-test-coverage
```

### Pattern 2: Tag-Triggered Publishing with Trusted Publishing
**What:** Publish workflow triggers on semantic version tags (v*), uses OIDC for authentication, includes provenance attestation
**When to use:** For npm package publishing with maximum security
**Example:**
```yaml
# Source: https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.x  # Required for trusted publishing (npm 11.5.1+)
          registry-url: 'https://registry.npmjs.org/'
      - run: npm ci --ignore-scripts
      - run: node --test --experimental-test-coverage
      - run: npm publish
        # Provenance automatically added with trusted publishing
        # No NPM_TOKEN environment variable needed
```

### Pattern 3: Coverage Thresholds with node:test
**What:** Enforce minimum coverage percentages using built-in node:test flags
**When to use:** When 100% coverage of critical paths (installer file-write code) is required
**Example:**
```javascript
// Source: https://nodejs.org/api/test.html
// test/run-with-coverage.js
import { run } from 'node:test';

run({
  files: ['test/**/*.test.js'],
  coverage: true,
  lineCoverage: 100,        // REQ-CICD-004: 100% coverage requirement
  branchCoverage: 100,
  functionCoverage: 100,
  coverageIncludeGlobs: ['src/installer.js', 'src/paths.js'],
  coverageExcludeGlobs: ['test/**/*']
}).pipe(process.stdout);
```

Or via package.json scripts:
```json
{
  "scripts": {
    "test": "node --test",
    "test:coverage": "node --test --experimental-test-coverage",
    "test:coverage-strict": "node test/run-with-coverage.js"
  }
}
```

### Pattern 4: Test Organization for CLI Tools
**What:** Three test tiers - unit (isolated functions), integration (YAML parsing), smoke (full install)
**When to use:** For CLI tools that write to filesystem - validates both logic and end-to-end behavior
**Example:**
```javascript
// Source: https://nodejs.org/api/test.html
// test/unit/installer.test.js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

describe('installer flag parsing', () => {
  it('parses --force flag correctly', () => {
    const args = ['--force', '--runtime', 'claude-code'];
    const flags = parseFlags(args);
    assert.strictEqual(flags.force, true);
    assert.strictEqual(flags.runtime, 'claude-code');
  });
});

// test/integration/skill-validation.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateSkillFile } from '../src/validator.js';

describe('skill file YAML frontmatter validation', () => {
  it('validates required frontmatter fields', async () => {
    const result = await validateSkillFile('skills/gsd-researcher.md');
    assert.strictEqual(result.valid, true);
    assert.ok(result.frontmatter.name);
    assert.ok(result.frontmatter.description);
  });
});

// test/smoke/full-install.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('full install smoke test', () => {
  let tempHome;

  before(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'banneker-test-'));
  });

  after(async () => {
    await rm(tempHome, { recursive: true, force: true });
  });

  it('installs all files to temporary home directory', async () => {
    const { runInstaller } = await import('../src/installer.js');
    await runInstaller({ homeDir: tempHome });

    // Verify files exist
    const claudeDir = join(tempHome, '.claude', 'agents');
    const files = await readdir(claudeDir);
    assert.ok(files.length > 0);
  });
});
```

### Pattern 5: Matrix Testing Across Node Versions
**What:** Test against multiple Node.js versions simultaneously using GitHub Actions matrix strategy
**When to use:** When supporting multiple Node.js LTS versions (18, 20, 22)
**Example:**
```yaml
# Source: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
  fail-fast: false  # Continue testing other versions if one fails

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
      cache: 'npm'
```

### Anti-Patterns to Avoid
- **Single workflow for CI and publish:** Causes publish failures to mark entire CI as failed, obscures validation vs. publish issues
- **Using NPM_TOKEN secrets in 2026:** Long-lived tokens are security risk, use OIDC trusted publishing instead
- **Omitting `--ignore-scripts` on install/publish:** Malicious packages can steal credentials during install or inject code during publish
- **Publishing without re-running tests:** Tag could reference old commit, always validate before publish
- **Not specifying `registry-url` in setup-node:** Causes authentication failures even with trusted publishing
- **Using `npm publish --provenance` with trusted publishing:** Provenance is automatic with trusted publishing, flag is redundant

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test framework | Custom test runner | node:test (built-in) | Node 18+ includes full-featured test runner with mocking, coverage, reporters |
| npm authentication | Manual .npmrc management | actions/setup-node with registry-url | Action handles .npmrc creation, supports both token and OIDC auth |
| Dependency caching | Manual cache key calculation | setup-node cache parameter | Action handles cache keys based on package-lock.json hash automatically |
| Version bumping | Custom git tag scripts | Manual tagging or semantic-release | Manual tagging simple for explicit control, semantic-release for automation |
| Coverage reporting | Custom V8 coverage parsing | node:test --experimental-test-coverage | Built-in coverage with thresholds, LCOV output, no external dependencies |
| Workflow permissions | Broad read-write defaults | Explicit minimal permissions | GITHUB_TOKEN defaults too permissive, explicit permissions prevent privilege escalation |

**Key insight:** Node.js 18+ and GitHub Actions provide comprehensive CI/CD capabilities without external dependencies. For a zero-dependency CLI tool, using built-in features maintains consistency with project constraints.

## Common Pitfalls

### Pitfall 1: Trusted Publishing Configuration Mismatch
**What goes wrong:** Publish fails with authentication errors despite correct npm configuration on npmjs.com
**Why it happens:** Workflow filename, repository name, or environment name in npmjs.com trusted publisher settings doesn't exactly match GitHub Actions workflow (all fields are case-sensitive)
**How to avoid:**
- Use exact workflow filename including `.yml` extension
- Verify repository name format is `owner/repo`
- If using environment protection, specify environment name exactly as defined in GitHub settings
- Test with `workflow_dispatch` trigger before relying on tag triggers
**Warning signs:** Error messages like "Unable to authenticate with npm" despite id-token: write permission being set

### Pitfall 2: Node Version Too Old for Trusted Publishing
**What goes wrong:** Trusted publishing silently falls back to token auth or fails with cryptic errors
**Why it happens:** Trusted publishing requires npm client 11.5.1+, which ships with Node 24.x. Older Node versions don't support OIDC token generation for npm.
**How to avoid:**
- Use `node-version: 24.x` (or later) in publish workflow
- Can use older versions (18.x, 20.x) in validation workflow
- Document version requirements in README
**Warning signs:** Publish succeeds but package doesn't show provenance attestation on npmjs.com

### Pitfall 3: Missing --ignore-scripts Flag
**What goes wrong:** Malicious packages in dependency tree can steal NPM_TOKEN or inject code during install/publish lifecycle hooks
**Why it happens:** npm runs lifecycle scripts (preinstall, postinstall, prepublish) by default, giving arbitrary code execution to all dependencies
**How to avoid:**
- Always use `npm ci --ignore-scripts` in CI
- Always use `npm publish --ignore-scripts` when publishing
- Only run install without flag in local development where you trust dependencies
**Warning signs:** Unexpected network requests during install, slow install times due to script execution

### Pitfall 4: Coverage Not Enforcing 100% on Critical Paths
**What goes wrong:** Installer code paths (file writes to ~/.claude/) ship untested, causing production failures
**Why it happens:** Default `node --test --experimental-test-coverage` reports coverage but doesn't enforce thresholds
**How to avoid:**
- Use coverage threshold configuration with `run()` API or separate test script
- Specifically include installer and paths modules in coverage globs
- Use coverage comments to explicitly exclude non-critical error handling: `/* node:coverage ignore next */`
**Warning signs:** Coverage report shows <100% line coverage for src/installer.js or src/paths.js

### Pitfall 5: Publishing on Wrong Branch
**What goes wrong:** Development branch changes get published to npm, breaking production users
**Why it happens:** Tag-triggered workflow doesn't verify which branch the tag is on
**How to avoid:**
- Add environment protection rules requiring approval
- Use `if: github.ref == 'refs/heads/main'` conditions (though tags aren't on branches)
- Better: Use environments and require manual approval for npm publishing
- Best: Only create version tags from main branch (enforce via branch protection)
**Warning signs:** Tags exist on feature branches, published versions contain unreleased features

### Pitfall 6: Workflow Permission Defaults Too Broad
**What goes wrong:** GITHUB_TOKEN has write access to repository, allowing workflow to push commits or modify issues
**Why it happens:** Repositories created before Feb 2023 default to read-write permissions; validation workflow only needs read
**How to avoid:**
- Set repository-level default to "Read repository contents and packages permissions"
- Explicitly set `permissions:` in every workflow
- Use `permissions: {}` then add only what's needed per job
- Validation needs: `contents: read`
- Publish needs: `contents: read, id-token: write`
**Warning signs:** Security alerts about over-privileged tokens, 86% of workflows don't limit token permissions

### Pitfall 7: Test File Discovery Failures
**What goes wrong:** `node --test` doesn't find test files, CI reports "no tests found"
**Why it happens:** Test files don't match default glob patterns or are outside default search paths
**How to avoid:**
- Use standard naming: `*.test.js`, `*-test.js`, `*_test.js` or place in `test/` directory
- Default patterns search from current directory downward
- Explicitly specify glob if non-standard: `node --test "**/*.spec.js"`
- Node.js built-in test runner does NOT search in node_modules by default (correct behavior)
**Warning signs:** `node --test` outputs "no tests found" but test files exist

### Pitfall 8: Missing registry-url in setup-node
**What goes wrong:** npm publish fails with authentication errors even with trusted publishing configured
**Why it happens:** setup-node only writes .npmrc authentication configuration if `registry-url` is explicitly specified
**How to avoid:**
- Always include `registry-url: 'https://registry.npmjs.org/'` in setup-node step
- Required even though it's the default registry
- Without this, setup-node skips .npmrc creation entirely
**Warning signs:** No .npmrc file created in runner, authentication errors despite correct permissions

## Code Examples

Verified patterns from official sources:

### Complete Validation Workflow
```yaml
# Source: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
name: Validate

on:
  push:
    branches: ['main', 'develop']
  pull_request:
    branches: ['main']

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
      fail-fast: false

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Run tests with coverage
        run: node --test --experimental-test-coverage

      - name: Run smoke tests
        run: node test/smoke/full-install.test.js
```

### Complete Publish Workflow with Trusted Publishing
```yaml
# Source: https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:  # Allow manual trigger for testing

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm-production  # Requires manual approval

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.x
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Run full test suite
        run: node --test --experimental-test-coverage

      - name: Publish to npm
        run: npm publish --ignore-scripts --access public
        # No NPM_TOKEN needed - uses OIDC trusted publishing
        # Provenance attestation automatically generated
```

### Test with Coverage Thresholds
```javascript
// Source: https://nodejs.org/api/test.html
// scripts/test-with-thresholds.js
import { run } from 'node:test';

const result = await run({
  files: [
    'test/unit/**/*.test.js',
    'test/integration/**/*.test.js',
    'test/smoke/**/*.test.js'
  ],
  coverage: true,
  lineCoverage: 100,
  branchCoverage: 100,
  functionCoverage: 100,
  coverageIncludeGlobs: [
    'src/installer.js',
    'src/paths.js',
    'src/validator.js'
  ],
  coverageExcludeGlobs: [
    'test/**/*',
    'src/cli.js'  // CLI entry point has minimal logic
  ],
  concurrency: 4,
  isolation: 'process'
});

result.pipe(process.stdout);
```

### Unit Test with Mocking
```javascript
// Source: https://nodejs.org/api/test.html
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { copyFile } from 'node:fs/promises';

describe('installer file operations', () => {
  it('checks permissions before writing', async (t) => {
    // Mock filesystem functions
    const mockAccess = t.mock.fn(async () => {
      throw { code: 'EACCES' };
    });

    t.mock.method(await import('node:fs/promises'), 'access', mockAccess);

    const { installFiles } = await import('../src/installer.js');

    await assert.rejects(
      () => installFiles({ homeDir: '/root' }),
      { code: 'EACCES', message: /permission denied/i }
    );

    assert.strictEqual(mockAccess.mock.callCount(), 1);
  });

  it('prompts before overwriting existing files', async (t) => {
    const mockPrompt = t.mock.fn(async () => ({ overwrite: false }));

    const { installFiles } = await import('../src/installer.js');

    const result = await installFiles({
      homeDir: '/tmp/test',
      prompt: mockPrompt,
      force: false
    });

    assert.strictEqual(result.skipped.length, 5);
    assert.strictEqual(mockPrompt.mock.callCount(), 5);
  });
});
```

### Smoke Test with Temporary Directory
```javascript
// Source: https://nodejs.org/api/test.html
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('full install smoke test', () => {
  let tempHome;

  before(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'banneker-smoke-'));
  });

  after(async () => {
    await rm(tempHome, { recursive: true, force: true });
  });

  it('runs npx banneker install in clean directory', async () => {
    // Set HOME to temp directory
    const env = { ...process.env, HOME: tempHome };

    // Run installer (assuming we're in package root)
    await execFileAsync('node', ['src/cli.js', 'install'], { env });

    // Verify .claude/agents directory exists
    const agentsDir = join(tempHome, '.claude', 'agents');
    const files = await readdir(agentsDir);

    // Should have installed all agent files
    assert.ok(files.length > 0, 'No agent files installed');
    assert.ok(files.includes('gsd-phase-researcher.md'), 'Missing gsd-phase-researcher.md');

    // Verify BANNEKER_FILES manifest exists
    const manifestPath = join(tempHome, '.claude', 'BANNEKER_FILES');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const installedFiles = manifestContent.split('\n').filter(Boolean);

    assert.strictEqual(installedFiles.length, files.length);
  });

  it('validates skill file YAML frontmatter', async () => {
    const agentsDir = join(tempHome, '.claude', 'agents');
    const files = await readdir(agentsDir);

    for (const file of files) {
      const content = await readFile(join(agentsDir, file), 'utf-8');

      // Check for YAML frontmatter
      assert.ok(content.startsWith('---\n'), `${file} missing frontmatter start`);
      assert.ok(content.includes('\n---\n'), `${file} missing frontmatter end`);

      // Extract and parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      assert.ok(frontmatterMatch, `${file} invalid frontmatter format`);

      const frontmatter = frontmatterMatch[1];
      assert.ok(frontmatter.includes('name:'), `${file} missing name field`);
      assert.ok(frontmatter.includes('description:'), `${file} missing description field`);
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Long-lived NPM_TOKEN secrets | OIDC trusted publishing | 2023-2024 | No secrets to rotate, provenance attestation automatic, requires Node 24.x |
| Jest/Mocha test frameworks | node:test built-in runner | Node 18 (2022) | Zero dependencies, sufficient for CLI tools, built-in coverage |
| Manual .npmrc management | actions/setup-node registry-url | Always available | Automatic auth configuration, supports both token and OIDC |
| npm install | npm ci | npm 5.7.0 (2018) | Deterministic installs, faster in CI, lock file integrity |
| Combined CI/publish workflow | Separate workflows | Best practice evolution | Clearer failure isolation, independent retry capability |
| Default GITHUB_TOKEN permissions | Explicit minimal permissions | Feb 2023 default change | Older repos still read-write, new repos read-only by default |

**Deprecated/outdated:**
- **NPM automation tokens for CI:** Replaced by OIDC trusted publishing (more secure, no token rotation)
- **npm publish without --provenance:** Should use provenance (automatic with trusted publishing)
- **set-output command in actions:** Replaced by $GITHUB_OUTPUT environment file (deprecated Oct 2022)
- **actions/setup-node@v3:** Use v4 (better caching, OIDC support improvements)

## Open Questions

Things that couldn't be fully resolved:

1. **Trusted Publishing Environment Name Requirement**
   - What we know: npmjs.com trusted publisher config has optional "environment" field
   - What's unclear: Whether environment is required or optional for basic trusted publishing setup
   - Recommendation: Start without environment (simpler), add environment protection with approval gates for production use case (recommended for packages writing to ~/)

2. **Coverage Threshold Enforcement in CI**
   - What we know: node:test supports coverage thresholds via `run()` API, process exits with code 1 on failure
   - What's unclear: Whether `node --test --experimental-test-coverage` command-line has threshold flags or requires programmatic API
   - Recommendation: Use programmatic API via scripts/test-with-thresholds.js for threshold enforcement (verified approach)

3. **Smoke Test Directory Cleanup**
   - What we know: Smoke tests need temporary home directory, should clean up after
   - What's unclear: Whether failed tests prevent cleanup, leaving temp directories
   - Recommendation: Use `after()` hooks for cleanup (runs even on test failure), add CI job cleanup step as backup

4. **Version Tag Creation Automation**
   - What we know: Tag push triggers publish workflow
   - What's unclear: Whether to automate tag creation (semantic-release) or keep manual (npm version)
   - Recommendation: Start with manual tagging (`npm version [major|minor|patch]` then `git push --tags`) for explicit control, matches zero-dependency philosophy

## Sources

### Primary (HIGH confidence)
- [GitHub Actions - Building and Testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) - Validation workflow patterns
- [GitHub Actions - Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions) - Triggers, permissions, job structure
- [GitHub Actions - Publishing Node.js Packages](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages) - npm publishing patterns
- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html) - node:test API, coverage flags, test organization
- [Bootstrapping NPM Provenance with GitHub Actions](https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html) - Trusted publishing setup (Jan 2026)

### Secondary (MEDIUM confidence)
- [Snyk - GitHub Actions to Securely Publish npm Packages](https://snyk.io/blog/github-actions-to-securely-publish-npm-packages/) - Security best practices
- [GitHub Actions Security Best Practices](https://www.stepsecurity.io/blog/github-actions-security-best-practices) - Permissions and security
- [npm Docs - Generating Provenance Statements](https://docs.npmjs.com/generating-provenance-statements/) - Provenance attestation details
- [GitHub Actions Permissions Guide](https://graphite.com/guides/github-actions-permissions) - Least privilege patterns

### Tertiary (LOW confidence - search results only)
- Multiple GitHub Actions marketplace actions for semantic versioning (not needed for manual approach)
- Community discussions on trusted publishing configuration issues (helpful for troubleshooting)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - GitHub Actions and node:test are official, documented, current
- Architecture: HIGH - Patterns from official docs and recent 2026 article on trusted publishing
- Pitfalls: MEDIUM-HIGH - Mix of official docs (HIGH) and community experience (MEDIUM)

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - GitHub Actions and Node.js test runner are stable, minimal API churn)
