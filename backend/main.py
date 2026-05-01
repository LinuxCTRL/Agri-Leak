from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import duckdb
import pandas as pd
from pathlib import Path
from typing import Optional

DATA_DIR = Path("data")
PROCESSED_DIR = DATA_DIR / "processed"
OUTPUT_DIR = DATA_DIR / "output"

app = FastAPI(title="Agricultural Data Lake API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    conn = duckdb.connect(str(OUTPUT_DIR / "analytics.duckdb"))
    conn.execute("DROP TABLE IF EXISTS tonnage")
    conn.execute("DROP TABLE IF EXISTS costs")
    conn.execute("CREATE TABLE tonnage AS SELECT * FROM 'data/processed/tonnage_qnz22.parquet'")
    conn.execute("CREATE TABLE costs AS SELECT * FROM 'data/processed/costs_qnz19_d1_22.parquet'")
    return conn


@app.get("/")
def root():
    return {"message": "Agricultural Data Lake API", "version": "1.0.0"}


@app.get("/api/tonnage")
def get_tonnage(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    qnz: Optional[int] = None,
    year: Optional[int] = None,
    group: Optional[str] = None,
    club: Optional[str] = None,
    ferme: Optional[str] = None,
):
    conn = get_db_connection()
    conditions = []

    if start_date:
        conditions.append(f"date >= '{start_date}'")
    if end_date:
        conditions.append(f"date <= '{end_date}'")
    if qnz:
        conditions.append(f"qnz = {qnz}")
    if year:
        conditions.append(f"year_start = {year}")
    if group:
        conditions.append(f"\"group\" = '{group}'")
    if club:
        conditions.append(f"club = '{club}'")
    if ferme:
        conditions.append(f"ferme = '{ferme}'")

    where = " AND ".join(conditions) if conditions else "1=1"

    df = conn.execute(f"SELECT * FROM tonnage WHERE {where}").df()
    conn.close()
    return df.to_dict(orient="records")


@app.get("/api/tonnage/summary")
def get_tonnage_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group: Optional[str] = None,
    club: Optional[str] = None,
):
    conn = get_db_connection()
    conditions = []

    if start_date:
        conditions.append(f"date >= '{start_date}'")
    if end_date:
        conditions.append(f"date <= '{end_date}'")
    if group:
        conditions.append(f"\"group\" = '{group}'")
    if club:
        conditions.append(f"club = '{club}'")

    where = " AND ".join(conditions) if conditions else "1=1"

    total = conn.execute(f"SELECT SUM(tonnage) as total FROM tonnage WHERE {where}").df()
    by_farm = conn.execute(f"""
        SELECT ferme, SUM(tonnage) as tonnage, COUNT(DISTINCT date) as days
        FROM tonnage WHERE {where} GROUP BY ferme ORDER BY tonnage DESC
    """).df()
    by_group = conn.execute(f"""
        SELECT "group" as group_name, SUM(tonnage) as tonnage, COUNT(DISTINCT ferme) as farms
        FROM tonnage WHERE {where} GROUP BY "group" ORDER BY tonnage DESC
    """).df()
    by_club = conn.execute(f"""
        SELECT club, SUM(tonnage) as tonnage, COUNT(DISTINCT ferme) as farms
        FROM tonnage WHERE {where} GROUP BY club ORDER BY tonnage DESC
    """).df()

    conn.close()

    return {
        "total_tonnage": float(total["total"].iloc[0]) if len(total) > 0 and pd.notna(total["total"].iloc[0]) else 0,
        "by_farm": by_farm.to_dict(orient="records"),
        "by_group": by_group.to_dict(orient="records"),
        "by_club": by_club.to_dict(orient="records"),
    }


@app.get("/api/tonnage/groups")
def get_groups():
    conn = get_db_connection()
    df = conn.execute('SELECT DISTINCT "group" as group_name FROM tonnage ORDER BY "group"').df()
    conn.close()
    return df["group_name"].tolist()


@app.get("/api/tonnage/clubs")
def get_clubs():
    conn = get_db_connection()
    df = conn.execute("SELECT DISTINCT club FROM tonnage ORDER BY club").df()
    conn.close()
    return df["club"].tolist()


@app.get("/api/tonnage/farms")
def get_farms():
    conn = get_db_connection()
    df = conn.execute("SELECT DISTINCT ferme FROM tonnage ORDER BY ferme").df()
    conn.close()
    return df["ferme"].tolist()


@app.get("/api/costs")
def get_costs(domain: Optional[str] = None):
    conn = get_db_connection()
    if domain:
        df = conn.execute(f"SELECT * FROM costs WHERE Domaine = '{domain}'").df()
    else:
        df = conn.execute("SELECT * FROM costs").df()
    conn.close()
    return df.to_dict(orient="records")


@app.get("/api/costs/summary")
def get_costs_summary():
    conn = get_db_connection()
    df = conn.execute("""
        SELECT Domaine, Super, "Montant Total", domain_id,
               "Montant Total" / Super as cost_per_ha
        FROM costs ORDER BY "Montant Total" DESC
    """).df()
    conn.close()
    return df.to_dict(orient="records")


@app.get("/api/cost-per-ton")
def get_cost_per_ton():
    conn = get_db_connection()

    tonnage_agg = conn.execute("""
        SELECT ferme as Domaine, SUM(tonnage) as total_tonnage
        FROM tonnage GROUP BY ferme
    """).df()

    costs_agg = conn.execute("""
        SELECT Domaine, SUM("Montant Total") as total_cost, SUM(Super) as superficie
        FROM costs GROUP BY Domaine
    """).df()

    merged = pd.merge(tonnage_agg, costs_agg, on="Domaine", how="inner")
    merged["cost_per_ton"] = merged["total_cost"] / merged["total_tonnage"]
    merged["cost_per_ha"] = merged["total_cost"] / merged["superficie"]
    merged = merged.sort_values("cost_per_ton")

    conn.close()
    return merged.to_dict(orient="records")


@app.get("/api/group/{group_name}")
def get_group_details(group_name: str):
    conn = get_db_connection()

    farms = conn.execute(f'SELECT DISTINCT ferme FROM tonnage WHERE "group" = \'{group_name}\'').df()

    summary = conn.execute(f"""
        SELECT SUM(tonnage) as total_tonnage, COUNT(DISTINCT ferme) as farms,
               COUNT(DISTINCT club) as clubs, COUNT(DISTINCT variety) as varieties
        FROM tonnage WHERE "group" = '{group_name}'
    """).df()

    by_farm = conn.execute(f"""
        SELECT ferme, SUM(tonnage) as tonnage, variety, type, superficie
        FROM tonnage WHERE "group" = '{group_name}'
        GROUP BY ferme, variety, type, superficie ORDER BY tonnage DESC
    """).df()

    conn.close()

    return {
        "group": group_name,
        "summary": summary.to_dict(orient="records")[0] if len(summary) > 0 else {},
        "farms": farms["ferme"].tolist(),
        "by_farm": by_farm.to_dict(orient="records"),
    }


@app.get("/api/club/{club_name}")
def get_club_details(club_name: str):
    conn = get_db_connection()

    farms = conn.execute(f"SELECT DISTINCT ferme FROM tonnage WHERE club = '{club_name}'").df()

    summary = conn.execute(f"""
        SELECT SUM(tonnage) as total_tonnage, COUNT(DISTINCT ferme) as farms,
               COUNT(DISTINCT "group") as groups, COUNT(DISTINCT variety) as varieties
        FROM tonnage WHERE club = '{club_name}'
    """).df()

    by_farm = conn.execute(f"""
        SELECT ferme, SUM(tonnage) as tonnage, variety, type, superficie
        FROM tonnage WHERE club = '{club_name}'
        GROUP BY ferme, variety, type, superficie ORDER BY tonnage DESC
    """).df()

    conn.close()

    return {
        "club": club_name,
        "summary": summary.to_dict(orient="records")[0] if len(summary) > 0 else {},
        "farms": farms["ferme"].tolist(),
        "by_farm": by_farm.to_dict(orient="records"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)