# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ioBroker vis-2 custom widget development framework using Vite and Module Federation.

**Project Name**: ioBroker.vis-2-widgets-deluxe
**Purpose**: Custom widget development for ioBroker vis-2

## Quick Start

### Initial Setup (one-time)
```bash
npm run dev:setup  # Initialize dev-server
```

### Development
```bash
npm run dev  # Start dev environment
```

This starts:
- **ioBroker dev-server** (backend) on port 8082
- **Vite build watch** (auto-rebuild on changes)
- **File sync + vis-2 auto-restart** (on each build)

**Access:**
- Admin: http://localhost:8082/admin
- vis-2: http://localhost:8082/vis-2-beta/

## Development Workflow

**IMPORTANT: HMR (Hot Module Replacement) does NOT work with Module Federation. This is a known limitation.**

### The Real Workflow

1. **Start dev environment (once):**
   ```bash
   npm run dev
   ```

2. **Edit widget files** in `src-widgets/src/`

3. **Wait for automatic processing:**
   - Vite rebuilds (~2 seconds) - watch for "built in XXXms"
   - Files copied to widgets/
   - **vis-2 adapter restarts automatically** - watch for "vis-2 restarted"
   - **Wait ~20 seconds** for vis-2 to fully restart

4. **Refresh browser** (F5) to see changes
   - Changes should now be visible!
   - ⚠️ **Important**: Don't refresh immediately - wait ~20 seconds after restart message!

### Why No HMR?

Module Federation loads widgets as "remotes" at runtime. Vite's HMR cannot update remotes dynamically. This is the same for ALL vis-2 widget adapters using Module Federation.

### How vis-2 Restart Works

The dev workflow automatically runs:
```bash
./.dev-server/default/iob restart vis-2
```

This restarts the vis-2 adapter instance inside ioBroker, which clears its widget cache and reloads widgets from disk. This is the key to making live development work!

## Project Structure

```
ioBroker.vis-2-widgets-deluxe/
├── src-widgets/              # Widget source code
│   ├── src/
│   │   ├── HelloWorld.tsx   # Example widget
│   │   ├── DimmerWidget.tsx # Another widget
│   │   ├── Generic.tsx      # Base class
│   │   └── translations.ts  # i18n
│   ├── build/               # Vite output
│   ├── vite.config.ts       # Module Federation config
│   └── package.json
├── widgets/                  # Production builds (from tasks.js)
├── .dev-server/             # Dev-server environment
├── dev.sh                   # Development script
├── tasks.js                 # Production build
└── io-package.json          # Widget metadata
```

## Creating New Widgets

### 1. Create Widget File

```typescript
// src-widgets/src/MyWidget.tsx
import React from 'react';
import Generic from './Generic';
import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

class MyWidget extends Generic<MyWidgetData, MyWidgetState> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeMyWidget',
            visSet: 'vis-2-widgets-deluxe',
            visName: 'My Widget',
            visAttrs: [/* configuration */],
            visDefaultStyle: { width: 400, height: 300 }
        };
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        return <div>My Widget Content</div>;
    }
}

export default MyWidget;
```

### 2. Register in vite.config.ts

```typescript
exposes: {
    './HelloWorld': './src/HelloWorld',
    './MyWidget': './src/MyWidget',  // Add here
    './translations': './src/translations.js',
}
```

### 3. Register in io-package.json

```json
"visWidgets": {
    "vis2deluxeWidgets": {
        "components": ["HelloWorld", "MyWidget"]
    }
}
```

### 4. Rebuild

```bash
npm run build  # Production build
```

Or if dev is running, just edit and refresh browser.

## Commands

```bash
# Development
npm run dev          # Start dev environment
npm run dev:setup    # Initialize dev-server

# Building
npm run build        # Production build
npm run check        # TypeScript check

# Testing
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Auto-fix lint issues

# Release
npm run release-patch  # 0.1.0 → 0.1.1
npm run release-minor  # 0.1.0 → 0.2.0
npm run release-major  # 0.1.0 → 1.0.0
```

## Troubleshooting

### Changes not appearing?

1. **Wait for vis-2 restart** - Look for "vis-2 restarted" in console
2. **Wait ~20 seconds** - vis-2 needs time to fully restart
3. **Refresh browser** - F5 or Ctrl+R
4. **Hard refresh if needed** - Ctrl+Shift+R
5. **Clear cache if needed** - F12 → Application → Clear Storage

**Remember**: The workflow is working, but vis-2 needs ~20 seconds to restart after each change.

### Widget not in palette?

1. Check `io-package.json` components array
2. Check `vite.config.ts` exposes
3. Run `npm run build`
4. Run `dev-server upload` if needed

### Build errors?

1. Check TypeScript errors: `npm run check`
2. Check console output from Vite
3. Verify all imports are correct

## Technical Details

### Development Architecture

The development workflow uses:
1. **Vite build watch** - Monitors `src-widgets/src/` and rebuilds on changes
2. **watch-and-copy.js** - Polls `src-widgets/build/` and copies to `widgets/`
3. **Symlink** - `.dev-server/.../vis-2-widgets-deluxe → widgets/vis-2-widgets-deluxe`
4. **Auto-restart** - Restarts vis-2 adapter instance via `./.dev-server/default/iob restart vis-2`

Files flow: `src-widgets/src/` → (vite) → `src-widgets/build/` → (copy) → `widgets/` → (symlink) → `.dev-server/`

### Module Federation

Widgets are loaded as Module Federation remotes:
- **Development**: Built files in `src-widgets/build/`
- **Production**: Built files in `widgets/`
- **Entry point**: `customWidgets.js`

### Build Process

**Development (npm run dev):**
```
Edit file → Vite rebuild (~2s) → Browser refresh (manual)
```

**Production (npm run build):**
```
tasks.js → npm install → tsc → vite build → copy files
```

### File Watching

- Vite uses native file watchers (chokidar)
- Polling enabled with 1s interval for reliability
- Watches all files in `src-widgets/src/`

## Important Notes

### No HMR

- HMR requires host application to reload remotes
- Module Federation remotes cannot be hot-reloaded
- This affects ALL vis-2 widget adapters
- **Solution**: Build watch + browser refresh

### Widget State

Widgets are React components extending Generic:
- `this.state.rxData` - Widget configuration
- `this.state.values` - ioBroker state values
- `this.state.editMode` - Edit mode flag

### Development vs Production

- **Development**: `vite build --watch` in src-widgets/
- **Production**: `node tasks` builds to widgets/
- Both use same vite.config.ts

## Best Practices

1. **Always refresh browser** after changes
2. **Check console** for build completion
3. **Use TypeScript** - catches errors early
4. **Run lint** before commits
5. **Test in edit mode** - most features visible there

## Requirements

- Node.js 20 or higher
- npm or yarn
- ioBroker dev-server: `npm i -g @iobroker/dev-server`

## License

MIT

## Metadata

- **Author**: ingel81 (ingel81@sgeht.net)
- **Repository**: https://github.com/ingel81/ioBroker.vis-2-widgets-deluxe
- **Type**: visualization-widgets (pure UI)
- **Node**: >= 20.x

---
*Last updated: 2025-10-07*
