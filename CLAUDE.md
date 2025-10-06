# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ioBroker vis-2 custom widget development framework, transformed from the original Material widgets template. It provides a complete development environment with live-reload capabilities for creating custom widgets for ioBroker vis-2.

**Project Name**: ioBroker.vis-2-widgets-deluxe
**Purpose**: Custom widget development playground for ioBroker vis-2

## Quick Start Commands

### Initial Setup (one-time only)
```bash
npm run dev:setup  # Initialize dev-server environment
```

### Start Development Environment
```bash
npm run dev  # Starts everything: build watch, file sync, dev-server, auto-reload
```

This single command:
- Starts widget build in watch mode
- Syncs files every 2 seconds
- Runs ioBroker dev-server
- Auto-restarts vis-2 on widget changes for cache clearing
- Shows change counter in console

**Access Points:**
- Admin Panel: http://localhost:20426
- vis-2: http://localhost:8082/vis-2-beta/

## Architecture

### Project Structure
```
ioBroker.vis-2-widgets-deluxe/
├── src-widgets/              # Widget source code
│   ├── src/
│   │   ├── HelloWorld.tsx   # Example playground widget
│   │   ├── Generic.tsx      # Base widget class (all widgets extend this)
│   │   └── translations.ts  # i18n translations
│   ├── build/               # Build output (auto-generated, don't edit)
│   ├── vite.config.ts       # Module Federation configuration
│   └── package.json
├── widgets/                  # Compiled widgets (auto-synced from build)
├── .dev-server/             # Dev-server environment (auto-generated)
├── dev.sh                   # Main development script (npm run dev)
├── tasks.js                 # Build and copy tasks
├── io-package.json          # ioBroker adapter configuration
└── package.json            # Project scripts
```

### Key Technologies
- **UI Framework**: React 18 with Material-UI v6
- **Build Tool**: Vite with Module Federation
- **Language**: TypeScript
- **Widget Platform**: ioBroker vis-2
- **Base Class**: Generic.tsx (extends VisBaseWidget)
- **State Management**: ioBroker state bindings

## Development Workflow

1. **Edit code** in `src-widgets/src/`
2. **Automatic build** triggers via Vite watch
3. **Files sync** to widgets/ and .dev-server/
4. **vis-2 auto-restarts** when widget hash changes
5. **Browser refresh** (F5) to see changes

### Live-Reload Mechanism
The dev.sh script monitors widget file hashes. When a change is detected:
1. Files are synced to the dev-server
2. vis-2 adapter restarts to clear Module Federation cache
3. Browser refresh loads the new code

## Creating New Widgets

### Step 1: Create Widget File
```typescript
// src-widgets/src/MyWidget.tsx
import React from 'react';
import Generic from './Generic';
import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

interface MyWidgetData {
    myProperty: string;
    myNumber: number;
}

interface MyWidgetState extends VisRxWidgetState {
    localState: string;
}

class MyWidget extends Generic<MyWidgetData, MyWidgetState> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeMyWidget',
            visSet: 'vis-2-widgets-deluxe',
            visName: 'My Widget',
            visAttrs: [{
                name: 'common',
                fields: [{
                    name: 'myProperty',
                    label: 'my_property',
                    type: 'text',
                    default: 'Hello'
                }]
            }],
            visDefaultStyle: {
                width: 400,
                height: 300
            }
        };
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        return (
            <div>{this.state.rxData.myProperty}</div>
        );
    }
}

export default MyWidget;
```

### Step 2: Add to vite.config.ts
```typescript
exposes: {
    './HelloWorld': './src/HelloWorld',
    './MyWidget': './src/MyWidget',  // Add your widget here
    './translations': './src/translations.js',
}
```

### Step 3: Add to io-package.json
```json
"visWidgets": {
    "vis2deluxeWidgets": {
        "components": [
            "HelloWorld",
            "MyWidget"  // Add your widget here
        ]
    }
}
```

### Step 4: Add translations (optional)
Update `src-widgets/src/translations.ts` with your widget's labels.

## Widget API Reference

### Base Class Methods
- `getWidgetInfo()`: Returns widget metadata
- `renderWidgetBody()`: Main render method
- `componentDidMount()`: Lifecycle - widget mounted
- `componentDidUpdate()`: Lifecycle - props/state changed
- `getPropertyValue(propName)`: Get ioBroker state value
- `props.context.setValue(oid, value)`: Write ioBroker state

### Widget Configuration (visAttrs)
```typescript
{
    name: 'group_name',
    fields: [{
        name: 'property_name',
        label: 'translation_key',
        type: 'text|number|checkbox|color|id|select|custom',
        default: 'default_value',
        hidden: 'condition_string',  // e.g., '!data.showAdvanced'
        options: [{value: 'val', label: 'Label'}]  // for select
    }]
}
```

### State Binding
- Use `type: 'id'` in visAttrs to create state bindings
- Access via `this.getPropertyValue('propertyName')`
- Write via `this.props.context.setValue(oid, value)`

## Troubleshooting

### Changes not appearing?
1. **Hard refresh**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. **Clear browser cache**: F12 → Application → Clear site data
3. **Delete and re-add widget** in vis-2
4. Check console for "🔄 Changes detected" message

### Widget not in palette?
1. Check if added to io-package.json components
2. Check if added to vite.config.ts exposes
3. Restart dev environment: Ctrl+C then `npm run dev`

### Build errors?
1. Check TypeScript errors in src-widgets/src/
2. Check console output from build watch
3. Verify imports are correct

### Multiple processes warning?
The dev.sh script cleans up old processes automatically. If issues persist:
```bash
pkill -f "vite.*build.*watch"
pkill -f "dev-server"
```

## Important Implementation Notes

### Module Federation Caching
- Module Federation aggressively caches widgets
- File names include hash (e.g., HelloWorld-D5MHOB52.js)
- vis-2 restart clears this cache

### Widget State Management
- Widgets are React components extending Generic base class
- State comes from two sources:
  1. `this.state.rxData` - widget configuration
  2. `this.state.values` - ioBroker state values
- Edit mode detected via `this.state.editMode`

### File Sync Process
Every 2 seconds, the dev script:
1. Removes old files from widgets/vis-2-widgets-deluxe/
2. Copies from src-widgets/build/
3. Syncs to .dev-server/default/node_modules/

### vis-2 Auto-Restart
- Triggered when widget file hash changes
- Prevents stale Module Federation cache
- Shows "🔄 Changes detected (#N)" in console

## Testing & Quality Assurance

### Test Commands
```bash
npm test              # Run all tests
npm run test:js       # Widget unit tests
npm run test:package  # Package validation
npm run test:integration # Integration tests (skipped for vis-2 widgets)
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix linting errors
npm run check         # TypeScript type checking
npm run build         # Production build
```

### Linting Setup
- **Main directory**: ESLint configured in `eslint.config.mjs`
- **Widget sources**: Separate config in `src-widgets/eslint.config.mjs`
- **Auto-fix**: Available with `npm run lint:fix`
- **Prettier**: Integrated for consistent formatting

## Publishing & Release

### Build for Production
```bash
npm run build  # Creates production-ready widgets in /widgets
```

### Release Process
```bash
# Version bumps (choose one):
npm run release-patch  # 0.1.0 → 0.1.1
npm run release-minor  # 0.1.0 → 0.2.0
npm run release-major  # 0.1.0 → 1.0.0

# Interactive release:
npm run release  # Prompts for version
```

### GitHub Actions CI/CD
- **Automatic testing** on push/PR
- **Multi-platform**: Tests on Ubuntu, Windows, macOS
- **Node versions**: 20.x, 22.x
- **Checks**: Linting, type-checking, package validation, build

### NPM Publishing Requirements
1. Valid npm account: `npm login`
2. Repository on GitHub: `github.com/ingel81/ioBroker.vis-2-widgets-deluxe`
3. Clean git status (all committed)
4. Tests passing

## Environment Requirements

- Node.js 20 or higher (required for dependencies)
- npm or yarn
- Linux/macOS (Windows untested)
- ioBroker dev-server installed globally: `npm i -g @iobroker/dev-server`

## Known Limitations

1. **Browser cache**: Even with hard refresh, Service Workers may cache
2. **Hot Module Replacement**: Not available due to Module Federation
3. **Default values**: Only apply to NEW widget instances
4. **TypeScript**: Some vis-2 types require @ts-ignore due to mismatches

## Tips for Development

1. **Use Inkognito/Private browsing** to avoid persistent cache
2. **Keep DevTools open** with "Disable cache" checked
3. **Monitor console** for build and sync messages
4. **Test in vis-2 edit mode** for immediate feedback
5. **Use debug mode** in HelloWorld widget as reference

## Project Configuration Files

- **package.json**: NPM scripts and dependencies
- **io-package.json**: ioBroker adapter metadata
- **vite.config.ts**: Build and Module Federation setup
- **tasks.js**: Build orchestration and file copying
- **dev.sh**: Development environment script
- **eslint.config.mjs**: Linting rules
- **tsconfig.json**: TypeScript configuration

## License

MIT

## Project Metadata

- **Author**: ingel81 (ingel81@sgeht.net)
- **Repository**: https://github.com/ingel81/ioBroker.vis-2-widgets-deluxe
- **License**: MIT
- **Type**: visualization-widgets (pure UI, no backend)
- **Base Template**: ioBroker vis-2 Material widgets
- **Node Requirement**: >= 20.x

## Important Notes

### vis-2 Widget Adapter Specifics
- **No main.js required** - Pure UI widgets without backend logic
- **Integration tests skipped** - Not applicable for widget-only adapters
- **Module Federation** - Widgets loaded dynamically at runtime
- **Cache clearing** - vis-2 restart required for widget updates

### Development Best Practices
1. Always run `npm run dev` for development
2. Use `npm run lint:fix` before commits
3. Test in multiple browsers (cache issues vary)
4. Keep package-lock.json files in repo for CI/CD
5. Use semantic versioning for releases

---
*Last updated: 2025-10-06*
*This file helps Claude Code understand the project structure and development workflow*