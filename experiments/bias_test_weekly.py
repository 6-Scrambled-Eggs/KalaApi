"""Weekly-level LOYO test: fixed ratio vs shared-exponent power law (V = a_p * M^b) applied to weekly province sums."""
import os
import numpy as np, pandas as pd
D = os.environ["KALAAPI_DATA_DIR"] + "/processed/"
cd = pd.read_parquet(D + "cell_days.parquet")
cells = pd.read_parquet(D + "cells.parquet")[["cx", "cy", "prov"]]
cd = cd[(cd.daynight == "D") & cd.sensor.astype(str).isin(["aqua", "snpp"]) & (cd.date >= "2013-01-01") & (cd.date <= "2025-12-31")]
cd = cd.merge(cells, on=["cx", "cy"]); cd["sensor"] = cd.sensor.astype(str)
cd["slot"] = (cd.date.dt.year - 2013) * 52 + np.minimum((cd.date.dt.dayofyear - 1) // 7, 51)
provs = sorted(cd.prov.unique()); pi = {p: i for i, p in enumerate(provs)}
NS = 13 * 52
def mat(sensor):
    a = np.zeros((len(provs), NS)); g = cd[cd.sensor == sensor].groupby(["prov", "slot"]).size()
    for (p, s), n in g.items(): a[pi[p], s] = n
    return a
M, V = mat("aqua"), mat("snpp")
Y = 13
def annual(a): return a.reshape(len(provs), Y, 52).sum(2)
Vy = annual(V)
def run(model):
    pred = np.zeros_like(V)
    for j in range(Y):
        te = slice(j * 52, (j + 1) * 52)
        tr = np.ones(NS, bool); tr[te] = False
        if model == "fixed":
            k = V[:, tr].sum(1) / np.maximum(M[:, tr].sum(1), 1)
            pred[:, te] = k[:, None] * M[:, te]
        else:
            best = None
            for b in np.arange(0.60, 1.101, 0.025):
                Mb = M[:, tr] ** b
                alpha = V[:, tr].sum(1) / np.maximum(Mb.sum(1), 1e-9)
                mu = alpha[:, None] * Mb
                v = V[:, tr]
                dev = 2 * np.sum(np.where(v > 0, v * np.log(np.maximum(v, 1e-9) / np.maximum(mu, 1e-9)), 0) - (v - mu))
                if best is None or dev < best[0]: best = (dev, b, alpha)
            _, b, alpha = best
            pred[:, te] = alpha[:, None] * (M[:, te] ** b)
    return pred, b if model != "fixed" else None
for model in ["fixed", "power"]:
    pred, b = run(model)
    Py = annual(pred)
    ok = Vy >= 300
    rel = Py[ok] / Vy[ok] - 1
    med = np.median(Vy, 1)
    quiet = (Vy < med[:, None]) & ok; busy = (Vy >= med[:, None]) & ok
    r = Py / np.maximum(Vy, 1) - 1
    nat_p, nat_v = Py.sum(0), Vy.sum(0)
    nat = nat_p / nat_v - 1
    wr = [np.corrcoef(pred[p], V[p])[0, 1] for p in range(len(provs)) if V[p].sum() > 3000]
    natw = np.corrcoef(pred.sum(0), V.sum(0))[0, 1]
    print(f"{model:6s} n={ok.sum()} med={np.median(rel)*100:.1f}% p50={np.percentile(abs(rel),50)*100:.0f}% p90={np.percentile(abs(rel),90)*100:.0f}% quiet={np.median(r[quiet])*100:.1f}% busy={np.median(r[busy])*100:.1f}% within20={np.mean(abs(rel)<=.2)*100:.0f}% | national yearly err: "
          + " ".join(f"{2013+i}:{nat[i]*100:+.0f}" for i in range(Y)) + f" | median prov weekly r={np.median(wr):.2f} national weekly r={natw:.3f}" + (f" b={b:.2f}" if b else ""))
