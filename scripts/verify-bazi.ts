
import { calculateBazi } from "../src/lib/bazi-calculator";

// Test Case: 2000-12-18 07:20, Ganzhou (114.93 E)
// Standard Time: 07:20 (Chen Hour: 07:00-09:00)
// Longitude Diff: 114.93 - 120 = -5.07 degrees
// Time Diff: -5.07 * 4 = -20.28 minutes
// True Solar Time: 07:20 - 20 = 07:00 (approx) -> Actually 06:59:43
// Expected Hour: Mao (05:00-07:00)

console.log("=== Bazi Verification: Ganzhou Test Case ===");
console.log("Input: 2000-12-18 07:20, Jiangxi Ganzhou");

const result = calculateBazi({
  birthDate: "2000-12-18",
  birthTime: "07:20",
  gender: "男",
  birthPlace: "江西省赣州市"
});

console.log("\n--- Output ---");
console.log(`Lunar Date: ${result.basic.lunarDate}`);
console.log(`Bazi: ${result.bazi.formatted}`);
console.log(`Strength: ${result.wuxing.strength}`);
console.log(`Day Master: ${result.wuxing.dayMaster} (${result.wuxing.dayMasterElement})`);

console.log("\n--- Wuxing Scores ---");
console.log(JSON.stringify(result.wuxing, null, 2));

// Verification Logic
const hourBranch = result.bazi.hour.branch;
if (hourBranch === "卯") {
  console.log("\n✅ PASS: Hour Pillar is Mao (卯) - True Solar Time applied correctly.");
} else {
  console.log(`\n❌ FAIL: Hour Pillar is ${hourBranch} - Expected Mao (卯).`);
}
