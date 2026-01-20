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

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const keys = await redis.keys("activation:*");
    const keyList: Array<{
      key: string;
      used: boolean;
      createdAt?: string;
      usedAt?: string;
      usedBy?: string;
    }> = [];

    for (const fullKey of keys) {
      const key = (fullKey as string).replace("activation:", "");
      const info = await redis.get(fullKey) as any;
      
      if (info) {
        keyList.push({
          key,
          used: info.used || false,
          createdAt: info.createdAt,
          usedAt: info.usedAt,
          usedBy: info.usedBy,
        });
      }
    }

    keyList.sort((a, b) => {
      if (a.used !== b.used) return a.used ? 1 : -1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    return NextResponse.json({ keys: keyList });
  } catch (error) {
    console.error("获取激活码失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { count = 10 } = await request.json();
    const generatedKeys: string[] = [];
    const existingKeys = new Set<string>();

    for (let i = 0; i < count; i++) {
      let key: string;
      do {
        key = generateKey();
      } while (existingKeys.has(key));

      existingKeys.add(key);
      generatedKeys.push(key);

      await redis.set(`activation:${key}`, {
        used: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ keys: generatedKeys, count: generatedKeys.length });
  } catch (error) {
    console.error("生成激活码失败:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
