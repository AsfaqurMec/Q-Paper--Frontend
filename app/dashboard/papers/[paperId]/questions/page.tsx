import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function LegacyPaperQuestionsPage({
  params,
  searchParams
}: {
  params: Promise<{ paperId: string }>;
  searchParams: Promise<{ method?: string; importType?: string }>;
}) {
  const { paperId } = await params;
  const query = await searchParams;
  const search = new URLSearchParams();
  if (query.method) search.set("method", query.method);
  if (query.importType) search.set("importType", query.importType);
  const qs = search.toString();
  redirect(`/dashboard/papers/${paperId}/import-questions${qs ? `?${qs}` : ""}` as Route);
}
