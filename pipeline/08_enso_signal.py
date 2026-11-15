"""Step 08: how strongly does each area's yearly fire activity follow El Nino?

Reads public/data/areas/*.json and public/data/oni.json (no raw data needed).
For each area: annual harmonized fire-days (complete years 2001-2025) against the
July-September ONI. Output: public/data/enso.json.

Method (kept simple on purpose, n = 25 years):
- Class per year: El Nino if ONI JAS >= 0.5, La Nina if <= -0.5, else neutral.
- rho = Spearman rank correlation of annual fire-days with ONI JAS.
- p = two-sided permutation p-value (5000 shuffles, fixed seed).
- q = Benjamini-Hochberg false-discovery-rate adjusted p across all areas (about 420 tests; areas are spatially
  correlated, so q is a guide, not a guarantee).
- label: "clear" if q < 0.05 and rho >= 0.4; "weak" if p < 0.15 and rho > 0 (and not clear);
  "none" otherwise; "reverse" if p < 0.15 and rho < 0.
This is exploratory. It is not a forecast and it is not a causal test.
"""
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"
WPY = 52
Y0, Y1 = 2001, 2025
N_PERM = 5000


def ranks(x):
    order = np.argsort(x, kind="mergesort")
    r = np.empty(len(x))
    r[order] = np.arange(len(x))
    # average ties
    for v in np.unique(x):
        idx = np.where(x == v)[0]
        if len(idx) > 1:
            r[idx] = r[idx].mean()
    return r


def spearman(a, b):
    ra, rb = ranks(a), ranks(b)
    if ra.std() == 0 or rb.std() == 0:
        return 0.0
    return float(np.corrcoef(ra, rb)[0, 1])


def main():
    oni = json.loads((DATA / "oni.json").read_text())["jas"]
    years = [y for y in range(Y0, Y1 + 1) if str(y) in oni]
    o = np.array([oni[str(y)] for y in years])
    cls = np.where(o >= 0.5, "el", np.where(o <= -0.5, "la", "neu"))
    rng = np.random.default_rng(26)
    perms = np.array([rng.permutation(len(years)) for _ in range(N_PERM)])
    ro = ranks(o)
    ro_c = ro - ro.mean()
    ro_perm = ro_c[perms]  # N_PERM x n
    out = {"years": {"el": [y for y, c in zip(years, cls) if c == "el"],
                     "la": [y for y, c in zip(years, cls) if c == "la"],
                     "neu": [y for y, c in zip(years, cls) if c == "neu"]},
           "n_perm": N_PERM, "areas": {}}
    pend = []
    for f in sorted((DATA / "areas").glob("*.json")):
        a = json.loads(f.read_text())
        h = a["h"]
        start = a["start_year"]
        tot = []
        for y in years:
            row = h[(y - start) * WPY:(y - start + 1) * WPY]
            tot.append(sum(v for v in row if v is not None) if len(row) == WPY and all(v is not None for v in row) else np.nan)
        t = np.array(tot, dtype=float)
        if np.isnan(t).any() or t.sum() == 0:
            continue
        rt = ranks(t)
        rt_c = rt - rt.mean()
        denom = np.sqrt((rt_c ** 2).sum() * (ro_c ** 2).sum())
        rho = float((rt_c * ro_c).sum() / denom) if denom else 0.0
        null = (ro_perm @ rt_c) / denom if denom else np.zeros(N_PERM)
        p = float((np.abs(null) >= abs(rho) - 1e-12).mean())
        med = {k: float(np.median(t[cls == k])) if (cls == k).any() else None for k in ("el", "neu", "la")}
        pend.append((a["id"], rho, p, med))
    ps = np.array([x[2] for x in pend])
    order = np.argsort(ps)
    m = len(ps)
    q = np.empty(m)
    q[order] = np.minimum.accumulate((ps[order] * m / (np.arange(m) + 1))[::-1])[::-1]
    q = np.minimum(q, 1.0)
    for (aid, rho, p, med), qq in zip(pend, q):
        if qq < 0.05 and rho >= 0.4:
            label = "clear"
        elif p < 0.15 and rho > 0:
            label = "weak"
        elif p < 0.15 and rho < 0:
            label = "reverse"
        else:
            label = "none"
        ratio = (med["el"] / med["neu"]) if med["el"] and med["neu"] else None
        out["areas"][aid] = {"rho": round(rho, 2), "p": round(p, 3), "q": round(float(qq), 3), "label": label,
                             "med_el": round(med["el"]) if med["el"] is not None else None,
                             "med_neu": round(med["neu"]) if med["neu"] is not None else None,
                             "med_la": round(med["la"]) if med["la"] is not None else None,
                             "ratio_el_neu": round(ratio, 2) if ratio else None}
    (DATA / "enso.json").write_text(json.dumps(out, separators=(",", ":")))
    prov = {k: v for k, v in out["areas"].items() if k in ("indonesia", "papua-selatan", "kalimantan-barat", "kalimantan-tengah", "riau", "sumatera-selatan")}
    print("years el/la/neu:", {k: len(v) for k, v in out["years"].items()})
    for k, v in prov.items():
        print(k, v)
    from collections import Counter
    print(Counter(v["label"] for v in out["areas"].values()))


if __name__ == "__main__":
    main()
