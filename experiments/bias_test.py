"""Experiment: does an FRP threshold on VIIRS (or a different ratio model) remove the quiet-year bias of the fixed ratio?
Leave-one-year-out (LOYO), province-year level, years 2013-2025, daytime S-NPP (V) vs Aqua (M) fire-days."""
import os, sys
import numpy as np, pandas as pd
D = os.environ["KALAAPI_DATA_DIR"] + "/processed/"
cd = pd.read_parquet(D + "cell_days.parquet")
cells = pd.read_parquet(D + "cells.parquet")[["cx", "cy", "prov", "peat"]]
cd = cd[(cd.daynight == "D") & cd.sensor.astype(str).isin(["aqua", "snpp"]) & (cd.date >= "2013-01-01") & (cd.date <= "2025-12-31")]
cd = cd.merge(cells, on=["cx", "cy"])
cd["year"] = cd.date.dt.year; cd["sensor"] = cd.sensor.astype(str)
M = cd[cd.sensor == "aqua"].groupby(["prov", "year"]).size().unstack(fill_value=0)
V = {}
for T in [0, 3, 5, 8, 12, 20, 30]:
    v = cd[(cd.sensor == "snpp") & (cd.max_frp.fillna(0) >= T)]
    V[T] = v.groupby(["prov", "year"]).size().unstack(fill_value=0)
provs = M.index; years = list(range(2013, 2026))
def stats(pred, obs, label):
    ok = obs >= 300
    rel = (pred[ok] / obs[ok]) - 1
    med = np.median(obs.reshape(len(provs), -1), axis=1)
    quiet = (obs < med[:, None]) & ok
    busy = (obs >= med[:, None]) & ok
    r = pred / np.maximum(obs, 1) - 1
    print(f"{label:28s} n={ok.sum():3d} med={np.median(rel)*100:6.1f}% |p50|={np.percentile(abs(rel),50)*100:4.0f}% |p90|={np.percentile(abs(rel),90)*100:4.0f}% quiet={np.median(r[quiet])*100:6.1f}% busy={np.median(r[busy])*100:6.1f}% within20={np.mean(abs(rel)<=.2)*100:3.0f}%")
Mm = M.reindex(provs)[years].to_numpy().astype(float)
for T, Vt in V.items():
    Vm = Vt.reindex(provs).fillna(0)[years].to_numpy().astype(float)
    # (a) fixed ratio per province, LOYO
    pred = np.zeros_like(Vm)
    for j in range(len(years)):
        tr = [i for i in range(len(years)) if i != j]
        k = Vm[:, tr].sum(1) / np.maximum(Mm[:, tr].sum(1), 1)
        pred[:, j] = k * Mm[:, j]
    stats(pred, Vm, f"fixed k, FRP>={T}")
    # (b) power law V = a*M^b per province, LOYO (log-log OLS), only for T=0 and T=8
    if T in (0, 8):
        pred2 = np.zeros_like(Vm)
        for p in range(len(provs)):
            for j in range(len(years)):
                tr = [i for i in range(len(years)) if i != j and Mm[p, i] > 0 and Vm[p, i] > 0]
                if len(tr) < 6: pred2[p, j] = Vm[p, tr].sum() / max(Mm[p, tr].sum(), 1) * Mm[p, j] if tr else 0; continue
                b, a = np.polyfit(np.log(Mm[p, tr]), np.log(Vm[p, tr]), 1)
                pred2[p, j] = np.exp(a + b * np.log(max(Mm[p, j], 1)))
        stats(pred2, Vm, f"power law, FRP>={T}")
        # (c) pooled power law across provinces (one exponent, province intercept)
        pred3 = np.zeros_like(Vm)
        for j in range(len(years)):
            tr = [i for i in range(len(years)) if i != j]
            X, Y, P = [], [], []
            for p in range(len(provs)):
                for i in tr:
                    if Mm[p, i] > 0 and Vm[p, i] > 0: X.append(np.log(Mm[p, i])); Y.append(np.log(Vm[p, i])); P.append(p)
            X, Y, P = map(np.array, (X, Y, P))
            xm = np.array([X[P == p].mean() if (P == p).any() else 0 for p in range(len(provs))]); ym = np.array([Y[P == p].mean() if (P == p).any() else 0 for p in range(len(provs))])
            b = ((X - xm[P]) * (Y - ym[P])).sum() / ((X - xm[P]) ** 2).sum()
            for p in range(len(provs)):
                pred3[p, j] = np.exp(ym[p] + b * (np.log(max(Mm[p, j], 1)) - xm[p])) if (P == p).any() else 0
        stats(pred3, Vm, f"pooled-slope power, FRP>={T}")
        print("   pooled exponent b (last fit) = %.2f" % b)
