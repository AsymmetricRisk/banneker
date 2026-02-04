# Banneker

<p align="center">
  <img src="banneker-cover.png" alt="Banneker" width="500">
</p>

<p align="center">
  <strong>✦ It's Your Website's Website ✦</strong><br>
  <em>Survey the vision. Architect the plan. Build Something Great.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/banneker"><img src="https://badge.fury.io/js/banneker.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

## The Gap Between Vibes and Production

You've got the vision. Maybe you've even started building with AI assistants. But somewhere between "vibe coding" and deploying a production system that handles real traffic, real users, and real complexity—things get murky.

**Banneker bridges that gap.**

It's a project planning pipeline that transforms your ideas into comprehensive engineering documentation *before* you write a single line of production code. The output? A complete HTML appendix—**your website's website**—where you can explore your architecture, understand your data flows, and validate your approach before building.

Banneker starts with simple language. It guides you through mapping out how your site is supposed to work, how users will experience it, and the backend mechanics that make it real. From documents to diagrams, it lays the plans for what you're about to build.

## Inspired by Benjamin Banneker (1731-1806)

*Surveyor · Mathematician · Astronomer*

Benjamin Banneker was a self-taught polymath who helped survey the land that became Washington D.C. He mapped the terrain before monuments rose. Banneker (the tool) follows the same philosophy: **survey your project's landscape before you Build Something Great.**

---

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

## What You Get

Banneker produces a comprehensive planning package:

- **Survey Data** — Structured capture of your project vision, user journeys, and technical requirements
- **Architecture Documents** — Planning docs tailored to your project's needs
- **Visual Diagrams** — Executive roadmap, system architecture, decision maps, and wiring diagrams
- **HTML Appendix** — A local website to explore your build architecture before you build your app
- **Framework Export** — Markdown and JSON files ready to feed your AI coding assistant

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

## Works With Your Stack

Banneker is designed to work alongside other AI development frameworks:

- **[GSD](https://github.com/dnakov/gsd)** — Get Stuff Done workflow for Claude Code
- **OpenClaw** — Open-source agent framework
- **Lovable** — AI-powered app builder

Export your Banneker appendix as markdown and JSON to feed directly into these tools.

## Requirements

- **Node.js**: >= 18.0.0
- **AI coding assistant**: Claude Code, OpenCode, or Gemini
- **Runtime dependencies**: Zero (Node.js built-ins only)

## Supported Runtimes

- **Claude Code** (primary) — Anthropic's official CLI for Claude
- **OpenCode** — Open-source AI coding assistant
- **Gemini** — Google's AI coding assistant

## Security

Banneker's installer writes configuration files to your home directory (`~/.claude/`, `~/.opencode/`, or `~/.gemini/` depending on runtime selection). The file-write surface is limited to template and configuration files only.

For detailed security information, see [SECURITY.md](SECURITY.md).

npm packages published with Banneker include provenance attestation for supply chain verification.

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/banneker)
- [GitHub repository](https://github.com/dsj7419/banneker)
- [Issue tracker](https://github.com/dsj7419/banneker/issues)
