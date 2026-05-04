import pandas as pd
from pathlib import Path
import datetime
import json

DATA_DIR = Path("data")
PROCESSED_DIR = Path("data/processed")


def calculate_qnz(date):
    """Calculate QNZ from date. Agricultural year: June 1 to May 31.
    QNZ 1: June 1-15, QNZ 2: June 16-30, ... QNZ 24: May 16-31

    Month mapping to QNZ:
    June=1-2, July=3-4, Aug=5-6, Sep=7-8, Oct=9-10, Nov=11-12
    Dec=13-14, Jan=15-16, Feb=17-18, Mar=19-20, Apr=21-22, May=23-24
    """
    month = date.month
    day = date.day

    if month >= 6:
        month_offset = month - 6
    else:
        month_offset = month + 6

    day_offset = 0 if day <= 15 else 1

    qnz = (month_offset * 2) + day_offset + 1

    if date.month >= 6:
        year_start = date.year
        year_end = date.year + 1
    else:
        year_start = date.year - 1
        year_end = date.year

    return qnz, year_start, year_end


def parse_qnz_number(filename):
    """Extract QNZ number from filename like 'QNZ 19_FINAL_TONNAGE...'"""
    import re
    match = re.search(r"QNZ\s*(\d+)", filename, re.IGNORECASE)
    return int(match.group(1)) if match else None


def normalize_farm_name(name, mapping):
    if not name or not isinstance(name, str):
        return name
    name = name.strip()
    if name in mapping:
        return mapping[name]
    return name


def ingest_tonnage_file(file_path, qnz_num, mapping):
    """Ingest tonnage data from a single Excel file."""
    xls = pd.ExcelFile(file_path)
    # Find the sheet that starts with "SUIVI JOUR"
    sheet_name = next((s for s in xls.sheet_names if "SUIVI JOUR" in s), None)
    
    if not sheet_name:
        print(f"Warning: Could not find SUIVI JOUR sheet in {file_path.name}")
        return pd.DataFrame()

    df = pd.read_excel(xls, sheet_name=sheet_name, header=3)
    df = df.dropna(subset=["GROUPE", "FERME"])

    # Identify date columns (columns that are datetimes)
    date_cols = [c for c in df.columns if hasattr(c, 'year') and hasattr(c, 'month') and not isinstance(c, str)]

    records = []
    for _, row in df.iterrows():
        group = row.get("GROUPE")
        club = row.get("CLUBS")
        code = row.get("CODE")
        ferme = normalize_farm_name(row.get("FERME"), mapping)
        variety = row.get("VARIETE")
        type_cult = row.get("TYPE")
        serre = row.get("SERRE N°")
        superficie = row.get("SUP")
        plant_date_raw = row.get("DATE  PLT°.", None)
        
        # Ensure plant_date is datetime or None
        plant_date = None
        if pd.notna(plant_date_raw):
            try:
                plant_date = pd.to_datetime(plant_date_raw)
            except:
                plant_date = None

        global_tonnage = row.get("GLOBAL 1", 0)

        for date_col in date_cols:
            tonnage = row.get(date_col)
            if pd.notna(tonnage) and tonnage != 0:
                date = pd.to_datetime(date_col)
                qnz, year_start, year_end = calculate_qnz(date)

                records.append({
                    "group": group,
                    "club": club,
                    "code": code,
                    "ferme": ferme,
                    "variety": variety,
                    "type": type_cult,
                    "serre": str(serre) if pd.notna(serre) else None,
                    "superficie": superficie,
                    "plant_date": plant_date,
                    "date": date,
                    "qnz": qnz,
                    "year_start": year_start,
                    "year_end": year_end,
                    "tonnage": tonnage,
                    "global_tonnage": global_tonnage
                })

    return pd.DataFrame(records)


def ingest_tonnage():
    """Ingest tonnage data from all QNZ Excel files."""
    # Load mapping
    mapping_path = Path("backend/farm_mapping.json")
    mapping = {}
    if mapping_path.exists():
        with open(mapping_path, "r") as f:
            mapping = json.load(f)
            # Ensure keys are stripped for matching
            mapping = {k.strip(): v for k, v in mapping.items()}

    all_files = list(DATA_DIR.glob("*QNZ*.xlsx"))
    all_files.sort(key=lambda f: parse_qnz_number(f.name) or 0)

    if not all_files:
        print("No QNZ Excel files found in data/")
        return pd.DataFrame()

    all_dfs = []
    for file_path in all_files:
        qnz_num = parse_qnz_number(file_path.name)
        print(f"Processing {file_path.name} (QNZ {qnz_num})...")
        df = ingest_tonnage_file(file_path, qnz_num, mapping)
        if not df.empty:
            all_dfs.append(df)

    if not all_dfs:
        return pd.DataFrame()

    df_tonnage = pd.concat(all_dfs, ignore_index=True)
    
    # --- Metadata Normalization ---
    # Use latest available metadata (group, club, code) for each farm
    # Sort by qnz descending to pick the most recent data first
    metadata = df_tonnage.sort_values("qnz", ascending=False).groupby("ferme").agg({
        "group": "first",
        "club": "first",
        "code": "first"
    }).reset_index()
    
    # Merge the normalized metadata back into the main dataframe
    df_tonnage = df_tonnage.drop(columns=["group", "club", "code"])
    df_tonnage = pd.merge(df_tonnage, metadata, on="ferme", how="left")
    # ------------------------------
    
    # Ensure processed directory exists
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    output_path = PROCESSED_DIR / "tonnage_combined.parquet"
    df_tonnage.to_parquet(output_path, engine="pyarrow", index=False)
    print(f"Saved combined tonnage data: {len(df_tonnage)} rows -> {output_path}")
    return df_tonnage


def ingest_costs():
    """Ingest cost data from all sheets in the cost file."""
    # Load mapping
    mapping_path = Path("backend/farm_mapping.json")
    mapping = {}
    if mapping_path.exists():
        with open(mapping_path, "r") as f:
            mapping = json.load(f)
            mapping = {k.strip(): v for k, v in mapping.items()}

    file_path = DATA_DIR / "1-QUINZAINE 25-26-19.xlsx"
    if not file_path.exists():
        print(f"Cost file {file_path} not found.")
        return pd.DataFrame()

    xls = pd.ExcelFile(file_path)

    all_costs = []
    for sheet in xls.sheet_names:
        # Only process sheets with numeric names (representing quinzaines or domains)
        if not sheet.isdigit():
            continue
            
        df = pd.read_excel(xls, sheet_name=sheet, header=0)
        df = df.dropna(subset=["Domaine"])

        if df.empty:
            continue

        df["sheet_name"] = sheet
        qnz_val = int(sheet)
        df["qnz"] = qnz_val
        df["domain_id"] = qnz_val
        
        # Agricultural year 25-26
        df["year_start"] = 2025
        df["year_end"] = 2026
        df["quinzaine_type"] = 1
        
        # Normalize farm names
        df["Domaine"] = df["Domaine"].apply(lambda x: normalize_farm_name(x, mapping))

        all_costs.append(df)

    if not all_costs:
        return pd.DataFrame()

    df_costs = pd.concat(all_costs, ignore_index=True)

    # Convert object columns to string to avoid parquet mixed-type errors
    for col in df_costs.columns:
        if df_costs[col].dtype == 'object':
            df_costs[col] = df_costs[col].fillna("").astype(str)

    output_path = PROCESSED_DIR / "costs_combined.parquet"
    df_costs.to_parquet(output_path, engine="pyarrow", index=False)
    print(f"Saved cost data: {len(df_costs)} rows -> {output_path}")
    return df_costs


if __name__ == "__main__":
    print("=== Ingesting Tonnage Data ===")
    tonnage = ingest_tonnage()

    print("\n=== Ingesting Cost Data ===")
    costs = ingest_costs()

    print("\n=== Data Lake Ready ===")
    print(f"Tonnage records: {len(tonnage)}")
    print(f"Cost records: {len(costs)}")
