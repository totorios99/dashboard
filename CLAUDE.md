# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Next.js dev server on port 3004
npm run build      # prisma generate + next build
npm run start      # production server on port 3004
npm run db:push    # push Prisma schema changes to SQLite
npm run db:studio  # open Prisma Studio
```

No test suite exists.

## Architecture

**Second Brain Cockpit** — personal dashboard that reads Obsidian vault files (read-only) and stores mutable state in SQLite via Prisma.

### Single-process runtime

Next.js 15 App Router on **port 3004**. API routes live in `app/api/`. No separate Express server.

### Configuration

`vault.config.js` — sole place for vault paths and central vault. Every other file imports from it. To add a vault: add entry to `config.vaults`, add `STATUS.md` at vault root, and add its id to the color maps in `PriorityPanel.jsx` / `HabitPanel.jsx` (keys must match vault ids).

### Data sources

| Data | Storage | API |
|------|---------|-----|
| Vault status / projects | `<vault>/STATUS.md` (YAML frontmatter, read-only) | `GET /api/status` |
| Habit checked state (daily) | SQLite `HabitHistory` | `GET /api/status`, `PATCH /api/status/[vaultId]` |
| Habit history (7-day) | SQLite `HabitHistory` | `GET /api/habits/[vaultId]/history` |
| Inbox items | SQLite `InboxItem` | `/api/inbox`, `/api/inbox/[id]` |
| Weekly checklist | SQLite `WeeklyItem` | `/api/weekly`, `/api/weekly/[index]` |
| Pillar display order | SQLite `Setting` (key `priority_order`) | `/api/priority-order` |

### Prisma schema (`prisma/schema.prisma`)

```prisma
model InboxItem    { id, text, tag, createdAt }
model WeeklyItem   { id, weekKey, label, status, pos }
model Setting      { key (PK), value }
model HabitHistory { id, vaultId, date, habitKey, value — @@unique([vaultId, date, habitKey]) }
```

`DATABASE_URL="file:./cockpit.db"` — relative paths resolve from `prisma/` (the schema dir), so the DB file lives at `prisma/cockpit.db`.

### Key server behaviors

- **STATUS.md is read-only**: Obsidian owns these files. The app never writes to them except non-habit field edits via PATCH. Habit keys come from STATUS.md; their daily checked state lives in SQLite `HabitHistory`.
- **Habit merge**: `GET /api/status` calls `statusWithHabits()` — reads STATUS.md for habit keys, overlays today's SQLite rows. If no rows for today, all habits return `false` (auto-reset by absence).
- **Habit write**: `PATCH /api/status/[vaultId]` with `habits.*` keys upserts into `HabitHistory`; non-habit keys go to STATUS.md via dot-notation (`setNested()` from `utils/shared.js`).
- **Weekly rows are per-week**: `GET /api/weekly` looks up rows for the current ISO week key and creates them from `defaultWeeklyItems()` if missing — no reset logic, old weeks' rows just stay in the table.
- **Open vault**: `POST /api/open-vault` validates vault name (`/^[\w\-. ]+$/`) and runs `execFile('xdg-open', ['obsidian://open?vault=NAME'])` server-side.

### Shared modules

| File | Purpose |
|------|---------|
| `lib/vault.js` | `readStatus(vault)` — reads + parses STATUS.md; `writeStatusField()`; weekly helpers (server-only, uses fs) |
| `lib/db.js` | Prisma singleton client |
| `utils/shared.js` | Pure helpers usable client+server: `getWeekNumber()`, `setNested()` |
| `vault.config.js` | Vault list, central vault path |

### Frontend data flow

```
vault STATUS.md → GET /api/status → useStatus() → App → panel components
SQLite           ↗
```

- All hooks live in `hooks/useStatus.js`: `useStatus`, `useInbox`, `useWeekly`, `usePriorityOrder`
- All `fetch()` calls centralised in `utils/api.js` — components never call `fetch` directly
- Mutations use **optimistic UI**: state updates immediately, rolls back on server error
- `useStatus` polls every 30 s. `Header` owns its own 1 s clock interval (vault panels don't re-render every second)

### Layout (`components/App.jsx`)

```
Header (glass card):  [greeting / clock+date] | [gradient divider] | [QuoteWidget]
Main row (1fr 1fr 1fr, height 486px):  PriorityPanel | ProjectPanel | HabitPanel
Bottom row (1fr 1fr, height 384px):    InboxPanel    | WeeklyPanel
```

- No photo/polaroid widget
- `PriorityPanel` — drag-to-reorder via Pointer Events + CSS transforms + `flushSync`; vault label opens Obsidian via `api.openVault()`; `next_move` inline-editable
- `HabitPanel` — paginated (4 habits/page) with ‹/› nav; only today's pip is interactive, days 0–5 are display-only
- `InboxPanel` — inline-edit item text; tags fixed `width: 66px` so titles align regardless of tag label length
- `WeeklyPanel` — inline-edit checklist labels

### Animations (`app/globals.css`, end of file)

- Entrance: header + cards stagger in via `fadeUp` with per-card `animation-delay`
- Habit pip toggle: `pipPop` scale keyframe on `.pip.on`
- Weekly checkmark: `stroke-dashoffset` draw-in on `.check-item.done`
- `prefers-reduced-motion: reduce` kills all animation/transition durations — keep this block last in the file

### Panel height pattern

Cards use `height: 486px` / `height: 384px` with `display:flex; flex-direction:column; overflow:hidden`. Inner scroll region uses `.card-scroll { flex:1; min-height:0; overflow-y:auto }`.

### Docker

```dockerfile
# runner stage needs Prisma CLI for db push on startup
COPY --from=builder /app/node_modules/prisma        ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma   ./node_modules/.bin/prisma
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate && node server.js"]
```

Vault directories mount `:ro` (read-only). SQLite file must be on a writable volume (`DATABASE_URL=file:/data/cockpit.db` in compose).
