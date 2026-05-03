# Agricultural Data Lake

<div align="center">

![Python](https://img.shields.io/badge/Python-3.14+-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![DuckDB](https://img.shields.io/badge/DuckDB-1.0+-FFF044?logo=duckdb&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

**A modern data lake for agricultural analytics** — tracking tonnage, costs, and productivity across Moroccan tomato farms.

</div>

---

## Overview

This project ingests agricultural data from Excel spreadsheets and transforms them into analytics-ready Parquet files. It supports:

- 📊 **Tonnage Tracking** — Daily harvest data by farm, variety, and greenhouse
- 💰 **Cost Analysis** — Domain-level expense breakdown (labor, equipment, inputs)
- 📈 **Productivity Metrics** — Cost per ton, yield per hectare, QNZ performance

### What is QNZ?

**Quinzaine** (QNZ) = 15-day agricultural period. There are 24 QNZ per year:
- QNZ 1: June 1-15 → QNZ 24: May 16-31
- Agricultural year runs **June 1 → May 31**

---

## Project Structure

```
data-leak/
├── data/                      # 📁 Raw data (Excel files)
│   ├── *QNZ*.xlsx             # Tonnage files (QNZ 21, 22, ...)
│   └── 1-QUINZAINE*.xlsx      # Cost data files
│
├── data/processed/            # 📁 Processed Parquet files
│   ├── tonnage_combined.parquet
│   └── costs_*.parquet
│
├── data/output/               # 📁 Analytics output
│   └── analytics.duckdb
│
├── scripts/
│   ├── ingest.py             # Data ingestion pipeline
│   └── analytics.py         # Analytics queries
│MIT License — See [LICENSE](LICENSE) for details.
├── frontend/                 # React + Vite dashboard
│   └── src/pages/          # Dashboard, Domains, Varieties, etc.
│
└── backend/                 # FastAPI API
```

---

## Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.14+ | Runtime |
| pandas | — | Data processing |
| duckdb | — | Analytics engine |
| openpyxl | — | Excel reading |
| pyarrow | — | Parquet output |

Install dependencies:

```bash
pip install pandas duckdb openpyxl pyarrow
```

Or use the included `.venv`:

```bash
source .venv/bin/activate
```

---

## Data Folder Setup

### Required Folders

Create these directories manually if they don't exist:

```bash
mkdir -p data data/processed data/output
```

### Required Data Files

Place your Excel files in `data/`:

| File Pattern | Description | Example |
|------------|-------------|---------|
| `*QNZ*.xlsx` | Tonnage data (one per QNZ) | `15-04-26 V2 -SUIVI JOURNALIER DES TONNAGES QNZ N° 21.xlsx` |
| `1-QUINZAINE*.xlsx` | Cost data | `1-QUINZAINE 25-26-19.xlsx` |

#### Tonnage File Format

Excel sheet name: `SUIVI JOUR, TONNAGE QNZ N° {N}`

Required columns:
- `GROUPE` — Group name
- `FERME` — Farm name
- `CODE` — Farm code
- `CLUBS` — Club
- `VARIETE` — Variety
- `TYPE` — Crop type
- `SERRE N°` — Greenhouse number
- `SUP` — Surface area (ha)
- `DATE PLT°.` — Planting date
- `GLOBAL 1` — Total tonnage
- Date columns (DD/MM/YYYY) — Daily harvest tonnage

#### Cost File Format

Excel with one sheet per domain (sheet name = domain ID).

Required columns:
- `Domaine` — Domain name
- `Super` — Surface area (ha)
- `Main D'oeuvrs` — Labor cost
- `ECHASSIER` — Equipment cost
- `Poste Fixe` — Fixed costs
- `Dépences externe` — External expenses
- `Autre Dépences interne` — Internal expenses
- `Montant Total` — Total amount

---

## Usage

### 1. Ingest Data

Run the ingestion pipeline to convert Excel → Parquet:

```bash
python scripts/ingest.py
```

**Output:**

```
=== Ingesting Tonnage Data ===
Processing 15-04-26 V2 -SUIVI JOURNALIER DES TONNAGES  QNZ N° 21.xlsx (QNZ 21)...
Processing 30-04-26 V2 -SUIVI JOURNALIER DES TONNAGES  QNZ N° 22.xlsx (QNZ 22)...
saved combined tonnage data: 15420 rows -> data/processed/tonnage_combined.parquet

=== Ingesting Cost Data ===
saved cost data: 484 rows -> data/processed/costs_qnz19_d1_22.parquet

=== Data Lake Ready ===
Tonnage records: 15420
Cost records: 484
```

### 2. Run Analytics

Generate analytics with DuckDB:

```bash
python scripts/analytics.py
```

**Output:**

```
============================================================
AGRICULTURAL DATA LAKE - COST/TON ANALYSIS
============================================================

--- Tonnage Summary (QNZ 22, Apr 2026) ---
         ferme  total_tonnage  harvest_days
    FERME A          12450.0             15
    FERME B           9820.0             14
    FERME C           7650.0             12
         ...

--- Cost Summary by Domain (QNZ 19, 2019) ---
   domain_id      Domaine  total_superficie  total_cost  cost_per_ha
           1     DOMAINE1           125.5    2450000    19521.98
           2     DOMAINE2            98.2    1890000    19246.44
         ...

✓ Analytics complete - database saved to data/output/analytics.duckdb
```

### 3. Query Directly

Open DuckDB shell for custom queries:

```bash
duckdb data/output/analytics.duckdb
```

```sql
-- Top 10 farms by yield
SELECT 
    ferme,
    SUM(tonnage) / SUM(superficie) as yield_per_ha
FROM tonnage
GROUP BY ferme
ORDER BY yield_per_ha DESC
LIMIT 10;
```

---

## API (Optional)

Start the FastAPI backend:

```bash
cd backend
uvicorn main:app --reload
```

Start the React frontend:

```bash
cd frontend
npm run dev
```

---

## License

FREE TO USE 

---

<div align="center">

Built with 🫓 and ☕ in Morocco

</div>
