"""Admin boundaries: 38 provinces (Papua split into 6 by kabupaten), island groups, slugs."""
import re
import warnings

import geopandas as gpd
import pandas as pd

from config import RAW_DIR

BOUND = RAW_DIR / "boundaries"

# geoBoundaries ADM1 has 34 provinces (the 2022 Papua split is missing). Split Papua and West Papua by kabupaten name.
NEW_PAPUA = {
    "Papua Selatan": ["Merauke", "Boven Digoel", "Mappi", "Asmat"],
    "Papua Tengah": ["Nabire", "Paniai", "Mimika", "Puncak Jaya", "Puncak", "Dogiyai", "Intan Jaya", "Deiyai"],
    "Papua Pegunungan": ["Jayawijaya", "Lanny Jaya", "Mamberamo Tengah", "Nduga", "Pegunungan Bintang", "Tolikara", "Yalimo", "Yahukimo"],
    "Papua Barat Daya": ["Sorong", "Kota Sorong", "Raja Ampat", "Maybrat", "Tambrauw", "Sorong Selatan"],
}
KAB2PROV = {k: p for p, ks in NEW_PAPUA.items() for k in ks}

PROV_NAME = {  # geoBoundaries ADM1 name -> display name
    "Jakarta Special Capital Region": "DKI Jakarta",
    "Special Region of Yogyakarta": "DI Yogyakarta",
    "Bangka-Belitung Islands": "Bangka Belitung",
    "Riau Islands": "Kepulauan Riau",
    "Central Java": "Jawa Tengah", "East Java": "Jawa Timur", "West Java": "Jawa Barat",
    "Central Kalimantan": "Kalimantan Tengah", "East Kalimantan": "Kalimantan Timur",
    "North Kalimantan": "Kalimantan Utara", "South Kalimantan": "Kalimantan Selatan",
    "West Kalimantan": "Kalimantan Barat",
    "Central Sulawesi": "Sulawesi Tengah", "North Sulawesi": "Sulawesi Utara",
    "South Sulawesi": "Sulawesi Selatan", "Southeast Sulawesi": "Sulawesi Tenggara",
    "West Sulawesi": "Sulawesi Barat",
    "East Nusa Tenggara": "Nusa Tenggara Timur", "West Nusa Tenggara": "Nusa Tenggara Barat",
    "North Maluku": "Maluku Utara", "North Sumatra": "Sumatera Utara",
    "South Sumatra": "Sumatera Selatan", "West Sumatra": "Sumatera Barat",
    "West Papua": "Papua Barat",
}

ISLAND = {}
for p in ["Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan", "Bengkulu", "Lampung",
          "Bangka Belitung", "Kepulauan Riau"]:
    ISLAND[p] = "Sumatra"
for p in ["Banten", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali"]:
    ISLAND[p] = "Java-Bali"
for p in ["Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara"]:
    ISLAND[p] = "Kalimantan"
for p in ["Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara"]:
    ISLAND[p] = "Sulawesi"
for p in ["Nusa Tenggara Barat", "Nusa Tenggara Timur"]:
    ISLAND[p] = "Nusa Tenggara"
for p in ["Maluku", "Maluku Utara"]:
    ISLAND[p] = "Maluku"
for p in ["Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"]:
    ISLAND[p] = "Papua"


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def load_admin():
    """Return (kab GeoDataFrame with columns kab_id, kab, prov, island; province GeoDataFrame)."""
    a1 = gpd.read_file(BOUND / "geoBoundaries-IDN-ADM1_simplified.geojson")
    a2 = gpd.read_file(BOUND / "geoBoundaries-IDN-ADM2_simplified.geojson")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        pts = a2.copy()
        pts["geometry"] = a2.representative_point()
        j = gpd.sjoin(pts, a1[["shapeName", "geometry"]], how="left", predicate="within")
        j = j[~j.index.duplicated()]
        miss = j["shapeName_right"].isna()
        if miss.any():
            near = gpd.sjoin_nearest(pts[miss.values], a1[["shapeName", "geometry"]], how="left")
            near = near[~near.index.duplicated()]
            j.loc[near.index, "shapeName_right"] = near["shapeName_right"]
    a2["prov"] = j["shapeName_right"].map(lambda n: PROV_NAME.get(n, n))
    a2["prov"] = [KAB2PROV.get(k, p) if p in ("Papua", "Papua Barat") else p for k, p in zip(a2["shapeName"], a2["prov"])]
    a2["kab"] = a2["shapeName"]
    a2["kab_id"] = a2["shapeID"]
    a2["island"] = a2["prov"].map(ISLAND)
    kab = a2[["kab_id", "kab", "prov", "island", "geometry"]].copy()
    prov = kab.dissolve(by="prov", as_index=False)[["prov", "geometry"]]
    prov["island"] = prov["prov"].map(ISLAND)
    return kab, prov
