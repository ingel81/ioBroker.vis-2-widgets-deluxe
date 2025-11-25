# Plan: Formel-Feld und Text-Ausrichtung für Display Modi

## Übersicht
Erweiterung der Display-Modi um:
1. **Formel-Feld** (nur NumericDisplay) - Sichere mathematische Berechnungen vor der Anzeige
2. **Text-Ausrichtung** (Numeric + String Display) - Links/Mitte/Rechts für den angezeigten Wert

---

## 1. Formel-Evaluierung

### Bibliothek: `math-expression-evaluator`
- Aktiv gepflegt (letztes Update: 2025-06-06, Version 2.0.7)
- Leichtgewichtig (~68KB)
- Sandboxed Evaluation (kein eval/Function)
- TypeScript Support

### Variable x für Rohwert:
```typescript
import Mexp from 'math-expression-evaluator';
const mexp = new Mexp();
const xToken = { type: 3, show: 'x', token: 'x', value: 'x' };
mexp.eval('x / 1000', [xToken], { x: 5000 }); // → 5
```

### Sicherheit:
- Nur Variable `x` verfügbar
- Try-Catch mit Fallback auf Rohwert

### Beispiel-Formeln:
- `x / 1000` → W zu kW
- `x * 1.8 + 32` → °C zu °F
- `sqrt(x)` → Wurzel
- `round(x / 100) * 100` → Auf 100er runden

---

## 2. Text-Ausrichtung (beide Modi)

### Optionen:
- `left` - Linksbündig (default)
- `center` - Zentriert
- `right` - Rechtsbündig

### Anwendung:
- Gilt für NumericDisplay UND StringDisplay
- CSS `textAlign` Property auf Typography

---

## Zu ändernde Dateien

### 1. `src-widgets/package.json`
```bash
cd src-widgets && npm install math-expression-evaluator
```

### 2. `src-widgets/src/OneIconToRuleThemAll/utils/formulaEvaluator.ts` (NEU)
```typescript
import Mexp from 'math-expression-evaluator';

const X_TOKEN = { type: 3, show: 'x', token: 'x', value: 'x' };

export function evaluateFormula(formula: string | undefined, x: number): number | null {
    if (!formula || formula.trim() === '' || formula.trim() === 'x') {
        return null; // Keine Änderung nötig
    }

    try {
        const mexp = new Mexp();
        const result = mexp.eval(formula, [X_TOKEN], { x });

        if (typeof result !== 'number' || !isFinite(result)) {
            return null;
        }

        return result;
    } catch (error) {
        console.warn('[formulaEvaluator] Evaluation failed:', error);
        return null;
    }
}
```

### 3. `src-widgets/src/OneIconToRuleThemAll/types/index.ts`

**NumericDisplayModeConfig erweitern:**
```typescript
export interface NumericDisplayModeConfig {
    // ... bestehende Felder ...
    formula?: string;  // NEU: z.B. "x / 1000"
}
```

**Neuen Type für TextAlign:**
```typescript
export type TextAlign = 'left' | 'center' | 'right';
```

**OneIconToRuleThemAllRxData erweitern:**
```typescript
// Im Display-Bereich:
displayTextAlign?: TextAlign;  // NEU: Gilt für beide Display-Modi
```

### 4. `src-widgets/src/OneIconToRuleThemAll/config/widgetInfo.ts`

**Im Numeric Display Bereich (nach numericDisplayValueMapping):**
```typescript
{
    name: 'numericDisplayFormula',
    label: 'numeric_display_formula',
    type: 'text',
    tooltip: 'numeric_display_formula_tooltip',
    default: 'x',  // Default: Rohwert unverändert
},
```

**Im Display Settings Bereich (displayIconTextGap etc.):**
```typescript
{
    name: 'displayTextAlign',
    label: 'display_text_align',
    type: 'select',
    options: [
        { value: 'left', label: 'align_left' },
        { value: 'center', label: 'align_center' },
        { value: 'right', label: 'align_right' },
    ],
    default: 'left',
},
```

### 5. `src-widgets/src/OneIconToRuleThemAll/modes/NumericDisplayMode.ts`

**Import hinzufügen:**
```typescript
import { evaluateFormula } from '../utils/formulaEvaluator';
```

**In `updateValue()` nach `toNumber()` und VOR allem anderen:**
```typescript
private updateValue(rawValue: unknown): void {
    let numValue = toNumber(rawValue);

    if (numValue === null) {
        // ... bestehender null-handling Code ...
        return;
    }

    // NEU: Apply formula BEFORE any formatting
    if (this.config.formula) {
        const calculated = evaluateFormula(this.config.formula, numValue);
        if (calculated !== null) {
            numValue = calculated;
        }
        // Bei Fehler: Original-Wert beibehalten
    }

    // ... Rest der Methode unverändert ...
}
```

### 6. `src-widgets/src/OneIconToRuleThemAll/components/HorizontalDisplay.tsx`

**Props erweitern:**
```typescript
interface HorizontalDisplayProps {
    // ... bestehende Props ...
    textAlign?: 'left' | 'center' | 'right';  // NEU
}
```

**Typography Style anpassen:**
```typescript
<Typography
    sx={{
        color: valueColor,
        fontSize: `${valueFontSize}px`,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        textAlign: textAlign || 'left',  // NEU
        width: '100%',  // Für textAlign wirksam
    }}
>
```

### 7. `src-widgets/src/OneIconToRuleThemAll/components/VerticalDisplay.tsx`

**Analog zu HorizontalDisplay:**
- Props erweitern
- Typography mit textAlign

### 8. `src-widgets/src/OneIconToRuleThemAll/index.tsx`

**In `renderContent()` bei NUMERIC_DISPLAY und STRING_DISPLAY:**
```typescript
case FlexMode.NUMERIC_DISPLAY:
case FlexMode.STRING_DISPLAY: {
    // ... bestehender Code ...

    return isVertical ? (
        <VerticalDisplay
            // ... bestehende Props ...
            textAlign={this.state.rxData.displayTextAlign}  // NEU
        />
    ) : (
        <HorizontalDisplay
            // ... bestehende Props ...
            textAlign={this.state.rxData.displayTextAlign}  // NEU
        />
    );
}
```

### 9. `src-widgets/src/translations.ts`

**English (en):**
```typescript
numeric_display_formula: 'Formula',
numeric_display_formula_tooltip: 'Formula with x as value (e.g. x / 1000 for W→kW)',
display_text_align: 'Text Alignment',
align_left: 'Left',
align_center: 'Center',
align_right: 'Right',
```

**German (de):**
```typescript
numeric_display_formula: 'Formel',
numeric_display_formula_tooltip: 'Formel mit x als Wert (z.B. x / 1000 für W→kW)',
display_text_align: 'Textausrichtung',
align_left: 'Links',
align_center: 'Mitte',
align_right: 'Rechts',
```

---

## Implementierungsreihenfolge

1. `cd src-widgets && npm install math-expression-evaluator`
2. `formulaEvaluator.ts` erstellen
3. `types/index.ts` erweitern (TextAlign, formula)
4. `NumericDisplayMode.ts` - Formel-Auswertung einbauen
5. `widgetInfo.ts` - Config-Felder hinzufügen
6. `HorizontalDisplay.tsx` + `VerticalDisplay.tsx` - textAlign Prop
7. `index.tsx` - textAlign durchreichen
8. `translations.ts` - Labels (EN + DE)
9. `npm run build && npm run lint`
10. Manueller Test im vis-2 Editor

---

## Test-Szenarien

### Formel-Tests:
- Default `x` → Originalwert unverändert
- `x / 1000` mit Wert 1500 → 1.5 anzeigen
- `x * 2` mit Wert 50 → 100 anzeigen
- Ungültige Formel → Originalwert (Fallback)
- Division durch 0 → Fallback oder Infinity-Handling

### TextAlign-Tests:
- NumericDisplay mit right → Zahl rechtsbündig
- StringDisplay mit center → Text zentriert
- Default (kein Wert) → linksbündig

---

*Erstellt: 2025-11-25*
