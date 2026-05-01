import duckdb
from pathlib import Path

OUTPUT_DIR = Path("data/output")
OUTPUT_DIR.mkdir(exist_ok=True)

conn = duckdb.connect(str(OUTPUT_DIR / "analytics.duckdb"))

conn.execute("DROP TABLE IF EXISTS tonnage")
conn.execute("DROP TABLE IF EXISTS costs")
conn.execute("CREATE TABLE tonnage AS SELECT * FROM 'data/processed/tonnage_qnz22.parquet'")
conn.execute("CREATE TABLE costs AS SELECT * FROM 'data/processed/costs_qnz19_d1_22.parquet'")

print("=" * 60)
print("AGRICULTURAL DATA LAKE - COST/TON ANALYSIS")
print("=" * 60)

print("\n--- Tonnage Summary (QNZ 22, Apr 2026) ---")
tonnage_summary = conn.execute("""
    SELECT 
        ferme,
        SUM(tonnage) as total_tonnage,
        COUNT(DISTINCT date) as harvest_days
    FROM tonnage
    GROUP BY ferme
    ORDER BY total_tonnage DESC
    LIMIT 15
""").df()
print(tonnage_summary.to_string(index=False))

print("\n--- Cost Summary by Domain (QNZ 19, 2019) ---")
cost_summary = conn.execute("""
    SELECT 
        domain_id,
        Domaine,
        SUM(Super) as total_superficie,
        SUM("Montant Total") as total_cost,
        SUM("Montant Total") / SUM(Super) as cost_per_ha
    FROM costs
    GROUP BY domain_id, Domaine
    ORDER BY total_cost DESC
    LIMIT 15
""").df()
print(cost_summary.to_string(index=False))

print("\n--- Cost Breakdown by Category (All Domains) ---")
cost_breakdown = conn.execute("""
    SELECT 'Main DOeuvre' as category, SUM("Main D'oeuvrs") as total FROM costs
    UNION ALL
    SELECT 'Echassier', SUM(COALESCE(ECHASSIER, 0)) FROM costs
    UNION ALL
    SELECT 'Poste Fixe', SUM(COALESCE("Poste Fixe", 0)) FROM costs
    UNION ALL
    SELECT 'Depenses Externes', SUM(COALESCE("Dépences externe", 0)) FROM costs
    UNION ALL
    SELECT 'Depenses Internes', SUM(COALESCE("Autre Dépences interne", 0)) FROM costs
    ORDER BY total DESC
""").df()
print(cost_breakdown.to_string(index=False))

conn.close()
print("\n✓ Analytics complete - database saved to data/output/analytics.duckdb")