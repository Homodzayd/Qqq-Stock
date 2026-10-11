import React, { useState } from "react";
import { CandlePoint } from "../types";

interface IntradayChartProps {
  candles: CandlePoint[];
  vwap: number;
  ema9: number;
  ema20: number;
  support: number;
  resistance: number;
  timeframe: "5m" | "15m";
}

export const IntradayChart: React.FC<IntradayChartProps> = ({
  candles,
  vwap,
  ema9,
  ema20,
  support,
  resistance,
  timeframe,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!candles || candles.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500 border border-[#1E293B] rounded-lg bg-[#0B0F17]">
        لا توجد بيانات شموع لحظية كافية للرسم البياني
      </div>
    );
  }

  const allValues = [
    ...candles.flatMap((c) => [c.price, c.ema9, c.ema20, c.vwap]),
    support,
    resistance,
  ].filter((v) => v > 0);

  const minVal = Math.min(...allValues) - 0.15;
  const maxVal = Math.max(...allValues) + 0.15;
  const range = Math.max(0.5, maxVal - minVal);

  const width = 760;
  const height = 240;
  const padX = 16;
  const padY = 20;

  const toX = (i: number) =>
    padX + (i / (candles.length - 1)) * (width - padX * 2);
  const toY = (val: number) =>
    height - padY - ((val - minVal) / range) * (height - padY * 2);

  const pricePoints = candles.map((c, i) => `${toX(i)},${toY(c.price)}`).join(" ");
  const ema9Points = candles.map((c, i) => `${toX(i)},${toY(c.ema9)}`).join(" ");
  const ema20Points = candles.map((c, i) => `${toX(i)},${toY(c.ema20)}`).join(" ");
  const vwapPoints = candles.map((c, i) => `${toX(i)},${toY(c.vwap)}`).join(" ");

  const areaPoints = `${toX(0)},${height - padY} ${pricePoints} ${toX(
    candles.length - 1
  )},${height - padY}`;

  const activeCandle =
    hoverIdx !== null && candles[hoverIdx]
      ? candles[hoverIdx]
      : candles[candles.length - 1];

  const resY = toY(resistance);
  const supY = toY(support);

  return (
    <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">
            حركة QQQ والمستويات الفنية ({timeframe === "5m" ? "5 دقائق" : "15 دقيقة"})
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num text-slate-300">
            الوقت: {activeCandle.time}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num text-emerald-400">
            السعر: ${activeCandle.price.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num">
          <span className="text-emerald-400">
            — السعر (${activeCandle.price.toFixed(2)})
          </span>
          <span className="text-sky-400">
            — EMA 9 (${ema9.toFixed(2)})
          </span>
          <span className="text-amber-400">
            — EMA 20 (${ema20.toFixed(2)})
          </span>
          <span className="text-purple-400">
            -- VWAP (${vwap.toFixed(2)})
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 overflow-visible select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="qqqAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Resistance Line */}
          {resistance > 0 && (
            <g>
              <line
                x1={padX}
                y1={resY}
                x2={width - padX}
                y2={resY}
                stroke="#F43F5E"
                strokeDasharray="2 4"
                strokeWidth="1"
                strokeOpacity="0.65"
              />
              <text
                x={padX + 6}
                y={resY - 4}
                fill="#FB7185"
                fontSize="10"
                className="font-mono-num"
              >
                Resistance (المقاومة): ${resistance.toFixed(2)}
              </text>
            </g>
          )}

          {/* Support Line */}
          {support > 0 && (
            <g>
              <line
                x1={padX}
                y1={supY}
                x2={width - padX}
                y2={supY}
                stroke="#10B981"
                strokeDasharray="2 4"
                strokeWidth="1"
                strokeOpacity="0.65"
              />
              <text
                x={padX + 6}
                y={supY - 4}
                fill="#34D399"
                fontSize="10"
                className="font-mono-num"
              >
                Support (الدعم): ${support.toFixed(2)}
              </text>
            </g>
          )}

          {/* Area under price */}
          <polygon points={areaPoints} fill="url(#qqqAreaGrad)" />

          {/* VWAP Dashed Line */}
          <polyline
            fill="none"
            stroke="#C084FC"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            points={vwapPoints}
          />

          {/* EMA 20 Line */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            points={ema20Points}
          />

          {/* EMA 9 Line */}
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.5"
            points={ema9Points}
          />

          {/* Main Price Line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.2"
            points={pricePoints}
          />

          {/* Hover vertical line & dot */}
          {hoverIdx !== null && candles[hoverIdx] && (
            <g>
              <line
                x1={toX(hoverIdx)}
                y1={padY}
                x2={toX(hoverIdx)}
                y2={height - padY}
                stroke="#475569"
                strokeWidth="1"
              />
              <circle
                cx={toX(hoverIdx)}
                cy={toY(candles[hoverIdx].price)}
                r="4"
                fill="#10B981"
                stroke="#0B0F17"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Interactive hit columns */}
          {candles.map((_, i) => {
            const colWidth = (width - padX * 2) / candles.length;
            return (
              <rect
                key={i}
                x={toX(i) - colWidth / 2}
                y={0}
                width={colWidth}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
