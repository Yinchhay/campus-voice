"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  ShieldCheck,
  Tag,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  listAdminCategories,
  listAdminPermissions,
  listAdminRoles,
  listAdminTickets,
  listAdminUsers,
  type AdminPermission,
  type AdminRoleDetail,
  type AdminTicket,
  type AdminUser,
} from "@/lib/admin-api";
import { adminNav } from "@/lib/admin-nav";
import { DASHBOARD_MODULES } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";
import type { Category, TicketStatus } from "@/lib/types";

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const { hasPermission, isLoading: isPermissionLoading } = useRbacPermissions();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRoleDetail[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError("");

      try {
        const [ticketRows, categoryRows, userRows, roleRows, permissionRows] = await Promise.all([
          hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission)
            ? listAdminTickets()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.categoryManagement.requiredPermission)
            ? listAdminCategories()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.userManagement.requiredPermission)
            ? listAdminUsers()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.roleManagement.requiredPermission)
            ? listAdminRoles()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.accessControls.requiredPermission)
            ? listAdminPermissions()
            : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setTickets(ticketRows);
        setCategories(categoryRows);
        setUsers(userRows);
        setRoles(roleRows);
        setPermissions(permissionRows);
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
  const canViewCategories = hasPermission(DASHBOARD_MODULES.categoryManagement.requiredPermission);
  const canViewUsers = hasPermission(DASHBOARD_MODULES.userManagement.requiredPermission);
  const canViewRoles = hasPermission(DASHBOARD_MODULES.roleManagement.requiredPermission);
  const canViewPermissions = hasPermission(DASHBOARD_MODULES.accessControls.requiredPermission);

  const ticketSummary = useMemo(() => {
    const categoryCounts = new Map<number, { count: number; open: number }>();
    const summary = {
      total: tickets.length,
      open: 0,
      resolved: 0,
      inProgress: 0,
      highPriority: 0,
      categoryCounts,
      recentTickets: [...tickets]
        .sort((a, b) => ticketCreatedTime(b) - ticketCreatedTime(a))
        .slice(0, 5),
    };

    for (const ticket of tickets) {
      const isOpen = ticket.status !== "RESOLVED";
      if (isOpen) summary.open += 1;
      if (ticket.status === "RESOLVED") summary.resolved += 1;
      if (ticket.status === "IN_PROGRESS") summary.inProgress += 1;
      if (ticket.priority === "HIGH" && isOpen) summary.highPriority += 1;

      const categoryStats = categoryCounts.get(ticket.category_id) ?? {
        count: 0,
        open: 0,
      };
      categoryStats.count += 1;
      if (isOpen) categoryStats.open += 1;
      categoryCounts.set(ticket.category_id, categoryStats);
    }

    return summary;
  }, [tickets]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const stats = [
    ...(canViewTickets
      ? [
          { label: "Total Tickets", value: ticketSummary.total, tone: "text-slate-900" },
          { label: "Open Cases", value: ticketSummary.open, tone: "text-blue-700" },
          { label: "In Progress", value: ticketSummary.inProgress, tone: "text-amber-700" },
          { label: "Resolved", value: ticketSummary.resolved, tone: "text-emerald-700" },
          { label: "High Priority", value: ticketSummary.highPriority, tone: "text-red-700" },
        ]
      : []),
    ...(canViewCategories
      ? [
          {
            label: "Categories",
            value: activeCategories.length,
            tone: "text-violet-700",
          },
        ]
      : []),
    ...(canViewUsers
      ? [{ label: "Staff/Admin Users", value: users.length, tone: "text-teal-700" }]
      : []),
    ...(canViewRoles
      ? [{ label: "RBAC Roles", value: roles.length, tone: "text-indigo-700" }]
      : []),
    ...(canViewPermissions
      ? [{ label: "Permissions", value: permissions.length, tone: "text-slate-700" }]
      : []),
  ];

  const categoryBreakdown = useMemo(
    () =>
      activeCategories
        .map((category) => {
          const counts = ticketSummary.categoryCounts.get(category.id);
          return {
            ...category,
            count: counts?.count ?? 0,
            open: counts?.open ?? 0,
          };
        })
        .sort((a, b) => b.count - a.count),
    [activeCategories, ticketSummary.categoryCounts],
  );

  const categoryPriorityBadge: Record<string, string> = {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-slate-100 text-slate-600 border-slate-200",
  };

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
  if (canViewRoles) {
    quickLinks.push({
      href: DASHBOARD_MODULES.roleManagement.href.admin,
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
      bg: "bg-indigo-50 border-indigo-100",
      label: DASHBOARD_MODULES.roleManagement.label,
      sub: `${roles.length} RBAC roles`,
    });
  }
  if (canViewCategories) {
    quickLinks.push({
      href: DASHBOARD_MODULES.categoryManagement.href.admin,
      icon: <Tag className="h-5 w-5 text-violet-600" />,
      bg: "bg-violet-50 border-violet-100",
      label: DASHBOARD_MODULES.categoryManagement.label,
      sub: `${activeCategories.length} active categories`,
    });
  }
  if (canViewPermissions) {
    quickLinks.push({
      href: DASHBOARD_MODULES.accessControls.href.admin,
      icon: <BarChart3 className="h-5 w-5 text-slate-600" />,
      bg: "bg-slate-50 border-slate-200",
      label: DASHBOARD_MODULES.accessControls.label,
      sub: `${permissions.length} permissions available`,
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

        {/* ── Stats grid ───────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>
                  {isLoading ? "..." : s.value}
                </p>
              </div>
            ))}
            {!isLoading && stats.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No dashboard modules are available for your current permissions.
              </div>
            )}
          </div>
        </div>

        {(canViewTickets || canViewCategories) && (
        <div className="grid gap-6 lg:grid-cols-2">
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

          {/* ── Category breakdown ────────────────────────── */}
          {canViewCategories && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">Category Breakdown</h2>
            </div>

            <div className="space-y-2">
              {categoryBreakdown.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading categories..." : "No active categories found."}
                </div>
              )}
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryPriorityBadge[cat.priority_level]}`}
                      >
                        {cat.priority_level}
                      </span>
                    </div>
                    {canViewTickets ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {cat.open} open of {cat.count} total
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Active for student submissions
                      </p>
                    )}
                  </div>
                  {/* Bar */}
                  {canViewTickets && (
                  <div className="w-20 shrink-0">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#1E3A8A] transition-all"
                        style={{
                          width: cat.count ? `${(cat.open / cat.count) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                  )}
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">
                    {canViewTickets ? cat.count : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}
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
