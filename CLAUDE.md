# Grid Game Template

## Platform: FreeGameStore
- Hosted on Cloudflare Pages (static SPA only)
- ONE environment only (production). No dev/staging. Fix forward, no rollbacks.
- Push to `main` auto-deploys to production via CF Pages
- Domain: memorymatch.freegamestore.online

## Tech Stack
- TypeScript, React 19, Vite 6, Tailwind CSS 4.1, pnpm
- No backend (standalone app) — all data in localStorage
- Must work offline (PWA)

## Template Purpose
This template is for building grid-based games such as:
- 2048
- Minesweeper
- Sudoku
- Wordle
- Connect Four
- Tic-Tac-Toe
- Match-3 puzzles

## Architecture
- `web/src/hooks/useGrid.ts` — Reusable grid state hook (rows, cols, cell operations)
- `web/src/hooks/useHighScore.ts` — localStorage-backed high score persistence
- `web/src/components/GameGrid.tsx` — Reusable CSS Grid renderer with touch + click support
- `web/src/App.tsx` — Demo match-3 game showing all features in action

## Grid Rendering
- Uses CSS Grid (not canvas) for accessibility and styling flexibility
- Responsive sizing via CSS clamp()
- Touch + click support on all cells
- Smooth CSS transitions (200ms ease for moves, 300ms scale for clears)
- CSS variables for theming (dark mode compatible)

## Visual Defaults
- Cells: rounded corners (0.5rem), subtle shadows, gradient fills
- Colors: vibrant but tasteful palette for cell values
- Score display with Fraunces font
- Glass-effect score panel
- Dark mode via prefers-color-scheme (no toggle)

## Brand Guidelines
- Fonts: Manrope (body) + Fraunces (display)
- Follow CSS variables in index.css for colors
- Border radius: 0.5rem cells, 1.25rem cards, 0.75rem buttons
- Dark mode via prefers-color-scheme (no toggle)

## Development
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm typecheck` — verify types

## Rules
- No analytics, no tracking, no cookies
- All user data in localStorage only
- App must work offline after first load
- Include "Part of FreeGameStore" link
- MIT license

## Platform Docs & Publishing
- **Full AI guide:** https://raw.githubusercontent.com/freeappstore-online/ops/main/SKILLS.md
- **Store registry:** ~/dev/fgs/infra/freegamestore/registry.json (add game here to list on store)
- **Store site:** ~/dev/fgs/infra/freegamestore/ (auto-deploys on push)
- **Deploy:** Push to main auto-deploys via GitHub Actions. No manual steps needed.
- **DNS/domains:** See SKILLS.md for CF API commands
