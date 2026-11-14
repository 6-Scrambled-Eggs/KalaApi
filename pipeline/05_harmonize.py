"""Step 5: harmonize MODIS to VIIRS-equivalent fire-days and export the app data (FR-04, FR-09, FR-10).

Reads  : cell_days.parquet, cells.parquet
Writes : <repo>/public/data/areas.json, meta.json, provinces.geojson, areas/<id>.json

Run:  python pipeline/05_harmonize.py
"""
import datetime as dt
import json

import numpy as np

from config import REPO
from geo_lib import load_admin, slug
from harmonize_lib import (NSLOT, WPY, Y0, Y1, area_groups, area_series, build, calibrate, percentile_rank,
                           periods)

PUB = REPO / "public" / "data"
BASE = list(range(2001, 2026))  # baseline for anomalies (PRD: 2001-2025)
BASE12 = list(range(2012, 2026))  # sensitivity baseline (observed VIIRS years only)
NBOOT = 1000


def r(a, nd=1):
    return [None if np.isnan(x) else (round(float(x), nd) if nd else int(round(float(x)))) for x in a]


def main():
    PUB.joinpath("areas").mkdir(parents=True, exist_ok=True)
    D = build()
    print(f"slots: A0={D.A0} S0={D.S0} LAST={D.LAST}; peat known: {D.peat_known}; strata: {len(D.strata)}")
    train = np.arange(D.S0, D.LAST + 1)
    k, kb = calibrate(D, train, boot=NBOOT)
    lo_k, hi_k = np.nanquantile(kb, [0.05, 0.95], axis=1)
    strata_tbl = [dict(stratum=a, peat=b, k=round(float(k[i]), 3), k_lo=round(float(lo_k[i]), 3),
                       k_hi=round(float(hi_k[i]), 3)) for i, (a, b) in enumerate(D.strata)]
    for s in strata_tbl:
        print(s)

    groups = area_groups(D)
    last_year, last_w = Y0 + D.LAST // WPY, D.LAST % WPY + 1
    index = []
    for level in ["nation", "province", "kabupaten"]:
        for aid, name, parent, idx in groups[level]:
            ser = area_series(D, idx, k, kb)
            h = ser["h"]
            Hm = h.reshape(-1, WPY)
            annual = np.nanmean(np.nansum(Hm[: len(BASE)], axis=1))
            if level == "kabupaten" and annual < 10:
                continue
            pct = percentile_rank(h, BASE, D)
            pct12 = percentile_rank(h, BASE12, D)
            per = periods(h, list(range(Y0, Y1 + 1)))
            typ = [int(np.median([per[y][i] for y in BASE if y in per])) for i in range(3)]
            ytd = np.nansum(Hm[Y1 - Y0, :last_w])
            base_ytd = np.nansum(Hm[: len(BASE), :last_w], axis=1)
            ytd_pct = 100 * ((base_ytd < ytd).sum() + 0.5 * (base_ytd == ytd).sum()) / len(base_ytd)
            ytd_ratio = float(ytd / np.median(base_ytd)) if np.median(base_ytd) > 0 else None
            low = bool(annual < 50)
            rec = dict(id=aid, name=name, level=level, parent=parent, start_year=Y0, weeks_per_year=WPY,
                       last_year=last_year, last_week=last_w, back_cast_end_slot=D.S0, low_data=low,
                       mean_annual_fire_days=round(float(annual), 1),
                       typical_period=dict(onset=typ[0], peak=typ[1], end=typ[2]),
                       periods={str(y): v for y, v in per.items()},
                       h=r(h), lo=r(ser["lo"]), hi=r(ser["hi"]), chk=r(ser["chk"]),
                       m=r(ser["m"], 0), v=r(ser["v"], 0), cnt=r(ser["cnt"], 0),
                       pct=r(pct, 0), pct12=r(pct12, 0))
            (PUB / "areas" / f"{aid}.json").write_text(json.dumps(rec, separators=(",", ":")), encoding="utf-8")
            index.append(dict(id=aid, name=name, level=level, parent=parent, low_data=low,
                              mean_annual_fire_days=rec["mean_annual_fire_days"], ytd_pct=round(float(ytd_pct), 1),
                              ytd_ratio=None if ytd_ratio is None else round(ytd_ratio, 2),
                              typical_period=rec["typical_period"]))
    (PUB / "areas.json").write_text(json.dumps(index, separators=(",", ":")), encoding="utf-8")
    meta = dict(
        generated=dt.date.today().isoformat(), data_end=str(D.snpp_end.date()), start_year=Y0, end_year=Y1,
        weeks_per_year=WPY, last_complete_year=last_year, last_complete_week=last_w,
        viirs_first_slot=D.S0, aqua_first_slot=D.A0, peat_split=D.peat_known,
        baseline="2001-2025", sensitivity_baseline="2012-2025", n_boot=NBOOT, strata=strata_tbl,
        notes=["Week 52 covers the last 8-9 days of each year.",
               "Slots before the Aqua start use Terra scaled to Aqua per stratum.",
               "Slots before the first full S-NPP week are back-cast; later slots are observed S-NPP VIIRS.",
               "Peat split is off when no peat polygon file was available." if not D.peat_known else "Peat split on."],
    )
    (PUB / "meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    kab, prov = load_admin()
    prov["id"] = prov["prov"].map(slug)
    prov = prov.rename(columns={"prov": "name"})
    prov["geometry"] = prov.geometry.simplify(0.02, preserve_topology=True)
    (PUB / "provinces.geojson").write_text(prov[["id", "name", "island", "geometry"]].to_json(), encoding="utf-8")
    print(f"Wrote {len(index)} areas to {PUB}")


if __name__ == "__main__":
    main()
