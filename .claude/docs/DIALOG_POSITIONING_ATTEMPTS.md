# Dialog-Positionierung: Fehlgeschlagene Lösungsansätze

**Problem:** Dialoge in `OneIconToRuleThemAll` Widget öffnen sich außerhalb des sichtbaren Viewports in vis-2, sowohl auf Mobile als auch Desktop. User muss scrollen, um den Dialog zu sehen.

**Ziel:** Dialog soll immer im sichtbaren Viewport-Bereich erscheinen, ohne dass der User scrollen muss.

**Datum:** 2025-11-25

---

## Versuch 1: CSS `position: fixed` mit `!important`

**Ansatz:** Dialog-Container mit `position: fixed !important` auf allen Ebenen setzen.

```tsx
<Dialog
    sx={{
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        right: '0 !important',
        bottom: '0 !important',
        zIndex: '1300 !important',
        '& .MuiDialog-container': {
            alignItems: 'center !important',
        },
    }}
    slotProps={{
        paper: {
            sx: theme => ({
                ...(theme.breakpoints.down('sm') && {
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderRadius: '16px 16px 0 0',
                    maxHeight: '80vh',
                }),
                ...(theme.breakpoints.up('sm') && {
                    borderRadius: 2,
                }),
            }),
        },
    }}
>
```

**Ergebnis:** ❌ **Fehlgeschlagen**
- Dialog erschien weiterhin außerhalb des sichtbaren Bereichs (links unten)
- Auf Mobile: Dialog unten, User muss nach unten scrollen
- Auf Desktop: Dialog links unten, nicht zentriert

**Ursache (Vermutung):** vis-2 Layout-System verwendet wahrscheinlich CSS-Properties, die `position: fixed` brechen:
- `transform` auf Parent-Elementen
- CSS `contain` oder `isolation`
- Eigenes Coordinate-System durch CSS-Container

---

## Versuch 2: `slotProps.root` mit inline `style`

**Ansatz:** Zusätzlich zu `sx` auch inline `style` auf dem Root-Element setzen (höchste CSS-Priorität).

```tsx
<Dialog
    sx={{ /* ... */ }}
    slotProps={{
        root: {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1300,
            },
        },
        backdrop: {
            sx: {
                position: 'fixed !important',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
            },
        },
        // ...
    }}
>
```

**Ergebnis:** ❌ **Fehlgeschlagen**
- Keine Verbesserung gegenüber Versuch 1
- Dialog weiterhin außerhalb des sichtbaren Bereichs

**Erkenntnis:** CSS allein reicht nicht aus. Das Problem liegt tiefer im vis-2 Layout-System.

---

## Versuch 3: `scrollIntoView()` mit `componentDidUpdate`

**Ansatz:** JavaScript-basierte Lösung - automatisch zum Dialog scrollen, wenn er geöffnet wird.

```tsx
componentDidUpdate(prevProps, prevState) {
    if (!prevState.dialog && this.state.dialog && this.dialogPaperRef.current) {
        requestAnimationFrame(() => {
            this.dialogPaperRef.current?.scrollIntoView({
                behavior: 'instant',
                block: 'center',
                inline: 'center',
            });
        });
    }
}
```

**Ergebnis:** ❌ **Fehlgeschlagen / Abgebrochen**
- **User-Anforderung:** Dialog soll NICHT scrollen, sondern im sichtbaren Bereich erscheinen
- Scrollen ist keine akzeptable UX-Lösung

**Erkenntnis:** Auto-Scroll ist nicht gewünscht. Dialog muss intelligent im sichtbaren Bereich positioniert werden.

---

## Versuch 4: MUI `Modal` statt `Dialog`

**Ansatz:** `Dialog` durch `Modal` ersetzen - besseres Positionierungs-System.

```tsx
<Modal
    open={true}
    onClose={this.handleDialogClose}
    sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
    }}
>
    <Box sx={theme => ({
        outline: 'none',
        maxWidth: widthConstraints[dialogWidth].maxWidth,
        width: '100%',
        backgroundColor: backgroundColor || '#fff',
        boxShadow: 24,
        ...(theme.breakpoints.down('sm') && {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '80vh',
            borderRadius: '16px 16px 0 0',
            overflow: 'auto',
        }),
        ...(theme.breakpoints.up('sm') && {
            borderRadius: 2,
            m: 2,
            maxHeight: '90vh',
            overflow: 'auto',
        }),
    })}>
        {/* Dialog Content */}
    </Box>
</Modal>
```

**Ergebnis:** ❌ **Fehlgeschlagen (unerwünschter Nebeneffekt)**
- Modal funktionierte besser als Dialog
- **Problem:** View scrollt automatisch zum Modal (Focus-Management)
- User beschwert sich: "er scrollt jetzt zum dialog?"

**Erkenntnis:** MUI's Focus-Management triggert Auto-Scroll im vis-2 Container. Auch keine Lösung.

---

## Zusammenfassung

Alle CSS- und JavaScript-basierten Ansätze sind fehlgeschlagen:

| Versuch | Ansatz | Ergebnis | Grund |
|---------|--------|----------|-------|
| 1 | CSS `position: fixed !important` | ❌ | vis-2 Layout bricht fixed positioning |
| 2 | Inline `style` + `slotProps.root` | ❌ | Keine Verbesserung |
| 3 | JavaScript `scrollIntoView()` | ❌ | User will NICHT scrollen |
| 4 | MUI `Modal` statt `Dialog` | ❌ | Auto-Scroll durch Focus-Management |

---

## Nächste mögliche Ansätze

### Option A: `disablePortal` mit Custom Container
Dialog innerhalb des Widget-Containers rendern statt im Portal (body).

**Pros:**
- Dialog ist Teil des Widget-Layouts
- Könnte besser mit vis-2 harmonieren

**Cons:**
- Backdrop könnte nur Widget abdecken, nicht ganze View
- Z-Index-Probleme mit anderen Widgets möglich

### Option B: Custom Dialog mit Absolute Positioning
Eigenen Dialog-Wrapper bauen ohne MUI Portal-System.

**Pros:**
- Volle Kontrolle über Positionierung
- Kann relativ zum Widget positioniert werden

**Cons:**
- Viel Arbeit (Backdrop, Animations, Accessibility)
- Reinventing the wheel

### Option C: vis-2 Layout-System analysieren
Genau verstehen, wie vis-2 Layout funktioniert (CSS Inspection).

**Pros:**
- Könnte Root-Cause finden
- Echte Lösung statt Workaround

**Cons:**
- Zeitaufwändig
- vis-2 Source-Code-Analyse nötig

### Option D: Popover mit Anchor
MUI Popover mit Widget als Anchor - intelligente Positionierung.

**Pros:**
- Eingebautes Positioning relativ zum Anchor
- Automatische Viewport-Anpassung

**Cons:**
- Andere Semantik als Dialog
- Anchor muss sichtbar sein

---

## Empfehlung

**Nächster Schritt:** Browser DevTools Analyse
- Dialog öffnen und Element inspizieren
- Computed Styles prüfen
- Parent-Elemente auf `transform`, `contain`, `isolation` prüfen
- vis-2 Container-Struktur verstehen

**Dann:** Entscheidung zwischen Option A (disablePortal) oder Option D (Popover) basierend auf Erkenntnissen.

---

## ✅ WORKING SOLUTION (2025-11-25)

**Ansatz:** JavaScript-basierte Positionierung mit `componentDidUpdate` + DOM-Manipulation

### Kern-Idee

MUI Dialog wird normal gerendert, dann **nach dem Rendern** via JavaScript repositioniert:

```typescript
componentDidUpdate(prevProps, prevState) {
    if (!prevState.dialog && this.state.dialog) {
        this.moveDialogIntoView();  // Positioniere Dialog nach Öffnen
    }
}
```

### Implementation

**Datei:** `src-widgets/src/OneIconToRuleThemAll/index.tsx`

**Methode:** `moveDialogIntoView()`

```typescript
private moveDialogIntoView(): void {
    const tryPositioning = (attempt: number): void => {
        const dialogPaper = document.querySelector('.MuiDialog-paper') as HTMLElement;
        if (!dialogPaper) { /* retry with delay */ return; }

        // Dimensionen ermitteln
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const bodyHeight = document.body.scrollHeight;

        // KRITISCH: Viewport-Breite für horizontal, Body-Höhe für vertikal!
        const effectiveHeight = Math.min(bodyHeight, viewportHeight);
        const effectiveWidth = viewportWidth;  // ← KEY!

        const dialogWidth = dialogPaper.offsetWidth;
        const dialogHeight = dialogPaper.offsetHeight;

        // Mobile vs Desktop
        const isMobile = effectiveWidth < 700;

        if (isMobile) {
            // MOBILE: Links aligned, 10px Padding
            const finalWidth = Math.min(dialogWidth, effectiveWidth - 20);
            const finalLeft = 10;
            const finalTop = Math.max(20, (effectiveHeight - dialogHeight) / 2);

            dialogPaper.style.setProperty('position', 'absolute', 'important');
            dialogPaper.style.setProperty('left', `${finalLeft}px`, 'important');
            dialogPaper.style.setProperty('top', `${finalTop}px`, 'important');
            dialogPaper.style.setProperty('width', `${finalWidth}px`, 'important');
        } else {
            // DESKTOP: Zentriert, 40px Padding
            const finalWidth = Math.min(dialogWidth, effectiveWidth - 80);
            const centerX = (effectiveWidth - finalWidth) / 2;
            const centerY = (effectiveHeight - dialogHeight) / 2;

            dialogPaper.style.setProperty('position', 'absolute', 'important');
            dialogPaper.style.setProperty('left', `${centerX}px`, 'important');
            dialogPaper.style.setProperty('top', `${centerY}px`, 'important');
            dialogPaper.style.setProperty('width', `${finalWidth}px`, 'important');
        }

        // Gemeinsam
        dialogPaper.style.setProperty('transform', 'none', 'important');
        dialogPaper.style.setProperty('margin', '0', 'important');
        dialogPaper.style.setProperty('overflow', 'auto', 'important');
    };

    tryPositioning(1);
}
```

### Key Learnings

| Problem | Lösung |
|---------|--------|
| **Viewport vs. Body** | Height: `min(body, viewport)`, Width: `viewport` only |
| **Mobile UX** | Links aligned (10px), nicht zentriert → kein Abschneiden |
| **Desktop UX** | Zentriert mit mehr Padding (40px) |
| **Timing** | `setTimeout` + Retry-Mechanismus (DOM muss bereit sein) |
| **CSS Priority** | `setProperty('prop', 'value', 'important')` überschreibt MUI |

### Warum funktioniert es?

1. **vis-2 Problem:** Viewport-Höhe künstlich groß (1474px), Body-Höhe real (844px)
2. **Unsere Lösung:** Nutzt `min(body, viewport)` für Höhe → 844px
3. **Horizontales Problem:** Body-Breite inkl. Scrollbar (681px), Viewport ist echter sichtbarer Bereich (682px)
4. **Unsere Lösung:** Nutzt `viewportWidth` (nicht `bodyWidth`) → keine horizontale Abschneidung

### Ergebnis

✅ **Mobile:** Links aligned bei 10px, voll sichtbar
✅ **Desktop:** Zentriert, voll sichtbar
✅ **Kein Scrollen** nötig
✅ **Funktioniert** in scrollbaren vis-2 Views

---

**Status:** Working Solution implementiert in `OneIconToRuleThemAll/index.tsx` (2025-11-25)
