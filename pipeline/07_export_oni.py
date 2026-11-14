"""Step 7: export the Oceanic Nino Index (ONI) for the El Nino marker (FR-17).

Reads  : RAW_DIR/oni.ascii.txt or RAW_DIR/peat/oni.ascii.txt (NOAA CPC, columns SEAS YR TOTAL ANOM)
Writes : <repo>/public/data/oni.json  {source, years: {year: {season: anom}}, jas: {year: anom}}

The marker in the app uses the Jul-Aug-Sep (JAS) season: El Nino when ONI >= 0.5, La Nina when <= -0.5.
Run:  python pipeline/07_export_oni.py
"""
import json

from config import RAW_DIR, REPO

SRC = next((p for p in (RAW_DIR / "oni.ascii.txt", RAW_DIR / "peat" / "oni.ascii.txt") if p.exists()), None)


def main():
    if SRC is None:
        raise SystemExit("oni.ascii.txt not found in " + str(RAW_DIR))
    years = {}
    for line in SRC.read_text().splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 4:
            seas, yr, _, anom = parts[:4]
            years.setdefault(yr, {})[seas] = float(anom)
    out = dict(source="NOAA CPC ONI (oni.ascii.txt), ERSST-based, 3-month running mean of Nino 3.4 anomalies",
               years=years, jas={y: v["JAS"] for y, v in years.items() if "JAS" in v})
    (REPO / "public" / "data" / "oni.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print("Wrote oni.json:", len(out["jas"]), "years; last JAS:", max(out["jas"]), out["jas"][max(out["jas"])])


if __name__ == "__main__":
    main()
