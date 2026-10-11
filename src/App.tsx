import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  PauseCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
} from "lucide-react";
import {
  CopilotAnalysisResponse,
  OptionContract,
  MarketSummary,
  Big7Performance,
} from "./types";
import { IntradayChart } from "./components/IntradayChart";
import { TradingViewWidget } from "./components/TradingViewWidget";
import { TierComparisonView } from "./components/TierComparisonView";

type ActiveTab = "copilot" | "options" | "tiers" | "architecture";

const PRESET_SCENARIOS: Record<
  string,
  {
    label: string;
    description: string;
    tech_data: MarketSummary;
    big7_data: Big7Performance;
  }
> = {
  bullish_breakout: {
    label: "اختراق صاعد متوافق (BUY CALL)",
    description:
      "Yahoo: القيادات السبعة خضراء بقيادة NVDA · TradingView: السعر فوق VWAP وتقاطع EMA 9 > 20 · Alpaca: سيولة عالية على عقود Call.",
    tech_data: {
      timeframe: "5m",
      price: 494.8,
      change_pct: 1.32,
      day_high: 495.4,
      day_low: 490.2,
      support_level: 492.5,
      resistance_level: 496.2,
      rsi: 61.5,
      vwap: 493.1,
      ema_9: 494.45,
      ema_20: 493.6,
      ema_50: 492.15,
      volume: 612400,
      trend: "BULLISH",
      vwap_relation: "ABOVE_VWAP",
      source: "Scenario Simulation (3-Pillar Bullish Alignment)",
    },
    big7_data: {
      NVDA: 2.65,
      AAPL: 1.18,
      MSFT: 1.42,
      AMZN: 1.75,
      GOOGL: 0.94,
      META: 2.1,
      TSLA: 1.85,
    },
  },
  bearish_breakdown: {
    label: "كسر هابط متوافق (BUY PUT)",
    description:
      "Yahoo: ضغط بيعي على السبعة الكبار · TradingView: السعر تحت VWAP وكسر مستوى الدعم · Alpaca: تدفقات قوية على عقود Put Near-ATM.",
    tech_data: {
      timeframe: "5m",
      price: 488.2,
      change_pct: -1.45,
      day_high: 492.1,
      day_low: 487.6,
      support_level: 487.5,
      resistance_level: 490.8,
      rsi: 37.4,
      vwap: 490.45,
      ema_9: 488.65,
      ema_20: 489.8,
      ema_50: 491.1,
      volume: 745000,
      trend: "BEARISH",
      vwap_relation: "BELOW_VWAP",
      source: "Scenario Simulation (3-Pillar Bearish Breakdown)",
    },
    big7_data: {
      NVDA: -2.95,
      AAPL: -1.45,
      MSFT: -1.62,
      AMZN: -1.88,
      GOOGL: -1.12,
      META: -2.24,
      TSLA: -3.4,
    },
  },
  choppy_conflict: {
    label: "تعارض المصادر الثلاثة (WAIT / NO TRADE)",
    description:
      "تضارب بين Yahoo (تباين القيادات) و TradingView (RSI محايد عند 49.8 والسعر ملاصق لـ VWAP) — يرفض المحرك إجبار المتداول على صفقة.",
    tech_data: {
      timeframe: "5m",
      price: 491.5,
      change_pct: 0.05,
      day_high: 492.6,
      day_low: 490.4,
      support_level: 490.6,
      resistance_level: 492.4,
      rsi: 49.8,
      vwap: 491.42,
      ema_9: 491.35,
      ema_20: 491.6,
      ema_50: 491.55,
      volume: 142000,
      trend: "BEARISH",
      vwap_relation: "ABOVE_VWAP",
      source: "Scenario Simulation (Conflicting Signals)",
    },
    big7_data: {
      NVDA: 0.45,
      AAPL: -0.62,
      MSFT: 0.15,
      AMZN: -0.38,
      GOOGL: 0.22,
      META: -0.54,
      TSLA: -1.15,
    },
  },
};

export default function App() {
  const [data, setData] = useState<CopilotAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("copilot");

  // TradingView Controls (5m / 15m + Chart Mode)
  const [timeframe, setTimeframe] = useState<"5m" | "15m">("5m");
  const [chartViewMode, setChartViewMode] = useState<"native" | "tradingview">("native");

  // Alpaca Options Controls (OPRA vs Indicative + Tier Filters)
  const [alpacaFeed, setAlpacaFeed] = useState<"opra" | "indicative">("opra");
  const [optionFilter, setOptionFilter] = useState<"ALL" | "BASE" | "ADV" | "CALL" | "PUT">("ALL");

  // $1,000 Account Risk Calculator State
  const [accountCapital, setAccountCapital] = useState<number>(1000);
  const [selectedContractCost, setSelectedContractCost] = useState<number>(92);
  const [targetProfitPct, setTargetProfitPct] = useState<number>(25);
  const [stopLossPct, setStopLossPct] = useState<number>(20);

  const [activeScenarioKey, setActiveScenarioKey] = useState<string | null>(null);

  const fetchLiveAnalysis = useCallback(
    async (tf: "5m" | "15m" = timeframe, feed: "opra" | "indicative" = alpacaFeed) => {
      setLoading(true);
      setError(null);
      setActiveScenarioKey(null);
      try {
        const response = await fetch(
          `/api/v1/copilot-analysis?timeframe=${tf}&feed=${feed}`
        );
        const json = await response.json();
        if (!response.ok || json.status === "error") {
          throw new Error(json.message || "تعذر جلب تحليل السوق من الخادم.");
        }
        setData(json);
        if (json.copilot_decision?.recommended_contract?.entry_price) {
          setSelectedContractCost(
            Math.round(json.copilot_decision.recommended_contract.entry_price)
          );
        }
      } catch (err: any) {
        setError(err?.message || "حدث خطأ في الاتصال بالخادم.");
      } finally {
        setLoading(false);
      }
    },
    [timeframe, alpacaFeed]
  );

  const runScenarioSimulation = async (scenarioKey: string) => {
    const preset = PRESET_SCENARIOS[scenarioKey];
    if (!preset) return;
    setLoading(true);
    setError(null);
    setActiveScenarioKey(scenarioKey);
    try {
      const response = await fetch("/api/v1/simulate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tech_data: {
            ...preset.tech_data,
            candles: data?.market_summary?.candles || [],
          },
          big7_data: preset.big7_data,
          news_data: data?.market_news || [],
        }),
      });
      const json = await response.json();
      if (!response.ok || json.status === "error") {
        throw new Error(json.message || "فشل تشغيل المحاكاة.");
      }
      setData(json);
      setActiveTab("copilot");
    } catch (err: any) {
      setError(err?.message || "خطأ في محاكاة السيناريو.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAnalysis(timeframe, alpacaFeed);
  }, [timeframe, alpacaFeed, fetchLiveAnalysis]);

  const decision = data?.copilot_decision;
  const market = data?.market_summary;
  const news = data?.market_news || [];
  const big7 = data?.big7_performance || {};
  const options = data?.options_preview || [];
  const tiers = data?.tier_scenarios || [];

  const filteredOptions = options.filter((opt) => {
    if (optionFilter === "BASE") return opt.tier === "BASE_80_100";
    if (optionFilter === "ADV") return opt.tier === "ADV_200" || opt.tier === "ADV_600";
    if (optionFilter === "CALL") return opt.type === "CALL";
    if (optionFilter === "PUT") return opt.type === "PUT";
    return true;
  });

  const big7Entries = Object.entries(big7);
  const advancingCount = big7Entries.filter(([, v]) => v > 0).length;
  const decliningCount = big7Entries.filter(([, v]) => v < 0).length;

  const getSignalStyling = (sig?: string) => {
    const norm = (sig || "").toUpperCase();
    if (norm.includes("CALL")) {
      return {
        border: "border-emerald-500/60",
        bg: "bg-emerald-950/20",
        text: "text-emerald-400",
        badgeText: "🟢 BUY CALL — إشارة شراء عقد Call صعودي",
        Icon: TrendingUp,
      };
    }
    if (norm.includes("PUT")) {
      return {
        border: "border-rose-500/60",
        bg: "bg-rose-950/20",
        text: "text-rose-400",
        badgeText: "🔴 BUY PUT — إشارة شراء عقد Put هبوطي",
        Icon: TrendingDown,
      };
    }
    if (norm.includes("WAIT")) {
      return {
        border: "border-amber-500/60",
        bg: "bg-amber-950/20",
        text: "text-amber-400",
        badgeText: "🟡 WAIT — انتظار توافق المصادر الثلاثة",
        Icon: PauseCircle,
      };
    }
    return {
      border: "border-slate-600",
      bg: "bg-slate-900/40",
      text: "text-slate-300",
      badgeText: "⚫ NO TRADE — تعارض البيانات (ممنوع التداول)",
      Icon: ShieldAlert,
    };
  };

  const sigStyle = getSignalStyling(decision?.signal);
  const SignalIcon = sigStyle.Icon;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col">
      {/* Top Bar Contract: 3 Zones (Brand, 4 Nav Links, 1 Primary Action) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0B0F17]/95 sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("copilot");
          }}
          className="flex items-center gap-3 text-lg font-bold tracking-tight text-white whitespace-nowrap group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-base shadow-lg shadow-emerald-500/10 group-hover:bg-emerald-500/30 transition-colors">
            Q
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200">QQQ</span>
            <span className="text-sm font-mono-num font-bold text-emerald-400">
              ${market?.price ? market.price.toFixed(2) : "492.40"}
            </span>
            <span
              className={`text-xs font-mono-num font-semibold ${
                (market?.change_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {(market?.change_pct || 0) >= 0
                ? `(+${market?.change_pct}%)`
                : `(${market?.change_pct}%)`}
            </span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab("copilot")}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              activeTab === "copilot" ? "text-white border-emerald-500" : "border-transparent"
            }`}
          >
            المساعد الذكي والمصادر الثلاثة
          </button>
          <button
            onClick={() => setActiveTab("options")}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              activeTab === "options" ? "text-white border-emerald-500" : "border-transparent"
            }`}
          >
            سلسلة خيارات Alpaca والـ Greeks
          </button>
          <button
            onClick={() => setActiveTab("tiers")}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              activeTab === "tiers" ? "text-white border-emerald-500" : "border-transparent"
            }`}
          >
            حساب $1,000 والعقود المتقدمة ($200 / $600)
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
              activeTab === "architecture" ? "text-white border-emerald-500" : "border-transparent"
            }`}
          >
            هيكلية التدفق ومحاكاة السيناريوهات
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLiveAnalysis(timeframe, alpacaFeed)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "جاري فحص المصادر..." : "تحديث القرار اللحظي"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="flex md:hidden items-center justify-around border-b border-[#1E293B] bg-[#111827] px-2 py-2 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab("copilot")}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === "copilot" ? "bg-[#1E293B] text-white" : ""
          }`}
        >
          المساعد الذكي
        </button>
        <button
          onClick={() => setActiveTab("options")}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === "options" ? "bg-[#1E293B] text-white" : ""
          }`}
        >
          Alpaca Options
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === "tiers" ? "bg-[#1E293B] text-white" : ""
          }`}
        >
          حساب $1,000 والعقود
        </button>
        <button
          onClick={() => setActiveTab("architecture")}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === "architecture" ? "bg-[#1E293B] text-white" : ""
          }`}
        >
          السيناريوهات
        </button>
      </div>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 border border-rose-500/40 bg-rose-950/20 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchLiveAnalysis(timeframe, alpacaFeed)}
              className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-md whitespace-nowrap cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading && !data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            <div className="lg:col-span-5 h-96 bg-[#111827] border border-[#1E293B] rounded-lg p-6" />
            <div className="lg:col-span-7 h-96 bg-[#111827] border border-[#1E293B] rounded-lg p-6" />
          </div>
        )}

        {/* TAB 1: MAIN COPILOT WORKSPACE */}
        {activeTab === "copilot" && data && (
          <div className="space-y-6">
            {/* Row 1: AI Decision Engine (5 Cols) + TradingView Technicals & Chart (7 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 4️⃣ AI Decision Engine (Dominant Visual Focal Point) */}
              <section
                className={`lg:col-span-5 border ${sigStyle.border} ${sigStyle.bg} rounded-lg p-6 space-y-5`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#1E293B] pb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      4. محرك القرار الذكي (AI Decision Engine — 3-Source Synthesis)
                    </p>
                    <div className="flex items-center gap-2.5">
                      <SignalIcon className={`w-6 h-6 ${sigStyle.text}`} />
                      <h1 className={`text-2xl font-bold tracking-tight ${sigStyle.text}`}>
                        {decision?.signal || "WAIT"}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{sigStyle.badgeText}</p>
                  </div>

                  <div className="text-left font-mono-num">
                    <span className="text-xs text-slate-400 block">توافق المصادر</span>
                    <span className="text-2xl font-bold text-white">
                      {decision?.confidence_score || "85%"}
                    </span>
                  </div>
                </div>

                {/* 3-Source Convergence Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-[#0B0F17]/90 border border-[#1E293B] rounded-md">
                    <span className="font-semibold text-amber-400 block mb-0.5">
                      1. Yahoo Finance (السوق والقيادات والأخبار):
                    </span>
                    <span className="text-slate-300 leading-relaxed">
                      {decision?.yahoo_alignment}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0B0F17]/90 border border-[#1E293B] rounded-md">
                    <span className="font-semibold text-purple-400 block mb-0.5">
                      2. TradingView (الفني · VWAP · EMA · المستويات):
                    </span>
                    <span className="text-slate-300 leading-relaxed">
                      {decision?.tradingview_alignment}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0B0F17]/90 border border-[#1E293B] rounded-md">
                    <span className="font-semibold text-emerald-400 block mb-0.5">
                      3. Alpaca Options (OPRA · السيولة · الـ Greeks):
                    </span>
                    <span className="text-slate-300 leading-relaxed">
                      {decision?.alpaca_alignment}
                    </span>
                  </div>
                </div>

                {/* Recommended Base Contract ($80-$100) */}
                {decision?.recommended_contract && (
                  <div className="pt-2 border-t border-[#1E293B] space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>أفضل عقد أساسي مقترح ($80–$100 · Near-ATM · 3–5 DTE)</span>
                      <span className="font-mono-num text-emerald-400 font-semibold">
                        {decision.recommended_contract.symbol ||
                          `QQQ ${decision.recommended_contract.strike} ${decision.recommended_contract.type}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 bg-[#0B0F17] border border-[#1E293B] rounded">
                        <span className="text-[11px] text-slate-400 block">العقد</span>
                        <span className="text-xs font-bold font-mono-num text-white mt-0.5 block">
                          {decision.recommended_contract.type} $
                          {decision.recommended_contract.strike}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0B0F17] border border-[#1E293B] rounded">
                        <span className="text-[11px] text-slate-400 block">تكلفة الدخول</span>
                        <span className="text-xs font-bold font-mono-num text-slate-200 mt-0.5 block">
                          ${decision.recommended_contract.entry_price || 92}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0B0F17] border border-[#1E293B] rounded">
                        <span className="text-[11px] text-slate-400 block">
                          الهدف (+20%..30%)
                        </span>
                        <span className="text-xs font-bold font-mono-num text-emerald-400 mt-0.5 block">
                          ${decision.recommended_contract.target_price}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0B0F17] border border-[#1E293B] rounded">
                        <span className="text-[11px] text-slate-400 block">
                          وقف الخسارة (-20%)
                        </span>
                        <span className="text-xs font-bold font-mono-num text-rose-400 mt-0.5 block">
                          ${decision.recommended_contract.stop_loss_price}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
                  <h2 className="text-xs font-semibold text-slate-300">
                    خلاصة مساعد التداول (Copilot Rationale):
                  </h2>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {decision?.market_rationale}
                  </p>
                </div>

                {decision?.risk_warning && (
                  <div className="pt-2.5 border-t border-[#1E293B] flex items-start gap-2 text-xs text-amber-300/90">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{decision.risk_warning}</span>
                  </div>
                )}

                {/* Quick Scenario Tester */}
                <div className="pt-3 border-t border-[#1E293B]">
                  <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                    <span>محاكاة قرار المحرك عند تغير ظروف المصادر الثلاثة:</span>
                    {activeScenarioKey && (
                      <button
                        onClick={() => fetchLiveAnalysis(timeframe, alpacaFeed)}
                        className="text-emerald-400 hover:underline cursor-pointer"
                      >
                        العودة للسوق الحي
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => runScenarioSimulation("bullish_breakout")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-medium rounded border bg-[#0B0F17] border-[#1E293B] text-emerald-400 hover:border-emerald-500/50 truncate cursor-pointer"
                    >
                      🟢 BUY CALL
                    </button>
                    <button
                      onClick={() => runScenarioSimulation("bearish_breakdown")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-medium rounded border bg-[#0B0F17] border-[#1E293B] text-rose-400 hover:border-rose-500/50 truncate cursor-pointer"
                    >
                      🔴 BUY PUT
                    </button>
                    <button
                      onClick={() => runScenarioSimulation("choppy_conflict")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-medium rounded border bg-[#0B0F17] border-[#1E293B] text-amber-400 hover:border-amber-500/50 truncate cursor-pointer"
                    >
                      🟡 WAIT / NO TRADE
                    </button>
                  </div>
                </div>
              </section>

              {/* 2️⃣ TradingView Technical Analysis & Visual Chart (7 Cols) */}
              <section className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
                  <div>
                    <p className="text-xs text-purple-400 font-semibold mb-1">
                      2. قسم التحليل الفني والعرض البصري (TradingView Technicals)
                    </p>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-2xl font-bold font-mono-num text-white">
                        ${market?.price.toFixed(2)}
                      </h2>
                      <span
                        className={`text-xs font-mono-num font-semibold ${
                          (market?.change_pct || 0) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {(market?.change_pct || 0) >= 0
                          ? `+${market?.change_pct}%`
                          : `${market?.change_pct}%`}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          market?.trend === "BULLISH"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        Trend: {market?.trend}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="text-xs text-slate-300 font-mono-num">
                        Volume: {market?.volume.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Timeframe (5m / 15m) & Chart Mode Switcher */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                      <button
                        onClick={() => setTimeframe("5m")}
                        className={`px-2.5 py-1 text-xs font-mono-num font-medium rounded cursor-pointer ${
                          timeframe === "5m"
                            ? "bg-[#1E293B] text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        5m (5 دقائق)
                      </button>
                      <button
                        onClick={() => setTimeframe("15m")}
                        className={`px-2.5 py-1 text-xs font-mono-num font-medium rounded cursor-pointer ${
                          timeframe === "15m"
                            ? "bg-[#1E293B] text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        15m (15 دقيقة)
                      </button>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                      <button
                        onClick={() => setChartViewMode("native")}
                        className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                          chartViewMode === "native"
                            ? "bg-purple-500/20 text-purple-300"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        شارت المستويات
                      </button>
                      <button
                        onClick={() => setChartViewMode("tradingview")}
                        className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                          chartViewMode === "tradingview"
                            ? "bg-purple-500/20 text-purple-300"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        TradingView Live
                      </button>
                    </div>
                  </div>
                </div>

                {/* Technical Indicators Grid (VWAP, RSI, EMA 9/20/50, Support, Resistance) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-slate-400 block">VWAP</span>
                    <span className="text-sm font-bold font-mono-num text-purple-400 mt-0.5 block">
                      ${market?.vwap.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-slate-400 block">RSI (14)</span>
                    <span className="text-sm font-bold font-mono-num text-emerald-400 mt-0.5 block">
                      {market?.rsi.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-slate-400 block">EMA 9</span>
                    <span className="text-sm font-bold font-mono-num text-sky-400 mt-0.5 block">
                      ${market?.ema_9.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-slate-400 block">EMA 20</span>
                    <span className="text-sm font-bold font-mono-num text-amber-400 mt-0.5 block">
                      ${market?.ema_20.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-slate-400 block">EMA 50</span>
                    <span className="text-sm font-bold font-mono-num text-slate-300 mt-0.5 block">
                      ${market?.ema_50.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-emerald-400/90 block">Support (دعم)</span>
                    <span className="text-sm font-bold font-mono-num text-emerald-400 mt-0.5 block">
                      ${market?.support_level.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                    <span className="text-[11px] text-rose-400/90 block">Resistance (مقاومة)</span>
                    <span className="text-sm font-bold font-mono-num text-rose-400 mt-0.5 block">
                      ${market?.resistance_level.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Chart Display: Native S/R + VWAP Chart OR Official TradingView Embed */}
                {chartViewMode === "native" ? (
                  <IntradayChart
                    candles={market?.candles || []}
                    vwap={market?.vwap || 0}
                    ema9={market?.ema_9 || 0}
                    ema20={market?.ema_20 || 0}
                    support={market?.support_level || 0}
                    resistance={market?.resistance_level || 0}
                    timeframe={timeframe}
                  />
                ) : (
                  <TradingViewWidget interval={timeframe === "15m" ? "15" : "5"} />
                )}
              </section>
            </div>

            {/* Row 2: 1️⃣ Yahoo Finance (Big 7 + News) & 3️⃣ Alpaca Options + 6️⃣ Contract Tiers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1️⃣ Yahoo Finance: Big 7 Leaders + Market News (5 Cols) */}
              <section className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                  <div>
                    <p className="text-xs text-amber-400 font-semibold">
                      1. بيانات السوق والقيادات والأخبار (Yahoo Finance)
                    </p>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      أداء الأسهم القيادية السبعة (Big 7 Breadth)
                    </h2>
                  </div>
                  <div className="text-left font-mono-num text-xs">
                    <span className="text-emerald-400 font-semibold">
                      {advancingCount} صاعد
                    </span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-rose-400 font-semibold">
                      {decliningCount} هابط
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#1E293B]">
                  {big7Entries.map(([ticker, perf]) => {
                    const isPos = perf >= 0;
                    const barWidth = Math.min(100, Math.abs(perf) * 28);
                    return (
                      <div
                        key={ticker}
                        className="py-2 flex items-center justify-between gap-4"
                      >
                        <span className="font-mono-num font-bold text-sm text-white w-16">
                          {ticker}
                        </span>
                        <div className="flex-1 h-2 bg-[#0B0F17] rounded-full overflow-hidden flex items-center">
                          <div
                            className={`h-full rounded-full ${
                              isPos ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.max(6, barWidth)}%` }}
                          />
                        </div>
                        <div
                          className={`w-20 text-left font-mono-num text-xs font-semibold flex items-center justify-end gap-1 ${
                            isPos ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPos ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>{isPos ? `+${perf.toFixed(2)}%` : `${perf.toFixed(2)}%`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Yahoo Finance Market News Feed */}
                <div className="pt-3 border-t border-[#1E293B] space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-300">
                    آخر الأخبار والمعلومات السوقية المؤثرة على QQQ:
                  </h3>
                  <div className="space-y-2">
                    {news.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-md space-y-1"
                      >
                        <p className="text-xs text-slate-200 font-medium leading-snug" dir="ltr">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {item.publisher} · {item.published_at}
                          </span>
                          <span
                            className={
                              item.sentiment === "POSITIVE"
                                ? "text-emerald-400"
                                : item.sentiment === "NEGATIVE"
                                ? "text-rose-400"
                                : "text-slate-400"
                            }
                          >
                            {item.sentiment === "POSITIVE"
                              ? "إيجابي للسوق"
                              : item.sentiment === "NEGATIVE"
                              ? "سلبي للسوق"
                              : "محايد"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3️⃣ Alpaca Options Chain + 6️⃣ Contract Tiers Summary (7 Cols) */}
              <section className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold">
                      3. سلسلة خيارات QQQ والـ Greeks والسيولة (Alpaca Options — OPRA Preferred)
                    </p>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      أفضل عقود Call و Put (العقد الأساسي $80–$100 + العقود المتقدمة $200 و $600)
                    </h2>
                  </div>

                  {/* OPRA vs Indicative Feed Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs">
                    <button
                      onClick={() => setAlpacaFeed("opra")}
                      className={`px-2.5 py-1 rounded font-mono-num cursor-pointer ${
                        alpacaFeed === "opra"
                          ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      OPRA Live
                    </button>
                    <button
                      onClick={() => setAlpacaFeed("indicative")}
                      className={`px-2.5 py-1 rounded font-mono-num cursor-pointer ${
                        alpacaFeed === "indicative"
                          ? "bg-[#1E293B] text-white"
                          : "text-slate-400"
                      }`}
                    >
                      Indicative
                    </button>
                  </div>
                </div>

                {/* Compact Alpaca Option Chain with Full Greeks */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E293B] text-[11px] text-slate-400">
                        <th className="py-2 px-2 font-medium">الفئة</th>
                        <th className="py-2 px-2 font-medium">النوع / Strike</th>
                        <th className="py-2 px-2 font-medium text-left">Bid / Ask</th>
                        <th className="py-2 px-2 font-medium text-left">Spread</th>
                        <th className="py-2 px-2 font-medium text-left">تكلفة العقد</th>
                        <th className="py-2 px-2 font-medium text-left">Vol / OI</th>
                        <th className="py-2 px-2 font-medium text-left">Delta / Gamma</th>
                        <th className="py-2 px-2 font-medium text-left">Theta / IV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-xs font-mono-num">
                      {options.map((opt) => {
                        const isCall = opt.type === "CALL";
                        const tierLabel =
                          opt.tier === "BASE_80_100"
                            ? "أساسي $80-$100"
                            : opt.tier === "ADV_200"
                            ? "متقدم ~$200"
                            : "متقدم ~$600";
                        return (
                          <tr
                            key={opt.symbol}
                            className={`hover:bg-[#1E293B]/40 transition-colors ${
                              opt.is_best_pick ? "bg-emerald-950/15" : ""
                            }`}
                          >
                            <td className="py-2.5 px-2 font-sans text-[11px]">
                              <span
                                className={
                                  opt.tier === "BASE_80_100"
                                    ? "text-emerald-400 font-semibold"
                                    : "text-slate-400"
                                }
                              >
                                {tierLabel}
                              </span>
                              {opt.is_best_pick && (
                                <span className="text-amber-400 mr-1">★ الأفضل</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2">
                              <span
                                className={`font-bold ${
                                  isCall ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {opt.type}
                              </span>{" "}
                              <span className="text-white font-semibold">${opt.strike}</span>
                            </td>
                            <td className="py-2.5 px-2 text-left text-slate-300">
                              ${opt.bid.toFixed(2)} / ${opt.ask.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-left text-slate-400">
                              ${opt.spread.toFixed(2)} ({opt.spread_pct}%)
                            </td>
                            <td className="py-2.5 px-2 text-left font-bold text-white">
                              ${opt.contract_cost}
                            </td>
                            <td className="py-2.5 px-2 text-left text-slate-300">
                              {(opt.volume / 1000).toFixed(1)}k / {(opt.open_interest / 1000).toFixed(1)}k
                            </td>
                            <td className="py-2.5 px-2 text-left text-slate-300">
                              {opt.delta.toFixed(2)} / {opt.gamma.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-2 text-left text-slate-400">
                              {opt.theta.toFixed(2)} / {(opt.iv * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Quick 3-Tier Summary Cards ($80-$100 Base, ~$200 Adv, ~$600 Adv) */}
                <div className="pt-3 border-t border-[#1E293B]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-200">
                      5 & 6. مقارنة سريعة: العقد الأساسي ($80–$100) مقابل العقود المتقدمة (~$200 و ~$600) لحساب $1,000:
                    </span>
                    <button
                      onClick={() => setActiveTab("tiers")}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      فتح حاسبة السيناريوهات الكاملة ←
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {tiers.map((t) => (
                      <div
                        key={t.tier_id}
                        className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{t.title}</span>
                          <span className="text-xs font-mono-num font-bold text-emerald-400">
                            ${t.entry_cost}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400">
                          <span>وقف (-20%): -${t.max_loss_dollar}</span>
                          <span>هدف (+25%): +${Math.round(t.entry_cost * 0.25)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          مخاطرة المحفظة: -{t.account_risk_pct}% (تخصيص {t.account_allocation_pct}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: FULL ALPACA OPTIONS CHAIN & GREEKS */}
        {activeTab === "options" && data && (
          <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div>
                <h1 className="text-lg font-bold text-white">
                  سلسلة خيارات QQQ التفصيلية (Alpaca Options — OPRA & Full Greeks)
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  تشمل Strike / Expiry (3–5 DTE) · Bid / Ask · Spread · Volume · Open Interest · Delta / Gamma / Theta / Vega / IV
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
                  {(
                    [
                      { id: "ALL", label: "الكل" },
                      { id: "BASE", label: "الأساسي ($80–$100)" },
                      { id: "ADV", label: "المتقدمة ($200 / $600)" },
                      { id: "CALL", label: "CALL" },
                      { id: "PUT", label: "PUT" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOptionFilter(f.id)}
                      className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                        optionFilter === f.id
                          ? "bg-[#1E293B] text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-xs text-slate-400">
                    <th className="py-3 px-3 font-medium">رمز العقد</th>
                    <th className="py-3 px-2 font-medium">النوع / Strike</th>
                    <th className="py-3 px-2 font-medium text-left">الانتهاء</th>
                    <th className="py-3 px-2 font-medium text-left">Bid / Ask</th>
                    <th className="py-3 px-2 font-medium text-left">Spread</th>
                    <th className="py-3 px-2 font-medium text-left">تكلفة العقد</th>
                    <th className="py-3 px-2 font-medium text-left">Volume</th>
                    <th className="py-3 px-2 font-medium text-left">Open Interest</th>
                    <th className="py-3 px-2 font-medium text-left">Delta</th>
                    <th className="py-3 px-2 font-medium text-left">Gamma</th>
                    <th className="py-3 px-2 font-medium text-left">Theta</th>
                    <th className="py-3 px-2 font-medium text-left">Vega</th>
                    <th className="py-3 px-2 font-medium text-left">IV</th>
                    <th className="py-3 px-2 font-medium text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono-num">
                  {filteredOptions.map((opt) => (
                    <tr
                      key={opt.symbol}
                      className={`hover:bg-[#1E293B]/40 ${
                        opt.is_best_pick ? "bg-emerald-950/15" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-200 font-medium">
                        {opt.symbol}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-bold ${
                            opt.type === "CALL" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {opt.type}
                        </span>{" "}
                        <span className="text-white font-semibold">${opt.strike}</span>
                      </td>
                      <td className="py-3 px-2 text-left text-slate-400">
                        {opt.expiration} ({opt.dte}d)
                      </td>
                      <td className="py-3 px-2 text-left text-slate-300">
                        ${opt.bid.toFixed(2)} / ${opt.ask.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-400">
                        ${opt.spread.toFixed(2)} ({opt.spread_pct}%)
                      </td>
                      <td className="py-3 px-2 text-left font-bold text-white">
                        ${opt.contract_cost}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-300">
                        {opt.volume.toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-300">
                        {opt.open_interest.toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-200">
                        {opt.delta.toFixed(3)}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-300">
                        {opt.gamma.toFixed(3)}
                      </td>
                      <td className="py-3 px-2 text-left text-rose-400">
                        {opt.theta.toFixed(3)}
                      </td>
                      <td className="py-3 px-2 text-left text-slate-300">
                        {opt.vega.toFixed(3)}
                      </td>
                      <td className="py-3 px-2 text-left text-amber-400">
                        {(opt.iv * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-left font-sans">
                        <button
                          onClick={() => {
                            setSelectedContractCost(opt.contract_cost);
                            setActiveTab("tiers");
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded cursor-pointer whitespace-nowrap"
                        >
                          حساب المخاطر
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: $1,000 ACCOUNT & ADVANCED TIERS ($80-$100, ~$200, ~$600) */}
        {activeTab === "tiers" && data && (
          <TierComparisonView
            tiers={tiers}
            accountCapital={accountCapital}
            setAccountCapital={setAccountCapital}
            selectedCost={selectedContractCost}
            setSelectedCost={setSelectedContractCost}
            targetPct={targetProfitPct}
            setTargetPct={setTargetProfitPct}
            stopLossPct={stopLossPct}
            setStopLossPct={setStopLossPct}
          />
        )}

        {/* TAB 4: ARCHITECTURE FLOW & SCENARIO TESTER */}
        {activeTab === "architecture" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-4">
              <h1 className="text-lg font-bold text-white">
                7. هيكلية القرار الثلاثية (لا يعتمد على رأي واحد)
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                يعمل QQQ Trading Copilot كمساعد تداول شخصي يجمع 3 مصادر مستقلة قبل إصدار القرار الهيكلي:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg space-y-1">
                  <span className="font-bold text-amber-400 block">
                    1. Yahoo Finance → السوق والأخبار والقيادات السبعة
                  </span>
                  <p className="text-slate-300">
                    سعر QQQ وحركته · الـ Volume · أداء NVDA, AAPL, MSFT, AMZN, GOOGL, META, TSLA · الأخبار الفورية.
                  </p>
                </div>

                <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg space-y-1">
                  <span className="font-bold text-purple-400 block">
                    2. TradingView → التحليل الفني والعرض البصري
                  </span>
                  <p className="text-slate-300">
                    شارت 5 دقائق و 15 دقيقة · Trend · VWAP · RSI · EMA 9/20/50 · مستويات الدعم والمقاومة (Support / Resistance).
                  </p>
                </div>

                <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg space-y-1">
                  <span className="font-bold text-emerald-400 block">
                    3. Alpaca (OPRA) → سلسلة الخيارات والسيولة والـ Greeks
                  </span>
                  <p className="text-slate-300">
                    Strike / Expiry · Bid / Ask · Spread · Volume · Open Interest · Delta / Gamma / Theta / Vega / IV.
                  </p>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-lg space-y-1">
                  <span className="font-bold text-white block">
                    ⬇️ AI Decision Engine (Gemini Structured Output)
                  </span>
                  <p className="text-slate-200">
                    يصدر حصراً: 🟢 BUY CALL أو 🔴 BUY PUT أو 🟡 WAIT أو ⚫ NO TRADE بدون إجبار المتداول على صفقة عند تعارض البيانات.
                  </p>
                </div>
              </div>
            </section>

            <section className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    مختبر السيناريوهات الثلاثية (اختبار استجابة Gemini)
                  </h2>
                  <p className="text-xs text-slate-400">
                    اضغط على أي سيناريو لإرسال بياناته إلى محرك الذكاء الاصطناعي ومشاهدة قراره
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(PRESET_SCENARIOS).map(([key, item]) => (
                  <div
                    key={key}
                    className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white">{item.label}</h3>
                      <button
                        onClick={() => runScenarioSimulation(key)}
                        disabled={loading}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded cursor-pointer whitespace-nowrap"
                      >
                        تشغيل عبر المحرك
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
