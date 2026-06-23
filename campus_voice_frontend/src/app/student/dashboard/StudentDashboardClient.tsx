"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  LogOut,
  Paperclip,
  Plus,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import type { StudentTicket } from "@/lib/student-api";
import type { TicketStatus } from "@/lib/types";

type ColumnConfig = {
  status: TicketStatus;
  label: string;
  icon: React.ReactNode;
  headerBg: string;
  headerBorder: string;
  accentText: string;
  dotColor: string;
};

const columns: ColumnConfig[] = [
  {
    status: "SUBMITTED",
    label: "Submitted",
    icon: <Clock className="h-4 w-4" />,
    headerBg: "bg-slate-50",
    headerBorder: "border-slate-200",
    accentText: "text-slate-600",
    dotColor: "bg-slate-400",
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    icon: <TriangleAlert className="h-4 w-4" />,
    headerBg: "bg-blue-50",
    headerBorder: "border-blue-200",
    accentText: "text-blue-700",
    dotColor: "bg-blue-500",
  },
  {
    status: "RESOLVED",
    label: "Resolved",
    icon: <CheckCircle2 className="h-4 w-4" />,
    headerBg: "bg-emerald-50",
    headerBorder: "border-emerald-200",
    accentText: "text-emerald-700",
    dotColor: "bg-emerald-500",
  },
];

const INITIAL_VISIBLE_TICKETS = 5;
const LOAD_MORE_STEP = 5;

function IdentityBadge({ isAnonymous }: { isAnonymous: boolean }) {
  if (isAnonymous) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <ShieldCheck className="h-3 w-3" />
        Anonymous
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      <UserCheck className="h-3 w-3" />
      Visible to staff
    </span>
  );
}

function TicketCard({ ticket }: { ticket: StudentTicket }) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
          {ticket.category_name}
        </span>
        <IdentityBadge isAnonymous={ticket.is_anonymous} />
        {ticket.has_media && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
            <Paperclip className="h-3 w-3" />
            Attachment
          </span>
        )}
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-[#1E3A8A]">
        {ticket.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {ticket.description}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <FileText className="h-3 w-3" />
          Submitted
        </span>
        <Link
          href={`/student/reports/${ticket.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:text-blue-700"
        >
          View details
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

export function StudentDashboardClient({
  initialTickets,
  initialError,
}: {
  initialTickets: StudentTicket[];
  initialError?: string | null;
}) {
  const [visibleCounts, setVisibleCounts] = useState<Record<TicketStatus, number>>({
    SUBMITTED: INITIAL_VISIBLE_TICKETS,
    IN_PROGRESS: INITIAL_VISIBLE_TICKETS,
    RESOLVED: INITIAL_VISIBLE_TICKETS,
  });

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, StudentTicket[]> = {
      SUBMITTED: [],
      IN_PROGRESS: [],
      RESOLVED: [],
    };

    for (const ticket of initialTickets) {
      grouped[ticket.status].push(ticket);
    }

    return grouped;
  }, [initialTickets]);

  function showMore(status: TicketStatus) {
    setVisibleCounts((current) => ({
      ...current,
      [status]: current[status] + LOAD_MORE_STEP,
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Verified report tracking
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                My Reports Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Track the progress of your submitted reports and confirm which
                ones were sent anonymously or with your student identity visible
                to staff.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/student/bookings"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
              >
                <CalendarClock className="h-4 w-4" />
                My Bookings
              </Link>
              <Link
                href="/student/submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
              >
                <Plus className="h-4 w-4" />
                New Report
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {initialError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {initialError}
          </div>
        )}

        {!initialError && initialTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No reports yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Submit a new report to start tracking its progress.
            </p>
            <Link
              href="/student/submit"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
            >
              <Plus className="h-4 w-4" />
              Submit your first report
            </Link>
          </div>
        )}

        {!initialError && initialTickets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {columns.map((col) => {
              const tickets = ticketsByStatus[col.status];
              const visibleCount = visibleCounts[col.status];
              const visibleTickets = tickets.slice(0, visibleCount);
              const remaining = Math.max(0, tickets.length - visibleTickets.length);

              return (
                <div key={col.status} className="flex flex-col gap-3">
                  <div
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${col.headerBg} ${col.headerBorder}`}
                  >
                    <div
                      className={`flex items-center gap-2 text-sm font-semibold ${col.accentText}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${col.dotColor}`}
                      />
                      {col.icon}
                      {col.label}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold ${col.headerBg} ${col.headerBorder} ${col.accentText}`}
                    >
                      {tickets.length}
                    </span>
                  </div>

                  {tickets.length > 0 ? (
                    <>
                      {visibleTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))}
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => showMore(col.status)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Load more
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            {remaining} remaining
                          </span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
                      <p className="text-xs text-slate-400">
                        No tickets in this stage
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
