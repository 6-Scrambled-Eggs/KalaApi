"""Step 11: 'right now' strip from the NASA FIRMS API (NOAA-20 and NOAA-21 VIIRS, near real time).
Reads FIRMS_MAP_KEY from the environment (never written to any file). Writes public/data/live.json.
Counts daytime, nominal/high-confidence fire-days (0.05 degree cells) for the last 5 days, per province.
This is NOT part of the calibrated series: it uses other satellites and is shown separately.
If the key is missing or the API fails, the script exits 0 and leaves any existing live.json untouched."""
import csv, io, json, os, sys, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

R = Path(__file__).resolve().parent.parent
KEY = os.environ.get("FIRMS_MAP_KEY", "").strip()
SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]
BBOX = "94,-12,142,7"  # west,south,east,north
DAYS = 5


def fetch(src, text=None):
    if text is not None:
        return text
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{src}/{BBOX}/{DAYS}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def main(fake=None):
    if not KEY and fake is None:
        print("FIRMS_MAP_KEY not set: skipping live strip"); return 0
    cells = set()  # (cell_x, cell_y, date)
    used = []
    for src in SOURCES:
        try:
            txt = fetch(src, None if fake is None else fake)
        except Exception as e:  # network or key problem: keep the old file
            print(f"{src}: failed ({type(e).__name__}); keeping old live.json"); continue
        rows = list(csv.DictReader(io.StringIO(txt)))
        if not rows or "latitude" not in rows[0]:
            print(f"{src}: unexpected response, skipping"); continue
        used.append(src)
        for r in rows:
            if r.get("daynight") != "D" or r.get("confidence", "").lower() not in ("n", "h", "nominal", "high"):
                continue
            lat, lon = float(r["latitude"]), float(r["longitude"])
            cells.add((int(lon // 0.05), int(lat // 0.05), r["acq_date"]))
    if not used:
        return 0
    from shapely.geometry import Point, shape
    from shapely.strtree import STRtree
    gj = json.load(open(R / "public/data/provinces.geojson"))
    geoms = [shape(f["geometry"]) for f in gj["features"]]
    props = [f["properties"] for f in gj["features"]]
    tree = STRtree(geoms)
    per_prov, per_day = defaultdict(int), defaultdict(int)
    inside = 0
    for cx, cy, d in cells:
        p = Point((cx + 0.5) * 0.05, (cy + 0.5) * 0.05)
        hit = [i for i in tree.query(p) if geoms[i].contains(p)]
        if hit:
            per_prov[props[hit[0]]["id"]] += 1; per_day[d] += 1; inside += 1
    name = {p["id"]: p["name"] for p in props}
    out = dict(
        generated=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), sources=used, days=DAYS,
        note="Daytime NOAA-20/21 VIIRS, nominal or high confidence, 0.05 degree cell-days inside Indonesian provinces. Not part of the harmonized series.",
        national=inside,
        daily=[dict(date=d, fire_days=per_day[d]) for d in sorted(per_day)],
        provinces=[dict(id=i, name=name[i], fire_days=n) for i, n in sorted(per_prov.items(), key=lambda kv: -kv[1])][:10],
    )
    json.dump(out, open(R / "public/data/live.json", "w"))
    print(f"live.json: {inside} fire-days, {len(per_prov)} provinces, sources {used}")
    return 0


if __name__ == "__main__":
    fake = None
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        KEY = "x"
        fake = ("latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,bright_ti5,frp,daynight\n"
                "-2.0,114.0,340,0.4,0.4,2026-11-13,0600,N20,VIIRS,n,300,5,D\n-2.01,114.01,340,0.4,0.4,2026-11-13,0600,N20,VIIRS,h,300,5,D\n"
                "-2.0,114.0,340,0.4,0.4,2026-11-14,0600,N20,VIIRS,l,300,5,D\n0.5,101.5,340,0.4,0.4,2026-11-14,0600,N20,VIIRS,n,300,5,N\n"
                "0.5,101.5,340,0.4,0.4,2026-11-14,0600,N20,VIIRS,n,300,5,D\n")
    sys.exit(main(fake))
