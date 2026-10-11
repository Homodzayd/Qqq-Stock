import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  interval: "5" | "15";
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ interval }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget h-full w-full";
    container.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "NASDAQ:QQQ",
      interval: interval,
      timezone: "America/New_York",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0B0F17",
      gridColor: "rgba(30, 41, 59, 0.5)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      studies: [
        "VWAP@tv-basicstudies",
        "RSI@tv-basicstudies",
        "MAExp@tv-basicstudies",
      ],
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [interval]);

  return (
    <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg overflow-hidden h-[380px] w-full">
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  );
};
