from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import duckdb
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import os
import json

from dotenv import load_dotenv
load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
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

# ── Farm Name Normalization ──────────────────────────────────────────
# Load normalization mapping from external config to prevent source leakage.
CONFIG_PATH = Path(__file__).parent / "farm_mapping.json"
if CONFIG_PATH.exists():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        # Normalize mapping keys: strip spaces to prevent mismatch
        _raw_map = json.load(f)
        FARM_NAME_MAP = {k.strip(): v for k, v in _raw_map.items()}
else:
    FARM_NAME_MAP = {}


def normalize_farm_name(name):
    """Normalize a farm name using the mapping table."""
    if not name or not isinstance(name, str):
        return name
    name = name.strip()
    if name in FARM_NAME_MAP:
        return FARM_NAME_MAP[name]
    return name


import math

def _sanitize_records(data):
    """Sanitize data by replacing NaN/inf with None for JSON safety."""
    if isinstance(data, pd.DataFrame):
        records = data.to_dict(orient="records")
    elif isinstance(data, list):
        records = data
    elif isinstance(data, dict):
        records = [data] # Wrap in list to use the same logic
    else:
        return data

    for row in records:
        if isinstance(row, dict):
            for k, v in row.items():
                # Avoid ValueError: truth value of array is ambiguous
                if isinstance(v, (list, np.ndarray, tuple)):
                    continue
                if pd.isna(v):
                    row[k] = None
                elif isinstance(v, (float, np.float64, np.float32)) and math.isinf(v):
                    row[k] = None
    
    return records if not isinstance(data, dict) else records[0]


def get_tonnage_df():
    return pd.read_parquet(PROCESSED_DIR / "tonnage_combined.parquet")


def get_costs_df():
    df = pd.read_parquet(PROCESSED_DIR / "costs_combined.parquet")
    df["Domaine"] = df["Domaine"].apply(normalize_farm_name)
    return df


def get_export_df():
    """Load export tonnage data from separate parquet."""
    return pd.read_parquet(PROCESSED_DIR / "export_combined.parquet")


@app.get("/")
def root():
    return {"message": "Agricultural Data Lake API", "version": "1.0.0"}


# ── Tonnage Endpoints ────────────────────────────────────────────────

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
    df = get_tonnage_df()

    if start_date:
        df = df[df["date"] >= start_date]
    if end_date:
        df = df[df["date"] <= end_date]
    if qnz:
        df = df[df["qnz"] == qnz]
    if year:
        df = df[df["year_start"] == year]
    if group:
        df = df[df["group"] == group]
    if club:
        df = df[df["club"] == club]
    if ferme:
        df = df[df["ferme"] == normalize_farm_name(ferme)]

    return _sanitize_records(df)


# ── Export Tonnage Endpoints ────────────────────────────────────────────

@app.get("/api/export-tonnage")
def get_export_tonnage(
    qnz: Optional[int] = None,
    ferme: Optional[str] = None,
):
    """Get export tonnage from the dedicated export parquet."""
    df = get_export_df()

    if qnz:
        df = df[df["qnz"] == qnz]
    if ferme:
        df = df[df["ferme"] == normalize_farm_name(ferme)]

    return _sanitize_records(df)


@app.get("/api/export-available-qnz")
def get_export_available_qnz():
    """Available QNZ values in export data."""
    df = get_export_df()
    return sorted(df["qnz"].dropna().unique().astype(int).tolist())


@app.get("/api/available-qnz")
def get_available_qnz():
    """Returns a unique sorted list of all available quinzaines from the data lake."""
    df = get_tonnage_df()
    qnz_list = sorted(df["qnz"].unique().tolist())
    return qnz_list


@app.get("/api/tonnage/summary")
def get_tonnage_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group: Optional[str] = None,
    club: Optional[str] = None,
    qnz: Optional[int] = None,
):
    df = get_tonnage_df()

    # If qnz is None, default to latest. If qnz is 0, it means ALL.
    if qnz is None and not start_date and not end_date:
        qnz = int(df["qnz"].max())

    if start_date:
        df = df[df["date"] >= start_date]
    if end_date:
        df = df[df["date"] <= end_date]
    if group:
        df = df[df["group"] == group]
    if club:
        df = df[df["club"] == club]
    if qnz and qnz != 0:
        df = df[df["qnz"] == qnz]

    total_tonnage = df["tonnage"].sum()

    # Get cost data for the same filter
    costs_df = get_costs_df()
    if qnz and qnz != 0:
        qnz_costs = costs_df[costs_df["qnz"] == qnz]
        total_cost = qnz_costs["Montant Total"].sum()
    elif start_date or end_date:
        total_cost = 0
    else:
        # Sum all costs for the global view
        total_cost = costs_df["Montant Total"].sum()

    by_farm = df.groupby("ferme").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        days=("date", "nunique")
    ).reset_index().sort_values("tonnage", ascending=False)
    
    total_superficie = by_farm["superficie"].sum()

    by_group = df.groupby("group").agg(
        tonnage=("tonnage", "sum"),
        farms=("ferme", "nunique")
    ).reset_index().sort_values("tonnage", ascending=False)

    by_club = df.groupby("club").agg(
        tonnage=("tonnage", "sum"),
        farms=("ferme", "nunique")
    ).reset_index().sort_values("tonnage", ascending=False)

    return {
        "total_tonnage": float(total_tonnage) if pd.notna(total_tonnage) else 0,
        "total_cost": float(total_cost) if pd.notna(total_cost) else 0,
        "total_superficie": float(total_superficie) if pd.notna(total_superficie) else 0,
        "cost_per_ton": float(total_cost / total_tonnage) if total_tonnage > 0 else 0,
        "yield_per_ha": float(total_tonnage / total_superficie) if total_superficie > 0 else 0,
        "by_farm": _sanitize_records(by_farm),
        "by_group": _sanitize_records(by_group),
        "by_club": _sanitize_records(by_club),
    }


@app.get("/api/tonnage/groups")
def get_groups(qnz: Optional[int] = None):
    df = get_tonnage_df()
    if qnz is None:
        qnz = int(df["qnz"].max())
    if qnz != 0:
        df = df[df["qnz"] == qnz]
    return sorted(df["group"].unique().tolist())


@app.get("/api/tonnage/clubs")
def get_clubs(qnz: Optional[int] = None):
    df = get_tonnage_df()
    if qnz is None:
        qnz = int(df["qnz"].max())
    if qnz != 0:
        df = df[df["qnz"] == qnz]
    return sorted(df["club"].unique().tolist())


@app.get("/api/tonnage/farms")
def get_farms(qnz: Optional[int] = None):
    df = get_tonnage_df()
    if qnz is None:
        qnz = int(df["qnz"].max())
    if qnz != 0:
        df = df[df["qnz"] == qnz]
    by_farm = df.groupby("ferme").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        varieties=("variety", "nunique"),
        harvest_days=("date", "nunique"),
        group_name=("group", "first"),
        club=("club", "first"),
        code=("code", "first")
    ).reset_index().sort_values("tonnage", ascending=False)
    return _sanitize_records(by_farm)



@app.get("/api/tonnage/qnz")
def get_qnz_list():
    df = get_tonnage_df()
    qnz_data = df.groupby("qnz").agg(
        start_date=("date", "min"),
        end_date=("date", "max"),
        year_start=("year_start", "first"),
        year_end=("year_end", "first")
    ).reset_index().sort_values("qnz")

    return qnz_data.to_dict(orient="records")


# ── Cost Endpoints ───────────────────────────────────────────────────

@app.get("/api/costs/qnz")
def get_costs_qnz_list():
    df = get_costs_df()
    return sorted(df["qnz"].unique().tolist())


@app.get("/api/costs")
def get_costs(domain: Optional[str] = None):
    df = get_costs_df()
    if domain:
        df = df[df["Domaine"] == normalize_farm_name(domain)]
    return _sanitize_records(df)


@app.get("/api/costs/summary")
def get_costs_summary(qnz: Optional[int] = None):
    df = get_costs_df()
    if qnz is None:
        qnz = int(df["qnz"].max())
    df = df[df["qnz"] == qnz]
    df = df.groupby("Domaine").agg(
        Super=("Super", "first"),
        Montant_Total=("Montant Total", "sum"),
        qnz=("qnz", "first"),
        cost_per_ha=("Cout Ouvriers/ha", "first")
    ).reset_index()
    return _sanitize_records(df.sort_values("Montant_Total", ascending=False))


@app.get("/api/cost-per-ton")
def get_cost_per_ton(qnz: Optional[int] = None):
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()
    
    if qnz is None:
        qnz = int(tonnage_df["qnz"].max())
        
    if qnz != 0:
        tonnage_df = tonnage_df[tonnage_df["qnz"] == qnz]
        costs_df = costs_df[costs_df["qnz"] == qnz]

    tonnage_by_ferme = tonnage_df.groupby("ferme")["tonnage"].sum().reset_index()
    tonnage_by_ferme.columns = ["Domaine", "total_tonnage"]

    tonnage_by_variety = tonnage_df.groupby(["ferme", "variety"])["tonnage"].sum().reset_index()
    tonnage_by_variety.columns = ["Domaine", "variety", "tonnage"]

    costs_agg = costs_df.groupby("Domaine").agg(
        total_cost=("Montant Total", "sum"),
        superficie=("Super", "first")
    ).reset_index()

    merged = pd.merge(tonnage_by_ferme, costs_agg, on="Domaine", how="inner")
    merged["cost_per_ton"] = merged["total_cost"] / merged["total_tonnage"]
    merged["cost_per_ha"] = merged["total_cost"] / merged["superficie"]
    merged = merged.sort_values("cost_per_ton")

    merged_variety = pd.merge(tonnage_by_variety, costs_agg, on="Domaine", how="inner")
    merged_variety["cost_per_ton"] = merged_variety["total_cost"] / merged_variety["tonnage"]
    merged_variety["cost_per_ha"] = merged_variety["total_cost"] / merged_variety["superficie"]
    merged_variety = merged_variety.sort_values("cost_per_ton")

    return {
        "by_farm": _sanitize_records(merged),
        "by_variety": _sanitize_records(merged_variety)
    }


# ── NEW: Cost Trend Endpoint ────────────────────────────────────────

@app.get("/api/cost-trend")
def get_cost_trend(farm: Optional[str] = None):
    """Cost evolution across all 22 quinzaines, per farm or aggregated."""
    costs_df = get_costs_df()

    if farm:
        costs_df = costs_df[costs_df["Domaine"] == normalize_farm_name(farm)]

    trend = costs_df.groupby("domain_id").agg(
        total_cost=("Montant Total", "sum"),
        main_doeuvre=("Main D'oeuvrs", "sum"),
        echassier=("ECHASSIER", lambda x: x.fillna(0).sum()),
        poste_fixe=("Poste Fixe", lambda x: x.fillna(0).sum()),
        depenses_externe=("Dépences externe", lambda x: x.fillna(0).sum()),
        depenses_interne=("Autre Dépences interne", lambda x: x.fillna(0).sum()),
        farms_count=("Domaine", "nunique"),
        avg_cost_per_ha=("Cout Ouvriers/ha", "mean"),
    ).reset_index()

    trend = trend.rename(columns={"domain_id": "qnz"})
    trend = trend.sort_values("qnz")

    return trend.to_dict(orient="records")


# ── NEW: Productivity Endpoint ───────────────────────────────────────

@app.get("/api/productivity")
def get_productivity(qnz: Optional[int] = None):
    """Yield per hectare and efficiency (kg per MAD) by farm, variety, and type."""
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()
    
    if qnz is None:
        qnz = int(tonnage_df["qnz"].max())
        
    if qnz != 0:
        tonnage_df = tonnage_df[tonnage_df["qnz"] == qnz]
        costs_df = costs_df[costs_df["qnz"] == qnz]

    # By farm
    by_farm = tonnage_df.groupby("ferme").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        varieties=("variety", "nunique"),
        types=("type", "nunique"),
        harvest_days=("date", "nunique"),
        group=("group", "first"),
        club=("club", "first"),
    ).reset_index()
    by_farm["yield_per_ha"] = by_farm["tonnage"] / by_farm["superficie"]

    # Merge with costs for efficiency
    costs_agg = costs_df.groupby("Domaine").agg(
        total_cost=("Montant Total", "sum"),
    ).reset_index()
    by_farm = pd.merge(by_farm, costs_agg, left_on="ferme", right_on="Domaine", how="left")
    by_farm["efficiency"] = by_farm.apply(
        lambda r: r["tonnage"] / r["total_cost"] if pd.notna(r.get("total_cost")) and r["total_cost"] > 0 else None,
        axis=1
    )
    by_farm["cost_per_ton"] = by_farm.apply(
        lambda r: r["total_cost"] / r["tonnage"] if pd.notna(r.get("total_cost")) and r["tonnage"] > 0 else None,
        axis=1
    )
    by_farm = by_farm.drop(columns=["Domaine"], errors="ignore")
    by_farm = by_farm.sort_values("yield_per_ha", ascending=False)

    # By crop type
    by_type = tonnage_df.groupby("type").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        farms=("ferme", "nunique"),
        varieties=("variety", "nunique"),
    ).reset_index()
    by_type["yield_per_ha"] = by_type["tonnage"] / by_type["superficie"]
    by_type = by_type.sort_values("yield_per_ha", ascending=False)

    # By variety
    by_variety = tonnage_df.groupby(["variety", "type"]).agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        farms=("ferme", "nunique"),
    ).reset_index()
    by_variety["yield_per_ha"] = by_variety["tonnage"] / by_variety["superficie"]
    by_variety = by_variety.sort_values("yield_per_ha", ascending=False)

    return {
        "by_farm": _sanitize_records(by_farm),
        "by_type": _sanitize_records(by_type),
        "by_variety": _sanitize_records(by_variety),
    }

# ── NEW: Varieties Endpoint ───────────────────────────────────────────

@app.get("/api/varieties")
def get_varieties(qnz: Optional[int] = None):
    """List of all varieties with their type and the domains planting them."""
    tonnage_df = get_tonnage_df()
    
    if qnz is None:
        qnz = int(tonnage_df["qnz"].max())
        
    if qnz != 0:
        tonnage_df = tonnage_df[tonnage_df["qnz"] == qnz]
    
    by_variety = tonnage_df.groupby(["variety", "type"]).agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        farms=("ferme", lambda x: sorted(x.unique().tolist())),
        farm_count=("ferme", "nunique"),
    ).reset_index()
    
    by_variety["yield_per_ha"] = by_variety["tonnage"] / by_variety["superficie"]
    by_variety = by_variety.sort_values("tonnage", ascending=False)
    
    return _sanitize_records(by_variety)


# ── NEW: Crop Types Endpoint ────────────────────────────────────────

@app.get("/api/crop-types")
def get_crop_types(qnz: Optional[int] = None):
    """Summary of the 4 crop types with tonnage, yield, and cost data."""
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()
    
    if qnz is None:
        qnz = int(tonnage_df["qnz"].max())
        
    if qnz != 0:
        tonnage_df = tonnage_df[tonnage_df["qnz"] == qnz]
        costs_df = costs_df[costs_df["qnz"] == qnz]

    # Tonnage by type
    by_type = tonnage_df.groupby("type").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        farms=("ferme", "nunique"),
        varieties=("variety", "nunique"),
        harvest_days=("date", "nunique"),
    ).reset_index()
    by_type["yield_per_ha"] = by_type["tonnage"] / by_type["superficie"]
    by_type["pct_tonnage"] = by_type["tonnage"] / by_type["tonnage"].sum() * 100

    # Tonnage by type per farm, for cost matching
    farm_type = tonnage_df.groupby(["ferme", "type"])["tonnage"].sum().reset_index()
    farm_total = tonnage_df.groupby("ferme")["tonnage"].sum().reset_index()
    farm_total.columns = ["ferme", "farm_total_tonnage"]

    costs_agg = costs_df.groupby("Domaine").agg(
        total_cost=("Montant Total", "sum"),
    ).reset_index()

    farm_type = pd.merge(farm_type, farm_total, on="ferme")
    farm_type["tonnage_share"] = farm_type["tonnage"] / farm_type["farm_total_tonnage"]
    farm_type = pd.merge(farm_type, costs_agg, left_on="ferme", right_on="Domaine", how="inner")
    farm_type["allocated_cost"] = farm_type["total_cost"] * farm_type["tonnage_share"]

    type_cost = farm_type.groupby("type").agg(
        allocated_cost=("allocated_cost", "sum"),
        matched_tonnage=("tonnage", "sum"),
    ).reset_index()
    type_cost["cost_per_ton"] = type_cost["allocated_cost"] / type_cost["matched_tonnage"]

    by_type = pd.merge(by_type, type_cost[["type", "cost_per_ton", "allocated_cost"]], on="type", how="left")
    by_type = by_type.sort_values("tonnage", ascending=False)

    return _sanitize_records(by_type)


# ── NEW: Cost Breakdown Endpoint ────────────────────────────────────

@app.get("/api/cost-breakdown")
def get_cost_breakdown(qnz: Optional[int] = None):
    """Cost category breakdown across all farms for a specific quinzaine or all."""
    costs_df = get_costs_df()

    if qnz is not None and qnz != 0:
        costs_df = costs_df[costs_df["qnz"] == qnz]

    # Aggregated categories
    categories = {
        "Main D'œuvre": costs_df["Main D'oeuvrs"].sum(),
        "Echassier": costs_df["ECHASSIER"].fillna(0).sum(),
        "Poste Fixe": costs_df["Poste Fixe"].fillna(0).sum(),
        "Dépenses Externes": costs_df["Dépences externe"].fillna(0).sum(),
        "Dépenses Internes": costs_df["Autre Dépences interne"].fillna(0).sum(),
    }
    total = sum(categories.values())
    summary = [
        {"category": k, "amount": float(v), "percentage": float(v / total * 100) if total > 0 else 0}
        for k, v in categories.items()
    ]
    summary.sort(key=lambda x: x["amount"], reverse=True)

    # Per farm breakdown
    by_farm = costs_df.groupby("Domaine").agg(
        total_cost=("Montant Total", "sum"),
        main_doeuvre=("Main D'oeuvrs", "sum"),
        echassier=("ECHASSIER", lambda x: x.fillna(0).sum()),
        poste_fixe=("Poste Fixe", lambda x: x.fillna(0).sum()),
        depenses_externe=("Dépences externe", lambda x: x.fillna(0).sum()),
        depenses_interne=("Autre Dépences interne", lambda x: x.fillna(0).sum()),
        superficie=("Super", "first"),
        cost_per_ha=("Cout Ouvriers/ha", "mean"),
    ).reset_index()
    by_farm = by_farm.sort_values("total_cost", ascending=False)

    return {
        "summary": summary,
        "total": float(total),
        "by_farm": _sanitize_records(by_farm),
    }


# ── Detail Endpoints ─────────────────────────────────────────────────

@app.get("/api/group/{group_name}")
def get_group_details(group_name: str, qnz: Optional[int] = None):
    df = get_tonnage_df()

    if qnz is None:
        qnz = int(df["qnz"].max())

    if qnz != 0:
        group_df = df[(df["group"] == group_name) & (df["qnz"] == qnz)]
    else:
        group_df = df[df["group"] == group_name]

    summary = {
        "total_tonnage": float(group_df["tonnage"].sum()),
        "farms": group_df["ferme"].nunique(),
        "clubs": group_df["club"].nunique(),
        "varieties": group_df["variety"].nunique()
    }

    by_farm = group_df.groupby("ferme").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        varieties=("variety", "nunique"),
        harvest_days=("date", "nunique"),
        club=("club", "first"),
        code=("code", "first")
    ).reset_index().sort_values("tonnage", ascending=False)

    return {
        "group": group_name,
        "summary": summary,
        "farms": _sanitize_records(by_farm),
    }


@app.get("/api/club/{club_name}")
def get_club_details(club_name: str, qnz: Optional[int] = None):
    df = get_tonnage_df()

    if qnz is None:
        qnz = int(df["qnz"].max())

    if qnz != 0:
        club_df = df[(df["club"] == club_name) & (df["qnz"] == qnz)]
    else:
        club_df = df[df["club"] == club_name]

    summary = {
        "total_tonnage": float(club_df["tonnage"].sum()),
        "farms": club_df["ferme"].nunique(),
        "groups": club_df["group"].nunique(),
        "varieties": club_df["variety"].nunique()
    }

    by_farm = club_df.groupby("ferme").agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        varieties=("variety", "nunique"),
        harvest_days=("date", "nunique"),
        group=("group", "first"),
        code=("code", "first")
    ).reset_index().sort_values("tonnage", ascending=False)

    return {
        "club": club_name,
        "summary": summary,
        "farms": _sanitize_records(by_farm),
    }



@app.get("/api/domain/{ferme_name}")
def get_domain_details(ferme_name: str, qnz: Optional[int] = None):
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()

    # Normalize input name to match source-normalized data
    canonical_name = normalize_farm_name(ferme_name)

    # Default to latest QNZ if none provided
    if qnz is None:
        qnz = int(tonnage_df["qnz"].max())

    if qnz != 0:
        domain_df = tonnage_df[(tonnage_df["ferme"] == canonical_name) & (tonnage_df["qnz"] == qnz)]
        cost_df = costs_df[(costs_df["Domaine"] == canonical_name) & (costs_df["qnz"] == qnz)]
    else:
        domain_df = tonnage_df[tonnage_df["ferme"] == canonical_name]
        cost_df = costs_df[costs_df["Domaine"] == canonical_name]

    if len(domain_df) == 0:
        return JSONResponse(status_code=404, content={"error": f"No data found for {ferme_name} in QNZ {qnz}"})

    details = {
        "ferme": canonical_name,
        "code": domain_df["code"].iloc[0],
        "group": domain_df["group"].iloc[0],
        "club": domain_df["club"].iloc[0],
    }

    total_tonnage = float(domain_df["tonnage"].sum())
    total_superficie = float(domain_df["superficie"].drop_duplicates().sum())

    summary = {
        "total_tonnage": total_tonnage,
        "total_superficie": total_superficie,
        "yield_per_ha": total_tonnage / total_superficie if total_superficie > 0 else 0,
        "harvest_days": domain_df["date"].nunique(),
        "varieties_count": domain_df["variety"].nunique(),
        "serres_count": domain_df["serre"].nunique() if "serre" in domain_df.columns else 0,
    }

    by_variety = domain_df.groupby(["variety", "type"]).agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", lambda x: x.drop_duplicates().sum()),
        harvest_days=("date", "nunique"),
        plant_date=("plant_date", "first"),
    ).reset_index()
    by_variety["yield_per_ha"] = by_variety["tonnage"] / by_variety["superficie"]

    by_serre = domain_df.groupby(["serre", "variety", "type"]).agg(
        tonnage=("tonnage", "sum"),
        superficie=("superficie", "first"),
    ).reset_index().sort_values("tonnage", ascending=False)

    daily_harvest = domain_df.groupby("date").agg(
        tonnage=("tonnage", "sum")
    ).reset_index().sort_values("date")

    cost_info = None
    if len(cost_df) > 0:
        total_cost = float(cost_df["Montant Total"].sum())
        sup = float(cost_df["Super"].iloc[0])

        cost_per_ha_val = float(cost_df["Cout Ouvriers/ha"].mean()) if "Cout Ouvriers/ha" in cost_df.columns else 0

        cost_info = {
            "total_cost": total_cost,
            "superficie": sup,
            "cost_per_ton": total_cost / total_tonnage if total_tonnage > 0 else 0,
            "cost_per_ha": cost_per_ha_val,
            "main_doeuvre": float(cost_df["Main D'oeuvrs"].sum()) if "Main D'oeuvrs" in cost_df.columns else 0,
            "echassier": float(cost_df["ECHASSIER"].fillna(0).sum()) if "ECHASSIER" in cost_df.columns else 0,
            "poste_fixe": float(cost_df["Poste Fixe"].fillna(0).sum()) if "Poste Fixe" in cost_df.columns else 0,
            "depenses_externe": float(cost_df["Dépences externe"].fillna(0).sum()) if "Dépences externe" in cost_df.columns else 0,
            "depenses_interne": float(cost_df["Autre Dépences interne"].fillna(0).sum()) if "Autre Dépences interne" in cost_df.columns else 0,
        }

    return {
        "details": _sanitize_records(details),
        "summary": summary,
        "by_variety": _sanitize_records(by_variety),
        "by_serre": _sanitize_records(by_serre),
        "daily_harvest": _sanitize_records(daily_harvest),
        "cost": cost_info,
    }



@app.get("/api/comparison/qnz")
def get_qnz_comparison():
    """Returns total tonnage and total cost summarized by quinzaine."""
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()

    # Aggregate tonnage by QNZ
    tonnage_agg = tonnage_df.groupby("qnz").agg(
        total_tonnage=("tonnage", "sum"),
        farms_count=("ferme", "nunique")
    ).reset_index()

    # Aggregate costs by QNZ
    costs_agg = costs_df.groupby("qnz").agg(
        total_cost=("Montant Total", "sum"),
        domains_count=("Domaine", "nunique")
    ).reset_index()

    # Merge them
    comparison = pd.merge(tonnage_agg, costs_agg, on="qnz", how="outer").sort_values("qnz")
    
    # Calculate cost per ton
    comparison["cost_per_ton"] = comparison["total_cost"] / comparison["total_tonnage"]
    
    return _sanitize_records(comparison)


# ── AI Chat Endpoint ──────────────────────────────────────────────────────

def build_context():
    """Build context from datasets for the AI to use."""
    tonnage_df = get_tonnage_df()
    costs_df = get_costs_df()

    import datetime
    now = datetime.datetime.now().strftime("%Y-%m-%d")

    total_ton = tonnage_df["tonnage"].sum()
    total_cost = costs_df["Montant Total"].sum()
    farms_count = tonnage_df["ferme"].nunique()
    varieties_count = tonnage_df["variety"].nunique()
    groups_count = tonnage_df["group"].nunique()
    clubs_count = tonnage_df["club"].nunique()

    available_qnz = sorted(tonnage_df["qnz"].unique().tolist())
    latest_qnz = available_qnz[-1] if available_qnz else None

    by_qnz = tonnage_df.groupby("qnz").agg(
        tonnage=("tonnage", "sum"),
        farms=("ferme", "nunique"),
        start_date=("date", "min"),
        end_date=("date", "max")
    ).reset_index().sort_values("qnz")

    # Farm Metadata and Costs Summary
    farm_production = tonnage_df.groupby("ferme").agg(
        group=("group", "first"),
        club=("club", "first"),
        superficie=("superficie", "max"),
        total_tonnage=("tonnage", "sum")
    )
    
    farm_costs = costs_df.groupby("Domaine")["Montant Total"].sum()
    farm_meta = pd.merge(farm_production, farm_costs, left_index=True, right_index=True, how="left").sort_values("total_tonnage", ascending=False)
    farm_meta = farm_meta.rename(columns={"Montant Total": "total_cost"})

    # Global Cost Breakdown
    cost_categories = {
        "Main D'oeuvre": costs_df["Main D'oeuvrs"].sum(),
        "Echassier": costs_df["ECHASSIER"].fillna(0).sum(),
        "Poste Fixe": costs_df["Poste Fixe"].fillna(0).sum(),
        "Dépenses Externes": costs_df["Dépences externe"].fillna(0).sum(),
        "Dépenses Internes": costs_df["Autre Dépences interne"].fillna(0).sum(),
    }
    cost_summary = pd.Series(cost_categories).sort_values(ascending=False)

    # Detailed Tonnage by farm and QNZ - FULL TABLE
    by_farm_qnz = tonnage_df.groupby(["ferme", "qnz"])["tonnage"].sum().unstack(fill_value=0)
    
    # Top varieties
    by_variety = tonnage_df.groupby("variety")["tonnage"].sum().sort_values(ascending=False).head(20)

    context = f"""
You are an agricultural data analyst for a Moroccan tomato farm data lake (Agri-Leak).
Current date: {now}
Latest data available up to QNZ {latest_qnz}.

Current data overview:
- Total tonnage: {total_ton:,.0f} kg
- Total costs: {total_cost:,.0f} MAD
- Farms: {farms_count}
- Varieties: {varieties_count}
- Groups: {groups_count}
- Clubs: {clubs_count}

### Global Cost Breakdown:
{cost_summary.to_string()}

### Tonnage by QNZ (Combined):
{by_qnz.to_string(index=False)}

### Farm Metadata (Group, Club, Surface, Total Tonnage, Total Cost):
{farm_meta.to_string()}

### Top 20 Varieties:
{by_variety.to_string()}

### DETAILED TONNAGE BY FARM AND QNZ (CRITICAL):
Use this table to answer specific questions about a farm's harvest in a specific quinzaine.
{by_farm_qnz.to_string()}

DATA_SCHEMA:
- tonnage: ferme (farm), group, club, code, variety, type, serre, superficie (ha), date, qnz, tonnage (kg)
- costs: Domaine (farm), Super (ha), Main D'oeuvrs, ECHASSIER, Poste Fixe, Dépences externe, Autre Dépences interne, Montant Total, qnz

IMPORTANT:
- When asked about "FARM_NAME at QNZ X", look up the row "FARM_NAME" and column "X" in the DETAILED TONNAGE table.
- All numbers are in kg (tonnage) or MAD (costs).
- Superficie is in hectares (ha).

Answer clearly and provide specific numbers.
"""
    return context


@app.post("/api/ai/chat")
async def chat(request: Request):
    """Chat with DeepSeek about the agricultural data."""
    body = await request.json()
    question = body.get("question", "")

    if not question:
        return JSONResponse({"error": "Question required"}, status_code=400)

    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return JSONResponse({"error": "DEEPSEEK_API_KEY not configured"}, status_code=500)

    context = build_context()

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": context},
                        {"role": "user", "content": question}
                    ],
                    "temperature": 0.7,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=60.0
            )
            result = response.json()
            answer = result["choices"][0]["message"]["content"]
            return {"answer": answer}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)