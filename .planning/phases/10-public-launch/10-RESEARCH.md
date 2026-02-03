# Phase 10: Public Launch - Research

**Researched:** 2026-02-02
**Domain:** npm package publishing and distribution
**Confidence:** HIGH

## Summary

Publishing an npm package in 2026 requires careful attention to new security features, particularly OIDC-based trusted publishing which became generally available in July 2025. The standard approach uses GitHub Actions workflows that authenticate via OpenID Connect instead of long-lived tokens, automatically generating cryptographic provenance attestations via Sigstore.

The critical technical constraint for this project is that **npm trusted publishing requires npm CLI v11.5.1+, which ships with Node.js 24.x**. Using Node 22 or earlier will cause misleading 404 errors during publish because the older npm client doesn't support the OIDC handshake protocol.

For a CLI tool distributed via `npx`, the launch process has four key phases: (1) pre-publish verification with `npm pack --dry-run`, (2) GitHub Actions workflow configuration with OIDC permissions, (3) npmjs.com trusted publisher setup linking the workflow to the package, and (4) post-publish verification by installing from registry in a clean environment.

**Primary recommendation:** Use Node 24.x in GitHub Actions, configure npm trusted publishing on npmjs.com before pushing the version tag, verify package contents with `npm pack --dry-run`, and test end-to-end installation with `npx banneker` in a temporary directory after publish.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm CLI | 11.5.1+ | Package publishing with OIDC | Required for trusted publishing, ships with Node 24.x |
| GitHub Actions | N/A | CI/CD automation | Industry standard, native OIDC support for npm |
| Sigstore | Public instance | Provenance attestation | Automatic with trusted publishing, provides supply chain security |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| auto-changelog | 2.5.0+ | Changelog generation | Already in project devDependencies |
| npm audit signatures | Built-in | Verify provenance | Post-publish verification step |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Trusted publishing (OIDC) | Manual token auth | Tokens are legacy approach, less secure, being phased out |
| npm publish | semantic-release | Automated versioning but adds complexity, overkill for this project |
| GitHub Actions | GitLab CI | GitLab supports trusted publishing but project uses GitHub |

**Installation:**
No additional dependencies needed beyond existing `auto-changelog`.

## Architecture Patterns

### Recommended Pre-Publish Checklist Structure

```
Pre-Publish Phase:
1. Version synchronization (package.json + VERSION file)
2. Test suite validation (all tests green)
3. Package contents verification (npm pack --dry-run)
4. Documentation completeness (README exists with required sections)
5. Metadata validation (package.json has repository, homepage, bugs, keywords)

Publish Configuration:
6. npmjs.com trusted publisher setup (one-time per package)
7. GitHub environment protection (npm-production)
8. Workflow OIDC permissions (id-token: write)

Post-Publish Verification:
9. Registry appearance (check npmjs.com listing)
10. Provenance attestation (verify Sigstore signature)
11. Clean install test (npx in temp directory)
12. Documentation links (verify URLs in published README)
```

### Pattern 1: Trusted Publishing Workflow Configuration

**What:** GitHub Actions workflow that authenticates to npm using OIDC instead of tokens

**When to use:** All npm package publishing in 2026 (tokens are legacy)

**Example:**
```yaml
# Source: https://docs.npmjs.com/trusted-publishers/
# Source: https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write      # For changelog commits
  id-token: write      # CRITICAL: Required for OIDC authentication

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm-production  # Must match npmjs.com config

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog

      - uses: actions/setup-node@v4
        with:
          node-version: 24.x  # Required for npm 11.5.1+
          registry-url: 'https://registry.npmjs.org/'

      - run: npm ci --ignore-scripts
      - run: npm test
      - run: npm publish --ignore-scripts --access public
        # No NODE_AUTH_TOKEN needed - OIDC handles auth
        # --provenance is automatic with trusted publishing
```

### Pattern 2: Version Tag Triggering

**What:** Git tags with 'v' prefix trigger publish workflow

**When to use:** Manual version control (vs automated semantic-release)

**Example:**
```bash
# Source: https://semver.org/
# Source: https://www.gitkraken.com/gitkon/semantic-versioning-git-tags

# 1. Update version in package.json and VERSION file
echo "0.2.0" > VERSION
npm version 0.2.0 --no-git-tag-version

# 2. Commit version bump
git add package.json VERSION
git commit -m "chore: bump version to 0.2.0"

# 3. Create annotated tag with v prefix
git tag -a v0.2.0 -m "Release v0.2.0"

# 4. Push commits and tag
git push origin main
git push origin v0.2.0  # Triggers publish workflow
```

### Pattern 3: Pre-Publish Package Verification

**What:** Preview exactly what files will be published before pushing tag

**When to use:** Every time before publishing (prevents leaked secrets)

**Example:**
```bash
# Source: https://stevefenton.co.uk/blog/2024/01/testing-npm-publish/
# Source: https://snyk.io/blog/best-practices-create-modern-npm-package/

# See what will be included
npm pack --dry-run

# Alternative: see full manifest
npm publish --dry-run

# Check for sensitive files
npm pack --dry-run | grep -E '\.env|credentials|secrets|\.git/'

# Verify files field in package.json matches intent
jq '.files' package.json
```

### Pattern 4: Post-Publish Clean Environment Verification

**What:** Test installed package from registry in isolated environment

**When to use:** After every publish to catch distribution issues

**Example:**
```bash
# Source: https://dev.to/vcarl/testing-npm-packages-before-publishing-h7o
# Source: Testing npm packages before publishing

# Create temporary test directory
cd $(mktemp -d)

# Install and run from registry (not local files)
npx banneker --version

# For CLI tools, test core commands
npx banneker init test-project
cd test-project
ls -la .planning/

# Verify provenance attestation exists
npm view banneker --json | jq '.dist.attestations'
```

### Anti-Patterns to Avoid

- **Manual token management:** Long-lived npm tokens were revoked after supply chain attacks. Use trusted publishing exclusively.
- **Publishing on Node 22 or earlier:** npm v10 lacks OIDC support, causes cryptic 404 errors during publish.
- **Skipping `npm pack --dry-run`:** Accidentally publishing `.env` files or credentials is a common security mistake.
- **Publishing before tests green:** Broken versions are hard to unpublish and damage user trust.
- **Missing README:** npm registry UI looks broken without README, users won't install.
- **Forgetting `--access public`:** First publish of unscoped package defaults to restricted, causing publish failure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Changelog generation | Custom git log parser | auto-changelog (already in project) | Handles conventional commits, versions, links |
| Provenance attestation | Custom signing logic | npm publish with trusted publishing | Automatic Sigstore integration, transparency log |
| Package verification | Custom file list script | `npm pack --dry-run` | Built-in, shows exactly what publish sends |
| Version bumping | Manual package.json editing | `npm version` + manual VERSION sync | Prevents version mismatches |
| Pre-publish checks | Custom validation script | npm pack + npm publish --dry-run | Standard npm tooling, well-tested |

**Key insight:** npm has built-in tooling for all publish operations. Custom scripts add fragility and often miss edge cases (like honoring .npmignore vs .gitignore, or handling scoped packages correctly).

## Common Pitfalls

### Pitfall 1: Node.js Version Mismatch (404 Error)

**What goes wrong:** Publishing on Node 22 with npm v10 causes "404 Not Found" error despite correct setup.

**Why it happens:** npm CLI v10 doesn't support OIDC authentication protocol required by npmjs.com trusted publishing. Registry treats request as anonymous user, anonymous users can't publish (403), but error manifests as 404.

**How to avoid:**
- Use Node.js 24.x in publish workflow (provides npm 11.5.1+)
- Never downgrade node version in publish job
- Test locally: `npm --version` must show 11.5.1 or higher

**Warning signs:**
- "404 Not Found" error during `npm publish` in CI
- Same command works locally but fails in GitHub Actions
- Publish workflow uses `node-version: 22.x` or earlier

**Source:** [NPM Trusted Publishing: The "Weird" 404 Error and the Node.js 24 Fix](https://medium.com/@kenricktan11/npm-trusted-publishers-the-weird-404-error-and-the-node-js-24-fix-a9f1d717a5dd)

### Pitfall 2: Trusted Publisher Configuration Mismatch

**What goes wrong:** Publishing fails with 404 even on Node 24 due to workflow/package mismatch.

**Why it happens:** npm trusted publisher config requires exact match of 4 fields: GitHub org/user, repository name, workflow filename, environment name. Case-sensitive, typos cause silent auth failure.

**How to avoid:**
- Double-check npmjs.com trusted publisher config before first publish
- Workflow filename must include `.yml` extension in config
- Environment name must match workflow `environment:` field exactly
- Repository name is case-sensitive

**Warning signs:**
- 404 error on first publish attempt with trusted publishing
- Config looks correct but publish still fails
- Works in one repo, fails in forked/renamed repo

**Source:** [Trusted publishing for npm packages - npm Docs](https://docs.npmjs.com/trusted-publishers/)

### Pitfall 3: Missing Executable Permissions on bin Scripts

**What goes wrong:** `npx banneker` fails with "permission denied" after install.

**Why it happens:** npm relies on shebang line + file mode to make bin scripts executable. Missing `#!/usr/bin/env node` or non-executable source file breaks this.

**How to avoid:**
- Always include shebang as first line: `#!/usr/bin/env node`
- Make bin script executable before committing: `chmod +x bin/banneker.js`
- Test with `npm pack`, extract tarball, verify permissions in archive
- Verify locally: `npx .` should work before publishing

**Warning signs:**
- `EACCES: permission denied` when running installed command
- Works via `node node_modules/.bin/banneker` but not `npx banneker`
- Works on Mac/Linux, fails on Windows (or vice versa)

**Source:** [Node.js package.json 'bin' Command Not Working?](https://www.codestudy.net/blog/node-package-json-bin-value-command-not-working/)

### Pitfall 4: Incomplete package.json Metadata

**What goes wrong:** Package appears on npm registry with no links, keywords, or context. Users can't find it or trust it.

**Why it happens:** Only `name` and `version` are required to publish, but `repository`, `homepage`, `bugs`, `keywords` are needed for discoverability and professionalism.

**How to avoid:**
- Add `repository` field (enables GitHub link on npm page)
- Add `homepage` field (landing page for users)
- Add `bugs` field (issue tracker URL)
- Add `keywords` array (improves search ranking)
- Add `author` field (shows maintainer)

**Warning signs:**
- Package page on npmjs.com has no "Repository" link
- No keywords means low search visibility
- Users ask "where do I report bugs?" in GitHub issues

**Source:** [package.json - npm Docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)

### Pitfall 5: README Not Included in Published Package

**What goes wrong:** npm registry shows "No README" for published package, looks abandoned.

**Why it happens:** Missing README.md file, or README excluded by .npmignore/.gitignore, or not in `files` whitelist.

**How to avoid:**
- Create README.md in project root
- If using `files` array in package.json, don't need to list README (auto-included)
- Verify with `npm pack --dry-run | grep README`
- Check `.npmignore` doesn't exclude README

**Warning signs:**
- Local README exists but npm page shows "No README"
- `npm pack --dry-run` output doesn't list README.md
- .npmignore has wildcard that catches README

**Source:** [About package README files - npm Docs](https://docs.npmjs.com/about-package-readme-files/)

### Pitfall 6: Accidental Inclusion of Sensitive Files

**What goes wrong:** `.env` files, credentials, or API keys get published to public npm registry.

**Why it happens:** `files` array in package.json is whitelist (safe), but .npmignore/.gitignore are blacklists (easy to miss files). Default behavior includes everything not git-ignored.

**How to avoid:**
- Use `files` array whitelist in package.json (safest approach)
- Run `npm pack --dry-run` before every publish
- Add `.env*`, `credentials*`, `secrets*` to .npmignore
- Use `npm publish --dry-run` to see full publish manifest

**Warning signs:**
- `npm pack --dry-run` shows unexpected files
- File count in tarball seems too high
- .npmignore has gaps

**Source:** [Publishing what you mean to publish - npm Blog](https://blog.npmjs.org/post/165769683050/publishing-what-you-mean-to-publish.html)

### Pitfall 7: Version Tag Already Exists

**What goes wrong:** `git push origin v0.2.0` fails with "tag already exists" error.

**Why it happens:** Failed previous publish attempt left orphaned tag, or tag was pushed but publish failed mid-workflow.

**How to avoid:**
- Check existing tags before creating: `git tag -l "v0.2.0"`
- Delete local tag if needed: `git tag -d v0.2.0`
- Delete remote tag if needed: `git push origin :refs/tags/v0.2.0`
- Use annotated tags with messages for better tracking

**Warning signs:**
- Git refuses to create tag
- Tag exists but no corresponding npm version published
- GitHub shows tag but Actions workflow didn't trigger

**Source:** [Understanding NPM Versioning With Git Tags](https://medium.com/@barberdt/understanding-npm-versioning-with-git-tags-ce669fc93dbb)

## Code Examples

### Complete Trusted Publisher Setup

```bash
# Source: https://docs.npmjs.com/trusted-publishers/
# Source: https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/

# 1. On npmjs.com (web UI, one-time setup per package):
#    - Go to package settings (or create package first)
#    - Navigate to Publishing > Trusted Publishers
#    - Click "Add Trusted Publisher"
#    - Select "GitHub Actions"
#    - Fill in:
#      * GitHub Organization/Username: owner
#      * Repository: banneker
#      * Workflow file: publish.yml
#      * Environment: npm-production
#    - Save configuration

# 2. Verify GitHub Actions workflow has correct permissions
cat .github/workflows/publish.yml | grep -A5 "permissions:"
# Must show:
#   permissions:
#     id-token: write    # Required for OIDC
#     contents: write    # Optional, for changelog commits

# 3. Verify workflow environment matches npmjs.com config
cat .github/workflows/publish.yml | grep "environment:"
# Must exactly match trusted publisher config: npm-production

# 4. Verify Node.js version is 24+
cat .github/workflows/publish.yml | grep "node-version:"
# Must show: node-version: 24.x (or higher)
```

### Pre-Publish Verification Script

```bash
# Source: https://github.com/bahmutov/npm-module-checklist/blob/master/CHECKLIST.md
# Source: https://snyk.io/blog/best-practices-create-modern-npm-package/

# Comprehensive pre-publish checks
echo "=== Pre-Publish Verification ==="

# 1. Version sync check
PACKAGE_VERSION=$(jq -r '.version' package.json)
VERSION_FILE=$(cat VERSION | tr -d '\n')
if [ "$PACKAGE_VERSION" != "$VERSION_FILE" ]; then
  echo "ERROR: Version mismatch!"
  echo "  package.json: $PACKAGE_VERSION"
  echo "  VERSION file: $VERSION_FILE"
  exit 1
fi
echo "✓ Versions synchronized: $PACKAGE_VERSION"

# 2. Test suite
echo "Running tests..."
npm test || exit 1
echo "✓ Tests passed"

# 3. Package contents preview
echo "Package contents:"
npm pack --dry-run

# 4. Sensitive file check
echo "Checking for sensitive files..."
SENSITIVE=$(npm pack --dry-run 2>&1 | grep -E '\.env|credentials|secrets|\.git/' || true)
if [ -n "$SENSITIVE" ]; then
  echo "ERROR: Sensitive files detected:"
  echo "$SENSITIVE"
  exit 1
fi
echo "✓ No sensitive files detected"

# 5. Required metadata check
echo "Checking package.json metadata..."
MISSING=""
[ "$(jq -r '.repository' package.json)" = "null" ] && MISSING="$MISSING repository"
[ "$(jq -r '.homepage' package.json)" = "null" ] && MISSING="$MISSING homepage"
[ "$(jq -r '.bugs' package.json)" = "null" ] && MISSING="$MISSING bugs"
[ "$(jq -r '.keywords' package.json)" = "null" ] && MISSING="$MISSING keywords"
if [ -n "$MISSING" ]; then
  echo "WARNING: Missing recommended fields:$MISSING"
fi

# 6. README check
if [ ! -f README.md ]; then
  echo "ERROR: README.md not found"
  exit 1
fi
echo "✓ README.md exists"

# 7. Check npm CLI version (for local testing)
NPM_VERSION=$(npm --version)
NPM_MAJOR=$(echo $NPM_VERSION | cut -d. -f1)
NPM_MINOR=$(echo $NPM_VERSION | cut -d. -f2)
if [ $NPM_MAJOR -lt 11 ] || ([ $NPM_MAJOR -eq 11 ] && [ $NPM_MINOR -lt 5 ]); then
  echo "WARNING: npm $NPM_VERSION detected, trusted publishing requires 11.5.1+"
  echo "  This check is for local testing only"
  echo "  GitHub Actions workflow uses Node 24.x (npm 11.5.1+)"
fi

echo "=== Verification Complete ==="
echo "Ready to tag and publish v$PACKAGE_VERSION"
```

### Post-Publish Verification Script

```bash
# Source: https://dev.to/vcarl/testing-npm-packages-before-publishing-h7o
# Source: https://docs.npmjs.com/cli/v7/commands/npm-audit

# Wait for registry propagation (usually ~1 minute)
echo "Waiting 60s for registry propagation..."
sleep 60

# 1. Verify package appears on registry
echo "Checking npm registry..."
LATEST_VERSION=$(npm view banneker version 2>/dev/null)
if [ -z "$LATEST_VERSION" ]; then
  echo "ERROR: Package not found on registry"
  exit 1
fi
echo "✓ Published version: $LATEST_VERSION"

# 2. Verify provenance attestation
echo "Checking provenance..."
PROVENANCE=$(npm view banneker --json | jq '.dist.attestations')
if [ "$PROVENANCE" = "null" ]; then
  echo "WARNING: No provenance attestation found"
else
  echo "✓ Provenance attestation present"
fi

# 3. Test clean install in temporary directory
echo "Testing clean install..."
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Install and run
npx banneker --version || {
  echo "ERROR: npx install failed"
  exit 1
}
echo "✓ npx installation successful"

# 4. Test basic functionality
npx banneker init test-project
if [ ! -d test-project/.planning ]; then
  echo "ERROR: banneker init failed to create expected directory"
  exit 1
fi
echo "✓ Basic functionality verified"

# Cleanup
cd -
rm -rf "$TEST_DIR"

echo "=== Post-Publish Verification Complete ==="
```

### README Template for npm CLI Package

```markdown
<!-- Source: https://github.com/bahmutov/npm-module-checklist/blob/master/CHECKLIST.md -->
<!-- Source: https://guypursey.com/blog/201610101930-hygiene-node-package-readmes-versioning-badges -->

# banneker

[![npm version](https://badge.fury.io/js/banneker.svg)](https://www.npmjs.com/package/banneker)
[![CI Status](https://github.com/owner/banneker/workflows/Validate/badge.svg)](https://github.com/owner/banneker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Project planning and documentation pipeline for AI coding assistants

## Installation

No installation required! Run directly with npx:

```bash
npx banneker init my-project
```

Or install globally:

```bash
npm install -g banneker
banneker init my-project
```

## Quick Start

Initialize a new project:

```bash
npx banneker init my-project
cd my-project
```

Your project now has a `.planning/` directory with:
- Project requirements template
- Phase planning structure
- Documentation generation tools

## Command Reference

```bash
# Initialize new project
banneker init <project-name>

# Show version
banneker --version

# Show help
banneker --help
```

## Requirements

- Node.js 18.0.0 or higher
- No runtime dependencies (uses only Node.js built-ins)

## Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Command Reference](docs/commands.md)
- [Configuration](docs/configuration.md)
- [Examples](docs/examples.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## License

MIT © [Author Name]

## Links

- [npm package](https://www.npmjs.com/package/banneker)
- [GitHub repository](https://github.com/owner/banneker)
- [Issue tracker](https://github.com/owner/banneker/issues)
- [Changelog](CHANGELOG.md)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Long-lived npm tokens in CI | OIDC trusted publishing | July 2025 | Eliminates token security risks, required for new packages |
| Manual `--provenance` flag | Automatic provenance with trusted publishing | July 2025 | Supply chain security by default |
| npm v10 or earlier | npm v11.5.1+ (Node 24.x) | Q4 2025 | Required for OIDC authentication |
| Token-based auth | Short-lived OIDC certificates | July 2025 | Cryptographically signed, tamper-evident |
| Optional security features | Provenance as expectation | 2025-2026 | Only 12.6% had provenance in early 2025, becoming standard |

**Deprecated/outdated:**
- **Long-lived npm tokens:** Revoked after Shai-Hulud 2.0 supply chain attack, replaced with short-lived tokens or trusted publishing
- **NPM_TOKEN environment variable in CI:** Still works but legacy, trusted publishing is preferred
- **Publishing without provenance:** Technically possible but considered insecure in 2026
- **Node 22 or earlier for publishing:** npm v10 lacks OIDC support

## Open Questions

1. **Exact npmjs.com UI flow for trusted publisher setup**
   - What we know: Requires GitHub org/user, repository, workflow filename, environment name
   - What's unclear: Can we configure trusted publisher before package exists? Or must we publish v0.1.0 first with token, then configure?
   - Recommendation: Assume we can configure before first publish (npmjs.com allows "reserving" package names). If not, will need manual token for v0.2.0 only, then switch to trusted publishing for future versions.

2. **Provenance visibility to end users**
   - What we know: Provenance attestations are generated and logged in Sigstore/Rekor transparency log
   - What's unclear: Should we advertise provenance in README? Do users know to check it?
   - Recommendation: Include brief mention in README that package includes provenance attestations, link to `npm audit signatures` documentation

3. **Testing provenance locally**
   - What we know: `npm audit signatures` verifies provenance post-publish
   - What's unclear: Can we test provenance generation in CI before publish? Or only visible after registry processes?
   - Recommendation: Don't attempt to verify provenance before publish (requires registry). Add post-publish verification step that checks `npm view banneker --json` for attestations field.

4. **Version 0.x.x semver expectations**
   - What we know: Below 1.0.0, breaking changes are minor bumps (not major)
   - What's unclear: For initial public launch, should we go straight to 1.0.0 instead of 0.2.0?
   - Recommendation: Stay with 0.2.0 as planned (signals pre-1.0 stability expectations), but document in README that API may change before 1.0.0

## Sources

### Primary (HIGH confidence)
- [Trusted publishing for npm packages - npm Docs](https://docs.npmjs.com/trusted-publishers/) - Official npm documentation on OIDC setup
- [npm Blog Changelog: npm trusted publishing with OIDC is generally available](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) - Official release announcement
- [package.json - npm Docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) - Official package.json reference
- [Generating provenance statements - npm Docs](https://docs.npmjs.com/generating-provenance-statements/) - Official provenance documentation
- [OSSF npm Best Practices](https://github.com/ossf/package-manager-best-practices/blob/main/published/npm.md) - OpenSSF security guidelines
- [Semantic Versioning 2.0.0](https://semver.org/) - Official semver specification

### Secondary (MEDIUM confidence)
- [NPM Trusted Publishing: The "Weird" 404 Error and the Node.js 24 Fix](https://medium.com/@kenricktan11/npm-trusted-publishers-the-weird-404-error-and-the-node-js-24-fix-a9f1d717a5dd) - Community troubleshooting (Jan 2026)
- [npm-module-checklist](https://github.com/bahmutov/npm-module-checklist/blob/master/CHECKLIST.md) - Community best practices
- [Best Practices for Creating a Modern npm Package - Snyk](https://snyk.io/blog/best-practices-create-modern-npm-package/) - Security-focused guide
- [Testing NPM Publish With A Dry Run - Steve Fenton](https://stevefenton.co.uk/blog/2024/01/testing-npm-publish/) - Practical guide verified with official docs
- [Introducing npm package provenance - GitHub Blog](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/) - Official provenance announcement
- [Socket: npm Adopts OIDC for Trusted Publishing](https://socket.dev/blog/npm-trusted-publishing) - Technical analysis of trusted publishing

### Tertiary (LOW confidence)
- [Things you need to do for npm trusted publishing to work](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) - Recent blog post, unverified
- Various Medium/DEV.to articles on npm publishing - Used for community patterns, cross-referenced with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official npm documentation and changelog confirm all requirements
- Architecture: HIGH - Patterns derived from official docs and community best practices verified against official sources
- Pitfalls: MEDIUM-HIGH - Node 24 requirement verified via Medium article (Jan 2026) but not yet in official docs; other pitfalls from official sources

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - npm publishing process is stable, but OIDC feature is new and may get updates)
