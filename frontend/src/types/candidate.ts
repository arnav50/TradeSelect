import { z } from "zod";

export const ExchangeZ = z.enum(["NSE", "BSE", "BOTH"]);
export const MarketCapZ = z.enum(["LARGE", "MID", "SMALL", "MICRO", "SME"]);

export const SMCSignalZ = z.object({
  bos: z.boolean(),
  choch: z.boolean(),
  ob_mitigated: z.boolean(),
  fvg_filled: z.boolean(),
  eqh_swept_recent: z.boolean(),
  in_ote_zone: z.boolean(),
  premium_discount: z.string(),
  ob_zones: z.array(z.tuple([z.number(), z.number()])),
  fvg_zones: z.array(z.tuple([z.number(), z.number()])),
});

export const GannSignalZ = z.object({
  above_1x1: z.boolean(),
  near_sq9_cardinal: z.boolean(),
  pullback_50pct: z.boolean(),
  time_cycle_align: z.boolean(),
  ma144_support: z.boolean(),
  sq9_distance_pct: z.number(),
  nearest_cardinal: z.number(),
  days_since_swing_low: z.number(),
  retracement_pct: z.number(),
});

export const TrendSignalZ = z.object({
  ema_stack_bullish: z.boolean(),
  ema20_slope_pct: z.number(),
  bb_expansion: z.boolean(),
  pct_above_ema200: z.number(),
  weekly_above_ema20: z.boolean(),
});

export const VolumeSignalZ = z.object({
  breakout_x_avg: z.number(),
  obv_rising_days: z.number(),
  vwap_reclaim: z.boolean(),
  delivery_pct: z.number().nullable(),
  dryup_days: z.number(),
});

export const MomentumSignalZ = z.object({
  rsi_d: z.number(),
  rsi_w: z.number(),
  rsi_rising: z.boolean(),
  macd_hist: z.number(),
  macd_cross_within_5d: z.boolean(),
  adx: z.number(),
  stoch_k: z.number(),
  roc: z.number(),
});

export const StructureSignalZ = z.object({
  pattern: z.string(),
  base_days: z.number(),
  base_depth_pct: z.number(),
  breakout_type: z.string(),
});

export const SectorContextZ = z.object({
  sector_rank: z.number(),
  outperforming_nifty: z.boolean(),
  nifty_regime: z.string(),
  fii_net_3d: z.number().nullable(),
});

export const ConvictionScoreZ = z.object({
  smc: z.number(),
  gann: z.number(),
  classical: z.number(),
  raw_15: z.number(),
  conviction_10: z.number(),
  high_priority: z.boolean(),
});

export const TradeSetupZ = z.object({
  entry_zone_low: z.number(),
  entry_zone_high: z.number(),
  stop_loss: z.number(),
  target_low: z.number(),
  target_high: z.number(),
  rr_ratio: z.number(),
});

export const CandidateSignalsZ = z.object({
  smc: SMCSignalZ,
  gann: GannSignalZ,
  trend: TrendSignalZ,
  volume: VolumeSignalZ,
  momentum: MomentumSignalZ,
  structure: StructureSignalZ,
  mtf_score: z.number(),
  sector: SectorContextZ,
});

export const CandidateZ = z.object({
  symbol: z.string(),
  exchange: ExchangeZ,
  name: z.string(),
  sector: z.string(),
  sub_sector: z.string().nullable(),
  mcap_category: MarketCapZ,
  avg_daily_volume_cr: z.number(),
  low_liquidity: z.boolean(),
  last_price: z.number(),
  scan_date: z.string(),
  scores: ConvictionScoreZ,
  setup: TradeSetupZ,
  signals: CandidateSignalsZ,
});

export const FeatureFrequencyZ = z.object({
  feature: z.string(),
  frequency_pct: z.number(),
  threshold: z.string(),
});

export const CoOccurrenceCellZ = z.object({
  signal_a: z.string(),
  signal_b: z.string(),
  co_occurrence_pct: z.number(),
  predictive_power: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const ScanLatestZ = z.object({
  scan_date: z.string(),
  cohort_size: z.number(),
  feature_frequencies: z.array(FeatureFrequencyZ),
  co_occurrence: z.array(CoOccurrenceCellZ),
  candidates: z.array(CandidateZ),
});

export type Candidate = z.infer<typeof CandidateZ>;
export type ScanLatest = z.infer<typeof ScanLatestZ>;
export type FeatureFrequency = z.infer<typeof FeatureFrequencyZ>;
export type CoOccurrenceCell = z.infer<typeof CoOccurrenceCellZ>;
export type Exchange = z.infer<typeof ExchangeZ>;
export type MarketCap = z.infer<typeof MarketCapZ>;
