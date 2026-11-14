# Winning ideas: what wins, where KalaApi stands, what to build next

Written 14 Nov 2026 from three research passes (team research folder, web, Indonesia fire-tool landscape).
Label key: **SOURCED** = a page said it. **INFERRED** = our reading. Nothing here is a judge quote.

## 1. What wins (honest version)
- Judges score five criteria, 1 to 5: Impact, Creativity, Validity, Relevance, Presentation. SOURCED (official judging guide). No weights are published.
- Presentation is a full criterion. The guide says give it equal attention. SOURCED.
- Judges read the project page most. The demo (30 s video or 7 slides) can raise Presentation. SOURCED.
- NASA data must be a core part, not an add-on. SOURCED.
- All 10 pages we read in the folder name an end user, and give a demo link. 5 of 10 give a number or worked example. INFERRED pattern, counted by hand.
- Winners are not only "best tech". 2023-2025 winners include a comic, a children's story, a pixel game and a concept paper. SOURCED lists, INFERRED meaning.
- "One specific problem" advice appears only on a third-party coaching page (colabcomps). No official file says it. It is still sound for us.
- NOT FOUND: any source for "bad presentation, strong website still wins". Art & Technology and Best Use of Technology may reward the artifact. Unverified.

## 2. Is fire a crowded idea?
- Fire was an official challenge in 2017-2020. 2022-2025 had no dedicated fire challenge. We found no fire project among 2022-2025 global winners. SOURCED absence, reason unknown.
- We could not load finalist lists. A fire project may have reached finalist level. Unknown.
- 2026 has a fire challenge made for us: "Harmonization of MODIS and VIIRS Hot Spots". It asks for a web app with a burning activity calendar. KalaApi fits the text closely. So "idea used a lot" is the wrong worry. The real risk is that other teams pick the same challenge and build the same calendar.
- Our edge over a plain calendar: the 2012 fake-surge fix, with numbers (x6.5 raw vs x1.2 harmonized), plus peat, anomaly and story mode.

## 3. Landscape (checked pages only)
- SiPongi: burned area, manual interpretation, daily province hotspot counts.
- Pantau Gambut: hotspots in peat units. BMKG: fire danger index, early warning. ASMC: haze portal, seasonal outlook.
- GFW and FIRMS show MODIS and VIIRS but do not harmonize over time.
- We found no tool with a kabupaten-level, sensor-harmonized fire calendar since 2001, or "is this week unusual for this place". Say "we found no", never "none exists".
- Not checked: Auriga, Kepo Hutan, MapBiomas, KLHK SIGAP. Check before claiming novelty.
- 2026 context (SOURCED, news): South Sumatra declared siaga 22 Apr to 30 Nov. Malaysia closed schools 9 Oct 2026 over haze.

## 4. Ranked upgrades (effort is a guess)
1. **Readiness window per area** (3-4 h). Earliest, median, latest onset week. "Act X weeks before median onset." Extends the readiness card. Label as hotspot onset, not drought or ignition.
2. **One-page BPBD brief** (3 h). Print CSS, EN/ID. Sparkline, percentile, onset window, peat split, 2026 vs 2015 and 2019. Gives judges a real product for a named user.
3. **"Does El Nino matter here?"** (5-6 h). Fire-day percentile in El Nino JAS years vs others, per province, with n shown and a strong/weak/none label. About 8 El Nino years only. No 2027 forecast. If a 2027 line is shown, say "if El Nino repeats / if not". Cite NHESS ProbFire (skill differs by region).
4. **"2026 is most like..." analog year** (2-3 h). Closest past cumulative curve to week 43. A similarity, not a prediction.
5. Compare two places (2 h). Scorecard and share image (2 h). PWA and accessibility (2 h).
6. Skip: haze to downwind cities. No wind or PM2.5 data. Future work only.

## 5. Suggested plan before Sunday 10:00 freeze
- Tonight: items 1 and 2. Tomorrow morning: item 3 only if it is clean. Freeze at 10:00.
- Last hours: video, project page, one demo path: South Papua 116% of 2015, then readiness window, then BPBD brief.
- Project page first two lines: the user (BPBD, Manggala Agni, peat managers), the number (x6.5 vs x1.2), the NASA data (MODIS, VIIRS via FIRMS).
- Write the limits down, like past winners did.

## 6. Pitch guards
- Say "fire activity (hotspot detections)". Never "burned area".
- Do not state a death or health number as ours. Quote the Harvard/Columbia 2016 model estimate as a model.
- Do not call any outlook a forecast.
- Verify before using: SiPongi 202,004 ha / +69% claim, BRIN "VIIRS only".
- Folder caveat: the two JudgingCriteria PDFs are third-party. Use JUDGING_AWARDS_GUIDE and PROJECT_SUBMISSION_GUIDE.
