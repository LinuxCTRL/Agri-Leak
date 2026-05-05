"""
Export Tonnage Ingestion
Reads Excel files from data/export-tonnage/ and produces data/processed/export_combined.parquet
Completely separate from the main tonnage pipeline.
"""

import pandas as pd
from pathlib import Path

DATA_DIR = Path("data/export-tonnage")
PROCESSED_DIR = Path("data/processed")


def ingest_export():
    """Read all export Excel files and combine into a single parquet."""
    if not DATA_DIR.exists():
        print(f"Directory {DATA_DIR} not found.")
        return pd.DataFrame()

    xlsx_files = sorted(DATA_DIR.glob("*.xlsx"))
    if not xlsx_files:
        print(f"No Excel files found in {DATA_DIR}/")
        return pd.DataFrame()

    all_rows = []

    for file_path in xlsx_files:
        print(f"Processing {file_path.name}...")
        df = pd.read_excel(file_path)

        # Rename columns to standardised keys
        col_map = {
            "Domaine": "ferme",
            "Code": "code",
            "Superficie actuelle": "superficie",
            "Total / quinzaine": "tonnage_qnz",
            "Tonnage total": "tonnage_cumul",
            "Export quinzaine": "export_qnz",
            "Export quinzaine/ ha": "export_qnz_ha",
            "Export total": "export_cumul",
            "Ecart total": "ecart_total",
            "Ecart/Ha": "ecart_ha",
            "% Ecart": "ecart_pct",
            "Serre": "serre",
            "Export local": "export_local",
            "Total export (Export + Export local)": "export_total_all",
            "Date plantation": "plant_date",
            "Clube": "club",
            "Groupes": "group",
            "Type": "type",
            "Variété": "variety",
        }

        # Only keep columns that exist
        available_cols = {k: v for k, v in col_map.items() if k in df.columns}
        df = df.rename(columns=available_cols)

        # Keep only the mapped columns that exist
        keep_cols = [v for v in available_cols.values() if v in df.columns]
        df = df[keep_cols]

        # Convert plant_date to datetime
        if "plant_date" in df.columns:
            df["plant_date"] = pd.to_datetime(df["plant_date"], errors="coerce")

        # Infer QNZ from filename (e.g. "Tonnage Q21 - Export.xlsx" → 21)
        import re
        match = re.search(r"Q\s*(\d+)", file_path.name, re.IGNORECASE)
        if match:
            df["qnz"] = int(match.group(1))

        # Ensure numeric columns are float
        numeric_cols = [
            "superficie", "tonnage_qnz", "tonnage_cumul",
            "export_qnz", "export_qnz_ha", "export_cumul",
            "ecart_total", "ecart_ha", "ecart_pct",
            "export_local", "export_total_all"
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Cast string columns to avoid pyarrow mixed-type errors
        str_cols = ["serre", "ferme", "code", "type", "variety", "club", "group"]
        for col in str_cols:
            if col in df.columns:
                df[col] = df[col].astype(str)
                # Replace pandas NaN string representations back to None/null
                df[col] = df[col].replace(["nan", "None", ""], None)

        all_rows.append(df)

    if not all_rows:
        print("No rows ingested.")
        return pd.DataFrame()

    result = pd.concat(all_rows, ignore_index=True)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / "export_combined.parquet"
    result.to_parquet(output_path, engine="pyarrow", index=False)

    print(f"Saved: {len(result)} rows × {len(result.columns)} cols → {output_path}")
    print(f"Unique farms: {result['ferme'].nunique()}")
    return result


if __name__ == "__main__":
    print("=== Export Tonnage Ingestion ===\n")
    ingest_export()
