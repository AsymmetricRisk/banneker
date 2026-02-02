# Phase 1: Package Scaffolding & Installer - Research

**Researched:** 2026-02-02
**Domain:** npm package development, Node.js CLI installers, zero-dependency tooling
**Confidence:** HIGH

## Summary

Building an npm package installer with zero runtime dependencies requires using Node.js built-in modules exclusively. The standard approach uses `package.json` bin field configuration with npx for execution, Node.js built-ins (`fs`, `path`, `os`, `readline/promises`, `util.parseArgs`) for all functionality, and careful cross-platform handling for file paths and home directory resolution.

The installer pattern is well-established: use `os.homedir()` for home directory detection, `readline/promises` for interactive prompts, `util.parseArgs()` (stable since Node 20.0.0) for flag parsing, `fs.cpSync()` with `recursive: true` for directory copying, and `fs.existsSync()` for version detection. For uninstallation, use `fs.rmSync()` with careful file tracking to avoid deleting non-Banneker files.

Key considerations include cross-platform file path construction with `path.join()`, executable permissions via shebang (`#!/usr/bin/env node`), graceful Ctrl-C handling via SIGINT listeners, and pre-1.0 semantic versioning (0.2.0 indicates API instability). The constraint of zero dependencies is entirely achievable—all required functionality exists in Node.js built-ins as of Node 18+.

**Primary recommendation:** Use Node.js built-in modules exclusively (node:fs, node:path, node:os, node:readline/promises, node:util) with util.parseArgs() for flag parsing, readline/promises for prompts, and fs.cpSync/rmSync for file operations. Target Node 18+ LTS for stable APIs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 18+ LTS | All functionality | Zero-dependency constraint requires built-ins only |
| node:fs | Built-in | File operations (copy, remove, read) | Standard for file system manipulation |
| node:path | Built-in | Cross-platform path construction | Handles Windows/Unix path separator differences |
| node:os | Built-in | Home directory detection | Cross-platform user home resolution |
| node:readline/promises | Built-in (stable since v17) | Interactive prompts | Native promise-based CLI input |
| node:util | Built-in | Argument parsing | util.parseArgs() stable since Node 20.0.0 |
| node:process | Built-in | CLI arguments, exit codes, signals | Standard for process control |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| child_process | Built-in | (Not needed for Phase 1) | Future phases if spawning processes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| util.parseArgs | commander, yargs, minimist | Third-party libraries offer richer features but violate zero-dependency constraint |
| readline/promises | inquirer, prompts | Better UX but adds dependencies |
| Manual flag parsing | process.argv manipulation | More code but avoids parseArgs (only needed for Node <18) |

**Installation:**
```bash
# No installation needed - all built-ins
# Requires Node.js 18+ for util.parseArgs stability
node --version  # Verify >= 18.0.0
```

## Architecture Patterns

### Recommended Project Structure
```
banneker/
├── bin/
│   └── banneker.js          # CLI entry point (shebang, calls installer)
├── lib/
│   ├── installer.js         # Main installer logic
│   ├── uninstaller.js       # Uninstall logic
│   ├── prompts.js           # Interactive prompt functions
│   ├── flags.js             # Flag parsing with util.parseArgs
│   └── file-operations.js   # File copy/remove utilities
├── templates/
│   ├── commands/            # Skill command files to install
│   └── config/              # Reference/template files
├── package.json             # bin field points to bin/banneker.js
└── VERSION                  # Version file (copied during install)
```

### Pattern 1: npx Execution with bin Field
**What:** Configure package.json bin field to enable `npx banneker` execution
**When to use:** All npm CLI tools designed for npx usage
**Example:**
```json
{
  "name": "banneker",
  "version": "0.2.0",
  "bin": {
    "banneker": "./bin/banneker.js"
  },
  "type": "module"
}
```

**Entry point shebang:**
```javascript
#!/usr/bin/env node
// Source: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
import { installer } from '../lib/installer.js';
installer();
```

### Pattern 2: Cross-Platform Home Directory Resolution
**What:** Use os.homedir() for user home directory, falling back to environment variables
**When to use:** Any installer writing to user home directory
**Example:**
```javascript
// Source: https://nodejs.org/api/os.html
import os from 'node:os';
import path from 'node:path';

const homeDir = os.homedir();
// POSIX: /home/username
// Windows: C:\Users\username

const targetDir = path.join(homeDir, '.claude', 'skills');
// ALWAYS use path.join() for cross-platform paths
```

### Pattern 3: Interactive Prompts with readline/promises
**What:** Use readline/promises for interactive CLI prompts with async/await
**When to use:** Runtime selection, confirmation prompts
**Example:**
```javascript
// Source: https://nodejs.org/api/readline.html
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

const runtime = await rl.question('Select runtime (1) Claude Code (2) OpenCode (3) Gemini: ');
rl.close();
```

### Pattern 4: Flag Parsing with util.parseArgs
**What:** Use util.parseArgs() (stable since Node 20.0.0) for CLI flag parsing
**When to use:** Non-interactive mode (CI, dotfiles)
**Example:**
```javascript
// Source: https://nodejs.org/api/util.html
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    claude: { type: 'boolean', short: 'c' },
    opencode: { type: 'boolean', short: 'o' },
    gemini: { type: 'boolean', short: 'g' },
    global: { type: 'boolean' },
    local: { type: 'boolean' },
    uninstall: { type: 'boolean', short: 'u' }
  },
  strict: true,
  allowPositionals: false
});

if (values.claude) {
  // Install for Claude Code
}
```

### Pattern 5: Recursive Directory Copying
**What:** Use fs.cpSync() with recursive: true for copying template directories
**When to use:** Installing skill files and templates
**Example:**
```javascript
// Source: https://nodejs.org/api/fs.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, '..', 'templates', 'commands');
const targetDir = path.join(homeDir, '.claude', 'skills');

fs.cpSync(templateDir, targetDir, {
  recursive: true,
  force: false,  // Don't overwrite without checking
  errorOnExist: false
});
```

### Pattern 6: Safe File Removal with Tracking
**What:** Track installed files via VERSION file, remove only Banneker-owned files
**When to use:** Uninstallation without affecting user files
**Example:**
```javascript
// Source: Safe uninstall pattern from research
import fs from 'node:fs';
import path from 'node:path';

// Read VERSION file to confirm Banneker installation
const versionFile = path.join(targetDir, 'VERSION');
if (!fs.existsSync(versionFile)) {
  console.error('No Banneker installation found');
  process.exit(1);
}

// List of files Banneker owns (from installer manifest)
const bannekerFiles = [
  'gsd-discuss-phase.md',
  'gsd-plan-phase.md',
  // ... other skill files
  'VERSION'
];

// Remove only Banneker files
bannekerFiles.forEach(file => {
  const filePath = path.join(targetDir, file);
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
});
```

### Pattern 7: Graceful SIGINT Handling
**What:** Handle Ctrl-C gracefully during interactive prompts
**When to use:** All interactive CLI tools
**Example:**
```javascript
// Source: https://nodejs.org/api/process.html
process.on('SIGINT', () => {
  console.log('\nInstallation cancelled by user');
  process.exit(130);  // 128 + SIGINT(2)
});
```

### Anti-Patterns to Avoid
- **Manual path concatenation with "/"**: Breaks on Windows. Always use `path.join()` or `path.resolve()`
- **String-based process.argv parsing**: Use `util.parseArgs()` for robustness and validation
- **fs.rmSync() without existsSync check**: Can throw errors on missing files
- **process.exit() in library code**: Set `process.exitCode` instead and return
- **Hardcoded home directory paths**: Use `os.homedir()` for cross-platform compatibility
- **Third-party dependencies for simple tasks**: Violates zero-dependency constraint unnecessarily

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI flag parsing | Custom --flag parser with regex | util.parseArgs() | Handles edge cases (--flag=value, -abc grouping, validation, errors) |
| Interactive prompts | Custom stdin reading | readline/promises | Handles line buffering, encoding, cross-platform newlines, Ctrl-C |
| Path construction | String concatenation with "/" or "\\" | path.join() / path.resolve() | Handles Windows vs Unix separators, normalizes paths |
| Home directory | process.env.HOME or process.env.USERPROFILE | os.homedir() | Falls back correctly on all platforms, handles edge cases |
| Recursive directory copy | Manual recursion with fs.readdirSync | fs.cpSync({ recursive: true }) | Handles symlinks, permissions, timestamps, errors |
| Directory removal | Manual recursion with fs.rmdirSync | fs.rmSync({ recursive: true }) | Handles file locks, retries, EBUSY errors |

**Key insight:** Node.js built-ins have matured significantly. Modern Node (18+) provides stable, well-tested APIs for common CLI patterns. Avoid reimplementing these—they handle edge cases you haven't thought of (EPERM on Windows, symlinks, Unicode filenames, etc.).

## Common Pitfalls

### Pitfall 1: Ignoring Cross-Platform Path Separators
**What goes wrong:** Hardcoded "/" or "\\" in paths breaks on opposite platform (Windows vs Unix)
**Why it happens:** Development on single platform, testing only on that platform
**How to avoid:** ALWAYS use `path.join()` for path construction. Never concatenate strings with separators
**Warning signs:** Path errors on Windows but works on macOS/Linux (or vice versa)

### Pitfall 2: Assuming os.homedir() is Writable
**What goes wrong:** Installation fails if home directory is read-only or doesn't exist
**Why it happens:** Rare edge case (corporate environments, container systems)
**How to avoid:** Check write permissions with `fs.accessSync()` or catch EACCES errors
**Warning signs:** Installation works in dev but fails in production/CI

### Pitfall 3: Not Handling Existing Files During Install
**What goes wrong:** Overwriting user's custom skill files without warning
**Why it happens:** Using `fs.cpSync({ force: true })` without checking for existing files
**How to avoid:** Check for VERSION file first. If exists, prompt before overwriting
**Warning signs:** User complaints about lost customizations after reinstall

### Pitfall 4: Incomplete Uninstallation (Orphaned Files)
**What goes wrong:** Uninstaller removes some files but leaves others, causing corruption
**Why it happens:** No manifest of installed files, relying on assumptions
**How to avoid:** Maintain a list of installed files (in VERSION file or separate manifest)
**Warning signs:** "File not found" errors after uninstall + reinstall

### Pitfall 5: Missing Shebang or Incorrect Permissions
**What goes wrong:** `npx banneker` fails with "permission denied" or "command not found"
**Why it happens:** Forgot `#!/usr/bin/env node` shebang or file isn't executable
**How to avoid:** Always include shebang as first line. npm handles chmod during publish
**Warning signs:** Works in dev but fails after npm publish

### Pitfall 6: Using util.parseArgs on Old Node Versions
**What goes wrong:** `util.parseArgs is not a function` error on Node <16.17
**Why it happens:** util.parseArgs was experimental until Node 18, stable in Node 20
**How to avoid:** Specify `"engines": { "node": ">=18.0.0" }` in package.json or polyfill
**Warning signs:** Works on your machine (Node 20+) but fails in CI (older Node)

### Pitfall 7: Not Handling Ctrl-C During Prompts
**What goes wrong:** Process hangs or leaves terminal in bad state after Ctrl-C
**Why it happens:** No SIGINT listener, readline doesn't clean up
**How to avoid:** Add `process.on('SIGINT', ...)` handler that closes readline and exits gracefully
**Warning signs:** Terminal requires `reset` command after Ctrl-C

### Pitfall 8: Synchronous Operations Blocking on Large Files
**What goes wrong:** Installer hangs for several seconds on large directory copies
**Why it happens:** Using fs.cpSync() blocks event loop until complete
**How to avoid:** Document that sync operations are intentional for simplicity. For large installs, consider async
**Warning signs:** User reports "frozen" installer

## Code Examples

Verified patterns from official sources:

### Complete Flag Parsing Setup
```javascript
// Source: https://nodejs.org/api/util.html
import { parseArgs } from 'node:util';

function parseInstallerFlags() {
  try {
    const { values } = parseArgs({
      options: {
        claude: { type: 'boolean', short: 'c' },
        opencode: { type: 'boolean', short: 'o' },
        gemini: { type: 'boolean', short: 'g' },
        global: { type: 'boolean' },
        local: { type: 'boolean' },
        uninstall: { type: 'boolean', short: 'u' },
        help: { type: 'boolean', short: 'h' }
      },
      strict: true,
      allowPositionals: false
    });

    return values;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
    return null;
  }
}
```

### Interactive Runtime Selection
```javascript
// Source: https://nodejs.org/api/readline.html
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function promptForRuntime() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    console.log('\nSelect target runtime:');
    console.log('  1) Claude Code');
    console.log('  2) OpenCode');
    console.log('  3) Gemini\n');

    const answer = await rl.question('Enter choice (1-3): ');

    const runtimeMap = {
      '1': 'claude',
      '2': 'opencode',
      '3': 'gemini'
    };

    const runtime = runtimeMap[answer.trim()];
    if (!runtime) {
      throw new Error('Invalid choice. Please enter 1, 2, or 3.');
    }

    return runtime;
  } finally {
    rl.close();
  }
}
```

### Cross-Platform Path Resolution
```javascript
// Source: https://nodejs.org/api/os.html, https://nodejs.org/api/path.html
import os from 'node:os';
import path from 'node:path';

function resolveInstallPath(runtime, isGlobal) {
  const homeDir = os.homedir();

  // Runtime-specific paths
  const runtimePaths = {
    claude: path.join(homeDir, '.claude', 'skills'),
    opencode: path.join(homeDir, '.opencode', 'skills'),
    gemini: path.join(homeDir, '.gemini', 'skills')
  };

  const basePath = runtimePaths[runtime];

  // Global vs local (workspace-specific)
  if (isGlobal) {
    return path.join(basePath, 'global');
  } else {
    return path.join(basePath, 'local');
  }
}
```

### Version Detection and Overwrite Prompt
```javascript
// Source: Combined pattern from research
import fs from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function checkExistingInstallation(targetDir) {
  const versionFile = path.join(targetDir, 'VERSION');

  if (!fs.existsSync(versionFile)) {
    return true; // No existing installation, proceed
  }

  // Read existing version
  const existingVersion = fs.readFileSync(versionFile, 'utf-8').trim();
  console.log(`\nFound existing Banneker installation (version ${existingVersion})`);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question('Overwrite existing installation? (y/N): ');
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}
```

### Safe File Installation with Error Handling
```javascript
// Source: https://nodejs.org/api/fs.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function installFiles(targetDir) {
  // Get package root directory (ES module)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templateDir = path.join(__dirname, '..', 'templates', 'commands');

  try {
    // Create target directory if doesn't exist
    fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });

    // Copy command files
    fs.cpSync(templateDir, targetDir, {
      recursive: true,
      errorOnExist: false,
      force: true  // Overwrite after user confirmation
    });

    // Write VERSION file
    const versionFile = path.join(targetDir, 'VERSION');
    fs.writeFileSync(versionFile, '0.2.0\n', 'utf-8');

    console.log(`✓ Installed to ${targetDir}`);
    return true;
  } catch (err) {
    console.error(`Installation failed: ${err.message}`);
    process.exitCode = 1;
    return false;
  }
}
```

### Safe Uninstallation
```javascript
// Source: https://nodejs.org/api/fs.html + safe uninstall pattern
import fs from 'node:fs';
import path from 'node:path';

function uninstallFiles(targetDir) {
  const versionFile = path.join(targetDir, 'VERSION');

  // Verify this is a Banneker installation
  if (!fs.existsSync(versionFile)) {
    console.error('No Banneker installation found in this directory');
    process.exitCode = 1;
    return false;
  }

  // List of files Banneker owns
  const bannekerFiles = [
    'gsd-discuss-phase.md',
    'gsd-plan-phase.md',
    'gsd-research-phase.md',
    'gsd-task.md',
    'gsd-verify-phase.md',
    'gsd-work-task.md',
    'gsd.md',
    'VERSION'
    // Add more as skills are added
  ];

  try {
    let removedCount = 0;

    for (const file of bannekerFiles) {
      const filePath = path.join(targetDir, file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
        removedCount++;
      }
    }

    console.log(`✓ Removed ${removedCount} Banneker files from ${targetDir}`);
    return true;
  } catch (err) {
    console.error(`Uninstallation failed: ${err.message}`);
    process.exitCode = 1;
    return false;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual process.argv parsing | util.parseArgs() | Stable in Node 20.0.0 (2023) | Native CLI flag parsing, no dependencies needed |
| Callback-based readline | readline/promises | Stable in Node 17.0.0 (2021) | Async/await for prompts, cleaner code |
| fs.rmdirSync({ recursive: true }) | fs.rmSync({ recursive: true }) | Node 14.14.0 (2020) | Unified API for file/directory removal |
| Third-party packages for simple tasks | Built-in modules | Ongoing trend (2020-2026) | Zero-dependency CLIs now practical |
| CommonJS (require) | ES modules (import) | Default since Node 14 (2020) | Modern syntax, better tree-shaking |

**Deprecated/outdated:**
- **fs.rmdirSync({ recursive: true })**: Deprecated in favor of fs.rmSync(). Will be removed in future Node versions
- **Callback-based fs methods without promises**: Use promise-based APIs from node:fs/promises or synchronous for CLI simplicity
- **--experimental-modules flag**: No longer needed for ES modules in Node 14+

## Open Questions

Things that couldn't be fully resolved:

1. **Minimum Node.js Version for util.parseArgs**
   - What we know: util.parseArgs experimental in Node 16.17, stable in Node 20.0.0
   - What's unclear: Whether to support Node 18 LTS or require Node 20+ for stability guarantees
   - Recommendation: Target Node 18 LTS (supported until April 2025) but document that util.parseArgs may be experimental. Add engine requirement `"node": ">=18.0.0"` in package.json

2. **File Manifest Strategy**
   - What we know: Need to track which files belong to Banneker for safe uninstall
   - What's unclear: Should manifest be embedded in VERSION file, separate .banneker-manifest file, or hardcoded list?
   - Recommendation: Start with hardcoded list in uninstaller (simplest). If skill list grows dynamically, generate manifest during install

3. **Handling Concurrent Installations**
   - What we know: Multiple runtimes can be installed simultaneously
   - What's unclear: Should installer prevent concurrent runs? Should it lock files?
   - Recommendation: Document that concurrent installs are unsupported. Add simple check for .banneker-lock file if needed

4. **Cross-Platform Executable Permissions**
   - What we know: npm handles chmod during publish, shebang required
   - What's unclear: Do Git configurations affect executable bit? Should installer check/fix permissions?
   - Recommendation: Rely on npm's handling. Document that users should publish from Unix systems if possible

5. **Handling Symbolic Links in Target Directory**
   - What we know: fs.cpSync() can dereference or preserve symlinks via options
   - What's unclear: Should Banneker follow symlinks in target directory? What if ~/.claude/skills is a symlink?
   - Recommendation: Default behavior (follow symlinks). Document that symlinked skill directories are supported

## Sources

### Primary (HIGH confidence)
- Node.js v25.3.0 Official Documentation - os.homedir(): https://nodejs.org/api/os.html
- Node.js v25.3.0 Official Documentation - readline/promises: https://nodejs.org/api/readline.html
- Node.js v25.3.0 Official Documentation - util.parseArgs: https://nodejs.org/api/util.html
- Node.js v25.3.0 Official Documentation - fs.cpSync, fs.rmSync: https://nodejs.org/api/fs.html
- Node.js v25.3.0 Official Documentation - process (SIGINT, exit codes): https://nodejs.org/api/process.html
- npm Official Documentation - package.json bin field: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
- Semantic Versioning 2.0.0 Specification: https://semver.org/

### Secondary (MEDIUM confidence)
- [Installing and running Node.js bin scripts](https://2ality.com/2022/08/installing-nodejs-bin-scripts.html) - npx mechanics
- [Parsing command line arguments with util.parseArgs()](https://2ality.com/2022/08/node-util-parseargs.html) - parseArgs examples
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - CLI development patterns
- [How to copy folder recursively in Node.js](https://www.geeksforgeeks.org/node-js/how-to-copy-folder-recursively-in-node-js/) - fs.cpSync patterns
- [Writing cross-platform Node.js](https://shapeshed.com/writing-cross-platform-node/) - path.join best practices
- [Node.js Exit Codes](https://www.geeksforgeeks.org/node-js/node-js-exit-codes/) - exit code conventions
- [How Does npx Actually Work](https://dev.to/orlikova/understanding-npx-1m4) - npx execution flow

### Tertiary (LOW confidence)
- Various Stack Overflow and Medium articles on Node.js CLI development (2022-2026)
- npm package security discussions regarding postinstall scripts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All Node.js built-ins verified in official documentation (v25.3.0)
- Architecture: HIGH - Patterns verified in official docs and established CLI tool examples
- Pitfalls: MEDIUM-HIGH - Cross-platform issues well-documented, some edge cases from community experience
- Code examples: HIGH - All examples based on official Node.js API documentation

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - Node.js built-ins are stable, but npm ecosystem evolves)
