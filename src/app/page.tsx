"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FortuneForm } from "@/components/FortuneForm";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { MedicalReportSection, generateDefaultSections, ReportSection } from "@/components/MedicalReportSection";
import { ReportExport } from "@/components/ReportExport";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FortuneAnalysisParams, FortuneResponse, YearNode, FortuneDimensions } from "@/types/fortune";
import { generateMockFortuneData } from "@/lib/fortune-utils";
import { RefreshCw } from "lucide-react";

const MedicalEKGChart = dynamic(
  () => import("@/components/MedicalEKGChart").then((mod) => mod.MedicalEKGChart),
  { ssr: false, loading: () => <div className="h-[300px] w-full bg-white rounded-3xl animate-pulse" /> }
);

interface BaziData {
  bazi: string;
  dayMaster: string;
  strength: string;
  pattern: string;
  favorable: string[];
  unfavorable: string[];
  currentDayun: string;
  _cache?: string;
}

interface TimelineResult {
  timeline: YearNode[];
}

interface DetailResult {
  dimensions?: FortuneDimensions;
  summary?: string;
  advice?: string;
}

async function fetchStreamWithRetry(
  params: FortuneAnalysisParams,
  type: "timeline" | "detail" | "summary" | "dimensions",
  baziContextCache?: string,
  onBazi?: (data: BaziData) => void,
  activationKey?: string,
  maxRetries: number = 3
): Promise<TimelineResult | DetailResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchStream(params, type, baziContextCache, onBazi, activationKey);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`API 请求失败 (尝试 ${attempt}/${maxRetries}): ${lastError.message}`);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("请求失败，请稍后重试");
}

async function fetchStream(
  params: FortuneAnalysisParams,
  type: "timeline" | "detail" | "summary" | "dimensions",
  baziContextCache?: string,
  onBazi?: (data: BaziData) => void,
  activationKey?: string
): Promise<TimelineResult | DetailResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, type, baziContextCache, activationKey }),
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${type}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: TimelineResult | DetailResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const eventData = JSON.parse(line.slice(6));
          
          if (eventData.type === "bazi" && onBazi) {
            onBazi(eventData.data);
          } else if (eventData.type === "complete") {
            result = eventData.data;
          } else if (eventData.type === "error") {
            throw new Error(eventData.data.message);
          }
        } catch (parseError) {
          if (parseError instanceof SyntaxError) continue;
          throw parseError;
        }
      }
    }
  }

  if (!result) {
    throw new Error(`未获取到${type}结果`);
  }

  return result;
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fortuneData, setFortuneData] = useState<FortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baziData, setBaziData] = useState<BaziData | null>(null);
  const [userName, setUserName] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [timelineData, setTimelineData] = useState<YearNode[] | null>(null);
  const [detailData, setDetailData] = useState<DetailResult | null>(null);
  const [loadingStage, setLoadingStage] = useState<"bazi" | "timeline" | "detail" | "complete">("bazi");
  
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (params: FortuneAnalysisParams, activationKey: string) => {
    setIsAnalyzing(true);
    setError(null);
    setFortuneData(null);
    setBaziData(null);
    setTimelineData(null);
    setDetailData(null);
    setUserName(params.name);
    setLoadingStage("bazi");

    try {
      let baziCache: string | undefined;

      const scopes = ["timeline_p1", "timeline_p2", "timeline_p3"];
      
      const timelinePromises = scopes.map((scope, index) => 
        fetchStreamWithRetry(
          { ...params, scope } as any, 
          "timeline",
          undefined,
          (bazi) => {
            if (index === 0) {
              setBaziData(bazi);
              baziCache = bazi._cache;
              setLoadingStage("timeline");
            }
          },
          activationKey
        )
      );

      // Wait for all timeline chunks to complete
      const timelineResults = await Promise.all(timelinePromises);
      
      // Merge timeline chunks
      let mergedTimeline = timelineResults
        .flatMap(r => (r as TimelineResult).timeline)
        .sort((a, b) => a.year - b.year);

      // Flatten the curve for the "Dead Water" effect
      // If score is between 40-60, force it to be a small ripple (46-54)
      mergedTimeline = mergedTimeline.map(node => {
        if (node.score >= 40 && node.score <= 60) {
          // Deterministic pseudo-random based on year
          // (year * 13) % 9 gives range 0-8. 46 + [0-8] = 46-54
          const flattenedScore = 46 + ((node.year * 13) % 9);
          return { ...node, score: flattenedScore };
        }
        return node;
      });

      setTimelineData(mergedTimeline);
      setLoadingStage("detail");

      const summaryPromise = fetchStreamWithRetry(params, "summary", baziCache, undefined, activationKey);
      const dimensionPromise = fetchStreamWithRetry(params, "dimensions", baziCache, undefined, activationKey);

      // Handle Summary First
      summaryPromise.then((res) => {
        const result = res as DetailResult;
        setDetailData(prev => ({ ...prev, summary: result.summary, advice: result.advice }));
      });

      // Handle Dimensions Later
      dimensionPromise.then((res) => {
        const result = res as DetailResult;
        setDetailData(prev => ({ ...prev, dimensions: result.dimensions }));
      });

      // Wait for both to finish just to mark complete (but UI updates progressively)
      await Promise.all([summaryPromise, dimensionPromise]);
      
      setLoadingStage("complete");

      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 300));

      const fullData: FortuneResponse = {
        timeline: mergedTimeline,
        dimensions: (await dimensionPromise as DetailResult).dimensions!,
        summary: (await summaryPromise as DetailResult).summary!,
        advice: (await summaryPromise as DetailResult).advice!,
        baziContext: baziData ? {
          bazi: baziData.bazi,
          dayMaster: baziData.dayMaster,
          strength: baziData.strength,
          pattern: baziData.pattern,
          favorable: baziData.favorable,
          unfavorable: baziData.unfavorable,
          currentDayun: baziData.currentDayun,
        } : undefined,
      };

      setFortuneData(fullData);
      setIsAnalyzing(false);
      setIsTransitioning(false);

    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "分析失败");
      
      const mockData = generateMockFortuneData();
      setFortuneData(mockData);
      setIsAnalyzing(false);
    }
  }, [baziData]);

  const handleReset = () => {
    setFortuneData(null);
    setError(null);
    setBaziData(null);
    setTimelineData(null);
    setDetailData(null);
  };

  const reportSections: ReportSection[] = fortuneData 
    ? generateDefaultSections({
        summary: fortuneData.summary,
        advice: fortuneData.advice,
        dimensions: fortuneData.dimensions,
      })
    : [];
    
  const vitalityScore = fortuneData 
    ? Math.round(fortuneData.timeline.reduce((acc, curr) => acc + curr.score, 0) / fortuneData.timeline.length)
    : 0;

  if (!fortuneData && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
             <div className="text-center mb-10">
               {/* <h1 className="text-4xl font-bold text-[#1D1D1F] tracking-tight mb-2">Life EKG</h1>
               <p className="text-[#86868B]">Visualize your destiny with AI analysis</p> */}
             </div>
             <FortuneForm onSubmit={handleSubmit} isLoading={isAnalyzing} />
             <div className="text-center mt-8 space-y-2">
                <p className="text-xs text-[#86868B]/60 font-medium">
                  您的信息将被安全加密处理
                </p>
                <p className="text-xs text-[#86868B]/40 font-medium">
                   X @AlexxxCreator &nbsp;•&nbsp; Email hchennn@iCloud.com
                </p>
             </div>
          </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className={`min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <div className="w-full max-w-2xl space-y-6">
          <AnalysisProgress 
            isAnalyzing={isAnalyzing}
            baziData={baziData}
            streamingText=""
          />
          
          {timelineData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MedicalEKGChart data={timelineData} />
            </div>
          )}
          
          {isAnalyzing && !detailData && (
            <div className="space-y-4 animate-in fade-in duration-300">
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <DashboardSidebar />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto md:ml-20 lg:ml-64 transition-all duration-300">
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
          <DashboardHeader 
            userName={userName} 
            vitalityScore={vitalityScore} 
          />

          <div ref={reportRef} className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
            {error && (
              <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
                <p className="text-orange-600 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">⚠️</span> API Error, showing demo data
                </p>
                <p className="text-orange-400 text-xs mt-2 font-mono ml-7">{error}</p>
              </div>
            )}

            {fortuneData && (
              <>
                <MedicalEKGChart data={fortuneData.timeline} />
                <MedicalReportSection sections={reportSections} />
              </>
            )}
            
            <div className="pt-8 pb-12 space-y-6">
              <ReportExport reportRef={reportRef as React.RefObject<HTMLDivElement>} userName={userName} />
              
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#007AFF] rounded-xl font-medium shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] active:scale-95 transition-all hover:bg-gray-50"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Start New Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
