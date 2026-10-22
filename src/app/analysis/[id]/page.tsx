import type { Metadata } from "next";
import { Workspace } from "@/components/workspace/workspace";

export const metadata: Metadata = {
  title: "Analysis workspace",
  robots: { index: false, follow: false },
};

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Workspace id={id} />;
}
