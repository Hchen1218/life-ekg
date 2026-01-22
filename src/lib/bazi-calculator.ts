import lunisolar from "lunisolar";

export interface BaziPillar {
  stem: string;
  branch: string;
  element: string;
}

export interface BaziContext {
  basic: {
    gender: "男" | "女";
    birthDate: string;
    birthTime: string;
    lunarDate: string;
  };
  bazi: {
    year: BaziPillar;
    month: BaziPillar;
    day: BaziPillar;
    hour: BaziPillar;
    formatted: string;
  };
  wuxing: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
    dayMaster: string;
    dayMasterElement: string;
    strength: "身强" | "身弱";
    favorable: string[];
    unfavorable: string[];
  };
  pattern: string;
  dayun: {
    startAge: number;
    direction: "顺排" | "逆排";
    current: { period: string; ages: string; years: string };
    list: Array<{ period: string; ages: string; years: string }>;
  };
  liunian: Array<{ year: number; ganzhi: string; relation: string }>;
}

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水"
};

const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水"
};

const TEN_GODS: Record<string, Record<string, string>> = {
  甲: { 甲: "比肩", 乙: "劫财", 丙: "食神", 丁: "伤官", 戊: "偏财", 己: "正财", 庚: "七杀", 辛: "正官", 壬: "偏印", 癸: "正印" },
  乙: { 甲: "劫财", 乙: "比肩", 丙: "伤官", 丁: "食神", 戊: "正财", 己: "偏财", 庚: "正官", 辛: "七杀", 壬: "正印", 癸: "偏印" },
  丙: { 甲: "偏印", 乙: "正印", 丙: "比肩", 丁: "劫财", 戊: "食神", 己: "伤官", 庚: "偏财", 辛: "正财", 壬: "七杀", 癸: "正官" },
  丁: { 甲: "正印", 乙: "偏印", 丙: "劫财", 丁: "比肩", 戊: "伤官", 己: "食神", 庚: "正财", 辛: "偏财", 壬: "正官", 癸: "七杀" },
  戊: { 甲: "七杀", 乙: "正官", 丙: "偏印", 丁: "正印", 戊: "比肩", 己: "劫财", 庚: "食神", 辛: "伤官", 壬: "偏财", 癸: "正财" },
  己: { 甲: "正官", 乙: "七杀", 丙: "正印", 丁: "偏印", 戊: "劫财", 己: "比肩", 庚: "伤官", 辛: "食神", 壬: "正财", 癸: "偏财" },
  庚: { 甲: "偏财", 乙: "正财", 丙: "七杀", 丁: "正官", 戊: "偏印", 己: "正印", 庚: "比肩", 辛: "劫财", 壬: "食神", 癸: "伤官" },
  辛: { 甲: "正财", 乙: "偏财", 丙: "正官", 丁: "七杀", 戊: "正印", 己: "偏印", 庚: "劫财", 辛: "比肩", 壬: "伤官", 癸: "食神" },
  壬: { 甲: "食神", 乙: "伤官", 丙: "偏财", 丁: "正财", 戊: "七杀", 己: "正官", 庚: "偏印", 辛: "正印", 壬: "比肩", 癸: "劫财" },
  癸: { 甲: "伤官", 乙: "食神", 丙: "正财", 丁: "偏财", 戊: "正官", 己: "七杀", 庚: "正印", 辛: "偏印", 壬: "劫财", 癸: "比肩" }
};

function getStemIndex(stem: string): number {
  return STEMS.indexOf(stem);
}

function getBranchIndex(branch: string): number {
  return BRANCHES.indexOf(branch);
}

function getGanZhi(stemIdx: number, branchIdx: number): string {
  return STEMS[stemIdx % 10] + BRANCHES[branchIdx % 12];
}

function isYangStem(stem: string): boolean {
  const idx = getStemIndex(stem);
  return idx % 2 === 0;
}

function calculateWuxingStrength(bazi: BaziContext["bazi"]): Record<string, number> {
  const counts = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];
  for (const pillar of pillars) {
    counts[STEM_ELEMENT[pillar.stem] as keyof typeof counts] += 1;
    counts[BRANCH_ELEMENT[pillar.branch] as keyof typeof counts] += 1;
  }
  
  return counts;
}

function determineStrength(
  dayMasterElement: string,
  monthBranch: string,
  wuxingCounts: Record<string, number>
): "身强" | "身弱" {
  let score = 0;
  
  const monthElement = BRANCH_ELEMENT[monthBranch];
  if (monthElement === dayMasterElement) score += 30;
  if (
    (dayMasterElement === "木" && monthElement === "水") ||
    (dayMasterElement === "火" && monthElement === "木") ||
    (dayMasterElement === "土" && monthElement === "火") ||
    (dayMasterElement === "金" && monthElement === "土") ||
    (dayMasterElement === "水" && monthElement === "金")
  ) {
    score += 20;
  }
  
  score += wuxingCounts[dayMasterElement] * 10;
  
  const supportElements = {
    金: ["土"], 木: ["水"], 水: ["金"], 火: ["木"], 土: ["火"]
  };
  for (const el of supportElements[dayMasterElement as keyof typeof supportElements] || []) {
    score += wuxingCounts[el] * 5;
  }
  
  return score >= 50 ? "身强" : "身弱";
}

function determineFavorable(dayMasterElement: string, strength: "身强" | "身弱"): { favorable: string[]; unfavorable: string[] } {
  const clashElements = {
    金: ["木", "水"], 木: ["土", "火"], 水: ["火", "木"], 火: ["金", "土"], 土: ["水", "金"]
  };
  const supportElements = {
    金: ["土", "金"], 木: ["水", "木"], 水: ["金", "水"], 火: ["木", "火"], 土: ["火", "土"]
  };
  
  if (strength === "身强") {
    return {
      favorable: clashElements[dayMasterElement as keyof typeof clashElements] || [],
      unfavorable: supportElements[dayMasterElement as keyof typeof supportElements] || []
    };
  } else {
    return {
      favorable: supportElements[dayMasterElement as keyof typeof supportElements] || [],
      unfavorable: clashElements[dayMasterElement as keyof typeof clashElements] || []
    };
  }
}

function determinePattern(bazi: BaziContext["bazi"], dayMaster: string): string {
  const monthStem = bazi.month.stem;
  const tenGod = TEN_GODS[dayMaster]?.[monthStem];
  
  const patternMap: Record<string, string> = {
    正官: "正官格", 七杀: "七杀格", 正印: "正印格", 偏印: "偏印格",
    食神: "食神格", 伤官: "伤官格", 正财: "正财格", 偏财: "偏财格",
    比肩: "建禄格", 劫财: "羊刃格"
  };
  
  return patternMap[tenGod] || "普通格局";
}

function calculateDayun(
  gender: "男" | "女",
  yearStem: string,
  monthStemIdx: number,
  monthBranchIdx: number,
  birthDate: Date,
  birthYear: number
): BaziContext["dayun"] {
  const isYang = isYangStem(yearStem);
  const isMale = gender === "男";
  const isForward = (isMale && isYang) || (!isMale && !isYang);
  
  const startAge = 6;
  const startYear = birthYear + startAge;
  
  const list: Array<{ period: string; ages: string; years: string }> = [];
  
  for (let i = 0; i < 8; i++) {
    let stemIdx: number;
    let branchIdx: number;
    
    if (isForward) {
      stemIdx = (monthStemIdx + 1 + i) % 10;
      branchIdx = (monthBranchIdx + 1 + i) % 12;
    } else {
      stemIdx = (monthStemIdx - 1 - i + 10) % 10;
      branchIdx = (monthBranchIdx - 1 - i + 12) % 12;
    }
    
    const period = getGanZhi(stemIdx, branchIdx);
    const ageStart = startAge + i * 10;
    const ageEnd = ageStart + 9;
    const yearStart = startYear + i * 10;
    const yearEnd = yearStart + 9;
    
    list.push({
      period,
      ages: `${ageStart}-${ageEnd}岁`,
      years: `${yearStart}-${yearEnd}`
    });
  }
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const currentIdx = Math.floor((age - startAge) / 10);
  const current = list[Math.max(0, Math.min(currentIdx, list.length - 1))];
  
  return {
    startAge,
    direction: isForward ? "顺排" : "逆排",
    current,
    list
  };
}

function calculateLiunian(dayMaster: string, startYear: number): BaziContext["liunian"] {
  const result: BaziContext["liunian"] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    const stemIdx = (year - 4) % 10;
    const branchIdx = (year - 4) % 12;
    const ganzhi = getGanZhi(stemIdx, branchIdx);
    const stem = STEMS[stemIdx];
    const relation = TEN_GODS[dayMaster]?.[stem] || "未知";
    
    result.push({ year, ganzhi, relation });
  }
  
  return result;
}

export function calculateBazi(params: {
  birthDate: string;
  birthTime: string;
  gender: "男" | "女";
}): BaziContext {
  const { birthDate, birthTime, gender } = params;
  
  const dateTimeStr = `${birthDate} ${birthTime}`;
  const lsr = lunisolar(dateTimeStr);
  
  const char8 = lsr.char8;
  const lunar = lsr.lunar;
  
  const bazi: BaziContext["bazi"] = {
    year: {
      stem: char8.year.stem.toString(),
      branch: char8.year.branch.toString(),
      element: STEM_ELEMENT[char8.year.stem.toString()] + BRANCH_ELEMENT[char8.year.branch.toString()]
    },
    month: {
      stem: char8.month.stem.toString(),
      branch: char8.month.branch.toString(),
      element: STEM_ELEMENT[char8.month.stem.toString()] + BRANCH_ELEMENT[char8.month.branch.toString()]
    },
    day: {
      stem: char8.day.stem.toString(),
      branch: char8.day.branch.toString(),
      element: STEM_ELEMENT[char8.day.stem.toString()] + BRANCH_ELEMENT[char8.day.branch.toString()]
    },
    hour: {
      stem: char8.hour.stem.toString(),
      branch: char8.hour.branch.toString(),
      element: STEM_ELEMENT[char8.hour.stem.toString()] + BRANCH_ELEMENT[char8.hour.branch.toString()]
    },
    formatted: `${char8.year} ${char8.month} ${char8.day} ${char8.hour}`
  };
  
  const dayMaster = bazi.day.stem;
  const dayMasterElement = STEM_ELEMENT[dayMaster];
  
  const wuxingCounts = calculateWuxingStrength(bazi);
  const strength = determineStrength(dayMasterElement, bazi.month.branch, wuxingCounts);
  const { favorable, unfavorable } = determineFavorable(dayMasterElement, strength);
  
  const pattern = determinePattern(bazi, dayMaster);
  
  const birthDateObj = new Date(birthDate);
  const birthYear = birthDateObj.getFullYear();
  const monthStemIdx = getStemIndex(bazi.month.stem);
  const monthBranchIdx = getBranchIndex(bazi.month.branch);
  
  const dayun = calculateDayun(
    gender,
    bazi.year.stem,
    monthStemIdx,
    monthBranchIdx,
    birthDateObj,
    birthYear
  );
  
  const liunian = calculateLiunian(dayMaster, birthYear);
  
  const lunarYear = lunar.getYearName();
  const lunarMonth = lunar.getMonthName();
  const lunarDay = lunar.getDayName();
  const lunarHour = lunar.getHourName();
  
  return {
    basic: {
      gender,
      birthDate,
      birthTime,
      lunarDate: `${lunarYear}年${lunarMonth}${lunarDay}${lunarHour}时`
    },
    bazi,
    wuxing: {
      metal: wuxingCounts["金"],
      wood: wuxingCounts["木"],
      water: wuxingCounts["水"],
      fire: wuxingCounts["火"],
      earth: wuxingCounts["土"],
      dayMaster,
      dayMasterElement,
      strength,
      favorable,
      unfavorable
    },
    pattern,
    dayun,
    liunian
  };
}

export function getTenGodRelation(dayMaster: string, targetStem: string): string {
  return TEN_GODS[dayMaster]?.[targetStem] || "未知";
}

// ========== 流年评分算法 ==========

// 五行生克关系
const WUXING_GENERATES: Record<string, string> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木"
};
const WUXING_CONTROLS: Record<string, string> = {
  木: "土", 土: "水", 水: "火", 火: "金", 金: "木"
};

// 地支六合
const LIUHE: Record<string, string> = {
  子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯",
  辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午"
};

// 地支三合（每组三合）
const SANHE_GROUPS = [
  ["寅", "午", "戌"], // 火局
  ["申", "子", "辰"], // 水局
  ["亥", "卯", "未"], // 木局
  ["巳", "酉", "丑"], // 金局
];

// 地支六冲
const LIUCHONG: Record<string, string> = {
  子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅",
  卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳"
};

// 地支相刑
const XING_PAIRS: [string, string][] = [
  ["寅", "巳"], ["巳", "申"], ["申", "寅"], // 三刑
  ["丑", "戌"], ["戌", "未"], ["未", "丑"], // 三刑
  ["子", "卯"], ["卯", "子"], // 无礼之刑
];

// 地支相害
const HAI_PAIRS: Record<string, string> = {
  子: "未", 未: "子", 丑: "午", 午: "丑", 寅: "巳", 巳: "寅",
  卯: "辰", 辰: "卯", 申: "亥", 亥: "申", 酉: "戌", 戌: "酉"
};

function isSanhe(branch1: string, branch2: string): boolean {
  for (const group of SANHE_GROUPS) {
    if (group.includes(branch1) && group.includes(branch2)) {
      return true;
    }
  }
  return false;
}

function isXing(branch1: string, branch2: string): boolean {
  return XING_PAIRS.some(
    ([a, b]) => (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  );
}

export interface YearScoreParams {
  year: number;
  dayMaster: string;        // 日主天干（如"甲"）
  dayBranch: string;        // 日支（如"子"）
  favorable: string[];      // 喜用五行
  unfavorable: string[];    // 忌神五行
  dayunStem?: string;       // 当前大运天干
  dayunBranch?: string;     // 当前大运地支
}

/**
 * 计算流年分数（基于命理算法，非AI）
 * @returns 0-100 的分数，大部分年份在40-60区间
 */
export function calculateYearScore(params: YearScoreParams): number {
  const { year, dayMaster, dayBranch, favorable, unfavorable, dayunStem, dayunBranch } = params;
  
  // 计算流年干支
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  const liunianStem = STEMS[stemIdx];
  const liunianBranch = BRANCHES[branchIdx];
  
  const dayMasterElement = STEM_ELEMENT[dayMaster];
  const liunianStemElement = STEM_ELEMENT[liunianStem];
  const liunianBranchElement = BRANCH_ELEMENT[liunianBranch];
  
  let score = 50; // 基础分
  
  // ===== 1. 流年天干与日主关系 =====
  if (WUXING_GENERATES[liunianStemElement] === dayMasterElement) {
    // 流年生日主 → 印星，得助力
    score += 10;
  } else if (liunianStemElement === dayMasterElement) {
    // 流年比日主 → 比劫，得帮助
    score += 5;
  } else if (WUXING_GENERATES[dayMasterElement] === liunianStemElement) {
    // 日主生流年 → 食伤，泄气但可创造
    score += 0;
  } else if (WUXING_CONTROLS[dayMasterElement] === liunianStemElement) {
    // 日主克流年 → 财星，可得财
    score += 5;
  } else if (WUXING_CONTROLS[liunianStemElement] === dayMasterElement) {
    // 流年克日主 → 官杀，压力
    score -= 10;
  }
  
  // ===== 2. 流年地支与日支关系 =====
  if (LIUHE[liunianBranch] === dayBranch) {
    // 六合 → 和谐
    score += 8;
  }
  if (isSanhe(liunianBranch, dayBranch)) {
    // 三合 → 助力
    score += 5;
  }
  if (LIUCHONG[liunianBranch] === dayBranch) {
    // 六冲 → 冲突动荡
    score -= 10;
  }
  if (isXing(liunianBranch, dayBranch)) {
    // 相刑 → 困扰
    score -= 5;
  }
  if (HAI_PAIRS[liunianBranch] === dayBranch) {
    // 相害 → 阻碍
    score -= 5;
  }
  
  // ===== 3. 流年五行与喜忌神关系 =====
  if (favorable.includes(liunianStemElement)) {
    score += 5;
  }
  if (favorable.includes(liunianBranchElement)) {
    score += 3;
  }
  if (unfavorable.includes(liunianStemElement)) {
    score -= 5;
  }
  if (unfavorable.includes(liunianBranchElement)) {
    score -= 3;
  }
  
  // ===== 4. 大运配合（如果提供） =====
  if (dayunStem && dayunBranch) {
    const dayunStemElement = STEM_ELEMENT[dayunStem];
    const dayunBranchElement = BRANCH_ELEMENT[dayunBranch];
    
    // 大运与喜忌神
    if (favorable.includes(dayunStemElement)) {
      score += 3;
    }
    if (unfavorable.includes(dayunStemElement)) {
      score -= 3;
    }
    
    // 大运与流年的关系
    if (LIUHE[dayunBranch] === liunianBranch) {
      score += 3; // 大运与流年六合
    }
    if (LIUCHONG[dayunBranch] === liunianBranch) {
      score -= 5; // 大运与流年六冲
    }
  }
  
  // ===== 5. 限制分数范围 =====
  // 大部分年份应在35-65之间，极端年份可达25-75
  score = Math.max(25, Math.min(75, score));
  
  return score;
}

/**
 * 批量计算多年分数
 */
export function calculateYearScores(
  years: number[],
  baziContext: {
    dayMaster: string;
    dayBranch: string;
    favorable: string[];
    unfavorable: string[];
    dayunList?: Array<{ period: string; years: string }>;
  }
): Map<number, number> {
  const scores = new Map<number, number>();
  
  for (const year of years) {
    // 查找当前年份对应的大运
    let dayunStem: string | undefined;
    let dayunBranch: string | undefined;
    
    if (baziContext.dayunList) {
      for (const dayun of baziContext.dayunList) {
        const [startYear, endYear] = dayun.years.split("-").map(Number);
        if (year >= startYear && year <= endYear) {
          dayunStem = dayun.period[0];
          dayunBranch = dayun.period[1];
          break;
        }
      }
    }
    
    const score = calculateYearScore({
      year,
      dayMaster: baziContext.dayMaster,
      dayBranch: baziContext.dayBranch,
      favorable: baziContext.favorable,
      unfavorable: baziContext.unfavorable,
      dayunStem,
      dayunBranch,
    });
    
    scores.set(year, score);
  }
  
  return scores;
}
