"""Step 4: tag every 0.05 deg cell with kabupaten, province, island group and peat flag (FR-05).

Reads  : OUT_DIR/cell_days.parquet, RAW_DIR/boundaries/*.geojson, optional RAW_DIR/peat/* polygons
Writes : OUT_DIR/cells.parquet  (cx, cy, kab_id, kab, prov, island, peat)

peat is 'peat' or 'mineral' when a peat polygon file exists in RAW_DIR/peat, else 'unknown'.
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

    peat_files = [p for ext in ("*.geojson", "*.json", "*.gpkg", "*.shp") for p in (RAW_DIR / "peat").glob(ext)]
    out["peat"] = "unknown"
    if peat_files:
        print("peat files:", [p.name for p in peat_files])
        polys = pd.concat([gpd.read_file(p).to_crs("EPSG:4326")[["geometry"]] for p in peat_files], ignore_index=True)
        polys = gpd.GeoDataFrame(polys, crs="EPSG:4326")
        pp = pts.loc[out.index]
        hit = gpd.sjoin(pp[["geometry"]], polys, how="inner", predicate="within")
        is_peat = out.index.isin(hit.index.unique())
        out["peat"] = np.where(is_peat, "peat", "mineral")
        print(out["peat"].value_counts().to_string())
    else:
        print("No peat polygons in", RAW_DIR / "peat", "-> peat flag is 'unknown'. Add a file and rerun this step.")
    out.to_parquet(OUT_DIR / "cells.parquet", index=False)
    print("Wrote", OUT_DIR / "cells.parquet")


if __name__ == "__main__":
    main()
