# Lighthouse backlog (Sat 14 Nov 2026)

Goal: Performance / Accessibility / Best Practices / SEO = 100, Agentic Browsing 2/2.
Method: Lighthouse 13.6.0, mobile preset, simulated throttling, production build served with gzip on localhost.

| Measure | Before | After |
|---|---|---|
| Performance | 0.35 | 0.99 to 1.00 |
| Accessibility | 1.00 | 1.00 |
| Best Practices | 0.96 | 1.00 |
| SEO | 1.00 | 1.00 |
| Agentic Browsing | 0.52 | 1.00 (both applicable audits pass) |

Done
- [x] Layout shift 0.888 to 0.001: `main` min-height, hero card min-heights, real heading and skeleton shown before data loads, area search box always rendered.
- [x] Route code-splitting (React.lazy) and manual chunks for MapLibre and ECharts.
- [x] Map mounts only when near the viewport (`OnVisible`), which removed about 1.3 s of blocking time.
- [x] Source maps published (`build.sourcemap`).
- [x] Language button accessible name now contains its visible text ("ID"/"EN").
- [x] `live.json` placeholder step in the deploy workflow, so there is no 404 console error when the FIRMS live step is skipped.
- [x] `public/llms.txt` added.

Caveats
- Scores come from a local server, not GitHub Pages. Pages sets its own cache headers and CDN timing, so re-run Lighthouse on the live URL after deploy.
- Performance varies between 0.97 and 1.00 run to run (blocking time is the noisy metric).
- WebMCP, llms.txt and ard-schema audits show "not applicable", so Agentic Browsing counts the two applicable audits (accessibility tree and layout shift).
