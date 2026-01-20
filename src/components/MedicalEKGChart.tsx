"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { YearNode } from "@/types/fortune";

interface MedicalEKGChartProps {
  data: YearNode[];
  currentYear?: number;
}

const fortuneLevels = [
  { value: 85, label: "大吉" },
  { value: 55, label: "平" },
  { value: 25, label: "凶" },
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: YearNode; value: number }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const node = data.payload;
    const hasEvents = node.events && node.events.length > 0;

    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-[#E5E5EA]">
        <p className="text-sm font-semibold text-[#1D1D1F]">{node.year}年</p>
        <p className="text-sm text-[#86868B] mt-1">
          运势指数: <span className="text-[#FF3B30] font-bold">{node.score}</span>
        </p>
        {hasEvents && (
          <p className="text-sm text-[#007AFF] font-medium mt-1">
            重要事件: {node.events[0]}
          </p>
        )}
      </div>
    );
  }
  return null;
}

function CustomDot(props: { cx?: number; cy?: number; payload?: YearNode; currentYear: number }) {
  const { cx, cy, payload, currentYear } = props;
  if (!cx || !cy || !payload) return null;

  if (payload.year === currentYear) {
    return (
      <g>
        <circle cx={cx} cy={cy} r="12" fill="#FF3B30" opacity="0.3">
          <animate attributeName="r" from="6" to="16" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r="6" fill="#FF3B30" stroke="#fff" strokeWidth="2" />
      </g>
    );
  }
  return null;
}

export function MedicalEKGChart({ data, currentYear = new Date().getFullYear() }: MedicalEKGChartProps) {
  const [tickInterval, setTickInterval] = useState(1);

  useEffect(() => {
    function calculateInterval() {
      const width = window.innerWidth;
      if (width >= 768) {
        return 1;
      } else if (width >= 600) {
        return 1;
      } else if (width >= 400) {
        return 2;
      } else {
        return 4;
      }
    }

    setTickInterval(calculateInterval());

    function handleResize() {
      setTickInterval(calculateInterval());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      year: d.year,
      value: d.score,
    }));
  }, [data]);

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 lg:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#1D1D1F]">生命节律</h2>
          <p className="text-xs md:text-sm text-[#86868B] mt-0.5">十年运势趋势分析</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
          <span className="text-xs md:text-sm font-medium text-[#34C759]">实时监测中</span>
        </div>
      </div>

      <div className="h-[400px] md:h-[280px] lg:h-[320px] -mx-2 md:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ekgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF3B30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={true} horizontal={true} />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#86868B", fontSize: 11 }}
              dy={10}
              interval={tickInterval}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              width={40}
              ticks={[25, 55, 85]}
              tickFormatter={(value) => {
                if (value === 85) return "大吉";
                if (value === 55) return "平";
                if (value === 25) return "凶";
                return "";
              }}
              tick={{ fill: "#86868B", fontSize: 11 }}
            />
            {fortuneLevels.map((level) => (
              <ReferenceLine
                key={level.label}
                y={level.value}
                stroke="#A1A1A6"
                strokeWidth={1}
                strokeDasharray="6 4"
              />
            ))}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E5EA", strokeWidth: 1 }} />
            <Area
              type="monotoneX"
              dataKey="value"
              stroke="#FF3B30"
              strokeWidth={2.5}
              fill="url(#ekgGradient)"
              dot={(props) => <CustomDot {...props} currentYear={currentYear} />}
              activeDot={{ r: 8, fill: "#FF3B30", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#E5E5EA]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3B30]"></span>
          </span>
          <span className="text-xs text-[#86868B]">当前年份 ({currentYear})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#FF3B30]"></span>
          <span className="text-xs text-[#86868B]">运势曲线</span>
        </div>
      </div>
    </div>
  );
}
