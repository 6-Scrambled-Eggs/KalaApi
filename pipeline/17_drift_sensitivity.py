"""Step 17 (Task B, PRD v4): does Aqua's orbit drift (later crossing time since mid-2021) bias the calibration?

Refits the back-cast model V = alpha_stratum * M^b with the SAME code path (calibrate_power), the same strata, the
same THIN = 500 rule and the same b grid, but with the overlap limited to 2012-2021, and compares it with the
published fit (overlap 2012-2026). It writes ONLY public/data/drift_sensitivity.json. It changes no model, no
published array and no validation file.
Run:  python pipeline/17_drift_sensitivity.py
"""
import json

import numpy as np
import pandas as pd

import harmonize_lib as H
from config import REPO
from harmonize_lib import NSLOT, WPY, Y0, area_groups, area_series, backcast, build, calibrate_power, percentile_rank, strata_sum

OUT = REPO / "public" / "data" / "drift_sensitivity.json"


def flags(pct):
    return np.where(pct >= 97.5, 2, np.where(pct >= 90, 1, 0))


def main():
    D = build()
    full = np.arange(D.S0, D.LAST + 1)
    yr = full // WPY + Y0
    early = full[yr <= 2021]
    b_f, a_f = calibrate_power(D, full)
    b_e, a_e = calibrate_power(D, early)
    print(f"b (grid step 0.025): 2012-2026 = {b_f:.3f}, 2012-2021 = {b_e:.3f}")
    old = H.B_GRID
    H.B_GRID = np.round(np.arange(0.80, 0.9501, 0.005), 3)
    bf2, _ = calibrate_power(D, full)
    be2, _ = calibrate_power(D, early)
    H.B_GRID = old
    print(f"b (fine grid, step 0.005): 2012-2026 = {bf2:.3f}, 2012-2021 = {be2:.3f}")

    vf, ve = backcast(D, b_f, a_f), backcast(D, b_e, a_e)
    pre = np.arange(NSLOT) < D.S0
    ys = np.arange(2001, 2012)
    sl = {y: np.arange((y - Y0) * WPY, (y - Y0 + 1) * WPY) for y in ys}
    nat_f = {y: float(vf[:, sl[y]].sum()) for y in ys}
    nat_e = {y: float(ve[:, sl[y]].sum()) for y in ys}
    per_year = {int(y): round(100 * (nat_e[y] / nat_f[y] - 1), 2) for y in ys}
    tot_f, tot_e = sum(nat_f.values()), sum(nat_e.values())
    overall = 100 * (tot_e / tot_f - 1)
    print(f"national back-cast 2001-2011: published fit {tot_f:,.0f}, 2012-2021 fit {tot_e:,.0f}, difference {overall:+.2f}%")
    print("per year (%):", per_year)

    # five provinces with the most observed S-NPP fire-days 2012-2025
    c = D.combos
    obs = pd.Series(D.fd["snpp"][:, D.S0 : D.LAST + 1].sum(1)).groupby(c["prov"].to_numpy()).sum().sort_values(ascending=False)
    top = list(obs.index[:5])
    prov_rows = []
    for p in top:
        idx = np.where(c["prov"].to_numpy() == p)[0]
        a = float(sum(vf[idx][:, sl[y]].sum() for y in ys)); e = float(sum(ve[idx][:, sl[y]].sum() for y in ys))
        prov_rows.append(dict(prov=p, published=round(a), alt_2012_2021=round(e), diff_pct=round(100 * (e / a - 1), 2)))
        print(f"  {p}: {a:,.0f} -> {e:,.0f} ({100 * (e / a - 1):+.2f}%)")

    # drift seen directly: national VIIRS / Aqua ratio, 2012-2021 vs 2022-2026
    Ms = strata_sum(D, D.fd["aqua"]).sum(0)
    Vs = strata_sum(D, D.fd["snpp"]).sum(0)
    def ratio(y0, y1):
        s = full[(full // WPY + Y0 >= y0) & (full // WPY + Y0 <= y1)]
        return float(Vs[s].sum() / Ms[s].sum()), int(Ms[s].sum()), int(Vs[s].sum())
    r1, m1, v1 = ratio(2012, 2021); r2, m2, v2 = ratio(2022, 2026)
    print(f"national VIIRS/Aqua fire-day ratio: 2012-2021 = {r1:.3f} (M {m1:,}, V {v1:,}); 2022-2026 = {r2:.3f} (M {m2:,}, V {v2:,})")
    # same comparison on the FIT scale: mean of weekly ratios (shows drift less dependent on fire size)
    wk = (Ms[full] > 0)
    def wmean(y0, y1):
        s = full[(full // WPY + Y0 >= y0) & (full // WPY + Y0 <= y1) & wk]
        return float(np.mean(Vs[s] / Ms[s]))
    print(f"mean of weekly ratios: 2012-2021 = {wmean(2012, 2021):.3f}; 2022-2026 = {wmean(2022, 2026):.3f}")

    # 2026 flags under both fits (nation and Central Kalimantan)
    groups = area_groups(D)
    nat_idx = groups["nation"][0][3]
    kt = next(idx for aid, nm, par, idx in groups["province"] if aid == "kalimantan-tengah")
    w26 = np.arange((2026 - Y0) * WPY, (2026 - Y0) * WPY + D.LAST - (2026 - Y0) * WPY + 1)
    base = list(range(2001, 2026))
    res = {}
    for nm, idx in (("national", nat_idx), ("kalimantan_tengah", kt)):
        out = {}
        for tag, v in (("published", vf), ("alt_2012_2021", ve)):
            h = area_series(D, idx, v)["h"]
            out[tag] = flags(np.nan_to_num(percentile_rank(h, base, D)))[w26]
        a, e = out["published"], out["alt_2012_2021"]
        res[nm] = dict(weeks=int(len(w26)), elevated_or_extreme_published=int((a >= 1).sum()), extreme_published=int((a == 2).sum()),
                       elevated_or_extreme_alt=int((e >= 1).sum()), extreme_alt=int((e == 2).sum()), weeks_with_changed_flag=int((a != e).sum()))
        print(nm, res[nm])

    out = dict(
        note="Sensitivity test only. The published model (b = 0.875, overlap 2012-2026) is unchanged.",
        overlap_published="2012-2026", overlap_alt="2012-2021", grid="0.80-1.20 step 0.025 (same as the published fit)",
        b=dict(published=round(float(b_f), 3), alt=round(float(b_e), 3), fine_grid_published=round(float(bf2), 3), fine_grid_alt=round(float(be2), 3)),
        backcast_2001_2011=dict(published=round(tot_f), alt=round(tot_e), diff_pct=round(float(overall), 2), per_year_diff_pct=per_year),
        top5_provinces=prov_rows,
        viirs_over_aqua=dict(ratio_2012_2021=round(r1, 4), ratio_2022_2026=round(r2, 4), change_pct=round(100 * (r2 / r1 - 1), 1)),
        flags_2026=res)
    OUT.write_text(json.dumps(out), encoding="utf-8")
    print("wrote", OUT.name)


if __name__ == "__main__":
    main()
