"""Step 19 (PRD v4.1 E1): is the activity-dependent fit (V = alpha * M^b) better than one fixed ratio per stratum (b = 1)?
Same code path as holdout V-1 (train without 2019 and 2023, predict them) and reverse test V-6 (train 2018-2026, predict 2012-2017),
same strata, same THIN. Run (a) published model, (b) b fixed at 1.0. Writes public/data/fixed_vs_power.json.
Run from pipeline/:  KALAAPI_DATA_DIR=... python 19_fixed_vs_power.py"""
import json
import numpy as np
import harmonize_lib as H
from config import REPO
from harmonize_lib import WPY, Y0, area_groups, build, calibrate_power

D = build(); groups = area_groups(D)
B_ORIG = H.B_GRID.copy()
slots = np.arange(D.S0, D.LAST + 1); yrs_all = slots // WPY + Y0

def run(train, test_years, fixed):
    H.B_GRID = np.array([1.0]) if fixed else B_ORIG
    b, alpha = calibrate_power(D, train)
    test = np.array([s for s in slots if (s // WPY + Y0) in test_years]); yrs = test // WPY + Y0
    rows = []
    for aid, name, _, idx in groups["province"]:
        obs = D.fd["snpp"][idx][:, test].sum(0)
        if obs.sum() < 200: continue
        pred = H.backcast(D, b, alpha)[idx][:, test].sum(0)
        o = np.array([obs[yrs == y].sum() for y in test_years]); p = np.array([pred[yrs == y].sum() for y in test_years])
        rows.append((name, o, p))
    allobs = D.fd["snpp"][:, test].sum(0); allpred = H.backcast(D, b, alpha)[:, test].sum(0)
    nat = {int(y): float(100 * (allpred[yrs == y].sum() - allobs[yrs == y].sum()) / allobs[yrs == y].sum()) for y in test_years}
    big = [(n, o, p) for n, o, p in rows if o.mean() >= 500]
    err = np.concatenate([100 * (p - o) / np.maximum(o, 1) for n, o, p in big])
    busy = np.concatenate([o > np.median(o) for n, o, p in big]); 
    # quiet/busy: below / above each province's median annual fire-days over the test years
    ae = np.abs(err)
    return dict(b=b, national_err_pct={k: round(v, 1) for k, v in nat.items()}, n_province_years=int(len(err)),
        share_within_20=round(float(np.mean(ae <= 20)), 3), median_abs_err=round(float(np.median(ae)), 1),
        quiet=dict(n=int((~busy).sum()), median_abs_err=round(float(np.median(ae[~busy])), 1), share_within_20=round(float(np.mean(ae[~busy] <= 20)), 3)),
        busy=dict(n=int(busy.sum()), median_abs_err=round(float(np.median(ae[busy])), 1), share_within_20=round(float(np.mean(ae[busy] <= 20)), 3)))

tests = {"V1_holdout_2019_2023": (slots[~np.isin(yrs_all, [2019, 2023])], [2019, 2023]),
         "V6_reverse_2012_2017": (slots[yrs_all >= 2018], list(range(2012, 2018)))}
out = {}
for t, (tr, ty) in tests.items():
    out[t] = dict(published=run(tr, ty, False), fixed_ratio=run(tr, ty, True))
    for m in ("published", "fixed_ratio"):
        r = out[t][m]; print(f"{t:24s} {m:12s} b={r['b']:.3f} nat={r['national_err_pct']} within20={100*r['share_within_20']:.0f}% medAbs={r['median_abs_err']} "
              f"quiet medAbs={r['quiet']['median_abs_err']} (within20 {100*r['quiet']['share_within_20']:.0f}%, n={r['quiet']['n']}) busy medAbs={r['busy']['median_abs_err']} (within20 {100*r['busy']['share_within_20']:.0f}%, n={r['busy']['n']})")
(REPO / "public/data/fixed_vs_power.json").write_text(json.dumps(out, indent=1))
