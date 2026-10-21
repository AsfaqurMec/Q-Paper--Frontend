"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientApi } from "@/lib/client-api";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Paper, SharedLink } from "@/lib/api-types";

export function ShareLinksView({ initialPapers, initialLinks }: { initialPapers: Paper[]; initialLinks: SharedLink[] }) {
  const [links, setLinks] = useState<SharedLink[]>(initialLinks);
  const [selectedPaperId, setSelectedPaperId] = useState<string>(initialPapers[0]?.id || "");
  const [mode] = useState<"view_only">("view_only");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPaperId) {
      setStatusMsg({ type: "error", text: "অনুগ্রহ করে একটি প্রশ্নপত্র নির্বাচন করুন" });
      return;
    }

    try {
      setCreating(true);
      setStatusMsg(null);
      const created = await clientApi.createSharedLink({
        paperId: selectedPaperId,
        mode,
        password: password.trim() ? password.trim() : undefined
      });

      setLinks((prev) => [created, ...prev]);
      setPassword("");
      setStatusMsg({ type: "success", text: "শেয়ার লিংক সফলভাবে তৈরি হয়েছে!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "লিংক তৈরিতে ব্যর্থ হয়েছে" });
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      setDeleteLoading(id);
      await clientApi.deleteSharedLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setStatusMsg({ type: "success", text: "শেয়ার লিংক বাতিল করা হয়েছে" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "লিংক বাতিল করতে ব্যর্থ" });
    } finally {
      setDeleteLoading(null);
      setDeleteTargetId(null);
    }
  }

  function copyLink(tokenOrUrl: string, id: string) {
    const fullUrl = tokenOrUrl.startsWith("http")
      ? tokenOrUrl
      : `${window.location.origin}${tokenOrUrl.startsWith("/") ? "" : "/"}${tokenOrUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {/* Left: Create Link Form */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">পাবলিক শেয়ার লিংক</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">প্রশ্নপত্র শেয়ার করুন</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            যেকোনো প্রশ্নপত্রের জন্য সুরক্ষিত পাবলিক লিংক তৈরি করুন। কোনো এক্সপোর্ট, ডাউনলোড বা স্ক্রিনশট অনুমোদিত নয় এবং কন্টেন্ট সম্পূর্ণ সুরক্ষিত থাকবে।
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> নতুন শেয়ার লিংক তৈরি
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">প্রশ্নপত্র নির্বাচন করুন</Label>
                <Select value={selectedPaperId} onValueChange={setSelectedPaperId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="প্রশ্নপত্র বেছে নিন" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialPapers.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name} ({p.subject} - {p.className})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">অ্যাক্সেস মোড</Label>
                <div className="rounded-md border bg-muted/40 p-2.5 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">সুরক্ষিত অনলাইন ভিউ (এক্সপোর্ট ও প্রিন্ট সম্পূর্ণ নিষিদ্ধ)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">পাসওয়ার্ড সুরক্ষা (ঐচ্ছিক)</Label>
                <Input
                  type="password"
                  placeholder="পাসওয়ার্ড ছাড়া সবার জন্য উন্মুক্ত থাকবে"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">পাসওয়ার্ড দিলে কেবল পাসওয়ার্ডধারীরাই প্রশ্নপত্রটি দেখতে পাবে।</p>
              </div>

              {statusMsg && (
                <div
                  className={`rounded-md p-2.5 text-xs ${
                    statusMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <Button type="submit" className="w-full text-xs font-medium" disabled={creating}>
                {creating ? "লিংক তৈরি হচ্ছে..." : "লিংক তৈরি করুন"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Active Links List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> সক্রিয় শেয়ার লিংকসমূহ
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">মোট {links.length} টি সক্রিয় লিংক রয়েছে</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.map((link) => {
            const isCopied = copiedId === link.id;
            return (
              <div
                key={link.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">{link.paperName || "প্রশ্নপত্র"}</span>
                    <Badge variant={link.protected ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                      {link.protected ? "🔒 সুরক্ষিত" : "🌐 উন্মুক্ত"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                      সুরক্ষিত ভিউ
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{link.url}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {link.subject || "সাধারণ"} · মোট ভিউ: {link.visits || 0} বার
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => copyLink(link.url, link.id)}
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? "কপি হয়েছে" : "কপি"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer" title="নতুন ট্যাবে দেখুন">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTargetId(link.id)}
                    disabled={deleteLoading === link.id}
                    title="লিংক বাতিল করুন"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {!links.length && (
            <div className="text-center py-10">
              <Link2 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">এখনও কোনো শেয়ার লিংক তৈরি করা হয়নি</p>
              <p className="text-xs text-muted-foreground mt-1">বাম পাশের ফরম থেকে একটি প্রশ্নপত্র নির্বাচন করে লিংক তৈরি করুন।</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="শেয়ার লিংক বাতিল করুন"
        message="আপনি কি নিশ্চিত যে এই শেয়ার লিংকটি বাতিল করতে চান? লিংকটি বাতিল করা হলে এই লিংকের মাধ্যমে প্রশ্নপত্র আর দেখা যাবে না।"
        confirmText="বাতিল করুন"
        cancelText="ফিরে যান"
        variant="danger"
        loading={Boolean(deleteLoading)}
      />
    </div>
  );
}
