"""Step 4: tag every 0.05 deg cell with kabupaten, province, island group and peat flag (FR-05).

Reads  : OUT_DIR/cell_days.parquet, RAW_DIR/boundaries/*.geojson, optional RAW_DIR/peat/* polygons
Writes : OUT_DIR/cells.parquet  (cx, cy, kab_id, kab, prov, island, peat)

peat is 'peat' or 'mineral' when peat data exists in RAW_DIR/peat, else 'unknown'.
Peat data can be polygons (.geojson/.json/.gpkg/.shp) or GFW 10x10 degree GeoTIFF tiles (.tif, 30 m, 1 = peat).
For tiles, a 0.05 deg cell is 'peat' when at least PEAT_MIN_FRAC of its 30 m pixels are peat.
Cells that fall just outside the simplified coast line go to the nearest kabupaten within 0.2 deg;
cells farther away are dropped (open sea).

Run:  python pipeline/04_tag_cells.py
"""
import warnings

import geopandas as gpd
import numpy as np
import pandas as pd

from config import CELL_DEG, OUT_DIR, RAW_DIR
from geo_lib import load_admin

warnings.simplefilter("ignore")
MAX_SNAP_DEG = 0.2
PEAT_MIN_FRAC = 0.5  # share of 30 m peat pixels in a cell for the cell to count as peat


def peat_fraction_from_tiles(tifs, cells):
    """Return an array with the peat share (0-1) of each cell, or NaN where no tile covers it.

    Works when the tile grid lines up with the 0.05 deg cells (GFW tiles do: 10 deg tiles, 0.00025 deg pixels).
    """
    import rasterio

    frac = np.full(len(cells), np.nan)
    ox = cells["cx"].to_numpy() * CELL_DEG   # cell west edge
    oy = (cells["cy"].to_numpy() + 1) * CELL_DEG  # cell north edge
    for tif in tifs:
        with rasterio.open(tif) as src:
            b = src.bounds
            res = src.res[0]
            k = int(round(CELL_DEG / res))  # pixels per cell side
            if abs(k * res - CELL_DEG) > 1e-9:
                print("  skip", tif.name, "pixel size does not divide the cell size")
                continue
            ncol, nrow = src.width // k, src.height // k
            grid = np.zeros((nrow, ncol), dtype=np.float32)
            for r0 in range(0, nrow, 20):  # 20 cell rows at a time
                r1 = min(r0 + 20, nrow)
                a = src.read(1, window=((r0 * k, r1 * k), (0, ncol * k))) == 1
                grid[r0:r1] = a.reshape(r1 - r0, k, ncol, k).mean(axis=(1, 3))
            inside = (ox >= b.left - 1e-9) & (ox < b.right - 1e-9) & (oy <= b.top + 1e-9) & (oy > b.bottom + 1e-9)
            ci = np.rint((ox[inside] - b.left) / CELL_DEG).astype(int)
            ri = np.rint((b.top - oy[inside]) / CELL_DEG).astype(int)
            ok = (ci >= 0) & (ci < ncol) & (ri >= 0) & (ri < nrow)
            idx = np.flatnonzero(inside)[ok]
            frac[idx] = grid[ri[ok], ci[ok]]
            print(f"  {tif.name}: {ok.sum():,} cells, {int((grid > PEAT_MIN_FRAC).sum()):,} peat cells in tile")
    return frac


def main():
    cd = pd.read_parquet(OUT_DIR / "cell_days.parquet", columns=["cx", "cy"])
    cells = cd.drop_duplicates().reset_index(drop=True)
    print(f"{len(cells):,} unique cells")
    kab, prov = load_admin()
    pts = gpd.GeoDataFrame(
        cells,
        geometry=gpd.points_from_xy((cells["cx"] + 0.5) * CELL_DEG, (cells["cy"] + 0.5) * CELL_DEG),
        crs="EPSG:4326",
    )
    cols = ["kab_id", "kab", "prov", "island"]
    j = gpd.sjoin(pts, kab[cols + ["geometry"]], how="left", predicate="within")
    j = j[~j.index.duplicated()]
    miss = j["kab_id"].isna()
    print(f"{miss.sum():,} cells outside polygons; snapping to nearest within {MAX_SNAP_DEG} deg")
    if miss.any():
        near = gpd.sjoin_nearest(pts.loc[miss], kab[cols + ["geometry"]], how="left", max_distance=MAX_SNAP_DEG)
        near = near[~near.index.duplicated()]
        for c in cols:
            j.loc[near.index, c] = near[c]
    out = j[["cx", "cy"] + cols].dropna(subset=["kab_id"]).copy()
    print(f"{len(out):,} cells kept, {out['prov'].nunique()} provinces, {out['kab_id'].nunique()} kabupaten")

    peat_dir = RAW_DIR / "peat"
    peat_files = [p for ext in ("*.geojson", "*.json", "*.gpkg", "*.shp") for p in peat_dir.glob(ext)]
    tifs = sorted(peat_dir.glob("*.tif"))
    out["peat"] = "unknown"
    if tifs:
        print("peat tiles:", [p.name for p in tifs])
        frac = peat_fraction_from_tiles(tifs, out)
        out["peat_frac"] = frac
        known = ~np.isnan(frac)
        out.loc[known, "peat"] = np.where(frac[known] >= PEAT_MIN_FRAC, "peat", "mineral")
        print(out["peat"].value_counts().to_string())
        print(f"{(~known).sum():,} cells have no tile; they stay 'unknown'")
    elif peat_files:
        print("peat files:", [p.name for p in peat_files])
        polys = pd.concat([gpd.read_file(p).to_crs("EPSG:4326")[["geometry"]] for p in peat_files], ignore_index=True)
        polys = gpd.GeoDataFrame(polys, crs="EPSG:4326")
        pp = pts.loc[out.index]
        hit = gpd.sjoin(pp[["geometry"]], polys, how="inner", predicate="within")
        is_peat = out.index.isin(hit.index.unique())
        out["peat"] = np.where(is_peat, "peat", "mineral")
        print(out["peat"].value_counts().to_string())
    else:
        print("No peat data in", peat_dir, "-> peat flag is 'unknown'. Add polygons or .tif tiles and rerun this step.")
    out.to_parquet(OUT_DIR / "cells.parquet", index=False)
    print("Wrote", OUT_DIR / "cells.parquet")


if __name__ == "__main__":
    main()
