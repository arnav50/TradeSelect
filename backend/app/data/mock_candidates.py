"""Phase-0 mock data. Phases 1-7 replace this with real ingestion + analysis output.

The shape here is the contract the frontend is built against, so any field
added on the real side must also appear here (and vice-versa).
"""
from __future__ import annotations

from datetime import date

from app.models.candidate import (
    Candidate,
    CandidateSignals,
    CoOccurrenceCell,
    ConvictionScore,
    FeatureFrequency,
    ScanLatest,
    TradeSetup,
)
from app.models.signal import (
    GannSignal,
    MomentumSignal,
    SectorContext,
    SMCSignal,
    StructureSignal,
    TrendSignal,
    VolumeSignal,
)

SCAN_DATE = date(2026, 5, 22)


def _mock_signals(*, strong: bool) -> CandidateSignals:
    return CandidateSignals(
        smc=SMCSignal(
            bos=True,
            choch=strong,
            ob_mitigated=True,
            fvg_filled=strong,
            eqh_swept_recent=strong,
            in_ote_zone=True,
            premium_discount="DISCOUNT",
            ob_zones=[(412.5, 418.0)],
            fvg_zones=[(420.0, 423.5)],
        ),
        gann=GannSignal(
            above_1x1=True,
            near_sq9_cardinal=strong,
            pullback_50pct=True,
            time_cycle_align=strong,
            ma144_support=True,
            sq9_distance_pct=1.2,
            nearest_cardinal=441.0,
            days_since_swing_low=18 if strong else 32,
            retracement_pct=50.0 if strong else 38.2,
        ),
        trend=TrendSignal(
            ema_stack_bullish=True,
            ema20_slope_pct=0.78,
            bb_expansion=True,
            pct_above_ema200=12.4,
            weekly_above_ema20=True,
        ),
        volume=VolumeSignal(
            breakout_x_avg=2.6 if strong else 1.8,
            obv_rising_days=7,
            vwap_reclaim=True,
            delivery_pct=58.2,
            dryup_days=4,
        ),
        momentum=MomentumSignal(
            rsi_d=62.4,
            rsi_w=58.1,
            rsi_rising=True,
            macd_hist=0.85,
            macd_cross_within_5d=True,
            adx=28.5 if strong else 22.1,
            stoch_k=72.0,
            roc=4.8,
        ),
        structure=StructureSignal(
            pattern="VCP" if strong else "BULL_FLAG",
            base_days=11,
            base_depth_pct=34.0,
            breakout_type="POST_CONSOLIDATION",
        ),
        mtf_score=8 if strong else 6,
        sector=SectorContext(
            sector_rank=2,
            outperforming_nifty=True,
            nifty_regime="UPTREND",
            fii_net_3d=1240.5,
        ),
    )


def _candidate(
    symbol: str,
    name: str,
    sector: str,
    mcap: str,
    exchange: str,
    last_price: float,
    smc: int,
    gann: int,
    classical: int,
    strong: bool = True,
    low_liquidity: bool = False,
) -> Candidate:
    raw = smc + gann + classical
    conv = round(raw * 10 / 15, 1)
    return Candidate(
        symbol=symbol,
        exchange=exchange,                       # type: ignore[arg-type]
        name=name,
        sector=sector,
        sub_sector=None,
        mcap_category=mcap,                       # type: ignore[arg-type]
        avg_daily_volume_cr=0.4 if low_liquidity else 18.7,
        low_liquidity=low_liquidity,
        last_price=last_price,
        scan_date=SCAN_DATE,
        scores=ConvictionScore(
            smc=smc, gann=gann, classical=classical,
            raw_15=raw, conviction_10=conv, high_priority=raw >= 10,
        ),
        setup=TradeSetup(
            entry_zone_low=round(last_price * 0.995, 2),
            entry_zone_high=round(last_price * 1.005, 2),
            stop_loss=round(last_price * 0.95, 2),
            target_low=round(last_price * 1.20, 2),
            target_high=round(last_price * 1.30, 2),
            rr_ratio=round((0.25) / 0.05, 2),
        ),
        signals=_mock_signals(strong=strong),
    )


def build_mock_scan() -> ScanLatest:
    candidates = [
        _candidate("HBLENGINE", "HBL Engineering", "Defence", "MID", "NSE", 612.40, 5, 4, 4),
        _candidate("PARAS",     "Paras Defence",   "Defence", "SMALL", "NSE", 1284.10, 4, 5, 4),
        _candidate("RAILTEL",   "RailTel Corp",    "PSU / Telecom", "MID", "NSE", 478.25, 5, 3, 5),
        _candidate("INOXWIND",  "Inox Wind",       "Renewables", "SMALL", "NSE", 196.55, 4, 4, 4),
        _candidate("KPIGREEN",  "KPI Green Energy","Renewables", "SMALL", "BSE", 712.80, 5, 4, 3),
        _candidate("CGCL",      "Capri Global",    "NBFC",      "SMALL", "NSE", 234.15, 3, 3, 4, strong=False),
        _candidate("TARC",      "TARC Ltd",        "Real Estate","SMALL", "NSE", 248.90, 4, 3, 4),
        _candidate("ZAGGLE",    "Zaggle Prepaid",  "Fintech",   "SMALL", "NSE", 412.05, 4, 4, 3),
        _candidate("SMEXAMPLE", "SME Cap Goods Ltd","Capital Goods","SME","BSE", 188.40, 3, 3, 3,
                   strong=False, low_liquidity=True),
        _candidate("PIXTRANS",  "Pix Transmissions","Auto Ancillary","SMALL","NSE", 1654.20, 4, 4, 4),
    ]

    feature_frequencies = [
        FeatureFrequency(feature="BOS on Daily (SMC)",              frequency_pct=92.0, threshold="Yes"),
        FeatureFrequency(feature="OB Mitigation (SMC)",             frequency_pct=84.0, threshold="Yes"),
        FeatureFrequency(feature="FVG Present (SMC)",               frequency_pct=71.0, threshold="Yes"),
        FeatureFrequency(feature="Liquidity Sweep before move",     frequency_pct=68.0, threshold="Yes"),
        FeatureFrequency(feature="OTE Zone entry 61.8-79%",         frequency_pct=63.0, threshold="Yes"),
        FeatureFrequency(feature="Gann 1x1 angle support",          frequency_pct=78.0, threshold="Yes"),
        FeatureFrequency(feature="Gann Square of 9 cardinal",       frequency_pct=55.0, threshold="Yes"),
        FeatureFrequency(feature="Gann 50% retracement pullback",   frequency_pct=62.0, threshold="Yes"),
        FeatureFrequency(feature="Gann time cycle alignment",       frequency_pct=44.0, threshold="No"),
        FeatureFrequency(feature="EMA 9>20>50>200 stack",           frequency_pct=88.0, threshold="Yes"),
        FeatureFrequency(feature="RSI 50-70 at entry",              frequency_pct=81.0, threshold="Yes"),
        FeatureFrequency(feature="MACD crossover <=5 days",         frequency_pct=74.0, threshold="Yes"),
        FeatureFrequency(feature="ADX >= 25",                       frequency_pct=66.0, threshold="Yes"),
        FeatureFrequency(feature="Volume >= 2x on breakout",        frequency_pct=79.0, threshold="Yes"),
        FeatureFrequency(feature="OBV rising 5+ days",              frequency_pct=72.0, threshold="Yes"),
        FeatureFrequency(feature="Volume dry-up 3-5d pre-breakout", frequency_pct=58.0, threshold="No"),
        FeatureFrequency(feature="VCP / Bull Flag / Base breakout", frequency_pct=83.0, threshold="Yes"),
        FeatureFrequency(feature="Sector outperforming Nifty",      frequency_pct=86.0, threshold="Yes"),
        FeatureFrequency(feature="Weekly above EMA 20",             frequency_pct=91.0, threshold="Yes"),
        FeatureFrequency(feature="MTF alignment score >= 7/9",      frequency_pct=70.0, threshold="Yes"),
    ]

    co_occurrence = [
        CoOccurrenceCell(signal_a="BOS (SMC)",       signal_b="Gann 1x1 above",   co_occurrence_pct=74.0, predictive_power="HIGH"),
        CoOccurrenceCell(signal_a="OB Mitigation",   signal_b="Volume 2x",        co_occurrence_pct=68.0, predictive_power="HIGH"),
        CoOccurrenceCell(signal_a="FVG Fill",        signal_b="RSI 50-70",        co_occurrence_pct=61.0, predictive_power="MEDIUM"),
        CoOccurrenceCell(signal_a="Gann SQ9 Card.",  signal_b="ADX >= 25",        co_occurrence_pct=49.0, predictive_power="MEDIUM"),
        CoOccurrenceCell(signal_a="Liquidity Sweep", signal_b="EMA Stack Bull",   co_occurrence_pct=58.0, predictive_power="MEDIUM"),
    ]

    return ScanLatest(
        scan_date=SCAN_DATE,
        cohort_size=37,
        feature_frequencies=feature_frequencies,
        co_occurrence=co_occurrence,
        candidates=candidates,
    )
