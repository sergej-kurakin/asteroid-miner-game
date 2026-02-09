# Game UI Designer - Agent Memory

## Project
Asteroid Miner — retro-futuristic idle/incremental game. 3-panel cockpit layout.
Files: game.html, game.css (plain CSS, no SCSS in use — uses CSS custom properties on :root).

## Color Palette (CSS vars on :root)
- `--primary: #00ff88` — borders, gauges, text
- `--secondary: #0099ff` — inventory, accents, navigation
- `--accent: #ff8800` — mining, warnings
- `--gold: #ffc800` — discovery, rare
- `--background: #0a0e27`
- `--panel-bg: rgba(10, 14, 39, 0.95)`
- `--border-glow: 0 0 10px var(--primary), 0 0 20px rgba(0, 255, 136, 0.3)` — reuse for glow effects

## Panel Structure
- `.panel` — base: 2px solid var(--primary) border, border-radius 8px, padding 20px, flex column
- `.panel-title` — Orbitron font, 14px, uppercase, letter-spacing 2px, border-bottom 1px solid rgba(0,255,136,0.3)
- Grid: `grid-template-columns: 1fr 2fr 1fr 1fr` (left | center | equipment | right)

## Center Panel Layout Pattern (as of split implementation)
- `.center-panel__half` — `flex: 1` so both halves share equal vertical space
- `.center-panel__divider` — 2px solid var(--primary) bar, `margin: 0 -20px` to span full panel width through padding, phosphor glow via box-shadow
- Asteroid analysis section uses unified display (not split view/composition)
- See: [patterns.md](patterns.md) for divider details

## Typography
- Body / readouts: 'Space Mono', monospace
- Titles / labels: 'Orbitron', sans-serif
- font sizes: panel-title 14px, section titles 11-12px, labels 10-11px, body 11-12px

## Key Techniques
- Scanlines: `body::before` repeating-linear-gradient, pointer-events none, z-index 1000
- Glow on active elements: `text-shadow: 0 0 10px var(--primary)` or `box-shadow` with color vars
- Gauge fills use `transition: width 0.3s ease`
- Mining pulse: CSS @keyframes animation toggled by `.mining` class on `.asteroid`

## UI Component Pattern
- Components extend `BaseComponent` from `src/ui/base-component.ts`
- Visibility toggling: When toggling between placeholder and content, use `display: flex/none` pairs
- The asteroid analysis section uses:
  - `#asteroid-placeholder` — shown with `display: flex` when no asteroid
  - `#composition-section` — shown with `display: flex` when asteroid exists
  - Both toggled by `AsteroidView` component watching `asteroid` state property

## Testing Components
- UI component tests use `@vitest-environment jsdom` directive
- When updating visibility logic, update corresponding test expectations
- Test files verify DOM element references and state-driven display changes
