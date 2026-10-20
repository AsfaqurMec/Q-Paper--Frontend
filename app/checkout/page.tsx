import { redirect } from "next/navigation";

export default async function CheckoutRedirectPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const plan = typeof params.plan === "string" ? params.plan : "pro";
  redirect(`/dashboard/checkout?plan=${plan}`);
}
