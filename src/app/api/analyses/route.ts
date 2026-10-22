import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalysisError } from "@/lib/errors";
import { checkRateLimit, createJob, runUrlAnalysis } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sourceType: z.literal("url"),
  url: z.string().trim().min(3).max(2048),
  options: z
    .object({
      viewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
      notes: z.string().max(600).optional(),
    })
    .optional(),
});

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`url:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "You've started several analyses in a short window.",
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

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "That request is missing a valid URL.",
          retryable: false,
          hint: "Provide a full address such as https://example.com.",
        },
      },
      { status: 400 }
    );
  }

  const { url, options } = parsed.data;
  const viewport = options?.viewport ?? "desktop";

  const job = createJob({
    sourceType: "url",
    sourceUrl: url,
    viewport,
    notes: options?.notes,
  });

  // Fire-and-forget: the client polls /api/analyses/:id for progress.
  void runUrlAnalysis(job.id, url, viewport);

  return NextResponse.json(
    { id: job.id, status: "queued" },
    { status: 202, headers: { "cache-control": "no-store" } }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: new AnalysisError("METHOD_NOT_ALLOWED", "Use POST to create an analysis.").message,
    },
    { status: 405 }
  );
}
