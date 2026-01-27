import { Solar, Lunar, LunarUtil } from 'lunar-javascript';
import { getLongitude } from './city-coordinates';

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
    birthPlace?: string; // 新增出生地字段
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

function calculateWuxingStrength(bazi: BaziContext["bazi"]): Record<string, number> {
  const counts = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  
  // 天干权重 1.0
  const stems = [bazi.year.stem, bazi.month.stem, bazi.day.stem, bazi.hour.stem];
  for (const stem of stems) {
    counts[STEM_ELEMENT[stem] as keyof typeof counts] += 1.0;
  }
  
  // 地支藏干权重 (lunar-javascript 风格)
  // 本气 0.6, 中气 0.3, 余气 0.1
  const branches = [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch];
  for (const branch of branches) {
    const hiddenStems = LunarUtil.ZHI_HIDE_GAN[branch]; // 返回如 ["癸"]
    if (hiddenStems && hiddenStems.length > 0) {
      // 简单分配：如果有1个藏干，全拿1.0；如果有2个，0.7/0.3；如果有3个，0.6/0.3/0.1
      // 这里为了简单，且为了配合 professional logic，我们使用主气判断
      const mainQi = hiddenStems[0];
      counts[STEM_ELEMENT[mainQi] as keyof typeof counts] += 1.0; // 地支力量强，算 1.0
      
      for (let i = 1; i < hiddenStems.length; i++) {
         const subQi = hiddenStems[i];
         counts[STEM_ELEMENT[subQi] as keyof typeof counts] += 0.3;
      }
    }
  }
  
  return counts;
}

function determineStrength(
  dayMasterElement: string,
  monthBranch: string,
  wuxingCounts: Record<string, number>
): "身强" | "身弱" {
  let selfScore = 0;
  let opposeScore = 0;
  
  // 1. 得令 (月支是帮身或生身) - 最重要
  const monthHidden = LunarUtil.ZHI_HIDE_GAN[monthBranch] || [];
  const monthMainQi = monthHidden[0];
  const monthElement = STEM_ELEMENT[monthMainQi]; // 注意：lunar里藏干是天干，转五行
  
  const supportElements = {
    金: ["土", "金"], 木: ["水", "木"], 水: ["金", "水"], 火: ["木", "火"], 土: ["火", "土"]
  };
  
  const myParty = supportElements[dayMasterElement as keyof typeof supportElements];
  
  // 得令 +40分
  if (myParty.includes(monthElement)) {
    selfScore += 40;
  } else {
    opposeScore += 40;
  }
  
  // 2. 得地 (全局五行能量对比)
  // 将所有生助力量相加
  for (const el of myParty) {
    selfScore += wuxingCounts[el] * 10;
  }
  
  // 将所有克泄耗力量相加
  const allElements = ["金", "木", "水", "火", "土"];
  const opposeElements = allElements.filter(e => !myParty.includes(e));
  for (const el of opposeElements) {
    opposeScore += wuxingCounts[el] * 10;
  }
  
  return selfScore >= opposeScore ? "身强" : "身弱";
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

export function calculateBazi(params: {
  birthDate: string;
  birthTime: string;
  gender: "男" | "女";
  birthPlace?: string; // 增加出生地
}): BaziContext {
  const { birthDate, birthTime, gender, birthPlace } = params;
  
  // 1. 获取经度 (默认120)
  const longitude = getLongitude(birthPlace || "");
  
  // 2. 解析时间并转换为 Solar (阳历)
  const [year, month, day] = birthDate.split("-").map(Number);
  
  let hour = 12;
  let minute = 0;
  
  // 处理 "HH:mm" 或 "XX时" 格式
  if (birthTime.includes(":")) {
    const parts = birthTime.split(":").map(Number);
    hour = parts[0];
    minute = parts[1];
  } else {
    // 处理中文时辰 (如 "辰时") -> 映射到该时辰的中间时刻
    const shichenMap: Record<string, number> = {
      "子时": 0, "丑时": 2, "寅时": 4, "卯时": 6, "辰时": 8, "巳时": 10,
      "午时": 12, "未时": 14, "申时": 16, "酉时": 18, "戌时": 20, "亥时": 22
    };
    if (shichenMap[birthTime] !== undefined) {
      hour = shichenMap[birthTime];
      minute = 0;
    }
  }
  
  // 经度差
  const offsetMinutes = (longitude - 120.0) * 4;
  
  const baseDate = new Date(year, month - 1, day, hour, minute);
  // 加/减 分钟 (使用毫秒级精度，避免 setMinutes 取整导致刚好落在整点)
  baseDate.setTime(baseDate.getTime() + offsetMinutes * 60 * 1000);
  
  // 用校正后的时间重新生成 Lunar
  // 注意：真太阳时只影响「时柱」。年月日柱通常不受20分钟影响，除非刚好在子时交界。
  // 如果在 23:50 出生，减20分变成 23:30，还是前一天？不，23:00-01:00 是子时。
  // 如果是 00:10 出生，减20分变成 23:50 (前一天)，这时候日柱可能要变！
  // 所以直接调整时间戳是正确的做法。
  
  const trueSolar = Solar.fromDate(baseDate);
  const trueLunar = trueSolar.getLunar();
  const eightChar = trueLunar.getEightChar();
  
  // 设置流派：2 = 晚子时算明天 (通常八字排盘 23:00 后算明天)
  eightChar.setSect(2);
  
  const bazi: BaziContext["bazi"] = {
    year: {
      stem: eightChar.getYearGan(),
      branch: eightChar.getYearZhi(),
      element: STEM_ELEMENT[eightChar.getYearGan()] + BRANCH_ELEMENT[eightChar.getYearZhi()]
    },
    month: {
      stem: eightChar.getMonthGan(),
      branch: eightChar.getMonthZhi(),
      element: STEM_ELEMENT[eightChar.getMonthGan()] + BRANCH_ELEMENT[eightChar.getMonthZhi()]
    },
    day: {
      stem: eightChar.getDayGan(),
      branch: eightChar.getDayZhi(),
      element: STEM_ELEMENT[eightChar.getDayGan()] + BRANCH_ELEMENT[eightChar.getDayZhi()]
    },
    hour: {
      stem: eightChar.getTimeGan(),
      branch: eightChar.getTimeZhi(),
      element: STEM_ELEMENT[eightChar.getTimeGan()] + BRANCH_ELEMENT[eightChar.getTimeZhi()]
    },
    formatted: `${eightChar.getYearGan()}${eightChar.getYearZhi()} ${eightChar.getMonthGan()}${eightChar.getMonthZhi()} ${eightChar.getDayGan()}${eightChar.getDayZhi()} ${eightChar.getTimeGan()}${eightChar.getTimeZhi()}`
  };
  
  const dayMaster = bazi.day.stem;
  const dayMasterElement = STEM_ELEMENT[dayMaster];
  
  const wuxingCounts = calculateWuxingStrength(bazi);
  const strength = determineStrength(dayMasterElement, bazi.month.branch, wuxingCounts);
  const { favorable, unfavorable } = determineFavorable(dayMasterElement, strength);
  
  const pattern = determinePattern(bazi, dayMaster);
  
  // 大运计算 (lunar-javascript 有 Yun 模块)
  // const yun = eightChar.getYun(gender === "男" ? 1 : 0); // 1男 0女
  const genderNum = gender === "男" ? 1 : 0;
  const yun = eightChar.getYun(genderNum);
  
  const startAge = yun.getStartYear(); // 起运年数
  const startYear = year + startAge;
  
  const daYunArr = yun.getDaYun();
  const dayunList = daYunArr.slice(1, 9).map(dy => { // 取前8步大运
     const startAge = dy.getStartYear();
     const endAge = dy.getEndYear();
     const dyGanZhi = dy.getGanZhi();
     // lunar-javascript 的 DaYun 对象不直接提供 SolarYear，需手动计算
     const startSolarYear = year + startAge;
     const endSolarYear = year + endAge;
     
     return {
       period: dyGanZhi,
       ages: `${startAge}-${endAge}岁`,
       years: `${startSolarYear}-${endSolarYear}` // 粗略年份
     };
  });
  
  // 查找当前大运
  const currentYear = new Date().getFullYear();
  const currentDaYun = dayunList.find(d => {
    const [s, e] = d.years.split("-").map(Number);
    return currentYear >= s && currentYear <= e;
  }) || dayunList[0];
  
  // 流年 (简单推算)
  const liunian = [];
  for (let y = currentYear - 10; y <= currentYear + 10; y++) {
    // 简单推算流年干支 (lunar-js 也有，但这里手动快)
    // 1984甲子
    const offset = y - 1984;
    const stemIdx = (offset % 10 + 10) % 10;
    const branchIdx = (offset % 12 + 12) % 12;
    const stem = STEMS[stemIdx];
    const branch = BRANCHES[branchIdx];
    liunian.push({
      year: y,
      ganzhi: stem + branch,
      relation: TEN_GODS[dayMaster]?.[stem] || "未知"
    });
  }
  
  return {
    basic: {
      gender,
      birthDate,
      birthTime,
      birthPlace,
      lunarDate: `${trueLunar.getYearInGanZhi()}年${trueLunar.getMonthInChinese()}月${trueLunar.getDayInChinese()} ${trueLunar.getTimeZhi()}时`
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
    dayun: {
      startAge: startAge,
      direction: yun.isForward() ? "顺排" : "逆排",
      current: currentDaYun,
      list: dayunList
    },
    liunian
  };
}

export function getTenGodRelation(dayMaster: string, targetStem: string): string {
  return TEN_GODS[dayMaster]?.[targetStem] || "未知";
}

// ========== 流年评分算法 (保持原样，或微调) ==========
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
