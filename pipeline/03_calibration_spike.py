"""Step 3: spike test of the harmonization model. Reads cell_days.parquet from step 1.

Question: is one fixed ratio (VIIRS / MODIS) good enough, or must the correction depend
on how active the fire season is?

We compare two models on weekly daytime fire-days per rough region, Aqua MODIS (M) -> S-NPP VIIRS (V):
  fixed   : V = k * M                         (k = sum V / sum M on training weeks)
  loglog  : log(1+V) = a + b * log(1+M)       (with a smearing correction for the back-transform)

Two honest tests:
  A. Holdout: train without 2019 and 2023, predict those two years.
  B. Reverse-time holdout (V-6): train on 2018 onward, predict 2012-2017.

Regions are rough lon/lat boxes for this spike only. Step 6 (province + peat tags) will replace them.

Run:  python pipeline/03_calibration_spike.py
"""
import numpy as np
import pandas as pd

from config import CELL_DEG, OUT_DIR

START = pd.Timestamp("2012-01-23")  # a Monday, just after S-NPP started on 20 Jan 2012
END = pd.Timestamp("2026-11-02")  # last day S-NPP NRT exists


def region(lon, lat):
    r = np.full(len(lon), "rest", dtype=object)
    r[(lon < 106.0) & (lat > -6.5) & (lat < 6.0)] = "sumatra"
    r[(lon > 108.5) & (lon < 119.5) & (lat > -4.5) & (lat < 4.5)] = "kalimantan"
    r[(lon >= 131.0) & (lat > -9.5)] = "papua"
    return r


df = pd.read_parquet(OUT_DIR / "cell_days.parquet")
df = df[(df["daynight"] == "D") & df["sensor"].isin(["aqua", "snpp"]) & (df["date"] >= START) & (df["date"] <= END)]
lon = (df["cx"].to_numpy() + 0.5) * CELL_DEG
lat = (df["cy"].to_numpy() + 0.5) * CELL_DEG
df = df.assign(region=region(lon, lat), sensor=df["sensor"].astype(str))
nweeks = ((END - START).days + 1) // 7
df = df[df["date"] < START + pd.Timedelta(days=7 * nweeks)]
df["wk"] = (df["date"] - START).dt.days // 7

week_year = (START + pd.to_timedelta(np.arange(nweeks) * 7, unit="D")).year.to_numpy()
fd = df.groupby(["region", "sensor", "wk"]).size().unstack("sensor", fill_value=0)


def series(reg):
    s = fd.loc[reg].reindex(range(nweeks), fill_value=0)
    return s["aqua"].to_numpy(float), s["snpp"].to_numpy(float)


def fit_predict(M, V, train, test):
    k = V[train].sum() / M[train].sum()
    fixed = k * M[test]
    x, y = np.log1p(M[train]), np.log1p(V[train])
    b, a = np.polyfit(x, y, 1)
    smear = np.mean(np.exp(y - (a + b * x)))
    loglog = np.clip(np.exp(a + b * np.log1p(M[test])) * smear - 1, 0, None)
    return fixed, loglog, k, a, b


def report(title, train_mask_fn, test_years):
    print(f"\n=== {title} ===")
    rows = []
    tot = {y: [0.0, 0.0, 0.0] for y in test_years}  # true, fixed, loglog (all regions)
    for reg in ["sumatra", "kalimantan", "papua", "rest"]:
        M, V = series(reg)
        test = np.isin(week_year, test_years)
        train = train_mask_fn(week_year)
        fixed, loglog, k, a, b = fit_predict(M, V, train, test)
        yrs = week_year[test]
        errs_f, errs_l = [], []
        for y in test_years:
            m = yrs == y
            t = V[test][m].sum()
            errs_f.append(100 * (fixed[m].sum() - t) / t)
            errs_l.append(100 * (loglog[m].sum() - t) / t)
            tot[y][0] += t
            tot[y][1] += fixed[m].sum()
            tot[y][2] += loglog[m].sum()
        wc_f = np.corrcoef(fixed, V[test])[0, 1]
        wc_l = np.corrcoef(loglog, V[test])[0, 1]
        rows.append(
            dict(region=reg, k=round(k, 2), slope_b=round(b, 2),
                 mean_abs_err_fixed=round(np.mean(np.abs(errs_f)), 1),
                 mean_abs_err_loglog=round(np.mean(np.abs(errs_l)), 1),
                 weekly_r_fixed=round(wc_f, 2), weekly_r_loglog=round(wc_l, 2))
        )
    print(pd.DataFrame(rows).to_string(index=False))
    print("All regions, annual total error (%):  year   fixed   loglog")
    for y in test_years:
        t, f, l = tot[y]
        print(f"                                      {y}  {100 * (f - t) / t:6.1f}  {100 * (l - t) / t:6.1f}")
    print("slope_b < 1 means: the quieter the season, the higher the VIIRS/MODIS ratio. A fixed ratio cannot do that.")


report("A. Holdout 2019 + 2023", lambda wy: ~np.isin(wy, [2019, 2023]), [2019, 2023])
report("B. Reverse-time holdout: train 2018+, predict 2012-2017", lambda wy: wy >= 2018, list(range(2012, 2018)))
