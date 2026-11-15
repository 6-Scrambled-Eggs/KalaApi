"""Step 18 (Task A, PRD v4): provisional NOAA-20 weeks after the S-NPP end (2 Nov 2026). ADDITIVE ONLY.

The calibrated series stops at the S-NPP end. This step bridges NOAA-20 daytime fire-days to S-NPP-equivalent
fire-days with the same kind of model as step 16: per province, weekly S-NPP = alpha * N20^b (b shared, Poisson fit).
The fit uses full weeks 2019 to week 42 of 2026 (ends 21 Oct 2026), so the overlap check week
(27 Oct to 2 Nov 2026) is out of sample. The result goes into a separate array `prov` in each area file and into
public/data/bridge.json. It is NOT written into h, lo, hi, the baseline, the percentiles, validation.json or the CSV.

Only full 7-day weeks (the app's slots) are shown, and only if every day has NOAA-20 data. A day counts as
missing when NOAA-20 has under 30% of the NOAA-21 rows of that day.

Run after 05 and 14:  python pipeline/18_provisional_noaa20.py
"""
import json

import numpy as np
import pandas as pd

from config import OUT_DIR, REPO
from harmonize_lib import Data, NRT_START, WPY, Y0, area_groups, drop_static_nrt, slot_of

PUB = REPO / "public" / "data"
FIT_FROM, FIT_TO = pd.Timestamp("2019-01-01"), pd.Timestamp("2026-10-21")   # full weeks, ends before the check week
CHECK = (pd.Timestamp("2026-10-27"), pd.Timestamp("2026-11-02"))              # S-NPP and NOAA-20 both observed
WEEK = 44                                                                       # first slot after the last complete one (43)
W_FROM, W_TO = pd.Timestamp("2026-10-29"), pd.Timestamp("2026-11-04")          # 7 days of slot 44 (doy 302-308)
MAX_DIFF = 25.0  # PRD: revert if the national overlap difference is above this (percent)


def fit(g, provs):
    """Shared b on a grid; alpha per province (Poisson). g: prov, slot, snpp, noaa20 weekly sums."""
    best = None
    for b in np.arange(0.80, 1.201, 0.025):
        dev, al = 0.0, {}
        for p, s in g.groupby("prov"):
            x, v = s["noaa20"].to_numpy(float), s["snpp"].to_numpy(float)
            if v.sum() < 50 or x.sum() < 50:
                continue
            a = v.sum() / max((x ** b).sum(), 1e-9)
            mu = np.maximum(a * x ** b, 1e-9)
            dev += 2 * (np.where(v > 0, v * np.log(np.maximum(v, 1e-9) / mu), 0) - (v - mu)).sum()
            al[p] = a
        if best is None or dev < best[0]:
            best = (dev, round(float(b), 3), al)
    _, b, al = best
    # pooled alpha for provinces that are too thin to fit alone
    x, v = g["noaa20"].to_numpy(float), g["snpp"].to_numpy(float)
    pool = v.sum() / max((x ** b).sum(), 1e-9)
    return b, al, float(pool)


def main():
    cd = pd.read_parquet(OUT_DIR / "cell_days.parquet")
    cells = pd.read_parquet(OUT_DIR / "cells.parquet")
    cd = cd[cd["daynight"] == "D"].copy()
    cd["sensor"] = cd["sensor"].astype(str)
    snpp_end = cd.loc[cd["sensor"] == "snpp", "date"].max()
    cd = cd.merge(cells, on=["cx", "cy"], how="inner")
    cd = cd[cd["date"].dt.year >= Y0]
    cd = drop_static_nrt(cd, snpp_end)  # same static-cell rule as the main series (it also drops these cells for NOAA-20)
    print("S-NPP end:", snpp_end.date(), "| NOAA-20 last day:", cd.loc[cd["sensor"] == "noaa20", "date"].max().date())

    # --- day completeness of NOAA-20 (against NOAA-21) over the provisional days
    days = pd.date_range("2026-10-27", cd.loc[cd["sensor"] == "noaa20", "date"].max())
    cnt = cd[cd["date"].isin(days)].groupby(["date", "sensor"]).size().unstack("sensor", fill_value=0).reindex(days, fill_value=0)
    cnt["ratio"] = cnt["noaa20"] / cnt["noaa21"].clip(lower=1)
    missing = [str(d.date()) for d in days if cnt.loc[d, "ratio"] < 0.3]
    print("NOAA-20 day counts (rows) and ratio to NOAA-21:\n", cnt[["noaa20", "noaa21", "ratio"]].round(2).to_string())
    print("days treated as missing:", missing)

    # --- bridge fit on weekly sums per province
    s = cd[cd["sensor"].isin(["snpp", "noaa20"]) & (cd["date"] >= FIT_FROM) & (cd["date"] <= FIT_TO)].copy()
    s["slot"] = slot_of(s["date"])
    g = s.groupby(["prov", "slot", "sensor"]).size().unstack("sensor", fill_value=0).reset_index()
    b, al, pool = fit(g, None)
    print(f"bridge fit {FIT_FROM.date()}..{FIT_TO.date()}: b = {b}, provinces with own alpha: {len(al)}, pooled alpha = {pool:.3f}")

    def bridged(p, n):
        return (al.get(p, pool)) * (float(n) ** b) if n > 0 else 0.0

    # --- overlap check, week 27 Oct to 2 Nov 2026 (S-NPP observed vs bridged NOAA-20)
    w = cd[(cd["date"] >= CHECK[0]) & (cd["date"] <= CHECK[1])]
    sp = w[w["sensor"] == "snpp"].groupby("prov").size()
    nj = w[w["sensor"] == "noaa20"].groupby("prov").size()
    rows = []
    for p in sorted(set(sp.index) | set(nj.index)):
        o, n = float(sp.get(p, 0)), float(nj.get(p, 0))
        pr = bridged(p, n)
        rows.append(dict(prov=p, snpp=o, noaa20=n, bridged=round(pr, 1), diff_pct=(round(100 * (pr / o - 1), 1) if o >= 20 else None)))
    chk = pd.DataFrame(rows)
    nat_o, nat_n, nat_b = chk["snpp"].sum(), chk["noaa20"].sum(), chk["bridged"].sum()
    nat_diff = 100 * (nat_b / nat_o - 1)
    raw_diff = 100 * (nat_n / nat_o - 1)
    print(f"OVERLAP CHECK {CHECK[0].date()}..{CHECK[1].date()}: S-NPP {nat_o:.0f}, NOAA-20 raw {nat_n:.0f} ({raw_diff:+.1f}%), bridged {nat_b:.1f} ({nat_diff:+.1f}%)")
    big = chk[chk["snpp"] >= 100].sort_values("snpp", ascending=False).head(8)
    print(big.to_string(index=False))
    out_bridge = dict(
        fit_window=[str(FIT_FROM.date()), str(FIT_TO.date())], model="S-NPP = alpha_province * NOAA20^b on weekly fire-day sums (Poisson, b shared)",
        b=b, alpha={k: round(v, 4) for k, v in al.items()}, alpha_pooled=round(pool, 4),
        overlap_check=dict(window=[str(CHECK[0].date()), str(CHECK[1].date())], snpp=float(nat_o), noaa20_raw=float(nat_n), bridged=round(float(nat_b), 1),
                           national_diff_pct=round(float(nat_diff), 1), raw_diff_pct=round(float(raw_diff), 1),
                           provinces=[{k: (None if (isinstance(v, float) and np.isnan(v)) else v) for k, v in r.items()} for r in big.to_dict("records")]),
        missing_days=missing, max_diff_allowed_pct=MAX_DIFF,
        bridge_test="public/data/bridge_test.json: leave-one-year-out 2019-2025, national error -4.6% to +12.5%, 96% of province-years within +-20%; not merged into the record")
    if abs(nat_diff) > MAX_DIFF:
        out_bridge["shown"] = False
        (PUB / "bridge.json").write_text(json.dumps(out_bridge), encoding="utf-8")
        print(f"STOP: national overlap difference {nat_diff:+.1f}% is above {MAX_DIFF}%. Task A is reverted: tested, not shown.")
        return

    # --- provisional week(s): every day of the 7-day slot must have NOAA-20 data
    wdays = [str(d.date()) for d in pd.date_range(W_FROM, W_TO)]
    ok = not any(d in missing for d in wdays)
    print(f"slot {WEEK} {W_FROM.date()}..{W_TO.date()} complete: {ok}")
    n20 = cd[cd["sensor"] == "noaa20"]
    kw = n20[(n20["date"] >= W_FROM) & (n20["date"] <= W_TO)]
    kn = kw[kw["date"] >= pd.Timestamp("2026-11-01")]
    pw = kw.groupby(["prov", "kab_id"]).size()
    pn = kn.groupby(["prov", "kab_id"]).size()
    prov_tot = pw.groupby(level=0).sum()
    f = {p: (bridged(p, n) / n if n > 0 else 0.0) for p, n in prov_tot.items()}  # province bridge factor of the week
    kab_w = {k: float(v) * f[p] for (p, k), v in pw.items()}
    kab_m = {k: float(v) * f[p] for (p, k), v in pn.items()}
    # area groups, same ids as the area files
    cm = cd[cd["sensor"].isin(["aqua", "terra", "snpp"])]
    pk = cm[["kab_id", "peat"]].drop_duplicates()
    combos = cells[["kab_id", "kab", "prov", "island"]].drop_duplicates("kab_id")
    D = Data()
    D.combos = pk.merge(combos, on="kab_id").sort_values(["prov", "kab", "peat"]).reset_index(drop=True)
    groups = area_groups(D)
    nfiles, nat = 0, None
    for level in ["nation", "province", "kabupaten"]:
        for aid, name, parent, idx in groups[level]:
            fpath = PUB / "areas" / f"{aid}.json"
            if not fpath.exists():
                continue
            rec = json.loads(fpath.read_text(encoding="utf-8"))
            kids = set(D.combos.loc[idx, "kab_id"])
            val = sum(kab_w.get(k, 0.0) for k in kids)
            mv = sum(kab_m.get(k, 0.0) for k in kids)
            h = rec["h"]
            same = [h[(y - Y0) * WPY + WEEK - 1] for y in range(2001, 2026) if h[(y - Y0) * WPY + WEEK - 1] is not None]
            med = float(np.median(same)) if same else None
            p = dict(year=2026, weeks=[WEEK] if ok else [], values=[round(val, 1)] if ok else [], **{"from": str(W_FROM.date()), "through": str(W_TO.date())},
                     source="NOAA-20 bridged to S-NPP", tile=dict(week=WEEK, value=round(val, 1), median=(round(med, 1) if med is not None else None),
                                                                    ratio=(round(val / med, 2) if med else None)),
                     month=dict(year=2026, month=11, days=4, value=round(mv, 1)))
            if not ok:
                p["tile"] = None
            rec["prov"] = p
            fpath.write_text(json.dumps(rec, separators=(",", ":")), encoding="utf-8")
            nfiles += 1
            if aid == "indonesia":
                nat = p
    out_bridge["shown"] = bool(ok)
    out_bridge["week"] = dict(slot=WEEK, **{"from": str(W_FROM.date()), "through": str(W_TO.date())})
    out_bridge["national_week"] = nat
    (PUB / "bridge.json").write_text(json.dumps(out_bridge), encoding="utf-8")
    print("files updated:", nfiles, "| national provisional week:", nat)
    kt = json.loads((PUB / "areas" / "kalimantan-tengah.json").read_text(encoding="utf-8"))["prov"]
    print("kalimantan-tengah:", kt)


if __name__ == "__main__":
    main()
