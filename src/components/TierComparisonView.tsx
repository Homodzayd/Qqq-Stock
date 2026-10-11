import React from "react";
import { TierScenarioItem } from "../types";
import { ShieldAlert, Calculator, CheckCircle2, AlertTriangle } from "lucide-react";

interface TierComparisonViewProps {
  tiers: TierScenarioItem[];
  accountCapital: number;
  setAccountCapital: (v: number) => void;
  selectedCost: number;
  setSelectedCost: (v: number) => void;
  targetPct: number;
  setTargetPct: (v: number) => void;
  stopLossPct: number;
  setStopLossPct: (v: number) => void;
}

export const TierComparisonView: React.FC<TierComparisonViewProps> = ({
  tiers,
  accountCapital,
  setAccountCapital,
  selectedCost,
  setSelectedCost,
  targetPct,
  setTargetPct,
  stopLossPct,
  setStopLossPct,
}) => {
  const stopLossDollar = Number((selectedCost * (1 - stopLossPct / 100)).toFixed(2));
  const targetProfitDollar = Number((selectedCost * (1 + targetPct / 100)).toFixed(2));
  const maxRiskDollar = Number((selectedCost - stopLossDollar).toFixed(2));
  const expectedGainDollar = Number((targetProfitDollar - selectedCost).toFixed(2));
  const accountRiskPercentage = Number(((maxRiskDollar / accountCapital) * 100).toFixed(2));
  const capitalAllocationPercentage = Number(((selectedCost / accountCapital) * 100).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Section 1: The 3 Strategic Contract Tiers ($80-$100 Base, ~$200 Adv, ~$600 Adv) */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
          <div>
            <h1 className="text-lg font-bold text-white">
              مقارنة العقود الأساسية والمتقدمة (Base $80–$100 vs Advanced ~$200 & ~$600)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              حساب تفصيلي للربح والخسارة والمخاطر على حساب $1,000 — تذكير: الربح في عقود الخيارات غير مضمون أبداً ويخضع لتقلبات السعر والتآكل الزمني (Theta).
            </p>
          </div>
          <div className="text-xs font-mono-num text-slate-300">
            رأس المال المرجعي: ${accountCapital.toLocaleString("en-US")} · Day Trading فقط
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {tiers.map((t) => {
            const isBase = t.tier_id === "BASE_100";
            const isHighRisk = t.tier_id === "ADV_600";
            return (
              <div
                key={t.tier_id}
                className={`p-5 rounded-lg border flex flex-col justify-between space-y-4 ${
                  isBase
                    ? "bg-[#0B0F17] border-emerald-500/60"
                    : isHighRisk
                    ? "bg-[#0B0F17] border-rose-500/40"
                    : "bg-[#0B0F17] border-[#1E293B]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#1E293B] pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white">{t.title}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono-num ${
                        isBase ? "text-emerald-400" : isHighRisk ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      ${t.entry_cost}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num text-slate-300">
                    <span>العقد: {t.contract_symbol}</span>
                    <span>
                      {t.option_type} ${t.strike} ({t.dte} DTE)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-num pt-1">
                    <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded">
                      <span className="text-[11px] text-slate-400 font-sans block">
                        وقف الخسارة (-20%)
                      </span>
                      <span className="text-rose-400 font-bold text-sm block mt-0.5">
                        ${t.stop_loss_cost} (-${t.max_loss_dollar})
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded">
                      <span className="text-[11px] text-slate-400 font-sans block">
                        هدف الربح (+20% إلى +30%)
                      </span>
                      <span className="text-emerald-400 font-bold text-sm block mt-0.5">
                        +${t.profit_20_dollar} إلى +${t.profit_30_dollar}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded">
                      <span className="text-[11px] text-slate-400 font-sans block">
                        استهلاك رأس المال
                      </span>
                      <span className="text-white font-semibold block mt-0.5">
                        {t.account_allocation_pct}% من المحفظة
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded">
                      <span className="text-[11px] text-slate-400 font-sans block">
                        مخاطرة الحساب الفعلية
                      </span>
                      <span
                        className={`font-semibold block mt-0.5 ${
                          t.account_risk_pct <= 2.5
                            ? "text-emerald-400"
                            : t.account_risk_pct <= 5
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        -{t.account_risk_pct}% من الحساب
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num pt-1">
                    <span>Delta: {t.delta.toFixed(2)}</span>
                    <span>·</span>
                    <span>تآكل Theta اليومي: -${t.theta_daily_burn}/يوم</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-[#1E293B]">
                    {t.risk_note}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCost(t.entry_cost)}
                  className="w-full py-2 px-3 text-xs font-semibold bg-[#1E293B] hover:bg-slate-700 text-white rounded transition-colors cursor-pointer"
                >
                  تحميل العقد في حاسبة المخاطر (${t.entry_cost})
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Interactive Custom Risk & Position Calculator */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#1E293B] pb-4">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-white">
              حاسبة التداول اليومي المخصصة لحساب $1,000 (Day Trading Risk Calculator)
            </h2>
            <p className="text-xs text-slate-400">
              اضبط تكلفة العقد ونسب الوقف والهدف لمحاكاة التأثير المباشر على محفظتك قبل تنفيذ أي أمر
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 block">رأس المال الإجمالي ($)</label>
            <input
              type="number"
              min={100}
              max={100000}
              step={50}
              value={accountCapital}
              onChange={(e) => setAccountCapital(Math.max(100, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-sm font-mono-num text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 flex justify-between">
              <span>تكلفة العقد ($)</span>
              <span className="font-mono-num text-emerald-400">
                (${(selectedCost / 100).toFixed(2)} للسهم)
              </span>
            </label>
            <input
              type="number"
              min={20}
              max={1000}
              step={5}
              value={selectedCost}
              onChange={(e) => setSelectedCost(Math.max(10, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-sm font-mono-num text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 flex justify-between">
              <span>هدف الربح (Target)</span>
              <span className="font-mono-num text-emerald-400">+{targetPct}%</span>
            </label>
            <input
              type="range"
              min={15}
              max={50}
              value={targetPct}
              onChange={(e) => setTargetPct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mt-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 flex justify-between">
              <span>وقف الخسارة (Stop Loss)</span>
              <span className="font-mono-num text-rose-400">-{stopLossPct}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={35}
              value={stopLossPct}
              onChange={(e) => setStopLossPct(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
            <span className="text-xs text-slate-400 block">سعر البيع عند الهدف</span>
            <span className="text-xl font-bold font-mono-num text-emerald-400 mt-1 block">
              ${targetProfitDollar} (+${expectedGainDollar})
            </span>
          </div>
          <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
            <span className="text-xs text-slate-400 block">سعر الخروج عند الوقف</span>
            <span className="text-xl font-bold font-mono-num text-rose-400 mt-1 block">
              ${stopLossDollar} (-${maxRiskDollar})
            </span>
          </div>
          <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
            <span className="text-xs text-slate-400 block">نسبة المخاطرة من الحساب</span>
            <span
              className={`text-xl font-bold font-mono-num mt-1 block ${
                accountRiskPercentage <= 2.5 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {accountRiskPercentage}% ({capitalAllocationPercentage}% تخصيص)
            </span>
          </div>
          <div className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-lg">
            <span className="text-xs text-slate-400 block">العائد مقابل المخاطرة</span>
            <span className="text-xl font-bold font-mono-num text-white mt-1 block">
              1 : {(targetPct / stopLossPct).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            {selectedCost <= 115 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>
              {selectedCost <= 115
                ? "العقد ضمن النطاق الأساسي الآمن ($80–$100) لحساب $1,000."
                : "العقد في الفئة المتقدمة (أعلى من $100) — يتطلب انضباطاً مضاعفاً في وقف الخسارة الفوري وعدم التبييت."}
            </span>
          </div>
          <span className="text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>الربح غير مضمون · ممنوع تبييت العقود (Day Trading Only)</span>
          </span>
        </div>
      </section>
    </div>
  );
};
