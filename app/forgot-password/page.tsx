import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      subtitle="The backend exposes reset-token endpoints; connect email delivery when SMTP is configured."
      footer={<Link href="/login" className="font-medium text-primary">Back to sign in</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
