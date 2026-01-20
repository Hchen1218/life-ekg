import { Activity } from "lucide-react";

interface DashboardHeaderProps {
  greeting?: string;
  userName: string;
  vitalityScore: number;
}

export function DashboardHeader({ 
  greeting = "早上好", 
  userName, 
  vitalityScore 
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#1D1D1F] tracking-tight">
          {greeting}, <span className="text-gray-400">{userName}</span>
        </h1>
        <p className="text-[#86868B] mt-2 text-lg">
          这是您的生命运势分析报告
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
        <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
            生命活力指数
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1D1D1F]">
              {vitalityScore}
            </span>
            <span className="text-sm text-[#86868B] font-medium">/100</span>
          </div>
        </div>
      </div>
    </header>
  );
}
