"use client";

import { useEffect, useRef, useState } from "react";

const KNOWLEDGE_TIPS = [
  {
    title: "分析引擎",
    content: "本系统基于徐子平《渊海子平》理论体系，采用日主旺衰、格局用神、大运流年三重推演，结合现代统计学进行量化分析。"
  },
  {
    title: "八字基础",
    content: "八字由年、月、日、时四柱组成，每柱一天干一地支，共八个字。日柱天干代表命主本人，称为「日主」。"
  },
  {
    title: "十神体系",
    content: "十神是八字分析的核心工具：比肩劫财为同类，食神伤官泄秀气，正财偏财主财运，正官七杀论事业，正印偏印看学业。"
  },
  {
    title: "大运流年",
    content: "大运每十年一变，决定人生大方向；流年每年一换，影响具体事件。两者配合，才能精准定位吉凶应期。"
  },
  {
    title: "用神忌神",
    content: "用神是命局最需要的五行，遇之则吉；忌神是命局最忌讳的五行，遇之则凶。流年遇用神加分，遇忌神减分。"
  },
  {
    title: "格局层次",
    content: "格局决定命理层次高低。正官格主贵、食神格主福、正财格主富、七杀格主权威，不同格局有不同的人生走向。"
  }
];

interface BaziData {
  bazi: string;
  dayMaster: string;
  strength: string;
  pattern: string;
  favorable: string[];
  unfavorable: string[];
  currentDayun: string;
}

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  baziData: BaziData | null;
  streamingText: string;
}

export function AnalysisProgress({ isAnalyzing, baziData }: AnalysisProgressProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % KNOWLEDGE_TIPS.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const currentTip = KNOWLEDGE_TIPS[currentTipIndex];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5EA] overflow-hidden">
        {baziData && (
          <div className="border-b border-[#E5E5EA] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#34C759]" />
              <span className="text-sm font-medium text-[#1D1D1F]">命盘信息</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#86868B]">八字</span>
                  <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">{baziData.bazi}</p>
                </div>
                <div>
                  <span className="text-xs text-[#86868B]">日主</span>
                  <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">{baziData.dayMaster}</p>
                </div>
                <div>
                  <span className="text-xs text-[#86868B]">格局</span>
                  <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">{baziData.pattern}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#86868B]">身强弱</span>
                  <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">{baziData.strength}</p>
                </div>
                <div>
                  <span className="text-xs text-[#86868B]">喜用神</span>
                  <p className="text-sm font-semibold text-[#34C759] mt-0.5">{baziData.favorable.join("、")}</p>
                </div>
                <div>
                  <span className="text-xs text-[#86868B]">忌神</span>
                  <p className="text-sm font-semibold text-[#FF3B30] mt-0.5">{baziData.unfavorable.join("、")}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#F5F5F7]">
              <span className="text-xs text-[#86868B]">当前大运</span>
              <p className="text-sm font-semibold text-[#007AFF] mt-0.5">{baziData.currentDayun}</p>
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            {isAnalyzing && (
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
            <span className="text-sm font-medium text-[#1D1D1F]">
              AI 深度分析中
              <span className="text-[#86868B] font-normal ml-1">（约需 1-2 分钟）</span>
            </span>
          </div>

          <div 
            ref={contentRef}
            className="min-h-[120px] flex flex-col justify-center"
          >
            <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded">
                  {currentTip.title}
                </span>
              </div>
              <p className="text-sm text-[#1D1D1F] leading-relaxed">
                {currentTip.content}
              </p>
            </div>
            
            <div className="flex justify-center gap-1.5 mt-4">
              {KNOWLEDGE_TIPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    index === currentTipIndex ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
