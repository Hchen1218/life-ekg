import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "lifeekg2024";

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const password = authHeader.replace("Bearer ", "");
  return password === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const keys = await redis.keys("activation:*");
    const usageRecords = await redis.keys("usage:*");
    
    let totalKeys = keys.length;
    let usedKeys = 0;
    let totalTokens = 0;
    let todayUsage = 0;
    
    const today = new Date().toISOString().split("T")[0];
    
    for (const fullKey of keys) {
      const info = await redis.get(fullKey) as any;
      if (info?.used) usedKeys++;
    }

    const recentUsage: Array<{
      name: string;
      birthDate: string;
      birthPlace: string;
      usedAt: string;
      key: string;
      tokens: number;
    }> = [];

    for (const recordKey of usageRecords) {
      const record = await redis.get(recordKey) as any;
      if (record) {
        totalTokens += record.tokens || 0;
        
        if (record.usedAt?.startsWith(today)) {
          todayUsage++;
        }
        
        recentUsage.push({
          name: record.name || "未知",
          birthDate: record.birthDate || "",
          birthPlace: record.birthPlace || "",
          usedAt: record.usedAt || "",
          key: record.key || "",
          tokens: record.tokens || 0,
        });
      }
    }

    recentUsage.sort((a, b) => (b.usedAt || "").localeCompare(a.usedAt || ""));

    return NextResponse.json({
      stats: {
        totalKeys,
        usedKeys,
        unusedKeys: totalKeys - usedKeys,
        usageRate: totalKeys > 0 ? ((usedKeys / totalKeys) * 100).toFixed(1) : "0",
        totalUsage: usageRecords.length,
        todayUsage,
        totalTokens,
      },
      recentUsage: recentUsage.slice(0, 50),
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
