/**
 * Shared constants used across all Banneker modules
 */

export const VERSION = '0.2.0';

/**
 * Runtime configurations mapping runtime names to their install paths
 * (relative to user's home directory)
 */
export const RUNTIMES = {
  claude: {
    commands: '.claude/commands',
    config: '.claude'
  },
  opencode: {
    commands: '.opencode/commands',
    config: '.opencode'
  },
  gemini: {
    commands: '.gemini/commands',
    config: '.gemini'
  }
};

/**
 * Valid runtime choices for validation
 */
export const RUNTIME_CHOICES = ['claude', 'opencode', 'gemini'];

/**
 * Files that Banneker installs (for uninstall tracking)
 * Paths are relative to their install location:
 * - Command files (*.md in root): installed to {runtime}/commands/
 * - Agent files (agents/*.md): installed to {runtime}/agents/
 * - Config files (config/*.md): installed to {runtime}/config/
 */
export const BANNEKER_FILES = [
  'VERSION',
  'banneker-appendix.md',
  'banneker-architect.md',
  'banneker-audit.md',
  'banneker-document.md',
  'banneker-feed.md',
  'banneker-help.md',
  'banneker-roadmap.md',
  'banneker-survey.md',
  'agents/banneker-architect.md',
  'agents/banneker-auditor.md',
  'agents/banneker-cartographer.md',
  'agents/banneker-diagrammer.md',
  'agents/banneker-exporter.md',
  'agents/banneker-publisher.md',
  'agents/banneker-surveyor.md',
  'agents/banneker-writer.md',
  'config/completeness-rubric.md',
  'config/document-catalog.md',
  'config/framework-adapters.md'
];

/**
 * Agent template files (installed to {runtime}/agents/)
 */
export const AGENT_FILES = [
  'banneker-architect.md',
  'banneker-auditor.md',
  'banneker-cartographer.md',
  'banneker-diagrammer.md',
  'banneker-exporter.md',
  'banneker-publisher.md',
  'banneker-surveyor.md',
  'banneker-writer.md'
];

/**
 * Config template files (installed to {runtime}/config/)
 */
export const CONFIG_FILES = [
  'completeness-rubric.md',
  'document-catalog.md',
  'framework-adapters.md'
];
