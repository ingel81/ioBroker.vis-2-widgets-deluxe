# Widget Development Guide

Technical documentation for developing vis-2 widgets in this project.

## Table of Contents

- [Widget Registration](#widget-registration)
- [Translation System](#translation-system)
- [Icon Rendering](#icon-rendering)
- [Layout and Styling](#layout-and-styling)
- [Development Workflow](#development-workflow)
- [Common Issues](#common-issues)

---

## Widget Registration

### Basic Widget Structure

Every widget must implement `getWidgetInfo()` with these required properties:

```typescript
static getWidgetInfo(): RxWidgetInfo {
    return {
        id: 'tplDeluxeMyWidget',              // Unique ID with 'tpl' prefix
        visSet: 'vis-2-widgets-deluxe',       // Widget set (must match folder name)
        visSetLabel: 'set_label',             // Translation key for widget set name
        visWidgetLabel: 'my_widget',          // Translation key for widget name
        visName: 'My Widget',                 // Fallback display name
        visAttrs: [...],                      // Configuration fields
        visDefaultStyle: {                    // Default dimensions
            width: 100,
            height: 100,
            position: 'relative',
        },
        visPrev: 'widgets/vis-2-widgets-deluxe/img/prev_my_widget.png',
    };
}
```

### Critical Properties

**`visSet`**: Must match the widget folder name exactly (e.g., `vis-2-widgets-deluxe`)
- Used by vis-2 to locate widget files
- NOT the name from io-package.json
- NOT a translation key

**`visSetLabel`**: Translation key for the widget set display name
- Value: `'set_label'` (standard across all vis-2 widgets)
- Maps to translation: `set_label: 'Deluxe Widgets'`
- This is what appears in the widget toolbox header

**`visWidgetLabel`**: Translation key for the widget display name
- Example: `'dimmer_widget'` → `dimmer_widget: 'Dimmer Widget'`

### Registration in vite.config.ts

```typescript
exposes: {
    './HelloWorld': './src/HelloWorld',
    './DimmerWidget': './src/DimmerWidget',
    './translations': './src/translations.ts',
}
```

### Registration in io-package.json

```json
"visWidgets": {
    "vis2deluxeWidgets": {
        "i18n": "component",
        "name": "vis2deluxeWidgets",
        "url": "vis-2-widgets-deluxe/customWidgets.js",
        "bundlerType": "module",
        "components": [
            "HelloWorld",
            "DimmerWidget"
        ]
    }
}
```

---

## Translation System

### File Structure

All translations live in `src-widgets/src/translations.ts`:

```typescript
const translations = {
    en: {
        set_label: 'Deluxe Widgets',           // Widget set name (REQUIRED)
        my_widget: 'My Widget',                // Widget name
        my_section: 'Deluxe - My Section',     // Section label
        my_field: 'My Field',                  // Field label
    },
    de: {
        set_label: 'Deluxe Widgets',
        my_widget: 'Mein Widget',
        my_section: 'Deluxe - Meine Sektion',
        my_field: 'Mein Feld',
    },
    // ... other languages
    prefix: 'vis_2_widgets_deluxe_',
};
```

### Translation Keys

**Widget Set Label** (appears in toolbox):
```typescript
// In getWidgetInfo():
visSetLabel: 'set_label',

// In translations.ts:
set_label: 'Deluxe Widgets',
```

**Widget Name**:
```typescript
// In getWidgetInfo():
visWidgetLabel: 'dimmer_widget',

// In translations.ts:
dimmer_widget: 'Dimmer Widget',
```

**Section Labels**:
```typescript
// In visAttrs:
{
    name: 'common',
    label: 'deluxe_common',  // Translation key
    fields: [...]
}

// In translations.ts:
deluxe_common: 'Deluxe - Common',
```

### Prefix System

The `prefix: 'vis_2_widgets_deluxe_'` is automatically prepended by vis-2 when resolving translation keys.

**DO NOT** use the prefix in your translation keys in code - vis-2 adds it automatically.

---

## Icon Rendering

### Using @iobroker/adapter-react-v5 Icon Component

**IMPORTANT**: Use the `Icon` component from `@iobroker/adapter-react-v5` for data URL icons (SVG base64).

```typescript
import { Icon } from '@iobroker/adapter-react-v5';

// In render:
<Icon
    src={icon}  // data:image/svg+xml;base64,... or http://...
    style={{
        width: iconSize,
        height: iconSize,
        color: iconColor,  // Works with SVG currentColor!
    }}
/>
```

### Why Not `<img>`?

The Icon component uses `react-inlinesvg` internally, which:
- Renders SVG inline (not as `<img>`)
- Allows CSS `color` property to work with `currentColor` in SVGs
- Enables dynamic recoloring

Using `<img src="data:image/svg+xml;base64,...">`:
- ❌ Cannot change SVG color with CSS
- ❌ CSS filters don't work properly
- ❌ Limited styling options

### Icon Configuration

```typescript
interface DimmerWidgetRxData {
    icon: string;           // icon64 field type stores base64 SVG
    iconSize: number;       // Size in pixels
    activeColor: string;    // Color when active
    inactiveColor: string;  // Color when inactive
}

// In visAttrs:
{
    name: 'icon',
    label: 'icon',
    type: 'icon64',  // Editor will provide SVG icon picker
    default: 'lightbulb',
}
```

### Fallback Icons

```typescript
const isDataUrl = icon.startsWith('data:') || icon.startsWith('http');

{isDataUrl ? (
    <Icon src={icon} style={{...}} />
) : (
    <LightbulbIcon sx={{...}} />  // MUI icon fallback
)}
```

---

## Layout and Styling

### Box Sizing for Cards

**IMPORTANT**: Always use `boxSizing: 'border-box'` for card containers with padding.

```typescript
<Box
    sx={{
        backgroundColor: '#ffffff',
        borderRadius: 1,
        boxShadow: 1,
        height: '100%',
        width: '100%',
        padding: 1,
        boxSizing: 'border-box',  // REQUIRED: includes padding in dimensions
        overflow: 'hidden',        // Prevents content overflow
        margin: 0,                 // Reset MUI defaults
    }}
>
    {content}
</Box>
```

**Without `boxSizing: 'border-box'`**:
- Widget appears larger than editor resize handles
- Padding adds to 100% width/height
- Misalignment in editor

### Preventing Icon Overflow

```typescript
<IconButton
    sx={{
        padding: 0,           // Remove default padding
        margin: 0,            // Remove default margin
        height: '100%',
        width: '100%',
    }}
>
    <Icon
        style={{
            width: iconSize,
            height: iconSize,
            maxWidth: '100%',   // Prevents overflow
            maxHeight: '100%',  // Prevents overflow
        }}
    />
</IconButton>
```

### Absolute Positioning for Labels

Use absolute positioning for percentage labels or other overlays:

```typescript
<Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
    <IconButton sx={{ height: '100%', width: '100%' }}>
        {/* Icon */}
    </IconButton>

    {showPercentage && (
        <Typography
            sx={{
                position: 'absolute',
                bottom: 2,
                left: 0,
                right: 0,
                textAlign: 'center',
                pointerEvents: 'none',  // Allow clicks to pass through
            }}
        >
            {value}%
        </Typography>
    )}
</Box>
```

### Theme Compatibility

Always test widgets in both light and dark themes. Use theme-aware colors or explicit color values:

```typescript
const iconColor = isOn
    ? rxData.activeColor || '#FFA726'   // Visible in dark theme
    : rxData.inactiveColor || '#757575'; // Visible in dark theme
```

---

## Development Workflow

### No Hot Module Replacement (HMR)

**IMPORTANT**: HMR does NOT work with Module Federation remotes.

**Development Cycle**:
1. Edit widget files in `src-widgets/src/`
2. Wait for Vite rebuild (~2 seconds)
3. Wait for vis-2 auto-restart (~20 seconds)
4. **Manually refresh browser** (F5)

### Auto-Restart Process

The `npm run dev` workflow automatically:
1. Watches `src-widgets/src/` with Vite
2. Rebuilds to `src-widgets/build/`
3. Copies files to `widgets/`
4. Restarts vis-2 adapter via `./.dev-server/default/iob restart vis-2`

**Watch for these messages**:
```
vite v5.x.x building for production...
✓ built in XXXms

vis-2 restarted
```

### Manual Upload

If auto-restart fails or you need to force a reload:

```bash
./.dev-server/default/iob upload vis-2-widgets-deluxe
./.dev-server/default/iob restart vis-2
```

### Production Build

Before committing or releasing:

```bash
npm run build
```

This runs the full production build pipeline:
- Clean install in `src-widgets/`
- TypeScript compilation
- Vite production build
- Copy to `widgets/` folder

---

## Common Issues

### Widget Set Name Shows as "vis-2-widgets-deluxe"

**Problem**: Widget toolbox shows technical name instead of "Deluxe Widgets"

**Solution**: Add `visSetLabel: 'set_label'` to ALL widgets' `getWidgetInfo()`:

```typescript
static getWidgetInfo(): RxWidgetInfo {
    return {
        id: 'tplDeluxeMyWidget',
        visSet: 'vis-2-widgets-deluxe',
        visSetLabel: 'set_label',  // ← REQUIRED
        // ...
    };
}
```

And ensure translation exists:
```typescript
set_label: 'Deluxe Widgets',  // In translations.ts
```

### Widget Not Loading (404 Errors)

**Problem**: Browser console shows 404 for asset files

**Causes**:
1. Asset file hashes changed but customWidgets.js not updated
2. Files not copied to `widgets/` folder
3. vis-2 cache not cleared

**Solution**:
```bash
npm run build                                          # Full rebuild
./.dev-server/default/iob upload vis-2-widgets-deluxe  # Re-upload
./.dev-server/default/iob restart vis-2                # Restart
```

Then hard refresh browser (Ctrl+Shift+R).

### Icons Not Visible in Dark Theme

**Problem**: Icon appears black on black background

**Cause**: SVG uses `currentColor` which inherits theme text color

**Solution**: Use Icon component with explicit color:

```typescript
import { Icon } from '@iobroker/adapter-react-v5';

<Icon
    src={svgDataUrl}
    style={{
        color: '#FFA726',  // Explicit color
    }}
/>
```

### Card Larger Than Resize Handles

**Problem**: Widget card extends beyond editor resize handles

**Cause**: Padding adds to 100% width/height

**Solution**: Add `boxSizing: 'border-box'`:

```typescript
<Box
    sx={{
        height: '100%',
        width: '100%',
        padding: 1,
        boxSizing: 'border-box',  // ← REQUIRED
    }}
/>
```

### Section Labels Show Translation Keys

**Problem**: Widget settings show "deluxe_common" instead of "Deluxe - Common"

**Causes**:
1. Translation not defined
2. Typo in translation key
3. vis-2 not restarted after adding translations

**Solution**:
1. Check translation exists in `translations.ts`
2. Verify key matches exactly (case-sensitive)
3. Run `npm run build` and upload + restart vis-2

### Changes Not Appearing

**Problem**: Code changes don't appear in browser

**Checklist**:
1. ✓ Wait for Vite rebuild message (~2s)
2. ✓ Wait for vis-2 restart (~20s)
3. ✓ Refresh browser (F5)
4. ✓ Hard refresh if needed (Ctrl+Shift+R)
5. ✓ Check browser console for errors
6. ✓ Clear browser cache if persistent

---

## Best Practices

### Widget Configuration

**Group related settings**:
```typescript
visAttrs: [
    { name: 'common', label: 'deluxe_common', fields: [...] },
    { name: 'icon', label: 'deluxe_icon_settings', fields: [...] },
    { name: 'dialog', label: 'deluxe_dialog_settings', fields: [...] },
]
```

**Prefix section labels** for better organization:
- ✓ `'Deluxe - Common'`
- ✓ `'Deluxe - Icon Settings'`
- ✗ `'Common'` (conflicts with other widgets)

### Translation Keys

**Use descriptive, namespaced keys**:
- ✓ `deluxe_common` (clear namespace)
- ✓ `dimmer_state` (specific)
- ✗ `state` (too generic)
- ✗ `common` (conflicts)

**Provide both English and German** at minimum:
```typescript
en: { my_key: 'My Label' },
de: { my_key: 'Mein Label' },
```

### Styling

**Always specify dimensions explicitly**:
```typescript
<Box sx={{
    width: iconSize,      // Not just width: '100%'
    height: iconSize,
    maxWidth: '100%',     // Prevent overflow
    maxHeight: '100%',
}}>
```

**Reset MUI defaults** when needed:
```typescript
sx={{
    padding: 0,    // MUI components may have default padding
    margin: 0,     // MUI components may have default margin
}}
```

### State Management

**Use local state for UI interactions**:
```typescript
interface MyWidgetState extends VisRxWidgetState {
    dialog: boolean;        // Dialog open/closed
    localValue: number;     // Current slider value
    isChanging: boolean;    // User is dragging
}
```

**Debounce state updates** for smooth UX:
```typescript
onDimmerChange = (value: number): void => {
    this.setState({ localValue: value, isChanging: true });

    if (this.changeTimeout) {
        clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
        this.finishChanging(value);
    }, 300);  // 300ms debounce
};
```

---

## Widget Checklist

Before committing a new widget:

- [ ] `visSet` matches folder name
- [ ] `visSetLabel: 'set_label'` added to getWidgetInfo()
- [ ] `set_label` translation exists (both EN and DE)
- [ ] Widget registered in vite.config.ts exposes
- [ ] Widget added to io-package.json components array
- [ ] Section labels use `deluxe_` prefix
- [ ] All translations defined (EN + DE minimum)
- [ ] Icons use Icon component from @iobroker/adapter-react-v5
- [ ] Layout uses `boxSizing: 'border-box'` for padded containers
- [ ] Tested in both light and dark themes
- [ ] Preview image created (180x90px PNG)
- [ ] `npm run build` completes without errors
- [ ] `npm run check` passes (TypeScript)
- [ ] `npm run lint` passes (ESLint)

---

## File References

**Widget Source**: `src-widgets/src/MyWidget.tsx`
**Translations**: `src-widgets/src/translations.ts`
**Vite Config**: `src-widgets/vite.config.ts`
**Package Info**: `io-package.json`
**Preview Images**: `src-widgets/public/img/prev_*.png`

---

Last updated: 2025-10-09
