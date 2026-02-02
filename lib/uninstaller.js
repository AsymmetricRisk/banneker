/**
 * Safe uninstaller for Banneker files
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { BANNEKER_FILES } from './constants.js';

/**
 * Safely uninstall Banneker files from target directory
 * @param {string} commandsDir - Commands directory path
 * @param {string} configDir - Config directory path (currently unused but for future expansion)
 * @returns {Promise<boolean>} true if uninstall succeeded, false if no installation found
 */
export async function uninstall(commandsDir, configDir) {
  const versionPath = join(commandsDir, 'VERSION');

  // Check if Banneker is installed
  if (!existsSync(versionPath)) {
    console.log(`No Banneker installation found at ${commandsDir}`);
    return false;
  }

  try {
    let removedCount = 0;

    // Remove each tracked Banneker file
    for (const filename of BANNEKER_FILES) {
      const filePath = join(commandsDir, filename);

      if (existsSync(filePath)) {
        try {
          rmSync(filePath, { force: true });
          removedCount++;
        } catch (err) {
          // Handle permission errors
          if (err.code === 'EACCES' || err.code === 'EPERM') {
            console.error(`Permission denied: Cannot remove ${filePath}`);
            console.error('Try running with appropriate permissions (e.g., sudo)');
            process.exitCode = 1;
            return false;
          }
          throw err;
        }
      }
    }

    console.log(`Removed ${removedCount} Banneker file${removedCount === 1 ? '' : 's'} from ${commandsDir}`);
    return true;

  } catch (err) {
    console.error('Error during uninstall:', err.message);
    process.exitCode = 1;
    return false;
  }
}
