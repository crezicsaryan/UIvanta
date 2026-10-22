import { NextResponse } from "next/server";
import { currentMarkdown, getJob } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job || !job.result) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "That document is no longer available.",
          retryable: false,
        },
      },
      { status: 404 }
    );
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      { error: { code: "JOB_INCOMPLETE", message: "The analysis is not finished.", retryable: true } },
      { status: 409 }
    );
  }

  const markdown = currentMarkdown(job);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": 'attachment; filename="design.md"',
      "cache-control": "no-store",
      "x-uivanta-edited": job.editedMarkdown ? "true" : "false",
    },
  });
}
