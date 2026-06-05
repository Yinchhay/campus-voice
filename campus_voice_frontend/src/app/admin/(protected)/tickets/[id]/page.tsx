"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  TriangleAlert,
  Video,
  MapPin,
  Users,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  mockCategories,
  mockMeetingSlots,
  mockMessages,
  mockTickets,
  mockBookings,
} from "@/lib/mock-data";
import { adminNav } from "../../dashboard/page";
import type { MeetingType, TicketPriority, TicketStatus } from "@/lib/types";

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
const meetingTypeIcon: Record<MeetingType, React.ReactNode> = {
  VIRTUAL: <Video className="h-4 w-4" />,
  IN_PERSON: <MapPin className="h-4 w-4" />,
  HYBRID: <Users className="h-4 w-4" />,
};
const meetingTypeLabel: Record<MeetingType, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "In-Person",
  HYBRID: "Hybrid",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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

  const ticket = useMemo(() => mockTickets.find((t) => t.id === id), [id]);
  const category = useMemo(
    () => mockCategories.find((c) => c.id === ticket?.category_id),
    [ticket],
  );
  const messages = useMemo(
    () =>
      mockMessages
        .filter((m) => m.ticket_id === id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [id],
  );
  const meetingSlot = useMemo(
    () => mockMeetingSlots.find((s) => s.ticket_id === id) ?? null,
    [id],
  );
  const booking = useMemo(
    () => mockBookings.find((b) => b.ticket_id === id) ?? null,
    [id],
  );

  // Admin overrides (visual only)
  const [statusOverride, setStatusOverride] = useState<TicketStatus>(
    ticket?.status ?? "SUBMITTED",
  );
  const [priorityOverride, setPriorityOverride] = useState<TicketPriority>(
    ticket?.priority ?? "LOW",
  );

  const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

  if (!ticket) {
    return (
      <RoleDashboardShell roleName="Admin" title="Not Found" description="" navItems={adminNav}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Ticket not found</h2>
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
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[statusOverride]}`}
                >
                  {statusLabel[statusOverride]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadgeClass[priorityOverride]}`}
                >
                  {priorityOverride}
                </span>
                {ticket.has_media && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    <Paperclip className="h-3 w-3" />
                    Has attachment
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-lg font-semibold text-slate-900">{ticket.title}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{category?.name ?? "Uncategorised"}</p>

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
                {ticket.submitted_by ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    Authenticated student
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    Anonymous
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
            </div>

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
                            {msg.attachment_name && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs opacity-70">
                                <Paperclip className="h-3 w-3" />
                                {msg.attachment_name}
                              </div>
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
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Status Override</h2>
              <div className="flex flex-col gap-2">
                {statusFlow.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusOverride(s)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      statusOverride === s
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
                  </button>
                ))}
              </div>
            </div>

            {/* Priority override */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Priority Override</h2>
              <select
                id="admin-priority-select"
                value={priorityOverride}
                onChange={(e) => setPriorityOverride(e.target.value as TicketPriority)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1E3A8A]"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Meeting info */}
            {meetingSlot && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarClock className="h-4 w-4 text-blue-600" />
                  Meeting Slot
                </h2>
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    {meetingTypeIcon[meetingSlot.meeting_type]}
                    <span>{meetingTypeLabel[meetingSlot.meeting_type]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {formatDate(meetingSlot.start_time)}, {formatTime(meetingSlot.start_time)}{" "}
                      &ndash; {formatTime(meetingSlot.end_time)}
                    </span>
                  </div>
                  {meetingSlot.location_or_details && (
                    <p className="text-slate-500">{meetingSlot.location_or_details}</p>
                  )}
                  {meetingSlot.meeting_link && (
                    <a
                      href={meetingSlot.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Meeting link
                    </a>
                  )}
                </div>

                {booking ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Student booked</p>
                      <p className="mt-0.5 text-emerald-600">
                        {booking.is_confirmed ? "Confirmed" : "Pending confirmation"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">No booking yet — slot is available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
