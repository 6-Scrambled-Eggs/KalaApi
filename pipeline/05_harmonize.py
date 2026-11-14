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
from harmonize_lib import (NSLOT, WPY, Y0, Y1, area_groups, area_series, backcast, boot_paths, build, calibrate,
                           calibrate_power, percentile_rank, periods)

PUB = REPO / "public" / "data"
BASE = list(range(2001, 2026))  # baseline for anomalies (PRD: 2001-2025)
BASE12 = list(range(2012, 2026))  # sensitivity baseline (observed VIIRS years only)
BASE10 = list(range(2016, 2026))  # "recent ten years" baseline for the year-to-date tile
NBOOT = 1000


def r(a, nd=1):
    return [None if np.isnan(x) else (round(float(x), nd) if nd else int(round(float(x)))) for x in a]


def main():
    PUB.joinpath("areas").mkdir(parents=True, exist_ok=True)
    D = build()
    print(f"slots: A0={D.A0} S0={D.S0} LAST={D.LAST}; peat known: {D.peat_known}; strata: {len(D.strata)}")
    train = np.arange(D.S0, D.LAST + 1)
    k, kb = calibrate(D, train, boot=NBOOT)  # average V/M ratio per stratum (reported in the strata table)
    b, alpha, bb, ab = calibrate_power(D, train, boot=NBOOT)  # the model that is actually used for the back-cast
    b_lo, b_hi = np.quantile(bb, [0.05, 0.95])
    print(f"power-law exponent b = {b:.3f} (90% interval {b_lo:.3f} to {b_hi:.3f})")
    vhat = backcast(D, b, alpha)
    bootp = boot_paths(D, bb, ab)
    lo_k, hi_k = np.nanquantile(kb, [0.05, 0.95], axis=1)
    strata_tbl = [dict(stratum=a, peat=pt, k=round(float(k[i]), 3), k_lo=round(float(lo_k[i]), 3),
                       k_hi=round(float(hi_k[i]), 3), alpha=round(float(alpha[i]), 4)) for i, (a, pt) in enumerate(D.strata)]
    for s in strata_tbl:
        print(s)

    groups = area_groups(D)
    last_year, last_w = Y0 + D.LAST // WPY, D.LAST % WPY + 1
    index = []
    for level in ["nation", "province", "kabupaten"]:
        for aid, name, parent, idx in groups[level]:
            ser = area_series(D, idx, vhat, bootp)
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
            base10 = np.nansum(Hm[[y - Y0 for y in BASE10], :last_w], axis=1)
            ytd_pct10 = 100 * ((base10 < ytd).sum() + 0.5 * (base10 == ytd).sum()) / len(base10)
            ytd_ratio10 = float(ytd / np.median(base10)) if np.median(base10) > 0 else None
            low = bool(annual < 50)
            # Peat-only and mineral-only harmonized series (FR-05), when the area has both kinds of cells.
            pk = D.combos["peat"].to_numpy()[idx]
            split = {}
            if D.peat_known and (pk == "peat").any() and (pk == "mineral").any():
                split["h_peat"] = r(area_series(D, idx[pk == "peat"], vhat)["h"])
                split["h_min"] = r(area_series(D, idx[pk == "mineral"], vhat)["h"])
            # Fire radiative power (MW, sum of daily cell maxima), S-NPP era only.
            frp = np.full(NSLOT, np.nan)
            frp[D.S0 : D.LAST + 1] = D.frp["snpp"][idx].sum(0)[D.S0 : D.LAST + 1]
            rec = dict(id=aid, name=name, level=level, parent=parent, start_year=Y0, weeks_per_year=WPY,
                       last_year=last_year, last_week=last_w, back_cast_end_slot=D.S0, low_data=low,
                       mean_annual_fire_days=round(float(annual), 1),
                       typical_period=dict(onset=typ[0], peak=typ[1], end=typ[2]),
                       periods={str(y): v for y, v in per.items()},
                       h=r(h), lo=r(ser["lo"]), hi=r(ser["hi"]), chk=r(ser["chk"]),
                       m=r(ser["m"], 0), v=r(ser["v"], 0), cnt=r(ser["cnt"], 0),
                       pct=r(pct, 0), pct12=r(pct12, 0), frp=r(frp, 0), **split)
            (PUB / "areas" / f"{aid}.json").write_text(json.dumps(rec, separators=(",", ":")), encoding="utf-8")
            index.append(dict(id=aid, name=name, level=level, parent=parent, low_data=low,
                              mean_annual_fire_days=rec["mean_annual_fire_days"], ytd_pct=round(float(ytd_pct), 1),
                              ytd_ratio=None if ytd_ratio is None else round(ytd_ratio, 2),
                              ytd_pct_recent=round(float(ytd_pct10), 1),
                              ytd_ratio_recent=None if ytd_ratio10 is None else round(ytd_ratio10, 2),
                              typical_period=rec["typical_period"]))
    (PUB / "areas.json").write_text(json.dumps(index, separators=(",", ":")), encoding="utf-8")
    meta = dict(
        generated=dt.date.today().isoformat(), data_end=str(D.snpp_end.date()), start_year=Y0, end_year=Y1,
        weeks_per_year=WPY, last_complete_year=last_year, last_complete_week=last_w,
        viirs_first_slot=D.S0, aqua_first_slot=D.A0, peat_split=D.peat_known,
        baseline="2001-2025", sensitivity_baseline="2012-2025", n_boot=NBOOT, strata=strata_tbl,
        model="power", exponent=dict(b=round(float(b), 3), lo=round(float(b_lo), 3), hi=round(float(b_hi), 3)),
        notes=["Week 52 covers the last 8-9 days of each year.",
               "Slots before the Aqua start use Terra scaled to Aqua per stratum.",
               "Slots before the first full S-NPP week are back-cast with V = alpha * M^b per stratum; later slots are observed S-NPP VIIRS.",
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
