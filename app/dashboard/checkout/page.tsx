import { requireUser, api } from "@/lib/api";
import { CheckoutView } from "@/components/checkout-view";

export const dynamic = "force-dynamic";

export default async function DashboardCheckoutPage() {
  const user = await requireUser();
  const [paymentOptions, myRequests, plans] = await Promise.all([
    api.paymentOptions().catch(() => []),
    api.myPaymentRequests().catch(() => []),
    api.plans().catch(() => [])
  ]);

  return (
    <CheckoutView
      user={user}
      initialOptions={paymentOptions}
      initialRequests={myRequests}
      initialPlans={plans}
    />
  );
}
