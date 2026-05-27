# Visual Redesign — Surface Polish (Opción A)
**Fecha:** 2026-05-27  
**Proyecto:** Klarity — Plataforma de Gestión de Gastos Personales (Ingeniería Web II)  
**Alcance:** Todas las páginas · Solo CSS (HTML/CSS/JS puro, Bootstrap 5.3, sin nuevas dependencias)

---

## Objetivo

Modernizar la apariencia visual de Klarity mediante glassmorphism, sombras en capas, glow effects y una mejora del hero section. Sin cambiar estructura HTML ni añadir dependencias. Cambios incrementales y reversibles.

---

## Restricciones del proyecto

- Frontend: HTML + CSS + JavaScript vanilla únicamente
- Bootstrap 5.3.3 como base (no reemplazar)
- Sin frameworks JS adicionales (React, Vue, etc.)
- Sin nuevas librerías CSS
- Debe mantenerse responsive y compatible con modo oscuro
- No tocar lógica de backend (NestJS) ni endpoints

---

## Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `Frontend/public/src/css/variables.css` | Agregar tokens glass, glow, sombras en capas |
| `Frontend/public/src/css/styles.css` | Navbar, hero, cards, botones, stats strip |
| `Frontend/public/src/css/dashboard.css` | KPI cards, sidebar, topbar |
| `Frontend/public/src/css/login.css` | Panel izquierdo, inputs |

---

## Sección 1 — Design Tokens (`variables.css`)

Agregar a `:root` sin eliminar tokens existentes:

```css
/* Glass */
--k-glass-bg:     rgba(255,255,255,0.72);
--k-glass-border: rgba(255,255,255,0.55);
--k-glass-blur:   blur(18px) saturate(180%);

/* Layered shadows (reemplazan las planas) */
--k-shadow-sm: 0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(59,130,246,.06);
--k-shadow:    0 4px 12px rgba(0,0,0,.06), 0 8px 32px rgba(59,130,246,.08);
--k-shadow-lg: 0 8px 24px rgba(0,0,0,.08), 0 24px 64px rgba(59,130,246,.14);

/* Glow */
--k-glow-primary: 0 0 20px rgba(59,130,246,.35);
```

Dark mode equivalentes:
```css
--k-glass-bg:     rgba(26,32,48,0.80);
--k-glass-border: rgba(255,255,255,0.08);
--k-shadow-sm: 0 1px 4px rgba(0,0,0,.5), 0 2px 8px rgba(59,130,246,.08);
--k-shadow:    0 4px 20px rgba(0,0,0,.45), 0 8px 32px rgba(59,130,246,.10);
--k-shadow-lg: 0 16px 56px rgba(0,0,0,.6), 0 24px 64px rgba(59,130,246,.16);
--k-glow-primary: 0 0 24px rgba(96,165,250,.4);
```

---

## Sección 2 — Landing page (`styles.css`)

### Navbar
- Reforzar `backdrop-filter` existente a `blur(20px) saturate(200%)`
- Agregar transición de sombra al hacer scroll: clase `.scrolled` vía JS ya existente o inline

### Hero (`.k-hero`)
- Agregar tercera orbe ambient: `radial-gradient(ellipse 500px 400px at 50% 50%, rgba(6,182,212,.07) 0%, transparent 60%)`
- Densificar malla de puntos: `background-size: 32px 32px` (era 40px)

### Feature cards (`.k-card`)
- En hover: `box-shadow: var(--k-shadow-lg), 0 0 0 1.5px var(--k-primary), var(--k-glow-primary)`
- Transición extendida a `0.3s`

### Botones primarios (`.btn-k-primary`)
- Shimmer con gradiente animado: `background-size: 200% 100%` + `@keyframes kShimmer`
- En hover: añadir `var(--k-glow-primary)` al box-shadow existente

### Stats strip (`.k-stat-item`)
- Agregar fondo glass: `background: var(--k-glass-bg); backdrop-filter: var(--k-glass-blur); border: 1px solid var(--k-glass-border); border-radius: var(--k-radius);`
- Padding interno: `1rem 1.5rem`

---

## Sección 3 — Dashboard (`dashboard.css`)

### KPI cards (`.kpi-card`)
- Fondo: `background: linear-gradient(135deg, var(--k-surface) 0%, var(--k-primary-s) 100%)`
- Sombra: `var(--k-shadow)` (layered)
- Ícono recibe `box-shadow` del color de su categoría en hover

### Sidebar
- Borde derecho con gradiente: `border-right: 1px solid transparent; background-image: linear-gradient(var(--k-surface), var(--k-surface)), linear-gradient(to bottom, transparent, var(--k-border), transparent); background-clip: padding-box, border-box;`

### Topbar (`.dash-topbar`)
- `backdrop-filter: blur(16px) saturate(180%)`
- Sombra: `var(--k-shadow-sm)`

---

## Sección 4 — Login (`login.css`)

### Panel izquierdo (`.login-side`)
- Reemplazar gradiente actual por: `linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 35%, #0369a1 70%, #0e7490 100%)`
- Agregar orbe de luz: pseudo-elemento `::after` con radial-gradient blanco semi-transparente
- Textura de puntos: `background-image` con radial-gradient de puntos blancos (opacidad 0.06)

### Inputs (`.login-input`)
- Al ganar foco: `box-shadow: 0 0 0 3px rgba(59,130,246,.18), var(--k-glow-primary)` más suave
- Transición de `border-color` a `0.25s ease`

---

## Criterios de éxito

- Pasa la inspección visual en Chrome/Firefox en mobile (375px) y desktop (1440px)
- Modo oscuro sin regresiones visuales
- Sin nuevas dependencias en `package.json` ni CDN adicionales
- No rompe ninguna animación o interacción JS existente
