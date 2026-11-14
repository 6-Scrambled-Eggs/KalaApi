"""Step 2: the three first-hour checks. Reads cell_days.parquet from step 1.

 1. Detections and fire-days per year and sensor (compare with the FIRMS yearly country CSVs).
 2. The step at 2012: raw MODIS hotspot counts vs raw VIIRS counts.
 3. Is the Aqua MODIS -> S-NPP VIIRS fire-day ratio stable, 2012-2026?

Fire-day = one cell on one day with at least one detection. We use daytime passes only
(afternoon orbit: Aqua, S-NPP, NOAA-20, NOAA-21).

Run:  python pipeline/02_first_hour_checks.py
"""
import pandas as pd

from config import OUT_DIR

pd.set_option("display.width", 160)
df = pd.read_parquet(OUT_DIR / "cell_days.parquet")
df["year"] = df["date"].dt.year
day = df[df["daynight"] == "D"]

print("\n== 1. Detections per year (all passes) ==")
print(df.pivot_table(index="year", columns="sensor", values="n", aggfunc="sum", observed=True).fillna(0).astype(int))

print("\n== 1b. Fire-days per year (daytime cells x days) ==")
fd = day.groupby(["year", "sensor"], observed=True).size().unstack(fill_value=0)
print(fd)

print("\n== 2. The step at 2012: raw hotspot counts, daytime ==")
cnt = day.pivot_table(index="year", columns="sensor", values="n", aggfunc="sum", observed=True)
step = pd.DataFrame({"aqua_detections": cnt["aqua"], "snpp_detections": cnt["snpp"]})
step["aqua_fire_days"] = fd["aqua"]
step["snpp_fire_days"] = fd["snpp"]
print(step.loc[2008:2016])
a, s = step.loc[2012, "aqua_detections"], step.loc[2012, "snpp_detections"]
print(f"2012 (S-NPP from 20 Jan): S-NPP / Aqua detections = {s / a:.1f}x")
a, s = step.loc[2012, "aqua_fire_days"], step.loc[2012, "snpp_fire_days"]
print(f"2012: S-NPP / Aqua fire-days = {s / a:.1f}x  (smaller step than detections = fire-days work)")

print("\n== 3. Ratio S-NPP / Aqua fire-days by year ==")
# S-NPP NRT ends 2026-11-02: cut every sensor at the same date in 2026 for a fair ratio.
cut = day[(day["date"] < "2026-11-03")]
fd2 = cut.groupby(["year", "sensor"], observed=True).size().unstack(fill_value=0)
ratio = (fd2["snpp"] / fd2["aqua"]).loc[2012:2026]
print(ratio.round(2).to_string())
print(f"mean {ratio.mean():.2f}, std {ratio.std():.2f}, min {ratio.min():.2f}, max {ratio.max():.2f}")
print("Read it: a flat line = one constant ratio is fine. A trend = use the linear-in-year fallback (Aqua orbit drift).")
