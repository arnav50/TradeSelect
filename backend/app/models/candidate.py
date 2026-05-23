from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from .signal import (
    GannSignal,
    MomentumSignal,
    SectorContext,
    SMCSignal,
    StructureSignal,
    TrendSignal,
    VolumeSignal,
)

Exchange = Literal["NSE", "BSE", "BOTH"]
MarketCap = Literal["LARGE", "MID", "SMALL", "MICRO", "SME"]


class ConvictionScore(BaseModel):
    smc: int = Field(ge=0, le=5)
    gann: int = Field(ge=0, le=5)
    classical: int = Field(ge=0, le=5)
    raw_15: int = Field(ge=0, le=15)
    conviction_10: float = Field(ge=0, le=10)
    high_priority: bool


class TradeSetup(BaseModel):
    entry_zone_low: float
    entry_zone_high: float
    stop_loss: float
    target_low: float
    target_high: float
    rr_ratio: float


class CandidateSignals(BaseModel):
    smc: SMCSignal
    gann: GannSignal
    trend: TrendSignal
    volume: VolumeSignal
    momentum: MomentumSignal
    structure: StructureSignal
    mtf_score: int = Field(ge=0, le=9)
    sector: SectorContext


class Candidate(BaseModel):
    symbol: str
    exchange: Exchange
    name: str
    sector: str
    sub_sector: str | None = None
    mcap_category: MarketCap
    avg_daily_volume_cr: float
    low_liquidity: bool

    last_price: float
    scan_date: date

    scores: ConvictionScore
    setup: TradeSetup
    signals: CandidateSignals


class FeatureFrequency(BaseModel):
    """Step-12 frequency table row."""

    feature: str
    frequency_pct: float = Field(ge=0, le=100)
    threshold: str


class CoOccurrenceCell(BaseModel):
    signal_a: str
    signal_b: str
    co_occurrence_pct: float
    predictive_power: Literal["HIGH", "MEDIUM", "LOW"]


class ScanLatest(BaseModel):
    scan_date: date
    cohort_size: int
    feature_frequencies: list[FeatureFrequency]
    co_occurrence: list[CoOccurrenceCell]
    candidates: list[Candidate]
