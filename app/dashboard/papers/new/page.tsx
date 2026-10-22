import { PaperCreationWizard } from "@/components/paper-creation-wizard";
import { getSessionUser } from "@/lib/auth";

export default async function NewPaperPage() {
  const user = await getSessionUser();
  return <PaperCreationWizard userPlan={user?.plan || "free"} userRole={user?.role || "user"} />;
}
