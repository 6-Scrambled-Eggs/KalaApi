"""Shared harmonization code (PRD: Harmonization method).

Unit of time: 'slot' = one 7-day block of the year (52 per year; week 52 absorbs the last 8-9 days).
Unit of area: combo = (kabupaten, peat flag). Province, nation and kabupaten are sums of combos.
Calibration stratum: (island group, peat flag). Ratio k_s = VIIRS fire-days / Aqua MODIS fire-days on the overlap.

Streams (daytime passes only, afternoon orbit):
  M = Aqua MODIS fire-days (from 2002-07). Before that, Terra fire-days scaled to Aqua with a per-stratum ratio.
  V = S-NPP VIIRS fire-days (from 2012-01-20). Reference VIIRS series.
"""
import numpy as np
import pandas as pd

from config import OUT_DIR

Y0, WPY, Y1 = 2001, 52, 2026
NSLOT = (Y1 - Y0 + 1) * WPY
PROV_MIN = 3000  # a province is its own stratum above this many Aqua fire-days on the overlap
THIN = 500  # minimum Aqua fire-days on the overlap before a stratum is calibrated on its own


def slot_of(date: pd.Series) -> np.ndarray:
    doy = date.dt.dayofyear.to_numpy()
    return (date.dt.year.to_numpy() - Y0) * WPY + np.minimum((doy - 1) // 7, WPY - 1)


class Data:
    pass


def build() -> Data:
    cd = pd.read_parquet(OUT_DIR / "cell_days.parquet")
    cells = pd.read_parquet(OUT_DIR / "cells.parquet")
    cd = cd[(cd["daynight"] == "D") & cd["sensor"].astype(str).isin(["aqua", "terra", "snpp"])]
    snpp_end = cd.loc[cd["sensor"].astype(str) == "snpp", "date"].max()
    snpp_start = cd.loc[cd["sensor"].astype(str) == "snpp", "date"].min()
    cd = cd.merge(cells, on=["cx", "cy"], how="inner")
    cd = cd[cd["date"].dt.year >= Y0]
    cd["slot"] = slot_of(cd["date"])
    cd["sensor"] = cd["sensor"].astype(str)
    g = cd.groupby(["kab_id", "peat", "sensor", "slot"], as_index=False).agg(fd=("n", "size"), cnt=("n", "sum"), frp=("max_frp", "sum"))

    combos = cells[["kab_id", "kab", "prov", "island"]].drop_duplicates("kab_id")
    pk = cd[["kab_id", "peat"]].drop_duplicates()
    combos = pk.merge(combos, on="kab_id").sort_values(["prov", "kab", "peat"]).reset_index(drop=True)
    cidx = {(a, b): i for i, (a, b) in enumerate(zip(combos["kab_id"], combos["peat"]))}
    D = Data()
    D.combos = combos
    D.fd, D.cnt, D.frp = {}, {}, {}
    for s in ["aqua", "terra", "snpp"]:
        D.fd[s] = np.zeros((len(combos), NSLOT))
        D.cnt[s] = np.zeros((len(combos), NSLOT))
        gs = g[g["sensor"] == s]
        ii = np.array([cidx[(a, b)] for a, b in zip(gs["kab_id"], gs["peat"])])
        D.fd[s][ii, gs["slot"].to_numpy()] = gs["fd"].to_numpy()
        D.cnt[s][ii, gs["slot"].to_numpy()] = gs["cnt"].to_numpy()
        if s == "snpp":  # FRP (MW): sum over cell-days of the daily maximum FRP in each cell. VIIRS era only.
            D.frp[s] = np.zeros((len(combos), NSLOT))
            D.frp[s][ii, gs["slot"].to_numpy()] = gs["frp"].fillna(0).to_numpy()

    doy_end = snpp_end.dayofyear
    s_end = (snpp_end.year - Y0) * WPY + min((doy_end - 1) // 7, WPY - 1)
    complete = ((doy_end - 1) % 7 == 6) or ((doy_end - 1) // 7 >= WPY - 1 and doy_end >= 365)
    D.LAST = int(s_end if complete else s_end - 1)  # last complete slot
    D.S0 = int(((snpp_start.year - Y0) * WPY + min((snpp_start.dayofyear - 1) // 7, WPY - 1)) + 1)
    nat_aqua = D.fd["aqua"].sum(0)
    D.A0 = int(np.argmax(nat_aqua > 0) + 1)
    D.TA_END = (2019 - Y0 + 1) * WPY - 1
    D.snpp_end = snpp_end
    # Stratum label: the province when it has enough Aqua fire-days on the overlap, else its island group.
    ov = D.fd["aqua"][:, D.S0 : D.LAST + 1].sum(1)
    prov_ov = pd.Series(ov).groupby(combos["prov"].to_numpy()).sum()
    label = np.where(combos["prov"].map(prov_ov).to_numpy() >= PROV_MIN, combos["prov"], combos["island"])
    D.combos["stratum"] = label
    strata = sorted(set(zip(label, combos["peat"])))
    D.strata = strata
    sid = {s: i for i, s in enumerate(strata)}
    D.sidx = np.array([sid[(a, b)] for a, b in zip(label, combos["peat"])])
    D.peat_known = bool((combos["peat"] != "unknown").any())
    # M_eff: Aqua where available, else Terra scaled to Aqua per stratum
    ns = len(strata)
    kta = np.ones(ns)
    sl = slice(D.A0, D.TA_END + 1)
    for s in range(ns):
        m = D.sidx == s
        a, t = D.fd["aqua"][m][:, sl].sum(), D.fd["terra"][m][:, sl].sum()
        kta[s] = a / t if t > 0 else 1.0
    D.kta = kta
    D.meff = D.fd["aqua"].copy()
    pre = np.arange(NSLOT) < D.A0
    D.meff[:, pre] = D.fd["terra"][:, pre] * kta[D.sidx][:, None]
    return D


def strata_sum(D, arr):
    out = np.zeros((len(D.strata), arr.shape[1]))
    np.add.at(out, D.sidx, arr)
    return out


def calibrate(D, train_slots, boot=0, seed=0):
    """Return k [nstrata] (and kb [nstrata, boot] bootstrap draws resampling YEARS) from VIIRS/Aqua on train_slots."""
    train_slots = np.asarray(train_slots)
    Ms = strata_sum(D, D.fd["aqua"])
    Vs = strata_sum(D, D.fd["snpp"])
    peat = np.array([p for _, p in D.strata])
    years = (train_slots // WPY) + Y0
    uy = np.unique(years)
    My = np.stack([Ms[:, train_slots[years == y]].sum(1) for y in uy], 1)  # [ns, ny]
    Vy = np.stack([Vs[:, train_slots[years == y]].sum(1) for y in uy], 1)

    def ratio(My_, Vy_):
        m, v = My_.sum(1), Vy_.sum(1)
        k = np.where(m >= THIN, v / np.maximum(m, 1), np.nan)
        for p in np.unique(peat):  # thin strata: pool within peat class
            sel = peat == p
            pooled = v[sel].sum() / max(m[sel].sum(), 1)
            k[sel & np.isnan(k)] = pooled
        return k

    k = ratio(My, Vy)
    if not boot:
        return k
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(uy), size=(boot, len(uy)))
    kb = np.stack([ratio(My[:, i], Vy[:, i]) for i in idx], 1)
    return k, kb


def area_groups(D):
    """level -> list of (id, name, parent, combo indices)."""
    from geo_lib import slug

    c = D.combos
    out = {"nation": [("indonesia", "Indonesia", None, np.arange(len(c)))], "province": [], "kabupaten": []}
    for p, sub in c.groupby("prov"):
        out["province"].append((slug(p), p, "indonesia", sub.index.to_numpy()))
    seen = set()
    for kid, sub in c.groupby("kab_id"):
        r = sub.iloc[0]
        base = f"{slug(r['prov'])}--{slug(r['kab'])}"
        aid = base if base not in seen else f"{base}-{kid[:6]}"
        seen.add(aid)
        out["kabupaten"].append((aid, r["kab"], slug(r["prov"]), sub.index.to_numpy()))
    return out


def area_series(D, idx, k, kb=None):
    """Weekly series for one area. Returns dict of arrays of length NSLOT (NaN where not available)."""
    nan = np.full(NSLOT, np.nan)
    h, chk, lo, hi = nan.copy(), nan.copy(), nan.copy(), nan.copy()
    sidx = D.sidx[idx]
    back = np.zeros(NSLOT)
    Hb = None
    for s in np.unique(sidx):
        mem = idx[sidx == s]
        Ms = D.meff[mem].sum(0)
        back += k[s] * Ms
        if kb is not None:
            part = kb[s][:, None] * Ms[None, : D.S0]
            Hb = part if Hb is None else Hb + part
    obs = D.fd["snpp"][idx].sum(0)
    h[: D.S0] = back[: D.S0]
    h[D.S0 : D.LAST + 1] = obs[D.S0 : D.LAST + 1]
    chk[D.S0 : D.LAST + 1] = back[D.S0 : D.LAST + 1]
    if Hb is not None:
        lo[: D.S0], hi[: D.S0] = np.quantile(Hb, [0.05, 0.95], axis=0)
        lo[D.S0 : D.LAST + 1] = hi[D.S0 : D.LAST + 1] = obs[D.S0 : D.LAST + 1]
    m = D.fd["aqua"][idx].sum(0).astype(float)
    m[: D.A0] = np.nan
    v = obs.astype(float)
    v[: D.S0] = np.nan
    cnt = np.where(
        np.arange(NSLOT) < D.A0, D.cnt["terra"][idx].sum(0),
        np.where(np.arange(NSLOT) < D.S0, D.cnt["aqua"][idx].sum(0), D.cnt["snpp"][idx].sum(0)),
    ).astype(float)
    for a in (m, v, cnt, chk):
        a[D.LAST + 1 :] = np.nan
    return dict(h=h, lo=lo, hi=hi, chk=chk, m=m, v=v, cnt=cnt)


def percentile_rank(h, base_years, D):
    """Weekly percentile of every year's value against the same week in base_years (rank, mid-rank for ties)."""
    H = h.reshape(-1, WPY)
    ys = np.arange(Y0, Y0 + H.shape[0])
    B = H[np.isin(ys, base_years)]  # [nb, 52]
    out = np.full(H.shape, np.nan)
    for w in range(WPY):
        col = B[:, w]
        col = col[~np.isnan(col)]
        if len(col) == 0:
            continue
        x = H[:, w][:, None]
        out[:, w] = 100 * ((col[None, :] < x).sum(1) + 0.5 * (col[None, :] == x).sum(1)) / len(col)
    out[np.isnan(H)] = np.nan
    return out.reshape(-1)


def periods(h, years):
    """Onset / peak / end week (1-52): first week where cumulative fire-days reach 10 / 50 / 90 % of the year total."""
    H = h.reshape(-1, WPY)
    res = {}
    for y in years:
        row = H[y - Y0]
        row = row[~np.isnan(row)]
        tot = row.sum()
        if tot <= 0:
            continue
        c = np.cumsum(row) / tot
        res[y] = [int(np.argmax(c >= q) + 1) for q in (0.10, 0.50, 0.90)]
    return res
