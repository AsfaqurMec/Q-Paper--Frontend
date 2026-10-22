import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function LegacyCqQuestionsPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  redirect(`/dashboard/papers/${paperId}/import-questions/cq` as Route);
}
