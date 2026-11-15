# Judge Q&A bank (live pitch, 21 Nov 2026)

Every number below comes from a pipeline output or the Method page. Check it against the live site before you speak.

| Question | Short answer |
|---|---|
| Why fire-days, not hotspot counts? | A 375 m sensor (VIIRS) gives several points for a fire where a 1 km sensor (MODIS) gives one. We count a 0.05° cell (about 5.5 km) once per day. That removes most of the sensor difference, and we calibrate the rest. |
| Which confidence levels? | MODIS confidence 30 or more, VIIRS nominal or high. Daytime passes only: Aqua and S-NPP both cross near 13:30. |
| How do you handle false alarms (mines, flares)? | Archive: type 0 (vegetation fire) only. Near-real-time files after July 2026 have no type flag, so we drop cells that look static: 33 cells, 1,743 cell-days. BRIN removes mining sites in its own way. |
| Why is Central Kalimantan 2006 above 2015? | Raw Aqua MODIS has the same order (10,297 vs 7,564 fire-days). Thick haze can hide fires, and a cell counts once per day, so very busy days saturate. Our estimate for 2006 is 28,639 (90% band 26,314 to 29,930); observed 2015 is 24,876. The order is not settled. Official burned area ranks 2015 first. |
| Is your El Niño link real? | We adjust with Benjamini–Hochberg (q). 288 of 422 areas pass q < 0.05 (248 clear, 40 suggestive), 47 are weak, 87 show none. Only 5 El Niño years in 25 and neighbouring areas are correlated. Exploratory, not a forecast. |
| S-NPP has ended. Is your calendar dead? | The series ends 2 Nov 2026 and stays valid. We tested a NOAA-20 bridge (2019–2025, leave one year out): national yearly error −4.6% to +12.5%, two years above our 10% limit, 96% of province-years within ±20%. So: tested, not yet good enough, not merged. The method is the same; it needs a longer overlap or a better model. |
| How accurate is the back-cast? | Holdout 2019 and 2023: national +1.8% and +3.2%; 80% of province-years within ±20%. Small areas are noisier. Flags use a VIIRS-only 2012–2025 baseline as a cross-check (Spearman 0.94). |
| Did you validate against burned area? | Nationally, by rank, against SiPongi (Spearman 0.90, n = 11, from a secondary copy). Fire-days are not hectares. Province-level checks (MCD64A1) are next. |
| Is the exponent b stable? | Coarse grid b = 0.875. Fine grid (step 0.005) b = 0.870, 90% interval 0.855 to 0.880. Change 0.005, below our 0.01 rule. |
| Week 3 of 2026 in Kalteng looks extreme. Static source? | No. 171 fire-days in 146 cells in 7 days, most cells on one day only, median 4.5 MW, in five kabupaten. NOAA-20 (153) and NOAA-21 (139) saw similar numbers. It is a normally empty week; the app shows it as extreme (not "low base", because 171 is above our 10%-of-peak rule). |
| How is the monthly view built? | Each weekly value is shared out to days (back-cast: by daily MODIS-equivalent fire-days; later: observed daily VIIRS) and summed by month. Monthly totals equal weekly totals (gap 0.000%). |
| What does the custom-area tool do? | Sums harmonized fire-days of 0.05° cells inside a circle (5 to 100 km) for chosen dates; CSV per cell and week. Cell totals add up to the national weekly total. Small circles are noisy. |
| Who would use this? | Use a real quote if you have one (H-3). Otherwise say: "We have not tested with a BPBD yet. That is our next step." |
| How does it relate to BRIN's hotspot system? | BRIN's system mainly uses VIIRS on S-NPP and NOAA-20. KalaApi adds a calibrated 25-year baseline that joins MODIS and VIIRS. It can feed such a system, not replace it. |
| What did AI do? | Claude helped write code and documents. The team chose the method and checked the numbers. Name who checked what. |
| What can KalaApi not do? | Measure burned area, forecast, or give exact pre-2012 values (they are estimates with a band). Cloud and haze hide some fires. |
