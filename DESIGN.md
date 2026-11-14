---
name: KalaApi
description: Twenty-five years of MODIS and VIIRS hotspots as one fire calendar, set on the calm dark of nila-indigo cloth.
colors:
  sea: "#0d1324"
  head: "#0e1322"
  ground: "#121829"
  surface: "#1a2238"
  raised: "#222b45"
  active: "#2a3352"
  control: "#46517a"
  control-hover: "#56628f"
  axis: "#3b456a"
  grid: "#26304d"
  no-data: "#3b4060"
  wax-line: "rgba(241, 236, 225, .14)"
  wax-rule: "rgba(241, 236, 225, .08)"
  ink: "#f2f0eb"
  ink-body: "#e4e2dc"
  mute: "#a9adc0"
  faint: "#8e93aa"
  soga: "#c58b4b"
  soga-hi: "#d79d5d"
  soga-ink: "#1b1206"
  link: "#e0a96a"
  selection: "#5b4126"
  gold: "#f2b25c"
  coral: "#ff7a6b"
  sky: "#8fb8ff"
  fire-0: "#2a2230"
  fire-1: "#4d1a02"
  fire-2: "#993404"
  fire-3: "#d95f0e"
  fire-4: "#fe9929"
  fire-5: "#fec44f"
  fire-6: "#fff7bc"
  anomaly-hot: "#c2541a"
  enso-0: "#26304d"
  enso-1: "#3c5a96"
  enso-2: "#6f97dd"
  enso-3: "#d6e6ff"
  elevated-bg: "#3d2a1c"
  elevated-ink: "#ffc27a"
  notice-bg: "#2a2416"
  notice-line: "#5a4a24"
  notice-ink: "#f0c879"
  paper: "#ffffff"
  paper-raised: "#f0f0ee"
  paper-line: "#e4e4e1"
  paper-rule: "#ececea"
  paper-control: "#cfcfcb"
  paper-ink: "#18181b"
  paper-ink-body: "#27272a"
  paper-mute: "#55585c"
  paper-faint: "#6b6b6b"
  paper-accent: "#b03a12"
  paper-gold: "#993404"
  paper-neg: "#b42318"
  paper-good: "#1f5f8b"
typography:
  display:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "34px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title-sm:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
  lead:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"cv11\", \"ss01\""
  note:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  figure:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\""
  figure-hero:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "36px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\""
  chart:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "11.5px"
    fontWeight: 400
rounded:
  bar: "2px"
  sheet: "3px"
  chip: "4px"
  control: "6px"
  card: "8px"
  pill: "99px"
spacing:
  hairline: "1px"
  stack-sm: "8px"
  control-x: "16px"
  pad: "22px"
  gap: "24px"
  gutter: "28px"
  gutter-phone: "16px"
  column-gap: "36px"
  section: "44px"
  max-width: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.soga}"
    textColor: "{colors.soga-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.soga-hi}"
    textColor: "{colors.soga-ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  button-small:
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "32px"
  input-search:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px 0 36px"
    height: "36px"
  header:
    backgroundColor: "{colors.head}"
    textColor: "{colors.ink}"
    height: "60px"
  nav-link:
    textColor: "{colors.mute}"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.card}"
    padding: "{spacing.pad}"
  kpi-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    padding: "18px 22px 20px"
  kpi-cell-main:
    textColor: "{colors.gold}"
    typography: "{typography.figure-hero}"
  badge-elevated:
    backgroundColor: "{colors.elevated-bg}"
    textColor: "{colors.elevated-ink}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  badge-extreme:
    backgroundColor: "{colors.fire-4}"
    textColor: "{colors.soga-ink}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  notice:
    backgroundColor: "{colors.notice-bg}"
    textColor: "{colors.notice-ink}"
    rounded: "{rounded.card}"
    padding: "10px 16px"
  sheet-a4:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink-body}"
    rounded: "{rounded.sheet}"
    padding: "40px 44px"
    width: "794px"
---

# Design System: KalaApi

## Overview

**Creative North Star: "Indigo Batik"**

KalaApi sits on the calm dark of nila-indigo cloth. The ground is a deep indigo, panels are one dye-step lighter, and the header one step darker, so the whole screen reads as a single dyed fabric, not a stack of floating cards. Fire is the only bright thing on screen, and it lives in the data: the calendar cells, the map fill, the watch-list bars, the year-to-date figures. Everything else stays quiet so a judge on a projector and a BPBD officer at a desk both see the burn season first.

The batik gives the system its two other materials. Soga, the warm brown dye, is the one non-data warmth: it fills the primary action and draws a 2px underline under every selection. Wax-resist lines, cream at 8 to 14% alpha, carry all the structure (panel edges, table rules, the 1px gaps between KPI cells). The density is a working dashboard's: tabular figures, compact controls, many numbers per screen, held together by a single type family and a strict column.

The world was chosen by the user from the safer-register lineup after re-rolls, with the steer "keep the layout, darker theme". The layout of the earlier light build is kept; only the material changed. The confirmed anti-reference is the generic navy or black dashboard with a neon accent. The printed brief and card leave the cloth entirely and become white paper.

**Key Characteristics:**
- Indigo grounds in tonal steps; no shadows for structure.
- Fire hues appear only in data, ordered so hotter is brighter.
- Soga brown marks the primary action and every selection (2px underline).
- Wax-resist hairlines: cream at 8% (rules) and 14% (edges).
- El Niño speaks in cold indigo-to-sky, never fire.
- One family (Inter Variable), tabular figures everywhere numbers sit.
- The A4 brief and card re-scope the same tokens to white paper and print on one page.

## Colors

A dyed-cloth palette: indigo grounds, cream text, one soga warmth, and two data ramps (fire and cold sky) that carry all the brightness.

### Primary
- **Soga Brown** (`soga`): the primary button fill, the 2px underline under the current nav link, active data tab and pressed language button, the text caret, list markers in prose, the top edge of the share text, and the hover colour of watch-list and flag links. Its hover is **Lit Soga** (`soga-hi`); text on it is **Soga Night** (`soga-ink`).
- **Soga Link** (`link`): inline links, underlined at 45% of its own colour and full colour on hover.

### Secondary
- **Wax Gold** (`gold`): headline figures only: the main KPI value and the watch-list numbers. It reads as the soga's brighter thread on a number.
- **Sky** (`sky`): the harmonized series in charts, the "good" KPI (×1.2 harmonized step), La Niña ticks, and the keyboard focus ring.
- **Coral** (`coral`): the raw-count series and the "bad" KPI (×6.5 raw step), El Niño ticks, and errors.

### Tertiary (data ramps)
- **Fire ramp, dark order** (`fire-0` to `fire-6`): dim plum-rust through rust, orange and amber to pale yellow. The same hues as the light-ground ramp, reversed in lightness so the hottest week is the brightest cell. The map uses `fire-1` at 0, `fire-3` at 50, `fire-4` at 90 and `fire-6` at 100th percentile; the count calendar runs the full seven steps.
- **Anomaly ramp**: a diverging calendar from `sky` (quietest) through `enso-1` and `raised` (typical) to `anomaly-hot` and `fire-5` (busiest).
- **El Niño ramp** (`enso-0` to `enso-3`): cold indigo to pale sky for the strength of the fire-to-ENSO link (ρ 0 to 0.9).
- **Elevated badge** (`elevated-bg` / `elevated-ink`): a dim amber pair for weeks at the 90th percentile; the extreme badge (97.5th) is the bright `fire-4` with `soga-ink` text.

### Neutral
- **Deep Sea** (`sea`): the map background and province outlines.
- **Night Header** (`head`): the sticky header and the chart tooltip ground.
- **Nila Ground** (`ground`): the page and the search field.
- **Dyed Panel** (`surface`): every container: panels, KPI cells, tables, calendar and chart boxes, watch list.
- **Raised Thread** (`raised`), **Active Thread** (`active`): hover fills, inline code, small bar tracks, neutral pills.
- **Control Indigo** (`control`), **Control Hover** (`control-hover`): outlines of buttons, selects and the search field.
- **Axis** (`axis`), **Grid** (`grid`), **No Data** (`no-data`): chart axes and scrollbar thumb, chart split lines, areas without data.
- **Wax Line** (`wax-line`), **Wax Rule** (`wax-rule`): structural edges and the lighter row rules.
- **Wax Cream** (`ink`): headings, figures, active labels. **Cream Body** (`ink-body`): running text. **Indigo Grey** (`mute`): secondary text, axis labels. **Faint** (`faint`): stamps, ranks, placeholders, footer.
- **Notice trio** (`notice-bg`, `notice-line`, `notice-ink`): warnings and notices, a muted amber status colour, not an accent.
- **Paper set** (`paper` to `paper-good`): the A4 re-scope; see the Paper Re-scope Rule.

### Named Rules
**The Fire Lives in the Data Rule.** Fire hues (`fire-1` to `fire-6`, `anomaly-hot`) appear only where they encode fire activity: calendar cells, map fill, watch-list bars, the extreme badge, fire series in charts. The single exception is the brand flame mark. Chrome never borrows a fire hue.

**The Hotter Is Brighter Rule.** On the indigo ground every sequential fire scale runs dim (`fire-1`) to bright (`fire-6`). Never paste the light-ground order onto a dark surface.

**The One Warmth Rule.** Soga is the only warm colour in interactive chrome. Selection is always a 2px soga underline, never a fill, a pill or a second accent.

**The Wax-Resist Rule.** Structure is drawn with cream hairlines: `wax-line` for container edges and dividers, `wax-rule` for rows inside them. No solid grey lines, no shadows doing structural work.

**The Cold El Niño Rule.** The ENSO link is drawn in `enso-0` to `enso-3`. A climate driver must never be coloured like fire, or a reader takes the map for burn activity.

**The Labelled Colour Rule.** Every colour encoding carries words: legends have numbered ticks and low/high captions, badges say "elevated" or "extreme", flags print their percentile.

## Typography

**Display Font:** Inter Variable (with "Inter Fallback", a metric-matched Arial, then system-ui)
**Body Font:** Inter Variable (same stack)
**Label/Mono Font:** none distinct; numbers use the same family with tabular figures.

**Character:** One neutral grotesque doing every job, with hierarchy carried by weight (400, 500, 550, 600, 650) and tight negative tracking on large sizes. It stays out of the way so the data can be the loud thing. Body text sets `cv11` and `ss01` for a cleaner single-storey a and open digits. Inter is self-hosted (latin and greek subsets only; greek covers the ρ), and the fallback is resized to Inter's metrics so the font swap does not shift layout.

### Hierarchy
- **Display** (650, 34px, 1.15, -0.02em): the home title and the area name.
- **Headline** (650, 30px, 1.15, -0.02em): page titles on other routes.
- **Title** (550, 20px, 1.3, -0.01em): section heads (44px above, 8px below).
- **Title small** (600, 15px, 1.35): sub-section heads and story-card titles.
- **Lead** (400, 17px, 1.55): the intro under a title, in `mute`, at most 66ch.
- **Body** (400, 15px, 1.55): running text in `ink-body`. Prose blocks cap at 78ch; notes (13.5px) at 110ch.
- **Label** (500, 13px): KPI keys, nav (14px), tabs (13.5px), table heads (12.5px).
- **Figure** (650, 30px, 1.1, -0.02em, tabular): KPI values; **Figure hero** (36px) for the main KPI in `gold` and the home strip.
- **Chart** (400, 11.5px): axis and name labels; tooltips 12.5px; legends 12px.

On phones (≤700px) h1 drops to 25px, h2 to 18px, figures to 25px (main 29px). The A4 sheet sets h1 24px and h2 17px on screen; print compresses the brief to 11.5px body.

### Named Rules
**The One Family Rule.** Inter Variable sets everything, including chart canvas text. Hierarchy comes from weight and size, never from a second face.

**The Tabular Figures Rule.** Every number that can sit beside another number (KPIs, tables, watch list, legends, tooltips) uses tabular figures, so columns of weeks and percentiles line up.

## Layout

One column for header, main and footer: 1200px content plus a 28px gutter each side (16px on phones). The header is sticky at 60px minimum on wide screens and static on phones. Main has 40px top and 88px bottom padding.

The home page is a 2:1 grid (`minmax(0, 2fr)` map, `minmax(300px, 1fr)` watch list) with 36px between columns. Area and other routes use the same split in three forms: 2:1, 1:2 and 1:1. Sections open 44 to 48px apart; panels pad 22px; grids gap 24px. KPI strips are 2, 3 or 4 equal cells. The map is 480px tall (360px on phones); the calendar keeps a 720px minimum and scrolls sideways inside its panel.

Breakpoints:
- **≤1100px:** the nav wraps to its own full-width, horizontally scrolling row under the brand and search.
- **≤1023px:** every split collapses to one column; on home the ranked watch list comes before the map; 4-cell KPI strips become 2-up.
- **≤700px:** gutter and panel padding drop to 16px; the header becomes a grid (brand and EN · ID on row one, nav on row two with short labels, search on row three at 42px with 16px text); KPI strips are 2-up with an odd last cell spanning; home CTAs become a 2×2 grid of 44px-minimum buttons; tab and action rows scroll with a fade mask at the right edge.

The A4 sheet is 794px wide, centred, with 40px by 44px padding (22px by 18px on phones). In print it loses padding and radius, uses 16mm page margins, and the brief must fit one page.

Motion is minimal: colour, border and background transitions at 120ms, a 1px press-down on buttons (80ms), a 150ms disclosure-arrow rotation. `prefers-reduced-motion` removes all transitions.

## Elevation & Depth

The system is flat cloth. Depth comes from tonal steps of indigo, not from shadows: `head` (darkest) sits above `ground`, containers are one step lighter in `surface`, and hover or nested fills go to `raised` and `active`. Edges are wax-resist hairlines. The map controls had their default shadow removed. The one shadow in the system is the chart tooltip, which floats over a canvas and needs to separate from data cells.

### Shadow Vocabulary
- **Tooltip lift** (`box-shadow: 0 8px 24px rgba(0,0,0,.25)`): ECharts tooltips only, on `head` with an `axis` border and 6px radius.

### Named Rules
**The Flat Cloth Rule.** Surfaces never cast shadows. A surface that needs to stand forward gets a lighter indigo step and a wax line.

## Shapes

Gently rounded, never soft: 8px on containers (panels, KPI strips, tables, map, calendar), 6px on controls (buttons, selects, search, tooltips), 4px on inline code, 2px on legend bars and watch-list bar tracks, and full pills (99px) only for badges and status pills. The A4 sheet has a near-square 3px corner and none in print.

Grouped cells share one rounded container and are split by 1px gaps that let the container's `wax-line` colour show through (KPI strips, story cards), so a strip reads as one piece of cloth divided by wax lines, not as separate cards.

## Components

### Buttons
Compact and plain: a working tool, not a marketing call to action.
- **Shape:** gently rounded (6px), 36px tall, 16px side padding; small variant 32px tall, 13px padding, 13.5px text.
- **Primary:** `soga` fill and border, `soga-ink` text, weight 600. Hover goes to `soga-hi`.
- **Secondary (default):** transparent with a 1px `control` outline, `ink` text, weight 500. Hover fills `raised` and lifts the outline to `control-hover`.
- **Press:** every button moves down 1px while pressed.
- **Focus:** 2px `sky` outline with a 2px offset, on every focusable element.
- Icons inside buttons are 15px inline SVG.

### Chips
- **Badges:** 22px pills, 12px weight-600 text. Elevated is the dim amber pair (`elevated-bg` / `elevated-ink`); extreme is bright `fire-4` with `soga-ink` text, the one loud badge.
- **ENSO pills:** "clear" `#2c3f6e` / `#cfe0ff`, "suggestive" `#25335a` / `#b3c8f2`, "weak" and "none" on `raised` in muted text. Cold blues only, per the Cold El Niño Rule.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** `surface` on the `ground`.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px `wax-line`; rows inside use `wax-rule`.
- **Internal Padding:** 22px (16px on phones); list rows 11 to 12px by 18px.
- **Notice:** `notice-bg` with a `notice-line` border and `notice-ink` text, 10px by 16px.
- **Share text:** a panel with a 2px `soga` top edge.

### Inputs / Fields
- **Search:** 36px tall (42px with 16px text on phones), `ground` fill so it sinks into the header, 1px `control` outline, 6px radius, a 15px magnifier in `faint` at the left, placeholder in `faint`, soga caret. Hover lifts the outline to `control-hover`.
- **Select:** same outline and height on `surface`, with an inline chevron in `mute`.
- **Focus:** the shared 2px `sky` ring.

### Navigation
- **Header:** `head` ground, `wax-line` bottom edge, sticky. Brand mark (30px) then "KalaApi" (17px, 700) over the tagline (12px, `mute`).
- **Links:** 14px weight 500 in `mute`; hover to `ink`. The current page is `ink` with a 2px `soga` underline that sits on the header's bottom edge.
- **Language toggle (EN · ID):** 13px weight 600 in `faint`; the pressed language is `ink` with the same 2px soga underline.
- **Data tabs:** 13.5px labels on a `wax-line` rule, 22px apart; the active tab gets a soga underline exactly as wide as its label.
- **Phone:** the nav becomes its own row with short labels and space-between spacing.

### Signature: the burn calendar
A weekly heatmap of 52 slots by year on `surface`, cells separated by 0.5px `surface` borders. The count view uses the seven-step dark fire ramp; the anomaly view uses the diverging sky-to-yellow ramp. Back-cast years carry a faint cream wash with an "estimate" label, the 2012 VIIRS start is a dashed `ink` line, and each year label has an ONI dot (coral El Niño, sky La Niña, grey neutral). Hover outlines a cell in `ink`.

### Signature: the watch list
A ranked list on `surface`: rank in `faint`, the area name in `ink` (soga on hover), the figure in bold `gold`, and a 3px `fire-4` bar on a `raised` track under each row.

### Signature: the flame mark
An amber flame (`fire-5`) on a rust square (`fire-2`, 7/32 corner radius). It is a fixed brand asset and the one place a fire hue appears outside the data.

### Signature: the A4 sheet
The brief and card re-scope the same token names to white paper inside the sheet: `paper` ground, `paper-ink` text, `paper-accent` rust for links and accents, `paper-gold` for the main figure. Charts inside a sheet switch to the paper chart theme automatically. On screen the sheet sits on the indigo ground as paper on cloth; in print it is the whole page, one A4 sheet, with the line "Not an official product".

### Named Rules
**The Soga Underline Rule.** Every "you are here" state (nav, data tabs, language) is a 2px soga underline under the label, and nothing else.

**The Paper Re-scope Rule.** Printed artefacts do not get their own palette names. They redefine the existing tokens inside the sheet, so a component written for the screen prints correctly on paper unchanged.

## Do's and Don'ts

### Do:
- **Do** build every surface from the indigo steps: `head` above `ground`, containers in `surface`, hovers in `raised`.
- **Do** run fire scales dim to bright on the dark ground (`fire-1` to `fire-6`), keeping the light ramp's hues.
- **Do** mark the primary action with a `soga` fill and every selection with a 2px `soga` underline.
- **Do** draw structure with wax-resist hairlines: `wax-line` (14%) for edges, `wax-rule` (8%) for rows.
- **Do** colour El Niño and other climate drivers in the cold `enso-0` to `enso-3` ramp.
- **Do** set every number in tabular figures and give every colour encoding a text label.
- **Do** keep the A4 brief and card on white paper by re-scoping tokens inside the sheet, and make the brief fit one A4 page.
- **Do** use the 2px `sky` focus ring on every focusable element.

### Don't:
- **Don't** build a generic navy or black dashboard with a neon accent.
- **Don't** use a fire hue for chrome, buttons, headings or decoration; fire is data (the flame mark is the only exception).
- **Don't** add a second accent or mark selection with a fill or a pill.
- **Don't** use shadows to separate surfaces; the tooltip is the only shadow.
- **Don't** colour the El Niño link in fire hues.
- **Don't** add a second typeface, including in chart canvases.
- **Don't** print the brief or card on the dark theme.
