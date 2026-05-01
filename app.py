import streamlit as st
import duckdb
import pandas as pd
from pathlib import Path
from datetime import datetime

st.set_page_config(page_title="Agricultural Data Lake", layout="wide", page_icon="🌱")

DATA_DIR = Path("data")
PROCESSED_DIR = DATA_DIR / "processed"
OUTPUT_DIR = DATA_DIR / "output"


@st.cache_data
def load_data():
    conn = duckdb.connect(str(OUTPUT_DIR / "analytics.duckdb"))
    conn.execute("DROP TABLE IF EXISTS tonnage")
    conn.execute("DROP TABLE IF EXISTS costs")
    conn.execute("CREATE TABLE tonnage AS SELECT * FROM 'data/processed/tonnage_qnz22.parquet'")
    conn.execute("CREATE TABLE costs AS SELECT * FROM 'data/processed/costs_qnz19_d1_22.parquet'")

    tonnage = conn.execute("SELECT * FROM tonnage").df()
    costs = conn.execute("SELECT * FROM costs").df()
    conn.close()
    return tonnage, costs


def calculate_cost_per_ton(tonnage_df, costs_df):
    tonnage_agg = tonnage_df.groupby("ferme")["tonnage"].sum().reset_index()
    tonnage_agg.columns = ["Domaine", "total_tonnage"]

    costs_agg = costs_df.groupby("Domaine").agg({
        "Montant Total": "sum",
        "Super": "sum"
    }).reset_index()
    costs_agg.columns = ["Domaine", "total_cost", "superficie"]

    merged = pd.merge(tonnage_agg, costs_agg, on="Domaine", how="inner")
    merged["cost_per_ton"] = merged["total_cost"] / merged["total_tonnage"]
    merged["cost_per_ha"] = merged["total_cost"] / merged["superficie"]

    return merged.sort_values("cost_per_ton")


st.title("🌱 Agricultural Data Lake")
st.markdown("### QNZ-Based Harvest & Cost Analytics (June 1 - May 31)")

try:
    tonnage, costs = load_data()
except:
    st.error("No data available. Run ingestion first: `uv run python scripts/ingest.py`")
    st.stop()

min_date = tonnage["date"].min().date()
max_date = tonnage["date"].max().date()

with st.sidebar:
    st.header("🧭 Navigation")

    page = st.radio(
        "Go to",
        ["📊 Dashboard", "🌾 Tonnage", "💰 Costs", "📈 Cost/Ton", "🏷️ Clubs & Groups"]
    )

    st.markdown("---")

    st.header("📅 Filters")

    st.subheader("Date Range")
    date_range = st.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )

    if len(date_range) == 2:
        start_date, end_date = date_range
        tonnage_filtered = tonnage[(tonnage["date"].dt.date >= start_date) & (tonnage["date"].dt.date <= end_date)]
    else:
        tonnage_filtered = tonnage

    st.subheader("QNZ Filter")
    qnz_options = sorted(tonnage_filtered["qnz"].unique())
    selected_qnz = st.multiselect("Select QNZ", qnz_options, default=qnz_options)
    if selected_qnz:
        tonnage_filtered = tonnage_filtered[tonnage_filtered["qnz"].isin(selected_qnz)]

    st.subheader("Year Filter")
    year_options = sorted(tonnage_filtered["year_start"].unique())
    selected_years = st.multiselect("Select Year", year_options, default=year_options)
    if selected_years:
        tonnage_filtered = tonnage_filtered[tonnage_filtered["year_start"].isin(selected_years)]

    if page != "🏷️ Clubs & Groups":
        st.subheader("Farm Filter")
        ferme_options = sorted(tonnage_filtered["ferme"].unique())
        selected_ferme = st.multiselect("Select Farm", ferme_options, default=ferme_options)
        if selected_ferme:
            tonnage_filtered = tonnage_filtered[tonnage_filtered["ferme"].isin(selected_ferme)]

    st.markdown("---")
    st.caption(f"📅 Agricultural Year: June 1 - May 31")
    st.caption(f"📊 QNZ Range: 1-24 (2 per month)")

if page == "📊 Dashboard":
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Tonnage", f"{tonnage_filtered['tonnage'].sum():,.0f} kg")
    with col2:
        st.metric("Farms", f"{tonnage_filtered['ferme'].nunique()}")
    with col3:
        st.metric("Harvest Days", f"{tonnage_filtered['date'].nunique()}")
    with col4:
        st.metric("Groups", f"{tonnage_filtered['group'].nunique()}")

    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.subheader("Top 10 Farms by Tonnage")
        top_farms = tonnage_filtered.groupby("ferme")["tonnage"].sum().sort_values(ascending=True).tail(10)
        st.bar_chart(top_farms)

    with col_chart2:
        st.subheader("Tonnage by Group")
        group_data = tonnage_filtered.groupby("group")["tonnage"].sum().sort_values(ascending=True).tail(10)
        st.bar_chart(group_data)

    col_chart3, col_chart4 = st.columns(2)

    with col_chart3:
        st.subheader("Tonnage by Variety")
        variety_data = tonnage_filtered.groupby("variety")["tonnage"].sum().sort_values(ascending=True).tail(10)
        st.bar_chart(variety_data)

    with col_chart4:
        st.subheader("Tonnage by Type")
        type_data = tonnage_filtered.groupby("type")["tonnage"].sum().sort_values(ascending=True)
        st.bar_chart(type_data)

    st.subheader("Multi-Year Comparison")
    if len(tonnage_filtered["year_start"].unique()) > 1:
        year_comparison = tonnage_filtered.groupby(["year_start", "ferme"])["tonnage"].sum().unstack(fill_value=0)
        st.bar_chart(year_comparison.tail(10))
    else:
        st.info("Only one year available for comparison")


elif page == "🌾 Tonnage":
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Records", len(tonnage_filtered))
    with col2:
        st.metric("Total Tonnage", f"{tonnage_filtered['tonnage'].sum():,.0f} kg")
    with col3:
        st.metric("Avg per Day", f"{tonnage_filtered['tonnage'].mean():,.0f} kg")

    st.subheader("Tonnage Data")
    display_cols = ["group", "club", "code", "ferme", "variety", "type", "serre", "superficie", "date", "qnz", "tonnage"]
    st.dataframe(
        tonnage_filtered[display_cols].sort_values(["date", "ferme"]),
        use_container_width=True,
        hide_index=True
    )

    st.subheader("Group Summary")
    group_summary = tonnage_filtered.groupby("group").agg({
        "tonnage": "sum",
        "ferme": "nunique",
        "club": "nunique"
    }).sort_values("tonnage", ascending=False)
    group_summary.columns = ["Total Tonnage", "Farms", "Clubs"]
    st.bar_chart(group_summary["Total Tonnage"].sort_values())


elif page == "💰 Costs":
    st.subheader("Cost Analysis by Domain")

    col1, col2 = st.columns(2)
    with col1:
        domaine_select = st.selectbox("Select Domaine", costs["Domaine"].unique())

    domain_data = costs[costs["Domaine"] == domaine_select].iloc[0] if len(costs[costs["Domaine"] == domaine_select]) > 0 else None

    if domain_data is not None:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Superficie", f"{domain_data['Super']:.2f} ha")
        with col2:
            st.metric("Total Cost", f"{domain_data['Montant Total']:,.0f} MAD")
        with col3:
            st.metric("Cost/Ha", f"{domain_data['Montant Total']/domain_data['Super']:,.0f} MAD")

        st.subheader("Cost Breakdown")
        cost_breakdown = pd.DataFrame({
            "Category": ["Main D'œuvre", "Echassier", "Poste Fixe", "Dépenses Externes", "Dépenses Internes"],
            "Amount": [
                domain_data.get("Main D'oeuvrs", 0),
                domain_data.get("ECHASSIER", 0) if pd.notna(domain_data.get("ECHASSIER", 0)) else 0,
                domain_data.get("Poste Fixe", 0) if pd.notna(domain_data.get("Poste Fixe", 0)) else 0,
                domain_data.get("Dépences externe", 0) if pd.notna(domain_data.get("Dépences externe", 0)) else 0,
                domain_data.get("Autre Dépences interne", 0) if pd.notna(domain_data.get("Autre Dépences interne", 0)) else 0
            ]
        }).sort_values("Amount", ascending=True)
        st.bar_chart(cost_breakdown.set_index("Category")["Amount"])

    st.subheader("All Domains Cost Summary")
    cost_summary = costs.groupby("Domaine").agg({
        "Super": "sum",
        "Montant Total": "sum",
        "domain_id": "first"
    }).reset_index()
    cost_summary["Cost/Ha"] = cost_summary["Montant Total"] / cost_summary["Super"]
    cost_summary = cost_summary.sort_values("Montant Total", ascending=False)
    st.dataframe(
        cost_summary.rename(columns={"Super": "Superficie (ha)", "Montant Total": "Total Cost (MAD)", "Cost/Ha": "Cost/Ha (MAD)"}),
        use_container_width=True,
        hide_index=True
    )


elif page == "📈 Cost/Ton":
    st.subheader("Cost per Ton Analysis")

    cost_per_ton = calculate_cost_per_ton(tonnage_filtered, costs)

    if len(cost_per_ton) > 0:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Matching Farms", len(cost_per_ton))
        with col2:
            st.metric("Avg Cost/Ton", f"{cost_per_ton['cost_per_ton'].mean():,.0f} MAD")
        with col3:
            st.metric("Best Cost/Ton", f"{cost_per_ton['cost_per_ton'].min():,.0f} MAD")

        st.subheader("Cost per Ton by Farm")
        cost_per_ton_sorted = cost_per_ton.sort_values("cost_per_ton", ascending=True)
        st.bar_chart(cost_per_ton_sorted.set_index("Domaine")["cost_per_ton"])

        st.subheader("Export Data")
        csv = cost_per_ton.to_csv(index=False).encode('utf-8')
        st.download_button(
            "📥 Export Cost/Ton to CSV",
            csv,
            "cost_per_ton.csv",
            "text/csv"
        )
    else:
        st.warning("No matching data for cost/ton calculation")


elif page == "🏷️ Clubs & Groups":
    st.header("🏷️ Clubs & Groups Analysis")

    tab_group, tab_club = st.tabs(["📁 Groups", "🏠 Clubs"])

    with tab_group:
        st.subheader("Select a Group")
        group_options = sorted(tonnage_filtered["group"].unique())
        selected_group = st.selectbox("Choose Group", group_options)

        if selected_group:
            group_data = tonnage_filtered[tonnage_filtered["group"] == selected_group]

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Tonnage", f"{group_data['tonnage'].sum():,.0f} kg")
            with col2:
                st.metric("Farms", f"{group_data['ferme'].nunique()}")
            with col3:
                st.metric("Clubs", f"{group_data['club'].nunique()}")
            with col4:
                st.metric("Varieties", f"{group_data['variety'].nunique()}")

            st.subheader(f"Farms in {selected_group}")
            farms_in_group = group_data.groupby("ferme").agg({
                "tonnage": "sum",
                "variety": "nunique",
                "type": "first",
                "superficie": "first"
            }).sort_values("tonnage", ascending=False)
            farms_in_group.columns = ["Total Tonnage", "Varieties", "Type", "Superficie"]
            st.dataframe(farms_in_group, use_container_width=True)

            st.subheader(f"Tonnage by Farm in {selected_group} (Bar Chart)")
            st.bar_chart(farms_in_group["Total Tonnage"].sort_values(ascending=True))

            st.subheader(f"Comparison: Farm Performance in {selected_group}")
            farm_comparison = group_data.pivot_table(
                values="tonnage",
                index="ferme",
                columns="variety",
                aggfunc="sum",
                fill_value=0
            )
            st.dataframe(farm_comparison, use_container_width=True)

            st.subheader(f"Daily Harvest Pattern - {selected_group}")
            daily_group = group_data.groupby("date")["tonnage"].sum()
            st.line_chart(daily_group)

    with tab_club:
        st.subheader("Select a Club")
        club_options = sorted(tonnage_filtered["club"].unique())
        selected_club = st.selectbox("Choose Club", club_options, key="club_select")

        if selected_club:
            club_data = tonnage_filtered[tonnage_filtered["club"] == selected_club]

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Tonnage", f"{club_data['tonnage'].sum():,.0f} kg")
            with col2:
                st.metric("Farms", f"{club_data['ferme'].nunique()}")
            with col3:
                st.metric("Groups", f"{club_data['group'].nunique()}")
            with col4:
                st.metric("Varieties", f"{club_data['variety'].nunique()}")

            st.subheader(f"Farms in {selected_club}")
            farms_in_club = club_data.groupby("ferme").agg({
                "tonnage": "sum",
                "variety": "nunique",
                "type": "first",
                "superficie": "first"
            }).sort_values("tonnage", ascending=False)
            farms_in_club.columns = ["Total Tonnage", "Varieties", "Type", "Superficie"]
            st.dataframe(farms_in_club, use_container_width=True)

            st.subheader(f"Tonnage by Farm in {selected_club} (Bar Chart)")
            st.bar_chart(farms_in_club["Total Tonnage"].sort_values(ascending=True))

            st.subheader(f"Comparison: Farm Performance in {selected_club}")
            farm_comp_club = club_data.pivot_table(
                values="tonnage",
                index="ferme",
                columns="variety",
                aggfunc="sum",
                fill_value=0
            )
            st.dataframe(farm_comp_club, use_container_width=True)

st.markdown("---")
st.caption("📁 Data Lake | Parquet + DuckDB | Powered by Streamlit")