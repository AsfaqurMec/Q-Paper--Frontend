"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  CheckCircle2,
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  User,
  Headphones
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppModal } from "@/components/modal-provider";
import { clientApi } from "@/lib/client-api";
import type { SupportTicket, TicketMessage } from "@/lib/api-types";

export function SupportTicketsView({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const { showAlert } = useAppModal();
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(initialTickets[0] || null);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "resolved">("all");
  const [loadingThread, setLoadingThread] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("এখনই");

  // Create ticket dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<string>("medium");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  // Reply states
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedTicketIdRef = useRef<string | null>(initialTickets[0]?.id || null);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?.id || null;
  }, [selectedTicket?.id]);

  // Scroll to bottom of message thread
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [selectedTicket?.id, scrollToBottom]);

  useEffect(() => {
    if (selectedTicket?.messages?.length) {
      scrollToBottom(true);
    }
  }, [selectedTicket?.messages?.length, scrollToBottom]);

  // Fetch full ticket thread on select
  const handleSelectTicket = useCallback(async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      setLoadingThread(true);
      const fresh = await clientApi.getTicket(ticket.id);
      if (fresh) {
        setSelectedTicket(fresh);
        setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
      }
    } catch (err) {
      console.error("Failed to load ticket thread:", err);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  // Fetch fresh ticket on mount if initial ticket exists
  useEffect(() => {
    if (initialTickets[0]?.id) {
      clientApi.getTicket(initialTickets[0].id)
        .then((fresh) => {
          if (fresh) {
            setSelectedTicket(fresh);
            setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Real-time synchronization function
  const syncTickets = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const freshList = await clientApi.getTickets();
      if (Array.isArray(freshList)) {
        setTickets(freshList);

        const currentActiveId = selectedTicketIdRef.current;
        if (currentActiveId) {
          const matched = freshList.find((t) => t.id === currentActiveId);
          if (matched && matched.messages && matched.messages.length > 0) {
            setSelectedTicket((prev) => {
              if (!prev || prev.id !== currentActiveId) return matched;
              // Only update if messages length or updatedAt differs to prevent re-renders
              if (
                (prev.messages?.length || 0) !== matched.messages!.length ||
                prev.status !== matched.status ||
                prev.updatedAt !== matched.updatedAt
              ) {
                return matched;
              }
              return prev;
            });
          } else {
            // Fetch individually if list doesn't have messages
            try {
              const freshSingle = await clientApi.getTicket(currentActiveId);
              if (freshSingle) {
                setSelectedTicket((prev) => {
                  if (!prev || prev.id !== currentActiveId) return freshSingle;
                  if (
                    (prev.messages?.length || 0) !== (freshSingle.messages?.length || 0) ||
                    prev.status !== freshSingle.status
                  ) {
                    return freshSingle;
                  }
                  return prev;
                });
              }
            } catch {}
          }
        }
      }
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Auto sync error:", err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Periodic polling synchronization every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncTickets(true);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [syncTickets]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setCreating(true);
      setErrorMsg(null);
      const newTicket = await clientApi.createTicket({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim()
      });

      setTickets((prev) => [newTicket, ...prev]);
      setSubject("");
      setMessage("");
      setCreateOpen(false);
      setSelectedTicket(newTicket);
      // Fetch fresh details immediately
      handleSelectTicket(newTicket);
    } catch (err: any) {
      setErrorMsg(err?.message || "টিকিট তৈরি করতে ব্যর্থ হয়েছে");
    } finally {
      setCreating(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setReplying(true);
      setErrorMsg(null);
      const updated = await clientApi.replyTicket(selectedTicket.id, {
        message: replyText.trim()
      });

      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyText("");
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      setErrorMsg(err?.message || "উত্তর পাঠাতে ব্যর্থ হয়েছে");
    } finally {
      setReplying(false);
    }
  }

  async function handleStatusChange(ticketId: string, status: string) {
    try {
      const updated = await clientApi.updateTicketStatus(ticketId, status);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      showAlert({
        title: "স্ট্যাটাস পরিবর্তন ত্রুটি",
        message: err?.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে",
        type: "error"
      });
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "open") return t.status === "open" || t.status === "in_progress";
    if (activeTab === "resolved") return t.status === "resolved" || t.status === "closed";
    return true;
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">উন্মুক্ত (Open)</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">চলমান (In Progress)</Badge>;
      case "resolved":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">সমাধানকৃত (Resolved)</Badge>;
      case "closed":
        return <Badge variant="outline">বন্ধ (Closed)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatMessageTime(dateStr?: string | Date) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-medium text-primary">সহায়তা ডেস্ক</p>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              লাইভ সিঙ্ক সক্রিয়
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">সাপোর্ট টিকিট ও লাইভ চ্যাট</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            প্রশ্ন তৈরি, ফরম্যাটিং বা যেকোনো সমস্যার জন্য সরাসরি সাপোর্ট টিমের সাথে কথোপকথন করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncTickets(false)}
            disabled={isSyncing}
            className="text-xs gap-1.5"
            title="সর্বশেষ মেসেজ ও টিকিট সিঙ্ক করুন"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "সিঙ্ক হচ্ছে..." : "সিঙ্ক করুন"}
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> নতুন টিকিট খুলুন
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>নতুন সহায়তা টিকিট তৈরি করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">বিষয় / Subject</Label>
                  <Input
                    placeholder="সমস্যার সংক্ষিপ্ত শিরোনাম লিখুন"
                    value={subject}
                    onChange={(e: any) => setSubject(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">বিভাগ / Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general" className="text-xs">সাধারণ অনুসন্ধান</SelectItem>
                        <SelectItem value="paper_generation" className="text-xs">প্রশ্নপত্র তৈরি</SelectItem>
                        <SelectItem value="math_formatting" className="text-xs">ম্যাথ / সমীকরণ ফরম্যাটিং</SelectItem>
                        <SelectItem value="billing" className="text-xs">বিলিং ও সাবস্ক্রিপশন</SelectItem>
                        <SelectItem value="feature_request" className="text-xs">নতুন ফিচারের অনুরোধ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">অগ্রাধিকার / Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">সাধারণ (Low)</SelectItem>
                        <SelectItem value="medium" className="text-xs">জরুরি (Medium)</SelectItem>
                        <SelectItem value="high" className="text-xs">অতি জরুরি (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">বিস্তারিত বিবরণ / Details</Label>
                  <Textarea
                    placeholder="আপনার সমস্যা বা প্রশ্নের বিস্তারিত বিবরণ লিখুন..."
                    value={message}
                    onChange={(e: any) => setMessage(e.target.value)}
                    rows={4}
                    className="text-xs"
                    required
                  />
                </div>

                {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

                <Button type="submit" className="w-full text-xs font-medium" disabled={creating}>
                  {creating ? "টিকিট তৈরি হচ্ছে..." : "টিকিট জমা দিন"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Grid: Ticket List + Thread Details */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[380px_1fr]">
        {/* Ticket List */}
        <Card className="h-fit">
          <CardHeader className="pb-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-primary" /> টিকিট তালিকা ({filteredTickets.length})
              </CardTitle>
              <div className="flex rounded-md border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded px-2 py-1 ${activeTab === "all" ? "bg-white dark:bg-slate-900 font-semibold shadow-2xs" : "text-muted-foreground"}`}
                >
                  সকল
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("open")}
                  className={`rounded px-2 py-1 ${activeTab === "open" ? "bg-white dark:bg-slate-900 font-semibold shadow-2xs" : "text-muted-foreground"}`}
                >
                  উন্মুক্ত
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("resolved")}
                  className={`rounded px-2 py-1 ${activeTab === "resolved" ? "bg-white dark:bg-slate-900 font-semibold shadow-2xs" : "text-muted-foreground"}`}
                >
                  সমাধানকৃত
                </button>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>সর্বশেষ সিঙ্ক: {lastSyncedTime}</span>
              <span className="text-primary font-medium">রিয়েল-টাইম লাইভ চ্যাট</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y max-h-[600px] overflow-y-auto">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const msgCount = ticket.messages?.length || (ticket.replies ? ticket.replies + 1 : 1);
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{ticket.subject}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="font-mono text-[11px]">আইডি: {ticket.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-primary" /> {msgCount} টি বার্তা
                    </span>
                  </div>
                  {ticket.lastMessage && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-1 italic">
                      &quot;{ticket.lastMessage}&quot;
                    </p>
                  )}
                </div>
              );
            })}

            {!filteredTickets.length && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                কোনো সাপোর্ট টিকিট নেই।
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thread Details & Chat View */}
        <Card className="flex flex-col min-h-[550px] shadow-sm">
          {selectedTicket ? (
            <>
              {/* Header */}
              <CardHeader className="border-b pb-3.5 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="font-mono font-medium">আইডি: {selectedTicket.id}</span>
                      <span>·</span>
                      <span>বিভাগ: {selectedTicket.category || "সাধারণ"}</span>
                      <span>·</span>
                      <span>অগ্রাধিকার: {selectedTicket.priority || "মাঝারি"}</span>
                      {selectedTicket.userEmail && (
                        <>
                          <span>·</span>
                          <span>ইমেইল: {selectedTicket.userEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTicket(selectedTicket)}
                      disabled={loadingThread}
                      className="h-8 px-2 text-xs"
                      title="কথোপকথন রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingThread ? "animate-spin text-primary" : ""}`} />
                    </Button>
                    {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" /> সম্পন্ন হিসেবে চিহ্নিত করুন
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages Body */}
              <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[460px] min-h-[300px] bg-slate-50/30 dark:bg-slate-950/20">
                {loadingThread && (!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs">কথোপকথনের বার্তা লোড হচ্ছে...</p>
                  </div>
                ) : (
                  <>
                    {(selectedTicket.messages || []).map((msg: TicketMessage, idx) => {
                      const isAdmin = msg.senderRole === "admin";
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                        >
                          <div className={`flex items-center gap-1.5 mb-1 text-[11px] font-medium ${isAdmin ? "text-slate-600 dark:text-slate-300" : "text-primary"}`}>
                            {isAdmin ? (
                              <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400">
                                <Headphones className="h-3.5 w-3.5" />
                                {msg.senderName || "Support Team"} (সাপোর্ট টিম)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold">
                                <User className="h-3.5 w-3.5" />
                                {msg.senderName || "আপনি"}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">· {formatMessageTime(msg.createdAt)}</span>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                              isAdmin
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs"
                                : "bg-primary text-primary-foreground rounded-tr-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap select-text">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })}

                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) && !loadingThread && (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs">কোনো বার্তা পাওয়া যায়নি। নিচের বক্সে আপনার বার্তা লিখুন।</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Reply Input Form */}
              <div className="border-t p-3.5 bg-background">
                {selectedTicket.status === "closed" ? (
                  <div className="rounded-md bg-muted p-2.5 text-center text-xs text-muted-foreground">
                    এই সাপোর্ট টিকিটটি বন্ধ (Closed) করা হয়েছে। নতুন অনুসন্ধানের জন্য নতুন টিকিট খুলুন।
                  </div>
                ) : (
                  <form onSubmit={handleReply} className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="আপনার বার্তা বা প্রতিক্রিয়া লিখুন..."
                        value={replyText}
                        onChange={(e: any) => setReplyText(e.target.value)}
                        className="text-xs flex-1 h-9"
                        disabled={replying}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1.5 text-xs shrink-0 h-9 px-4"
                        disabled={replying || !replyText.trim()}
                      >
                        <Send className="h-3.5 w-3.5" /> {replying ? "পাঠানো হচ্ছে..." : "পাঠান"}
                      </Button>
                    </div>
                    {errorMsg && <p className="text-[11px] text-destructive">{errorMsg}</p>}
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="font-semibold text-base text-foreground">বাম পাশ থেকে যেকোনো টিকিট নির্বাচন করুন</p>
              <p className="text-xs mt-1 max-w-sm">
                সাপোর্ট টিমের সাথে আপনার সম্পূর্ণ কথোপকথনের ইতিহাস দেখতে ও সরাসরি চ্যাট করতে যেকোনো টিকিট নির্বাচন করুন।
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
