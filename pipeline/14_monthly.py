"""Step 14: monthly harmonized fire-days per area (adds mh/mlo/mhi/mstat/mcur to public/data/areas/<id>.json).

Method: the weekly harmonized series stays the master. Each week is shared out to its days:
  - weeks before the first full S-NPP VIIRS week: the combo's back-cast total, split by the combo's own daily
    MODIS-equivalent fire-days (Aqua; Terra scaled to Aqua before Aqua exists);
  - later days: observed S-NPP VIIRS fire-days (daily, same filters as the weekly series).
Days are then summed by calendar month, so monthly totals add up to weekly totals. Days after the last complete
week (up to the data end) are observed VIIRS days and give a month-to-date value for the current month.
The 90% band is the weekly band shared out to days in proportion to the area's daily fire-days (approximate).

Run after 05_harmonize.py:  python pipeline/14_monthly.py
"""
import calendar
import json

import numpy as np
import pandas as pd

from config import REPO
from harmonize_lib import NSLOT, WPY, Y0, Y1, area_groups, area_series, backcast, boot_paths, build, calibrate_power, slot_of

PUB = REPO / "public" / "data"
BASE = list(range(2001, 2026))
MIN_CUR_DAYS = 7  # headline month = latest month with at least this many days of data


def main():
    D = build()
    train = np.arange(D.S0, D.LAST + 1)
    b, alpha, bb, ab = calibrate_power(D, train, boot=1000)
    vhat = backcast(D, b, alpha)
    bootp = boot_paths(D, bb, ab)
    end = D.snpp_end.normalize()
    dates = pd.date_range(f"{Y0}-01-01", end)
    nd = len(dates)
    dslot = slot_of(pd.Series(dates))
    nc = len(D.combos)
    cidx = {(a, p): i for i, (a, p) in enumerate(zip(D.combos["kab_id"], D.combos["peat"]))}
    t0 = pd.Timestamp(f"{Y0}-01-01")
    day = {s: np.zeros((nc, nd), dtype=np.float32) for s in ("aqua", "terra", "snpp")}
    gd = D.gd
    for s in day:
        g = gd[gd["sensor"] == s]
        ii = np.array([cidx[(a, p)] for a, p in zip(g["kab_id"], g["peat"])], dtype=int)
        jj = (g["date"].dt.normalize() - t0).dt.days.to_numpy()
        keep = (jj >= 0) & (jj < nd)  # Aqua/Terra may run past the S-NPP end; the series stops at the S-NPP end
        day[s][ii[keep], jj[keep]] = g["fd"].to_numpy()[keep]
    meff_d = np.where(dslot[None, :] < D.A0, day["terra"] * D.kta[D.sidx][:, None], day["aqua"])
    slot_tot = D.meff[:, dslot]  # combo x day: weekly MODIS-equivalent total of the day's week
    share = np.where(slot_tot > 0, meff_d / np.maximum(slot_tot, 1e-12), 0.0)
    hday = np.where(dslot[None, :] < D.S0, vhat[:, dslot] * share, day["snpp"])
    ym = (dates.year.to_numpy() - Y0) * 12 + dates.month.to_numpy() - 1
    NM = (Y1 - Y0 + 1) * 12
    last_ym = int(ym[-1])
    dom = dates.day.to_numpy()
    dim = np.array([calendar.monthrange(d.year, d.month)[1] for d in dates])
    cover = int(dom[-1])
    cur_ym = last_ym if cover >= MIN_CUR_DAYS or cover == dim[-1] else last_ym - 1
    cy, cm = Y0 + cur_ym // 12, cur_ym % 12 + 1
    cdays = cover if cur_ym == last_ym else calendar.monthrange(cy, cm)[1]
    print(f"data end {end.date()}, headline month {cy}-{cm:02d} ({cdays} days)")

    groups = area_groups(D)
    nfiles, worst = 0, 0.0
    for level in ["nation", "province", "kabupaten"]:
        for aid, name, parent, idx in groups[level]:
            f = PUB / "areas" / f"{aid}.json"
            if not f.exists():
                continue
            rec = json.loads(f.read_text(encoding="utf-8"))
            hd = hday[idx].sum(0).astype(np.float64)
            mh = np.bincount(ym, weights=hd, minlength=NM)
            ser = area_series(D, idx, vhat, bootp)
            tot_slot = np.bincount(dslot, weights=hd, minlength=NSLOT)
            w = np.where(tot_slot[dslot] > 0, hd / np.maximum(tot_slot[dslot], 1e-12), 0.0)
            lo_d = np.nan_to_num(ser["lo"])[dslot] * w
            hi_d = np.nan_to_num(ser["hi"])[dslot] * w
            lo_d[dslot > D.LAST] = hd[dslot > D.LAST]
            hi_d[dslot > D.LAST] = hd[dslot > D.LAST]
            mlo = np.bincount(ym, weights=lo_d, minlength=NM)
            mhi = np.bincount(ym, weights=hi_d, minlength=NM)
            # check against the weekly series (complete weeks only)
            hw = np.nan_to_num(ser["h"])
            ok = dslot <= D.LAST
            if hw.sum() > 100:
                worst = max(worst, abs(hd[ok].sum() - hw[: D.LAST + 1].sum()) / hw[: D.LAST + 1].sum())
            nm = last_ym + 1
            mm = np.full(NM, np.nan)
            mm[:nm] = mh[:nm]
            mlow, mhigh = np.full(NM, np.nan), np.full(NM, np.nan)
            mlow[:nm], mhigh[:nm] = mlo[:nm], mhi[:nm]
            full = mm.reshape(-1, 12)[: Y1 - Y0 + 1]
            baserows = full[[y - Y0 for y in BASE]]
            med = np.nanmedian(baserows, axis=0)
            p25 = np.nanpercentile(baserows, 25, axis=0)
            p75 = np.nanpercentile(baserows, 75, axis=0)
            # headline month: value so far vs the same days in each baseline year
            sel_cur = (ym == cur_ym)
            val = float(hd[sel_cur].sum())
            bvals = []
            for y in BASE:
                sel = (dates.year.to_numpy() == y) & (dates.month.to_numpy() == cm) & (dom <= cdays)
                bvals.append(float(hd[sel].sum()))
            bv = np.array(bvals)
            bmed = float(np.median(bv))
            pct = 100 * ((bv < val).sum() + 0.5 * (bv == val).sum()) / len(bv)
            rec["mh"] = [None if np.isnan(x) else round(float(x), 1) for x in mm]
            rec["mlo"] = [None if np.isnan(x) else round(float(x), 1) for x in mlow]
            rec["mhi"] = [None if np.isnan(x) else round(float(x), 1) for x in mhigh]
            rec["mstat"] = dict(med=[round(float(x), 1) for x in med], p25=[round(float(x), 1) for x in p25],
                                p75=[round(float(x), 1) for x in p75])
            rec["mcur"] = dict(year=cy, month=cm, days=cdays, days_in_month=calendar.monthrange(cy, cm)[1],
                               value=round(val, 1), median=round(bmed, 1),
                               ratio=None if bmed <= 0 else round(val / bmed, 2), pct=round(float(pct), 0),
                               partial=bool(cdays < calendar.monthrange(cy, cm)[1]))
            rec["mpartial"] = dict(index=last_ym, days=cover, days_in_month=int(dim[-1])) if cover < dim[-1] else None
            f.write_text(json.dumps(rec, separators=(",", ":")), encoding="utf-8")
            nfiles += 1
    print(f"patched {nfiles} area files; worst monthly-vs-weekly national/area total gap: {100 * worst:.3f}%")


if __name__ == "__main__":
    main()
