/**
 * Interactive prompts for installer using Node.js built-in readline
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Prompt user to select target runtime
 * @returns {Promise<string|null>} 'claude' | 'opencode' | 'gemini' or null if cancelled
 */
export async function promptForRuntime() {
  const rl = createInterface({ input, output });

  try {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log('\nSelect target runtime:');
      console.log('  1) Claude Code');
      console.log('  2) OpenCode');
      console.log('  3) Gemini');

      const answer = await rl.question('Enter choice (1-3): ');

      // Map choice to runtime
      const runtimeMap = {
        '1': 'claude',
        '2': 'opencode',
        '3': 'gemini'
      };

      if (runtimeMap[answer]) {
        return runtimeMap[answer];
      }

      // Invalid input
      console.log(`Invalid choice: "${answer}". Please enter 1, 2, or 3.`);

      if (attempt === maxAttempts - 1) {
        console.error('Too many invalid attempts. Exiting.');
        process.exitCode = 1;
        return null;
      }
    }
  } catch (error) {
    // Handle readline errors (e.g., Ctrl-D)
    return null;
  } finally {
    rl.close();
  }
}

/**
 * Prompt user to select installation scope
 * @param {string} runtime - Runtime name for display purposes
 * @returns {Promise<string|null>} 'global' | 'local' or null if cancelled
 */
export async function promptForScope(runtime) {
  const rl = createInterface({ input, output });

  try {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log('\nInstall location:');
      console.log(`  1) Global (~/.${runtime}/commands)`);
      console.log(`  2) Local (.${runtime}/commands in current directory)`);

      const answer = await rl.question('Enter choice (1-2): ');

      // Map choice to scope
      const scopeMap = {
        '1': 'global',
        '2': 'local'
      };

      if (scopeMap[answer]) {
        return scopeMap[answer];
      }

      // Invalid input
      console.log(`Invalid choice: "${answer}". Please enter 1 or 2.`);

      if (attempt === maxAttempts - 1) {
        console.error('Too many invalid attempts. Exiting.');
        process.exitCode = 1;
        return null;
      }
    }
  } catch (error) {
    // Handle readline errors (e.g., Ctrl-D)
    return null;
  } finally {
    rl.close();
  }
}

/**
 * Prompt user for overwrite confirmation when existing installation found
 * @param {string} existingVersion - Version string of existing installation
 * @returns {Promise<boolean>} true if user confirms overwrite, false otherwise
 */
export async function promptForOverwrite(existingVersion) {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(
      `Found existing Banneker installation (v${existingVersion}). Overwrite? (y/N): `
    );

    // Default to N - only 'y' or 'Y' returns true
    return answer.trim().toLowerCase() === 'y';
  } catch (error) {
    // Handle readline errors (default to no)
    return false;
  } finally {
    rl.close();
  }
}
