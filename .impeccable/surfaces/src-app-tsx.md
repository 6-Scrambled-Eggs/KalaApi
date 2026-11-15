---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css","src/AreaPage.tsx"]
---

# KalaApi web app (whole site)

Scope: every route of the static app (`#/` map, `#/area/<id>`, `#/compare`, `#/enso`, `#/method`, `#/surge`, `#/story`). The BPBD brief and readiness card keep their A4 print layout and adopt type and colour only. Mode: Operate.

Task: a BPBD officer opens their area and learns whether this year is unusual, when the season starts and when to be ready, on a phone or a desk, in Bahasa Indonesia first.

Constraints: keep the yellow-to-brown fire ramp on map and calendar; keep the print brief layout; avoid alarmist tone, generic SaaS dashboard look, decoration that slows scanning, and anything that feels foreign to Indonesian public-sector readers.

## Direction contract

THESIS: Each area is a numbered sheet of the Peta Rupabumi national map series. The fire record sits inside a surveyed neat-line and the sheet margin carries the facts. Refuses the dark fire dashboard with KPI cards, and the cream editorial page.

OWN-WORLD: Sea-blue #0f4c6e shell bar and controls on a pale cool land ground #f2f4ef, ink #16212b, water tint #d4e6f0 for map sea and the locator. Fire ramp (yellow to brown) only on data. One family, Archivo, with its width axis: condensed and uppercase for sheet labels and figures, normal width for text. Hairline black neat-lines, 2px rules, no rounded cards, no shadows on content.

STORY: The officer sees their area's name at sheet-title scale, reads four answers across one rule (this year vs normal, be ready by, onset, most similar year), then reads the calendar inside the neat-line, then opens the brief from the margin.

FIRST VIEWPORT: Sea-blue header 56px (brand, nav, language, search on the right). Below, a 268px margin column on the left (sheet code, locator inset with adjoining sheets as links, edition week, source, unit, tools), and the main column: area name at 64px condensed, then four answer figures between a 2px top rule and a 1px bottom rule, then the calendar heading with the data-view segmented control, then the calendar inside a ticked neat-line with yearly totals in the right margin. On phones the margin block drops below the answers.

FORM: Peta Rupabumi map sheet; position 5 of 7 on the ordered list. seed:d080c248d9743a75. Signature move: the neat-line collar with week ticks and the yearly-total margin column around the calendar, and the locator inset whose neighbouring provinces are links. Raises: tabular totals beside every year row; area name at sheet-title scale; sea-blue reserved for navigation and controls, fire ramp reserved for data; year comparisons as small multiples on one locked scale; this year in one reserved ink on every chart; province list and map highlight each other.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
