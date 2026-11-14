# KalaApi: project context for Claude Code

NASA Space Apps 2026 (Bandung local event, 14-15 Nov 2026). Challenge: harmonize MODIS and VIIRS hotspot records into one burning-activity calendar. Deadline: Sun 15 Nov 23:59 local. MVP freeze: Sun 10:00. Aim to submit by 22:00.
Team of 6. Goal: win at the local event, then the global awards (judged on Impact, Creativity, Validity, Relevance, Presentation).

**The spec is the team PRD.** Follow it. Google Doc: https://docs.google.com/document/d/11VIGYdyCvYz9m1QSmhx7NmC_p8UbJL1C7f-J-UuDH-c/edit (owner: team member Randuichi Touya). Planning docs and a backlog live in the user's Claude Project "NASA SPACE APPS".

## One-line product
KalaApi turns 25 years of MODIS and VIIRS hotspot detections into one comparable fire-activity calendar for any Indonesian area. It tells a user when a place usually burns, whether this year is unusual, and when to get ready.

## Paths (user's Windows PC)
- Repo: `D:\dev\KalaApi` (this folder)
- Raw and processed data (NOT in git): `D:\dev\DATA_kalaapi` (four `DL_FIRE_*` folders from FIRMS Archive Download; `boundaries/`; `processed/`; optional `peat/`)
- Secrets: `.env` (git-ignored). `.env.example` is the template. Never print or commit the FIRMS MAP_KEY.

## Pipeline (`pipeline/`, Python 3.10+, `pip install -r requirements.txt`)
Run in order. Set `KALAAPI_DATA_DIR` in `.env` if the data folder differs.
1. `01_load_firms.py`: 8 CSVs (archive + NRT) -> `processed/cell_days.parquet` (sensor, local solar date, 0.05 deg cell, day/night, detections, max FRP). Filters: type 0, MODIS conf >= 30, VIIRS n/h.
2. `02_first_hour_checks.py`: counts, the 2012 step, S-NPP/Aqua ratio by year.
3. `03_calibration_spike.py`: fixed-ratio vs log-log test (fixed ratio won).
4. `04_tag_cells.py`: cells -> kabupaten, province (38; Papua split by kabupaten), island, peat flag (`unknown` until a peat polygon file is in `DATA/peat/`).
5. `05_harmonize.py`: harmonize + anomalies + critical periods; exports `public/data/` (areas.json, meta.json, provinces.geojson, areas/<id>.json). ~100 s.
6. `06_validate.py`: V-1 holdout, V-6 reverse holdout, V-4 drift, V-5 known events, V-2 small areas -> `public/data/validation.json`.
`harmonize_lib.py` holds the method; `geo_lib.py` the admin boundaries.

## Method (PRD: Harmonization method)
- Fire-day = one 0.05 deg cell on one day with at least one detection. Daytime passes only (afternoon orbit).
- M = Aqua MODIS fire-days (from Jul 2002; Terra scaled to Aqua before that). V = S-NPP VIIRS fire-days (from 20 Jan 2012).
- Weekly slots: 52 7-day blocks per year; week 52 absorbs the last 8-9 days.
- k = sum V / sum M on the overlap, per stratum. Stratum = province if it has >= 3000 Aqua fire-days on the overlap, else its island group (x peat flag when known). Back-cast before 2012 = k * M. From 2012 the series is observed V.
- 90% band: 1000 bootstrap draws resampling years.
- Anomaly = weekly percentile rank vs the same week in 2001-2025 ("elevated" >= 90, "extreme" >= 97.5). Sensitivity baseline 2012-2025.
- Data end: 2 Nov 2026 (last S-NPP NRT day). After S-NPP stops, chain NOAA-20 to S-NPP (not needed in this build).

## Findings so far (keep honest in the UI and pitch)
- 2012 step: raw detections jump about 5-6x; harmonized fire-days about 1.2x (national, 2012-14 vs 2009-11).
- A fixed ratio per stratum beats a log-log model. Province strata fix most of the island-mix error.
- Holdout 2019+2023: national annual error +2.8% / +1.6%; 77% of province-years within +-20%; median weekly r 0.90. Reverse holdout: quiet years (2016, 2017) under-predicted by about 10-11%.
- Known events: Kalteng and Sumsel in 2015 reach a weekly percentile of 98 (5 of 9 weeks in weeks 36-44 are >= 90; 2 of 9 are >= 97.5). 2019 reaches 94. The PRD check says the peaks must "stand out" in the calendar. They do, but not in every week. Report this honestly.
- NRT files have no `type` column; static/offshore sources are not filtered after Jul-Aug 2026.

## Frontend (`src/`, Vite + React + TypeScript + MapLibre + ECharts, static, no backend)
`npm install`, `npm run dev`, `npm run build`. Hash routes: `#/` map, `#/area/<id>?m=h|m|v&y=<year>`, `#/surge/<id>` (FR-19 fake-surge hero), `#/story/<id>` (FR-15), `#/card/<id>` (FR-20 print card), `#/method`. EN/ID toggle in `i18n.ts`. Data is read from `public/data/` at runtime.

## Done since the first build (14 Nov)
- Peat split on (GFW 30 m tiles in `DATA/peat/`; step 04 reads `.tif` tiles). Peat-only and mineral-only toggles. V-1: national error +2.3% / +1.2%, 71% of province-years within 20% (77% without peat split).
- ONI marker (step 07, `public/data/oni.json`), FRP in story mode, CSV/PNG export and copy-link, "vs last 10 years" tile, GitHub Pages deploy (`.github/workflows/deploy.yml`), `docs/video-script.md`, `docs/project-page.md`.
- 2026 vs 2015 at week 43: nation 75% (fire-days), South Papua 115%, West Kalimantan 111%, Central Kalimantan 66%, South Sumatra 42%, Riau 13%.

## Added 14 Nov evening (from the winning-factor research)
- Readiness window, BPBD brief (`#/brief/<id>`, 1 A4 page), El Niño link (`pipeline/08_enso_signal.py` -> `public/data/enso.json`; panel + `#/enso` map), analog year. See `docs/WINNING-IDEAS.md` and `docs/BUILD-LOG.md`.
- Honest numbers: 298 of 422 areas show a clear El Niño link, 37 weak, 87 none; only 5 El Niño years in 2001-2025; p not corrected for multiple tests. West Kalimantan is clear (rho 0.74), so do NOT say "El Niño does not explain West Kalimantan". Riau is weak (0.35).

- Compare view `#/compare/<a>/<b>`. Papers verified (Giglio 2016 RSE 178:31-41; Schroeder 2014 RSE 143:85-96).

## Open items (see backlog in the Claude Project)
- MCD64A1 burned-area check (V-7). Needs Earthdata login.
- Row-count check against FIRMS yearly country CSVs.
- Polygon draw (FR-14) not built.
- Record the 30 s video (script in `docs/video-script.md`); fill the project page (text in `docs/project-page.md`); verify the References list.
- Teammate must verify: BRIN "VIIRS only"; 69% / 202,004 ha burned figure.

## Rules
- Follow the PRD. Say what you changed and why.
- No live API calls in the demo path. Keep each area file under 2 MB.
- Do not claim more than the data supports. Hotspots are heat detections, not area burned.
- AI use must be disclosed on the project page. No NASA logos in AI-made content.
- Back-cast model (14 Nov 2026): V = alpha_stratum * M^b, b=0.875 shared, Poisson fit (`calibrate_power` in `pipeline/harmonize_lib.py`). Replaced the fixed ratio (quiet years were 17% too low). Static-looking NRT cells are dropped in `build()`. Do not reintroduce "within ±14%" or "17% too low" text. Plan: `docs/PRD-v2.md`.
- Live strip (14 Nov 2026): `pipeline/11_live_fire.py` runs in the deploy workflow with secret FIRMS_MAP_KEY and writes public/data/live.json (gitignored). It is separate from the calibrated series. Never print or commit the key; local .env is gitignored. The sandbox cannot reach the FIRMS API, so the script was only self-tested with fake rows (`--selftest`; delete the live.json it writes).
