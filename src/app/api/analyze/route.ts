import { NextRequest } from "next/server";
import { FortuneAnalysisParams } from "@/types/fortune";
import { calculateBazi, BaziContext } from "@/lib/bazi-calculator";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildTimelineSystemPrompt,
  buildTimelineUserPrompt,
  buildDetailSystemPrompt,
  buildDetailUserPrompt,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  buildDimensionSystemPrompt,
  buildDimensionUserPrompt,
} from "@/lib/bazi-prompt";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const SILICONFLOW_BASE_URL = process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-ai/DeepSeek-V3.2";

type AnalysisType = "timeline" | "detail" | "all" | "summary" | "dimensions";

interface ExtendedParams extends FortuneAnalysisParams {
  type?: AnalysisType;
  baziContextCache?: string;
  pastEvents?: string;
  scope?: "timeline_p1" | "timeline_p2" | "timeline_p3";
  activationKey?: string;
  sessionId?: string;
}

type RequestType = "timeline" | "summary" | "dimensions";
const SESSION_EXPIRE_SECONDS = 600;

async function getOrCreateSession(
  redis: Redis,
  normalizedKey: string,
  sessionId: string
): Promise<{ allowed: boolean; error?: string }> {
  const activeSessionKey = `session:active:${normalizedKey}`;
  const existingSession = await redis.get(activeSessionKey);

  if (existingSession && existingSession !== sessionId) {
    return { allowed: false, error: "报告正在生成中，请稍候" };
  }

  if (!existingSession) {
    await redis.set(activeSessionKey, sessionId, { ex: SESSION_EXPIRE_SECONDS });
    await redis.set(`session:progress:${sessionId}`, {
      timeline: false,
      summary: false,
      dimensions: false,
    }, { ex: SESSION_EXPIRE_SECONDS });
  }

  return { allowed: true };
}

async function updateSessionProgress(
  redis: Redis,
  sessionId: string,
  normalizedKey: string,
  requestType: RequestType,
  name: string,
  birthDate: string,
  birthPlace: string,
  gender: string,
  tokenCount: number
): Promise<void> {
  const progressKey = `session:progress:${sessionId}`;
  const progressData = await redis.get(progressKey);
  
  if (!progressData) return;

  const progress = (typeof progressData === 'string' ? JSON.parse(progressData) : progressData) as Record<RequestType, boolean>;
  progress[requestType] = true;

  await redis.set(progressKey, progress, { ex: SESSION_EXPIRE_SECONDS });

  if (progress.timeline && progress.summary && progress.dimensions) {
    const usedAt = new Date().toISOString();
    
    await redis.set(`activation:${normalizedKey}`, {
      used: true,
      usedAt,
      usedBy: name,
    });
    
    await redis.set(`usage:${normalizedKey}`, {
      name,
      birthDate,
      birthPlace,
      gender,
      usedAt,
      key: normalizedKey,
      tokens: tokenCount,
    });

    await redis.del(`session:active:${normalizedKey}`);
    await redis.del(progressKey);

    console.log(`[session] 报告生成完成，激活码已标记为已使用: ${normalizedKey}`);
  }
}

function getPrompts(
  type: AnalysisType, 
  baziContext: BaziContext, 
  pastEvents?: string,
  scope?: "timeline_p1" | "timeline_p2" | "timeline_p3"
) {
  let startYear: number | undefined;
  let endYear: number | undefined;

  if (type === "timeline" && scope && baziContext.liunian.length > 0) {
    const startYearOfList = baziContext.liunian[0].year;
    
    if (scope === "timeline_p1") {
      startYear = startYearOfList;
      endYear = startYearOfList + 6;
    } else if (scope === "timeline_p2") {
      startYear = startYearOfList + 7;
      endYear = startYearOfList + 13;
    } else if (scope === "timeline_p3") {
      startYear = startYearOfList + 14;
      endYear = startYearOfList + 20;
    }
  }

  switch (type) {
    case "timeline":
      return {
        system: buildTimelineSystemPrompt(startYear, endYear),
        user: buildTimelineUserPrompt(baziContext, pastEvents, startYear, endYear),
      };
    case "summary":
      return {
        system: buildSummarySystemPrompt(),
        user: buildSummaryUserPrompt(baziContext, pastEvents),
      };
    case "dimensions":
      return {
        system: buildDimensionSystemPrompt(),
        user: buildDimensionUserPrompt(baziContext, pastEvents),
      };
    case "detail":
      return {
        system: buildDetailSystemPrompt(),
        user: buildDetailUserPrompt(baziContext, pastEvents),
      };
    case "all":
    default:
      return {
        system: buildSystemPrompt(),
        user: buildUserPrompt(baziContext, pastEvents),
      };
  }
}

function parseJsonFromContent(fullContent: string): unknown {
  const cleanContent = fullContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  
  // Strategy 1: Look for ```json block (case insensitive)
  const jsonBlockMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch (e) {
      console.error("代码块内 JSON 解析失败:", e);
    }
  }
  
  // Strategy 2: Look for generic code block
  const codeBlockMatch = cleanContent.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
       console.error("通用代码块内 JSON 解析失败:", e);
    }
  }
  
  // Strategy 3: Find outermost braces
  const firstOpen = cleanContent.indexOf('{');
  const lastClose = cleanContent.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    let jsonStr = cleanContent.substring(firstOpen, lastClose + 1);
    
    // Auto-fix common LLM JSON syntax error: Missing quote on key (e.g., level": "小吉")
    // Regex explanation:
    // \s+           matches whitespace/newline before key
    // ([a-zA-Z0-9_]+) captures the key name (alphanumeric + underscore)
    // ":            matches quote and colon
    // Replacement: "$1": adds the missing opening quote
    jsonStr = jsonStr.replace(/(\s+)([a-zA-Z0-9_]+)":/g, '$1"$2":');

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("大括号提取 JSON 解析失败:", e);
      // Try to clean up common trailing commas issues
      try {
        const fixedJson = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(fixedJson);
      } catch (e2) {}
    }
  }
  
  // Strategy 4: Try to parse the whole string (after cleaning markdown code ticks if any remained)
  let fixedContent = cleanContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  if (fixedContent.startsWith("{") && fixedContent.endsWith("}")) {
      try {
          return JSON.parse(fixedContent);
      } catch(e) {}
  }

  throw new Error("未找到有效的 JSON 结构");
}

export async function POST(request: NextRequest) {
  const body = await request.json() as ExtendedParams;
  
  const { name, birthDate, birthTime, birthPlace, gender, type = "all", baziContextCache, pastEvents, scope, activationKey, sessionId } = body;
  
  if (!name || !birthDate || !birthTime || !birthPlace) {
    return new Response(
      JSON.stringify({ error: "缺少必填字段：姓名、出生日期、时辰、出生地" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!activationKey) {
    return new Response(
      JSON.stringify({ error: "缺少激活码" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const normalizedKey = activationKey.trim().toUpperCase();
  const keyData = await redis.get(`activation:${normalizedKey}`);

  if (!keyData) {
    return new Response(
      JSON.stringify({ error: "激活码不存在或已失效" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const keyInfo = keyData as { used: boolean; usedAt?: string };

  if (keyInfo.used) {
    return new Response(
      JSON.stringify({ error: "该激活码已被使用" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (sessionId && (type === "timeline" || type === "summary" || type === "dimensions")) {
    const sessionCheck = await getOrCreateSession(redis, normalizedKey, sessionId);
    if (!sessionCheck.allowed) {
      return new Response(
        JSON.stringify({ error: sessionCheck.error }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!SILICONFLOW_API_KEY) {
    return new Response(
      JSON.stringify({ error: "缺少 SILICONFLOW_API_KEY 环境变量" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (eventType: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: eventType, data })}\n\n`));
      };

      const t0 = performance.now();
      const log = (label: string, since?: number) => {
        const now = performance.now();
        const elapsed = since !== undefined ? now - since : now - t0;
        console.log(`[analyze:${type}${scope ? ':' + scope : ''}] ${label}: ${elapsed.toFixed(0)}ms`);
        return now;
      };
      console.log(`[analyze:${type}${scope ? ':' + scope : ''}] ========== 请求开始 ==========`);

      try {
        let baziContext: BaziContext;
        
        if (baziContextCache) {
          baziContext = JSON.parse(baziContextCache);
          log("使用缓存的八字数据", t0);
        } else {
          baziContext = calculateBazi({
            birthDate,
            birthTime,
            gender: gender === "女" ? "女" : "男",
          });
          log("八字计算完成", t0);

          if (type === "all" || type === "timeline") {
            sendEvent("bazi", {
              bazi: baziContext.bazi.formatted,
              dayMaster: `${baziContext.wuxing.dayMaster}${baziContext.wuxing.dayMasterElement}`,
              strength: baziContext.wuxing.strength,
              pattern: baziContext.pattern,
              favorable: baziContext.wuxing.favorable,
              unfavorable: baziContext.wuxing.unfavorable,
              currentDayun: `${baziContext.dayun.current.period}（${baziContext.dayun.current.years}）`,
              _cache: JSON.stringify(baziContext),
            });
          }
        }

        const { system: systemPrompt, user: userPrompt } = getPrompts(type, baziContext, pastEvents, scope);
        const t2 = log("Prompt构建完成", t0);
        console.log(`[analyze:${type}${scope ? ':' + scope : ''}] API请求发出...`);
        const t3 = performance.now();

        const response = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SILICONFLOW_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: type === "timeline" ? 6144 : 6144,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SiliconFlow API 错误: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取响应流");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let firstTokenTime: number | null = null;
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const chunk = parsed.choices?.[0]?.delta?.content;
                if (chunk) {
                  if (firstTokenTime === null) {
                    firstTokenTime = performance.now();
                    log(`首个token到达 (TTFB)`, t3);
                  }
                  tokenCount++;
                  fullContent += chunk;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        const t5 = performance.now();
        log(`流式完成, 共收到约 ${tokenCount} chunks, 内容长度 ${fullContent.length} 字符`, t3);

        let result;
        try {
          result = parseJsonFromContent(fullContent);
        } catch (e) {
          console.error(`[analyze:${type}${scope ? ':' + scope : ''}] JSON 解析失败:`, e);
          const preview = fullContent.length > 1000 
            ? fullContent.slice(0, 500) + "\n...\n" + fullContent.slice(-500)
            : fullContent;
          console.error("响应内容预览:", preview);
          throw new Error(`AI 响应格式异常: ${e instanceof Error ? e.message : String(e)}`);
        }
        log("JSON解析完成", t5);

        if (type === "all") {
          (result as Record<string, unknown>).baziContext = {
            bazi: baziContext.bazi.formatted,
            dayMaster: baziContext.wuxing.dayMaster,
            strength: baziContext.wuxing.strength,
            pattern: baziContext.pattern,
            favorable: baziContext.wuxing.favorable,
            unfavorable: baziContext.wuxing.unfavorable,
            currentDayun: baziContext.dayun.current.period,
          };
        }

        sendEvent("complete", result);
        log(`========== 总耗时`, t0);

        if (sessionId && (type === "timeline" || type === "summary" || type === "dimensions")) {
          const requestType: RequestType = type === "timeline" ? "timeline" : type;
          await updateSessionProgress(
            redis,
            sessionId,
            normalizedKey,
            requestType,
            name,
            birthDate,
            birthPlace,
            gender || "男",
            tokenCount
          );
        } else if (type === "all") {
          const usedAt = new Date().toISOString();
          
          await redis.set(`activation:${normalizedKey}`, {
            used: true,
            usedAt,
            usedBy: name,
          });
          
          await redis.set(`usage:${normalizedKey}`, {
            name,
            birthDate,
            birthPlace,
            gender,
            usedAt,
            key: normalizedKey,
            tokens: tokenCount,
          });
          
          console.log(`[analyze:${type}] 激活码已标记为已使用: ${normalizedKey}`);
        }
        
      } catch (error) {
        console.error(`[analyze:${type}${scope ? ':' + scope : ''}] 分析失败:`, error);
        sendEvent("error", {
          message: error instanceof Error ? error.message : "分析失败，请稍后重试",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
