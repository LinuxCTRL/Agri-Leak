"""
Export Tonnage Analytics DB
Reads data/processed/export_combined.parquet → data/output/export.duckdb
Completely separate from the main analytics.duckdb.
"""

import duckdb
from pathlib import Path

PROCESSED_DIR = Path("data/processed")
OUTPUT_DIR = Path("data/output")
PARQUET_PATH = PROCESSED_DIR / "export_combined.parquet"
DB_PATH = OUTPUT_DIR / "export.duckdb"


def build_export_db():
    if not PARQUET_PATH.exists():
        print(f"Parquet not found: {PARQUET_PATH}")
        print("Run: uv run python scripts/export_ingest.py first.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    conn = duckdb.connect(str(DB_PATH))

    conn.execute("DROP TABLE IF EXISTS export")
    conn.execute(f"CREATE TABLE export AS SELECT * FROM '{PARQUET_PATH}'")

    row_count = conn.execute("SELECT COUNT(*) FROM export").fetchone()[0]
    farm_count = conn.execute("SELECT COUNT(DISTINCT ferme) FROM export").fetchone()[0]

    print(f"Built export.duckdb → {row_count} rows, {farm_count} unique farms")
    conn.close()


if __name__ == "__main__":
    print("=== Export Analytics DB ===\n")
    build_export_db()
