# KalaApi

One fire record for Indonesia, from MODIS to VIIRS. NASA Space Apps Challenge 2026.

KalaApi joins MODIS and VIIRS hotspot detections (NASA FIRMS) into one burning-activity calendar. You can look at any area in Indonesia. The calendar shows when the area usually burns and whether this year is unusual.

## Run it on your laptop (5 minutes, no raw data needed)

The processed data is already in `public/data/`. You do not need the big raw files to test the app.

You need: **Node.js 18 or newer** (Node 22 works) and **Git**.

```bash
git clone https://github.com/6-Scrambled-Eggs/KalaApi.git
cd KalaApi
npm install
npm run dev
```

Open the address that the terminal shows (usually `http://localhost:5173`).

To test the production build:

```bash
npm run build      # type check + build into dist/
npm run preview    # serve dist/ locally
```

### What to click

| Page (hash route) | What it shows |
|---|---|
| `#/` | Map of Indonesia. Click a province, then a kabupaten. |
| `#/area/<id>` | Calendar, seasonal chart and anomaly for one area. Use `?m=h` (harmonized), `m` (MODIS) or `v` (VIIRS). |
| `#/surge/<id>` | The 2012 "sensor step" hero: raw detections rise about 6.5x in 2012. Harmonized fire-days rise about 1.2x. |
| `#/story/<id>` | Story mode for key years. |
| `#/card/<id>` | One-page print card (A4). |
| `#/method` | Method and validation numbers. |

Use the EN/ID button in the header to change the language.

The home page pairs the interactive province map with the sensor comparison and links to comparison, custom areas, and the El Niño view. On the method page, use the grouped contents sidebar to jump to sections on the data, validation, limits and references; it highlights the section currently in view and can be collapsed. On narrow screens, use **Menu** to open navigation and switch languages; the province list below the map is available for keyboard navigation.

The navigation search filters provinces and kabupaten as you type. Its results scroll after five rows; use the arrow keys and Enter to select an area, or Escape to close the list. Changing pages clears the search and closes its results.

On narrow screens, scroll the weekly and monthly calendars horizontally to read all labels and totals. Print layouts keep their compact A4 typography.

### Please test these things
- Pick 3 areas (one on Sumatra, one on Kalimantan, one on Papua). Do the charts load?
- Change the language. Is any text still missing?
- Open `#/card/<id>` and print to PDF. Does it fit on one A4 page?
- Resize the window to a phone width. Does the layout break?
- Write the problem in a GitHub Issue. Add the area id and a screenshot.

## Rebuild the data (optional)

Do this only if you change the method. It needs the raw FIRMS files (about 700 MB). They are **not** in Git. Ask Aldebaran for the data folder, or download them yourself (see below).

1. Make one data folder outside the repo (example: `D:\dev\DATA_kalaapi`). Put these inside:
   - the four `DL_FIRE_*` folders from FIRMS Archive Download (MODIS C6.1, S-NPP, NOAA-20, NOAA-21 VIIRS; Indonesia; 2000-11-01 to now)
   - `boundaries/` with geoBoundaries IDN ADM1 and ADM2 (simplified GeoJSON)
   - optional: `peat/` with a peat polygon file (`.geojson`, `.gpkg` or `.shp`)
2. Copy `.env.example` to `.env`. Set `KALAAPI_DATA_DIR` to your data folder. **Never commit `.env`.**
3. Install Python 3.10 or newer, then: `pip install -r requirements.txt`
4. Run in this order:
   ```bash
   python pipeline/01_load_firms.py
   python pipeline/04_tag_cells.py
   python pipeline/05_harmonize.py     # about 100 s, writes public/data/
   python pipeline/06_validate.py      # writes public/data/validation.json
   ```
   Steps 02 and 03 are checks only. You can skip them.
5. Run `npm run build` again.

To download the FIRMS files yourself, you need a free NASA FIRMS MAP_KEY. Put it in `.env` as `FIRMS_MAP_KEY=`. The pipeline does not need the key to run. The key is only for downloads.

## Folder map

```
pipeline/    Python: raw FIRMS -> harmonized data (steps 01-06)
public/data/ Output data that the app reads at run time (committed)
src/         React + TypeScript app (Vite, MapLibre, ECharts)
AGENTS.md    Rules for AI coding agents
docs/        Video script and project page text for the submission
CLAUDE.md    Full project context (method, findings, open items)
```

## Git rules for the team
- Do not push to `main` directly. Make a branch, push it, open a pull request.
- Do not commit: `.env`, raw data, `*.csv`, `*.parquet`, `node_modules/`, `dist/`. `.gitignore` blocks them. Do not force-add them.
- Do not hand-edit `public/data/`. Change the pipeline and run it again.

## Data and credits
NASA FIRMS (MODIS, VIIRS active fire). geoBoundaries (gbOpen, CC BY 4.0). Built with AI assistance (Claude). See the project page for the disclosure.

Hotspots are heat detections. They are not burned area.
