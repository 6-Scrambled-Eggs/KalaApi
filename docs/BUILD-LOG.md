# KalaApi build log (for teammates and their AI agents)

Last updated: Sat 14 Nov 2026, about 19:15 (Sydney time). Repo: https://github.com/6-Scrambled-Eggs/KalaApi
Live app: https://6-scrambled-eggs.github.io/KalaApi/ (deploys from `main` by GitHub Actions)

Read this file first. It lists every commit, what changed, and why. If you make a change, add a row at the bottom of "Commit log" with the commit hash. Use `git log --oneline` to get it.

## 1. What the product is
KalaApi joins MODIS and VIIRS hot spots (NASA FIRMS) into one comparable fire calendar for any province or kabupaten in Indonesia, 2001 to week 43 of 2026. Method: count fire-days per 0.05-degree cell, measure the ratio k (VIIRS / Aqua MODIS) per stratum on 2012-2026, back-cast before 2012 as k x MODIS. Full method: `CLAUDE.md`. Rules for agents: `AGENTS.md`. Spec: the team PRD (Google Doc linked in `CLAUDE.md`).

## 2. Commit log (oldest first)

| Commit | Time (14 Nov) | What changed | Why / how to check |
|---|---|---|---|
| `83d0ef1` | 17:20 | **First full build.** Python pipeline `pipeline/01` to `06` (load FIRMS, tag cells, harmonize, validate). 422 area files in `public/data/`. React + Vite + MapLibre + ECharts app in `src/`: map, area picker, calendar, seasonal profile, flagged weeks, raw/harmonized toggle, fake-surge hero, story mode, readiness card, method page, EN/ID. `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example`, `requirements.txt`. | This is the PRD Must list. Check: run the app and open `#/area/riau`. |
| `dacb15a` | 17:27 | **GitHub Pages deploy.** `.github/workflows/deploy.yml` builds on every push to `main`. | Check the Actions tab for a green run, then open the live link. |
| `5fd46cb` | 18:09 | **Peat split turned on.** Step 04 now reads GFW 30 m peat tiles (`.tif`) and marks a 5 km cell as peat when at least 50% of its pixels are peat. Data rebuilt (steps 05, 06). `rasterio` added to `requirements.txt`. This commit also added a stray file `vite.config.ts.timestamp-*.mjs` by mistake (removed in `96ff8cf`). | 6,114 of 49,397 cells are peat. Holdout error +2.3% / +1.2%. Share of province-years within 20%: 71% (77% without peat split). See `public/data/validation.json`. |
| `96ff8cf` | 18:30 | **ONI marker, peat toggle, FRP, export.** `pipeline/07_export_oni.py` writes `public/data/oni.json`. Calendar shows a red / blue / grey dot per year (July-September ONI). New buttons: Peat only, Mineral only, Download CSV, Download PNG, Copy link. Story mode now has a second chart for fire radiative power (FRP). New tile "vs last 10 years". Area files now carry `frp`, `h_peat`, `h_min`. Method page text updated. Removed the stray `.mjs` file. | The "vs last 10 years" tile fixes a misleading number: Riau showed x0.15 against 2001-2025 but x1.32 against the last 10 years. |
| `dbe4cb1` | 18:50 | **Submission docs.** `docs/video-script.md` (30 s script with facts), `docs/project-page.md` (all form fields, AI-use disclosure, references). `CLAUDE.md` updated with the 2026 vs 2015 results. | Check the team name and the two paper references before use. |
| `d5e9e8d` | 18:54 | **Mobile polish.** Calendar scrolls sideways on narrow screens (PRD requirement). Chart label overlaps fixed. Favicon added. | Open the live site at 375 px wide. Headless Chrome only; no real phone test yet. |
| `fd58013` | 19:50 | **Four upgrades from the winning-factor research** (`docs/WINNING-IDEAS.md`). (1) **Readiness window** per area: earliest, median, latest onset week and a "be ready by" date (`src/Readiness.tsx`, `readiness()` in `src/data.ts`). (2) **BPBD brief**: one A4 page per area at `#/brief/<id>`, English and Indonesian, prints on one page (`src/Brief.tsx`, print CSS in `src/styles.css`). (3) **El Niño link**: `pipeline/08_enso_signal.py` writes `public/data/enso.json` (Spearman rho and permutation p per area, 2001-2025); panel on each area page (`src/EnsoPanel.tsx`), province map and ranked table at `#/enso` (`src/EnsoView.tsx`). (4) **Analog year** "2026 is most like..." (`src/Analog.tsx`, `analogYears()`). Method page explains all four. | Open `#/area/riau`, `#/brief/riau`, `#/enso`. Print the brief: it must be 1 page. Results: 300 of 422 areas show a clear El Niño link, 41 weak, 81 none. Riau is weak (rho 0.35), West Kalimantan is clear (0.74). Only 5 El Niño years in 25: do not oversell. |
| _pending, fill in after push_ | 19:55 | **Compare two places** at `#/compare/<a>/<b>` (`src/Compare.tsx`): table, typical season shape, current year against 2015. **Reference check:** both papers verified, DOIs added in `docs/project-page.md`. **Walkthrough:** 11 routes x EN/ID x desktop/phone, no console errors, no overflow. Link text for El Niño labels translated. | Open `#/compare/papua-selatan/kalimantan-barat` in EN and ID on a phone width. |

Work that has no commit: edits to the teammate PRD (Google Doc, done in place), the research notes in the Claude Project, and the data download and processing on the local PC (`D:\dev\DATA_kalaapi`, not in Git).

## 3. Key results so far (week 43 of 2026)
- Raw hot spot counts jump x6.5 in 2012. Harmonized fire-days jump x1.2.
- 2026 against 2015, same weeks, harmonized fire-days: Indonesia 76%, South Papua 116%, West Kalimantan 112%, Central Kalimantan 67%, South Sumatra 43%, Riau 13% (first build; the current back-cast gives 75%, 115%, 111%, 66%, 42%, 13%). FRP gives similar numbers.
- Holdout test (2019 and 2023): national annual error +2.3% and +1.2%. Median weekly correlation 0.90.
- Weak spot: quiet years such as 2016 and 2017 are under-predicted by about 11%. Bands in quiet years are probably too narrow.
- Raw VIIRS and harmonized series are identical from week 4 of 2012 (checked on all 324,096 area-weeks: 0 differences).

## 4. MVP status against the PRD
The 12 "Must" items:

| FR | Item | Status |
|---|---|---|
| 01 | Ingest FIRMS archive | Done. Row counts match the raw files exactly. Not compared with NASA's yearly country CSVs (server blocked from our cloud tool). |
| 02-03 | Grid to 0.05 deg cells; fire-days | Done (`pipeline/01`). |
| 04 | Harmonize with 90% band; error shown in app | Done. |
| 05 | Tag cells: province, kabupaten, peat | Done. |
| 06 | Pick area from list or map | Done. |
| 07 | Calendar with 2012 line and tooltip | Done. **The "daily view" part is NOT built** (weekly only). |
| 08 | Seasonal profile; click a row | Done. |
| 09 | Anomaly flags | Done, with percentiles (90 and 97.5) instead of +2 sigma (the PRD was edited to match). |
| 10 | Critical periods | Done. |
| 11 | Raw vs harmonized toggle and explainer | Done. |
| 12 | Method and data page | Done. |

Should / Could: story mode (done), EN/ID (done), ONI strip (done, as dots), CSV/PNG/share link (done). **Not built:** FR-13 extra layers (peat units, parks), FR-14 draw-a-polygon, GPM IMERG rainfall.

## 5. How teammates can quality-check (do this tonight)
1. **Run it locally.** Follow `README.md`. `npm install`, then `npm run dev`.
2. **Non-expert test.** Ask someone who did not build it to find a province's peak weeks on the live site in under 30 seconds. Write down where they got stuck.
3. **Three test areas** (PRD): Kalimantan Barat, Riau, Papua Selatan. For each: open the calendar, toggle all 5 views, click a row, open Story mode, open the readiness card, download the CSV and PNG, copy the link and open it in a new tab (it must restore the same area).
4. **Devices.** Real phone, Chrome, Firefox, Safari, and a slow connection. Is the calendar readable? Does the sideways scroll work?
5. **Language.** Switch to ID. Is any English text left? (Some explainer text is English only.)
6. **Numbers.** Pick 3 kabupaten you know. Do the peak weeks look right to you? Report disagreements.
7. **Claims.** Verify the BRIN "VIIRS only" claim and the SiPongi 202,004 ha / +69% figure (`docs/project-page.md`, last section).
8. **Report bugs** as GitHub Issues: area id, view, browser, screenshot.

## 6. How teammates can improve the product
Small, safe tasks (no method change):
- Bahasa Indonesia for the long explainer text on the surge, story and method pages (`src/i18n.ts`).
- A daily view for one chosen week (closes the missing part of FR-07).
- Color-blind check of the calendar palette and the red/blue ONI dots.
- A "compare two areas" view.
Bigger tasks (ask the team first, and read `AGENTS.md`): polygon draw (FR-14), extra map layers (FR-13), rainfall strip (FR-17), a better method for quiet years.
Ideas for a stronger story are in `docs/WINNING-IDEAS.md` (written after our research on past winners; see that file when it exists).

## 7. Rules for adding to this log
- One row per commit. Put the short hash in backticks.
- Say what changed, why, and how to check it.
- Do not edit the history rows. Add new rows at the bottom of section 2.

| `14ae413` | Activity-dependent back-cast (V = a*M^b, b=0.875), static-NRT filter, new error numbers, PRD v2 | Quiet-year bias 17% -> about 4% in-sample; LOYO about 1% |
| `5db87b2` | Burned-area validation (pipeline/10, validation/sipongi_national_ha.csv, validation_ha.json), Method page rewritten for V=a*M^b, S-NPP end note, project page: validation, why-now, challenge checklist, more references | Spearman rho 0.90 (n=11, p<0.001) of yearly fire-days vs SiPongi hectares. Open #/method and check the new bullet. |
| `c952b8b` | "Right now" strip: pipeline/11_live_fire.py (FIRMS API, NOAA-20/21), src/LiveStrip.tsx, workflow refreshes every 6 h | Needs GitHub secret FIRMS_MAP_KEY. Without it the card stays hidden. After adding the secret, run Actions > Deploy > Run workflow, then check the home page. |
| `294399c` | Batch A (15 Nov): home hero stat cards (x6.5 raw, x1.2 harmonized, this year vs normal), map legends and loading state, El Nino map in its own purple palette, "clear" needs p<=0.01 else "suggestive", one-line area summary, calendar "Anomaly (percentile)" view, Indonesian strings, "Sensor step (2012)" rename | Open `#/`, `#/enso`, an area page with `?m=a`, and switch to ID. Independent review of the live site found no blocking bugs. |
| `63cafcb` | Batch B: `pipeline/12_flag_baseline.py` and `flag_check.json` (flags vs VIIRS-only 2012-2025 baseline), "(low base)" flag labels, "VIIRS only" tile wording, "Not an official product" on brief, card and readiness, CLAUDE.md numbers | Spearman 0.94 over 27,756 weeks; every elevated week >= 80th and every extreme week >= 90th percentile on the VIIRS-only baseline. See `#/method`. |
| `7978306` | Batch C and Method limits: "Provinces to watch", shareable weekly card (text + PNG), keyboard province list, skip link, focus rings, mobile nav row, grouped area-page buttons; honest limits for the flag check and the low-base rule | Open `#/` and tab through the page. At 390 px the nav scrolls sideways. |
| `d801c29` | "Provinces to watch" only counts provinces with at least 1,000 fire-days in an average year; card wording | Top rows: Papua Selatan, Maluku, Kalimantan Timur. |

## Judge-review PRD batch (15 Nov, Sydney afternoon)

| Task | What changed | How to check |
|---|---|---|
| P0-1 | Calendar-first area page: quantile colour classes, peak week in view, 3 tiles, "More analysis" folded, shorter home and nav. LiveStrip and watch list removed from home. | `#/area/indonesia` at 1366x768: grid visible without scrolling far. |
| P0-2 | `pipeline/14_monthly.py` adds `mh/mlo/mhi/mstat/mcur` to area files. `src/MonthCalendar.tsx`, Months/Weeks toggle, "October 2026" tile, monthly CSV. | Monthly totals = weekly totals (gap 0.000%). |
| P0-3 | `pipeline/15_grid_tiles.py` writes 373 tiles in `public/data/grid/`. `src/CustomArea.tsx` at `#/custom`. | Tile totals = national weekly total (gap 0.000%). Home loads no tiles. |
| P0-4 | One raw-jump value (6.5x). CLAUDE.md and AGENTS.md describe the power law only. | `grep -rn "fixed ratio"` shows only history notes. |
| P0-5 | Method page: 7 scientist questions. `08_enso_signal.py` adds BH q-values (288 pass, 47 weak, 87 none). Finer b grid: 0.870 (no change). Kalteng week 3 2026 checked: real, no filter change. | `#/method`. |
| P1-1 | `pipeline/16_noaa20_bridge_test.py`: bridge NOT good enough (national error up to 12.5%). Not merged. Reported on Method page. | `public/data/bridge_test.json`. |
| Docs | `docs/HUMAN-TODO.md`, `docs/JUDGE-QA.md`. | |
