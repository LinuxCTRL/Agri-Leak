# Agri-Leak — AI Agent Skill Guide

## Project Overview

**Agri-Leak** is an agricultural data lake for tracking tonnage, costs, and productivity across Moroccan tomato farms. It ingests Excel spreadsheets, processes them into Parquet files, serves analytics via a FastAPI backend, and displays dashboards through a React + Vite frontend.

---

## Project Structure

```
Agri-Leak/
├── data/                          # Raw Excel input files
│   ├── TONNAGE_QNZ_*.xlsx         # Tonnage files (QNZ 04–22)
│   ├── 1-QUINZAINE 25-26-19.xlsx  # Cost data file
│   ├── processed/                 # Output: processed Parquet files
│   │   ├── tonnage_combined.parquet
│   │   └── costs_combined.parquet
│   └── output/                    # Output: DuckDB analytics database
│       └── analytics.duckdb
│
├── scripts/
│   ├── ingest.py                  # Excel → Parquet ingestion pipeline
│   ├── analytics.py               # DuckDB analytics queries
│   └── cleanup.py                 # Clean Excel sheets (remove extra sheets)
│
├── backend/
│   ├── main.py                    # FastAPI server (870 lines, all API endpoints)
│   ├── farm_mapping.json          # Farm name normalization map
│   └── variety_mapping.json       # Variety name normalization map
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + layout
│   │   ├── main.jsx               # Entry point
│   │   ├── services/api.js        # Axios API client (all endpoint wrappers)
│   │   ├── context/QnzContext.jsx # Global QNZ state (React Context)
│   │   ├── pages/                 # Dashboard, Domains, Segments, etc.
│   │   ├── components/            # Sidebar, Topbar, ChatPopup, ChartContainer
│   │   ├── theme/                 # Theme config + Chart theme
│   │   └── utils/chartTheme.js    # Chart color/utility helpers
│   ├── vite.config.js             # Vite + Vitest config
│   └── package.json               # React 19, Recharts, React Router 7
│
├── app.py                         # Streamlit fallback dashboard
├── pyproject.toml                 # Python dependencies (uv)
└── start.sh                       # Starts backend + frontend together
```

---

## Domain Knowledge: QNZ (Quinzaine)

**QNZ = 15-day agricultural period.** There are **24 QNZ per agricultural year**.

| Month | QNZ Range |
|-------|-----------|
| June  | 1–2       |
| July  | 3–4       |
| August| 5–6       |
| Sep   | 7–8       |
| Oct   | 9–10      |
| Nov   | 11–12     |
| Dec   | 13–14     |
| Jan   | 15–16     |
| Feb   | 17–18     |
| Mar   | 19–20     |
| Apr   | 21–22     |
| May   | 23–24     |

- Agricultural year runs **June 1 → May 31** (e.g., 2025-26)
- QNZ 1 = June 1-15, QNZ 24 = May 16-31
- `qnz=0` in API means **ALL quinzaines combined** (cumulative)

---

## Data Schemas

### Tonnage Data (`tonnage_combined.parquet`)

| Column       | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `group`      | string   | Group name (e.g., "GROUPE A")        |
| `club`       | string   | Club name                            |
| `code`       | string   | Farm code                            |
| `ferme`      | string   | Farm name (normalized via mapping)   |
| `variety`    | string   | Tomato variety (normalized)          |
| `type`       | string   | Crop type (e.g., "COEUR", "ALLONGE") |
| `serre`      | string   | Greenhouse number                    |
| `superficie` | float    | Surface area in hectares             |
| `plant_date` | datetime | Planting date                        |
| `date`       | datetime | Harvest date                         |
| `qnz`        | int      | Quinzaine number (1-24)              |
| `year_start` | int      | Agricultural year start (e.g., 2025) |
| `year_end`   | int      | Agricultural year end (e.g., 2026)   |
| `tonnage`    | float    | Harvest tonnage in **kg**            |
| `global_tonnage` | float| Total tonnage for the row            |

### Cost Data (`costs_combined.parquet`)

| Column                  | Type   | Description                         |
|-------------------------|--------|-------------------------------------|
| `Domaine`               | string | Farm/domain name (normalized)       |
| `Super`                 | float  | Surface area in hectares            |
| `Main D'oeuvrs`         | float  | Labor cost (MAD)                    |
| `ECHASSIER`             | float  | Equipment cost (MAD)                |
| `Poste Fixe`            | float  | Fixed costs (MAD)                   |
| `Depences externe`      | float  | External expenses (MAD)             |
| `Autre Depences interne`| float  | Internal expenses (MAD)             |
| `Montant Total`         | float  | Total amount (MAD)                  |
| `qnz`                   | int    | Quinzaine number                    |
| `domain_id`             | int    | Domain ID (same as qnz)             |
| `year_start`            | int    | 2025                                |
| `year_end`              | int    | 2026                                |
| `quinzaine_type`        | int    | 1                                   |
| `Cout Ouvriers/ha`      | float  | Labor cost per hectare              |
| `sheet_name`            | string | Source sheet name                   |

---

## How to Add New Data

### Adding New Tonnage Data

1. Place Excel file in `data/` with pattern `*QNZ*.xlsx` (e.g., `TONNAGE_QNZ_23.xlsx`)
2. The Excel file **must** contain a sheet with "SUIVI JOUR" in the name
3. Sheet data starts at **row 4** (`header=3` in pandas)
4. Required columns in the sheet:
   - `GROUPE`, `FERME`, `CODE`, `CLUBS`, `VARIETE`, `TYPE`, `SERRE N°`, `SUP`, `DATE PLT°.`, `GLOBAL 1`
   - Date columns (DD/MM/YYYY format) for daily harvest values
5. If farm/variety names need normalization, update `backend/farm_mapping.json` or `backend/variety_mapping.json`
6. Run ingestion: `uv run python scripts/ingest.py`

### Adding New Cost Data

1. The cost file is `data/1-QUINZAINE 25-26-19.xlsx`
2. Each sheet is named with a **number** (the QNZ number)
3. Sheet data starts at **row 1** (`header=0` in pandas)
4. Required columns: `Domaine`, `Super`, `Main D'oeuvrs`, `ECHASSIER`, `Poste Fixe`, `Depences externe`, `Autre Depences interne`, `Montant Total`
5. To add a new agricultural year, modify `scripts/ingest.py` to handle the new file pattern and update `year_start`/`year_end`
6. Run ingestion: `uv run python scripts/ingest.py`

---

## API Endpoints (FastAPI at `localhost:8000`)

All endpoints accept optional `qnz` parameter. `qnz=0` = all quinzaines combined.

### Tonnage
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tonnage` | Raw tonnage records (filterable: start_date, end_date, qnz, year, group, club, ferme) |
| GET | `/api/tonnage/summary` | Aggregated summary: total_tonnage, total_cost, cost_per_ton, yield_per_ha, by_farm, by_group, by_club |
| GET | `/api/tonnage/groups` | List of unique group names |
| GET | `/api/tonnage/clubs` | List of unique club names |
| GET | `/api/tonnage/farms` | Farm list with tonnage, superficie, varieties, harvest_days |
| GET | `/api/tonnage/qnz` | QNZ metadata (start_date, end_date, year) |
| GET | `/api/available-qnz` | Sorted list of available QNZ numbers |

### Costs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/costs` | Raw cost records |
| GET | `/api/costs/summary` | Cost summary by domain |
| GET | `/api/costs/qnz` | List of QNZ with cost data |
| GET | `/api/cost-per-ton` | Cost per ton by farm and by variety |
| GET | `/api/cost-trend` | Cost evolution across QNZ |
| GET | `/api/cost-breakdown` | Category breakdown (summary + by_farm) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/productivity` | Yield per ha, efficiency (kg/MAD) by farm, type, variety |
| GET | `/api/varieties` | All varieties with tonnage, farms, yield |
| GET | `/api/crop-types` | 4 crop types summary with tonnage, yield, cost_per_ton |
| GET | `/api/comparison/qnz` | Tonnage + cost by QNZ for comparison charts |

### Details
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/group/{name}` | Group detail: summary + farms |
| GET | `/api/club/{name}` | Club detail: summary + farms |
| GET | `/api/domain/{ferme}` | Domain detail: summary, by_variety, by_serre, daily_harvest, cost |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with DeepSeek (body: `{"question": "..."}`) |

---

## Frontend Architecture (React + Vite)

### Tech Stack
- **React 19** with functional components + hooks
- **React Router 7** for routing
- **Recharts 2.15** for charts
- **Axios** for API calls
- **Vitest** for testing

### Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | Overview metrics, top farms, groups, crop types |
| `/productivity` | Productivity | Yield/ha, efficiency by farm/type/variety |
| `/varieties` | Varieties | All varieties table |
| `/domains` | Domains | All domains list |
| `/segments` | Segments | Groups and clubs tabs |
| `/comparison` | Comparison | QNZ-over-QNZ comparison |
| `/cost-per-ton` | CostPerTon | Cost per ton by farm |
| `/cost-breakdown` | CostBreakdown | Cost category breakdown |
| `/report` | Reports | Farm report selector (pick a farm) |
| `/report/:ferme` | Reports | Full farm report with 6 sections |
| `/domain/:ferme` | Domain | Single farm detail page |

### Global State
- **QnzContext**: Manages `selectedQnz` (persisted in localStorage). Default is `0` (all QNZ). All pages consume this via `useQnz()`.

### API Client (`src/services/api.js`)
All API calls go through this module. Functions return axios promises:
```js
getTonnageSummary({ qnz })
getGroups({ qnz })
getClubs({ qnz })
getFarms({ qnz })
getCropTypes({ qnz })
getCostPerTon({ qnz })
getProductivity({ qnz })
getVarieties({ qnz })
getCostBreakdown({ qnz })
getCostTrend(farm)
getQnzComparison()
getAvailableQnz()
getDomainDetails(ferme, { qnz })
getGroupDetails(group, { qnz })
getClubDetails(club, { qnz })
askAI(question)
```

---

## Running the Project

### Full Stack
```bash
./start.sh
```

### Backend Only
```bash
uv run uvicorn backend.main:app --reload --port 8000
```

### Frontend Only
```bash
cd frontend && npm run dev
```

### Ingest Data
```bash
uv run python scripts/ingest.py
```

### Run Analytics
```bash
uv run python scripts/analytics.py
```

### Query DuckDB Directly
```bash
duckdb data/output/analytics.duckdb
```

---

## Key Conventions

1. **Units**: Tonnage in **kg**, Costs in **MAD** (Moroccan Dirham), Superficie in **hectares**
2. **Farm Names**: Always normalized via `backend/farm_mapping.json`. Use `normalize_farm_name()` in backend and `normalize_name()` in ingest
3. **QNZ=0**: Means "all quinzaines" — used as the global default in the frontend
4. **Data Flow**: Excel → `scripts/ingest.py` → Parquet → FastAPI reads Parquet → Frontend calls API
5. **No database**: DuckDB is only for ad-hoc analytics. The app reads Parquet files directly via pandas
6. **Sanitization**: All API responses go through `_sanitize_records()` to convert NaN/inf to None for JSON safety
