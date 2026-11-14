"""Step 10: do our yearly national fire-days rank years like official burned hectares do?
Input: validation/sipongi_national_ha.csv (national burned area 2015-2025 as reproduced by GoodStats from SiPongi; a secondary copy,
the SiPongi page itself was not readable). Compares with the harmonized national series in public/data/areas/indonesia.json.
Prints Spearman rho with a 20,000-shuffle permutation p-value. Official hectares are a soft target: one study found 2019 official
area far below Sentinel-2 mapping (Gaveau et al. 2021)."""
import csv, json
import numpy as np
from pathlib import Path
R = Path(__file__).resolve().parent.parent
ha = {int(r["year"]): float(r["burned_ha"]) for r in csv.DictReader(open(R / "validation/sipongi_national_ha.csv"))}
d = json.load(open(R / "public/data/areas/indonesia.json")); h = d["h"]; W = d["weeks_per_year"]
ys = sorted(ha)
fd = np.array([sum(x or 0 for x in h[(y - d["start_year"]) * W:(y - d["start_year"]) * W + W]) for y in ys])
ha_v = np.array([ha[y] for y in ys])
rk = lambda v: np.argsort(np.argsort(v)).astype(float)
rho = float(np.corrcoef(rk(fd), rk(ha_v))[0, 1])
rng = np.random.default_rng(26)
p = float(np.mean([abs(np.corrcoef(rk(fd), rk(rng.permutation(ha_v)))[0, 1]) >= abs(rho) for _ in range(20000)]))
out = dict(years=ys, fire_days=[round(float(x)) for x in fd], burned_ha=[int(x) for x in ha_v], spearman_rho=round(rho, 2), p=round(p, 4), n=len(ys))
json.dump(out, open(R / "public/data/validation_ha.json", "w"))
print(out)
