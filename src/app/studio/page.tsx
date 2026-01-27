"use client";

import { useState } from "react";
import { MedicalEKGChart } from "@/components/MedicalEKGChart";
import { MedicalReportSection, generateDefaultSections, ReportSection } from "@/components/MedicalReportSection";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { YearNode, FortuneDimensions } from "@/types/fortune";
import { ChevronDown, ChevronUp, Play, X } from "lucide-react";

/**
 * Marketing Studio - 营销素材生成器
 * 
 * 工作流：
 * 1. 在对话中让 AI 生成名人剧本 JSON
 * 2. 粘贴 JSON 到下方输入框
 * 3. 点击"渲染"
 * 4. 隐藏控制面板，截图
 */

interface MarketingScript {
  timeline: YearNode[];
  summary: string;
  advice: string;
  dimensions: FortuneDimensions;
  user: {
    name: string;
    gender: string;
    bazi: string;
  };
}

// 示例数据（贾乃亮）
const EXAMPLE_SCRIPT: MarketingScript = {
  user: {
    name: "贾乃亮",
    gender: "男",
    bazi: "甲子 戊辰 壬午 甲辰"
  },
  timeline: [
    { year: 2010, score: 65, level: "小吉", events: ["恋情公开"], analysis: "" },
    { year: 2011, score: 55, level: "平", events: ["事业稳定"], analysis: "" },
    { year: 2012, score: 88, level: "大吉", events: ["结婚生女"], analysis: "" },
    { year: 2013, score: 60, level: "小吉", events: ["作品热播"], analysis: "" },
    { year: 2014, score: 75, level: "小吉", events: ["综艺爆红"], analysis: "" },
    { year: 2015, score: 68, level: "小吉", events: ["偏偏喜欢你"], analysis: "" },
    { year: 2016, score: 55, level: "平", events: ["事业平稳"], analysis: "" },
    { year: 2017, score: 15, level: "大凶", events: ["婚姻变故"], analysis: "" },
    { year: 2018, score: 35, level: "小凶", events: ["低谷蛰伏"], analysis: "" },
    { year: 2019, score: 30, level: "小凶", events: ["正式离婚"], analysis: "" },
    { year: 2020, score: 50, level: "平", events: ["转型直播"], analysis: "" },
    { year: 2021, score: 62, level: "小吉", events: ["口碑回升"], analysis: "" },
    { year: 2022, score: 78, level: "小吉", events: ["带货崛起"], analysis: "" },
    { year: 2023, score: 85, level: "大吉", events: ["销冠登顶"], analysis: "" },
    { year: 2024, score: 92, level: "大吉", events: ["绝地翻红"], analysis: "" },
  ],
  summary: "你这辈子最大的剧本是：被背叛后的浴火重生。2017年那场风暴不是终点，而是你人生的分水岭。你骨子里有一种「越挫越勇」的狠劲，别人看你跌入谷底，你却在暗处磨刀。直播带货的成功不是偶然——你把所有的愤怒、不甘、委屈，都转化成了对事业的疯狂投入。这才是真正的逆袭。",
  advice: "你已经证明了自己。现在要做的不是继续证明，而是学会放下。那段婚姻教会你的，不只是「看人要准」，更是「爱自己比爱别人重要」。下一段感情，别再当「付出型人格」，找一个能让你做回小孩的人。事业上，你已经站稳了，接下来要考虑的是传承和布局，而不是继续冲锋。",
  dimensions: {
    career: {
      score: 85,
      summary: "绝处逢生",
      detail: "你的事业轨迹像一部励志电影：从当红小生到众叛亲离，再到直播一哥。2017年后你才真正找到了属于自己的赛道。你不适合当「乖乖牌」，你需要一个能完全掌控的舞台。直播就是你的主场——没有剧本，没有导演，你说了算。",
      highlights: ["逆风翻盘", "自主创业"]
    },
    wealth: {
      score: 90,
      summary: "厚积薄发",
      detail: "前半生的财富都是「虚的」——名气换来的代言费，说没就没。2020年后的财富才是「实的」——你亲手一单一单卖出来的。这种「从零开始」的体验让你真正理解了钱的意义。你不会再为别人买单，也不会再被「人情」绑架。",
      highlights: ["直播变现", "财务自由"]
    },
    love: {
      score: 45,
      summary: "先苦后甜",
      detail: "那段婚姻让你学会了一件事：不要太快交出信任。你曾经以为付出就会有回报，现在你知道了，有些人不值得。下一段感情，你会更谨慎，但也会更珍惜。你需要的不是「完美伴侣」，而是一个「真实的人」——能接受你偶尔的脆弱，也能欣赏你的野心。",
      highlights: ["重建信任", "谨慎择偶"]
    },
    health: {
      score: 70,
      summary: "透支警告",
      detail: "2017到2019年那段时间，你的身体替你承受了太多情绪。失眠、焦虑、免疫力下降——这些都是「心病」的躯体化。现在事业稳了，你需要把欠身体的债还上。少熬夜，多运动，定期体检。你的身体比你想象的更需要关爱。",
      highlights: ["情绪管理", "规律作息"]
    }
  }
};

export default function StudioPage() {
  const [script, setScript] = useState<MarketingScript | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [panelVisible, setPanelVisible] = useState(true);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRender = () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonInput) as MarketingScript;
      
      // 基础验证
      if (!parsed.timeline || !Array.isArray(parsed.timeline)) {
        throw new Error("缺少 timeline 数组");
      }
      if (!parsed.user?.name) {
        throw new Error("缺少 user.name");
      }
      
      setScript(parsed);
      setPanelExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON 解析失败");
    }
  };

  const handleLoadExample = () => {
    setJsonInput(JSON.stringify(EXAMPLE_SCRIPT, null, 2));
  };

  const reportSections: ReportSection[] = script 
    ? generateDefaultSections({
        summary: script.summary,
        advice: script.advice,
        dimensions: script.dimensions,
      })
    : [];

  const vitalityScore = script 
    ? Math.round(script.timeline.reduce((acc, curr) => acc + curr.score, 0) / script.timeline.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <DashboardSidebar />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto md:ml-20 lg:ml-64 transition-all duration-300">
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
          {script ? (
            <>
              <DashboardHeader 
                userName={script.user.name} 
                vitalityScore={vitalityScore} 
              />
              
              <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
                <MedicalEKGChart data={script.timeline} />
                <MedicalReportSection sections={reportSections} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                  <Play className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#1D1D1F]">营销素材工作室</h2>
                <p className="text-[#86868B] max-w-md">
                  在右下角的控制面板中粘贴 JSON 剧本，<br/>
                  点击「渲染」即可生成名人心电图
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Director's Control Panel */}
      {panelVisible && (
        <div 
          className={`fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 z-50 ${
            panelExpanded ? "w-[420px]" : "w-[280px]"
          }`}
        >
          {/* Panel Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer"
            onClick={() => setPanelExpanded(!panelExpanded)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-sm text-[#1D1D1F]">导演控制台</span>
            </div>
            <div className="flex items-center gap-2">
              {panelExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setPanelVisible(false); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          {panelExpanded && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#86868B]">JSON 剧本</label>
                  <button
                    onClick={handleLoadExample}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    加载示例（贾乃亮）
                  </button>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"user": {"name": "xxx"}, "timeline": [...], ...}'
                  className="w-full h-48 p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handleRender}
                disabled={!jsonInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                渲染心电图
              </button>

              <p className="text-[10px] text-center text-[#86868B]">
                隐藏此面板后截图，效果更佳
              </p>
            </div>
          )}
        </div>
      )}

      {/* Show Panel Button (when hidden) */}
      {!panelVisible && (
        <button
          onClick={() => setPanelVisible(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-50"
        >
          <Play className="w-5 h-5 text-blue-500" />
        </button>
      )}
    </div>
  );
}
