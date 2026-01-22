type AgeRange = "18-22" | "23-26" | "27-30" | "31-35" | "36-40" | "41-50" | "51+";
type FortuneLevel = "大凶" | "小凶" | "平" | "小吉" | "大吉";

const LABEL_LIBRARY = {
  "18-22": {
    大凶: ["考试失利", "专业错选", "休学危机", "校园孤立", "前途迷茫"],
    小凶: ["成绩下滑", "实习碰壁", "导师冲突", "社交退缩", "自我怀疑"],
    平: ["按部就班", "平稳过渡", "默默努力", "随波逐流", "等待机会"],
    小吉: ["小有进步", "贵人出现", "方向初现", "信心恢复", "技能突破"],
    大吉: ["金榜题名", "保研成功", "offer在手", "天赋觉醒", "伯乐赏识"],
  },
  "23-26": {
    大凶: ["职场霸凌", "频繁跳槽", "入错行业", "被迫离职", "经济困窘"],
    小凶: ["职场孤立", "薪资停滞", "上司打压", "方向迷茫", "加班过劳"],
    平: ["稳定过渡", "积累经验", "默默成长", "等待时机", "蛰伏期"],
    小吉: ["小有成绩", "获得认可", "薪资上涨", "技能精进", "站稳脚跟"],
    大吉: ["晋升加薪", "猎头青睐", "独当一面", "行业新星", "事业起飞"],
  },
  "27-30": {
    大凶: ["婚恋破裂", "转型失败", "房贷压力", "亲情撕裂", "健康亮灯"],
    小凶: ["婚恋焦虑", "转型阵痛", "经济紧张", "家庭矛盾", "精力透支"],
    平: ["按部就班", "稳步推进", "平衡生活", "积蓄力量", "静待花开"],
    小吉: ["感情稳定", "事业上升", "财务改善", "家庭和睦", "身心平衡"],
    大吉: ["喜结良缘", "事业腾飞", "财富积累", "儿女双全", "人生赢家"],
  },
  "31-35": {
    大凶: ["中年失业", "婚姻危机", "健康警报", "投资失败", "信任崩塌"],
    小凶: ["职业瓶颈", "婚姻倦怠", "亚健康态", "财务压力", "人际疏离"],
    平: ["维持现状", "平稳度日", "休养生息", "内心整理", "默默坚持"],
    小吉: ["突破瓶颈", "感情回暖", "健康好转", "收入增加", "贵人相助"],
    大吉: ["事业巅峰", "婚姻美满", "身心俱佳", "财务自由", "功成名就"],
  },
  "36-40": {
    大凶: ["事业滑坡", "婚变危机", "大病初愈", "破财损失", "众叛亲离"],
    小凶: ["发展受阻", "感情平淡", "身体疲惫", "经济波动", "孤独感重"],
    平: ["稳中求进", "平淡是真", "调养身心", "量入为出", "知足常乐"],
    小吉: ["稳步上升", "感情升温", "精力充沛", "收益稳定", "人脉扩展"],
    大吉: ["行业翘楚", "伉俪情深", "逆龄生长", "财源广进", "德高望重"],
  },
  "41-50": {
    大凶: ["被迫退位", "空巢危机", "重病缠身", "财富缩水", "晚景凄凉"],
    小凶: ["边缘化态", "亲子隔阂", "慢性病扰", "财务缩减", "人情淡薄"],
    平: ["安稳度日", "家庭平和", "注重保养", "财务平衡", "知足安乐"],
    小吉: ["经验变现", "儿女成才", "身体康健", "被动收入", "桃李天下"],
    大吉: ["功成身退", "儿孙满堂", "老当益壮", "财富传承", "德艺双馨"],
  },
  "51+": {
    大凶: ["晚年孤独", "久病床前", "积蓄耗尽", "家庭离散", "郁郁寡欢"],
    小凶: ["健康下降", "儿女不孝", "经济拮据", "社交减少", "意义感失"],
    平: ["平淡晚年", "儿女尚可", "生活无忧", "偶有来往", "安度余生"],
    小吉: ["身体硬朗", "儿孙孝顺", "生活富足", "老友相聚", "心态平和"],
    大吉: ["寿比南山", "儿孙绕膝", "安享晚年", "桃李满园", "圆满人生"],
  },
} as const;

function getAgeRange(age: number): AgeRange {
  if (age <= 22) return "18-22";
  if (age <= 26) return "23-26";
  if (age <= 30) return "27-30";
  if (age <= 35) return "31-35";
  if (age <= 40) return "36-40";
  if (age <= 50) return "41-50";
  return "51+";
}

function getFortuneLevel(score: number): FortuneLevel {
  if (score < 30) return "大凶";
  if (score < 45) return "小凶";
  if (score < 60) return "平";
  if (score < 75) return "小吉";
  return "大吉";
}

/** @param year 流年年份 @param birthYear 出生年份 @param score 0-100 @returns 四字短语 */
export function getLabelForYear(
  year: number,
  birthYear: number,
  score: number
): string {
  const age = year - birthYear;
  const ageRange = getAgeRange(age);
  const fortuneLevel = getFortuneLevel(score);
  const labels = LABEL_LIBRARY[ageRange][fortuneLevel];
  // pseudo-random seed from year ensures consistent label per year
  const index = (year * 7 + birthYear * 13) % labels.length;
  return labels[index];
}

export function addLabelsToTimeline<T extends { year: number; score: number }>(
  timeline: T[],
  birthYear: number
): (T & { label: string })[] {
  return timeline.map((item) => ({
    ...item,
    label: getLabelForYear(item.year, birthYear, item.score),
  }));
}

export function getPainPointsForAge(age: number): string[] {
  const ageRange = getAgeRange(age);
  const library = LABEL_LIBRARY[ageRange];
  return [...library["大凶"], ...library["小凶"]];
}

export function getPositiveLabelsForAge(age: number): string[] {
  const ageRange = getAgeRange(age);
  const library = LABEL_LIBRARY[ageRange];
  return [...library["小吉"], ...library["大吉"]];
}
