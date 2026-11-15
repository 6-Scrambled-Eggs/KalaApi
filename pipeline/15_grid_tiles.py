"""Step 15: cell-week tiles for the custom-area tool (public/data/grid/<lat>_<lon>.json).

One tile = one 1 x 1 degree block (name = south-west corner, e.g. -2_113.json). Inside a tile each 0.05 degree cell
has weekly values, stored sparsely (only weeks with any detection). Per cell and week:
  h = harmonized fire-days (before the first full S-NPP week: the combo's back-cast total shared out to its cells by
      their own MODIS-equivalent fire-days; later: observed S-NPP VIIRS fire-days),
  m = raw Aqua MODIS fire-days, v = raw S-NPP VIIRS fire-days.
Cells add up to the same area totals as the weekly files (same model, same filters). Weeks run to the last complete week.

Tile JSON columns (all arrays have one entry per cell-week, sorted by cell then slot):
  c = cell index in the tile (delta from the previous entry), s = slot (delta within a cell; slot = (year-2001)*52 + week-1),
  h = harmonized x100 (integer), m = Aqua fire-days, v = VIIRS fire-days.
Run after 05_harmonize.py:  python pipeline/15_grid_tiles.py
"""
import json
import shutil

import numpy as np
import pandas as pd

from config import CELL_DEG, REPO
from harmonize_lib import NSLOT, build, calibrate_power, backcast

OUT = REPO / "public" / "data" / "grid"
TILE = 1.0
PER = int(round(TILE / CELL_DEG))  # 20 cells per side


def main():
    D = build()
    train = np.arange(D.S0, D.LAST + 1)
    b, alpha = calibrate_power(D, train)
    vhat = backcast(D, b, alpha)
    cidx = {(a, p): i for i, (a, p) in enumerate(zip(D.combos["kab_id"], D.combos["peat"]))}
    gc = D.gc[D.gc["slot"] <= D.LAST].copy()
    gc["ci"] = [cidx[(a, p)] for a, p in zip(gc["kab_id"], gc["peat"])]
    key = ["cx", "cy", "ci", "slot"]

    def part(sensor, name):
        g = gc[gc["sensor"] == sensor][key + ["fd"]]
        return g.rename(columns={"fd": name})

    aq, te, sn = part("aqua", "aq"), part("terra", "te"), part("snpp", "sn")
    t = aq.merge(te, on=key, how="outer").merge(sn, on=key, how="outer").fillna(0)
    t["slot"] = t["slot"].astype(int)
    # MODIS-equivalent fire-days of the cell (Aqua; Terra scaled to Aqua before Aqua exists)
    kta = D.kta[D.sidx[t["ci"].to_numpy()]]
    t["me"] = np.where(t["slot"] < D.A0, t["te"] * kta, t["aq"])
    tot = D.meff[t["ci"].to_numpy(), t["slot"].to_numpy()]
    share = np.where(tot > 0, t["me"] / np.maximum(tot, 1e-12), 0.0)
    back = vhat[t["ci"].to_numpy(), t["slot"].to_numpy()] * share
    t["h"] = np.where(t["slot"] < D.S0, back, t["sn"])
    t["m"] = np.where(t["slot"] >= D.A0, t["aq"], 0).astype(int)  # raw Aqua only exists from its start
    t["v"] = t["sn"].astype(int)
    t = t[(t["h"] > 0) | (t["m"] > 0) | (t["v"] > 0)]
    t["lat"] = np.floor((t["cy"] + 0.5) * CELL_DEG / TILE).astype(int)
    t["lon"] = np.floor((t["cx"] + 0.5) * CELL_DEG / TILE).astype(int)
    t["ix"] = t["cx"] - (t["lon"] * PER)
    t["iy"] = t["cy"] - (t["lat"] * PER)
    t["cell"] = t["iy"] * PER + t["ix"]
    t = t.sort_values(["lat", "lon", "cell", "slot"])
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    index, biggest, total_bytes = [], 0, 0
    for (la, lo), g in t.groupby(["lat", "lon"]):
        cell = g["cell"].to_numpy()
        slot = g["slot"].to_numpy()
        newc = np.r_[True, cell[1:] != cell[:-1]]
        c = np.where(newc, np.r_[cell[0], np.diff(cell)], 0)
        s = np.where(newc, slot, np.r_[0, np.diff(slot)])
        rec = dict(lat=int(la), lon=int(lo), n=int(len(g)), per=PER, deg=CELL_DEG, c=c.tolist(), s=s.tolist(),
                   h=np.round(g["h"].to_numpy() * 100).astype(int).tolist(), m=g["m"].tolist(), v=g["v"].tolist())
        txt = json.dumps(rec, separators=(",", ":"))
        (OUT / f"{la}_{lo}.json").write_text(txt, encoding="utf-8")
        biggest = max(biggest, len(txt))
        total_bytes += len(txt)
        index.append(f"{la}_{lo}")
    (OUT / "index.json").write_text(json.dumps(dict(tiles=index, last_slot=int(D.LAST), tile_deg=TILE, a0=int(D.A0), s0=int(D.S0)), separators=(",", ":")))
    print(f"{len(index)} tiles, {len(t)} cell-weeks, total {total_bytes / 1e6:.1f} MB raw, biggest {biggest / 1e6:.2f} MB")
    # check: tile sums vs weekly national file
    nat = json.loads((REPO / "public" / "data" / "areas" / "indonesia.json").read_text())
    hw = np.nansum(np.array([x if x is not None else np.nan for x in nat["h"]], dtype=float)[: D.LAST + 1])
    print(f"harmonized total: tiles {t['h'].sum():.0f} vs national weekly {hw:.0f} (gap {100 * (t['h'].sum() / hw - 1):.3f}%)")


if __name__ == "__main__":
    main()
