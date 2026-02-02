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
 * This list grows as real skill files are added in later phases
 */
export const BANNEKER_FILES = [
  'VERSION',
  'banneker-survey.md',
  'banneker-help.md'
];
