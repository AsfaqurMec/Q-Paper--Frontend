"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Image as ImageIcon,
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
  Trash2,
  Upload,
  User,
  X,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, clientApi } from "@/lib/client-api";
import { formatBnNumber } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/plan-constants";
import { SubscriptionPlanSlider } from "@/components/subscription/subscription-plan-slider";
import type { DashboardData, PaymentRequest, Plan, UserSession } from "@/lib/api-types";


type ProfileViewProps = {
  initialUser: UserSession;
  plans: Plan[];
  dashboardStats: DashboardData["stats"];
  myRequests: PaymentRequest[];
};


export function ProfileView({ initialUser, plans, dashboardStats, myRequests }: ProfileViewProps) {
  const router = useRouter();
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

  // Current Plan from Database / API (strictly sorted ascending by price)
  const [livePlans, setLivePlans] = useState<Plan[]>(plans || []);

  useEffect(() => {
    if (activeTab === "plan" && (!livePlans || livePlans.length === 0)) {
      clientApi.plans().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setLivePlans(res);
        }
      }).catch(() => {});
    }
  }, [activeTab, livePlans]);

  const rawPlans = Array.isArray(livePlans) && livePlans.length > 0 ? livePlans : (Array.isArray(plans) && plans.length > 0 ? plans : DEFAULT_PLANS);
  const planList = [...rawPlans].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  const activePlanCode = user.plan || "free";
  const currentPlan = planList.find((p) => p.code === activePlanCode) || planList[0];
  const canUseBranding = user.role === "admin" || !!currentPlan.branding;

  // Institute Branding State
  const [brandingEnabled, setBrandingEnabled] = useState(user.instituteBranding ?? false);
  const [brandingInstitute, setBrandingInstitute] = useState(user.institute || "");
  const [brandingLogo, setBrandingLogo] = useState(user.instituteLogo || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setBrandingError("লোগো ফাইলের আকার সর্বোচ্চ ২ MB হতে পারবে (Max 2MB).");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setBrandingError(null);

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });

      try {
        const uploadRes = await apiRequest<{ imageUrl: string }>("/api/uploads/image", {
          method: "POST",
          body: JSON.stringify({ folder: "logos", fileName: file.name, imageData: dataUrl })
        });
        if (uploadRes?.imageUrl) {
          setBrandingLogo(uploadRes.imageUrl);
          return;
        }
      } catch {
        // Fallback to dataUrl
      }
      setBrandingLogo(dataUrl);
    } catch (err: any) {
      setBrandingError(err instanceof Error ? err.message : "লোগো আপলোড ব্যর্থ হয়েছে");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleBrandingSave() {
    if (brandingEnabled && !brandingInstitute.trim()) {
      setBrandingError("প্রতিষ্ঠানের নাম খালি রাখা যাবে না।");
      return;
    }

    try {
      setBrandingSaving(true);
      setBrandingError(null);
      setBrandingSuccess(null);

      const updated = await clientApi.updateProfile({
        institute: brandingInstitute.trim(),
        instituteLogo: brandingLogo.trim(),
        instituteBranding: brandingEnabled
      });

      setUser((prev) => ({
        ...prev,
        ...updated,
        institute: updated?.institute ?? brandingInstitute.trim(),
        instituteLogo: updated?.instituteLogo ?? brandingLogo.trim(),
        instituteBranding: updated?.instituteBranding ?? brandingEnabled
      }));

      setEditForm((prev) => ({
        ...prev,
        institute: updated?.institute ?? brandingInstitute.trim()
      }));

      setBrandingSuccess("প্রতিষ্ঠানের ব্র্যান্ডিং সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      router.refresh();
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : "ব্র্যান্ডিং আপডেট ব্যর্থ হয়েছে";
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.message) msg = parsed.message;
      } catch {}
      setBrandingError(msg);
    } finally {
      setBrandingSaving(false);
    }
  }

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
        name: updated?.name || editForm.name.trim(),
        phone: updated?.phone ?? editForm.phone.trim(),
        institute: updated?.institute ?? editForm.institute.trim()
      }));
      setBrandingInstitute(editForm.institute.trim());

      setProfileSuccess("Profile details updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : "Failed to update profile";
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.message) msg = parsed.message;
      } catch {}
      setProfileError(msg);
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
                      <span className="text-muted-foreground block text-[11px] font-medium uppercase">Institute Branding</span>
                      <div className="flex items-center gap-2 mt-1">
                        {user.instituteLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.instituteLogo}
                            alt="Logo"
                            className="h-5 w-5 rounded object-contain border bg-white"
                          />
                        )}
                        <span className={`font-semibold text-xs ${user.instituteBranding ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {user.instituteBranding ? "Active (লোগো ও নাম হেডার যুক্ত)" : "Disabled (বন্ধ)"}
                        </span>
                      </div>
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

            {/* Institute Branding & Custom Header Card */}
            <Card className="border shadow-soft bg-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        Institute Branding (প্রতিষ্ঠানের ব্র্যান্ডিং ও লোগো)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        পরীক্ষার প্রশ্নপত্রের শীর্ষে প্রতিষ্ঠানের নিজস্ব লোগো ও নাম প্রদর্শন করুন
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      canUseBranding
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold self-start sm:self-auto"
                        : "bg-amber-50 text-amber-700 border-amber-300 font-semibold self-start sm:self-auto"
                    }
                  >
                    {canUseBranding ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" /> ব্র্যান্ডিং অনুমোদিত
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> আপগ্রেড প্রয়োজন
                      </span>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                {brandingSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{brandingSuccess}</span>
                  </div>
                )}
                {brandingError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    <span>{brandingError}</span>
                  </div>
                )}

                {/* Plan restriction warning if Free plan */}
                {!canUseBranding && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">প্যাকেজ সীমাবদ্ধতা (Free Plan)</p>
                        <p className="mt-0.5 leading-relaxed text-muted-foreground">
                          আপনার বর্তমান <strong>Free</strong> প্যাকেজে প্রশ্নপত্রে প্রতিষ্ঠানের নিজস্ব নাম ও লোগো যুক্ত করার সুবিধা অন্তর্ভুক্ত নয়। Small, Pro, Ultra অথবা Diamond প্যাকেজে আপগ্রেড করে নিজস্ব ব্র্যান্ডিং সক্রিয় করুন।
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="primary" className="shrink-0 font-semibold h-8">
                      <Link href="/dashboard/subscription">প্যাকেজ আপগ্রেড করুন</Link>
                    </Button>
                  </div>
                )}

                {/* Radio Slide Button (Toggle Switch) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5 pr-4">
                    <label
                      htmlFor="branding-switch"
                      className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      প্রশ্নপত্রে প্রতিষ্ঠানের ব্র্যান্ডিং প্রদর্শন করুন (Enable Branding)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      সক্রিয় করা হলে আপনার তৈরি সকল প্রশ্নপত্রের মূল হেডারে প্রতিষ্ঠানের লোগো ও নাম মুদ্রিত হবে।
                    </p>
                  </div>

                  {/* Radio Slide Button Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                      {brandingEnabled ? "ON" : "OFF"}
                    </span>
                    <button
                      id="branding-switch"
                      type="button"
                      role="switch"
                      aria-checked={brandingEnabled}
                      disabled={!canUseBranding || brandingSaving}
                      onClick={() => {
                        if (!canUseBranding) return;
                        setBrandingEnabled(!brandingEnabled);
                        setBrandingSuccess(null);
                        setBrandingError(null);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                        !canUseBranding
                          ? "bg-muted cursor-not-allowed opacity-60"
                          : brandingEnabled
                          ? "bg-teal-600"
                          : "bg-muted-foreground/30"
                      }`}
                      title={!canUseBranding ? "Upgrade plan to enable branding" : "Toggle institute branding"}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          brandingEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Fields when Branding is Enabled */}
                {brandingEnabled && canUseBranding && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    {/* Institute Name Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        প্রতিষ্ঠানের নাম (Institute / School / College Name) *
                      </label>
                      <input
                        type="text"
                        value={brandingInstitute}
                        onChange={(e) => setBrandingInstitute(e.target.value)}
                        placeholder="যেমন: ঢাকা রেসিডেনসিয়াল মডেল কলেজ"
                        className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        এই নামটি পরীক্ষার প্রশ্নপত্রের শীর্ষভাগে প্রধান হেডার হিসেবে মুদ্রিত হবে।
                      </span>
                    </div>

                    {/* Institute Logo Upload & URL */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        প্রতিষ্ঠানের লোগো (Institute Logo)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* File Upload Option */}
                        <div className="border border-dashed rounded-lg p-3.5 bg-muted/10 flex flex-col items-center justify-center text-center gap-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">লোগো ইমেজ আপলোড করুন</p>
                            <p className="text-[10px] text-muted-foreground">PNG, JPG বা WebP (সর্বোচ্চ ২ MB)</p>
                          </div>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingLogo || brandingSaving}
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition shadow-2xs">
                              {isUploadingLogo ? "আপলোড হচ্ছে..." : "ফাইল নির্বাচন করুন"}
                            </span>
                          </label>
                        </div>

                        {/* Direct URL Input Option */}
                        <div className="border rounded-lg p-3.5 bg-muted/10 flex flex-col justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-foreground block">লোগোর সরাসরি লিঙ্ক (URL)</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              আপনার ওয়েবসাইটের বা ক্লাউড ইমেজের সরাসরি লিঙ্ক দিতে পারেন
                            </span>
                          </div>
                          <input
                            type="url"
                            value={brandingLogo}
                            onChange={(e) => setBrandingLogo(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="h-8 w-full rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Current Logo Preview Thumbnail */}
                      {brandingLogo && (
                        <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-md border bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={brandingLogo}
                                alt="Institute Logo Preview"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground">লোগো সংযুক্ত রয়েছে</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">
                                {brandingLogo.startsWith("data:") ? "Local Image Data" : brandingLogo}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setBrandingLogo("")}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            মুছুন
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Live Header Visual Preview */}
                    <div className="pt-2">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        প্রশ্নপত্রে হেডার প্রিভিউ (Live Header Preview)
                      </span>
                      <div className="rounded-lg border bg-white text-slate-900 p-4 shadow-xs">
                        <div className="relative border-b pb-3 text-center">
                          {brandingLogo && (
                            <div className="absolute left-0 top-0 h-10 w-10 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={brandingLogo}
                                alt="Logo"
                                className="max-h-9 max-w-9 object-contain"
                              />
                            </div>
                          )}
                          <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                            {brandingInstitute || "আপনার প্রতিষ্ঠানের নাম"}
                          </h3>
                          <p className="text-xs font-medium text-slate-700 mt-0.5">
                            অর্ধ-বার্ষিক পরীক্ষা - ২০২৬
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 font-medium px-2">
                            <span>শ্রেণি: দশম</span>
                            <span>বিষয়: পদার্থবিজ্ঞান</span>
                            <span>পূর্ণমান: ১০০</span>
                            <span>সময়: ৩ ঘণ্টা</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button for Branding */}
                    <div className="flex items-center justify-end pt-3 border-t">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={brandingSaving}
                        onClick={handleBrandingSave}
                        className="gap-1.5 font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Save className="h-4 w-4" />
                        {brandingSaving ? "সংরক্ষণ হচ্ছে..." : "ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* If branding was disabled but user clicked to toggle it off, offer save */}
                {!brandingEnabled && canUseBranding && user.instituteBranding && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">
                      ব্র্যান্ডিং নিষ্ক্রিয় করার পরিবর্তনটি সংরক্ষণ করুন।
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={brandingSaving}
                      onClick={handleBrandingSave}
                      className="gap-1.5 font-semibold"
                    >
                      <Save className="h-4 w-4" />
                      সংরক্ষণ করুন
                    </Button>
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

          <SubscriptionPlanSlider planList={planList} activePlanCode={activePlanCode} mode="profile" />
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
