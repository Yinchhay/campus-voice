"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Send,
  TriangleAlert,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { RoleDashboardShell, type DashboardNavItem } from "@/components/layout/RoleDashboardShell";
import { TicketDeleteDialog } from "@/components/tickets/TicketDeleteDialog";
import { attachmentHref, attachmentName } from "@/lib/attachments";
import {
  createAdminTicketMeetingSlots,
  createStaffTicketResolution,
  createStaffTicketMessage,
  deleteAdminTicketMeetingSlot,
  deleteStaffTicket,
  getStaffTicket,
  listAdminTicketMeetingSlots,
  type StaffTicket,
  type StaffTicketMessage,
  updateStaffTicketStatus,
  updateAdminTicketMeetingSlot,
} from "@/lib/staff-api";
import { RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";
import type {
  CampusLocation,
  MeetingSlot,
  MeetingType,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

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
  HIGH: "bg-red-100 text-red-900 border-red-300",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const meetingTypeIcon: Record<MeetingType, React.ReactNode> = {
  ONLINE: <Video className="h-4 w-4" />,
  IN_PERSON: <MapPin className="h-4 w-4" />,
};

const meetingTypeLabel: Record<MeetingType, string> = {
  ONLINE: "Online",
  IN_PERSON: "In-Person",
};

const RESOLUTION_MAX_ATTACHMENTS = 3;
const RESOLUTION_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MESSAGE_ALLOWED_TYPES = RESOLUTION_ALLOWED_TYPES;

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

function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function groupMeetingSlotsByDate(slots: MeetingSlot[]) {
  return slots.reduce<Record<string, MeetingSlot[]>>((groups, slot) => {
    const key = formatDate(slot.start_time);
    groups[key] ??= [];
    groups[key].push(slot);
    return groups;
  }, {});
}

function meetingLocationText(slot: MeetingSlot) {
  if (slot.meeting_type === "ONLINE") {
    return slot.meeting_link ? "Google Meet ready" : "Online meeting";
  }

  return [
    slot.campus_location === "EAS" ? "EAS Campus" : "Main Campus",
    slot.room_number ? `Room ${slot.room_number}` : null,
    slot.location_or_details,
  ]
    .filter(Boolean)
    .join(", ");
}

type TicketDetailWorkspaceProps = {
  ticketId: string;
  roleName: string;
  navItems: DashboardNavItem[];
  ticketsHref: string;
  backLabel: string;
  unavailableBackLabel?: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function TicketDetailWorkspace({
  ticketId,
  roleName,
  navItems,
  ticketsHref,
  backLabel,
  unavailableBackLabel = backLabel,
}: TicketDetailWorkspaceProps) {
  const router = useRouter();
  const { hasPermission } = useRbacPermissions();

  const resolutionFileInputRef = useRef<HTMLInputElement | null>(null);
  const messageFileInputRef = useRef<HTMLInputElement | null>(null);

  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [ticketActionError, setTicketActionError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<TicketStatus | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Local state for status/priority overrides and messages
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>("SUBMITTED");
  const [currentPriority, setCurrentPriority] = useState<TicketPriority>("LOW");
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<StaffTicketMessage[]>([]);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionAttachments, setResolutionAttachments] = useState<File[]>(
    [],
  );
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Meeting slot creation form state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<number | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>("ONLINE");
  const [meetingCampus, setMeetingCampus] = useState<CampusLocation>("MAIN");
  const [meetingRoom, setMeetingRoom] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const canUpdateTicket = hasPermission(RBAC_PERMISSIONS.ticket.update);
  const canDeleteTicket = hasPermission(RBAC_PERMISSIONS.ticket.delete);

  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      setIsLoading(true);
      setPageError(null);
      setMeetingError(null);

      try {
        const data = await getStaffTicket(ticketId);
        if (!isMounted) return;
        setTicket(data);
        setCurrentStatus(data.status);
        setCurrentPriority(data.priority);

        setIsLoadingMeetings(true);
        try {
          const slots = await listAdminTicketMeetingSlots(data.id);
          if (isMounted) setMeetingSlots(slots);
        } catch (error) {
          if (isMounted) {
            setMeetingError(
              extractApiError(error, "Failed to load meeting slots."),
            );
          }
        } finally {
          if (isMounted) setIsLoadingMeetings(false);
        }
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
  }, [ticketId]);

  const serverMessages = useMemo(
    () =>
      [...(ticket?.messages ?? [])].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [ticket?.messages],
  );

  const allMessages = [...serverMessages, ...localMessages];

  const groupedMeetingSlots = useMemo(
    () => groupMeetingSlotsByDate(meetingSlots),
    [meetingSlots],
  );

  async function refreshMeetingSlots(ticketId = ticket?.id) {
    if (!ticketId) return;
    setIsLoadingMeetings(true);
    setMeetingError(null);

    try {
      const slots = await listAdminTicketMeetingSlots(ticketId);
      setMeetingSlots(slots);
    } catch (error) {
      setMeetingError(extractApiError(error, "Failed to load meeting slots."));
    } finally {
      setIsLoadingMeetings(false);
    }
  }

  async function handleSend() {
    const text = replyText.trim();
    if (!ticket || !text || isSendingMessage) return;

    setIsSendingMessage(true);
    setMessageError(null);

    try {
      const message = await createStaffTicketMessage(
        ticket.id,
        text,
        replyAttachment,
      );
      setLocalMessages((prev) => [...prev, message]);
      setReplyText("");
      setReplyAttachment(null);
      if (messageFileInputRef.current) messageFileInputRef.current.value = "";

      if (currentStatus === "SUBMITTED" && canUpdateTicket) {
        const updatedTicket = await updateStaffTicketStatus(ticket.id, "IN_PROGRESS");
        setTicket(updatedTicket);
        setCurrentStatus(updatedTicket.status);
        setCurrentPriority(updatedTicket.priority);
      }
    } catch (error) {
      setMessageError(extractApiError(error, "Failed to send message."));
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (!ticket || !canUpdateTicket || updatingStatus || nextStatus === currentStatus) return;

    setUpdatingStatus(nextStatus);
    setTicketActionError(null);

    try {
      const updatedTicket = await updateStaffTicketStatus(ticket.id, nextStatus);
      setTicket(updatedTicket);
      setCurrentStatus(updatedTicket.status);
      setCurrentPriority(updatedTicket.priority);
    } catch (error) {
      setTicketActionError(extractApiError(error, "Failed to update ticket status."));
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleDeleteTicket() {
    if (!ticket || !canDeleteTicket || isDeletingTicket) return;

    setIsDeletingTicket(true);
    setTicketActionError(null);

    try {
      await deleteStaffTicket(ticket.id);
      router.push(ticketsHref);
    } catch (error) {
      setTicketActionError(extractApiError(error, "Failed to delete ticket."));
      setIsDeletingTicket(false);
    }
  }

  function handleReplyFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setMessageError(null);
    if (!file) return;

    if (!MESSAGE_ALLOWED_TYPES.includes(file.type)) {
      setMessageError(`"${file.name}" is not a supported file type.`);
      return;
    }

    setReplyAttachment(file);
  }

  function handleResolveClick() {
    if (!ticket || currentStatus === "RESOLVED" || isResolving) return;
    setShowResolutionForm(true);
    setResolutionError(null);
  }

  function handleResolutionFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setResolutionError(null);

    const invalid = files.find(
      (file) => !RESOLUTION_ALLOWED_TYPES.includes(file.type),
    );
    if (invalid) {
      setResolutionError(`"${invalid.name}" is not a supported file type.`);
      return;
    }

    const combined = [...resolutionAttachments, ...files];
    if (combined.length > RESOLUTION_MAX_ATTACHMENTS) {
      setResolutionError(
        `You can attach a maximum of ${RESOLUTION_MAX_ATTACHMENTS} files.`,
      );
      return;
    }

    setResolutionAttachments(combined);
    if (resolutionFileInputRef.current) resolutionFileInputRef.current.value = "";
  }

  function removeResolutionAttachment(index: number) {
    setResolutionAttachments((current) =>
      current.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  }

  async function handleResolutionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || isResolving) return;

    const note = resolutionNote.trim();
    if (!note) {
      setResolutionError("Resolution note is required.");
      return;
    }

    setIsResolving(true);
    setResolutionError(null);

    try {
      await createStaffTicketResolution(
        ticket.id,
        note,
        resolutionAttachments,
      );
      const updatedTicket = await getStaffTicket(ticket.id);
      setTicket(updatedTicket);
      setCurrentStatus(updatedTicket.status);
      setCurrentPriority(updatedTicket.priority);
      setResolutionNote("");
      setResolutionAttachments([]);
      setShowResolutionForm(false);
    } catch (error) {
      setResolutionError(
        extractApiError(error, "Failed to resolve this ticket."),
      );
    } finally {
      setIsResolving(false);
    }
  }

  function resetMeetingForm() {
    setMeetingType("ONLINE");
    setMeetingCampus("MAIN");
    setMeetingRoom("");
    setMeetingLink("");
    setMeetingLocation("");
    setMeetingStart("");
    setMeetingEnd("");
    setEditingMeetingId(null);
  }

  function handleEditMeeting(slot: MeetingSlot) {
    setMeetingError(null);
    setEditingMeetingId(slot.id);
    setMeetingType(slot.meeting_type);
    setMeetingCampus(slot.campus_location);
    setMeetingRoom(slot.room_number ?? "");
    setMeetingLink(slot.meeting_link ?? "");
    setMeetingLocation(slot.location_or_details ?? "");
    setMeetingStart(toDateTimeLocalValue(slot.start_time));
    setMeetingEnd(toDateTimeLocalValue(slot.end_time));
    setShowMeetingForm(true);
  }

  async function handleDeleteMeeting(slot: MeetingSlot) {
    if (!ticket || slot.student_booking || deletingMeetingId) return;

    setDeletingMeetingId(slot.id);
    setMeetingError(null);

    try {
      await deleteAdminTicketMeetingSlot(ticket.id, slot.id);
      await refreshMeetingSlots(ticket.id);
    } catch (error) {
      setMeetingError(extractApiError(error, "Failed to delete meeting slot."));
    } finally {
      setDeletingMeetingId(null);
    }
  }

  async function handleSaveMeeting() {
    if (!ticket || !meetingStart || !meetingEnd || isSavingMeeting) return;

    setIsSavingMeeting(true);
    setMeetingError(null);

    const startIso = fromDateTimeLocalValue(meetingStart);
    const endIso = fromDateTimeLocalValue(meetingEnd);

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setMeetingError("End time must be after start time.");
      setIsSavingMeeting(false);
      return;
    }

    const payload = {
      start_time: startIso,
      end_time: endIso,
      meeting_type: meetingType,
      campus_location: meetingCampus,
      room_number: meetingType === "IN_PERSON" ? meetingRoom.trim() || null : null,
      location_or_details:
        meetingType === "IN_PERSON" ? meetingLocation.trim() || null : null,
      meeting_link: meetingType === "ONLINE" ? meetingLink.trim() || null : null,
    };

    try {
      if (editingMeetingId) {
        await updateAdminTicketMeetingSlot(ticket.id, editingMeetingId, payload);
      } else {
        await createAdminTicketMeetingSlots(ticket.id, payload);
      }
      await refreshMeetingSlots(ticket.id);
      resetMeetingForm();
      setShowMeetingForm(false);
    } catch (error) {
      setMeetingError(extractApiError(error, "Failed to save meeting slot."));
    } finally {
      setIsSavingMeeting(false);
    }
  }

  if (isLoading) {
    return (
      <RoleDashboardShell
        roleName={roleName}
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
        roleName={roleName}
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
            href={ticketsHref}
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#1E3A8A]"
          >
            <ArrowLeft className="h-4 w-4" />
            {unavailableBackLabel}
          </Link>
        </div>
      </RoleDashboardShell>
    );
  }

  const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

  return (
    <RoleDashboardShell
      roleName={roleName}
      title={ticket.public_ticket_id}
      description={ticket.title}
      navItems={navItems}
    >
      <div className="space-y-5">
        {/* Back */}
        <Link
          href={ticketsHref}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
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
                {ticket.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    <Paperclip className="h-3 w-3" />
                    {ticket.attachments.length} attachment
                    {ticket.attachments.length !== 1 ? "s" : ""}
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
              <p className="leading-7 text-sm text-slate-700">
                {ticket.description}
              </p>
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
                        <span className="truncate">
                          {attachmentName(attachment)}
                        </span>
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
                        <span className="truncate">
                          {attachmentName(attachment)}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              {/* Reply box */}
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
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
                      disabled={
                        isSendingMessage || currentStatus === "RESOLVED"
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        ref={messageFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleReplyFileChange}
                        disabled={
                          isSendingMessage || currentStatus === "RESOLVED"
                        }
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => messageFileInputRef.current?.click()}
                        disabled={
                          isSendingMessage || currentStatus === "RESOLVED"
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Attach
                      </button>
                      {replyAttachment && (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                          <span className="truncate">
                            {replyAttachment.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyAttachment(null);
                              if (messageFileInputRef.current) {
                                messageFileInputRef.current.value = "";
                              }
                            }}
                            className="text-slate-400 hover:text-red-600"
                            aria-label={`Remove ${replyAttachment.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
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
                    type="button"
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={!canUpdateTicket || updatingStatus !== null || s === currentStatus}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      currentStatus === s
                        ? s === "RESOLVED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : s === "IN_PROGRESS"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                        : "border-slate-200 bg-white text-slate-600"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
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
              {!canUpdateTicket && (
                <p className="mt-3 text-xs text-slate-400">
                  Your role does not include ticket update permission.
                </p>
              )}
              {currentStatus !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={handleResolveClick}
                  disabled={isResolving}
                  className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Resolve Ticket
                </button>
              )}
              {showResolutionForm && currentStatus !== "RESOLVED" && (
                <form
                  onSubmit={handleResolutionSubmit}
                  className="mt-4 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
                >
                  <div>
                    <label
                      htmlFor="resolution-note"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Resolution note
                    </label>
                    <textarea
                      id="resolution-note"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={4}
                      placeholder="Describe how this ticket was resolved."
                      disabled={isResolving}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="resolution-attachments"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Attachments
                    </label>
                    <input
                      ref={resolutionFileInputRef}
                      id="resolution-attachments"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleResolutionFileChange}
                      disabled={
                        isResolving ||
                        resolutionAttachments.length >=
                          RESOLUTION_MAX_ATTACHMENTS
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-slate-700 disabled:opacity-60"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Optional, up to {RESOLUTION_MAX_ATTACHMENTS} PDF, DOC,
                      DOCX, JPG, or PNG files.
                    </p>
                  </div>

                  {resolutionAttachments.length > 0 && (
                    <div className="space-y-1">
                      {resolutionAttachments.map((file, index) => (
                        <div
                          key={`${file.name}-${file.lastModified}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeResolutionAttachment(index)}
                            disabled={isResolving}
                            className="font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!resolutionNote.trim() || isResolving}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isResolving ? "Resolving..." : "Submit Resolution"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResolutionForm(false);
                        setResolutionError(null);
                      }}
                      disabled={isResolving}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {resolutionError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {resolutionError}
                </p>
              )}
              {ticketActionError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {ticketActionError}
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

            {canDeleteTicket && (
              <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-red-900">
                  Delete Ticket
                </h2>
                <p className="mb-3 text-xs leading-5 text-red-700">
                  This permanently removes the ticket and all related files.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTicketActionError(null);
                    setShowDeleteDialog(true);
                  }}
                  disabled={isDeletingTicket}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeletingTicket ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeletingTicket ? "Deleting..." : "Delete Ticket"}
                </button>
              </div>
            )}

            {/* Meeting slots */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Meeting Slots
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (showMeetingForm) {
                      resetMeetingForm();
                      setShowMeetingForm(false);
                    } else {
                      setShowMeetingForm(true);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:text-blue-700"
                >
                  {showMeetingForm ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {showMeetingForm ? "Cancel" : "Create"}
                </button>
              </div>

              {isLoadingMeetings && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Loading meeting slots...
                </div>
              )}

              {meetingError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {meetingError}
                </p>
              )}

              {Object.entries(groupedMeetingSlots).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(groupedMeetingSlots).map(([date, slots]) => (
                    <div key={date} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {date}
                      </p>
                      {slots.map((slot) => {
                        const isBooked = Boolean(slot.student_booking);
                        return (
                          <div
                            key={slot.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {meetingTypeIcon[slot.meeting_type]}
                                  <span className="font-medium text-slate-900">
                                    {meetingTypeLabel[slot.meeting_type]}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 ${
                                      isBooked
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-blue-200 bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    {isBooked ? "Booked" : "Available"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                                  <span>
                                    {formatTime(slot.start_time)} -{" "}
                                    {formatTime(slot.end_time)}
                                  </span>
                                </div>
                                <p className="text-slate-500">
                                  {meetingLocationText(slot)}
                                </p>
                                {slot.meeting_link && (
                                  <a
                                    href={slot.meeting_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex text-blue-600 hover:underline"
                                  >
                                    Meeting link
                                  </a>
                                )}
                                {slot.student_booking && (
                                  <p className="rounded-lg border border-emerald-100 bg-white px-2 py-1 text-emerald-700">
                                    Student confirmed this slot.
                                  </p>
                                )}
                              </div>
                              {!isBooked && (
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditMeeting(slot)}
                                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-700"
                                    aria-label="Edit meeting slot"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMeeting(slot)}
                                    disabled={deletingMeetingId === slot.id}
                                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:text-red-700 disabled:opacity-50"
                                    aria-label="Delete meeting slot"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingMeetings &&
                meetingSlots.length === 0 &&
                !showMeetingForm && (
                  <p className="mt-2 text-xs text-slate-400">
                    No meeting slots created yet.
                  </p>
                )}

              {showMeetingForm && (
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
                      <option value="ONLINE">Online</option>
                      <option value="IN_PERSON">In-Person</option>
                    </select>
                  </div>

                  {meetingType === "IN_PERSON" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="meeting-campus"
                          className="mb-1 block text-xs font-medium text-slate-700"
                        >
                          Campus
                        </label>
                        <select
                          id="meeting-campus"
                          value={meetingCampus}
                          onChange={(e) =>
                            setMeetingCampus(e.target.value as CampusLocation)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                        >
                          <option value="MAIN">Main Campus</option>
                          <option value="EAS">EAS Campus</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="meeting-room"
                          className="mb-1 block text-xs font-medium text-slate-700"
                        >
                          Room
                        </label>
                        <input
                          id="meeting-room"
                          type="text"
                          value={meetingRoom}
                          onChange={(e) => setMeetingRoom(e.target.value)}
                          placeholder="A301"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                        />
                      </div>
                    </div>
                  )}

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
                      min={meetingStart || undefined}
                      onChange={(e) => setMeetingEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  {meetingType === "ONLINE" && (
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

                  {meetingType === "IN_PERSON" && (
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
                    onClick={handleSaveMeeting}
                    disabled={!meetingStart || !meetingEnd || isSavingMeeting}
                    className="w-full rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900 disabled:opacity-40"
                  >
                    {isSavingMeeting
                      ? "Saving..."
                      : editingMeetingId
                        ? "Update Slot"
                        : "Create Slot"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showDeleteDialog && (
        <TicketDeleteDialog
          publicTicketId={ticket.public_ticket_id}
          title={ticket.title}
          isDeleting={isDeletingTicket}
          error={ticketActionError}
          onClose={() => {
            if (!isDeletingTicket) {
              setShowDeleteDialog(false);
              setTicketActionError(null);
            }
          }}
          onConfirm={handleDeleteTicket}
        />
      )}
    </RoleDashboardShell>
  );
}
