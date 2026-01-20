import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "激活码格式无效" },
        { status: 400 }
      );
    }

    const normalizedKey = key.trim().toUpperCase();

    const keyData = await redis.get(`activation:${normalizedKey}`);

    if (!keyData) {
      return NextResponse.json(
        { error: "激活码不存在或已失效" },
        { status: 404 }
      );
    }

    const keyInfo = keyData as { used: boolean; usedAt?: string };

    if (keyInfo.used) {
      return NextResponse.json(
        { error: "该激活码已被使用" },
        { status: 403 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Key verification error:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
