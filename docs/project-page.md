# KalaApi: project page text (NASA Space Apps 2026)

Copy each block into the matching field of the submission form. Change anything in [brackets] first.

## Project name
KalaApi

## High-level summary (1-2 sentences)
KalaApi joins 25 years of NASA MODIS and VIIRS hot spots into one comparable fire calendar for any province or kabupaten in Indonesia. It shows when a place usually burns and whether this year is unusual, without the false jump that appears in 2012 when the sensors change.

## Detailed description
**The problem.** Hot spot counts from MODIS (1 km, from 2000) and VIIRS (375 m, from 2012) are not comparable. Raw counts in Indonesia jump about 6.5 times from 2009-11 to 2012-14. Most of that jump is the new sensor, not more fire. A BPBD officer, a peat manager or a journalist cannot tell if 2026 is really worse than 2015.

**What we built.** KalaApi is a static web app. For every province and kabupaten it shows:
- a burning-activity calendar from 2001 to week 43 of 2026, one row per year and one column per 7-day block;
- the typical onset, peak and end weeks, and how 2026 compares with the same weeks in 2001-2025 and in the last 10 years;
- flagged weeks (elevated at the 90th percentile and extreme at the 97.5th);
- a story mode that compares 2015, 2019, 2023 and 2026 in fire-days and in fire radiative power (FRP);
- peat-only and mineral-only views, an El Nino marker for each year, and CSV and PNG export;
- a **readiness window**: the earliest, median and latest week the fire season started over 25 years, and a "be ready by" date;
- a **one-page BPBD brief** (print or save as PDF, English and Bahasa Indonesia) with where the area stands now, the readiness window, the El Nino link and the limits of the numbers;
- an **El Nino link** map and chart: for each province, whether years with El Nino (July-September ONI) are also years with more fire-days. 300 of 422 areas show a clear link, 41 a weak one and 81 none (only 5 El Nino years in 25; exploratory, not a forecast);
- an **analog year**: the past year whose fire curve so far is closest to this year (a likeness, not a prediction).
The interface is in English and Bahasa Indonesia.

**How the harmonization works.** We count fire-days: one 0.05-degree cell on one day with at least one daytime detection. For each stratum (province or island group, split by peat and mineral soil) we measure the ratio k between VIIRS fire-days and Aqua MODIS fire-days on the years when both exist (2012-2026). Before 2012 we estimate VIIRS-equivalent fire-days as k times the MODIS fire-days (Terra scaled to Aqua before mid-2002). From 2012 the series is the observed VIIRS series. A 90% band comes from 1,000 bootstrap draws over years.

**How we tested it.** We held out 2019 and 2023, calibrated without them, and predicted their VIIRS fire-days from MODIS. National annual error was +2.3% and +1.2%. 71% of province-years were within 20%. The median weekly correlation was 0.90. A reverse test (calibrate on 2018 and later, predict 2012-2017) gave a median weekly correlation of 0.94, but it under-predicts quiet years such as 2016 and 2017 by about 11%. The peat split lowers the national error a little and lowers the share of province-years within 20% (71% against 77% without the split), because some peat strata have few fire-days. The Method page in the app shows all checks.

**What we found.** By week 43 of 2026, Indonesia has 76% of the fire-days that 2015 had at the same point. South Papua (116%) and West Kalimantan (112%) are already above 2015.

**Limits.** Hot spots are heat detections, not burned area. Clouds and haze hide fires. Quiet years are under-predicted before 2012. NRT files after July 2026 have no static-source flag. The peat map is a 30 m global product, not the official 1:50,000 national map.

## Demo link
[30-second video URL]

## Final project link
https://6-scrambled-eggs.github.io/KalaApi/
Code: https://github.com/6-Scrambled-Eggs/KalaApi

## NASA data used
- NASA FIRMS active fire archive: MODIS Collection 6.1 (Terra, Aqua) and VIIRS 375 m (Suomi NPP, NOAA-20, NOAA-21).

## Other data used
- geoBoundaries gbOpen, Indonesia ADM1 and ADM2 (CC BY 4.0).
- Global Forest Watch / WRI Global Peatlands tiles, version 2023-03-15 (30 m).
- NOAA Climate Prediction Center, Oceanic Nino Index (ONI).

## AI-use disclosure
We built KalaApi with AI assistance. Claude (Anthropic) helped write the Python data pipeline, the React web app, the tests and the documentation, and helped plan the method and review the results. The team chose the challenge, set the requirements, and reviewed the code and numbers. [Add: which team members checked which parts. Add: any AI-made image or video, with its watermark.] No NASA logos appear in AI-made content.

## References
1. Giglio, L., Schroeder, W., Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. Remote Sensing of Environment, 178, 31-41. https://doi.org/10.1016/j.rse.2016.02.054 (checked against the paper PDF on 14 Nov 2026)
2. Schroeder, W., Oliva, P., Giglio, L., Csiszar, I. A. (2014). The new VIIRS 375 m active fire detection data product: Algorithm description and initial assessment. Remote Sensing of Environment, 143, 85-96. https://doi.org/10.1016/j.rse.2013.12.008 (checked against the paper PDF and the FIRMS FAQ on 14 Nov 2026)
3. NASA FIRMS (part of NASA ESDIS, LANCE): https://firms.modaps.eosdis.nasa.gov/ . We acknowledge the use of data from NASA LANCE FIRMS. Check the FIRMS site for any newer "how to cite" wording before you submit.
4. geoBoundaries: https://www.geoboundaries.org/
5. Global Forest Watch, Global Peatlands: https://data.globalforestwatch.org/
6. NOAA CPC, Oceanic Nino Index: https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php
7. Verify the BRIN and SiPongi claims before you cite them (see below).

## Claims your teammate must check before you submit
- "SiPongi recorded 202,004 ha burned from January to July 2026, 69% more than 2025." Sources found: Kompas, Katadata. Check on SiPongi+.
- "BRIN hotspots use VIIRS only." Source found: DPR e-paper. Check on hotspot.brin.go.id.
