"""
Market Data Download Script for InvestIQ
Downloads historical daily market data for RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS
using yfinance, following the exact procedure from the notebook.
Saves raw data to data/raw/stock_data.csv.
"""

import sys
import argparse
from pathlib import Path
import pandas as pd

TICKERS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"]
START_DATE = "2016-01-01"

def download_market_data(output_path: Path = None, force: bool = False):
    if output_path is None:
        workspace_dir = Path(__file__).resolve().parent.parent
        output_path = workspace_dir / "data" / "raw" / "stock_data.csv"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and not force:
        print(f"[EXISTS] Raw data file already exists at: {output_path}")
        print("Use --force to overwrite the existing file.")
        return False

    try:
        import yfinance as yf
    except ImportError:
        print("[ERROR] yfinance is not installed in the current environment.")
        return False

    end_date = (pd.Timestamp.today().normalize() + pd.Timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"Downloading historical stock data from {START_DATE} to {end_date}...")
    print(f"Equities: {', '.join(TICKERS)}")

    parts = []
    for ticker in TICKERS:
        print(f"  Fetching {ticker}...", end=" ", flush=True)
        try:
            d = yf.download(
                ticker,
                start=START_DATE,
                end=end_date,
                auto_adjust=True,
                progress=False,
                multi_level_index=False
            )
            if d is None or d.empty:
                print("FAILED (no data returned)")
                continue

            d = d.copy()
            d.columns = [str(c[0] if isinstance(c, tuple) else c) for c in d.columns]
            d = d.reset_index()
            d = d.rename(columns={d.columns[0]: "Date"})
            d["Stock"] = ticker
            parts.append(d)
            print(f"OK ({len(d)} rows)")
        except Exception as e:
            print(f"ERROR ({e})")

    if not parts:
        print("[ERROR] No stock data downloaded. Check your internet connection.")
        return False

    prices = pd.concat(parts, ignore_index=True)
    prices["Date"] = pd.to_datetime(prices["Date"], errors="coerce")
    prices = prices.dropna(subset=["Date", "Close"]).drop_duplicates(["Date", "Stock"]).sort_values(["Stock", "Date"])

    prices.to_csv(output_path, index=False)
    print(f"\n[SUCCESS] Successfully saved {len(prices)} rows to {output_path}")
    print(f"Date range: {prices['Date'].min().strftime('%Y-%m-%d')} to {prices['Date'].max().strftime('%Y-%m-%d')}")
    summary = prices.groupby("Stock").agg(
        first_date=("Date", "min"),
        last_date=("Date", "max"),
        rows=("Close", "count")
    )
    print("\nSummary by Stock:")
    print(summary.to_string())
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download raw historical stock data.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing data file if it exists.")
    args = parser.parse_args()
    download_market_data(force=args.force)
