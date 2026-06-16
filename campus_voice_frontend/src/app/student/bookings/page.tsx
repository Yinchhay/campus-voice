"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Trash2,
  TriangleAlert,
  Video,
} from "lucide-react";
import {
  cancelStudentTicketMeetingBooking,
  listStudentMeetingBookings,
} from "@/lib/student-api";
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
  if (booking.meeting_completed) return "Completed";
  if (booking.is_confirmed) return "Booked";
  return "Available";
}

function statusClass(status: string) {
  if (status === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Booked") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function ticketLabel(booking: StudentMeetingBooking) {
  return booking.public_ticket_id || booking.ticket;
}

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<StudentMeetingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function loadBookings() {
    setIsLoading(true);
    setPageError(null);

    try {
      const data = await listStudentMeetingBookings();
      setBookings(data);
    } catch {
      setPageError("Failed to load your meeting bookings.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings
        .filter((booking) => !booking.cancelled_at)
        .sort(
          (a, b) =>
            new Date(a.scheduled_time).getTime() -
            new Date(b.scheduled_time).getTime(),
        ),
    [bookings],
  );

  async function handleCancel(booking: StudentMeetingBooking) {
    if (cancellingId) return;
    setCancellingId(booking.id);
    setPageError(null);

    try {
      await cancelStudentTicketMeetingBooking(booking.ticket, booking.id);
      setBookings((current) =>
        current.filter((item) => item.id !== booking.id),
      );
    } catch {
      setPageError("Failed to cancel this booking.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/student/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  My Meeting Bookings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {activeBookings.length} active booking
                  {activeBookings.length === 1 ? "" : "s"}
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
          ) : activeBookings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                No active bookings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Booked meeting slots from your reports will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {activeBookings.map((booking) => {
                  const details = booking.meeting_details;
                  const status = bookingStatus(booking);
                  const meetingLink = details?.meeting_link;
                  const calendarSynced = Boolean(meetingLink);

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
                          {calendarSynced && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Calendar synced
                            </span>
                          )}
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
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Join meeting
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 lg:items-end">
                        <Link
                          href={`/student/reports/${booking.ticket}`}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          View report
                        </Link>
                        {!booking.meeting_completed && (
                          <button
                            type="button"
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {cancellingId === booking.id
                              ? "Cancelling..."
                              : "Cancel booking"}
                          </button>
                        )}
                        {booking.meeting_completed && (
                          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
