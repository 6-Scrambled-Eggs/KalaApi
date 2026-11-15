"""Step 16: can NOAA-20 VIIRS stand in for S-NPP VIIRS after 2 Nov 2026? (bridge test, not shipped to the app)

Compares daytime fire-days of NOAA-20 and S-NPP on their overlap (full years 2019-2025). Model: per province,
S-NPP = alpha * N20^b on weekly sums (b shared). Leave-one-year-out: calibrate on six years, predict the seventh.
Ship rule (PRD): national annual error <= 10% and >= 70% of province-years within +-20%.
Writes public/data/bridge_test.json.
Run:  python pipeline/16_noaa20_bridge_test.py
"""
import json

import numpy as np
import pandas as pd

from config import OUT_DIR, REPO

YEARS = list(range(2019, 2026))


def main():
    cd = pd.read_parquet(OUT_DIR / "cell_days.parquet")
    cells = pd.read_parquet(OUT_DIR / "cells.parquet")[["cx", "cy", "prov"]]
    cd = cd[(cd["daynight"] == "D") & cd["sensor"].astype(str).isin(["snpp", "noaa20"])]
    cd = cd[(cd["date"] >= "2019-01-01") & (cd["date"] < "2026-01-01")].merge(cells, on=["cx", "cy"])
    cd["sensor"] = cd["sensor"].astype(str)
    cd["year"] = cd["date"].dt.year
    cd["slot"] = np.minimum((cd["date"].dt.dayofyear - 1) // 7, 51)
    g = cd.groupby(["prov", "sensor", "year", "slot"]).size().unstack("sensor", fill_value=0).reset_index()
    provs = sorted(g["prov"].unique())
    rows = []
    for y in YEARS:
        tr, te = g[g["year"] != y], g[g["year"] == y]
        # shared exponent b from a coarse grid on training weekly sums (Poisson deviance); alpha per province
        best = None
        for b in np.arange(0.80, 1.201, 0.025):
            dev = 0.0
            al = {}
            for p, s in tr.groupby("prov"):
                x, v = s["noaa20"].to_numpy(float), s["snpp"].to_numpy(float)
                if v.sum() < 50 or x.sum() < 50:
                    continue
                a = v.sum() / np.maximum((x ** b).sum(), 1e-9)
                mu = np.maximum(a * x ** b, 1e-9)
                dev += 2 * (np.where(v > 0, v * np.log(np.maximum(v, 1e-9) / mu), 0) - (v - mu)).sum()
                al[p] = a
            if best is None or dev < best[0]:
                best = (dev, b, al)
        _, b, al = best
        for p in provs:
            s = te[te["prov"] == p]
            if p not in al or s["snpp"].sum() < 100:
                continue
            pred = (al[p] * s["noaa20"].to_numpy(float) ** b).sum()
            obs = float(s["snpp"].sum())
            rows.append(dict(year=y, prov=p, obs=obs, pred=float(pred), err=100 * (pred / obs - 1), raw_err=100 * (float(s["noaa20"].sum()) / obs - 1)))
    r = pd.DataFrame(rows)
    nat = r.groupby("year")[["obs", "pred"]].sum()
    nat_err = (100 * (nat["pred"] / nat["obs"] - 1)).round(1)
    raw_nat = (100 * (g.groupby("year")["noaa20"].sum() / g.groupby("year")["snpp"].sum() - 1)).round(1)
    share20 = float((r["err"].abs() <= 20).mean())
    out = dict(years=YEARS, n_province_years=int(len(r)), national_err_pct={int(k): float(v) for k, v in nat_err.items()},
               national_err_raw_n20_pct={int(k): float(v) for k, v in raw_nat.items()},
               share_within_20pct=round(share20, 3), max_abs_national_err=float(nat_err.abs().max()),
               shipped=bool(nat_err.abs().max() <= 10 and share20 >= 0.7))
    print(json.dumps(out, indent=1))
    (REPO / "public" / "data" / "bridge_test.json").write_text(json.dumps(out), encoding="utf-8")


if __name__ == "__main__":
    main()
