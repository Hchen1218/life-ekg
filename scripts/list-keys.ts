import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface KeyInfo {
  used: boolean;
  usedAt?: string;
  createdAt?: string;
}

async function listKeys() {
  console.log("正在获取所有激活码...\n");
  
  const keys = await redis.keys("activation:*");
  
  if (keys.length === 0) {
    console.log("❌ 未找到任何激活码");
    return;
  }
  
  console.log(`找到 ${keys.length} 个激活码:\n`);
  
  let usedCount = 0;
  let unusedCount = 0;
  
  for (const fullKey of keys) {
    const key = (fullKey as string).replace("activation:", "");
    const info = await redis.get(fullKey) as KeyInfo | null;
    
    if (!info) {
      console.log(`⚠️  ${key} - 数据缺失`);
      continue;
    }
    
    if (info.used) {
      usedCount++;
      console.log(`❌ ${key} - 已使用 (${info.usedAt || "未知时间"})`);
    } else {
      unusedCount++;
      console.log(`✅ ${key} - 未使用`);
    }
  }
  
  console.log(`\n📊 统计:`);
  console.log(`   总计: ${keys.length}`);
  console.log(`   未使用: ${unusedCount}`);
  console.log(`   已使用: ${usedCount}`);
}

listKeys().catch(console.error);
