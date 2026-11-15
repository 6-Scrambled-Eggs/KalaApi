---
name: KalaApi
description: One comparable fire-activity record for every Indonesian area, laid out as a sheet of the national map series.
colors:
  sea: "#0f4c6e"
  sea-hover: "#136089"
  sea-deep: "#0b3a55"
  sea-tint: "#d4e6f0"
  sea-line: "#7fc4e8"
  on-sea: "#e8f1f6"
  on-sea-2: "#b9d3e1"
  ground: "#f2f4ef"
  sheet: "#ffffff"
  hair: "#c5cdc8"
  hair-2: "#dfe4dd"
  ink: "#16212b"
  ink-2: "#2c3a45"
  mute: "#4a5864"
  land: "#c9d3c4"
  fire-0: "#fff7bc"
  fire-1: "#fec44f"
  fire-mid: "#fe9929"
  fire-2: "#d95f0e"
  fire-3: "#993404"
  fire-deep: "#4d1a02"
  fire-ink: "#a8430a"
  extreme: "#7b241c"
  warn-bg: "#fbf1cf"
  warn-line: "#e0c46c"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 1.4rem + 3.4vw, 4.2rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 80"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.12rem + 0.5vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 85"
  figure:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.5rem + 1.2vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.08
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 85"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 75"
  wordmark:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 112"
rounded:
  control: "2px"
  none: "0px"
spacing:
  gutter: "clamp(16px, 2.6vw, 32px)"
  header: "56px"
  margin-column: "252px"
  column-gap: "36px"
  section: "40px"
  main-max: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.sea-hover}"
    textColor: "{colors.sheet}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.sea}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.sea-tint}"
    textColor: "{colors.sea-deep}"
  segment:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.sea}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  segment-on:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.sheet}"
  header-bar:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.on-sea}"
    height: "{spacing.header}"
  search-input:
    backgroundColor: "{colors.sea-deep}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 12px 0 34px"
  sheet-margin:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 14px 14px"
    width: "{spacing.margin-column}"
  answer-figure:
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    padding: "9px 14px 12px"
  badge-extreme:
    backgroundColor: "{colors.extreme}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "2px 7px"
  badge-elevated:
    backgroundColor: "{colors.fire-ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "2px 7px"
---

# Design System: KalaApi

## Overview

**Creative North Star: "Lembar Peta"**

Every area in KalaApi reads as one numbered sheet of Indonesia's Peta Rupabumi national map series. The fire record sits inside a surveyed neat-line, the sheet margin on the left carries the facts a map margin would (sheet number, locator inset, adjoining sheets, edition, source, unit, tools), and the area name stands at sheet-title scale. The world is borrowed from the public-sector cartography an Indonesian BPBD officer already trusts, so the page reads as a document, not a dashboard.

The mode is Operate: a working officer on a phone or a desk scans for three answers and leaves. Density is high but quiet. Hierarchy comes from type size and from rules (a heavy 2px ink rule over a light 1px rule), never from cards, fills or shadows. Colour carries meaning only: sea-blue means "you can act here", the yellow-to-brown ramp means "this is fire data", and bold ink means "this year".

It refuses the dark fire dashboard with KPI cards and glowing accents, the cream editorial magazine page, and any alarmist register. Hotspots are heat detections, and the page states its numbers the way a survey sheet states contours: plainly, with the method in the margin.

**Key Characteristics:**
- Sea-blue shell and controls on a pale cool land ground; white sheets framed by 1px ink neat-lines.
- One family, Archivo, used across its width axis: 75% labels, 80% display, 85% headings and figures, 100% text, 112% wordmark.
- The fire ramp appears only on data marks; this year rides in bold ink on every chart.
- Graticule ticks and labels sit outside the frame, the way a map collar carries them.
- Flat throughout: depth comes from frames and rules, never shadow.

## Colors

A cartographer's palette: sea for the instrument, land for the ground, ink for the record, and a single-hue sequential fire ramp for the data.

### Primary
- **Survey Sea** (sea): the header bar, every button, segmented control, link, focus ring and the current area on the locator inset. It is the only colour that invites action.
- **Sea Hover / Sea Deep** (sea-hover, sea-deep): hover on filled controls; the search field and language-button hover inside the header.
- **Water Tint** (sea-tint): map and locator sea, hover wash on outline controls and tool rows, and the list-to-map highlight row.
- **Collar Line** (sea-line): the 3px underline of the active nav item and focus rings inside the sea header, where a sea outline would vanish.
- **On-Sea / On-Sea Muted** (on-sea, on-sea-2): header text; inactive nav links, the brand tagline and the search placeholder.

### Secondary
- **Fire Ramp** (fire-0 through fire-deep): the yellow-to-brown sequential ramp for fire-days and percentiles on the calendar heat grid, the province map, the legend bar and the watchlist bars (fire-2). Single hue so it survives colour-blind reading and greyscale print.
- **Fire Ink** (fire-ink): the "elevated" badge and fire-coloured text that must pass contrast.
- **Extreme Oxide** (extreme): the "extreme" badge and error text. Its rarity is what makes it read.

### Neutral
- **Land Ground** (ground): the page background around sheets.
- **Sheet White** (sheet): every framed surface (margin, calendar neat-line, tables, A4 pages, tooltips).
- **Ink** (ink): text, neat-lines, 2px rules, axis lines and ticks, and this year's line and label.
- **Ink Second** (ink-2): lead paragraphs, table row heads, secondary text on sheets.
- **Mute** (mute): notes, captions, graticule labels, sublines.
- **Hair / Hair Light** (hair, hair-2): the 1px dividers inside figure rows, table rows and lists; hair also fills the 10-90% band on the seasonal chart, hair-2 the empty track of watchlist bars and loading placeholders.
- **Land Fill** (land): land on the locator inset.
- **Notice Paper / Notice Line** (warn-bg, warn-line): the one boxed notice style for caveats (low base, raw counts across 2012).

### Named Rules
**The Sea Is the Instrument Rule.** Sea-blue appears only on navigation, controls, links, focus and the "you are here" mark. Never use it to encode a data value.

**The Fire Is the Record Rule.** The yellow-to-brown ramp appears only on data marks and their legend. Never use it for buttons, headings, icons or decoration.

**The This-Year-in-Ink Rule.** The current year is drawn in bold ink on every chart: a 3px ink line on the seasonal profile, an 800-weight ink year label on the calendar. It never takes a hue of its own.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui, sans-serif), self-hosted with its width axis.
**Body Font:** the same family at normal width.
**Label Font:** the same family at 75% width, uppercase, tracked.

**Character:** One sans-serif family stretched and compressed the way map lettering is: condensed caps for sheet labels, a tall condensed display for names and figures, plain normal-width text for reading. It is a public-sector face, neutral and legible, not a brand voice.

### Hierarchy
- **Display** (800, 80% width, clamp 2.4 to 4.2rem, line-height 1.02): the area name as sheet title. Generic page h1 uses the same voice at clamp 2 to 3.4rem.
- **Headline** (700, 85% width, clamp 1.25 to 1.5rem, line-height 1.2): section heads, 40px above.
- **Figure** (700, 85% width, clamp 1.9 to 2.6rem, tabular lining numerals): the four answer figures and figure tiles. Home hero and step figures go to 800 at 80% width.
- **Title** (700, 1.05rem): sub-section heads.
- **Body** (400, 15.5px, line-height 1.5): reading text; lead paragraphs max 62ch, notes max 78ch at 13.5px in mute.
- **Label** (600, 11px, 75% width, 0.08em tracking, uppercase): sheet labels in the margin, answer labels, table heads, legend titles. Sublines (`.sub`) use 13px, 85% width, 0.04em tracking, uppercase, in mute.
- **Wordmark** (800, 21px, 112% width): "KalaApi" in the header only.

### Named Rules
**The One Family Rule.** Every role is Archivo; contrast comes from the width axis, weight and size, never from a second typeface.

**The Tabular Figures Rule.** Every number in figures, tables, lists, tooltips, flags and graticule labels sets in tabular numerals so columns of years and totals align.

## Layout

The area page is a two-column sheet: a 252px margin column on the left and the body on the right, 36px apart, inside a main column of at most 1240px with a fluid gutter (16 to 32px). The margin sticks below the 56px header on desks taller than 820px. Above the body, the sheet head holds the title, a subline, the four answers between rules, and a summary sentence; the calendar section follows with its heading and the segmented data-view control on one line.

Figure rows (answers, home hero, step row) are grids of equal columns between a 2px ink top rule and a 1px ink bottom rule, divided by 1px hair verticals, with the first cell flush left. Sections are separated by 40px of space and a headline, not by boxes.

Responsive: at 960px and below the margin drops below the body and splits into two columns, answers become 2 by 2, and a quick-action row appears under the head. At 700px the header unpins and wraps (brand and search, then a horizontally scrolling nav that fades at the edge); CTA rows become 2 by 2. At 600px maps shorten to 360px, graticule labels hide, and the margin goes single-column. At 520px the home hero becomes stacked rows with the big figure beside its label. The calendar keeps a 760px minimum inside its own horizontal scroll so weeks never squeeze.

Print: A4 pages (max 794px on screen) lose their frame and controls; the brief compresses to 11.5px with a four-up tile row to fit one page.

## Elevation & Depth

Flat. Surfaces sit on the ground as framed sheets; depth is conveyed by the 1px ink neat-line around a white sheet against the pale land ground, and by the weight of rules (2px over 1px). Map controls have their shadow removed and take a 1px ink frame instead. Pressed controls move down 1px; nothing lifts.

### Named Rules
**The Neat-Line Rule.** Content is framed with a 1px ink border or bounded by 2px/1px ink rules. No content shadows, no tinted card backgrounds, no inset panels.

## Shapes

Square by default. Sheets, frames, tables, the locator inset, the map and the calendar have square corners. Controls (buttons, segmented buttons, the search field, selects, badges, map control groups) take a 2px radius so they read as pressable without becoming pills. The calendar's back-cast years are marked by an open bracket in the year collar, drawn in 1px ink; graticule and week ticks are 1px ink strokes 4 to 5px long.

### Named Rules
**The Two-Pixel Rule.** A 2px radius belongs to controls only. Anything that holds content is square.

## Components

### Buttons
Plain, firm, and blue because they act.
- **Shape:** gently squared (2px radius), 1px sea border.
- **Primary:** sea fill, white text, 14px at 600, 8px 14px padding.
- **Hover / Focus:** sea-hover fill; 2px sea focus outline at 2px offset; 1px press-down on active. Colour transitions at 0.12s.
- **Secondary:** sheet fill with sea text and border; hover washes to water tint with sea-deep text.
- **Toggles:** secondary styling; the active toggle takes the primary fill.

### Segmented Data-View Control
Joined sea-outlined buttons on one rule (overlapping borders, 6px 12px, 13px); the selected view is filled sea. It sits beside the calendar heading and switches the calendar between harmonized, anomaly, raw and peat views.

### Inputs / Fields
- **Search (header):** sea-deep field, white text, 36px tall, 2px radius, inline magnifier stroke in on-sea-2; hover shows an on-sea-2 border.
- **Select (on sheets):** sheet fill, 1px ink border, 2px radius; hover border turns sea.
- **Focus:** 2px sea outline at 2px offset; inside the header the outline is collar-line blue.

### Navigation
Sea header bar 56px tall, sticky on desks. Wordmark left with a small on-sea-2 tagline (hidden below 1180px), nav links at 14px/500 in on-sea-2, white on hover, white with a 3px collar-line underline when current. Language toggle is a small outlined caps button. Search sits on the right. On phones the bar wraps and the nav scrolls horizontally with an edge fade.

### Sheet Margin
The signature frame. A white 1px-ink box holding the sheet number line (label voice, 2px ink rule beneath), the index disclosure ("KalaApi index, alphabetical. Not a BPS code."), the locator inset, adjoining sheets as links, edition, source, unit, and a tools list of sea text rows with 15px stroked inline icons that wash to water tint on hover.

### Locator Inset
A small map of Indonesia framed in 1px ink: water-tint sea, land-fill provinces, the current area in sea, adjoining provinces in a muted blue (#8fb0c2) that turns sea-hover on hover or focus and link to their sheets. Longitude ticks and labels sit below the frame, latitude labels at its corners.

### Answer Figures
Four figures across one row between a 2px and 1px ink rule: label voice heading, figure at 85% width in tabular numerals, a 12.5px mute explanation underneath.

### Burning-Activity Calendar
The data centrepiece, framed in a white 1px-ink neat-line. One row per year, 52 week columns. Week ticks and selected week numbers run along the top collar; month names along the bottom collar; yearly totals in a right margin column; years down the left with El Niño and La Niña marked by filled and open circles in ink; the current year label in 800-weight ink; back-cast years bracketed in the left collar with a rotated caption; a dashed ink line marks the VIIRS start. Cells use the fire ramp with thin white separators.

### Tables, Flags and Lists
Tables are white, open, with a 2px ink top rule, 1px ink head rule and 1px hair row rules; rows hover to a faint ground tint. Flag lists and the watchlist follow the same rule pattern; watchlist bars are fire-2 on a hair-2 track. Hovering or focusing a province row washes it water-tint and outlines the province on the map in sea at 2.5px, and the reverse.

### Maps
Framed in 1px ink on a water-tint sea, provinces in the fire ramp with white boundaries, no-data in grey. Graticule labels and ticks sit outside the neat-line on desks; the legend is a 12px ink-framed ramp bar with quiet/busy end labels. The hover tip is a white 1px-ink box.

### Badges and Notices
Elevated and extreme badges are small uppercase 80%-width labels on fire-ink or extreme with white text and a 2px radius. Caveats sit in the single notice box (notice paper, 1px notice line, square).

## Do's and Don'ts

### Do:
- **Do** reserve sea (#0f4c6e) for navigation, controls, links, focus and the "you are here" mark.
- **Do** reserve the yellow-to-brown ramp for data marks and their legends.
- **Do** draw the current year in bold ink on every chart (3px line, 800-weight label).
- **Do** frame content in 1px ink neat-lines and separate figure rows with a 2px ink rule above and a 1px ink rule below.
- **Do** set every number in tabular numerals, and every label in Archivo at 75% width, uppercase, 0.08em tracking.
- **Do** place ticks and graticule labels outside the frame, as a map collar does.
- **Do** build hierarchy from type size and rules; keep sections apart with space and a headline.

### Don't:
- **Don't** use shadows, tinted cards or rounded containers on content; a 2px radius is for controls only.
- **Don't** use sea-blue to encode data, or fire colours on buttons, headings or decoration.
- **Don't** introduce a second typeface; use Archivo's width axis instead.
- **Don't** use an alarmist register: no red glows, flashing marks, dark "war room" grounds or warning chrome beyond the single notice box.
- **Don't** add the generic SaaS dashboard look (KPI cards with icons, gradient headers, pill buttons).
- **Don't** add decoration that slows phone scanning or adds load.
- **Don't** present KalaApi's sheet index as an official BPS code; it is disclosed as KalaApi's own alphabetical index.
