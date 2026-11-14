"""Step 1: read the four FIRMS downloads (archive + NRT) and write one Parquet table.

Output: OUT_DIR/cell_days.parquet, one row per
    (sensor, local solar date, 0.05 deg cell, day/night)
with the detection count and the maximum FRP.

Filters (from the PRD):
  - vegetation fires only (type 0) -- the NRT files have no type column, so NRT rows are kept as they are
  - MODIS confidence >= 30; VIIRS confidence nominal ('n') or high ('h')
  - local solar date = UTC time + longitude / 15 hours

Run:  python pipeline/01_load_firms.py
"""
import sys
import time

import numpy as np
import pandas as pd

from config import CELL_DEG, OUT_DIR, RAW_DIR, SENSOR

CHUNK = 500_000
KEYS = ["sensor", "date", "cx", "cy", "daynight"]


def process(df: pd.DataFrame) -> pd.DataFrame:
    if "type" in df.columns:
        df = df[df["type"] == 0]
    is_modis = df["instrument"] == "MODIS"
    conf = df["confidence"].astype(str)
    keep = np.where(is_modis, pd.to_numeric(conf, errors="coerce") >= 30, conf.isin(["n", "h"]))
    df = df[keep]
    t = df["acq_time"].astype(int)
    utc = pd.to_datetime(df["acq_date"]) + pd.to_timedelta(t // 100 * 60 + t % 100, unit="m")
    local = utc + pd.to_timedelta(df["longitude"] / 15.0, unit="h")
    out = pd.DataFrame(
        {
            "sensor": df["satellite"].map(SENSOR),
            "date": local.dt.floor("D"),
            "cx": np.floor(df["longitude"] / CELL_DEG).astype("int32"),
            "cy": np.floor(df["latitude"] / CELL_DEG).astype("int32"),
            "daynight": df["daynight"],
            "n": 1,
            "frp": df["frp"],
        }
    )
    return out.groupby(KEYS, as_index=False, observed=True).agg(n=("n", "sum"), max_frp=("frp", "max"))


def main():
    files = sorted(RAW_DIR.glob("DL_FIRE_*/fire_*.csv"))
    if not files:
        sys.exit(f"No FIRMS CSV files under {RAW_DIR}. Set KALAAPI_DATA_DIR.")
    parts = []
    for f in files:
        t0 = time.time()
        rows = 0
        for chunk in pd.read_csv(f, chunksize=CHUNK, dtype={"acq_time": str, "confidence": str}):
            rows += len(chunk)
            parts.append(process(chunk))
        print(f"{f.name}: {rows:,} rows in {time.time() - t0:.0f} s")
    allp = pd.concat(parts, ignore_index=True)
    allp = allp.groupby(KEYS, as_index=False).agg(n=("n", "sum"), max_frp=("max_frp", "max"))
    allp["sensor"] = allp["sensor"].astype("category")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "cell_days.parquet"
    allp.to_parquet(out, index=False)
    print(f"Wrote {len(allp):,} cell-day rows to {out}")


if __name__ == "__main__":
    main()
