"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  FileText,
  ShieldCheck,
  TicketCheck,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  listAdminTickets,
  listAdminUsers,
  type AdminTicket,
  type AdminUser,
} from "@/lib/admin-api";
import { adminNav } from "@/lib/admin-nav";
import { DASHBOARD_MODULES } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";
import type { TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelative(iso?: string) {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type DashboardQuickLink = {
  href: string;
  icon: React.ReactNode;
  bg: string;
  label: string;
  sub: string;
};

function ticketCreatedTime(ticket: AdminTicket) {
  return ticket.created_at ? Date.parse(ticket.created_at) : 0;
}

function barWidth(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const { hasPermission, isLoading: isPermissionLoading } = useRbacPermissions();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError("");

      try {
        const [ticketRows, userRows] = await Promise.all([
          hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission)
            ? listAdminTickets()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.userManagement.requiredPermission)
            ? listAdminUsers()
            : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setTickets(ticketRows);
        setUsers(userRows);
      } catch {
        if (isMounted) setPageError("Failed to load dashboard data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [hasPermission, isPermissionLoading]);

  const canViewTickets = hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission);
  const canViewUsers = hasPermission(DASHBOARD_MODULES.userManagement.requiredPermission);

  const ticketSummary = useMemo(() => {
    const summary = {
      total: tickets.length,
      open: 0,
      submitted: 0,
      resolved: 0,
      inProgress: 0,
      highPriority: 0,
      recentTickets: [...tickets]
        .sort((a, b) => ticketCreatedTime(b) - ticketCreatedTime(a))
        .slice(0, 5),
    };

    for (const ticket of tickets) {
      const isOpen = ticket.status !== "RESOLVED";
      if (isOpen) summary.open += 1;
      if (ticket.status === "SUBMITTED") summary.submitted += 1;
      if (ticket.status === "RESOLVED") summary.resolved += 1;
      if (ticket.status === "IN_PROGRESS") summary.inProgress += 1;
      if (ticket.priority === "HIGH" && isOpen) summary.highPriority += 1;
    }

    return summary;
  }, [tickets]);

  const hasOverviewModules = canViewTickets || canViewUsers;

  const largestWorkloadValue = Math.max(
    ticketSummary.open,
    ticketSummary.inProgress,
    ticketSummary.highPriority,
    ticketSummary.resolved,
  );

  const workloadSignals = [
    {
      label: "Open cases",
      value: ticketSummary.open,
      detail: "Still waiting for a final resolution",
      bar: barWidth(ticketSummary.open, largestWorkloadValue),
      color: "bg-blue-600",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: "In progress",
      value: ticketSummary.inProgress,
      detail: "Already being handled by the team",
      bar: barWidth(ticketSummary.inProgress, largestWorkloadValue),
      color: "bg-amber-400",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "High priority",
      value: ticketSummary.highPriority,
      detail: "Open cases marked urgent",
      bar: barWidth(ticketSummary.highPriority, largestWorkloadValue),
      color: "bg-red-500",
      icon: <TriangleAlert className="h-4 w-4" />,
    },
  ];

  const pipelineSegments = [
    {
      label: "Submitted",
      value: ticketSummary.submitted,
      width: barWidth(ticketSummary.submitted, ticketSummary.total),
      className: "bg-slate-500",
    },
    {
      label: "In progress",
      value: ticketSummary.inProgress,
      width: barWidth(ticketSummary.inProgress, ticketSummary.total),
      className: "bg-amber-400",
    },
    {
      label: "Resolved",
      value: ticketSummary.resolved,
      width: barWidth(ticketSummary.resolved, ticketSummary.total),
      className: "bg-emerald-500",
    },
  ];

  const quickLinks: DashboardQuickLink[] = [];
  if (canViewTickets) {
    quickLinks.push({
      href: DASHBOARD_MODULES.ticketOverview.href.admin,
      icon: <TicketCheck className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-50 border-blue-100",
      label: DASHBOARD_MODULES.ticketOverview.label,
      sub: `${ticketSummary.open} open cases`,
    });
  }
  if (canViewUsers) {
    quickLinks.push({
      href: DASHBOARD_MODULES.userManagement.href.admin,
      icon: <UsersRound className="h-5 w-5 text-teal-600" />,
      bg: "bg-teal-50 border-teal-100",
      label: DASHBOARD_MODULES.userManagement.label,
      sub: `${users.length} staff/admin users`,
    });
  }

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Admin Dashboard"
      description="Platform-wide overview of report volume, staff coverage, and campus safety activity."
      navItems={adminNav}
    >
      <div className="space-y-6">
        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* ── Platform overview ────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
              </div>
              {canViewTickets && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {isLoading ? "Loading queue" : `${ticketSummary.open} open cases`}
                </span>
              )}
            </div>
          </div>

          {hasOverviewModules ? (
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_1.5fr]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {canViewTickets ? "Current queue" : "Platform coverage"}
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="text-5xl font-semibold tracking-tight text-slate-950">
                    {isLoading ? "..." : canViewTickets ? ticketSummary.open : users.length}
                  </p>
                  <p className="pb-2 text-sm text-slate-500">
                    {canViewTickets
                      ? `open case${ticketSummary.open === 1 ? "" : "s"}`
                      : `staff/admin user${users.length === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {canViewTickets && (
                  <div className="border-l-4 border-red-400 bg-red-50 px-4 py-3">
                    <p className="text-xs font-medium text-red-700">High priority</p>
                    <p className="mt-1 text-2xl font-semibold text-red-900">
                      {isLoading ? "..." : ticketSummary.highPriority}
                    </p>
                  </div>
                )}
                <div className="border-l-4 border-teal-400 bg-teal-50 px-4 py-3">
                  <p className="text-xs font-medium text-teal-700">Staff/Admin users</p>
                  <p className="mt-1 text-2xl font-semibold text-teal-900">
                    {isLoading ? "..." : canViewUsers ? users.length : "-"}
                  </p>
                </div>
              </div>

              {canViewTickets && (
                <Link
                  href={DASHBOARD_MODULES.ticketOverview.href.admin}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-blue-700"
                >
                  Review ticket queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="space-y-5">
              {canViewTickets ? (
              <>
              <div className="space-y-3">
                {workloadSignals.map((signal) => (
                  <div key={signal.label} className="grid gap-2 sm:grid-cols-[9rem_1fr_3rem] sm:items-center">
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
                  <Clock className="h-4 w-4 text-amber-500" />
                  Ticket pipeline
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {pipelineSegments.map((segment) => (
                    <div
                      key={segment.label}
                      className={segment.className}
                      style={{ width: `${isLoading ? 0 : segment.width}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {pipelineSegments.map((segment) => (
                    <div key={segment.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-500">{segment.label}</span>
                      <span className="font-semibold text-slate-900">
                        {isLoading ? "..." : segment.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              </>
              ) : (
                <div className="flex h-full min-h-40 items-center gap-4 border-l-4 border-teal-400 bg-teal-50 px-5 py-4">
                  <UsersRound className="h-8 w-8 shrink-0 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-teal-700">Access coverage</p>
                    <p className="mt-1 text-2xl font-semibold text-teal-950">
                      {isLoading ? "..." : users.length} staff/admin user
                      {users.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-teal-700">
                      Manage campus response coverage from user management.
                    </p>
                  </div>
                </div>
              )}

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

        {/* ── Recent tickets ────────────────────────────── */}
        {canViewTickets && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">Recent Tickets</h2>
              </div>
              <Link
                href="/admin/tickets"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:text-blue-700"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-2">
              {ticketSummary.recentTickets.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading tickets..." : "No tickets found."}
                </div>
              )}
              {ticketSummary.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {ticket.public_ticket_id}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass[ticket.status]}`}
                      >
                        {statusLabel[ticket.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-800">{ticket.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRelative(ticket.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick links ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 rounded-2xl border p-5 transition hover:shadow-sm ${item.bg}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-sm text-slate-600">{item.sub}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
