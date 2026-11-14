"""Step 6: validation (PRD: Validation and QA). Writes <repo>/public/data/validation.json.

 V-1 holdout            train without 2019 + 2023, predict them from Aqua MODIS (per province)
 V-6 reverse holdout    train 2018-2026, predict 2012-2017
 V-3 peat vs mineral    ratios with 90% intervals (only when a peat polygon file exists)
 V-4 drift check        ratio by year and stratum
 V-5 known events       Sep-Oct 2015 and 2019 in Kalimantan Tengah and Sumatera Selatan
 V-2 small areas        areas with < 50 fire-days a year
 V-7 MCD64A1 check      NOT RUN (needs MCD64A1 burned-area files from Earthdata)

Run:  python pipeline/06_validate.py
"""
import json

import numpy as np

from config import REPO
from harmonize_lib import WPY, Y0, area_groups, build, calibrate, periods

PUB = REPO / "public" / "data"


def predict(D, idx, k, slots):
    out = np.zeros(len(slots))
    sidx = D.sidx[idx]
    for s in np.unique(sidx):
        out += k[s] * D.meff[idx[sidx == s]][:, slots].sum(0)
    return out


def holdout(D, groups, train, test_years, label):
    test = np.array([s for s in range(D.S0, D.LAST + 1) if (s // WPY + Y0) in test_years])
    k = calibrate(D, train)
    rows = []
    for aid, name, _, idx in groups["province"]:
        obs = D.fd["snpp"][idx][:, test].sum(0)
        if obs.sum() < 200:
            continue
        pred = predict(D, idx, k, test)
        yrs = (test // WPY) + Y0
        errs = {int(y): float(100 * (pred[yrs == y].sum() - obs[yrs == y].sum()) / max(obs[yrs == y].sum(), 1))
                for y in test_years}
        r = float(np.corrcoef(pred, obs)[0, 1]) if obs.std() > 0 and pred.std() > 0 else None
        # onset and peak week difference (per test year)
        dd = []
        for y in test_years:
            o = np.full(WPY, 0.0)
            p = np.full(WPY, 0.0)
            m = yrs == y
            o[test[m] % WPY] = obs[m]
            p[test[m] % WPY] = pred[m]
            po, pp = periods(o, [Y0]) if False else (None, None)
            co, cp = np.cumsum(o) / max(o.sum(), 1), np.cumsum(p) / max(p.sum(), 1)
            if o.sum() > 0 and p.sum() > 0:
                dd.append([int(np.argmax(cp >= q) - np.argmax(co >= q)) for q in (0.1, 0.5)])
        rows.append(dict(province=name, annual_obs=float(obs.sum() / len(test_years)), err_pct=errs, weekly_r=r,
                         onset_peak_week_diff=np.median(np.abs(dd), axis=0).tolist() if dd else None))
    allobs = D.fd["snpp"][:, test].sum(0)
    allpred = predict(D, np.arange(len(D.combos)), k, test)
    yrs = (test // WPY) + Y0
    nat = {int(y): float(100 * (allpred[yrs == y].sum() - allobs[yrs == y].sum()) / allobs[yrs == y].sum())
           for y in test_years}
    big = [r for r in rows if r["annual_obs"] >= 500]
    within = [abs(e) <= 20 for r in big for e in r["err_pct"].values()]
    print(f"\n== {label}: national annual error % {({y: round(v, 1) for y, v in nat.items()})}")
    print(f"   provinces with >= 500 fire-days/yr: {len(big)}; share of province-years within +-20%: "
          f"{100 * np.mean(within):.0f}%")
    rs = [r["weekly_r"] for r in rows if r["weekly_r"] is not None]
    print(f"   median weekly r: {np.median(rs):.2f}")
    return dict(label=label, test_years=test_years, national_err_pct=nat, provinces=rows,
                share_within_20pct=float(np.mean(within)), median_weekly_r=float(np.median(rs)))


def main():
    D = build()
    groups = area_groups(D)
    out = {}
    tr_all = np.arange(D.S0, D.LAST + 1)
    yrs_all = (tr_all // WPY) + Y0
    out["V1_holdout"] = holdout(D, groups, tr_all[~np.isin(yrs_all, [2019, 2023])], [2019, 2023], "V-1 holdout 2019+2023")
    out["V6_reverse"] = holdout(D, groups, tr_all[yrs_all >= 2018], list(range(2012, 2018)),
                                "V-6 reverse: train 2018+, predict 2012-2017")

    # V-3 peat vs mineral
    k, kb = calibrate(D, tr_all, boot=1000)
    lo, hi = np.nanquantile(kb, [0.05, 0.95], axis=1)
    out["V3_strata_ratios"] = [dict(island=a, peat=b, k=float(k[i]), lo=float(lo[i]), hi=float(hi[i]))
                               for i, (a, b) in enumerate(D.strata)]
    out["V3_peat_available"] = D.peat_known
    if not D.peat_known:
        print("\nV-3 peat vs mineral: skipped (no peat polygon file).")

    # V-4 drift: ratio by year per stratum
    Ms = np.zeros((len(D.strata), 1342 + 1))
    drift = {}
    for i, (a, b) in enumerate(D.strata):
        m = D.sidx == i
        row = {}
        for y in range(2012, 2027):
            sl = np.array([s for s in tr_all if s // WPY + Y0 == y])
            mm, vv = D.fd["aqua"][m][:, sl].sum(), D.fd["snpp"][m][:, sl].sum()
            row[y] = round(float(vv / mm), 2) if mm > 0 else None
        drift[f"{a}/{b}"] = row
    out["V4_drift"] = drift
    print("\nV-4 drift (S-NPP/Aqua fire-day ratio by year), Sumatra and Kalimantan:")
    for key in drift:
        if key.startswith(("Sumatra", "Kalimantan")):
            print("  ", key, drift[key])

    # V-5 known events (from the exported anomaly files)
    ev = {}
    for pid in ["kalimantan-tengah", "sumatera-selatan"]:
        a = json.loads((PUB / "areas" / f"{pid}.json").read_text(encoding="utf-8"))
        p = np.array([np.nan if v is None else v for v in a["pct"]], float).reshape(-1, WPY)
        for y in (2015, 2019):
            w = p[y - Y0, 35:44]  # weeks 36-44 = Sep-Oct
            ev[f"{pid}-{y}"] = dict(weeks_36_44_pct=w.tolist(), max_pct=float(np.nanmax(w)),
                                    weeks_ge_90=int((w >= 90).sum()), weeks_ge_97_5=int((w >= 97.5).sum()))
    out["V5_known_events"] = ev
    print("\nV-5 known events (percentile in weeks 36-44):")
    for kk, v in ev.items():
        print(f"   {kk}: max {v['max_pct']:.0f}, weeks >=90: {v['weeks_ge_90']}/9, weeks >=97.5: {v['weeks_ge_97_5']}/9")

    idx = json.loads((PUB / "areas.json").read_text(encoding="utf-8"))
    out["V2_small_areas"] = dict(low_data_areas=sum(1 for i in idx if i["low_data"]), total_areas=len(idx))
    out["V7_burned_area"] = dict(status="not run", reason="needs MCD64A1 burned-area files (Earthdata login)")
    (PUB / "validation.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print("\nWrote", PUB / "validation.json")


if __name__ == "__main__":
    main()
