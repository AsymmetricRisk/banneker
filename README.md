# Banneker

[![npm version](https://badge.fury.io/js/banneker.svg)](https://www.npmjs.com/package/banneker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Project planning and documentation pipeline for AI coding assistants**

Banneker transforms structured discovery interviews into engineering plans, architecture diagrams, and agent-ready HTML appendices. Built for AI-assisted development workflows, it provides a complete project planning pipeline that integrates seamlessly with Claude Code, OpenCode, and Gemini coding assistants.

## Installation

**Primary method (no install required):**
```bash
npx banneker
```

**Global installation:**
```bash
npm install -g banneker
```

**Runtime selection:**
```bash
npx banneker --claude    # Install for Claude Code
npx banneker --opencode  # Install for OpenCode
npx banneker --gemini    # Install for Gemini
```

**Location options:**
```bash
npx banneker --global    # Install to ~/.claude/ (default)
npx banneker --local     # Install to current project
```

## Quick Start

1. **Run the installer** with your preferred runtime:
   ```bash
   npx banneker --claude
   ```

2. **Start discovery** in your project directory:
   ```
   /banneker:survey
   ```
   Complete the 6-phase discovery interview to document your project vision.

3. **Generate planning documents**:
   ```
   /banneker:architect
   /banneker:roadmap
   /banneker:appendix
   ```

4. **Export to framework format**:
   ```
   /banneker:feed
   ```

## Command Reference

| Command | Description |
|---------|-------------|
| `/banneker:survey` | Conduct 6-phase discovery interview |
| `/banneker:architect` | Generate planning documents from survey |
| `/banneker:roadmap` | Generate architecture diagrams |
| `/banneker:appendix` | Compile HTML reference appendix |
| `/banneker:feed` | Export to framework format (Claude/OpenCode/Gemini) |
| `/banneker:document` | Analyze existing codebase and generate documentation |
| `/banneker:audit` | Evaluate plans against completeness rubric |
| `/banneker:plat` | Generate sitemap and route architecture |
| `/banneker:progress` | Show current Banneker project state |
| `/banneker:help` | Display command reference |

## Requirements

- **Node.js**: >= 18.0.0
- **AI coding assistant**: Claude Code, OpenCode, or Gemini
- **Runtime dependencies**: Zero (Node.js built-ins only)

## Supported Runtimes

- **Claude Code** (primary) - Anthropic's official CLI for Claude
- **OpenCode** - Open-source AI coding assistant
- **Gemini** - Google's AI coding assistant

## Security

Banneker's installer writes configuration files to your home directory (`~/.claude/`, `~/.opencode/`, or `~/.gemini/` depending on runtime selection). The file-write surface is limited to template and configuration files only.

For detailed security information, see [SECURITY.md](SECURITY.md).

npm packages published with Banneker include provenance attestation for supply chain verification.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/banneker)
- [GitHub repository](https://github.com/dsj7419/banneker)
- [Issue tracker](https://github.com/dsj7419/banneker/issues)
