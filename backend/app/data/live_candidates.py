"""Phase-0.5 live overlay. Reuses the mock scan shape but replaces
last_price / avg_daily_volume_cr / scan_date with real yfinance values.

Conviction scores and signal booleans stay mocked until Phase 2+ TA lands.
The trade setup (entry / stop / target) is recomputed off the real last_price
so the numbers shown to the user are internally consistent.
"""
from __future__ import annotations

from app.data.mock_candidates import build_mock_scan
from app.ingestion.yf_quotes import fetch_quote
from app.models.candidate import Candidate, ScanLatest, TradeSetup


def _refresh_setup(last_price: float) -> TradeSetup:
    return TradeSetup(
        entry_zone_low=round(last_price * 0.995, 2),
        entry_zone_high=round(last_price * 1.005, 2),
        stop_loss=round(last_price * 0.95, 2),
        target_low=round(last_price * 1.20, 2),
        target_high=round(last_price * 1.30, 2),
        rr_ratio=round(0.25 / 0.05, 2),
    )


def _overlay(candidate: Candidate) -> Candidate:
    quote = fetch_quote(candidate.symbol, candidate.exchange)
    if quote is None:
        return candidate

    return candidate.model_copy(
        update={
            "last_price": quote.last_price,
            "avg_daily_volume_cr": quote.avg_daily_volume_cr,
            "low_liquidity": quote.avg_daily_volume_cr < 1.0,
            "scan_date": quote.as_of,
            "setup": _refresh_setup(quote.last_price),
        }
    )


def build_live_scan() -> ScanLatest:
    base = build_mock_scan()
    live_candidates = [_overlay(c) for c in base.candidates]

    latest = max((c.scan_date for c in live_candidates), default=base.scan_date)

    return base.model_copy(
        update={"scan_date": latest, "candidates": live_candidates}
    )
