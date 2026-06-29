"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  TriangleAlert,
  UserRound,
  Video,
} from "lucide-react";
import { RoleDashboardShell, type DashboardNavItem } from "@/components/layout/RoleDashboardShell";
import {
  listAdminBookings,
  markAdminMeetingComplete,
} from "@/lib/staff-api";
import type { StudentMeetingBooking } from "@/lib/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function meetingTypeLabel(booking: StudentMeetingBooking) {
  return booking.meeting_details?.meeting_type ?? "Meeting";
}

function isOnlineMeeting(booking: StudentMeetingBooking) {
  return meetingTypeLabel(booking).toLowerCase().includes("online");
}

function bookingStatus(booking: StudentMeetingBooking) {
  if (booking.cancelled_at) return "Cancelled";
  if (booking.meeting_completed) return "Completed";
  if (isMeetingInProgress(booking)) return "In Progress";
  if (booking.is_confirmed) return "Confirmed";
  return "Pending";
}

function statusClass(status: string) {
  if (status === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In Progress") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Confirmed") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function ticketLabel(booking: StudentMeetingBooking) {
  return booking.public_ticket_id || booking.ticket;
}

function meetingCreatorName(booking: StudentMeetingBooking) {
  const name = booking.meeting_details?.staff_name?.trim();
  return name || "Unknown staff";
}

function isMeetingInProgress(booking: StudentMeetingBooking) {
  const start = Date.parse(
    booking.meeting_details?.start_time ?? booking.scheduled_time,
  );
  const end = Date.parse(
    booking.meeting_details?.end_time ?? booking.scheduled_time,
  );

  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;

  const now = Date.now();
  return now >= start && now <= end;
}

function canMarkComplete(booking: StudentMeetingBooking) {
  return (
    !booking.meeting_completed &&
    !booking.cancelled_at &&
    (booking.is_confirmed || isMeetingInProgress(booking))
  );
}

export function BookingsPage({
  roleName,
  navItems,
  ticketBasePath,
}: {
  roleName: "Admin" | "Staff";
  navItems: DashboardNavItem[];
  ticketBasePath: "/admin/tickets" | "/staff/tickets";
}) {
  const [bookings, setBookings] = useState<StudentMeetingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  async function loadBookings() {
    setIsLoading(true);
    setPageError(null);

    try {
      const data = await listAdminBookings();
      setBookings(data);
    } catch {
      setPageError("Failed to load meeting bookings.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(a.scheduled_time).getTime() -
          new Date(b.scheduled_time).getTime(),
      ),
    [bookings],
  );

  async function handleComplete(booking: StudentMeetingBooking) {
    if (completingId) return;
    setCompletingId(booking.id);
    setPageError(null);

    try {
      const updated = await markAdminMeetingComplete(
        booking.ticket,
        booking.id,
      );
      setBookings((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setPageError("Failed to mark meeting as completed.");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <RoleDashboardShell
      roleName={roleName}
      title="Meeting Bookings"
      description="Track confirmed student meetings and mark completed sessions."
      navItems={navItems}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Bookings
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {sortedBookings.length} meeting booking
                {sortedBookings.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={loadBookings}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {pageError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="h-4 w-4" />
            {pageError}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
            <p className="mt-4 text-sm text-slate-500">
              Loading meeting bookings...
            </p>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              No bookings yet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Confirmed student meetings will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {sortedBookings.map((booking) => {
                const status = bookingStatus(booking);
                const details = booking.meeting_details;
                const meetingLink = details?.meeting_link;

                return (
                  <div
                    key={booking.id}
                    className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                          {ticketLabel(booking)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium">
                            {formatDateTime(booking.scheduled_time)}
                          </p>
                          {details && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDateTime(details.start_time)} -{" "}
                              {formatDateTime(details.end_time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        {isOnlineMeeting(booking) ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-slate-400" />
                        )}
                        <span>{meetingTypeLabel(booking)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        <span>
                          Created by{" "}
                          <span className="font-medium text-slate-700">
                            {meetingCreatorName(booking)}
                          </span>
                        </span>
                      </div>
                      {details?.location_or_details && (
                        <p className="text-xs text-slate-500">
                          {details.location_or_details}
                        </p>
                      )}
                      {meetingLink && (
                        <a
                          href={meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <Video className="h-4 w-4 shrink-0" />
                          <span className="truncate">Join meeting</span>
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <Link
                        href={`${ticketBasePath}/${booking.ticket}`}
                        className="inline-flex h-9 w-36 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        View ticket
                      </Link>
                      {canMarkComplete(booking) && (
                        <button
                          type="button"
                          onClick={() => handleComplete(booking)}
                          disabled={completingId === booking.id}
                          className="inline-flex h-9 w-36 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {completingId === booking.id
                            ? "Completing..."
                            : "Mark complete"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RoleDashboardShell>
  );
}
