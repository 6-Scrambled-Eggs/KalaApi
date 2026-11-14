"""Step 12: do the weekly flags depend on the back-cast? Compare percentiles on the full 2001-2025 baseline (pct) with the
observed-VIIRS-only 2012-2025 baseline (pct12), for provinces and the nation (low-data areas excluded), weeks from 2012 on.
Writes public/data/flag_check.json."""
import glob, json
import numpy as np
from pathlib import Path
R = Path(__file__).resolve().parent.parent
idx = {a["id"]: a for a in json.load(open(R / "public/data/areas.json"))}
X, Y = [], []
for fp in glob.glob(str(R / "public/data/areas/*.json")):
    a = json.load(open(fp)); m = idx[a["id"]]
    if m["level"] == "kabupaten" or m["low_data"]: continue
    sy = a["start_year"]
    for i, (x, y) in enumerate(zip(a["pct"], a["pct12"])):
        if x is None or y is None or sy + i // 52 < 2012: continue
        X.append(x); Y.append(y)
X = np.array(X); Y = np.array(Y)
rk = lambda v: np.argsort(np.argsort(v)).astype(float)
out = dict(n_weeks=int(len(X)), spearman=round(float(np.corrcoef(rk(X), rk(Y))[0, 1]), 2),
           elevated_n=int((X >= 90).sum()), elevated_ge80=round(float((Y[X >= 90] >= 80).mean()), 3),
           extreme_n=int((X >= 97.5).sum()), extreme_ge90=round(float((Y[X >= 97.5] >= 90).mean()), 3))
json.dump(out, open(R / "public/data/flag_check.json", "w")); print(out)
