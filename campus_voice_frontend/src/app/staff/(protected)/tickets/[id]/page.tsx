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
  LayoutDashboard,
  ListChecks,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Settings,
  TriangleAlert,
  Users,
  Video,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  createStaffTicketMessage,
  getStaffTicket,
  updateStaffTicketStatus,
  type StaffTicket,
  type StaffTicketMessage,
} from "@/lib/staff-api";
import type {
  MeetingSlot,
  MeetingType,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const navItems = [
  { label: "Dashboard", href: "/staff/dashboard", Icon: LayoutDashboard },
  { label: "Ticket Queue", href: "/staff/tickets", Icon: ListChecks },
  { label: "Settings", href: "/staff/settings", Icon: Settings },
];

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
function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;

  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const message =
      "error" in data
        ? data.error
        : "detail" in data
          ? data.detail
          : "message" in data
            ? data.message
            : undefined;

    if (typeof message === "string") return message;
  }

  return fallback;
}

function formatDate(iso?: string) {
  if (!iso) return "Date unavailable";

  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(iso?: string) {
  if (!iso) return "Time unavailable";

  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function formatChatTime(iso?: string) {
  if (!iso) return "";

  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Local state for status/priority overrides and messages
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>("SUBMITTED");
  const [currentPriority, setCurrentPriority] = useState<TicketPriority>("LOW");
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [updatingStatus, setUpdatingStatus] = useState<TicketStatus | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<StaffTicketMessage[]>([]);

  // Meeting slot creation form state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>("VIRTUAL");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [meetingCreated, setMeetingCreated] = useState(false);
  const [meetingSlot] = useState<MeetingSlot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      setIsLoading(true);
      setPageError(null);

      try {
        const data = await getStaffTicket(id);
        if (!isMounted) return;
        setTicket(data);
        setCurrentStatus(data.status);
        setCurrentPriority(data.priority);
      } catch (error) {
        if (isMounted) {
          setPageError(
            extractApiError(error, "Failed to load ticket details."),
          );
        }
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
      [...(ticket?.messages ?? [])].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [ticket?.messages],
  );

  const allMessages = [...serverMessages, ...localMessages];

  async function handleSend() {
    const text = replyText.trim();
    if (!text || isSendingMessage) return;

    setIsSendingMessage(true);
    setMessageError(null);

    try {
      const message = await createStaffTicketMessage(ticket.id, text);
      setLocalMessages((prev) => [...prev, message]);
      setReplyText("");

      if (currentStatus === "SUBMITTED") {
        setCurrentStatus("IN_PROGRESS");
        setTicket((currentTicket) =>
          currentTicket
            ? {
                ...currentTicket,
                status: "IN_PROGRESS",
              }
            : currentTicket,
        );
      }
    } catch (error) {
      setMessageError(extractApiError(error, "Failed to send message."));
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (nextStatus === currentStatus || updatingStatus) return;

    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);
    setStatusUpdateError(null);
    setUpdatingStatus(nextStatus);

    try {
      const updatedTicket = await updateStaffTicketStatus(
        ticket.id,
        nextStatus,
      );
      setTicket(updatedTicket);
      setCurrentStatus(updatedTicket.status);
      setCurrentPriority(updatedTicket.priority);
    } catch (error) {
      setCurrentStatus(previousStatus);
      setStatusUpdateError(
        extractApiError(error, "Failed to update ticket status."),
      );
    } finally {
      setUpdatingStatus(null);
    }
  }

  function handleCreateMeeting() {
    if (!meetingStart || !meetingEnd) return;
    setMeetingCreated(true);
    setShowMeetingForm(false);
  }

  if (isLoading) {
    return (
      <RoleDashboardShell
        roleName="Staff"
        title="Loading Ticket"
        description=""
        navItems={navItems}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
          <p className="mt-4 text-sm text-slate-500">
            Loading ticket details...
          </p>
        </div>
      </RoleDashboardShell>
    );
  }

  if (!ticket || pageError) {
    return (
      <RoleDashboardShell
        roleName="Staff"
        title="Ticket Unavailable"
        description=""
        navItems={navItems}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Ticket details unavailable
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {pageError ?? "The selected ticket could not be found."}
          </p>
          <Link
            href="/staff/tickets"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#1E3A8A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to queue
          </Link>
        </div>
      </RoleDashboardShell>
    );
  }

  const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

  return (
    <RoleDashboardShell
      roleName="Staff"
      title={ticket.public_ticket_id}
      description={ticket.title}
      navItems={navItems}
    >
      <div className="space-y-5">
        {/* Back */}
        <Link
          href="/staff/tickets"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Left: Ticket info ────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  {ticket.public_ticket_id}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[currentStatus]}`}
                >
                  {statusLabel[currentStatus]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadgeClass[currentPriority]}`}
                >
                  {currentPriority}
                </span>
                {ticket.attachment && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    <Paperclip className="h-3 w-3" />
                    Has attachment
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-lg font-semibold text-slate-900">
                {ticket.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {ticket.category_name}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Submitted {formatDate(ticket.created_at)}
                </span>
                {ticket.submitted_by_email ? (
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
              <p className="leading-7 text-sm text-slate-700">
                {ticket.description}
              </p>
            </div>

            {/* Chat thread */}
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
                    No messages yet. Use the box below to send the first
                    response.
                  </div>
                ) : (
                  allMessages.map((msg) => {
                    const isStaff = msg.is_staff_message;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 py-2 ${isStaff ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isStaff
                              ? "bg-[#1E3A8A] text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isStaff ? "You" : "Stu"}
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

              {/* Reply box */}
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-end gap-3">
                  <textarea
                    id="staff-reply-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={3}
                    placeholder="Type a response to the student… (Enter to send)"
                    disabled={isSendingMessage || currentStatus === "RESOLVED"}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={
                      !replyText.trim() ||
                      isSendingMessage ||
                      currentStatus === "RESOLVED"
                    }
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
                {currentStatus === "RESOLVED" && (
                  <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    This ticket is resolved. Reopen it before sending another
                    message.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Action panel ─────────────────────────── */}
          <div className="space-y-4">
            {/* Status control */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Update Status
              </h2>
              <div className="flex flex-col gap-2">
                {statusFlow.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={!!updatingStatus || currentStatus === s}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      currentStatus === s
                        ? s === "RESOLVED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : s === "IN_PROGRESS"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-slate-100 text-slate-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 disabled:cursor-wait disabled:opacity-60"
                    }`}
                  >
                    {s === "SUBMITTED" && (
                      <CheckCircle2 className="mr-2 inline h-3.5 w-3.5" />
                    )}
                    {s === "IN_PROGRESS" && (
                      <Clock className="mr-2 inline h-3.5 w-3.5" />
                    )}
                    {s === "RESOLVED" && (
                      <CheckCircle2 className="mr-2 inline h-3.5 w-3.5" />
                    )}
                    {updatingStatus === s ? "Updating..." : statusLabel[s]}
                  </button>
                ))}
              </div>
              {statusUpdateError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {statusUpdateError}
                </p>
              )}
            </div>

            {/* Priority control */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Priority
              </h2>
              <select
                id="priority-select"
                value={currentPriority}
                onChange={(e) =>
                  setCurrentPriority(e.target.value as TicketPriority)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1E3A8A]"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Category:{" "}
                <span className="font-medium text-slate-700">
                  {ticket.category_name}
                </span>
              </p>
            </div>

            {/* Meeting slot */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Meeting Slot
                </h2>
                {!meetingSlot && !meetingCreated && (
                  <button
                    type="button"
                    onClick={() => setShowMeetingForm((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </button>
                )}
              </div>

              {/* Existing slot */}
              {(meetingSlot || meetingCreated) && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  {meetingSlot ? (
                    <>
                      <div className="flex items-center gap-2">
                        {meetingTypeIcon[meetingSlot.meeting_type]}
                        <span>
                          {meetingTypeLabel[meetingSlot.meeting_type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {formatDate(meetingSlot.start_time)},{" "}
                          {formatTime(meetingSlot.start_time)} &ndash;{" "}
                          {formatTime(meetingSlot.end_time)}
                        </span>
                      </div>
                      {meetingSlot.location_or_details && (
                        <p className="text-slate-500">
                          {meetingSlot.location_or_details}
                        </p>
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
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Meeting slot created successfully.
                    </div>
                  )}
                </div>
              )}

              {/* Create form */}
              {showMeetingForm && !meetingSlot && !meetingCreated && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label
                      htmlFor="meeting-type"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Type
                    </label>
                    <select
                      id="meeting-type"
                      value={meetingType}
                      onChange={(e) =>
                        setMeetingType(e.target.value as MeetingType)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                    >
                      <option value="VIRTUAL">Virtual</option>
                      <option value="IN_PERSON">In-Person</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="meeting-start"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Start time
                    </label>
                    <input
                      id="meeting-start"
                      type="datetime-local"
                      value={meetingStart}
                      onChange={(e) => setMeetingStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="meeting-end"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      End time
                    </label>
                    <input
                      id="meeting-end"
                      type="datetime-local"
                      value={meetingEnd}
                      onChange={(e) => setMeetingEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  {(meetingType === "VIRTUAL" || meetingType === "HYBRID") && (
                    <div>
                      <label
                        htmlFor="meeting-link"
                        className="mb-1 block text-xs font-medium text-slate-700"
                      >
                        Meeting link
                      </label>
                      <input
                        id="meeting-link"
                        type="url"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                  )}

                  {(meetingType === "IN_PERSON" ||
                    meetingType === "HYBRID") && (
                    <div>
                      <label
                        htmlFor="meeting-location"
                        className="mb-1 block text-xs font-medium text-slate-700"
                      >
                        Location / details
                      </label>
                      <input
                        id="meeting-location"
                        type="text"
                        value={meetingLocation}
                        onChange={(e) => setMeetingLocation(e.target.value)}
                        placeholder="OSS Office, Room 105"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateMeeting}
                    disabled={!meetingStart || !meetingEnd}
                    className="w-full rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900 disabled:opacity-40"
                  >
                    Create Slot
                  </button>
                </div>
              )}

              {!meetingSlot && !meetingCreated && !showMeetingForm && (
                <p className="mt-2 text-xs text-slate-400">
                  No meeting slot created yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
