![Logo](admin/vis-2-widgets-deluxe.png)

# Custom Deluxe Widgets for ioBroker.vis 2.0

![Number of Installations](http://iobroker.live/badges/vis-2-widgets-deluxe-installed.svg)
![Number of Installations](http://iobroker.live/badges/vis-2-widgets-deluxe-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis-2-widgets-deluxe.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-deluxe)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis-2-widgets-deluxe.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-deluxe)

[![NPM](https://nodei.co/npm/iobroker.vis-2-widgets-deluxe.png?downloads=true)](https://nodei.co/npm/iobroker.vis-2-widgets-deluxe/)

## Description

This adapter provides custom deluxe widgets for ioBroker vis-2. It serves as a framework for developing your own custom widgets with modern React and TypeScript.

## Current Widgets

### Hello World Widget

A demonstration widget that showcases the capabilities of the framework:

- **Interactive Counter**: Increment/decrement with min/max limits
- **State Binding**: Connect to ioBroker states for real-time updates
- **Customization**: Colors, fonts, and sizes
- **Debug Mode**: View widget internals for development
- **User Input**: Text fields and interactive elements

![Hello World Widget](img/hello-world-preview.png)

## Development

### Prerequisites

- Node.js 18 or higher
- ioBroker vis-2 installed

### Setup

1. Clone this repository
2. Install dependencies:
    ```bash
    npm install
    cd src-widgets
    npm install
    ```

### Creating New Widgets

1. Create a new TypeScript file in `src-widgets/src/`:

    ```typescript
    // MyWidget.tsx
    import React from 'react';
    import Generic from './Generic';

    class MyWidget extends Generic<MyWidgetData, MyWidgetState> {
        static getWidgetInfo(): RxWidgetInfo {
            return {
                id: 'tplDeluxeMyWidget',
                visSet: 'vis-2-widgets-deluxe',
                visName: 'My Widget',
                // ... configuration
            };
        }

        renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
            // Your widget rendering logic
        }
    }
    ```

2. Add your widget to `vite.config.ts`:

    ```typescript
    exposes: {
        './HelloWorld': './src/HelloWorld',
        './MyWidget': './src/MyWidget',  // Add your widget here
        './translations': './src/translations.js',
    }
    ```

3. Update `io-package.json`:
    ```json
    "components": [
        "HelloWorld",
        "MyWidget"  // Add your widget here
    ]
    ```

### Build Commands

```bash
# Full build
npm run build

# Development server
cd src-widgets
npm start

# Lint code
npm run lint

# Run tests
npm test
```

### Widget API

Each widget extends the `Generic` base class and must implement:

- `static getWidgetInfo()`: Widget metadata and configuration
- `renderWidgetBody()`: Main rendering logic

Available hooks:

- `componentDidMount()`: Widget initialization
- `componentDidUpdate()`: React to prop/state changes
- `getPropertyValue()`: Get ioBroker state values

### State Management

Widgets can interact with ioBroker states:

```typescript
// Read a state value
const value = this.getPropertyValue('myStateOid');

// Write a state value
this.props.context.setValue('myStateOid', newValue);
```

## Project Structure

```
├── src-widgets/
│   ├── src/
│   │   ├── HelloWorld.tsx      # Example widget
│   │   ├── Generic.tsx         # Base widget class
│   │   └── translations.ts     # i18n translations
│   ├── vite.config.ts          # Build configuration
│   └── package.json
├── widgets/                     # Built widget files (auto-generated)
├── admin/                       # Admin panel files
├── img/                         # Widget preview images
└── io-package.json             # ioBroker package configuration
```

## Features

- 🚀 **Modern Stack**: React 18, TypeScript, Vite
- 🎨 **Material-UI**: Beautiful components out of the box
- 🔧 **Easy Development**: Hot-reload development server
- 🌍 **i18n Support**: Multi-language ready
- 📦 **Module Federation**: Efficient widget loading
- 🧪 **Testing Ready**: Jest testing setup included

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-widget`
3. Commit your changes: `git commit -am 'Add my widget'`
4. Push to the branch: `git push origin feature/my-widget`
5. Submit a pull request

## Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ### **WORK IN PROGRESS**
-->
### 0.1.1 (2025-10-12)

- Testrelease

### 0.1.0 (2024-01-XX)

- Initial release with HelloWorld widget
- Basic framework setup
- Development environment configured

## License

MIT License

Copyright (c) 2025 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
