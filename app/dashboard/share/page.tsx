import { api } from "@/lib/api";
import { ShareLinksView } from "@/components/share-links-view";

export default async function SharePage() {
  const [papers, links] = await Promise.all([api.papers(), api.sharedLinks()]);

  return <ShareLinksView initialPapers={papers} initialLinks={links} />;
}
