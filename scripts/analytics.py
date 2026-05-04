import duckdb
from pathlib import Path

OUTPUT_DIR = Path("data/output")
OUTPUT_DIR.mkdir(exist_ok=True)

conn = duckdb.connect(str(OUTPUT_DIR / "analytics.duckdb"))

conn.execute("DROP TABLE IF EXISTS tonnage")
conn.execute("DROP TABLE IF EXISTS costs")
conn.execute("CREATE TABLE tonnage AS SELECT * FROM 'data/processed/tonnage_combined.parquet'")
conn.execute("CREATE TABLE costs AS SELECT * FROM 'data/processed/costs_combined.parquet'")

print("=" * 60)
print("AGRICULTURAL DATA LAKE - MULTI-QNZ ANALYSIS")
print("=" * 60)

print("\n--- Tonnage Summary (All QNZs) ---")
tonnage_summary = conn.execute("""
    SELECT 
        qnz,
        SUM(tonnage) as total_tonnage,
        COUNT(DISTINCT ferme) as ferme_count
    FROM tonnage
    GROUP BY qnz
    ORDER BY qnz
""").df()
print(tonnage_summary.to_string(index=False))

print("\n--- Cost Summary by QNZ ---")
cost_summary = conn.execute("""
    SELECT 
        qnz,
        SUM("Montant Total") as total_cost,
        COUNT(DISTINCT Domaine) as domain_count
    FROM costs
    GROUP BY qnz
    ORDER BY qnz
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