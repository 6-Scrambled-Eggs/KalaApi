"""Step 20 (PRD v4.1 D'): do our yearly fire-days per province rank years like official burned hectares (SIPONGI KEMENHUT)?
Input: validation/sipongi_province_ha_2018_2026.csv (not committed). Years 2018-2024 only (2025 looks incomplete, 2026 is partial).
Fire-days per province-year = sum of 52 weekly h values in public/data/areas/<id>.json. Official hectares are a soft target (Gaveau et al. 2021)."""
import csv, json, os
import numpy as np
from pathlib import Path
R = Path(__file__).resolve().parent.parent
D = Path(os.environ.get("KALAAPI_DATA_DIR", R.parent / "DATA_kalaapi"))
YS = list(range(2018, 2025))
slug = lambda s: s.lower().replace(" ", "-")
GROUP = {"Papua*": ["Papua", "Papua Selatan", "Papua Tengah", "Papua Pegunungan"], "Papua Barat*": ["Papua Barat", "Papua Barat Daya"]}
rows = {r["provinsi"]: r for r in csv.DictReader(open(D / "validation/sipongi_province_ha_2018_2026.csv", encoding="utf-8-sig"))}
rows["DI Yogyakarta"] = rows.pop("Yogyakarta")
def ha_of(names): return [sum(float(rows[n][f"ha_{y}"]) for n in names) for y in YS]
def fd_of(ids):
    out = np.zeros(len(YS))
    for i in ids:
        d = json.load(open(R / f"public/data/areas/{i}.json")); W = d["weeks_per_year"]
        for k, y in enumerate(YS):
            s = (y - d["start_year"]) * W
            out[k] += sum(x or 0 for x in d["h"][s:s + W])
    return out
units = {}
used = {n for g in GROUP.values() for n in g}
for n in rows:
    if n not in used: units[n] = ([n], [slug(n)])
for g, names in GROUP.items(): units[g] = (names, [slug(n) for n in names])
rk = lambda v: np.argsort(np.argsort(v)).astype(float)
def _rank(v):
    v = np.asarray(v, float); o = np.argsort(v, kind="stable"); r = np.empty(len(v)); r[o] = np.arange(len(v))
    for x in np.unique(v): r[v == x] = r[v == x].mean()
    return r
pearsonr = lambda a, b: (float(np.corrcoef(a, b)[0, 1]),)
spearmanr = lambda a, b: (float(np.corrcoef(_rank(a), _rank(b))[0, 1]),)
HA, FD = {}, {}
for u, (names, ids) in units.items(): HA[u] = np.array(ha_of(names)); FD[u] = fd_of(ids)
px, py, pu = [], [], []
for u in units:
    for k in range(len(YS)):
        if HA[u][k] > 0 and FD[u][k] > 0: px.append(np.log10(FD[u][k])); py.append(np.log10(HA[u][k])); pu.append(u)
px, py = np.array(px), np.array(py)
pooled_r = float(pearsonr(px, py)[0]); pooled_rho = float(spearmanr(px, py)[0])
per = {}
for u in units:
    m = (HA[u] > 0) & (FD[u] > 0)
    if m.sum() >= 5 and np.std(FD[u][m]) > 0 and np.std(HA[u][m]) > 0: per[u] = float(spearmanr(FD[u][m], HA[u][m])[0])
rhos = np.array(list(per.values()))
ax, ay = [], []
for u in per:
    m = (HA[u] > 0) & (FD[u] > 0); lx, ly = np.log10(FD[u][m]), np.log10(HA[u][m]); ax += list(lx - lx.mean()); ay += list(ly - ly.mean())
anom_r = float(pearsonr(ax, ay)[0])
nat_fd = sum(FD[u] for u in units); nat_ha = sum(HA[u] for u in units)
top = sorted(units, key=lambda u: -HA[u].sum())[:10]
out = dict(source="SIPONGI KEMENHUT", years=YS, n_units=len(units), pooled_n=len(px), pooled_pearson_log=round(pooled_r, 3), pooled_spearman=round(pooled_rho, 3),
  within=dict(n_units=len(per), median_rho=round(float(np.median(rhos)), 2), n_pos=int((rhos > 0).sum()), n_ge_07=int((rhos >= 0.7).sum()), rho={u: round(v, 2) for u, v in sorted(per.items(), key=lambda t: -t[1])}),
  anomaly_pearson=round(anom_r, 3), anomaly_n=len(ax), national=dict(spearman=round(float(spearmanr(nat_fd, nat_ha)[0]), 2), pearson=round(float(pearsonr(nat_fd, nat_ha)[0]), 2)),
  top10={u: dict(rho=round(per[u], 2) if u in per else None, ha_total=round(float(HA[u].sum()))) for u in top})
json.dump(out, open(R / "public/data/validation_ha_province.json", "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "within"}, indent=1)); print({k: v for k, v in out["within"].items() if k != "rho"}); print(out["within"]["rho"])
