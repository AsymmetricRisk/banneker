#!/usr/bin/env node

// SIGINT handler for graceful cancellation
process.on('SIGINT', () => {
  console.log('\nInstallation cancelled.');
  process.exit(130);
});

// Main entry point
(async () => {
  try {
    const { run } = await import('../lib/installer.js');
    await run();
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Error: Installer module not found. This may be an incomplete package.');
      console.error('Please ensure lib/installer.js exists.');
    } else {
      console.error('Error:', error.message);
    }
    process.exitCode = 1;
  }
})();
