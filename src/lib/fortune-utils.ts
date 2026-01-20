import { FortuneLevel, FortuneResponse, YearNode } from "@/types/fortune";

/**
 * 根据分数获取吉凶等级
 */
export function getFortuneLevel(score: number): FortuneLevel {
  if (score >= 95) return "大吉";
  if (score >= 85) return "中吉";
  if (score >= 70) return "小吉";
  if (score >= 40) return "平";
  if (score >= 25) return "小凶";
  if (score >= 15) return "中凶";
  return "大凶";
}

/**
 * 获取吉凶等级对应的颜色
 */
export function getFortuneLevelColor(level: FortuneLevel): string {
  const colors: Record<FortuneLevel, string> = {
    "大吉": "#FFD700",   // 金色
    "中吉": "#FF9500",   // 橙色
    "小吉": "#34C759",   // 绿色
    "平": "#8E8E93",     // 灰色
    "小凶": "#5AC8FA",   // 蓝色
    "中凶": "#5856D6",   // 靛蓝
    "大凶": "#AF52DE",   // 紫色
  };
  return colors[level];
}

/**
 * 获取吉凶等级对应的背景色（用于徽章）
 */
export function getFortuneLevelBgColor(level: FortuneLevel): string {
  const colors: Record<FortuneLevel, string> = {
    "大吉": "bg-yellow-400",
    "中吉": "bg-orange-500",
    "小吉": "bg-green-500",
    "平": "bg-gray-400",
    "小凶": "bg-sky-400",
    "中凶": "bg-indigo-500",
    "大凶": "bg-purple-500",
  };
  return colors[level];
}

/**
 * 获取吉凶等级对应的 Tailwind 类名
 */
export function getFortuneLevelClasses(level: FortuneLevel): string {
  const classes: Record<FortuneLevel, string> = {
    "大吉": "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-400/50",
    "中吉": "bg-orange-500 text-white",
    "小吉": "bg-green-500 text-white",
    "平": "bg-gray-400 text-white",
    "小凶": "bg-sky-400 text-white",
    "中凶": "bg-indigo-500 text-white",
    "大凶": "bg-purple-500 text-white shadow-lg shadow-purple-500/50",
  };
  return classes[level];
}

/**
 * 格式化年份范围显示
 */
export function formatYearRange(startYear: number, endYear: number): string {
  return `${startYear}年 - ${endYear}年`;
}

/**
 * 获取当前年份
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export type ScientificGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "E";

export interface ScientificGradeInfo {
  grade: ScientificGrade;
  label: string;
  index: number;
}

export function getScientificGrade(score: number): ScientificGradeInfo {
  if (score >= 90) return { grade: "A+", label: "卓越期", index: score };
  if (score >= 80) return { grade: "A", label: "优异期", index: score };
  if (score >= 70) return { grade: "B+", label: "上升期", index: score };
  if (score >= 60) return { grade: "B", label: "稳定期", index: score };
  if (score >= 50) return { grade: "C+", label: "平稳期", index: score };
  if (score >= 40) return { grade: "C", label: "调整期", index: score };
  if (score >= 25) return { grade: "D", label: "蓄势期", index: score };
  return { grade: "E", label: "潜伏期", index: score };
}

export function getGradeColor(grade: ScientificGrade): string {
  const colors: Record<ScientificGrade, string> = {
    "A+": "#fbbf24",
    "A": "#f59e0b",
    "B+": "#34d399",
    "B": "#10b981",
    "C+": "#60a5fa",
    "C": "#3b82f6",
    "D": "#a78bfa",
    "E": "#8b5cf6",
  };
  return colors[grade];
}

export function generateMockFortuneData(baseYear: number = getCurrentYear()): FortuneResponse {
  const timeline: YearNode[] = [];
  const careerScores: number[] = [];
  const wealthScores: number[] = [];
  const loveScores: number[] = [];
  const healthScores: number[] = [];

  for (let i = -10; i <= 10; i++) {
    const year = baseYear + i;
    const score = Math.floor(Math.random() * 60) + 30;
    const level = getFortuneLevel(score);
    
    timeline.push({
      year,
      score,
      level,
      events: generateMockEvents(level),
      analysis: `${year}年运势${level}，整体${score >= 60 ? "较为顺利" : "需要注意"}。`,
    });

    careerScores.push(Math.floor(Math.random() * 60) + 30);
    wealthScores.push(Math.floor(Math.random() * 60) + 30);
    loveScores.push(Math.floor(Math.random() * 60) + 30);
    healthScores.push(Math.floor(Math.random() * 60) + 30);
  }

  return {
    timeline,
    dimensions: {
      career: careerScores,
      wealth: wealthScores,
      love: loveScores,
      health: healthScores,
    },
    summary: "根据您的生辰八字分析，整体运势呈现稳中向好的趋势。建议在机遇来临时把握时机，同时注意平衡工作与生活。",
    advice: "宜多与贵人交往，事业上可适当进取。财运方面建议稳健理财，感情上保持真诚沟通。",
  };
}

/**
 * 生成模拟事件（用于开发测试）
 */
function generateMockEvents(level: FortuneLevel): string[] {
  const goodEvents = ["事业晋升", "遇贵人相助", "财运亨通", "桃花运旺", "健康无忧"];
  const badEvents = ["谨防小人", "注意健康", "投资需谨慎", "感情波折", "工作压力大"];
  
  if (["大吉", "中吉", "小吉"].includes(level)) {
    return goodEvents.slice(0, Math.floor(Math.random() * 2) + 1);
  } else if (level === "平") {
    return ["平稳过渡"];
  } else {
    return badEvents.slice(0, Math.floor(Math.random() * 2) + 1);
  }
}
