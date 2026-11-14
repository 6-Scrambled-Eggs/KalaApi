"""Shared paths and constants. Reads KALAAPI_DATA_DIR from the environment or from .env."""
import os
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def _load_dotenv():
    env = REPO / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()

# Folder that holds the four DL_FIRE_* folders from the FIRMS Archive Download.
RAW_DIR = Path(os.environ.get("KALAAPI_DATA_DIR", r"D:\dev\DATA_kalaapi"))
# Output folder for processed files. Lives outside the repo.
OUT_DIR = Path(os.environ.get("KALAAPI_OUT_DIR", str(RAW_DIR / "processed")))
FIRMS_MAP_KEY = os.environ.get("FIRMS_MAP_KEY", "")  # only needed for the API top-up

CELL_DEG = 0.05  # grid size, about 5.5 km

# FIRMS satellite column -> our sensor name
SENSOR = {"Terra": "terra", "Aqua": "aqua", "SNPP": "snpp", "N20": "noaa20", "N21": "noaa21"}
