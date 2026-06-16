"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  TriangleAlert,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { attachmentHref, attachmentName } from "@/lib/attachments";
import { getAdminTicket, type AdminTicket } from "@/lib/admin-api";
import { adminNav } from "@/lib/dashboard-nav";
import type { TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
const statusBadgeClass: Record<TicketStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const statusLabel: Record<TicketStatus, string> = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};
const priorityBadgeClass: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso?: string | null) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<AdminTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      setIsLoading(true);
      setPageError("");

      try {
        const data = await getAdminTicket(id);
        if (isMounted) setTicket(data);
      } catch {
        if (isMounted) setPageError("Failed to load ticket details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTicket();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const messages = [...(ticket?.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  if (isLoading) {
    return (
      <RoleDashboardShell roleName="Admin" title="Loading" description="" navItems={adminNav}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
          <p className="mt-4 text-sm text-slate-500">Loading ticket details...</p>
        </div>
      </RoleDashboardShell>
    );
  }

  if (!ticket || pageError) {
    return (
      <RoleDashboardShell roleName="Admin" title="Not Found" description="" navItems={adminNav}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Ticket unavailable</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {pageError || "Ticket not found."}
          </p>
          <Link href="/admin/tickets" className="mt-4 inline-flex items-center gap-2 text-sm text-[#1E3A8A]">
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>
        </div>
      </RoleDashboardShell>
    );
  }

  return (
    <RoleDashboardShell
      roleName="Admin"
      title={ticket.public_ticket_id}
      description={ticket.title}
      navItems={adminNav}
    >
      <div className="space-y-5">
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Left: Details + Chat ─────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  {ticket.public_ticket_id}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[ticket.status]}`}
                >
                  {statusLabel[ticket.status]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadgeClass[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
                {ticket.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    <Paperclip className="h-3 w-3" />
                    {ticket.attachments.length} attachment
                    {ticket.attachments.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-lg font-semibold text-slate-900">{ticket.title}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{ticket.category_name}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Submitted {formatDate(ticket.created_at)}
                </span>
                {ticket.resolved_at && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolved {formatDate(ticket.resolved_at)}
                  </span>
                )}
                {ticket.is_anonymous ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    Anonymous
                  </span>
                ) : ticket.submitted_by_email ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {ticket.submitted_by_email}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    Authenticated student
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-400" />
                Report Description
              </h2>
              <p className="leading-7 text-sm text-slate-700">{ticket.description}</p>
              {ticket.attachments.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Attachments
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachmentHref(attachment)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{attachmentName(attachment)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {ticket.resolution && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Resolution
                </h2>
                <p className="leading-7 text-sm text-emerald-900">
                  {ticket.resolution.note}
                </p>
                {ticket.resolution.attachments.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {ticket.resolution.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachmentHref(attachment)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-emerald-800 transition hover:bg-white"
                      >
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="truncate">{attachmentName(attachment)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat (read-only for admin) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">Conversation</h2>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-1 px-6 py-4">
                {messages.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    No messages on this ticket yet.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.is_staff_message;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 py-2 ${isStaff ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isStaff ? "bg-[#1E3A8A] text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isStaff ? "OSS" : "Stu"}
                        </div>
                        <div
                          className={`flex max-w-[78%] flex-col gap-1 ${
                            isStaff ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isStaff
                                ? "rounded-tr-sm bg-[#1E3A8A] text-white"
                                : "rounded-tl-sm bg-slate-100 text-slate-800"
                            }`}
                          >
                            {msg.content}
                            {msg.attachment && (
                              <a
                                href={attachmentHref(msg.attachment)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 flex items-center gap-1.5 text-xs opacity-80 underline-offset-2 hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {attachmentName(msg.attachment)}
                              </a>
                            )}
                          </div>
                          <span className="px-1 text-xs text-slate-400">
                            {formatChatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">
                  Admin view — read-only conversation log. Staff can reply through the staff portal.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Admin Controls + Meeting ─────────────── */}
          <div className="space-y-4">
            {/* Status override */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Status</h2>
              <div className="flex flex-col gap-2">
                {statusFlow.map((s) => (
                  <div
                    key={s}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      ticket.status === s
                        ? s === "RESOLVED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : s === "IN_PROGRESS"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s === "SUBMITTED" && <Clock className="mr-2 inline h-3.5 w-3.5" />}
                    {s === "IN_PROGRESS" && <Clock className="mr-2 inline h-3.5 w-3.5" />}
                    {s === "RESOLVED" && <CheckCircle2 className="mr-2 inline h-3.5 w-3.5" />}
                    {statusLabel[s]}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Admin ticket update API is not available in the current backend.
              </p>
            </div>

            {/* Priority override */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Priority</h2>
              <div
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${priorityBadgeClass[ticket.priority]}`}
              >
                {ticket.priority}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
