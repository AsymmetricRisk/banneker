# Phase 13: Approval Flow - Research

**Researched:** 2026-02-03
**Domain:** Interactive CLI approval workflow with JSON decision merging
**Confidence:** HIGH

## Summary

Interactive CLI approval workflows for AI-generated decisions require a combination of user-friendly table display, granular per-item control, edit-before-approve capability, and comprehensive audit logging. The research identified proven patterns from both general CLI tools (Git) and AI-specific tools (Codex CLI).

The standard approach uses Node.js built-in readline for interactive prompts, structured table display for batch review, and native JSON manipulation for merging approved decisions. The workflow separates "review" (display and select), "edit" (optional modification), and "approve" (merge to decision log) into distinct steps to prevent accidental auto-merges.

**Primary recommendation:** Build approval flow using Node.js built-in readline/promises for zero dependencies, implement table-based batch review with individual selection, support edit-before-approve through temporary file modification, and maintain comprehensive rejection logs for audit trails.

## Standard Stack

The approval flow domain has minimal library dependencies due to Node.js's rich built-in capabilities and the zero-dependency constraint for Banneker.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:readline/promises | Built-in (Node 17+) | Interactive CLI prompts | Async/await-friendly interface, zero dependencies, proven in installer |
| node:fs/promises | Built-in | JSON file read/write | Native async file operations, no external dependencies |
| node:process | Built-in | stdin/stdout/stderr | Terminal I/O for interactive workflows |

### Supporting (ZERO-DEPENDENCY ALTERNATIVES)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cli-table3 | 0.6.5 | Pretty terminal tables | **NOT USED** - Zero dependency constraint requires manual table formatting |
| json-diff | Latest | JSON diff visualization | **NOT USED** - Zero dependency constraint requires manual diff display |
| @colors/colors | Latest | ANSI color codes | **NOT USED** - Use raw ANSI codes (already present in installer.js) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| readline/promises | inquirer, prompts | Richer UI but adds dependencies (violates zero-dep constraint) |
| Manual JSON merge | json-merger npm package | Safer merging but adds dependency |
| Raw ANSI codes | chalk, colors | Cleaner API but violates zero-dependency constraint |

**Installation:**
```bash
# No installation needed - all built-in Node.js modules
# Approval flow uses only node:readline/promises, node:fs/promises, node:process
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── approval.js           # Approval workflow orchestration
├── approval-prompts.js   # Interactive prompts (extends prompts.js pattern)
├── approval-display.js   # Table formatting, diff display
└── approval-merge.js     # JSON decision merging logic

templates/commands/
└── banneker-approve.md   # Command orchestrator (follows engineer pattern)
```

### Pattern 1: Three-Phase Approval Workflow
**What:** Separate review, edit, and merge into distinct phases with explicit user consent at each step
**When to use:** Any workflow where users need to approve AI-generated changes before they take effect
**Example:**
```javascript
// Phase 1: Review (display decisions in table)
async function reviewPhase(proposals) {
    displaySummaryTable(proposals);
    const selections = await promptForSelections(proposals);
    return selections; // { approved: [], rejected: [], deferred: [] }
}

// Phase 2: Edit (optional modification before approval)
async function editPhase(approvedDecisions) {
    for (const decision of approvedDecisions) {
        const shouldEdit = await promptToEdit(decision);
        if (shouldEdit) {
            const edited = await editDecision(decision);
            decision = edited;
        }
    }
    return approvedDecisions;
}

// Phase 3: Merge (atomic write to architecture-decisions.json)
async function mergePhase(approvedDecisions, rejectedDecisions) {
    await mergeToDecisionLog(approvedDecisions);
    await logRejections(rejectedDecisions);
    displayMergeResults();
}
```

### Pattern 2: Category-Grouped Table Display
**What:** Group decisions by domain/category to reduce cognitive load during review
**When to use:** When presenting multiple decisions (>5) for approval
**Example:**
```javascript
// Manual table formatting (zero dependencies)
function displayGroupedTable(proposals) {
    // Group by domain (e.g., "RUB-INFRA", "RUB-INT", etc.)
    const grouped = groupByDomain(proposals);

    for (const [domain, decisions] of Object.entries(grouped)) {
        console.log(`\n${colors.cyan}${domain}${colors.reset}`);
        console.log('─'.repeat(80));

        decisions.forEach((dec, i) => {
            const marker = `[${i + 1}]`;
            const confidence = formatConfidence(dec.confidence);
            console.log(`${marker} ${dec.id}: ${dec.question}`);
            console.log(`    Choice: ${dec.choice}`);
            console.log(`    Confidence: ${confidence}`);
        });
    }

    console.log('\n');
}
```
**Source:** Pattern derived from Codex CLI approval modes and Git's interactive staging

### Pattern 3: Edit-Before-Approve via Temporary File
**What:** Write decision to temporary file, open in user's $EDITOR, read back modified version
**When to use:** Supporting APPROVE-03 requirement for edit-before-approve
**Example:**
```javascript
// Adapted from git commit --amend pattern
async function editDecision(decision) {
    const tmpFile = `.banneker/tmp/edit-${decision.id}.json`;

    // Write to temp file with comments
    const editableContent = formatForEditing(decision);
    await fs.writeFile(tmpFile, editableContent, 'utf8');

    // Open in user's editor
    const editor = process.env.EDITOR || 'vi';
    await spawnEditor(editor, tmpFile);

    // Read back and parse
    const edited = await fs.readFile(tmpFile, 'utf8');
    const parsed = parseEditedDecision(edited);

    // Clean up
    await fs.unlink(tmpFile);

    return parsed;
}

function formatForEditing(decision) {
    return JSON.stringify(decision, null, 2) +
        '\n\n# Edit the decision above. Save and close to continue.\n' +
        '# Lines starting with # are ignored.\n';
}
```
**Source:** Git commit message editing workflow

### Pattern 4: Atomic Decision Merge
**What:** Read, modify, write architecture-decisions.json in single operation with backup
**When to use:** Merging approved decisions to prevent race conditions or partial writes
**Example:**
```javascript
async function mergeToDecisionLog(approvedDecisions) {
    const decisionLogPath = '.banneker/architecture-decisions.json';

    // Read current state
    let decisionLog = { version: "0.1.0", decisions: [], recorded_at: "" };
    if (existsSync(decisionLogPath)) {
        const content = await fs.readFile(decisionLogPath, 'utf8');
        decisionLog = JSON.parse(content);
    }

    // Backup before modification (safety)
    if (existsSync(decisionLogPath)) {
        await fs.copyFile(decisionLogPath, `${decisionLogPath}.backup`);
    }

    // Append approved decisions
    decisionLog.decisions.push(...approvedDecisions);
    decisionLog.recorded_at = new Date().toISOString();

    // Atomic write
    const tmpPath = `${decisionLogPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(decisionLog, null, 2), 'utf8');
    await fs.rename(tmpPath, decisionLogPath);

    // Clean up backup on success
    await fs.unlink(`${decisionLogPath}.backup`);
}
```
**Source:** Standard atomic file write pattern for JSON databases

### Pattern 5: Rejection Logging for Audit Trail
**What:** Maintain timestamped log of rejected decisions with reasons
**When to use:** Supporting APPROVE-04 requirement and providing audit trail
**Example:**
```javascript
async function logRejections(rejectedDecisions, reasons) {
    const rejectionLogPath = '.banneker/rejection-log.json';

    // Read existing log
    let log = { rejections: [] };
    if (existsSync(rejectionLogPath)) {
        const content = await fs.readFile(rejectionLogPath, 'utf8');
        log = JSON.parse(content);
    }

    // Append rejections with timestamp and reason
    const timestamp = new Date().toISOString();
    rejectedDecisions.forEach((decision, i) => {
        log.rejections.push({
            timestamp,
            decision_id: decision.id,
            question: decision.question,
            proposed_choice: decision.choice,
            reason: reasons[i] || 'User rejected',
            status: 'rejected'
        });
    });

    // Write updated log
    await fs.writeFile(rejectionLogPath, JSON.stringify(log, null, 2), 'utf8');
}
```
**Source:** Audit trail best practices from decision logging systems

### Anti-Patterns to Avoid
- **Auto-merge without explicit approval:** NEVER merge proposals to architecture-decisions.json without user confirmation
- **All-or-nothing approval:** Requires approving all decisions together (violates APPROVE-02 per-decision granularity)
- **Silent rejection:** Discarding rejected decisions without logging (violates APPROVE-04 audit trail requirement)
- **In-place editing:** Modifying proposal file directly instead of through controlled workflow
- **Non-atomic writes:** Writing to architecture-decisions.json without backup/temp file pattern (risks corruption)

## Don't Hand-Roll

Problems that look simple but have existing solutions or patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive prompts | Custom stdin parser | node:readline/promises | Built-in, async/await friendly, tested in installer.js |
| JSON diff display | Custom object comparison | Manual field-by-field comparison | Zero-dep constraint, decisions are flat structures |
| Terminal colors | ANSI code generator | Raw ANSI codes from installer.js | Already present in codebase, zero-dep |
| File locking | Mutex library | Atomic write pattern (tmp + rename) | POSIX rename is atomic, no deps needed |
| Table rendering | ASCII art generator | Manual string formatting | Zero-dep constraint, simple grid layout sufficient |

**Key insight:** The zero-dependency constraint means "simple and correct" beats "feature-rich library." Node.js built-ins provide everything needed for this workflow. The approval flow is synchronous and single-user, avoiding complex concurrency issues.

## Common Pitfalls

### Pitfall 1: Assuming readline works like a full TUI library
**What goes wrong:** Developers expect readline to handle cursor movement, multi-line selection, etc.
**Why it happens:** Confusion between readline (simple line input) and libraries like blessed/ink (full TUI)
**How to avoid:** Keep prompts simple and linear. For multi-select, use numbered list + comma-separated input
**Warning signs:** Trying to move cursor around screen, clear specific lines, or update existing output
**Example:**
```javascript
// WRONG: Trying to build fancy multi-select UI
// readline can't handle this without ncurses-like library

// RIGHT: Simple numbered selection
console.log('Select decisions to approve (comma-separated, e.g., "1,3,5"):');
const input = await rl.question('> ');
const indices = input.split(',').map(s => parseInt(s.trim()));
```

### Pitfall 2: Race conditions in JSON file writes
**What goes wrong:** Multiple approval sessions or concurrent reads/writes corrupt architecture-decisions.json
**Why it happens:** No file locking, direct write without atomic pattern
**How to avoid:** Use tmp-file-then-rename pattern, check for existing locks, backup before write
**Warning signs:** Occasional JSON parse errors, decisions mysteriously missing after merge
**Example:**
```javascript
// WRONG: Direct write
await fs.writeFile('architecture-decisions.json', JSON.stringify(data));

// RIGHT: Atomic write with backup
await fs.copyFile(path, `${path}.backup`);
const tmpPath = `${path}.tmp`;
await fs.writeFile(tmpPath, JSON.stringify(data, null, 2));
await fs.rename(tmpPath, path);
await fs.unlink(`${path}.backup`);
```

### Pitfall 3: Losing user context during edit workflow
**What goes wrong:** User opens editor, forgets what they're editing, context is lost
**Why it happens:** Temporary file contains raw JSON without guidance
**How to avoid:** Include comments/instructions in edited file, display context before opening editor
**Warning signs:** Users frequently cancel edits, ask "what was I editing?"
**Example:**
```javascript
// Add context to temporary file
const editableContent =
    `# Editing Decision: ${decision.id}\n` +
    `# Question: ${decision.question}\n` +
    `# Current Choice: ${decision.choice}\n` +
    `#\n` +
    `# Edit the JSON below. Lines starting with # are ignored.\n` +
    `#\n` +
    JSON.stringify(decision, null, 2);
```

### Pitfall 4: Poor table formatting on narrow terminals
**What goes wrong:** Tables overflow, become unreadable on <80 column terminals
**Why it happens:** Fixed-width columns without terminal size detection
**How to avoid:** Detect terminal width (process.stdout.columns), truncate/wrap text
**Warning signs:** Reports of "garbled output" on users' terminals
**Example:**
```javascript
// Detect terminal width
const termWidth = process.stdout.columns || 80;
const maxCellWidth = Math.floor((termWidth - 10) / 3); // 3 columns + padding

function truncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
}
```

### Pitfall 5: No recovery path for rejected decisions
**What goes wrong:** User rejects decision, realizes mistake, can't recover
**Why it happens:** Rejection log doesn't support "re-propose" workflow
**How to avoid:** Log rejections with full decision JSON, provide command to re-review rejected items
**Warning signs:** Users requesting "undo" feature, complaints about irreversible decisions
**Example:**
```javascript
// Log complete decision for recovery
log.rejections.push({
    timestamp,
    decision_id: decision.id,
    full_decision: decision, // Include complete object
    reason: reason,
    status: 'rejected'
});

// Later: Provide recovery command
// /banneker:approve --review-rejected
// Shows rejected decisions and allows re-approval
```

## Code Examples

Verified patterns from official sources and project requirements:

### Interactive Prompt with Readline (from installer.js)
```javascript
// Source: lib/prompts.js (existing Banneker code)
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function promptForApproval(decision) {
    const rl = createInterface({ input, output });

    try {
        console.log(`\nDecision: ${decision.id} - ${decision.question}`);
        console.log(`Proposed: ${decision.choice}`);

        const answer = await rl.question('Approve? (y/N/e to edit): ');
        const normalized = answer.trim().toLowerCase();

        if (normalized === 'y') return 'approve';
        if (normalized === 'e') return 'edit';
        return 'reject';
    } finally {
        rl.close();
    }
}
```

### Category-Grouped Display
```javascript
// Manual table formatting using ANSI codes from installer.js
import { colors } from './installer.js'; // Reuse existing color definitions

function displayProposalsSummary(proposals) {
    // Group by domain
    const byDomain = {};
    proposals.forEach(p => {
        if (!byDomain[p.domain]) byDomain[p.domain] = [];
        byDomain[p.domain].push(p);
    });

    console.log(`\n${colors.brightPurple}Proposed Decisions${colors.reset}`);
    console.log('═'.repeat(80));

    Object.entries(byDomain).forEach(([domain, decisions]) => {
        console.log(`\n${colors.cyan}${domain}${colors.reset} (${decisions.length} decisions)`);
        console.log('─'.repeat(80));

        decisions.forEach((dec, i) => {
            const num = `[${i + 1}]`;
            const conf = formatConfidence(dec.confidence);
            console.log(`${colors.yellow}${num}${colors.reset} ${dec.id}: ${dec.question}`);
            console.log(`    ${colors.white}Choice:${colors.reset} ${dec.choice}`);
            console.log(`    ${colors.gray}Confidence:${colors.reset} ${conf}`);
        });
    });

    console.log('\n');
}

function formatConfidence(conf) {
    if (!conf) return `${colors.gray}Not specified${colors.reset}`;
    const level = conf.toUpperCase();
    if (level === 'HIGH') return `${colors.brightPurple}HIGH${colors.reset}`;
    if (level === 'MEDIUM') return `${colors.yellow}MEDIUM${colors.reset}`;
    return `${colors.gray}LOW${colors.reset}`;
}
```

### Batch Selection Prompt
```javascript
async function promptForBatchSelection(proposals) {
    const rl = createInterface({ input, output });

    try {
        console.log('\nOptions:');
        console.log('  a - Approve all');
        console.log('  r - Reject all');
        console.log('  s - Select individually (comma-separated numbers)');
        console.log('  Example: 1,3,5 (approve decisions 1, 3, and 5)');

        const answer = await rl.question('\nYour choice: ');
        const normalized = answer.trim().toLowerCase();

        if (normalized === 'a') {
            return { approved: proposals.map((_, i) => i), rejected: [] };
        }

        if (normalized === 'r') {
            return { approved: [], rejected: proposals.map((_, i) => i) };
        }

        // Parse comma-separated indices
        const indices = answer.split(',')
            .map(s => parseInt(s.trim()) - 1) // Convert to 0-based
            .filter(i => i >= 0 && i < proposals.length);

        const approved = indices;
        const rejected = proposals
            .map((_, i) => i)
            .filter(i => !indices.includes(i));

        return { approved, rejected };
    } finally {
        rl.close();
    }
}
```

### Edit Decision in Editor
```javascript
// Source: Git commit --amend pattern
import { spawn } from 'node:child_process';

async function editDecisionInEditor(decision) {
    const tmpDir = '.banneker/tmp';
    await fs.mkdir(tmpDir, { recursive: true });

    const tmpFile = `${tmpDir}/edit-${decision.id}.json`;

    // Write decision with editing instructions
    const content =
        `# Edit the decision below (lines starting with # are ignored)\n` +
        `# Decision ID: ${decision.id}\n` +
        `# Question: ${decision.question}\n` +
        `#\n` +
        `# Save and close to accept changes.\n` +
        `# To cancel, delete all JSON content.\n` +
        `\n` +
        JSON.stringify(decision, null, 2);

    await fs.writeFile(tmpFile, content, 'utf8');

    // Open in user's editor
    const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
    await new Promise((resolve, reject) => {
        const proc = spawn(editor, [tmpFile], {
            stdio: 'inherit',
            shell: true
        });
        proc.on('exit', code => code === 0 ? resolve() : reject(new Error('Editor failed')));
    });

    // Read back edited content
    const edited = await fs.readFile(tmpFile, 'utf8');

    // Parse, removing comment lines
    const jsonLines = edited.split('\n').filter(line => !line.trim().startsWith('#'));
    const jsonContent = jsonLines.join('\n').trim();

    // Clean up
    await fs.unlink(tmpFile);

    if (!jsonContent) {
        throw new Error('Edit cancelled (no content)');
    }

    return JSON.parse(jsonContent);
}
```

### Atomic Decision Merge
```javascript
// Merge approved decisions to architecture-decisions.json
async function mergeApprovedDecisions(approvedDecisions) {
    const logPath = '.banneker/architecture-decisions.json';

    // Read current decision log
    let log = { version: "0.1.0", project: "Banneker", decisions: [] };

    if (existsSync(logPath)) {
        const content = await fs.readFile(logPath, 'utf8');
        log = JSON.parse(content);

        // Create backup
        await fs.copyFile(logPath, `${logPath}.backup`);
    }

    // Transform proposals to final decision format
    const finalDecisions = approvedDecisions.map(prop => ({
        id: prop.id,
        domain: prop.domain,
        question: prop.question,
        choice: prop.choice,
        rationale: prop.rationale,
        alternatives_considered: prop.alternatives_considered || []
    }));

    // Append to decision log
    log.decisions.push(...finalDecisions);
    log.recorded_at = new Date().toISOString();

    // Atomic write
    const tmpPath = `${logPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(log, null, 2) + '\n', 'utf8');
    await fs.rename(tmpPath, logPath);

    // Remove backup on success
    if (existsSync(`${logPath}.backup`)) {
        await fs.unlink(`${logPath}.backup`);
    }

    return finalDecisions.length;
}
```

### Rejection Logging
```javascript
async function logRejectedDecisions(rejectedDecisions, reasons) {
    const logPath = '.banneker/rejection-log.json';

    let log = { rejections: [] };
    if (existsSync(logPath)) {
        const content = await fs.readFile(logPath, 'utf8');
        log = JSON.parse(content);
    }

    const timestamp = new Date().toISOString();

    rejectedDecisions.forEach((decision, i) => {
        log.rejections.push({
            timestamp,
            decision_id: decision.id,
            question: decision.question,
            proposed_choice: decision.choice,
            reason: reasons[i] || 'User rejected without reason',
            full_decision: decision, // Preserve for potential recovery
            status: 'rejected'
        });
    });

    await fs.writeFile(logPath, JSON.stringify(log, null, 2) + '\n', 'utf8');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All-or-nothing PR approval | Per-file/per-change granular review | ~2020 (GitHub PR reviews) | Enables partial approval, iterative refinement |
| Manual git commit messages | AI-suggested messages with edit-before-commit | 2024 (GitHub Copilot) | Maintains human control while reducing boilerplate |
| Silent rejection (no trace) | Audit trail for all decisions | 2025-2026 (compliance requirements) | Regulatory compliance, decision transparency |
| Auto-merge AI suggestions | Explicit approval gates | 2025 (Codex CLI) | Prevents accidents, maintains human oversight |

**Deprecated/outdated:**
- **Callbacks-based readline**: Replaced by readline/promises (async/await) in Node 17+
- **Global editor assumptions**: Modern tools respect $EDITOR and $VISUAL environment variables
- **Single approval mode**: Codex CLI shows value of multiple modes (auto, read-only, full-access)

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-user concurrent approval**
   - What we know: Single-user workflow is primary use case, file locking via atomic writes
   - What's unclear: Behavior if two users run /banneker:approve simultaneously
   - Recommendation: Start with single-user assumption, add file lock detection if needed

2. **Approval history/versioning**
   - What we know: architecture-decisions.json is append-only log
   - What's unclear: Should approval metadata (who approved, when) be included in decision entries?
   - Recommendation: Start without approval metadata, add if audit requirements emerge

3. **Batch vs individual workflow preference**
   - What we know: Both batch and per-decision review have value
   - What's unclear: Which workflow users will prefer for typical 5-10 decision proposals
   - Recommendation: Support both, default to batch with option for individual review

4. **Recovery of rejected decisions**
   - What we know: Rejection log preserves full decision JSON
   - What's unclear: Should /banneker:approve support --review-rejected flag to re-propose?
   - Recommendation: Implement basic rejection logging first, add recovery command if requested

## Sources

### Primary (HIGH confidence)
- Node.js readline/promises documentation - https://nodejs.org/api/readline.html
- Banneker existing code: lib/installer.js (ANSI colors), lib/prompts.js (readline patterns)
- Git commit editing workflow - https://git-scm.com/docs/git-commit

### Secondary (MEDIUM confidence)
- [Codex CLI approval modes](https://developers.openai.com/codex/cli/features/) - Interactive approval patterns for AI-generated changes
- [Codex CLI approval modes explained](https://vladimirsiedykh.com/blog/codex-cli-approval-modes-2025) - Auto vs read-only vs full access patterns
- [cli-table3 GitHub](https://github.com/cli-table/cli-table3) - Table formatting library (not used due to zero-dep constraint)
- [Decision Audit Trails guide](https://www.workmate.com/blog/decision-audit-trails-structuring-timestamped-notes) - Audit trail best practices
- [JSON file updates in Node.js](https://www.geeksforgeeks.org/javascript/how-to-update-data-in-json-file-using-javascript/) - Updated January 2026

### Tertiary (LOW confidence)
- WebSearch results for batch approval workflows - Primarily manufacturing/document management, not CLI-specific
- WebSearch results for JSON merge patterns - General patterns, need verification for append-only decision log use case

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Node.js built-ins well-documented, proven in installer.js
- Architecture: HIGH - Patterns derived from Git (widely used) and Codex CLI (AI-specific tool)
- Pitfalls: MEDIUM - Based on general CLI development experience, specific to Banneker use case

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain with mature patterns)
