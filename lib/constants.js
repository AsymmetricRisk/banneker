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
 */
export const BANNEKER_FILES = [
  'VERSION',
  'banneker-survey.md',
  'banneker-help.md',
  'agents/banneker-surveyor.md'
];

/**
 * Agent template files (installed to {runtime}/agents/)
 */
export const AGENT_FILES = [
  'banneker-surveyor.md'
];
