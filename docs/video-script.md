# KalaApi: 30-second video script

Format: screen capture of the live app + voice-over (or text on screen). English subtitles are required.
Live app: https://6-scrambled-eggs.github.io/KalaApi/
Record at 1280x720 or larger, browser zoom 100%, language set to EN. Record the backup capture too (PRD: App QA).
**Confirm the team name** before you record. The text below uses "6 Scrambled Eggs" (the GitHub organization name).

| Sec | On screen | Voice-over / subtitle |
|---|---|---|
| 0-4 | Title card: team name + "Harmonization of MODIS and VIIRS Hot Spots" | "We are 6 Scrambled Eggs. Our challenge: harmonize MODIS and VIIRS hot spots." |
| 4-11 | Home page `#/`. Hold on the first two stat cards: **x6.5 raw counts** and **x1.2 harmonized**. | "In 2012, Indonesia's fire count jumped six and a half times. The fires did not. A new satellite sensor came in. Harmonized, the jump is only 1.2 times." |
| 11-14 | Title card: **KalaApi** + "One fire record for Indonesia" | "This is KalaApi. One fire record for Indonesia." |
| 14-22 | Open `#/area/kalimantan-barat`. Show the one-line summary under the title, then click the "Anomaly (percentile)" button: blue and orange calendar, 2026 row. | "Pick any province. See 25 years of burning on one calendar. Switch to anomaly view: orange weeks are busier than usual for that week of the year." |
| 22-27 | Back to home: scroll to "Provinces to watch" (Papua Selatan x5.6) and "This week's card". | "Which provinces need attention this week? KalaApi ranks them and makes a shareable card." |
| 27-30 | `#/brief/papua-selatan`, readiness window tile. | "And a one-page brief tells local agencies when to be ready. Open data, open method, every error shown." |

## Facts behind each line (all from the app data, week 43 of 2026)
- National fire-days, 2026 vs 2015, same weeks: 129,519 vs 171,995 (**75% of 2015**). FRP: 69%.
- Home page, 15 Nov (week 43): this year **x1.65 normal** (percentile 76), **x3.29 vs the last 10 years** (VIIRS only). Check these on screen before you record: they change when the data refreshes.
- Provinces to watch (week 43): Papua Selatan x5.61, Maluku x3.01, Kalimantan Timur x2.49.
- South Papua: 17,877 vs 15,484 (**115% of 2015**; about 4.5 times 2019).
- West Kalimantan: 17,656 vs 15,915 (**111% of 2015**). 2026 flagged weeks: 3-5, 12, 13 and 43.
- Central Kalimantan 66%, South Sumatra 42%, Riau 13% of 2015.
- Fire-days are heat detections. They are not burned area. Do not say "hectares" in the video.

## Checks before you record
1. Hard-refresh the site (Ctrl+Shift+R). Open each page once so it loads fast.
2. Say "x6.5" and "x1.2" only if the home page cards still show them (they did on 15 Nov).
3. If you add AI-made images or voice, add a watermark or caption "AI-generated". No NASA logo.
4. Add English subtitles (burn them in or upload an .srt file).
