"use client";

import { useState, useEffect } from "react";
import { Briefcase, TrendingUp, Heart, Activity, Coins, Brain, Sparkles, ChevronDown, ChevronRight, X } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { getScientificGrade } from "@/lib/fortune-utils";
import { isDimensionDataNew, type DimensionData, type FortuneDimensions, type FortuneDimensionsLegacy } from "@/types/fortune";
import { MarkdownText } from "@/components/MarkdownText";

export interface ReportSection {
  id: string;
  type: "overview" | "career" | "wealth" | "love" | "health" | "yearly" | "advice" | "custom";
  title: string;
  score?: number;
  content: string;
  summary?: string;
  detail?: string;
  highlights?: string[];
}

interface MedicalReportSectionProps {
  sections: ReportSection[];
}

const sparklineData = [
  { value: 30 }, { value: 45 }, { value: 42 }, { value: 55 }, { value: 58 }, { value: 70 }, { value: 85 }
];

function CareerCardViz() {
  return (
    <div className="w-20 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sparklineData}>
          <Line type="monotone" dataKey="value" stroke="#007AFF" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WealthCardViz({ progress = 82 }: { progress?: number }) {
  const dashArray = progress * 0.88;
  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#F5F5F7" strokeWidth="3" />
        {/* Glow effect layer */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="#FF9500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dashArray} 88`}
          className="animate-pulse opacity-30"
        />
        {/* Main progress layer */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="#FF9500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dashArray} 88`}
        />
      </svg>
    </div>
  );
}

function LoveCardViz() {
  return (
    <div className="flex items-center justify-center w-12 h-12">
      <span className="relative flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D55] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF2D55]"></span>
      </span>
    </div>
  );
}

function HealthCardViz() {
  return (
    <div className="w-20 h-12 flex items-center overflow-hidden">
      <svg viewBox="0 0 80 32" className="w-full h-full">
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34C759" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#34C759" stopOpacity="1" />
            <stop offset="100%" stopColor="#34C759" stopOpacity="0.2" />
          </linearGradient>
          <filter id="healthGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0 16 L15 16 L20 16 L25 6 L30 26 L35 10 L40 22 L45 16 L80 16"
          fill="none"
          stroke="#34C759"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.15"
        />
        <path
          d="M0 16 L15 16 L20 16 L25 6 L30 26 L35 10 L40 22 L45 16 L80 16"
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#healthGlow)"
          strokeDasharray="120"
          strokeDashoffset="120"
          className="animate-health-pulse"
        />
        <circle cx="30" cy="26" r="3" fill="#34C759" className="animate-health-dot" />
      </svg>
    </div>
  );
}

interface DimensionCardProps {
  section: ReportSection;
  icon: React.ReactNode;
  color: string;
  visualization: React.ReactNode;
  isMobile: boolean;
  onOpenDetail: (section: ReportSection, color: string, icon: React.ReactNode) => void;
}

function DimensionCard({ section, icon, color, visualization, isMobile, onOpenDetail }: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const grade = section.score ? getScientificGrade(section.score).grade : "B";
  const isHighScore = (section.score || 0) >= 70;
  
  // Use summary/detail if available, otherwise fallback to content
  const displaySummary = section.summary || section.content;
  const hasDetail = !!section.detail;
  
  // Mobile Layout (2x2 Grid, Minimal)
  if (isMobile) {
    return (
      <div 
        onClick={() => onOpenDetail(section, color, icon)}
        className="group bg-white rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200 cursor-pointer border border-transparent active:border-[#007AFF]/20 relative overflow-hidden"
      >
        <div className="flex flex-col h-full justify-between relative z-10">
          <div className="flex justify-between items-start">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${color}15` }}
            >
              <div style={{ color }} className="scale-90">{icon}</div>
            </div>
            <div className="scale-75 origin-top-right -mt-1 -mr-1">
              {visualization}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#86868B] mb-0.5">{section.title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#1D1D1F]">{section.score || 0}</span>
              <span className="text-sm font-semibold" style={{ color }}>{grade}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (List, Detailed)
  return (
    <div className="group bg-white rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        {visualization}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-[#86868B]">{section.title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-bold text-[#1D1D1F]">{section.score || 0}</span>
          <span className="text-xl font-semibold" style={{ color }}>{grade}</span>
          {isHighScore && <TrendingUp className="w-5 h-5 text-[#34C759]" />}
        </div>
      </div>

      <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">
        {displaySummary}
      </p>

      {hasDetail && (
        <>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-[#F5F5F7] rounded-xl p-4">
              <p className="text-sm text-[#6B6B6B] leading-relaxed whitespace-pre-line">
                {section.detail}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color }}
          >
            <span>{expanded ? "收起" : "查看详情"}</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`} 
            />
          </button>
        </>
      )}

      <div className={`flex flex-wrap gap-2 ${hasDetail ? "mt-3" : "mt-4"}`}>
        {section.highlights?.map((tag, i) => (
          <span 
            key={i} 
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ 
              backgroundColor: `${color}15`, 
              color: color
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailModal({ 
  isOpen, 
  onClose, 
  section, 
  color, 
  icon 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  section: ReportSection | null; 
  color: string;
  icon: React.ReactNode;
}) {
  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div 
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <div style={{ color }}>{icon}</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1D1D1F]">{section.title}</h3>
              <p className="text-xs text-[#86868B]">详细分析报告</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto overscroll-y-contain p-6 space-y-6 pb-12 pb-safe">
          {/* Highlights */}
          <div className="flex flex-wrap gap-2">
            {section.highlights?.map((tag, i) => (
              <span 
                key={i} 
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: `${color}15`, 
                  color: color
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Score Large */}
          <div className="flex items-center gap-3">
            <span className="text-5xl font-bold text-[#1D1D1F]">{section.score}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#86868B]">综合评分</span>
              <span className="text-lg font-bold" style={{ color }}>
                {section.score ? getScientificGrade(section.score).grade : "B"}
              </span>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">核心结论</h4>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                {section.summary || section.content}
              </p>
            </div>

            {section.detail && (
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">深度解读</h4>
                <MarkdownText content={section.detail} className="text-sm text-[#6B6B6B]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MedicalReportSection({ sections }: MedicalReportSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{section: ReportSection, color: string, icon: React.ReactNode} | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const careerSection = sections.find(s => s.type === "career");
  const wealthSection = sections.find(s => s.type === "wealth");
  const loveSection = sections.find(s => s.type === "love");
  const healthSection = sections.find(s => s.type === "health");
  const overviewSection = sections.find(s => s.type === "overview");
  const adviceSection = sections.find(s => s.type === "advice");

  const COLORS = {
    career: "#007AFF",
    wealth: "#FF9500",
    love: "#FF2D55",
    health: "#34C759",
  };

  const handleOpenDetail = (section: ReportSection, color: string, icon: React.ReactNode) => {
    setSelectedSection({ section, color, icon });
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
        {careerSection && (
          <DimensionCard 
            section={{ ...careerSection, title: "事业" }}
            icon={<Briefcase className="w-6 h-6" />}
            color={COLORS.career}
            visualization={<CareerCardViz />}
            isMobile={isMobile}
            onOpenDetail={handleOpenDetail}
          />
        )}
        {wealthSection && (
          <DimensionCard 
            section={{ ...wealthSection, title: "财富" }}
            icon={<Coins className="w-6 h-6" />}
            color={COLORS.wealth}
            visualization={<WealthCardViz progress={wealthSection.score || 0} />}
            isMobile={isMobile}
            onOpenDetail={handleOpenDetail}
          />
        )}
        {loveSection && (
          <DimensionCard 
            section={{ ...loveSection, title: "感情" }}
            icon={<Heart className="w-6 h-6" />}
            color={COLORS.love}
            visualization={<LoveCardViz />}
            isMobile={isMobile}
            onOpenDetail={handleOpenDetail}
          />
        )}
        {healthSection && (
          <DimensionCard 
            section={{ ...healthSection, title: "健康" }}
            icon={<Activity className="w-6 h-6" />}
            color={COLORS.health}
            visualization={<HealthCardViz />}
            isMobile={isMobile}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </div>

      <DetailModal 
        isOpen={!!selectedSection}
        onClose={() => setSelectedSection(null)}
        section={selectedSection?.section || null}
        color={selectedSection?.color || ""}
        icon={selectedSection?.icon}
      />

      <div className="mt-6 space-y-6">
        {overviewSection && (
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#30B0C7]/10 flex items-center justify-center text-[#30B0C7]">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#1D1D1F]">整体分析</h3>
            </div>
            <div className="text-sm md:text-base text-[#6B6B6B] leading-relaxed">
              <MarkdownText content={overviewSection.content} />
            </div>
          </div>
        )}
        
        {adviceSection && (
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#1D1D1F]">关键建议</h3>
            </div>
            <div className="text-sm md:text-base text-[#6B6B6B] leading-relaxed">
              <MarkdownText content={adviceSection.content} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function generateDefaultSections(data: {
  summary?: string;
  advice?: string;
  dimensions?: FortuneDimensions | FortuneDimensionsLegacy;
}): ReportSection[] {
  const sections: ReportSection[] = [];

  const getScoreFromLegacy = (arr: number[] | undefined) => {
    if (!arr || arr.length === 0) return 0;
    const slice = arr.slice(0, 5);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  };

  if (data.dimensions) {
    const dims = data.dimensions;
    
    if (isDimensionDataNew(dims.career)) {
      sections.push({
        id: "career",
        type: "career",
        title: "事业",
        score: dims.career.score,
        content: dims.career.summary,
        summary: dims.career.summary,
        detail: dims.career.detail,
        highlights: dims.career.highlights,
      });
      sections.push({
        id: "wealth",
        type: "wealth",
        title: "财富",
        score: (dims.wealth as DimensionData).score,
        content: (dims.wealth as DimensionData).summary,
        summary: (dims.wealth as DimensionData).summary,
        detail: (dims.wealth as DimensionData).detail,
        highlights: (dims.wealth as DimensionData).highlights,
      });
      sections.push({
        id: "love",
        type: "love",
        title: "感情",
        score: (dims.love as DimensionData).score,
        content: (dims.love as DimensionData).summary,
        summary: (dims.love as DimensionData).summary,
        detail: (dims.love as DimensionData).detail,
        highlights: (dims.love as DimensionData).highlights,
      });
      sections.push({
        id: "health",
        type: "health",
        title: "健康",
        score: (dims.health as DimensionData).score,
        content: (dims.health as DimensionData).summary,
        summary: (dims.health as DimensionData).summary,
        detail: (dims.health as DimensionData).detail,
        highlights: (dims.health as DimensionData).highlights,
      });
    } else {
      const legacyDims = dims as FortuneDimensionsLegacy;
      const careerScore = getScoreFromLegacy(legacyDims.career) || 75;
      sections.push({
        id: "career",
        type: "career",
        title: "事业",
        score: careerScore,
        content: careerScore >= 70 
          ? "事业运势极佳，贵人运旺盛。工作中将获得领导赏识，有望获得晋升机会。建议把握上半年的发展时机，积极展现个人能力。"
          : "事业发展需以稳为主。专注于提升核心技能，建立扎实的专业基础。避免盲目转行或进行高风险的职业变动。",
        highlights: careerScore >= 70 ? ["升职在望", "贵人相助"] : ["稳步发展", "技能提升"],
      });

      const wealthScore = getScoreFromLegacy(legacyDims.wealth) || 65;
      sections.push({
        id: "wealth",
        type: "wealth",
        title: "财富",
        score: wealthScore,
        content: wealthScore >= 70
          ? "财运稳中有升，正财收入稳定。上半年适合稳健理财，避免高风险投资。下半年可能有意外收入，但需防止因冲动消费而破财。"
          : "财务状况需要谨慎管理。建议制定合理的收支计划，避免不必要的开支。投资方面应以低风险稳健型产品为主。",
        highlights: wealthScore >= 70 ? ["稳步增长", "谨慎投资"] : ["理性消费", "储蓄为主"],
      });

      const loveScore = getScoreFromLegacy(legacyDims.love) || 70;
      sections.push({
        id: "love",
        type: "love",
        title: "感情",
        score: loveScore,
        content: loveScore >= 70
          ? "桃花运势平稳，单身者今年有望遇到心仪对象，建议多参加社交活动。已有伴侣者感情稳定，但需注意沟通方式，避免因小事产生误会。"
          : "感情生活可能面临一些波折。建议保持平和心态，多与身边人沟通。单身者不宜急于求成，应先完善自我。",
        highlights: loveScore >= 70 ? ["缘分将至", "感情稳定"] : ["耐心沟通", "自我提升"],
      });

      const healthScore = getScoreFromLegacy(legacyDims.health) || 80;
      sections.push({
        id: "health",
        type: "health",
        title: "健康",
        score: healthScore,
        content: healthScore >= 70
          ? "整体健康状况良好，精力充沛。但需注意劳逸结合，避免过度疲劳。建议保持规律作息，适当增加运动量。"
          : "身体状况需要多加关注。注意防寒保暖，保持良好的饮食习惯。建议定期进行体检，及时发现潜在问题。",
        highlights: healthScore >= 70 ? ["状态极佳", "精力充沛"] : ["注意休息", "规律作息"],
      });
    }
  }

  if (data.summary) {
    sections.push({
      id: "overview",
      type: "overview",
      title: "整体分析",
      content: data.summary,
    });
  }

  if (data.advice) {
    sections.push({
      id: "advice",
      type: "advice",
      title: "关键建议",
      content: data.advice,
    });
  }

  return sections;
}
