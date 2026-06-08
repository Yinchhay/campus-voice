"use client";

import Link from "next/link";
import axios from "axios";
import { use, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  TriangleAlert,
  Video,
  Users,
} from "lucide-react";
import { mockBookings, mockMeetingSlots } from "@/lib/mock-data";
import {
  createStudentTicketMessage,
  getMyTicket,
  type StudentTicket,
  type StudentTicketMessage,
} from "@/lib/student-api";
import type {
  MeetingSlot,
  MeetingType,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const statusLabel: Record<TicketStatus, string> = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const statusBadgeClass: Record<TicketStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const priorityBadgeClass: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityLabel: Record<TicketPriority, string> = {
  HIGH: "High Priority",
  MEDIUM: "Medium Priority",
  LOW: "Low Priority",
};

const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

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

function formatDateTime(iso: string) {
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}

function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("detail" in data && typeof data.detail === "string") return data.detail;
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatusStepper({ status }: { status: TicketStatus }) {
  const currentStep = statusFlow.indexOf(status);
  return (
    <ol className="grid grid-cols-3 gap-2 text-xs">
      {statusFlow.map((step, index) => {
        const isDone = index <= currentStep;
        const isCurrent = index === currentStep;
        return (
          <li
            key={step}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 transition ${
              isDone
                ? isCurrent
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-400"
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="font-medium">{statusLabel[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

function MeetingSection({
  slot,
  ticketId,
}: {
  slot: MeetingSlot | null;
  ticketId: string;
}) {
  const [booked, setBooked] = useState(false);

  const existingBooking = mockBookings.find((b) => b.ticket_id === ticketId);
  const isAlreadyBooked = !slot?.is_available || !!existingBooking || booked;

  if (!slot) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        <CalendarClock className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Meeting Slot</h2>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isAlreadyBooked
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {isAlreadyBooked ? "Booked" : "Available"}
        </span>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="flex items-start gap-3">
          {meetingTypeIcon[slot.meeting_type]}
          <div>
            <p className="font-medium">{meetingTypeLabel[slot.meeting_type]}</p>
            {slot.location_or_details && (
              <p className="mt-0.5 text-slate-500">
                {slot.location_or_details}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="font-medium">{formatDate(slot.start_time)}</p>
            <p className="mt-0.5 text-slate-500">
              {formatTime(slot.start_time)} &ndash; {formatTime(slot.end_time)}
            </p>
          </div>
        </div>
        {slot.meeting_link && (
          <div className="flex items-center gap-3">
            <Video className="h-4 w-4 shrink-0 text-slate-400" />
            <a
              href={slot.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="truncate text-blue-600 underline-offset-2 hover:underline"
            >
              Join meeting link
            </a>
          </div>
        )}
      </div>

      {isAlreadyBooked ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {existingBooking
              ? `Booked on ${formatDate(existingBooking.booked_at)}`
              : "Your slot has been confirmed. Check your email for details."}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setBooked(true)}
          className="mt-4 w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
        >
          Book this slot
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<StudentTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<StudentTicketMessage[]>(
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      setIsLoading(true);
      setPageError(null);

      try {
        const data = await getMyTicket(id);
        if (isMounted) setTicket(data);
      } catch (error) {
        if (isMounted)
          setPageError(
            extractApiError(error, "Failed to load report details."),
          );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTicket();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const serverMessages = useMemo(
    () =>
      (ticket?.messages ?? []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [ticket?.messages],
  );
  const meetingSlot = useMemo(
    () => mockMeetingSlots.find((s) => s.ticket_id === id) ?? null,
    [id],
  );

  const allMessages = [...serverMessages, ...localMessages];

  async function handleSend() {
    const text = replyText.trim();
    if (!ticket || !text || isSendingMessage) return;

    setIsSendingMessage(true);
    setMessageError(null);

    try {
      const message = await createStudentTicketMessage(ticket.id, text);
      setLocalMessages((prev) => [...prev, message]);
      setReplyText("");
    } catch (error) {
      setMessageError(extractApiError(error, "Failed to send message."));
    } finally {
      setIsSendingMessage(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
          <p className="mt-4 text-sm text-slate-600">
            Loading report details...
          </p>
        </div>
      </main>
    );
  }

  if (!ticket || pageError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-center">
        <div className="mx-auto max-w-md">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            {pageError ? "Unable to load report" : "Report not found"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {pageError ||
              "This report doesn't exist or you don't have permission to view it."}
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/student/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Reports
        </Link>

        <div className="space-y-5">
          {/* ── Ticket Header ──────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Report content is anonymous to staff
            </div>

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
                {priorityLabel[ticket.priority]}
              </span>
              {ticket.has_media && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  <Paperclip className="h-3 w-3" />
                  Has attachment
                </span>
              )}
            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              {ticket.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.category_name}
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
              {ticket.created_at ? (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Submitted {formatDateTime(ticket.created_at)}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Submitted date unavailable
                </span>
              )}
              {ticket.resolved_at && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolved {formatDateTime(ticket.resolved_at)}
                </span>
              )}
            </div>

            <div className="mt-5">
              <StatusStepper status={ticket.status} />
            </div>
          </div>

          {/* ── Description ───────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-slate-400" />
              Report Description
            </h2>
            <p className="leading-7 text-slate-700">{ticket.description}</p>
          </div>

          {/* ── Meeting Slot ───────────────────────────────────── */}
          {meetingSlot && (
            <MeetingSection slot={meetingSlot} ticketId={ticket.id} />
          )}

          {/* ── Message Thread ────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Conversation
              </h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {allMessages.length} message
                {allMessages.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-1 px-6 py-4">
              {allMessages.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No messages yet. Staff will respond here once they begin
                  reviewing your report.
                </div>
              ) : (
                allMessages.map((msg) => {
                  const isStaff = msg.is_staff_message;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 py-2 ${isStaff ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isStaff
                            ? "bg-[#1E3A8A] text-white"
                            : "bg-teal-500 text-white"
                        }`}
                      >
                        {isStaff ? "OSS" : "You"}
                      </div>

                      <div
                        className={`flex max-w-[78%] flex-col gap-1 ${
                          isStaff ? "items-start" : "items-end"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isStaff
                              ? "rounded-tl-sm bg-slate-100 text-slate-800"
                              : "rounded-tr-sm bg-[#1E3A8A] text-white"
                          }`}
                        >
                          {msg.content}
                          {msg.attachment_name && (
                            <div
                              className={`mt-2 flex items-center gap-1.5 text-xs ${
                                isStaff ? "text-slate-500" : "text-blue-200"
                              }`}
                            >
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

            {/* Reply box */}
            {ticket.status !== "RESOLVED" ? (
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-end gap-3">
                  <textarea
                    id="reply-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={3}
                    placeholder="Add a message or update… (Enter to send, Shift+Enter for new line)"
                    disabled={isSendingMessage}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!replyText.trim() || isSendingMessage}
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A] text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                    title="Send message"
                  >
                    {isSendingMessage ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {messageError && (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {messageError}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  Messages are anonymous. Do not include personally identifying
                  information.
                </p>
              </div>
            ) : (
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  This case has been resolved. The conversation thread is now
                  closed.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
