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
  Crown,
  Eye,
  EyeOff,
  FileText,
  Infinity as InfinityIcon,
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
import { formatBnNumber } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/plan-constants";
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

  // Current Plan from Database / API
  const planList = Array.isArray(plans) && plans.length > 0 ? plans : DEFAULT_PLANS;
  const activePlanCode = user.plan || "free";
  const currentPlan = planList.find((p) => p.code === activePlanCode) || planList[0];

  const pendingRequest = myRequests.find((r) => r.status === "pending");

  // Usage calculations
  const totalPapersCreated = dashboardStats.totalPapers || 0;
  const paperLimit = currentPlan.paperLimit || 2;
  const isUnlimitedPapers = paperLimit >= 999999;
  const papersPercent = isUnlimitedPapers ? 0 : Math.min(100, Math.round((totalPapersCreated / paperLimit) * 100));

  const totalQuestionsCreated = dashboardStats.totalQuestions || 0;
  const totalQuestionsLimit = currentPlan.totalQuestionsLimit || 60;
  const isUnlimitedQuestions = totalQuestionsLimit >= 999999;
  const questionsPercent = isUnlimitedQuestions ? 0 : Math.min(100, Math.round((totalQuestionsCreated / totalQuestionsLimit) * 100));

  const questionsPerPaperLimit = currentPlan.questionLimit || 30;
  const isUnlimitedPerPaper = questionsPerPaperLimit >= 999999;

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

      {/* TAB 3: PACKAGE DETAILS & FEATURES (DYNAMIC FROM DB) */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                সাবস্ক্রিপশন প্যাকেজসমূহ
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                সরাসরি ডেটাবেস থেকে প্রাপ্ত বর্তমান প্যাকেজের তালিকা ও লিমিট
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border text-xs text-muted-foreground shrink-0 font-medium self-start sm:self-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>রিয়েল-টাইম প্যাকেজ ডেটা</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 items-stretch">
            {planList.map((p) => {
              const isSmall = p.code === "small";
              const isPro = p.code === "pro";
              const isUltra = p.code === "ultra";
              const isDiamond = p.code === "diamond";
              const isFree = p.code === "free";
              const isCurrent = activePlanCode === p.code || (p.code === "pro" && activePlanCode === "standard");

              return (
                <div
                  key={p.code}
                  className={`relative rounded-3xl p-5 sm:p-6 lg:p-5 flex flex-col justify-between transition-all duration-300 ${
                    isCurrent
                      ? "bg-card border-2 border-emerald-600 shadow-xl ring-4 ring-emerald-500/20 z-10"
                      : isDiamond
                      ? "bg-card border-2 border-cyan-500 shadow-xl shadow-cyan-600/15 ring-2 ring-cyan-500/10 hover:shadow-2xl"
                      : isSmall
                      ? "bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/10 hover:shadow-xl"
                      : isUltra
                      ? "bg-card border-2 border-purple-500/60 shadow-lg hover:border-purple-500 hover:shadow-xl"
                      : isPro
                      ? "bg-card border-2 border-blue-500/60 shadow-lg hover:border-blue-500 hover:shadow-xl"
                      : "bg-card border border-border shadow-xs hover:border-border/80 hover:shadow-md"
                  }`}
                >
                  {/* TOP STATUS BADGES */}
                  {isCurrent ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black px-4 py-0.5 rounded-full shadow-md flex items-center gap-1.5 z-10 whitespace-nowrap">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>বর্তমান প্যাকেজ</span>
                    </div>
                  ) : isSmall ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>সেরা ভ্যালু</span>
                    </div>
                  ) : isPro ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                      <Zap className="w-3.5 h-3.5" />
                      <span>জনপ্রিয় চয়েস</span>
                    </div>
                  ) : isUltra ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold px-3.5 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                      কোচিংয়ের পছন্দ
                    </div>
                  ) : isDiamond ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                      <Crown className="w-3.5 h-3.5" />
                      <span>আনলিমিটেড সুপার</span>
                    </div>
                  ) : null}

                  <div>
                    {/* Plan Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
                          {p.name}
                        </h3>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md">
                          {p.interval === "month" ? "মাসিক" : p.interval}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 min-h-[32px] leading-relaxed">
                        {isFree && "সফটওয়্যার পরীক্ষা ও ফ্রি ট্রায়াল"}
                        {isSmall && "ব্যক্তিগত শিক্ষক ও ছোট ব্যাচের জন্য সেরা"}
                        {isPro && "মাঝারি কোচিং ও পূর্ণাঙ্গ শিক্ষাপ্রতিষ্ঠান"}
                        {isUltra && "বড় কোচিং ও ওয়ার্ড (.docx) এক্সপোর্ট"}
                        {isDiamond && "সম্পূর্ণ আনলিমিটেড পেপার ও প্রশ্ন, ভিআইপি"}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-1 my-4 pb-4 border-b border-border/60">
                      <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        ৳{formatBnNumber(p.price)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        / {p.price === 0 ? "ফ্রি ট্রায়াল" : p.interval === "month" ? "মাসিক" : "মেয়াদ"}
                      </span>
                    </div>

                    {/* Core Capacity Box from Database */}
                    <div
                      className={`rounded-2xl p-4 mb-5 space-y-2.5 border ${
                        isDiamond
                          ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200"
                          : isSmall
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                          : isUltra
                          ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800 text-purple-950 dark:text-purple-200"
                          : isPro
                          ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800 text-blue-950 dark:text-blue-200"
                          : "bg-muted/40 border-border/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>মোট প্রশ্নপত্র:</span>
                        <span
                          className={
                            isDiamond
                              ? "text-cyan-700 dark:text-cyan-300 font-extrabold text-sm"
                              : isSmall
                              ? "text-emerald-700 dark:text-emerald-400 font-extrabold text-sm"
                              : "font-bold text-foreground"
                          }
                        >
                          {p.paperLimit >= 999999 ? "আনলিমিটেড পেপার" : `${formatBnNumber(p.paperLimit)} টি পেপার`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-black">
                        <span>সর্বোচ্চ প্রশ্ন লিমিট:</span>
                        <span
                          className={
                            isDiamond
                              ? "text-cyan-700 dark:text-cyan-300 font-extrabold text-sm"
                              : isSmall
                              ? "text-emerald-700 dark:text-emerald-400 font-extrabold text-sm"
                              : "font-bold text-foreground"
                          }
                        >
                          {p.totalQuestionsLimit >= 999999 ? "আনলিমিটেড কোটা" : `${formatBnNumber(p.totalQuestionsLimit)} টি`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1 border-t border-border/40">
                        <span>প্রতি পেপারে সর্বোচ্চ:</span>
                        <span className="font-semibold text-foreground">
                          {p.questionLimit >= 999999 ? "আনলিমিটেড প্রশ্ন" : `${formatBnNumber(p.questionLimit)} টি প্রশ্ন`}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Feature Checklist from DB */}
                    <div className="space-y-3 text-xs text-foreground/90 mb-6">
                      {/* Watermark */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {p.watermark ? "ওয়াটারমার্ক সহ প্রিভিউ" : "কোনো ওয়াটারমার্ক নেই (ক্লিন PDF)"}
                        </span>
                      </div>

                      {/* Question Bank */}
                      <div className="flex items-start gap-2.5">
                        {p.questionBank ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className={p.questionBank ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                          ৩,২০০+ প্রশ্নব্যাংক ফুল অ্যাক্সেস
                        </span>
                      </div>

                      {/* Random Generator */}
                      <div className="flex items-start gap-2.5">
                        {p.randomGenerator ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className={p.randomGenerator ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                          অটোমেটিক ৩-ক্লিক র্যান্ডম জেনারেটর
                        </span>
                      </div>

                      {/* Branding */}
                      <div className="flex items-start gap-2.5">
                        {p.branding ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className={p.branding ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                          প্রতিষ্ঠানের নিজস্ব নাম ও লোগো
                        </span>
                      </div>

                      {/* Multiple Versions */}
                      <div className="flex items-start gap-2.5">
                        {p.multipleVersions ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className={p.multipleVersions ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                          ৪ সেট শাফলার (সেট ক, খ, গ, ঘ)
                        </span>
                      </div>

                      {/* Export Format */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {p.exports?.includes("docx") ? "PDF এবং MS Word (.docx) উভয় এক্সপোর্ট" : "প্রিন্ট-রেডি এ৪ PDF এক্সপোর্ট"}
                        </span>
                      </div>

                      {/* AI Question Import */}
                      <div className="flex items-start gap-2.5">
                        {p.importQuestion ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className={p.importQuestion ? "font-semibold text-foreground" : "text-muted-foreground line-through"}>
                          {p.importQuestion ? "AI প্রশ্ন ইমপোর্ট (ছবি, PDF, Word)" : "প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-4 border-t border-border/40">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full font-bold cursor-default bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" disabled>
                        <Check className="h-4 w-4 mr-1.5" />
                        সক্রিয় প্যাকেজ
                      </Button>
                    ) : (
                      <Button asChild variant="primary" className="w-full font-bold gap-1.5">
                        <Link href={`/dashboard/checkout?plan=${p.code}`}>
                          <Sparkles className="h-4 w-4" />
                          {p.price > currentPlan.price ? "আপগ্রেড করুন" : "প্যাকেজ পরিবর্তন"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">মোট প্রশ্নপত্র লিমিট</span>
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {formatBnNumber(totalPapersCreated)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {isUnlimitedPapers ? "আনলিমিটেড" : `${formatBnNumber(paperLimit)} টি পেপার`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isUnlimitedPapers
                        ? "bg-emerald-500"
                        : papersPercent > 90
                        ? "bg-rose-500"
                        : papersPercent > 70
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${isUnlimitedPapers ? 100 : papersPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>{isUnlimitedPapers ? "সীমাহীন প্রশ্নপত্র তৈরি করা যাবে" : `${formatBnNumber(papersPercent)}% ব্যবহৃত`}</span>
                  <span>{isUnlimitedPapers ? "কোনো সীমাবদ্ধতা নেই" : `${formatBnNumber(Math.max(0, paperLimit - totalPapersCreated))} টি অবশিষ্ট`}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Questions Quota Card */}
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">অ্যাকাউন্ট-ওয়াইড প্রশ্ন কোটা</span>
                  <Layers className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {formatBnNumber(totalQuestionsCreated)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {isUnlimitedQuestions ? "আনলিমিটেড" : `${formatBnNumber(totalQuestionsLimit)} টি প্রশ্ন`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isUnlimitedQuestions
                        ? "bg-teal-500"
                        : questionsPercent > 90
                        ? "bg-rose-500"
                        : questionsPercent > 70
                        ? "bg-amber-500"
                        : "bg-teal-600"
                    }`}
                    style={{ width: `${isUnlimitedQuestions ? 100 : questionsPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>{isUnlimitedQuestions ? "সীমাহীন প্রশ্ন যুক্ত করা যাবে" : `${formatBnNumber(questionsPercent)}% ব্যবহৃত`}</span>
                  <span>{isUnlimitedQuestions ? "কোটা সীমাহীন" : `${formatBnNumber(Math.max(0, totalQuestionsLimit - totalQuestionsCreated))} টি অবশিষ্ট`}</span>
                </div>
              </CardContent>
            </Card>

            {/* Per-Paper Question Limit Card */}
            <Card className="border shadow-soft bg-card sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">প্রতি পেপারে প্রশ্ন সংখ্যা</span>
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1">
                  {isUnlimitedPerPaper ? "আনলিমিটেড" : `${formatBnNumber(questionsPerPaperLimit)} টি`}{" "}
                  <span className="text-xs font-normal text-muted-foreground">প্রশ্ন / পেপার</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  আপনার বর্তমান <strong>{currentPlan.name}</strong> প্যাকেজে এক পেপারে সর্বোচ্চ{" "}
                  {isUnlimitedPerPaper ? "আনলিমিটেড" : `${formatBnNumber(questionsPerPaperLimit)} টি`} প্রশ্ন যোগ ও ফরম্যাট করতে পারবেন।
                </p>
                {activePlanCode !== "diamond" && activePlanCode !== "ultra" && (
                  <Link href="/dashboard/subscription" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                    লিমিট বৃদ্ধি করতে প্যাকেজ আপগ্রেড করুন <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Limits & Policy Breakdown */}
          <Card className="border shadow-soft bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">প্যাকেজ নিয়ম ও কোটা বিশদ বিবরণী</CardTitle>
              <CardDescription className="text-xs">
                আপনার বর্তমান {currentPlan.name} প্যাকেজের সক্রিয় লিমিট ও অনুমোদিত পারমিশনসমূহ
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">মোট প্রশ্নপত্র তৈরির লিমিট</p>
                    <p className="text-muted-foreground text-[11px]">আপনার অ্যাকাউন্টে সর্বোচ্চ যতগুলো প্রশ্নপত্র সংরক্ষণ ও তৈরি করা যাবে</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {isUnlimitedPapers ? "আনলিমিটেড পেপার" : `${formatBnNumber(paperLimit)} টি পেপার`}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">অ্যাকাউন্ট-ওয়াইড মোট প্রশ্ন কোটা</p>
                    <p className="text-muted-foreground text-[11px]">সবগুলো সংরক্ষিত প্রশ্নপত্র মিলে মোট যতগুলো প্রশ্ন রাখা সম্ভব</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {isUnlimitedQuestions ? "আনলিমিটেড প্রশ্ন" : `${formatBnNumber(totalQuestionsLimit)} টি প্রশ্ন`}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">প্রতি একক পেপারের ধারণক্ষমতা</p>
                    <p className="text-muted-foreground text-[11px]">একটি পরীক্ষার পেপারে সর্বোচ্চ যতগুলো MCQ বা CQ প্রশ্ন যুক্ত হতে পারে</p>
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {isUnlimitedPerPaper ? "আনলিমিটেড প্রশ্ন" : `${formatBnNumber(questionsPerPaperLimit)} টি প্রশ্ন`}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">এক্সপোর্ট পারমিশন</p>
                    <p className="text-muted-foreground text-[11px]">পরীক্ষার পেপার সরাসরি যেসকল ফরম্যাটে ডাউনলোড করা যাবে</p>
                  </div>
                  <span className="font-bold text-foreground text-sm uppercase">
                    PDF {currentPlan.exports?.includes("docx") ? "ও MS Word (.docx)" : "অনলি"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">ওয়াটারমার্ক স্ট্যাটাস</p>
                    <p className="text-muted-foreground text-[11px]">ডাউনলোডকৃত PDF ডকুমেন্টে ওয়াটারমার্ক থাকবে কি না</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.watermark ? "text-amber-600" : "text-emerald-600"}`}>
                    {currentPlan.watermark ? "ওয়াটারমার্ক সহ প্রিভিউ" : "ক্লিন ডকুমেন্ট (কোনো ওয়াটারমার্ক নেই)"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">প্রশ্নব্যাংক অ্যাক্সেস</p>
                    <p className="text-muted-foreground text-[11px]">ক্লাস ও অধ্যায়ভিত্তিক অফিশিয়াল প্রশ্নভাণ্ডার ব্যবহার</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.questionBank ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {currentPlan.questionBank ? "৩,২০০+ প্রশ্নব্যাংক ফুল অ্যাক্সেস" : "অনুমোদিত নয়"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">AI প্রশ্ন ইমপোর্ট</p>
                    <p className="text-muted-foreground text-[11px]">ছবি, PDF বা Word ফাইল থেকে সরাসরি AI স্ক্যান ও প্রশ্ন তৈরি</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.importQuestion ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {currentPlan.importQuestion ? "সক্রিয় (AI & OCR Scanner)" : "অনুমোদিত নয়"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">৪ সেট প্রশ্নপত্র শাফলার</p>
                    <p className="text-muted-foreground text-[11px]">এক ক্লিকে সেট ক, খ, গ, ঘ তৈরি করার সুবিধা</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.multipleVersions ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {currentPlan.multipleVersions ? "সক্রিয় (৪ সেট শাফলার)" : "অনুমোদিত নয়"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">প্রতিষ্ঠানের নিজস্ব নাম ও লোগো ব্র্যান্ডিং</p>
                    <p className="text-muted-foreground text-[11px]">প্রশ্নপত্রে প্রতিষ্ঠানের নাম, লোগো ও কাস্টম হেডার যুক্ত করার সুবিধা</p>
                  </div>
                  <span className={`font-bold text-sm ${currentPlan.branding ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {currentPlan.branding ? "সক্রিয়" : "অনুমোদিত নয়"}
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
