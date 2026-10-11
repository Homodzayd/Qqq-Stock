export interface CandlePoint {
  time: string;
  price: number;
  ema9: number;
  ema20: number;
  ema50: number;
  vwap: number;
  volume: number;
}

export interface MarketNewsItem {
  title: string;
  publisher: string;
  published_at: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  link?: string;
}

export interface MarketSummary {
  timeframe: "5m" | "15m";
  price: number;
  change_pct: number;
  day_high: number;
  day_low: number;
  support_level: number;
  resistance_level: number;
  rsi: number;
  vwap: number;
  ema_9: number;
  ema_20: number;
  ema_50: number;
  volume: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  vwap_relation: "ABOVE_VWAP" | "BELOW_VWAP";
  candles?: CandlePoint[];
  source?: string;
}

export type Big7Performance = Record<string, number>;

export type ContractTier = "BASE_80_100" | "ADV_200" | "ADV_600" | "OTHER";

export interface OptionContract {
  symbol: string;
  type: "CALL" | "PUT";
  strike: number;
  dte: number;
  expiration: string;
  bid: number;
  ask: number;
  spread: number;
  spread_pct: number;
  mid_price: number;
  contract_cost: number;
  open_interest: number;
  volume: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  tier: ContractTier;
  in_target_budget: boolean;
  is_best_pick?: boolean;
  feed_type: "OPRA_REALTIME" | "INDICATIVE";
}

export interface TierScenarioItem {
  tier_id: "BASE_100" | "ADV_200" | "ADV_600";
  title: string;
  subtitle: string;
  contract_symbol: string;
  option_type: "CALL" | "PUT";
  strike: number;
  dte: number;
  entry_cost: number;
  stop_loss_cost: number;
  max_loss_dollar: number;
  target_20_cost: number;
  profit_20_dollar: number;
  target_30_cost: number;
  profit_30_dollar: number;
  account_allocation_pct: number;
  account_risk_pct: number;
  delta: number;
  theta_daily_burn: number;
  risk_note: string;
}

export interface RecommendedContract {
  symbol?: string;
  type: string;
  strike: number;
  expiry?: string;
  entry_price?: number;
  target_price: number;
  stop_loss_price: number;
}

export interface CopilotDecision {
  signal: "BUY CALL" | "BUY PUT" | "WAIT" | "NO TRADE" | "CALL" | "PUT" | "NO_TRADE";
  confidence_score: string;
  yahoo_alignment: string;
  tradingview_alignment: string;
  alpaca_alignment: string;
  recommended_contract?: RecommendedContract;
  market_rationale: string;
  risk_warning: string;
}

export interface CopilotAnalysisResponse {
  status: string;
  timestamp: string;
  market_summary: MarketSummary;
  market_news: MarketNewsItem[];
  big7_performance: Big7Performance;
  options_preview: OptionContract[];
  tier_scenarios: TierScenarioItem[];
  copilot_decision: CopilotDecision;
}
