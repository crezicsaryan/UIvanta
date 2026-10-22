import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, createJob, getJob, runScreenshotAnalysis } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  fileName: z.string().max(160).optional(),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  viewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
  notes: z.string().max(600).optional(),
  palette: z
    .array(
      z.object({
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        coverage: z.number().min(0).max(1),
      })
    )
    .min(1)
    .max(24),
});

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`img:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many screenshot analyses in a short window.",
          retryable: true,
          hint: `Try again in ${limit.retryAfter} seconds.`,
        },
      },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Expected a JSON body.", retryable: false } },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "The screenshot payload was rejected.",
          retryable: false,
          hint: "Upload a PNG, JPEG, or WebP image under 10 MB.",
        },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const job = createJob({
    sourceType: "screenshot",
    viewport: data.viewport,
    notes: data.notes,
  });

  // Run synchronously so the result survives the serverless invocation.
  await runScreenshotAnalysis(job.id, {
    palette: data.palette,
    width: data.width,
    height: data.height,
    viewport: data.viewport,
    notes: data.notes,
    fileName: data.fileName,
  });
  const completed = getJob(job.id) ?? job;

  return NextResponse.json(
    { id: completed.id, status: completed.status, job: completed },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}
