#!/usr/bin/env node

// Watch src-widgets/build/ and copy to widgets/vis-2-widgets-deluxe/
// Simple polling-based watch - no external dependencies needed

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

// Project root is parent directory of scripts/
const PROJECT_ROOT = path.join(__dirname, '..');

const SRC = path.join(PROJECT_ROOT, 'src-widgets', 'build');
const DEST = path.join(PROJECT_ROOT, 'widgets', 'vis-2-widgets-deluxe');
const POLL_INTERVAL = 1000; // Check every second

console.log('📂 Watching for widget builds...');
console.log(`   Source: ${SRC}`);
console.log(`   Destination: ${DEST}`);
console.log('');

let lastMtime = 0;
let copying = false;

async function copyFiles() {
    if (copying) return;
    copying = true;

    try {
        // Ensure dest exists
        await fse.ensureDir(DEST);

        // Copy all files except index.html and mf-manifest.json
        const files = await fs.promises.readdir(SRC, { withFileTypes: true });

        for (const file of files) {
            const srcPath = path.join(SRC, file.name);
            const destPath = path.join(DEST, file.name);

            // Skip index.html and mf-manifest.json
            if (file.name === 'index.html' || file.name === 'mf-manifest.json') {
                continue;
            }

            // Copy files and directories
            await fse.copy(srcPath, destPath, { overwrite: true });
        }

        const timestamp = new Date().toLocaleTimeString();
        console.log(`✅ [${timestamp}] Files copied to widgets/`);

        // Restart vis-2 and our adapter (like YouTube example)
        console.log(`🔄 [${timestamp}] Restarting vis-2 and adapter...`);
        const { execSync } = require('child_process');
        try {
            const iobPath = path.join(PROJECT_ROOT, '.dev-server', 'default', 'iob');

            // Restart vis-2
            execSync(`${iobPath} restart vis-2`, {
                cwd: PROJECT_ROOT,
                stdio: 'pipe',
                timeout: 10000
            });

            // Restart our adapter
            execSync(`${iobPath} restart vis-2-widgets-deluxe`, {
                cwd: PROJECT_ROOT,
                stdio: 'pipe',
                timeout: 10000
            });

            console.log(`✅ [${timestamp}] vis-2 and adapter restarted`);
            console.log(`⏳ Wait ~20 seconds for vis-2 to fully restart, then refresh browser (F5)`);
        } catch (restartError) {
            console.error('⚠️  Could not restart:', restartError.message);
            console.log(`   Try manually: ./.dev-server/default/iob restart vis-2 && ./.dev-server/default/iob restart vis-2-widgets-deluxe`);
        }

    } catch (error) {
        console.error('❌ Copy error:', error.message);
    } finally {
        copying = false;
    }
}

async function checkAndCopy() {
    try {
        // Check if src directory exists
        if (!await fse.pathExists(SRC)) {
            return;
        }

        // Get latest modification time of any file in build directory
        const files = await fs.promises.readdir(SRC, { withFileTypes: true });
        let latestMtime = 0;

        for (const file of files) {
            const filePath = path.join(SRC, file.name);
            const stats = await fs.promises.stat(filePath);
            const mtime = stats.mtimeMs;
            if (mtime > latestMtime) {
                latestMtime = mtime;
            }
        }

        // If files changed, copy them
        if (latestMtime > lastMtime) {
            lastMtime = latestMtime;
            await copyFiles();
        }

    } catch (error) {
        // Silently ignore errors (e.g., directory doesn't exist yet)
    }
}

// Initial copy if build exists
(async () => {
    if (await fse.pathExists(SRC)) {
        console.log('🔄 Initial copy...');
        await copyFiles();
        console.log('');
    } else {
        console.log('⚠️  Source directory does not exist yet. Waiting for first build...');
        console.log('');
    }
})();

// Poll for changes
const intervalId = setInterval(checkAndCopy, POLL_INTERVAL);

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping watcher...');
    clearInterval(intervalId);
    process.exit(0);
});

process.on('SIGTERM', () => {
    clearInterval(intervalId);
    process.exit(0);
});
