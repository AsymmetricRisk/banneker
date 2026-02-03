# Banneker Security Model

## Scope

This document provides a formal STRIDE threat model for Banneker's installer and file-write operations.

**Attack Surface:**
- Installer writes to user home directories:
  - `~/.claude/commands/` — Command template files
  - `~/.claude/agents/` — Agent template files
  - `~/.claude/config/` — Configuration files
  - `~/.opencode/commands/` — Command template files (OpenCode runtime)
  - `~/.opencode/agents/` — Agent template files (OpenCode runtime)
  - `~/.opencode/config/` — Configuration files (OpenCode runtime)
  - `~/.gemini/commands/` — Command template files (Gemini runtime)
  - `~/.gemini/agents/` — Agent template files (Gemini runtime)
  - `~/.gemini/config/` — Configuration files (Gemini runtime)
  - `VERSION` file in each commands directory
- Project-local writes (lower risk):
  - `.banneker/` — Project-specific state and outputs

**Key Implementation References:**
- `lib/installer.js` — Main installer orchestration with permission checks
- `lib/uninstaller.js` — Safe removal using file manifest
- `lib/constants.js` — BANNEKER_FILES manifest for tracking

---

## STRIDE Analysis

### S — Spoofing

**Threat:** Typosquat packages on npm mimicking "banneker"

Attackers could publish packages with similar names (e.g., `baneker`, `banneker-cli`, `banneker-install`) that appear legitimate but contain malicious code. Users may accidentally install these packages instead of the official `banneker` package.

**Existing Mitigations:**
- Official package name registered on npm: `banneker`
- npm provenance verification enabled via trusted publishing workflow (publish.yml uses OIDC with `id-token: write`)
- Package published from GitHub Actions with verifiable origin
- README installation instructions use exact package name: `npx banneker`

**Risk Rating:** MEDIUM

**Residual Risk:** Users must verify package source before installing. No technical control prevents typosquat registration. Recommendation: Monitor npm for typosquat packages, request npm support for name protection if package gains traction.

---

### T — Tampering

**Threat 1:** Installer overwrites existing user files without consent

Banneker installer writes to `~/.claude/`, `~/.opencode/`, and `~/.gemini/` directories. If users have existing files in these locations (e.g., custom commands, agents, or config), silent overwrites could destroy user work.

**Existing Mitigations:**
- VERSION file detection in `lib/installer.js` (lines 122-136)
- `promptForOverwrite()` interactive confirmation before any overwrites (REQ-SEC-002)
- Explicit user consent required: "Overwrite existing installation? (y/n)"
- Installation cancels if user declines (REQ-INST-004)

**Risk Rating:** LOW

**Residual Risk:** Prompt prevents silent overwrites. Users who confirm overwrite accept responsibility. No residual technical risk.

---

**Threat 2:** Malicious package modifies untracked files after installation

If an attacker compromises the Banneker package, they could modify installer code to write arbitrary files beyond the documented template files, creating backdoors or data exfiltration scripts.

**Existing Mitigations:**
- BANNEKER_FILES manifest in `lib/constants.js` (lines 38-59) explicitly tracks all installed files
- Uninstaller in `lib/uninstaller.js` removes ONLY files in BANNEKER_FILES manifest (lines 28-70)
- Manifest includes VERSION, command files, agent files, and config files — complete enumeration
- No dynamic file generation or arbitrary writes outside manifest
- Template files are static markdown (no executable code)

**Risk Rating:** LOW

**Residual Risk:** Manifest-based approach limits blast radius. If package is compromised, attacker could modify manifest, but npm provenance and GitHub Actions audit trail would reveal tampering. Users should verify package integrity via npm provenance before installing.

---

### R — Repudiation

**Threat:** No audit trail of installation actions

Users or attackers could claim Banneker installer performed actions it did not (or deny actions it did perform). Without audit logging, disputes cannot be resolved.

**Existing Mitigations:**
- Interactive prompts require explicit user consent (lib/installer.js lines 125-131)
- VERSION file written to commands directory marks installation timestamp (file mtime provides audit trail)
- npm audit log available: `npm view banneker time` shows publish times
- GitHub Actions workflow logs provide provenance chain for published packages
- No silent background operations — all writes require user-initiated `npx banneker` command

**Risk Rating:** LOW

**Residual Risk:** Terminal scrollback provides local audit trail for interactive sessions. VERSION file mtime tracks installation. For enterprise environments requiring formal audit logs, recommend running installer with `script` command or CI/CD logging.

---

### I — Information Disclosure

**Threat 1:** Installed files reveal runtime choice to other processes

Banneker writes to `~/.claude/`, `~/.opencode/`, or `~/.gemini/` based on user's runtime choice. File paths reveal which AI coding assistant the user runs, potentially leaking competitive intelligence or usage patterns.

**Existing Mitigations:**
- Runtime directories (`~/.claude/`, etc.) are already public convention used by host runtimes
- No sensitive data stored in template files (all files are documentation/instruction markdown)
- File permissions default to user-readable only (no world-readable writes)
- Template files contain no API keys, credentials, or project-specific data

**Risk Rating:** LOW

**Residual Risk:** Runtime choice is inherently visible via directory structure (host runtime itself creates these directories). No additional disclosure beyond what host runtime already exposes.

---

**Threat 2:** Survey data may contain project secrets

Banneker's `/banneker:survey` command collects detailed project information (tech stack, authentication patterns, deployment details) and writes to `.banneker/state/survey.json`. Users may inadvertently include sensitive information (API keys, internal URLs, credentials) in free-text responses.

**Existing Mitigations:**
- Survey data is local-only — written to `.banneker/` in project directory, never transmitted to external services
- `.banneker/` directory should be gitignored by users (documented in command templates)
- Survey prompts are structured to elicit architectural information, not credentials
- No automatic collection of environment variables or config files
- Users control all input via interactive prompts

**Risk Rating:** MEDIUM

**Residual Risk:** User error remains. Users are responsible for not entering secrets in survey responses. Recommendation: Add warning in survey introduction: "Do not enter API keys, passwords, or credentials in responses. This data is stored in `.banneker/state/survey.json`."

---

### D — Denial of Service

**Threat:** Installer disk exhaustion

Malicious or buggy installer could write unbounded data to disk, filling user's filesystem and causing system-wide denial of service.

**Existing Mitigations:**
- Total installation footprint: ~100KB (template files only, per package.json "files" field)
- No dynamic content generation during install (templates are static files)
- No recursive operations or unbounded loops in installer
- Template files copied with `cpSync(..., { recursive: true })` — bounded by source directory contents
- No network downloads during installation (all templates bundled in package)
- File count limited to BANNEKER_FILES manifest (19 files total)

**Risk Rating:** LOW

**Residual Risk:** Template files are fixed-size markdown documents. Even if all templates are corrupted to maximum size, total footprint bounded by npm package size limits (no multi-MB files in templates/).

---

### E — Elevation of Privilege

**Threat 1:** Installer writes to protected directories bypassing permissions

Installer attempts to write to `~/.claude/`, `~/.opencode/`, and `~/.gemini/`. If these directories require elevated privileges (e.g., owned by root due to misconfiguration), installer could fail or attempt privilege escalation.

**Existing Mitigations:**
- `checkWritePermission()` in `lib/installer.js` (lines 25-45) verifies write access BEFORE mkdir/write operations
- Uses `fs.accessSync(checkPath, fsConstants.W_OK)` to check write permission (REQ-SEC-001)
- Walks up directory tree to find existing ancestor directory for permission check
- Explicit error message if permission denied: "Permission denied: Cannot write to {path}" (line 141)
- Suggests fallback: "Try running with appropriate permissions or use --local for current directory"
- No sudo/su invocation — installer never attempts privilege escalation
- Fails fast with exit code 1 if permission check fails (line 142)

**Risk Rating:** LOW

**Residual Risk:** Permission check prevents unauthorized writes. Installer never bypasses OS-level permissions. Users must have legitimate write access to target directories.

---

**Threat 2:** Installed markdown files execute code with user privileges

Banneker installs markdown template files to `~/.claude/commands/` and `~/.claude/agents/`. If these files contain executable code (shell scripts, JavaScript), they could run with user privileges when accessed by host runtime (Claude Code).

**Existing Mitigations:**
- Template files are markdown only — no shell scripts, no compiled binaries, no executable permissions
- Host runtime (Claude Code) interprets markdown files as natural language instructions for LLM inference
- No system execution occurs — LLM reads markdown and reasons about content, does not execute it
- File permissions set by OS defaults (user-readable, not executable)
- No `chmod +x` operations in installer
- Templates contain natural language prompts and structured data (YAML frontmatter), not code

**Risk Rating:** LOW

**Residual Risk:** Host runtime security model determines execution behavior. Banneker provides markdown instructions; host runtime's LLM interprets them. If host runtime has vulnerabilities allowing markdown-triggered code execution, that is host runtime's responsibility, not Banneker's. Template files are passive documentation.

---

## Extended Surface — .banneker/ Operations

Banneker commands write to project-local `.banneker/` directory (not home directory). This surface has lower risk than installer operations because:

**Lower Risk Factors:**
- Project-local (not global) — isolated to current directory
- Requires user-initiated command execution (`/banneker:survey`, `/banneker:architect`, etc.)
- No elevated privileges required
- No cross-project contamination

**File Write Operations:**

| Command | Writes To | Purpose | Risk Assessment |
|---------|-----------|---------|-----------------|
| `/banneker:survey` | `.banneker/state/survey.json`, `.banneker/state/survey-state.md` | Interview state and responses | LOW — User-provided data, local-only |
| `/banneker:architect` | `.banneker/documents/*.md` | Generated architecture documents | LOW — Derived from survey, no external data |
| `/banneker:roadmap` | `.banneker/ROADMAP.md` | Multi-phase plan | LOW — Planning output, no secrets |
| `/banneker:appendix` | `.banneker/appendix/*.html` | HTML appendix pages | LOW — Rendered from documents, no external content |
| `/banneker:feed` | `.banneker/exports/*.{json,xml}` | Export feeds | LOW — Derived from documents, controlled format |
| `/banneker:document` | `.banneker/documents/CODEBASE-DISCOVERY.md` | Codebase analysis | MEDIUM — Contains file paths, may reveal internal structure |
| `/banneker:audit` | `.banneker/audit/audit-report.{json,md}` | Plan completeness audit | LOW — Analysis output, no secrets |

**Key Mitigations:**
- All writes are to known subdirectories: `state/`, `documents/`, `diagrams/`, `appendix/`, `exports/`, `audit/`
- No writes outside `.banneker/` directory
- No recursive directory traversal or parent directory access (`../` prevented by path.join() usage)
- Commands verify `.banneker/` exists before writing (fail fast if not)
- File overwrites prompt for confirmation (e.g., survey resume detection)

**Residual Risk:** `.banneker/` should be gitignored to prevent committing analysis results to version control. Users responsible for not committing sensitive discovery data.

---

## Security Best Practices for Users

**Installation:**
1. Verify package source before installing: `npm info banneker`
2. Use exact package name: `npx banneker` (not typosquat variants)
3. Review installer prompts before confirming overwrites
4. Use `--local` flag for project-specific installations if concerned about home directory writes

**Survey Data:**
5. Do not store API keys, passwords, or credentials in survey responses
6. Review `.banneker/state/survey.json` before committing to version control
7. Add `.banneker/` to `.gitignore` to prevent accidental commits

**CI/CD:**
8. Use specific version tags in pipelines: `npx banneker@0.2.0` (not `@latest`)
9. Verify npm provenance in automated environments
10. Run installer with `--local` flag in CI to avoid home directory pollution

**Runtime:**
11. Review generated documents in `.banneker/documents/` before sharing externally
12. Sanitize codebase discovery results if they contain internal paths or secrets

---

## Vulnerability Reporting

If you discover a security vulnerability in Banneker, please report it via:

**GitHub Security Advisories:**
https://github.com/owner/banneker/security/advisories

**Response Timeline:**
- Acknowledgment: Within 48 hours
- Initial assessment: Within 1 week
- Fix timeline: Depends on severity (critical issues prioritized)

**Scope:**
- Installer privilege escalation vulnerabilities
- File write operations outside documented directories
- Package compromise or supply chain attacks
- Information disclosure beyond documented behavior

**Out of Scope:**
- Vulnerabilities in host runtimes (Claude Code, OpenCode, Gemini)
- User error (e.g., committing survey data with secrets)
- Local privilege escalation unrelated to Banneker

---

*Last updated: 2026-02-03*
*Version: 0.2.0*
