from __future__ import annotations

from pydantic import BaseModel, Field


class SMCSignal(BaseModel):
    bos: bool = Field(description="Break of Structure confirmed on Daily")
    choch: bool = Field(description="Change of Character on 4H/Daily")
    ob_mitigated: bool = Field(description="Bullish Order Block mitigated before move")
    fvg_filled: bool = Field(description="Fair Value Gap partially or fully filled")
    eqh_swept_recent: bool = Field(description="Equal Highs swept within prior 3-5 days")
    in_ote_zone: bool = Field(description="Entry between 61.8%-79% fib retracement")
    premium_discount: str = Field(description="DISCOUNT | EQUILIBRIUM | PREMIUM")
    ob_zones: list[tuple[float, float]] = Field(default_factory=list)
    fvg_zones: list[tuple[float, float]] = Field(default_factory=list)


class GannSignal(BaseModel):
    above_1x1: bool
    near_sq9_cardinal: bool
    pullback_50pct: bool
    time_cycle_align: bool
    ma144_support: bool
    sq9_distance_pct: float = Field(description="Percent distance to nearest cardinal level")
    nearest_cardinal: float
    days_since_swing_low: int
    retracement_pct: float


class TrendSignal(BaseModel):
    ema_stack_bullish: bool = Field(description="EMA 9 > 20 > 50 > 200")
    ema20_slope_pct: float
    bb_expansion: bool
    pct_above_ema200: float
    weekly_above_ema20: bool


class VolumeSignal(BaseModel):
    breakout_x_avg: float = Field(description="Breakout-day volume / 20d avg")
    obv_rising_days: int
    vwap_reclaim: bool
    delivery_pct: float | None = None
    dryup_days: int = Field(description="Consecutive low-volume days before breakout")


class MomentumSignal(BaseModel):
    rsi_d: float
    rsi_w: float
    rsi_rising: bool
    macd_hist: float
    macd_cross_within_5d: bool
    adx: float
    stoch_k: float
    roc: float


class StructureSignal(BaseModel):
    pattern: str = Field(description="VCP | BULL_FLAG | CUP_HANDLE | ASC_TRIANGLE | BASE | DOUBLE_BOTTOM | OTHER")
    base_days: int
    base_depth_pct: float
    breakout_type: str = Field(description="ALL_TIME_HIGH | FIFTY_TWO_WEEK_HIGH | HORIZONTAL | POST_CONSOLIDATION")


class SectorContext(BaseModel):
    sector_rank: int = Field(description="Rank by frequency of qualifying stocks")
    outperforming_nifty: bool
    nifty_regime: str = Field(description="UPTREND | RANGE | DOWNTREND")
    fii_net_3d: float | None = None
