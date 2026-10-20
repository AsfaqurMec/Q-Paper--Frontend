"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientApi } from "@/lib/client-api";
import type { DashboardData, PaymentRequest, Plan, UserSession } from "@/lib/api-types";

type ProfileViewProps = {
  initialUser: UserSession;
  plans: Plan[];
  dashboardStats: DashboardData["stats"];
  myRequests: PaymentRequest[];
};

export function ProfileView({ initialUser, plans, dashboardStats, myRequests }: ProfileViewProps) {
  const [user, setUser] = useState<UserSession>(initialUser);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "plan" | "usage">("profile");

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    institute: user.institute || ""
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Current Plan
  const activePlanCode = user.plan || "free";
  const currentPlan = plans.find((p) => p.code === activePlanCode) || plans[0] || {
    code: "free",
    name: "Free",
    price: 0,
    interval: "month",
    paperLimit: 2,
    questionLimit: 30,
    totalQuestionsLimit: 60,
    exports: ["pdf"],
    importQuestion: false,
    watermark: true,
    questionBank: false,
    branding: false,
    randomGenerator: false,
    multipleVersions: false
  };

  const pendingRequest = myRequests.find((r) => r.status === "pending");

  // Usage calculations
  const totalPapersCreated = dashboardStats.totalPapers || 0;
  const paperLimit = currentPlan.paperLimit || 2;
  const papersPercent = Math.min(100, Math.round((totalPapersCreated / paperLimit) * 100));

  const totalQuestionsCreated = dashboardStats.totalQuestions || 0;
  const totalQuestionsLimit = currentPlan.totalQuestionsLimit || 60;
  const questionsPercent = Math.min(100, Math.round((totalQuestionsCreated / totalQuestionsLimit) * 100));

  const questionsPerPaperLimit = currentPlan.questionLimit || 30;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);

      const updated = await clientApi.updateProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        institute: editForm.institute.trim()
      });

      setUser((prev) => ({
        ...prev,
        ...updated,
        name: updated.name || editForm.name.trim(),
        phone: updated.phone || editForm.phone.trim(),
        institute: updated.institute || editForm.institute.trim()
      }));

      setProfileSuccess("Profile details updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    try {
      setPasswordSaving(true);
      await clientApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  // Format date helper
  const formattedCreated = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Active Member";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner if Payment is pending */}
      {pendingRequest && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">পেমেন্ট রিকোয়েস্ট যাচাইয়ের অপেক্ষায় আছে (Pending Approval)</p>
              <p className="text-muted-foreground mt-0.5">
                প্যাকেজ: <strong>{pendingRequest.planName}</strong> • TrxID: <code>{pendingRequest.transactionId}</code> • এডমিন যাচাই শেষে আপনার প্যাকেজ সক্রিয় করা হবে।
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-300 h-8 gap-1.5 shrink-0">
            <Link href="/dashboard/checkout">
              চেকআউটে দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-6 md:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-700 text-2xl font-bold text-white shadow-md">
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background text-[11px]" title="Active Account">
              ✓
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {user.name || "User Profile"}
              </h1>
              <Badge variant="outline" className={user.role === "admin" ? "bg-rose-50 text-rose-700 border-rose-300 font-bold" : "bg-primary/10 text-primary border-primary/30 font-semibold"}>
                {user.role === "admin" ? "System Admin" : "Teacher / Educator"}
              </Badge>
              <Badge className={activePlanCode === "ultra" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold" : activePlanCode === "pro" ? "bg-teal-600 text-white font-bold" : "bg-slate-700 text-white font-semibold"}>
                <Sparkles className="h-3 w-3 mr-1" />
                {activePlanCode.toUpperCase()} PLAN
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {user.phone}
                </span>
              )}
              {user.institute && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {user.institute}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Joined: {formattedCreated}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-center">
            <Button
              variant={isEditing ? "outline" : "primary"}
              size="sm"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditForm({
                  name: user.name || "",
                  phone: user.phone || "",
                  institute: user.institute || ""
                });
                setProfileError(null);
                setProfileSuccess(null);
              }}
              className="gap-1.5 font-semibold"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4" /> Cancel Edit
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" /> Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b text-sm font-medium gap-1 sm:gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          Profile Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Password &amp; Security
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === "plan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Package &amp; Features
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === "usage"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Usage &amp; Limits
        </button>
      </div>

      {/* TAB 1: PROFILE DETAILS & EDIT */}
      {activeTab === "profile" && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Personal &amp; Academic Information</CardTitle>
                    <CardDescription className="text-xs">Your personal credentials and educational affiliation</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-5">
                {profileSuccess && (
                  <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    <span>{profileError}</span>
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email || ""}
                        className="mt-1 h-9 w-full rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed"
                        title="Email address cannot be changed directly"
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        Email is permanently linked to your account for authentication.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mobile / Phone Number
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 01712-345678"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        School / College / Institution Name
                      </label>
                      <input
                        type="text"
                        value={editForm.institute}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, institute: e.target.value }))}
                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. Dhaka Residential Model College"
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        This default institute name can automatically appear on your generated question papers.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={profileSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" variant="primary" disabled={profileSaving} className="gap-1.5 font-semibold">
                        <Save className="h-4 w-4" />
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Full Name</span>
                      <span className="font-semibold text-foreground text-sm block mt-0.5">
                        {user.name || "Not provided"}
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Email Address</span>
                      <span className="font-semibold text-foreground text-sm block mt-0.5 truncate" title={user.email}>
                        {user.email}
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Phone Number</span>
                      <span className="font-semibold text-foreground text-sm block mt-0.5">
                        {user.phone || "Not provided"}
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Institution / School</span>
                      <span className="font-semibold text-foreground text-sm block mt-0.5">
                        {user.institute || "Not provided"}
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Account Role</span>
                      <span className="font-semibold text-foreground text-sm block mt-0.5 capitalize">
                        {user.role} Account
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/20">
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">User Identifier (ID)</span>
                      <span className="font-mono text-muted-foreground text-xs block mt-0.5 select-all">
                        {user.id}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Account Summary Sidebar */}
          <div className="space-y-4">
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Current Plan</span>
                  <Badge variant="outline" className="font-bold uppercase text-primary border-primary/30">
                    {user.plan}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Verification</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Papers Created</span>
                  <span className="font-semibold text-foreground">{totalPapersCreated} Papers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="font-semibold text-foreground">{totalQuestionsCreated} Questions</span>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs font-semibold">
                    <Link href="/dashboard/subscription">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Manage Subscription
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PASSWORD CHANGE */}
      {activeTab === "security" && (
        <div className="max-w-xl mx-auto">
          <Card className="border shadow-soft bg-card">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Change Account Password</CardTitle>
                  <CardDescription className="text-xs">Ensure your account is using a strong, unique password</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              {passwordSuccess && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Password *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className="h-9 w-full rounded-md border bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Password *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className="h-9 w-full rounded-md border bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm New Password *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-9 w-full rounded-md border bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Helper */}
                <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-1 text-muted-foreground">
                  <span className="font-semibold text-foreground block">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={passwordForm.newPassword.length >= 8 ? "text-emerald-600 font-medium" : ""}>
                      • At least 8 characters
                    </span>
                    <span className={/[A-Z]/.test(passwordForm.newPassword) ? "text-emerald-600 font-medium" : ""}>
                      • One uppercase letter
                    </span>
                    <span className={/[a-z]/.test(passwordForm.newPassword) ? "text-emerald-600 font-medium" : ""}>
                      • One lowercase letter
                    </span>
                    <span className={/[0-9]/.test(passwordForm.newPassword) ? "text-emerald-600 font-medium" : ""}>
                      • One number (0-9)
                    </span>
                    <span className={/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? "text-emerald-600 font-medium" : ""}>
                      • One special symbol
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t">
                  <Button type="submit" variant="primary" disabled={passwordSaving} className="gap-1.5 font-semibold w-full sm:w-auto">
                    <KeyRound className="h-4 w-4" />
                    {passwordSaving ? "Updating Password..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: PACKAGE DETAILS & FEATURES */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = p.code === activePlanCode;
              return (
                <Card key={p.code} className={`relative flex flex-col ${isCurrent ? "border-primary ring-2 ring-primary/20 shadow-md" : "border"}`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                        Current Package
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pt-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                      <Badge variant={isCurrent ? "default" : "outline"} className="text-xs uppercase font-semibold">
                        {p.code === "free" ? "Trial" : "Premium"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {p.code === "free" ? "Free trial tier" : p.code === "pro" ? "Professional educator package" : "All-inclusive complete package"}
                    </CardDescription>
                    <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold">
                      ৳{p.price}
                      <span className="text-xs font-normal text-muted-foreground">/{p.interval}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>{p.paperLimit.toLocaleString()}</strong> Question Papers limit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Up to <strong>{p.questionLimit}</strong> questions per paper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Total quota: <strong>{p.totalQuestionsLimit.toLocaleString()}</strong> questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>PDF Export ({p.exports.includes("docx") ? "PDF & Word DOCX" : "PDF Only"})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.importQuestion ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <span className={p.importQuestion ? "" : "text-muted-foreground"}>
                          Question Import (Word / PDF / OCR)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.questionBank ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <span className={p.questionBank ? "" : "text-muted-foreground"}>Question Bank Access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!p.watermark ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className={!p.watermark ? "" : "text-amber-700 dark:text-amber-400"}>
                          {!p.watermark ? "No Watermark (Clean Exam Paper)" : "Includes ExamCraft Watermark"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.multipleVersions ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <span className={p.multipleVersions ? "" : "text-muted-foreground"}>Multiple Sets (Set A, B, C, D)</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      {isCurrent ? (
                        <Button variant="outline" className="w-full font-semibold cursor-default bg-muted/40" disabled>
                          <Check className="h-4 w-4 mr-1 text-emerald-600" />
                          Active Package
                        </Button>
                      ) : (
                        <Button asChild variant="primary" className="w-full font-semibold gap-1.5">
                          <Link href="/dashboard/subscription">
                            <Sparkles className="h-4 w-4" />
                            {p.price > currentPlan.price ? "Upgrade to " + p.name : "Switch to " + p.name}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: USAGE & LIMIT DETAILS */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Papers Usage Card */}
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Papers Limit</span>
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {totalPapersCreated} <span className="text-xs font-normal text-muted-foreground">/ {paperLimit.toLocaleString()} Papers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      papersPercent > 90 ? "bg-rose-500" : papersPercent > 70 ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${papersPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{papersPercent}% Used</span>
                  <span>{Math.max(0, paperLimit - totalPapersCreated)} Remaining</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Questions Quota Card */}
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Questions Quota</span>
                  <Layers className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {totalQuestionsCreated} <span className="text-xs font-normal text-muted-foreground">/ {totalQuestionsLimit.toLocaleString()} Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      questionsPercent > 90 ? "bg-rose-500" : questionsPercent > 70 ? "bg-amber-500" : "bg-teal-600"
                    }`}
                    style={{ width: `${questionsPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{questionsPercent}% Used</span>
                  <span>{Math.max(0, totalQuestionsLimit - totalQuestionsCreated)} Remaining</span>
                </div>
              </CardContent>
            </Card>

            {/* Per-Paper Question Limit Card */}
            <Card className="border shadow-soft bg-card sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Per-Paper Limit</span>
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {questionsPerPaperLimit} <span className="text-xs font-normal text-muted-foreground">questions / paper</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Your current <strong>{currentPlan.name}</strong> package allows formatting up to {questionsPerPaperLimit} questions in a single exam paper.
                </p>
                {activePlanCode !== "ultra" && (
                  <Link href="/dashboard/subscription" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                    Upgrade to expand limits <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Limits & Policy Breakdown */}
          <Card className="border shadow-soft bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Package Rules &amp; Quota Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive overview of your active limits on {currentPlan.name} package
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Total Paper Creation Limit</p>
                    <p className="text-muted-foreground text-[11px]">Maximum number of question papers you can store and generate</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">{paperLimit.toLocaleString()} Papers</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Account-wide Question Quota</p>
                    <p className="text-muted-foreground text-[11px]">Cumulative total questions allowed across all saved question papers</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">{totalQuestionsLimit.toLocaleString()} Questions</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Single Paper Capacity</p>
                    <p className="text-muted-foreground text-[11px]">Maximum question count for a single MCQ or CQ exam</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">{questionsPerPaperLimit} Questions</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Export Permissions</p>
                    <p className="text-muted-foreground text-[11px]">File formats supported for direct paper export</p>
                  </div>
                  <span className="font-bold text-foreground text-sm uppercase">
                    {currentPlan.exports.join(" & ")}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Watermark Status</p>
                    <p className="text-muted-foreground text-[11px]">Branding applied to downloaded PDF/DOCX files</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.watermark ? "text-amber-600" : "text-emerald-600"}`}>
                    {currentPlan.watermark ? "Watermarked" : "Clean (No Watermark)"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Multiple Sets &amp; Randomizer</p>
                    <p className="text-muted-foreground text-[11px]">Automatic generation of Set A, Set B, Set C, Set D</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.multipleVersions ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {currentPlan.multipleVersions ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
