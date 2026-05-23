"""Minimal yfinance fetcher used in Phase-0.5 to overlay real OHLCV onto the
mock candidate list. Phase 1+ replaces this with `jugaad-data` + parquet store.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal

import yfinance as yf

Exchange = Literal["NSE", "BSE", "BOTH"]

_SUFFIX = {"NSE": ".NS", "BSE": ".BO", "BOTH": ".NS"}


@dataclass(frozen=True)
class Quote:
    symbol: str
    last_price: float
    avg_daily_volume_cr: float
    as_of: date


def _yf_symbol(symbol: str, exchange: Exchange) -> str:
    return f"{symbol}{_SUFFIX[exchange]}"


def fetch_quote(symbol: str, exchange: Exchange, *, period: str = "30d") -> Quote | None:
    """Pull last 30 trading days, return last close + 20d avg traded value in ₹ crore.

    Returns None when yfinance has no data (delisted, SME with no feed, etc.) so
    the caller can fall back to mocked values.
    """
    yf_sym = _yf_symbol(symbol, exchange)
    try:
        hist = yf.Ticker(yf_sym).history(period=period, auto_adjust=False)
    except Exception:
        return None
    if hist.empty:
        return None

    last_row = hist.iloc[-1]
    last_price = float(last_row["Close"])

    tail = hist.tail(20)
    traded_value = (tail["Close"] * tail["Volume"]).mean()
    avg_daily_volume_cr = round(float(traded_value) / 1e7, 2)

    as_of_ts = hist.index[-1]
    as_of = as_of_ts.date() if hasattr(as_of_ts, "date") else date.today()

    return Quote(
        symbol=symbol,
        last_price=round(last_price, 2),
        avg_daily_volume_cr=avg_daily_volume_cr,
        as_of=as_of,
    )
