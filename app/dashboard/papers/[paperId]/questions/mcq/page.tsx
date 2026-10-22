import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function LegacyMcqQuestionsPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  redirect(`/dashboard/papers/${paperId}/import-questions/mcq` as Route);
}
