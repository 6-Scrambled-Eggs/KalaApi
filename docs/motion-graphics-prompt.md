# KalaApi: 30-second motion graphics showreel (prompt)

<role>
You are a senior motion designer and a creative coder. This film is your showreel piece: every second must show craft. Kinetic type, shape morphs, data that builds itself, a camera that never stops thinking. But the subject is a serious, true data product. The craft serves the story; it never decorates it.
</role>

<product>
KalaApi (live: https://6-scrambled-eggs.github.io/KalaApi/) turns 25 years of NASA MODIS and VIIRS active-fire hotspots into one comparable burning calendar for Indonesia: the nation, 38 provinces, 383 kabupaten, or any circle a user picks on the map.

The problem: Indonesia's satellite fire record breaks in 2012. When VIIRS starts, raw hotspot counts jump ×6.5, mostly because the new 375 m sensor sees more small fires than the 1 km MODIS sensor, not because more land burned. KalaApi counts fire-days (a 0.05° cell with at least one daytime detection) and converts pre-2012 MODIS records to VIIRS-equivalent values with a measured, activity-dependent fit, V = α·M^b (b = 0.875, per province and peat stratum). After harmonization the same jump is ×1.2.

A disaster officer (BPBD) sees in one screen when an area usually burns, whether this month is unusual against its 2001–2025 median, and downloads the data. S-NPP VIIRS ended on 2 Nov 2026 and MODIS retires in 2027, so a calibrated bridge matters now. Every error is measured and published on the Method page.

Hackathon: NASA Space Apps Challenge 2026, "Harmonization of MODIS and VIIRS Hot Spots". Team: 6 Scrambled Eggs (confirm).
</product>

<source_of_truth>
The repo is the reference for every colour, font, word and number. Read these before you design anything:
- `DESIGN.md` (design system "Lembar Peta": the app looks like a sheet of Indonesia's national map series, not a dashboard), `src/styles.css`, `PRODUCT.md`.
- `public/data/meta.json`, `public/data/areas/indonesia.json`, `public/data/areas/kalimantan-tengah.json`, `public/data/validation.json`, `public/data/provinces.geojson`, `public/data/areas.json`.
- `src/Calendar.tsx`, `src/MonthCalendar.tsx`, `src/CustomArea.tsx`, `src/HomeHero.tsx`, `src/i18n.ts` (exact UI wording), `docs/video-script.md`.

Data rule: every number, bar, grid cell and map shape in the film comes from these files. Never invent or smooth data. Facts read on 15 Nov 2026 (re-check before render):
- National harmonized fire-days per year (`h`, summed by year): 2006 192,606 · 2015 191,137 · 2016 46,481 · 2019 106,741 · 2023 88,756 · 2026 to week 43: 129,519.
- Raw national MODIS Aqua fire-days (`m`): 2015 49,752. Raw S-NPP (`v`) starts 2012.
- Typical season (Indonesia): onset week 20, peak week 35, end week 43.
- October 2026: Indonesia 32,443 fire-days vs median 13,982.5 (×2.32, percentile 80). Central Kalimantan 4,580 vs 1,422.2 (×3.22, percentile 80).
- Holdout check: hold out 2019 and 2023, national error +1.8% and +3.2%; 80–84% of province-years within ±20%; weekly r 0.90–0.95.
- Raw jump ×6.5, harmonized ×1.2 (as on the live home page).
- Data end: 2 Nov 2026 (end of S-NPP VIIRS).

Wording rules (judges are BRIN remote-sensing scientists):
- Hotspots are heat detections, not burned area. Never put "hectares" next to a KalaApi number.
- The 2.6 million ha (2015) figure is the official burned-area estimate, so it may appear only as context, labelled "official estimate". Use the 4.6 million (Landsat study) figure only if the team gives the citation.
- No forecasts. Nothing may sound like a prediction.
- No NASA logo or NASA worm. Write "NASA FIRMS data" in plain type only.
</source_of_truth>

<direction>
Look: "Lembar Peta" brought to life. A survey sheet that animates itself.
- Canvas: ground #f2f4ef, sheet #ffffff, hairlines #c5cdc8 / #dfe4dd, ink #16212b, sea #0f4c6e (the only "action" colour), fire ramp #fff7bc → #fec44f → #fe9929 → #d95f0e → #993404 → #4d1a02, extreme #7b241c. Colour carries meaning only: sea = you can act, fire ramp = fire data, bold ink = this year.
- Type: Archivo Variable only (load it from the repo's `node_modules/@fontsource-variable/archivo`, or the Archivo variable font file). Animate the `wdth` axis (75 → 112) and weight (400 → 800) as a motion tool: words compress, stretch and settle. Tabular figures for all numbers. Labels in caps, 0.08em tracking, wdth 75.
- Hierarchy from rules, not boxes: a 2px ink rule over a 1px hairline. Radius 2px or 0. Neat-lines, tick marks, graticule (lat/lon) lines and corner registration marks are the graphic language.
- Motion: critically damped or near-critically damped springs (overshoot ≤ 3%). Every element enters on a path that means something: bars grow from the baseline, grid cells fill in reading order, map outlines draw like a pen on a plotter. Nothing fades in from nowhere.
- One continuous film. No hard cuts. Every scene is born out of the last one: a number becomes a bar, the bars become the calendar rows, the calendar folds into the map, the map circle becomes the CSV file.
- Camera: one virtual 2D camera (translate, scale, slight rotation ≤ 2°) with its own springs. It pushes in on the detail that matters and pulls back to show context.
- Pacing: fast but legible. Each text line stays on screen long enough to read twice at normal speed (about 0.25 s per word minimum, never under 0.9 s per line).

Banned: dark "fire dashboard" look, glows, lens flares, fire or flame particles, smoke effects, gradients on UI chrome, drop shadows, bouncy easing, typewriter text, stock icons, 3D globe spins, alarmist red flashes, any template look, music.
</direction>

<structure>
Format: 1920×1080, 60 fps, exactly 30.00 s (1,800 frames). Times are seconds.

1. 0.00–2.50 · The problem (text only).
   - 0.00–1.10: "Indonesia's fire record" builds word by word, each word expanding from wdth 75 to 100. Below it a thin raw-count line runs left to right across a 2001–2026 axis.
   - 1.10–2.50: at the 2012 tick the line jumps up. The headline snaps to "jumps ×6.5 in 2012." A hairline crack splits the sheet vertically at 2012. Last line, smaller: "The fires didn't."
2. 2.50–5.00 · The fix and the name.
   - The ×6.5 counts down through the digits to ×1.2 (tabular, each digit rolls on its own spring). At the same time the pre-2012 part of the line rises (the back-cast) and the crack closes like a zipper.
   - The healed line folds into the KalaApi wordmark (wdth 112, weight 800). Tagline: "One fire record for Indonesia." Small caps label: "NASA Space Apps 2026 · MODIS + VIIRS".
3. 5.00–8.50 · How it works.
   - Two sensors side by side: MODIS 1 km footprints (large pale squares) and VIIRS 375 m footprints (many small dots) over the same fire. Labels "MODIS 1 km" and "VIIRS 375 m".
   - A 0.05° grid drops over both. Each cell with any detection fills once: "1 fire-day". Both sides now show the same count. Text: "Count fire-days, not dots."
   - The formula sets itself in type: "V = α · M^b", then "b = 0.875" slides in under b. Label: "Fit per province and peat stratum".
4. 8.50–14.00 · The calendar (hero shot).
   - The grid cells fly into rows and assemble the real Indonesia weekly calendar: 26 rows (2001–2026) × 52 weeks, filled with the fire ramp from `h`. Fill in reading order, row by row, with a 6 ms stagger per cell, so the film shows the data arriving.
   - Camera pushes in. The 2015 row (weeks 36–44) and the 2006 row darken last. A cursor hovers 2015 week 38; a tooltip shows the real value from the data.
   - Toggle "Weeks / Months" clicks to Months: 52 columns collapse into 12 with a liquid morph. The tile slides in: "October 2026 · 32,443 fire-days · median 13,983 · ×2.32 · percentile 80".
5. 14.00–18.00 · The map.
   - The calendar folds away into a map sheet: province outlines from `provinces.geojson` draw like a plotter pen, graticule ticks at the edges, sheet margin slides in from the left ("Sheet", "Source: NASA FIRMS · MODIS Aqua/Terra, VIIRS S-NPP", "Unit: fire-day").
   - Counters run: "1 nation · 38 provinces · 383 kabupaten".
   - Camera flies to Central Kalimantan. Its area fills with its October value. Tile: "×3.22 of October median".
6. 18.00–21.50 · Any area.
   - Cursor clicks near Palangka Raya (lat −2.2, lon 113.9). A circle grows; the cursor drags its edge to "50 km" (the radius label follows the drag). The mini calendar beside it updates while dragging; 2015 and 2019 stand out.
   - Cursor clicks "Download CSV". The circle collapses into a file chip that flies to the corner: `kalaapi_custom_-2.2_113.9_50km.csv`.
7. 21.50–25.00 · Trust.
   - A holdout chart: modelled vs observed for 2019 and 2023. Numbers set in: "+1.8%" and "+3.2%" national error, "80% of province-years within ±20%".
   - A ruled stamp lands (not a rubber-stamp texture, just a 2px ink frame that snaps in): "Every error published · Method page".
8. 25.00–27.50 · Why now.
   - A sensor timeline: Terra/Aqua MODIS 2000→, S-NPP VIIRS 2012→. The S-NPP bar stops with a tick: "2 Nov 2026 · S-NPP VIIRS ends". MODIS bar fades to a dashed line: "MODIS retires 2027". Text: "The bridge matters now."
9. 27.50–30.00 · End card.
   - Everything collapses into the wordmark. Under it: "6-scrambled-eggs.github.io/KalaApi", "Team 6 Scrambled Eggs", "Harmonization of MODIS and VIIRS Hot Spots". Small line: "Not an official product · NASA FIRMS data · made with AI assistance".
   - Hold the final frame still for the last 0.5 s, so a judge can read the URL.
</structure>

<sound_design>
No music. Sound design only: one sound per motion event, placed on the frame where the motion peaks. Silence between events is part of the design.
- Make every sound yourself in Python (numpy + scipy), so there are no licence questions. Or use only CC0 sources (for example freesound.org CC0) and list each file in a credits text file.
- Palette: dry, paper-and-instrument sounds. Pencil taps, paper slides, soft mechanical clicks, plotter pen scratch, low sine thumps. No whooshes from sound libraries, no risers, no cinematic booms.
- Event map (minimum):
  - Each word of the opening line: soft pencil tap, pitch rising a little per word.
  - The 2012 jump: one low thump (60–80 Hz, 120 ms decay). The crack: short dry paper tear.
  - ×6.5 → ×1.2 digit roll: fast mechanical counter ticks, slowing with the spring.
  - Crack closing: a reversed paper tear, then a soft click when it locks.
  - Wordmark: one clean low-mid "settle" tone (sine + a little noise, 300 ms).
  - Grid drop on the sensors: a light metallic tick; each cell fill: a tiny tick, pitch by position, mixed low so it reads as texture.
  - Calendar fill: a granular "rain" of ticks that follows the fill order, louder for darker cells.
  - Cursor hover and click: crisp UI click (2–4 kHz transient). Toggle: two-part click (down, up).
  - Weeks → Months morph: soft paper slide.
  - Map outlines: plotter pen scratch, gain follows pen speed.
  - Circle drag: a soft tonal hum whose pitch follows the radius. Radius label stop: tick.
  - CSV chip: short "pop" then a paper slide to the corner.
  - Stamp: one dull ink "thock".
  - S-NPP bar stop: a sine that drops a fifth and stops. MODIS dashed line: three faint ticks.
  - End card: the settle tone again, one octave lower. Then silence.
- Mix: mono-compatible stereo, pan sounds to the screen position of their element (±30% max). Loudness −16 LUFS integrated, true peak ≤ −1 dBTP. Output 48 kHz.
</sound_design>

<build>
1. One HTML file, 1920×1080. Every style is a pure function of time inside `seek(t)`: no CSS transitions, no timers, no state carried between frames.
2. Springs are closed-form step responses. A value that changes target many times is the sum of one spring per change, so it stays a pure function of time.
3. Pre-compute data in a Python step that reads the repo's `public/data` files and writes one `film-data.json` (yearly series, the 26×52 calendar, Central Kalimantan values, a simplified province GeoJSON, the holdout numbers). The HTML reads only this file.
4. Map: project the GeoJSON yourself (simple equirectangular for Indonesia is fine) and simplify it so the pen draw is smooth. Draw outlines with stroke-dashoffset computed from t.
5. Drags are direct manipulation: while the cursor is held, the radius comes from the cursor position. On release it springs to its rest value.
6. Cursor: a real path (cubic Bézier with ease in/out), small hesitation before each click, a 1-frame press scale on click. It must look like a person.
7. Render with Playwright: call `seek(t)` per frame, 4 subframes per frame blended with ffmpeg `tmix` for motion blur, encode H.264 (CRF 18, `-preset veryfast`, yuv420p, `+faststart`). Mux the sound track.
8. Before the full render, export one still per scene (9 frames) and a contact sheet. Check: legibility at 50% size, no text overlap, every number matches `film-data.json`, nothing outside a 5% safe margin.
9. Write a `timeline.json` of every event (t, element, sound) and generate the sound track from it, so picture and sound share one clock.
10. Also export a 30 s silent version and an `.srt` file with the on-screen lines (the submission needs English subtitles).
</build>

<gotchas>
- Never put `will-change` or a CSS scale on text that the camera scales: render text at final size and move the camera with transforms on a parent, or the type goes blurry.
- Text that swaps inside a morphing container needs its own enter and exit timing, or the old and new lines overlap.
- The calendar has 1,352 cells: draw it on one canvas, not 1,352 DOM nodes, or the render is slow.
- Rolling digits must be tabular, or the number jumps sideways.
- Fire ramp cells at low values are almost white on a white sheet: use a quantile scale for the film, the same way the app does, so quiet and busy weeks look different.
- Keep the fire ramp for fire data only. Never use orange for buttons or titles.
- Check the final frame: URL fully visible, no motion, no cursor.
</gotchas>

<start>
Ask me for:
1. Confirmed team name and whether to add Indonesian subtitles under the English lines.
2. Whether to keep the 2.6 million ha context line (and the citation for 4.6 million, if I want it).
3. 16:9 only, or also a 1:1 cut for social media.

Then show me the 9-scene beat sheet with exact times and one still per scene before you write the full build.
</start>
