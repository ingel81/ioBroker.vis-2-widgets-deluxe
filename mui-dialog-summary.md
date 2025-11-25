# MUI 6 – Dialog Placement auf Mobile & in scrollbaren Views (Summary)

## 1. **Standard (Empfohlen)** – Dialog NICHT in der Scroll-View rendern
**Portal aktiv lassen** (`disablePortal` NICHT setzen).  
MUI rendert den Dialog in `body` → immer zentriert, unabhängig vom Scrollzustand.

```tsx
<Dialog open={open} onClose={onClose}>
  {children}
</Dialog>
```

---

## 2. **Bottom Sheet (Mobile)**

```tsx
<Dialog
  open={open}
  onClose={onClose}
  fullWidth
  PaperProps={{
    sx: {
      m: 0,
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
  }}
>
  {children}
</Dialog>
```

---

## 3. **Top-Aligned Dialog**

```tsx
<Dialog
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: { mt: 2, alignSelf: "flex-start" },
  }}
>
  {children}
</Dialog>
```

---

## 4. **Centered auf Mobile erzwingen**

```tsx
<Dialog
  open={open}
  onClose={onClose}
  fullWidth
  sx={{
    "& .MuiDialog-container": { alignItems: "center !important" },
  }}
>
  {children}
</Dialog>
```

---

## 5. **Responsiv: Mobile = Bottom Sheet, Desktop = Center**

```tsx
<Dialog
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: (theme) => ({
      ...(theme.breakpoints.down("sm") && {
        m: 0,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: "16px 16px 0 0",
      }),
      ...(theme.breakpoints.up("sm") && {
        borderRadius: 2,
      }),
    }),
  }}
>
  {children}
</Dialog>
```

---

# 📦 Scrollbare Views (ein- oder zweiachsig)

## 6. **Dialog in einer scrollbaren View sichtbar machen**  
(bei `disablePortal` + `container`)

### a) Automatisch via `scrollIntoView` (zweiachsig!)

```tsx
const paperRef = useRef(null);

useEffect(() => {
  if (open && paperRef.current) {
    paperRef.current.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "center",
    });
  }
}, [open]);

<Dialog
  open={open}
  onClose={onClose}
  disablePortal
  container={scrollContainerRef.current}
  slotProps={{ paper: { ref: paperRef } }}
>
  {children}
</Dialog>
```

---

## 7. **Grober Reset** – Scroll-View beim Öffnen einfach auf (0,0) setzen

```tsx
scrollContainerRef.current?.scrollTo({ top: 0, left: 0 });
setOpen(true);
```

---

# Empfehlung

| Situation | Beste Option |
|----------|--------------|
| **Normaler App-Flow** | Portal aktiv lassen → Dialog immer sichtbar |
| **Mobile Look & Feel** | Bottom Sheet |
| **Dialog muss im Scroll-Container bleiben** | `scrollIntoView(block:center, inline:center)` |
| **Legacy-Scroll-Chaos** | Scroll-Container auf (0,0) setzen |
