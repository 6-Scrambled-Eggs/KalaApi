# KalaApi PRD v2: reaching (and passing) agency level
Written Sat 14 Nov 2026. Extends the teammate PRD (kept as the base). Deadline: Sun 15 Nov 23:59 local; aim 22:00; MVP freeze 10:00.
Evidence labels: V = a source page or paper was read; I = our inference. Source reports came from three research agents.

## 1. What "NASA level" is today
| System | What it does | What it does not do |
|---|---|---|
| NASA FIRMS (V) | MODIS 1 km + VIIRS 375 m hotspots, map, archive, API (free MAP_KEY, 5-day queries), alerts | No harmonized series, no calendar, no anomaly, no admin-unit stats; FIRMS itself says sensors are not interchangeable |
| MCD64A1 / VNP64A1 (V) | 500 m monthly burned area (2000 / 2012 on) | Not hotspot counts; VNP64A1 has no new S-NPP data |
| NASA FEDS (V) | 12-hour VIIRS fire perimeters | CONUS and Canada only |
| CAMS GFAS (V) | Added VIIRS 4 Dec 2025: agencies face the same MODIS-to-VIIRS problem | Emissions, not a local calendar |
| GFED5NRT (V) | Scales VIIRS to MODIS-era burned area with region lookup tables; authors call it a "first step" | Not hotspot days; regional, not kabupaten |
| GWIS/EFFIS (V partly) | Country and sub-country burned-area profiles 2002-2019 | Stops 2019 in the public profile |
| SiPongi+, BMKG, ASMC (V) | Daily province hotspot counts, static maps, NOAA-20 files | No harmonization, no "is this week unusual" |
| Nusantara Atlas (V) | Merges MODIS+VIIRS into one alert count, overlays peat/concessions | Only 360 days of history, no calibration |

Science status (V): Giglio et al. 2025 advise against simple concatenation for local trends and ask for statistical inter-calibration. Fu 2020 and Zheng 2026 show MODIS misses small, low-FRP fires. We found no paper that harmonizes MODIS and VIIRS fire-day counts for Indonesia.

**Conclusion.** At data and algorithm level, NASA is ahead (burned area, perimeters, emissions). At the level of a harmonized, place-level, weekly "is this unusual" product for Indonesia, no sampled agency tool exists (I; not every tool was checked). That is the lane to win: do not claim to beat NASA's science; claim the missing last mile, and be honest about uncertainty, which is itself the agency norm.

## 2. Time-critical facts to use in the story
- S-NPP VIIRS data production ceased 2 Nov 2026 (V, FIRMS FAQ and VNP64A1 page). Our archive+NRT ends 2 Nov 2026, so our series is the full S-NPP record. NOAA-20/21 continue it; adding them is next-step work, flagged on the Method page.
- NASA plans to end Terra MODIS in Jan 2027 and Aqua about Sep 2027 (V, CAMS). Message: the fire record is being re-based now, so a calibrated bridge matters now.
- The 2026 challenge text asks for a web app, calendar, current month vs historical median, accessible colour ramps, anomalies, CSV download and an area picker (V, challenge PDF). We have all but must check CSV download and the colour-blind ramps (see R2).

## 3. Where KalaApi stands (measured)
- Back-cast bias fixed this session. Old: one fixed ratio per stratum, quiet years 17% too low. New: V = alpha_s * M^b, shared b = 0.875, Poisson fit, leave-one-year-out quiet -0.6%, busy +0.5%, 80-84% of province-years within +-20% on holdouts, median province weekly r 0.90-0.95. In-sample (`09_backcast_error.py`): median |err| 10%, p90 30%.
- Static NRT sources: 33 cells flagged and dropped (about 1% of NRT fire-days).
- ENSO: 298 areas clear, 37 weak, 87 none (re-run on new series).
- Honest limits kept: band covers ratio uncertainty only; hotspot-days are not hectares; NRT lacks a type flag; peat flag is a 30 m global map.

## 4. Requirements to reach agency-level credibility
Ranked by judge impact / effort. Each has an acceptance test.

R1 Independent validation (Validity). Gap flagged by the benchmark agent.
 - Compare harmonized fire-days with national burned hectares: SiPongi series 2015-2025 (GoodStats copy, V: 2015 2.61 Mha, 2019 1.65 Mha, 2023 1.16 Mha, 2016 0.44, 2017 0.17, 2020 0.30). Report Spearman rho of annual national fire-days vs hectares. No need for hectares in the app; use it as a validity line on the Method page.
 - Better: province-level burned area (needs team download, see section 6).
 - Accept: one validation figure and one sentence on the Method page; wording says official hectares are a soft target (Gaveau 2021 found 2019 official 1.64 Mha vs 3.11 Mha from Sentinel-2, V).
R2 Challenge-text checklist (Relevance). Confirm in the live app: current month vs historical median view; CSV download per area; colour-blind-safe ramp; area picker. Accept: a checklist on the project page with a screenshot for each.
R3 Method honesty page (Validity). Replace "fixed ratio" wording everywhere (done in this pass for Method, Brief, AreaPage, project-page). Add one line on NOAA-20/21 and the S-NPP end date. Accept: no remaining text says a single ratio or 17%.
R4 Second NASA product in the story (Relevance). Cite MCD64A1 as the validation route and FIRMS API as the live route; list both in References. Do not claim use unless used.
R5 Optional live strip (Impact). FIRMS API with a free MAP_KEY, last 5 days, one province. Only if the team supplies a key and time remains. Accept: strip renders offline-safe (falls back to static message).
R6 Peat honesty (Validity). Keep disclosure: 30 m global map, not the official 1:50,000 KLHK layer. Official extent is 24.67 Mha (KLHK, 2017, V); published totals range 12 to 26.4 Mha (V). Grid-compare flags against KLHK FEG polygons only if the team downloads the file.
R7 Presentation (equal weight). 30 s video and <=7 slides that lead with the user (a BPBD officer), the calendar, "this week vs 25 years", then the honest limits.

Won't do (not enough evidence or time): FRP-threshold series (redefines the product), NOAA-20/21 merge, burned-area model, live alerts.

## 5. What we claim and do not claim
Claim: first place-level, weekly, harmonized MODIS+VIIRS fire-day calendar for Indonesia since 2001, with measured error and a published method. Do not claim: "NASA-grade", novelty of merged counts (Nusantara Atlas does that), burned area, forecasts, or that the ENSO link is causal.

## 6. How the team unblocks Claude (human-only steps)
Claude cannot sign in, download from sites the sandbox blocks, or speak for the team. In order:
1. Push: `git add -A && git commit -m "Activity-dependent back-cast, static-source filter, PRD v2" && git push` (check the Actions tick, hard-refresh the live site). Claude then re-verifies.
2. Event: confirm Bandung local-event rules, that all 6 members are registered, and the team name for the deck cover.
3. Video: record the 30 s video from `docs/video-script.md` (a person speaks; no under-18 images).
4. Project page: paste `docs/project-page.md` into the submission form; add the References list.
5. Data (optional, only if time): save to `D:\dev\DATA_kalaapi\validation\`:
 a. KLHK peat layer `https://sippeg.menlhk.go.id/arcgis/rest/services/FEG_50K_Nasional_Agustus_2022/MapServer/0` paged with f=geojson, 2,000 features per request, as `peat_feg50k.geojson`.
 b. GWIS Country Profile for Indonesia (sub-country), in-app download.
 c. SiPongi province tables 2015-2025 (open the site by hand), as `sipongi_province.csv`.
 d. PEATMAP `Asia.zip` (CC-BY-4.0).
6. Facts to verify by a human before we state them: BRIN "VIIRS only"; SiPongi 202,004 ha and +69% (leave out if unverified).
7. Testing: real phone, Firefox, Safari; a non-expert opens the link cold; Claude fixes what they hit.
8. Backup deck: export and host publicly; submit before 22:00.

## 7. Open uncertainties (say them out loud)
- k and b are empirical; no published standard exists.
- 2020 and 2024 national yearly errors reach about 15%.
- SiPongi source was read through a secondary copy.
- Partner-agency data (JAXA, ISRO, KASA) was not verified; not used.

## Sources
FIRMS FAQ and API; NASA Earthdata VNP64A1/MCD64A1 pages; CAMS "Drifting away from MODIS"; Giglio et al. 2025 (VNP64A1 vs MCD64A1); Fu et al. 2020 (Remote Sensing 12, 2870); Zheng et al. 2026; Schroeder et al. 2014; Gaveau et al. 2021 (ESSD 13, 5353); Chen et al. 2026 (GFED5NRT, ESSD 18, 7535); KLHK peat page (pkgppkl.menlhk.go.id); GoodStats SiPongi series; NOAA CPC ONI v6; Nusantara Atlas; ASEAN ASMC.
