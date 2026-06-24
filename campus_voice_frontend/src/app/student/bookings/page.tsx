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
  X,
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
  if (booking.cancelled_at) return "Cancelled";
  if (booking.meeting_completed) return "Completed";
  if (booking.is_confirmed) return "Booked";
  return "Available";
}

function statusClass(status: string) {
  if (status === "Completed")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Booked") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
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
  const [bookingToCancel, setBookingToCancel] =
    useState<StudentMeetingBooking | null>(null);

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

  const cancelledBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.cancelled_at)
        .sort(
          (a, b) =>
            new Date(b.cancelled_at ?? 0).getTime() -
            new Date(a.cancelled_at ?? 0).getTime(),
        ),
    [bookings],
  );

  async function handleCancel(booking: StudentMeetingBooking) {
    if (cancellingId) return;
    setCancellingId(booking.id);
    setPageError(null);

    try {
      const result = await cancelStudentTicketMeetingBooking(
        booking.ticket,
        booking.id,
      );
      setBookings((current) =>
        current.map((item) =>
          item.id === result.booking.id ? result.booking : item,
        ),
      );
      setBookingToCancel(null);
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900">
                  My Bookings
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    {activeBookings.length} active
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                    {cancelledBookings.length} cancelled
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadBookings}
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
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
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
              <p className="mt-4 text-sm text-slate-500">
                Loading meeting bookings...
              </p>
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Active
                  </h2>
                  <span className="text-xs text-slate-400">
                    {activeBookings.length} booking
                    {activeBookings.length === 1 ? "" : "s"}
                  </span>
                </div>

                {activeBookings.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-base font-semibold text-slate-900">
                      No active bookings
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Booked meeting slots from your reports will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {activeBookings.map((booking) => {
                        const details = booking.meeting_details;
                        const status = bookingStatus(booking);
                        const meetingLink = details?.meeting_link;
                        const calendarSynced = Boolean(meetingLink);

                        return (
                          <div
                            key={booking.id}
                            className="grid gap-5 p-5 md:grid-cols-[minmax(0,1.35fr)_minmax(13rem,0.9fr)_9.5rem] md:items-center"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
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

                              <div className="mt-3 grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 text-sm text-slate-700">
                                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0">
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

                            <div className="min-w-0 space-y-2 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                {isOnlineMeeting(booking) ? (
                                  <Video className="h-4 w-4 shrink-0 text-blue-500" />
                                ) : (
                                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                )}
                                <span className="truncate">
                                  {meetingTypeLabel(booking)}
                                </span>
                              </div>
                              {details?.location_or_details && (
                                <p className="truncate text-xs text-slate-500">
                                  {details.location_or_details}
                                </p>
                              )}
                              {meetingLink && (
                                <a
                                  href={meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                                >
                                  <Video className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">Join meeting</span>
                                </a>
                              )}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                              <Link
                                href={`/student/reports/${booking.ticket}`}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                              >
                                View report
                              </Link>
                              {!booking.meeting_completed ? (
                                <button
                                  type="button"
                                  onClick={() => setBookingToCancel(booking)}
                                  disabled={cancellingId === booking.id}
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {cancellingId === booking.id
                                    ? "Cancelling..."
                                    : "Cancel"}
                                </button>
                              ) : (
                                <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
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
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Cancellation History
                  </h2>
                  <span className="text-xs text-slate-400">
                    {cancelledBookings.length} record
                    {cancelledBookings.length === 1 ? "" : "s"}
                  </span>
                </div>

                {cancelledBookings.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {cancelledBookings.map((booking) => {
                        const details = booking.meeting_details;

                        return (
                          <div
                            key={booking.id}
                            className="grid gap-4 p-5 opacity-90 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.75fr)_9.5rem] md:items-center"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  {ticketLabel(booking)}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass("Cancelled")}`}
                                >
                                  Cancelled
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-medium text-slate-700">
                                {formatDateTime(booking.scheduled_time)}
                              </p>
                              {booking.cancelled_at && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Cancelled{" "}
                                  {formatDateTime(booking.cancelled_at)}
                                </p>
                              )}
                            </div>

                            <div className="min-w-0 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                {isOnlineMeeting(booking) ? (
                                  <Video className="h-4 w-4 shrink-0 text-slate-400" />
                                ) : (
                                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                )}
                                <span className="truncate">
                                  {meetingTypeLabel(booking)}
                                </span>
                              </div>
                              {details?.location_or_details && (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {details.location_or_details}
                                </p>
                              )}
                            </div>

                            <Link
                              href={`/student/reports/${booking.ticket}`}
                              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                              View report
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-5 py-6 text-sm text-slate-500">
                    No cancelled bookings.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="cancel-booking-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Cancel meeting booking?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will release the meeting slot and move the booking to
                  your cancellation history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close cancel confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
              <p className="font-medium">{ticketLabel(bookingToCancel)}</p>
              <p className="mt-1 text-slate-500">
                {formatDateTime(bookingToCancel.scheduled_time)}
              </p>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={() => handleCancel(bookingToCancel)}
                disabled={cancellingId === bookingToCancel.id}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {cancellingId === bookingToCancel.id
                  ? "Cancelling..."
                  : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
