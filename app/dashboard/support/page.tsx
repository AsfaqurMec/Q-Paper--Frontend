import { api } from "@/lib/api";
import { SupportTicketsView } from "@/components/support-tickets-view";

export default async function SupportPage() {
  const tickets = await api.supportTickets();

  return <SupportTicketsView initialTickets={tickets} />;
}
