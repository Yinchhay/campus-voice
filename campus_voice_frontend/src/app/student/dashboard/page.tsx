"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  ListFilter,
  LogOut,
  Paperclip,
  Plus,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { mockCategories, mockTickets } from "@/lib/mock-data";
import type { TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Lookups & constants
// ---------------------------------------------------------------------------
const STUDENT_ID = "u-001"; // The currently logged-in student (mocked)

const statusFlow: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

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
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const filterTabs: Array<{ key: TicketStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatusStepper({ status }: { status: TicketStatus }) {
  const currentStep = statusFlow.indexOf(status);
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2 text-xs">
      {statusFlow.map((step, index) => {
        const isDone = index <= currentStep;
        return (
          <li
            key={step}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 transition ${isDone
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-400"
              }`}
          >
            {isDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0" />
            )}
            {statusLabel[step]}
          </li>
        );
      })}
    </ol>
  );
}

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentDashboardPage() {
  const [activeFilter, setActiveFilter] = useState<TicketStatus | "ALL">("ALL");

  const myTickets = useMemo(
    () => mockTickets.filter((t) => t.submitted_by === STUDENT_ID),
    [],
  );

  const filteredTickets = useMemo(() => {
    if (activeFilter === "ALL") return myTickets;
    return myTickets.filter((t) => t.status === activeFilter);
  }, [activeFilter, myTickets]);

  const stats = useMemo(() => {
    const total = myTickets.length;
    const open = myTickets.filter((t) => t.status !== "RESOLVED").length;
    const inProgress = myTickets.filter((t) => t.status === "IN_PROGRESS").length;
    const highPriority = myTickets.filter((t) => t.priority === "HIGH").length;
    return { total, open, inProgress, highPriority };
  }, [myTickets]);

  const categoryName = (categoryId: number) =>
    mockCategories.find((c) => c.id === categoryId)?.name ?? "Unknown";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
            <ListFilter className="h-4 w-4" />
            Filter
          </div>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${isActive
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Ticket list ─────────────────────────────────────── */}
        <div className="space-y-4">
          {filteredTickets.length ? (
            filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4">
                  {/* Top row: badges */}
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
                      {priorityLabel[ticket.priority]} Priority
                    </span>
                    {ticket.has_media && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                        <Paperclip className="h-3 w-3" />
                        Attachment
                      </span>
                    )}
                  </div>

                  {/* Title + category + date */}
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{ticket.title}</h2>
                      <span className="text-xs text-slate-500">
                        {categoryName(ticket.category_id)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">
                      {ticket.description}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                      <FileText className="h-3.5 w-3.5" />
	                      Submitted &quot;add date&quot;
                    </p>
                  </div>

                  {/* Status stepper */}
                  <StatusStepper status={ticket.status} />

                  {/* Footer */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                      {ticket.status === "RESOLVED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <TriangleAlert className="h-4 w-4 text-amber-600" />
                      )}
                      {ticket.status === "RESOLVED"
                        ? "Case closed and recorded."
                        : "Your report is being handled by OSS."}
                    </p>
                    <Link
                      href={`/student/reports/${ticket.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:text-blue-700"
                    >
                      View details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No reports in this stage</h3>
              <p className="mt-2 text-sm text-slate-600">
                Switch filters or submit a new report to start tracking its progress.
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
        </div>
      </section>
    </main>
  );
}
