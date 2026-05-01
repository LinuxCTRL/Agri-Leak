import pandas as pd
from pathlib import Path

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


def ingest_tonnage():
    """Ingest tonnage data from Excel file."""
    file_path = DATA_DIR / "30-04-26 V2 -SUIVI JOURNALIER DES TONNAGES  QNZ N° 22.xlsx"
    xls = pd.ExcelFile(file_path)
    df = pd.read_excel(xls, sheet_name="SUIVI JOUR, TONNAGE QNZ N° 22", header=3)

    df = df.dropna(subset=["GROUPE", "FERME"])

    date_cols = [c for c in df.columns if hasattr(c, 'year') and hasattr(c, 'month') and not isinstance(c, str)]

    records = []
    for _, row in df.iterrows():
        group = row["GROUPE"]
        club = row["CLUBS"]
        code = row["CODE"]
        ferme = row["FERME"]
        variety = row["VARIETE"]
        type_cult = row["TYPE"]
        serre = row["SERRE N°"]
        superficie = row["SUP"]
        plant_date = row.get("DATE  PLT°.", None)
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

    df_tonnage = pd.DataFrame(records)
    output_path = PROCESSED_DIR / "tonnage_qnz22.parquet"
    df_tonnage.to_parquet(output_path, engine="pyarrow", index=False)
    print(f"Saved tonnage data: {len(df_tonnage)} rows -> {output_path}")
    return df_tonnage


def ingest_costs():
    """Ingest cost data from all 22 domain sheets."""
    file_path = DATA_DIR / "1-QUINZAINE 25-26-19.xlsx"
    xls = pd.ExcelFile(file_path)

    all_costs = []
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet, header=0)
        df = df.dropna(subset=["Domaine"])

        df["domain_id"] = int(sheet)
        df["qnz"] = 19
        df["year_start"] = 2025
        df["year_end"] = 2026
        df["quinzaine_type"] = 1

        all_costs.append(df)

    df_costs = pd.concat(all_costs, ignore_index=True)

    output_path = PROCESSED_DIR / "costs_qnz19_d1_22.parquet"
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