# Alchemist's Atrium — Design Conventions

## Tokens
All colors, spacing, and typography come from CSS custom properties defined in `ds-tokens.css`. Never hardcode values that have a token equivalent.

| Token | Value |
|---|---|
| `--bg` | Page background (#f8f7f4 light / #0e0e10 dark) |
| `--surface` | Card/panel background |
| `--surface2` | Hover/secondary surface |
| `--border` | Subtle border (rgba, not a color) |
| `--text`, `--text-2`, `--text-3` | Text hierarchy |
| `--font-sans` | Inter — body and UI |
| `--font-mono` | JetBrains Mono — labels, badges, metadata |
| `--font-serif` | Lora — quotes, editorial |
| `--radius-sm/md/lg` | 6px / 10px / 14px |
| `--shadow-sm/md` | Elevation scale |
| `--transition` | 150ms ease |

## Panel anatomy
Every dashboard panel uses the `.panel` class (white surface, 0.5px border, radius-lg, shadow-sm) with a colored `2px solid` top border that identifies its domain.

```
Domain colors:
  Cybersecurity:  #c61a09
  Fitness:        #1D9E75
  Spirituality:   #9F7AEA
  Homelab:        #378ADD
  Habits (cross): #7F77DD
  Weekly:         #1D9E75
```

Panel label: `.panel-label` — 9px uppercase mono, text-3, with a 5×5px colored dot.

## Component data contract
Panels split into two patterns:

**Prop-fed** (PriorityPanel, ProjectPanel, HabitPanel): receive `statuses[]` — vault status objects from `/api/status`. No internal fetch. Mutations go via `onUpdate(vaultId, key, value)`.

**Hook-fed** (InboxPanel, WeeklyPanel, PolaroidWidget): manage their own data via internal hooks (`useInbox`, `useWeekly`, `usePhotos`). In design previews these hooks are mocked at the module level via `window.fetch` override.

## Tags / pill badges
`.tag` class — 9px mono, 2px 7px padding, 20px border-radius, 0.5px border. Color scheme:
- cyber: blue on light blue
- fitness: green on light green
- spirituality: purple on light purple
- branch: amber on light amber
- general: neutral gray

## Micro-interactions
- All transitions use `var(--transition)` (150ms ease)
- Habit toggle: scale(0.85) on click, 350ms settle
- Progress fill: cubic-bezier(0.4, 0, 0.2, 1) 400ms
- Fade-up entry: `.fade-up` — 300ms ease, 8px translateY
- Drag: `.drag-handle` opacity 0.5→1 on hover

## Dark mode
Auto via `prefers-color-scheme: dark`. All tokens remap — no manual dark-mode class needed. Components use tokens exclusively so dark mode is free.
