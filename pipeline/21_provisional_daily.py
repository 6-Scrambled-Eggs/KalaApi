"""Step 21 (PRD v5 Task 1): provisional layer BY DAY. Replaces the weekly `prov` block written by step 18. ADDITIVE ONLY.

Run order: 05, 14, 18 (writes bridge.json with the fit), then this step (reads alpha and b from bridge.json, does NOT refit).
- 29 Oct to 2 Nov 2026: observed S-NPP fire-days (not bridged).
- 3 Nov to the last full day: NOAA-20 bridged to S-NPP, V = alpha_province * N^b. The weekly fit is nonlinear, so the factor is taken at the
  week-equivalent activity of the province over the provisional days: f = alpha * (7 * mean daily NOAA-20)^(b-1); day value = f * daily NOAA-20 count.
- A day where NOAA-20 has under 30% of the NOAA-21 rows stays missing (not filled, not scaled).
- The newest NRT day is treated as still in progress and is not used.
Nothing is written into h, lo, hi, the baseline, flags, annual totals, validation.json or the CSV.
New FIRMS rows are read from DL_FIRE_J1V/J2V (NOAA-20/NOAA-21) and cached in processed/prov_new_cell_days.parquet (not committed).
"""
import importlib.util, json
import numpy as np
import pandas as pd
from config import OUT_DIR, RAW_DIR, REPO
from harmonize_lib import Data, WPY, Y0, area_groups, drop_static_nrt, slot_of

PUB = REPO / "public" / "data"
OBS_FROM, OBS_TO = pd.Timestamp("2026-10-29"), pd.Timestamp("2026-11-02")
PROV_FROM = pd.Timestamp("2026-11-03")
MONTH_FROM = pd.Timestamp("2026-11-01")
CHECK = (pd.Timestamp("2026-10-27"), pd.Timestamp("2026-11-02"))
spec = importlib.util.spec_from_file_location("load_firms", REPO / "pipeline" / "01_load_firms.py"); lf = importlib.util.module_from_spec(spec); spec.loader.exec_module(lf)


def new_rows():
    parts = []
    for pat in ("DL_FIRE_J1V-C2_850944", "DL_FIRE_J2V-C2_850945"):
        f = next((RAW_DIR / pat).glob("fire_*.csv"))
        for ch in pd.read_csv(f, chunksize=500_000, dtype={"acq_time": str, "confidence": str}):
            parts.append(lf.process(ch))
    a = pd.concat(parts, ignore_index=True)
    a = a.groupby(lf.KEYS, as_index=False).agg(n=("n", "sum"), max_frp=("max_frp", "max"))
    a["sensor"] = a["sensor"].astype(str)
    a.to_parquet(OUT_DIR / "prov_new_cell_days.parquet", index=False)
    return a


def main():
    br = json.loads((PUB / "bridge.json").read_text(encoding="utf-8"))
    b, al, pool = br["b"], br["alpha"], br["alpha_pooled"]
    cd = pd.read_parquet(OUT_DIR / "cell_days.parquet"); cells = pd.read_parquet(OUT_DIR / "cells.parquet")
    cd = cd[cd["daynight"] == "D"].copy(); cd["sensor"] = cd["sensor"].astype(str)
    snpp_end = cd.loc[cd["sensor"] == "snpp", "date"].max()
    nw = new_rows(); nw = nw[nw["daynight"] == "D"]
    print("new FIRMS rows, last date per sensor:", nw.groupby("sensor")["date"].max().dt.date.to_dict())
    keep = ~(cd["sensor"].isin(["noaa20", "noaa21"]) & (cd["date"] >= PROV_FROM))
    cd = pd.concat([cd[keep], nw[nw["date"] >= PROV_FROM]], ignore_index=True)
    cd["sensor"] = cd["sensor"].astype("category").astype(str)
    cd = cd.merge(cells, on=["cx", "cy"], how="inner"); cd = cd[cd["date"].dt.year >= Y0]
    cd = drop_static_nrt(cd, snpp_end)
    last_raw = cd.loc[cd["sensor"] == "noaa20", "date"].max()
    last = last_raw - pd.Timedelta(days=1)  # newest NRT day is still in progress
    days = pd.date_range(PROV_FROM, last)
    cnt = cd[cd["date"].isin(days)].groupby(["date", "sensor"]).size().unstack("sensor", fill_value=0).reindex(days, fill_value=0)
    cnt["ratio"] = cnt["noaa20"] / cnt["noaa21"].clip(lower=1)
    print(cnt[["noaa20", "noaa21", "ratio"]].round(2).to_string())
    missing = [d for d in days if cnt.loc[d, "ratio"] < 0.3]
    have = [d for d in days if d not in missing]
    print("newest NRT day (in progress, not used):", last_raw.date(), "| last full day:", last.date(), "| missing:", [str(d.date()) for d in missing])

    n20 = cd[(cd["sensor"] == "noaa20") & cd["date"].isin(have)]
    sn = cd[(cd["sensor"] == "snpp") & (cd["date"] >= OBS_FROM) & (cd["date"] <= OBS_TO)]
    kd = n20.groupby(["prov", "kab_id", "date"]).size()
    ko = sn.groupby(["prov", "kab_id", "date"]).size()
    # bridge factor per province at week-equivalent activity
    ptot = n20.groupby("prov").size()
    fac = {}
    for p, n in ptot.items():
        N = 7.0 * n / len(have)
        fac[p] = al.get(p, pool) * N ** (b - 1.0)
    # overlap check for ALL provinces (same alpha and b, week 27 Oct to 2 Nov)
    w = cd[(cd["date"] >= CHECK[0]) & (cd["date"] <= CHECK[1])]
    sp = w[w["sensor"] == "snpp"].groupby("prov").size(); nj = w[w["sensor"] == "noaa20"].groupby("prov").size()
    ov = {}
    for p in sorted(set(sp.index) | set(nj.index)):
        o, n = float(sp.get(p, 0)), float(nj.get(p, 0)); pr = al.get(p, pool) * n ** b if n > 0 else 0.0
        ov[p] = dict(snpp=o, noaa20=n, bridged=round(pr, 1), diff_pct=(round(100 * (pr / o - 1), 1) if o >= 20 else None))
    # area ids
    cm = cd[cd["sensor"].isin(["aqua", "terra", "snpp"])]
    pk = cm[["kab_id", "peat"]].drop_duplicates()
    combos = cells[["kab_id", "kab", "prov", "island"]].drop_duplicates("kab_id")
    D = Data(); D.combos = pk.merge(combos, on="kab_id").sort_values(["prov", "kab", "peat"]).reset_index(drop=True)
    groups = area_groups(D)
    kab_prov = dict(zip(combos["kab_id"], combos["prov"]))
    o_days = list(pd.date_range(OBS_FROM, OBS_TO))
    slots = {44: pd.date_range("2026-10-29", "2026-11-04"), 45: pd.date_range("2026-11-05", "2026-11-11"), 46: pd.date_range("2026-11-12", "2026-11-18")}
    nov_days = [d for d in pd.date_range(MONTH_FROM, last) if d in have or d in o_days]
    note_dates = {}
    nfiles, nat, big = 0, None, 0
    for level in ["nation", "province", "kabupaten"]:
        for aid, name, parent, idx in groups[level]:
            fpath = PUB / "areas" / f"{aid}.json"
            if not fpath.exists(): continue
            rec = json.loads(fpath.read_text(encoding="utf-8")); h = rec["h"]
            kids = set(D.combos.loc[idx, "kab_id"])
            def val(d, obs):
                if obs: return float(sum(ko.get((kab_prov[k], k, d), 0) for k in kids))
                return float(sum(ko_f(k, d) for k in kids))
            def ko_f(k, d):
                p = kab_prov[k]; return kd.get((p, k, d), 0) * fac.get(p, al.get(p, pool))
            obs = [[str(d.date()), round(val(d, True), 1), "snpp"] for d in o_days]
            daily = [[str(d.date()), (None if d in missing else round(val(d, False), 1)), ("missing" if d in missing else "noaa20")] for d in days]
            dv = {r[0]: r[1] for r in obs + daily}
            weeks = []
            for wk, ds in slots.items():
                vs = [dv.get(str(d.date())) for d in ds if str(d.date()) in dv and dv[str(d.date())] is not None]
                if vs: weeks.append(dict(week=wk, value=round(sum(vs), 1), days=len(vs)))
            X = sum(dv[str(d.date())] for d in nov_days)
            # baseline: same calendar days of 2001-2025, weekly value shared evenly over its 7 days
            tot = []
            for y in range(2001, 2026):
                dd = pd.Series([pd.Timestamp(year=y, month=d.month, day=d.day) for d in nov_days])
                sl = slot_of(dd) - (y - Y0) * WPY
                vals = [h[(y - Y0) * WPY + int(s)] for s in sl]
                if any(v is None for v in vals): continue
                tot.append(sum(vals) / 7.0)
            med = float(np.median(tot)) if tot else None
            prov_name = name if level == "province" else (kab_prov.get(next(iter(kids))) if level == "kabupaten" else None)
            ovp = None
            if level == "nation": ovp = dict(pct=br["overlap_check"]["national_diff_pct"], name=None)
            elif prov_name in ov and ov[prov_name]["diff_pct"] is not None: ovp = dict(pct=ov[prov_name]["diff_pct"], name=prov_name)
            rec["prov"] = dict(year=2026, source="NOAA-20 bridged to S-NPP", through=str(last.date()), missing=[str(d.date()) for d in missing],
                               obs=obs, daily=daily, weeks=weeks,
                               tile=dict(value=round(X, 1), days=len(nov_days), median=(round(med, 1) if med is not None else None), ratio=(round(X / med, 2) if med else None), from_="2026-11-01", through=str(last.date())),
                               month=dict(year=2026, month=11, days=len(nov_days), value=round(X, 1)), overlap=ovp)
            fpath.write_text(json.dumps(rec, separators=(",", ":")), encoding="utf-8"); nfiles += 1
            big = max(big, fpath.stat().st_size)
            if aid == "indonesia": nat = rec["prov"]
    br.update(shown=True, through=str(last.date()), missing_days=[str(d.date()) for d in missing], days_used=[str(d.date()) for d in have],
              observed_snpp_days=[str(d.date()) for d in o_days], newest_nrt_day_not_used=str(last_raw.date()),
              factor_rule="f = alpha * (7 * mean daily NOAA-20)^(b-1) per province over the provisional days",
              overlap_by_province=ov)
    br.pop("week", None); br.pop("national_week", None)
    (PUB / "bridge.json").write_text(json.dumps(br), encoding="utf-8")
    print("files updated:", nfiles, "| largest area file (KB):", round(big / 1024))
    print("NATIONAL November so far:", {k: nat[k] for k in ("tile", "weeks", "missing", "through")})
    kt = json.loads((PUB / "areas" / "kalimantan-tengah.json").read_text(encoding="utf-8"))["prov"]
    print("kalimantan-tengah tile:", kt["tile"], "overlap:", kt["overlap"])
    print("provinces with |overlap| > 20%:", {p: v["diff_pct"] for p, v in ov.items() if v["diff_pct"] is not None and abs(v["diff_pct"]) > 20})


if __name__ == "__main__":
    main()
