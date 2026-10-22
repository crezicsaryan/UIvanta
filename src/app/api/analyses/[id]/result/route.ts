import { NextResponse } from "next/server";
import { z } from "zod";
import { currentMarkdown, getJob, saveMarkdown } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  markdown: z.string().max(400_000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Analysis not found.", retryable: false } },
      { status: 404 }
    );
  }

  if (job.status !== "completed" || !job.result) {
    return NextResponse.json(
      {
        error: {
          code: "JOB_INCOMPLETE",
          message: job.status === "failed" ? "The analysis failed." : "The analysis is still running.",
          retryable: job.status === "failed",
        },
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      id: job.id,
      status: job.status,
      result: {
        designTokens: job.result.tokens,
        components: job.result.components,
        markdown: currentMarkdown(job),
        stats: job.result.stats,
      },
      edited: Boolean(job.editedMarkdown),
    },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Analysis not found.", retryable: false } },
      { status: 404 }
    );
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      {
        error: {
          code: "JOB_INCOMPLETE",
          message: "Only completed analyses can be edited.",
          retryable: false,
        },
      },
      { status: 409 }
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

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "The document was rejected — it may be too large.",
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  saveMarkdown(id, parsed.data.markdown);
  return NextResponse.json({ ok: true, edits: job.edits, savedAt: job.updatedAt });
}
