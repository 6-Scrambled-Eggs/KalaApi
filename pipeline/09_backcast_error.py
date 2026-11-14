"""Step 09: how wrong is the back-cast? Compare k*M (chk) with observed VIIRS (v) per province-year, 2013-2025.
Reads public/data/areas/*.json. Prints the numbers quoted on the Method page. No raw data needed."""
import json
from pathlib import Path

import numpy as np

DATA = Path(__file__).resolve().parents[1] / "public" / "data"
idx = json.loads((DATA / "areas.json").read_text())
rows = []
for a in idx:
    if a["level"] != "province":
        continue
    d = json.loads((DATA / "areas" / f"{a['id']}.json").read_text())
    arr = lambda k: np.array([x if x is not None else np.nan for x in d[k]]).reshape(-1, 52)
    C, V = arr("chk"), arr("v")
    for y in range(2013, 2026):
        rows.append((a["id"], np.nansum(C[y - 2001]), np.nansum(V[y - 2001])))
R = np.array([(r[1], r[2]) for r in rows])
ok = R[:, 1] >= 300
rel = R[ok, 0] / R[ok, 1] - 1
print(f"province-years with VIIRS >= 300 fire-days: {ok.sum()} of {len(R)}")
print(f"median signed error {np.median(rel)*100:.1f}%, mean absolute {np.mean(abs(rel))*100:.1f}%")
for q in (50, 75, 90):
    print(f"{q}th percentile |error| = {np.percentile(abs(rel), q)*100:.0f}%")
by = {}
for pid, c, v in rows:
    by.setdefault(pid, []).append((c, v))
quiet, busy = [], []
for L in by.values():
    med = np.median([v for _, v in L])
    for c, v in L:
        if v >= 300:
            (quiet if v < med else busy).append(c / v - 1)
print(f"quiet years (below the province median): median error {np.median(quiet)*100:.1f}% (n={len(quiet)}); busy years {np.median(busy)*100:.1f}% (n={len(busy)})")
print("share within +-20%/30%/40%: " + " / ".join(f"{100*np.mean(abs(rel) <= t):.0f}%" for t in (0.2, 0.3, 0.4)))
