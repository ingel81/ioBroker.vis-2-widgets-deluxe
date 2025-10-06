const path = require('path');
const { tests } = require('@iobroker/testing');

// Run integration tests - validates the adapter starts properly
tests.integration(path.join(__dirname, '..'), {
    // If the adapter requires a config to run, provide it here
    // This is especially needed for UI-based adapters like vis widgets
    allowedExitCodes: [0],
});