import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = 3;
  const segmentLength = 4;
  
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(segment);
  }
  
  return `LIFE-${parts.join("-")}`;
}

async function generateKeys(count: number) {
  console.log(`生成 ${count} 个激活码...\n`);
  
  const keys: string[] = [];
  const existingKeys = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let key: string;
    do {
      key = generateKey();
    } while (existingKeys.has(key));
    
    existingKeys.add(key);
    keys.push(key);
    
    await redis.set(`activation:${key}`, {
      used: false,
      createdAt: new Date().toISOString(),
    });
    
    console.log(`[${i + 1}/${count}] ${key}`);
  }
  
  console.log(`\n✅ 成功生成 ${count} 个激活码`);
  console.log(`\n💾 已保存到数据库`);
  
  const exportData = keys.join("\n");
  console.log(`\n📋 导出列表（可复制保存）:\n`);
  console.log(exportData);
}

const count = parseInt(process.argv[2] || "50", 10);
generateKeys(count).catch(console.error);
