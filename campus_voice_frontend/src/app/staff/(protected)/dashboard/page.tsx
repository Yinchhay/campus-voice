"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { DashboardTicketStatusSelect } from "@/components/tickets/DashboardTicketStatusSelect";
import { DASHBOARD_MODULES, RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import {
  listStaffTickets,
  updateStaffTicketStatus,
  type StaffTicket,
} from "@/lib/staff-api";
import { staffNav } from "@/lib/dashboard-nav";
import { useRbacPermissions } from "@/lib/rbac";
import type { TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const priorityBadgeClass: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityIcon: Record<TicketPriority, React.ReactNode> = {
  HIGH: <TriangleAlert className="h-3.5 w-3.5" />,
  MEDIUM: <Clock className="h-3.5 w-3.5" />,
  LOW: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ---------------------------------------------------------------------------
// Helper
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

function ticketCreatedTime(ticket: StaffTicket) {
  return ticket.created_at ? Date.parse(ticket.created_at) : 0;
}

function isSameLocalDay(timestamp: string, reference: Date) {
  const date = new Date(timestamp);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function barWidth(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffDashboardPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isPermissionLoading } =
    useRbacPermissions();
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError(null);

      try {
        const ticketRows = hasPermission(
          DASHBOARD_MODULES.ticketOverview.requiredPermission,
        )
          ? await listStaffTickets()
          : [];
        if (!isMounted) return;
        setTickets(ticketRows);
      } catch (error) {
        if (isMounted) {
          setPageError(
            extractApiError(error, "Failed to load staff dashboard."),
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [hasPermission, isPermissionLoading]);

  const canViewTickets = hasPermission(
    DASHBOARD_MODULES.ticketOverview.requiredPermission,
  );
  const canUpdateTickets = hasPermission(RBAC_PERMISSIONS.ticket.update);

  async function handleRecentTicketStatusChange(
    ticketId: string,
    nextStatus: TicketStatus,
  ) {
    const currentTicket = tickets.find((ticket) => ticket.id === ticketId);
    if (
      !currentTicket ||
      !canUpdateTickets ||
      currentTicket.status === nextStatus ||
      updatingTicketId
    ) {
      return;
    }

    setUpdatingTicketId(ticketId);
    setStatusError(null);

    try {
      const updatedTicket = await updateStaffTicketStatus(ticketId, nextStatus);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket,
        ),
      );
    } catch (error) {
      setStatusError(extractApiError(error, "Failed to update ticket status."));
    } finally {
      setUpdatingTicketId(null);
    }
  }

  function openTicket(ticketId: string) {
    router.push(`/staff/tickets/${ticketId}`);
  }

  const ticketSummary = useMemo(() => {
    const today = new Date();
    const summary = {
      total: tickets.length,
      open: 0,
      inProgress: 0,
      highPriority: 0,
      submitted: 0,
      resolvedToday: 0,
      recentTickets: [...tickets]
        .sort((a, b) => ticketCreatedTime(b) - ticketCreatedTime(a))
        .slice(0, 5),
    };

    for (const ticket of tickets) {
      const isOpen = ticket.status !== "RESOLVED";
      if (isOpen) summary.open += 1;
      if (ticket.status === "IN_PROGRESS") summary.inProgress += 1;
      if (ticket.status === "SUBMITTED") summary.submitted += 1;
      if (ticket.priority === "HIGH" && isOpen) summary.highPriority += 1;
      if (ticket.resolved_at && isSameLocalDay(ticket.resolved_at, today)) {
        summary.resolvedToday += 1;
      }
    }

    return summary;
  }, [tickets]);

  const hasOverviewModules = canViewTickets;

  const largestFocusValue = Math.max(
    ticketSummary.submitted,
    ticketSummary.inProgress,
    ticketSummary.highPriority,
    ticketSummary.resolvedToday,
  );

  const focusSignals = [
    {
      label: "Needs review",
      value: ticketSummary.submitted,
      detail: "New submissions waiting for a first update",
      bar: barWidth(ticketSummary.submitted, largestFocusValue),
      color: "bg-slate-700",
      icon: <Inbox className="h-4 w-4" />,
    },
    {
      label: "Being handled",
      value: ticketSummary.inProgress,
      detail: "Cases already moved into progress",
      bar: barWidth(ticketSummary.inProgress, largestFocusValue),
      color: "bg-amber-400",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "High priority",
      value: ticketSummary.highPriority,
      detail: "Urgent open cases to review first",
      bar: barWidth(ticketSummary.highPriority, largestFocusValue),
      color: "bg-red-500",
      icon: <TriangleAlert className="h-4 w-4" />,
    },
  ];

  const focusTiles = [
    {
      label: "Submitted",
      value: ticketSummary.submitted,
      detail: "Cases submitted for review",
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
    {
      label: "High priority",
      value: ticketSummary.highPriority,
      detail: "Urgent open cases",
      className: "border-red-200 bg-red-50 text-red-900",
    },
  ];

  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Staff Dashboard"
      description="Review incoming reports, prioritise urgent cases, and move them through the resolution pipeline."
      navItems={staffNav}
    >
      <div className="space-y-6">
        {/* ── Overview ─────────────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Overview
                </h2>
              </div>
              {canViewTickets && (
                <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  {isLoading
                    ? "Loading queue"
                    : `${ticketSummary.highPriority} urgent case${
                        ticketSummary.highPriority === 1 ? "" : "s"
                      }`}
                </span>
              )}
            </div>
          </div>

          {hasOverviewModules ? (
            <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-[1fr_1.6fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Tickets focus
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      {isLoading ? "..." : ticketSummary.submitted}
                    </p>
                    <p className="pb-2 text-sm text-slate-500">
                      new submission{ticketSummary.submitted === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {focusTiles.map((tile) => (
                    <div
                      key={tile.label}
                      className={`border-l-4 px-4 py-3 ${tile.className}`}
                    >
                      <p className="text-xs font-medium">{tile.label}</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {isLoading ? "..." : tile.value}
                      </p>
                      <p className="mt-1 text-xs opacity-75">{tile.detail}</p>
                    </div>
                  ))}
                </div>

                {canViewTickets && (
                  <Link
                    href="/staff/tickets?filter=SUBMITTED"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-blue-700"
                  >
                    Start Review
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  {focusSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[9rem_1fr_3rem] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className="text-slate-400">{signal.icon}</span>
                        {signal.label}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${signal.color}`}
                          style={{ width: `${isLoading ? 0 : signal.bar}%` }}
                        />
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {isLoading ? "..." : signal.value}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 sm:col-start-2 sm:col-span-2">
                        {signal.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Ticket summary
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm sm:block sm:border-b-0 sm:pb-0">
                      <span className="text-slate-500">All assigned</span>
                      <p className="font-semibold text-slate-900">
                        {isLoading ? "..." : ticketSummary.total}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm sm:block sm:border-b-0 sm:pb-0">
                      <span className="text-slate-500">Submitted</span>
                      <p className="font-semibold text-blue-700">
                        {isLoading ? "..." : ticketSummary.open}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm sm:block">
                      <span className="text-slate-500">Cleared today</span>
                      <p className="font-semibold text-emerald-700">
                        {isLoading ? "..." : ticketSummary.resolvedToday}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="p-6 text-sm text-slate-500 sm:p-8">
                No dashboard modules are available for your current permissions.
              </div>
            )
          )}
        </section>

        {/* ── Recent tickets ────────────────────────────────── */}
        {canViewTickets && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Tickets
                </h2>
              </div>
              <Link
                href="/staff/tickets"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {pageError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {pageError}
              </div>
            )}
            {statusError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {statusError}
              </div>
            )}

            <div className="space-y-2">
              {isLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Loading recent tickets...
                </div>
              )}

              {!isLoading &&
                ticketSummary.recentTickets.length === 0 &&
                !pageError && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No tickets are available yet.
                  </div>
                )}

              {!isLoading &&
                ticketSummary.recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openTicket(ticket.id)}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        openTicket(ticket.id);
                      }
                    }}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                          {ticket.public_ticket_id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass[ticket.priority]}`}
                        >
                          {priorityIcon[ticket.priority]}
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
                        {ticket.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {ticket.category_name}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <DashboardTicketStatusSelect
                        value={ticket.status}
                        canUpdate={canUpdateTickets}
                        isUpdating={updatingTicketId === ticket.id}
                        onChange={(status) =>
                          handleRecentTicketStatusChange(ticket.id, status)
                        }
                      />
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ─────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {canViewTickets && (
            <Link
              href="/staff/tickets?filter=HIGH"
              className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 transition hover:border-red-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <TriangleAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-900">
                  High Priority Queue
                </p>
                <p className="mt-0.5 text-sm text-red-700">
                  {ticketSummary.highPriority} urgent case
                  {ticketSummary.highPriority !== 1 ? "s" : ""} need attention
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-red-400" />
            </Link>
          )}

          {canViewTickets && (
            <Link
              href="/staff/tickets?filter=SUBMITTED"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">New Submissions</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {ticketSummary.submitted} ticket
                  {ticketSummary.submitted !== 1 ? "s" : ""} awaiting review
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
            </Link>
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
