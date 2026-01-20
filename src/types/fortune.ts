export type FortuneLevel = 
  | "大吉" 
  | "中吉" 
  | "小吉" 
  | "平" 
  | "小凶" 
  | "中凶" 
  | "大凶";

export interface YearNode {
  year: number;
  score: number;
  level: FortuneLevel;
  events: string[];
  analysis: string;
}

export interface DimensionData {
  score: number;
  summary: string;
  detail: string;
  highlights: string[];
}

export interface FortuneDimensions {
  career: DimensionData;
  wealth: DimensionData;
  love: DimensionData;
  health: DimensionData;
}

export interface FortuneDimensionsLegacy {
  career: number[];
  wealth: number[];
  love: number[];
  health: number[];
}

export interface FortuneAnalysisParams {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  currentLocation?: string;
  gender: "男" | "女";
  pastEvents?: string;
}

export interface BaziContextSummary {
  bazi: string;
  dayMaster: string;
  strength: string;
  pattern: string;
  favorable: string[];
  unfavorable: string[];
  currentDayun: string;
}

export interface FortuneResponse {
  timeline: YearNode[];
  dimensions: FortuneDimensions | FortuneDimensionsLegacy;
  summary: string;
  advice: string;
  baziContext?: BaziContextSummary;
}

export interface BlindTestData {
  predictions: {
    yearRange: string;
    prediction: string;
    level: FortuneLevel;
  }[];
  isAccurate?: boolean;
  userFeedback?: string;
}

export const SHICHEN_OPTIONS = [
  { value: "子时", label: "子时 (23:00-00:59)" },
  { value: "丑时", label: "丑时 (01:00-02:59)" },
  { value: "寅时", label: "寅时 (03:00-04:59)" },
  { value: "卯时", label: "卯时 (05:00-06:59)" },
  { value: "辰时", label: "辰时 (07:00-08:59)" },
  { value: "巳时", label: "巳时 (09:00-10:59)" },
  { value: "午时", label: "午时 (11:00-12:59)" },
  { value: "未时", label: "未时 (13:00-14:59)" },
  { value: "申时", label: "申时 (15:00-16:59)" },
  { value: "酉时", label: "酉时 (17:00-18:59)" },
  { value: "戌时", label: "戌时 (19:00-20:59)" },
  { value: "亥时", label: "亥时 (21:00-22:59)" },
] as const;

export function isDimensionDataNew(dim: DimensionData | number[]): dim is DimensionData {
  return typeof dim === "object" && "summary" in dim && "detail" in dim;
}
