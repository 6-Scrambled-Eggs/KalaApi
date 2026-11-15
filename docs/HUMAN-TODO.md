# Human to-do list (things only a person can do)

Deadline: submit by 22:00 WIB (hard stop 23:59 WIB), Sun 15 Nov 2026. Code freeze 21:00 WIB.

| # | Task | Who | Done |
|---|------|-----|------|
| H-1 | Record a 30 s video after the last site change. English subtitles. Public link (YouTube unlisted or Drive "anyone with link"). Script: `docs/video-script.md`. | video owner | [ ] |
| H-2 | Do not use the 202,004 ha / +69% SiPongi claim unless a team member confirms it on SiPongi+ today. Kompas is a secondary report. For BRIN say only: "BRIN's hotspot system mainly uses VIIRS on S-NPP and NOAA-20". | anyone | [ ] |
| H-3 | One real user quote (BPBD, peat NGO, lecturer). Never invent one. If none, write "not yet tested with users". | anyone | [ ] |
| H-4 | (Optional) NOAA-20 archive from FIRMS for the S-NPP bridge. | data owner | [ ] |
| H-5 | SiPongi province burned-area table (luas kebakaran per provinsi per tahun, 2015-2025) saved as `validation/sipongi_province.csv` (columns: province, year, hectares, source URL). The agent could not fetch a machine-readable table (the SiPongi site blocks robots; only 2026 snapshots appear in secondary reports). Needed for PRD v4 Task D. | anyone | [ ] |
| H-6 | Submission form: 6 members, demo link, project link, AI-use disclosure (who checked what), references, tick boxes. Click "Submit for Judging". Reopen in a private window to confirm. | team lead | [ ] |
| H-7 | Local registration form for the Bandung event. | team lead | [ ] |
| H-8 | After submit: `git tag v1.0-submission && git push --tags`. Change nothing on the site. | Aldebaran | [ ] |
| H-9 | 21 Nov pitch: 7 slides in English, Q&A bank in `docs/JUDGE-QA.md`. | all | [ ] |
| F8 | Form text (Details and Summary): add month calendar, "this month vs median", custom area with date range, monthly calendar and cell-level CSV, scientist Q&A, NOAA-20 bridge result (96% of province-years within +-20%, national error up to 12.5%, not merged). Remove "last 10 years", the "Right now" strip, "298 of 422" (now 288 pass q < 0.05). Summary: "convert pre-2012 MODIS to VIIRS-equivalent fire-days". NASA data line: "MODIS C6.1 (Terra, Aqua) and VIIRS S-NPP 375 m"; delete the FIRMS API line (the live strip is gone). Add Fu et al. 2020, Gaveau et al. 2021, the RRI article and requirements.txt to resources. | team + agent, 21:00-21:30 WIB | [ ] |

## Sentences for the project page (H4, only if the form still allows edits)
- "After S-NPP ended on 2 Nov 2026 we added a clearly marked provisional layer: NOAA-20 fire-days bridged to S-NPP. On the overlap week (27 Oct to 2 Nov) it was +3.1% against observed S-NPP nationally. It is not part of the calibrated record, the baseline or the validation."
- "We tested whether Aqua's orbit drift since 2021 biases the calibration: refitting on 2012-2021 gives the same exponent (b = 0.875) and changes the 2001-2011 back-cast by +2.9% nationally."
- "The custom-area page now offers a Box mode (two corners or W/S/E/N, up to 3 x 3 degrees) next to the circle."
