import { NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "That analysis is no longer available.",
          retryable: false,
          hint: "Analyses are kept for two hours. Start a new one.",
        },
      },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  return NextResponse.json(job, { headers: { "cache-control": "no-store" } });
}
