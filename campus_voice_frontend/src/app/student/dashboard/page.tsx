"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  LogOut,
  Paperclip,
  Plus,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { listMyTickets, type StudentTicket } from "@/lib/student-api";
import type { TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Lookups & constants
// ---------------------------------------------------------------------------
const priorityBadgeClass: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityLabel: Record<TicketPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// ---------------------------------------------------------------------------
// Column config — one entry per status
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function TicketCard({
  ticket,
}: {
  ticket: StudentTicket;
}) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {/* ID row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
          {ticket.public_ticket_id}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass[ticket.priority]}`}
        >
          {priorityLabel[ticket.priority]} Priority
        </span>
        {ticket.has_media && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
            <Paperclip className="h-3 w-3" />
            Attachment
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-[#1E3A8A]">
        {ticket.title}
      </h3>

      {/* Category */}
      <p className="mt-0.5 text-xs text-slate-400">{ticket.category_name}</p>

      {/* Description */}
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {ticket.description}
      </p>

      {/* Footer */}
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
// Page
// ---------------------------------------------------------------------------
export default function StudentDashboardPage() {
  const [myTickets, setMyTickets] = useState<StudentTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTickets() {
      setIsLoading(true);
      setPageError(null);

      try {
        const tickets = await listMyTickets();
        if (isMounted) setMyTickets(tickets);
      } catch (error) {
        if (isMounted) setPageError(extractApiError(error, "Failed to load your reports."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = myTickets.length;
    const open = myTickets.filter((t) => t.status !== "RESOLVED").length;
    const inProgress = myTickets.filter((t) => t.status === "IN_PROGRESS").length;
    const highPriority = myTickets.filter((t) => t.priority === "HIGH").length;
    return { total, open, inProgress, highPriority };
  }, [myTickets]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Verified anonymous reporting
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                My Reports Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Track every report with a unique tracking ID. Your identity is authenticated to prevent
                spam — report content stays anonymous to staff.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
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

          {/* Stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Reports" value={stats.total} tone="text-slate-900" />
            <StatCard label="Open Cases" value={stats.open} tone="text-blue-700" />
            <StatCard label="In Progress" value={stats.inProgress} tone="text-amber-700" />
            <StatCard label="High Priority" value={stats.highPriority} tone="text-red-700" />
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]" />
            <p className="mt-4 text-sm text-slate-600">Loading your reports...</p>
          </div>
        )}

        {pageError && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!isLoading && !pageError && myTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No reports yet</h3>
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

        {/* ── Kanban board ─────────────────────────────────────── */}
        {!isLoading && !pageError && myTickets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {columns.map((col) => {
              const tickets = myTickets.filter((t) => t.status === col.status);
              return (
                <div key={col.status} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${col.headerBg} ${col.headerBorder}`}
                  >
                    <div className={`flex items-center gap-2 text-sm font-semibold ${col.accentText}`}>
                      <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                      {col.icon}
                      {col.label}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold ${col.headerBg} ${col.headerBorder} ${col.accentText}`}
                    >
                      {tickets.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
                      <p className="text-xs text-slate-400">No tickets in this stage</p>
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
