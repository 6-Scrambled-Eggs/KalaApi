# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a BPBD officer** (Badan Penanggulangan Bencana Daerah, the local disaster agency) responsible for fire preparedness in a province or kabupaten. Their job: find out whether this year's fire activity in their area is unusual, when the fire season usually starts, and when to get ready. They print or share a one-page brief for coordination with other agencies. They often work on a phone with slow mobile data, and they read Bahasa Indonesia first.

**Secondary:** Manggala Agni (the forest-fire brigade), peat managers, journalists and researchers who need a fire history that is comparable across 2001–2026.

**Evaluators:** NASA Space Apps 2026 judges (Impact, Creativity, Validity, Relevance, Presentation). They see the product through the BPBD officer's task, not as a separate audience.

## Product Purpose

KalaApi turns 25 years of NASA MODIS and VIIRS hotspot detections into one comparable fire-activity calendar for any Indonesian province or kabupaten. It tells a user when a place usually burns, whether this year is unusual, and when to get ready.

Success: an officer opens their area, understands within a minute where this year stands against 2001–2025, and leaves with a "be ready by" date and a printable brief they can trust.

## Positioning

**An honest sensor bridge.** Raw hotspot counts jump about 6.5 times in 2012 because the VIIRS sensor sees more small fires than MODIS, not because fires increased. KalaApi fits a calibrated, validated MODIS-to-VIIRS bridge (power law V = α·M^b per stratum, b ≈ 0.88), so 2015 and 2026 can be compared in one unit (fire-days). The harmonized jump is about 1.2 times. The readiness window, BPBD brief, El Niño link, analog year and compare view are all built on that one record, and the limits of the numbers are stated plainly beside them.

## Operating Context

- An officer checks their area during the dry season (roughly July–October), often on a phone.
- The BPBD brief (`#/brief/<id>`) and readiness card (`#/card/<id>`) are printed on A4 or saved as PDF and taken into coordination meetings.
- Shareable outputs: CSV and PNG export, copy-link, a weekly share card on the home page.
- Hash routes: `#/` map, `#/area/<id>`, `#/surge/<id>`, `#/story/<id>`, `#/card/<id>`, `#/brief/<id>`, `#/compare/<a>/<b>`, `#/enso`, `#/method`.
- Hackathon demo path: South Papua at 115% of 2015, then the readiness window, then the BPBD brief.

## Capabilities and Constraints

- Static web app (Vite, React, TypeScript, MapLibre, ECharts). No backend. Data is read from `public/data/` at runtime. No live API calls in the demo path; each area file stays under 2 MB.
- 422 areas: the nation, 38 provinces, and kabupaten.
- Data runs from 2001 to week 43 of 2026 (the last S-NPP VIIRS day is 2 Nov 2026). A separate "last 5 days" live strip (NOAA-20/21) is not part of the calibrated series and must never be mixed into it.
- Terminology: **fire-day** = one 0.05° cell on one day with at least one daytime detection. **Harmonized** = VIIRS-equivalent. **Back-cast / estimated from MODIS** = years before 2012. **Elevated** = weekly percentile ≥ 90, **extreme** = ≥ 97.5, with "(low base)" when the week is normally quiet.
- Bilingual: English and Bahasa Indonesia (`src/i18n.ts`).
- Undecided: polygon draw (FR-14), MCD64A1 burned-area check (V-7).

## Brand Commitments

- Name: KalaApi ("kala" = time or season, "api" = fire).
- Voice: plain, short sentences that make no claim beyond the data. Hotspots are heat detections, not area burned. The readiness window and El Niño link describe history; they are not forecasts.
- Briefs and cards say "Not an official product" and "Not endorsed by BPBD or any agency".
- AI use is disclosed on the project page and in the footer. No NASA logos in AI-made content.

## Evidence on Hand

- Validation (Method page, `public/data/validation.json`): V-1 holdout 2019 and 2023, national annual error +1.8% and +3.2%, 80% of province-years within ±20%, weekly r 0.90. V-6 reverse holdout: 84% within ±20%, weekly r 0.95.
- Known events: Central Kalimantan and South Sumatra reach weekly percentile 98 in 2015. Report honestly that not every peak week is flagged.
- Yearly national fire-days rank 2015–2025 the same way official burned hectares do (Spearman ρ 0.90, n = 11).
- El Niño link: 298 of 422 areas clear, 37 weak, 87 none. Only 5 El Niño years in 2001–2025, and p is not corrected for multiple tests.
- Absent: there are no user testimonials, agency endorsements, deployment or adoption figures. Do not invent any.

## Product Principles

1. **One comparable record first.** Every view uses the harmonized series unless it is clearly labelled raw. Never compare raw counts across 2012.
2. **Honest about limits.** Show uncertainty, low bases and "not a forecast" next to the number, not hidden on another page.
3. **Answer the officer's three questions:** is this year unusual, when does the season start, and when should we be ready.
4. **Works in the field.** Light pages, usable on a phone with slow mobile data, readable when printed.
5. **Bahasa first, English equal.** Every user-facing string exists in both languages.

## Accessibility & Inclusion

- Bahasa Indonesia is the main language for real users; English serves the judges and international readers. Both must be complete.
- Phone and low-bandwidth use: keep initial load light, lazy-load heavy views (maps, charts), and avoid layout shift.
- The colour ramps are single-hue sequential (yellow to brown) so they work for colour-blind readers. A keyboard-accessible province list sits beside the map canvas, and the site has a skip link and visible focus.
