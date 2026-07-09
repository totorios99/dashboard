# Design Sync — Alchemist's Atrium Cockpit

## Repo quirks

- **No dist/** — Next.js app, not a publishable library. Entry is `ds-entry.js` (manual named re-exports). `export * from` in synth-entry silently drops `export default` components; this explicit entry is required.
- **No TypeScript** — `.jsx` throughout, no d.ts. DTS_REACT warning prints each build; harmless (no utility types used).
- **@/ alias** — resolved via `jsconfig.json` (not tsconfig.json). Works with `cfg.tsconfig: "jsconfig.json"`.
- **`'use client'` directives** — esbuild ignores these; no issue.
- **Fonts** — Google Fonts CDN via `@import url(...)`. Flagged as `[FONT_REMOTE]` (informational). `runtimeFontPrefixes` set for Inter, JetBrains Mono, Lora to suppress [FONT_MISSING].

## Component notes

- **PriorityPanel** mock uses `project_next_move` but component reads `next_move` → shows "No next_move set". Fix mock on re-sync: add `next_move` field to STATUSES mock objects.
- **HabitPanel** — habit history rings show empty (no mock for `/api/habits/:vaultId/history`). Looks intentional/good; 7 empty circles still show the ring widget.
- **PolaroidWidget** — fetch mock uses SVG data URI for photo. Caption key matching may differ in production (filename vs full data URI). Acceptable for preview.
- **InboxPanel / WeeklyPanel** — module-level `window.fetch` override; only one story each since both stories would share the mock.

## Known render warns

- PolaroidWidget `[RENDER_THIN]` (variants render identically): Only one story `WithPhotos` — single-story component, not a real duplicate. Legitimate.

## Re-sync risks

- `ds-entry.js` lists components manually — add new components here when adding to `components/`.
- `PriorityPanel.tsx` preview uses wrong field (`project_next_move` vs `next_move`). Fix on next re-sync.
- SVG data URI in PolaroidWidget preview is hardcoded — won't reflect actual photos dir.
- Conventions header (`conventions.md`) has hardcoded domain colors — update if vault colors change in `vault.config.js`.
- No `@types/react` in repo node_modules — d.ts bodies are JS-inferred only (good enough for plain JSX but props will be weak stubs).
