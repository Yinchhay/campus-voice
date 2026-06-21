"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { DashboardTicketStatusSelect } from "@/components/tickets/DashboardTicketStatusSelect";
import {
  getDashboardStats,
  listAdminTickets,
  listAdminUsers,
  updateAdminTicketStatus,
  type AdminTicket,
  type AdminUser,
  type DashboardStats,
} from "@/lib/admin-api";
import { adminNav } from "@/lib/dashboard-nav";
import { DASHBOARD_MODULES, RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";
import type { TicketStatus } from "@/lib/types";

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
  const router = useRouter();
  const { hasPermission, isLoading: isPermissionLoading } = useRbacPermissions();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError("");

      try {
        const canLoadTicketStats = hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission);
        const canLoadUsers = hasPermission(DASHBOARD_MODULES.userManagement.requiredPermission);
        const [stats, ticketRows, userRows] = await Promise.all([
          canLoadTicketStats
            ? getDashboardStats()
            : Promise.resolve(null),
          hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission)
            ? listAdminTickets({ sort_by: "created_at", sort_desc: true })
            : Promise.resolve([]),
          canLoadUsers && !canLoadTicketStats
            ? listAdminUsers({ sort_by: "created_at", sort_desc: true })
            : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setDashboardStats(stats);
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
      const updatedTicket = await updateAdminTicketStatus(ticketId, nextStatus);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket,
        ),
      );
    } catch {
      setStatusError("Failed to update ticket status.");
    } finally {
      setUpdatingTicketId(null);
    }
  }

  function openTicket(ticketId: string) {
    router.push(`/admin/tickets/${ticketId}`);
  }

  const ticketSummary = useMemo(() => {
    const summary = {
      total: tickets.length,
      open: dashboardStats?.current_queue.open_cases ?? 0,
      submitted: dashboardStats?.pipeline.submitted ?? 0,
      resolved: dashboardStats?.pipeline.resolved ?? 0,
      inProgress: dashboardStats?.pipeline.in_progress ?? 0,
      highPriority: dashboardStats?.current_queue.high_priority ?? 0,
      staffAdminUsers: dashboardStats?.current_queue.staff_admin_users ?? users.length,
      recentTickets: [...tickets]
        .sort((a, b) => ticketCreatedTime(b) - ticketCreatedTime(a))
        .slice(0, 5),
    };

    if (!dashboardStats) {
      for (const ticket of tickets) {
        const isOpen = ticket.status !== "RESOLVED";
        if (isOpen) summary.open += 1;
        if (ticket.status === "SUBMITTED") summary.submitted += 1;
        if (ticket.status === "RESOLVED") summary.resolved += 1;
        if (ticket.status === "IN_PROGRESS") summary.inProgress += 1;
        if (ticket.priority === "HIGH" && isOpen) summary.highPriority += 1;
      }
    }

    return summary;
  }, [dashboardStats, tickets, users.length]);

  const hasOverviewModules = canViewTickets || canViewUsers;

  const largestWorkloadValue = Math.max(
    ticketSummary.open,
    ticketSummary.inProgress,
    ticketSummary.highPriority,
    ticketSummary.resolved,
  );

  const workloadSignals = [
    {
      label: "Submitted",
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
      detail: "Submitted cases marked urgent",
      bar: barWidth(ticketSummary.highPriority, largestWorkloadValue),
      color: "bg-red-500",
      icon: <TriangleAlert className="h-4 w-4" />,
    },
  ];

  const pipelineSegments = [
    {
      label: "Submitted",
      value: ticketSummary.submitted,
      width: barWidth(ticketSummary.submitted, ticketSummary.submitted + ticketSummary.inProgress + ticketSummary.resolved),
      className: "bg-slate-500",
    },
    {
      label: "In progress",
      value: ticketSummary.inProgress,
      width: barWidth(ticketSummary.inProgress, ticketSummary.submitted + ticketSummary.inProgress + ticketSummary.resolved),
      className: "bg-amber-400",
    },
    {
      label: "Resolved",
      value: ticketSummary.resolved,
      width: barWidth(ticketSummary.resolved, ticketSummary.submitted + ticketSummary.inProgress + ticketSummary.resolved),
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
      sub: `${ticketSummary.open} submitted cases`,
    });
  }
  if (canViewUsers) {
    quickLinks.push({
      href: DASHBOARD_MODULES.userManagement.href.admin,
      icon: <UsersRound className="h-5 w-5 text-teal-600" />,
      bg: "bg-teal-50 border-teal-100",
      label: DASHBOARD_MODULES.userManagement.label,
      sub: `${ticketSummary.staffAdminUsers} staff/admin users`,
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
                  {isLoading ? "Loading queue" : `${ticketSummary.open} submitted cases`}
                </span>
              )}
            </div>
          </div>

          {hasOverviewModules ? (
            <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-[1.1fr_1.5fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {canViewTickets ? "Current queue" : "Platform coverage"}
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      {isLoading ? "..." : canViewTickets ? ticketSummary.open : ticketSummary.staffAdminUsers}
                    </p>
                    <p className="pb-2 text-sm text-slate-500">
                      {canViewTickets
                        ? `open case${ticketSummary.open === 1 ? "" : "s"}`
                        : `staff/admin user${ticketSummary.staffAdminUsers === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                      {isLoading ? "..." : canViewUsers ? ticketSummary.staffAdminUsers : "-"}
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
                        <div key={signal.label} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[9rem_1fr_3rem] sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
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
                        {isLoading ? "..." : ticketSummary.staffAdminUsers} staff/admin user
                        {ticketSummary.staffAdminUsers === 1 ? "" : "s"}
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
              {statusError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {statusError}
                </div>
              )}
              {ticketSummary.recentTickets.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading tickets..." : "No tickets found."}
                </div>
              )}
              {ticketSummary.recentTickets.map((ticket) => (
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
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {ticket.public_ticket_id}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-800">{ticket.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DashboardTicketStatusSelect
                      value={ticket.status}
                      canUpdate={canUpdateTickets}
                      isUpdating={updatingTicketId === ticket.id}
                      onChange={(status) =>
                        handleRecentTicketStatusChange(ticket.id, status)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick links ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
