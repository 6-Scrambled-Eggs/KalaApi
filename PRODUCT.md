# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **First: NASA Space Apps judges.** They see the live site in a demo (projector or shared screen) and on their own laptops. They score Impact, Creativity, Validity, Relevance and Presentation.
- **Then: Indonesian fire-readiness staff.** BPBD (regional disaster agencies), Manggala Agni (forest fire brigade) and peat managers. Their job is to know when a place usually burns, whether this year is unusual, and when to get ready. They read it at a desk and print the one-page brief.
- **Also:** anyone checking on a phone whether this season is unusual.

The use is mixed: demo first, but the site must also work at an office desk and on a phone.

## Product Purpose

KalaApi turns 25 years of NASA FIRMS hotspot detections (MODIS and VIIRS) into one comparable weekly fire-activity calendar for any Indonesian province or kabupaten. Success means:
- a user can see in seconds when a place usually burns and whether this year is unusual;
- an agency can print a one-page brief that says when to be ready.

## Positioning

The two satellite sensors disagree. Raw hotspot counts jump about ×6.5 in 2012 when VIIRS arrives. KalaApi measures that step and removes it (harmonized fire-days jump about ×1.2), so 2001–2026 can be compared week by week. It shows every error band and limit openly. We found no other tool with a kabupaten-level, sensor-harmonized fire calendar since 2001.

## Operating Context

- It is a static web app with no backend. Hash routes:
  - `#/` map and home
  - `#/area/<id>` calendar, profile, flags, readiness, analog, El Niño
  - `#/surge` 2012 sensor step
  - `#/enso` El Niño link
  - `#/compare/<a>/<b>`
  - `#/story/<id>`
  - `#/brief/<id>` and `#/card/<id>`, printable A4
  - `#/method`
- Language: EN/ID toggle.
- Exports: CSV, PNG, copy link, weekly share card.
- The site deploys to GitHub Pages and is recorded for a 30-second demo video.

## Capabilities and Constraints

- Data: weekly harmonized fire-days, 0.05° cells, 2001 to week 43 of 2026. Anomaly percentiles are measured against 2001–2025. Peat and mineral split.
- Do not change the method or the numbers. Keep each area file under 2 MB. No live API calls in the demo path; the live strip is a separate file.
- Lighthouse targets: Accessibility, Best Practices and SEO at 100, Performance as close to 100 as possible, layout shift (CLS) near 0.
- The brief and card must print on one A4 page.
- Every user-facing text exists in EN and ID.

## Brand Commitments

- The name **KalaApi**. *Kala* means time; *api* means fire.
- The flame mark: an amber flame on a rust-brown square, as in the current favicon.

## Evidence on Hand

- Real data in `public/data/`: 422 area files, validation, El Niño and ONI data.
- Validation numbers are in CLAUDE.md and on `#/method`. Do not invent users, agency endorsements, testimonials or accuracy claims. Every brief says "Not an official product".

## Product Principles

1. Honest first. Hotspots are heat detections, not area burned. Show uncertainty and limits next to the numbers.
2. One question per screen, answered by the biggest thing on it.
3. Readiness is the action. Every area leads to "when to be ready".
4. Comparable across time. The harmonized series is the hero; raw sensors are there for proof.

## Accessibility & Inclusion

- WCAG AA contrast and full keyboard access. The map has a keyboard list alternative.
- Bilingual (EN/ID). Colour encodings carry text labels too.
