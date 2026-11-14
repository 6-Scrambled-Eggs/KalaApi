# AGENTS.md: instructions for AI coding agents

This file is for any AI agent (Codex, Copilot, Cursor, Claude, and others) that works in this repo for a team member. Read it first. `CLAUDE.md` has the full method and findings.

## Project in one line
KalaApi joins MODIS and VIIRS fire hotspots (NASA FIRMS) into one comparable fire calendar for any area in Indonesia. It is a static web app. It has no backend. NASA Space Apps 2026. Spec: the team PRD (see `CLAUDE.md`).

## Commands
```bash
npm install
npm run dev        # dev server, http://localhost:5173
npm run build      # tsc --noEmit + vite build. Must pass before you open a pull request.
npm run preview    # serve dist/
```
Python (only to rebuild data): Python 3.10 or newer, `pip install -r requirements.txt`, then `pipeline/01_load_firms.py`, `04_tag_cells.py`, `05_harmonize.py`, `06_validate.py`. Raw data is not in the repo.

## Layout
- `src/`: React 18 + TypeScript. `App.tsx` (hash router), `data.ts` (types and loaders), `i18n.ts` (EN/ID text), `Chart.tsx` (ECharts, modular import), `MapView.tsx` (MapLibre, no tiles), `AreaPage.tsx`, `Calendar.tsx`, `Seasonal.tsx`, `Hero.tsx`, `Story.tsx`, `Card.tsx`, `Method.tsx`.
- `public/data/`: generated output. `areas.json`, `meta.json`, `provinces.geojson`, `validation.json`, `areas/<id>.json`.
- `pipeline/`: Python data pipeline. `harmonize_lib.py` holds the method. `geo_lib.py` holds the boundaries.

## Rules you must follow
1. **Never read, print, log or commit `.env`.** It holds the FIRMS MAP_KEY. Use `.env.example` for names only.
2. **Do not commit** raw data, `*.csv`, `*.parquet`, `*.nc`, `*.tif`, `node_modules/`, `dist/`. Do not use `git add -f` to get around `.gitignore`.
3. **Do not hand-edit `public/data/`.** Change `pipeline/` and run it again. If you change the method, say so in the pull request.
4. **No live API calls in the demo path.** The app reads only static files from `public/data/`. Keep each `areas/<id>.json` under 2 MB.
5. **Do not change the method silently.** The method follows the team PRD (fixed ratio k per stratum, weekly slots, percentile anomaly). Ask the team before you change the formula, the thresholds, or the filters.
6. **Do not claim more than the data supports.** Hotspots are heat detections. They are not area burned. Do not write "burned area" next to fire-day numbers.
7. **Text for users goes in `src/i18n.ts`** in both EN and ID. Do not put hard-coded text in components.
8. **Work on a branch.** Open a pull request. Do not push to `main`.
9. **No NASA logos** in anything an AI makes. Keep the AI-use disclosure on the project page.
10. If a task needs a file, key or login that you do not have, stop and ask the human. Do not guess and do not invent data.

## Style
- TypeScript strict. No `any` unless it is needed (ECharts options are the known exception).
- Keep components small. Reuse `Card.tsx`, `Chart.tsx` and the helpers in `data.ts`.
- Keep user-facing text short and in plain words.

## Before you finish
- `npm run build` passes.
- Open the changed page in the browser. Check one Sumatra, one Kalimantan and one Papua area.
- Check both languages.
- Tell the human what you changed and what you did not test.
