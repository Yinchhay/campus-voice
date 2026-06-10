"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  ShieldCheck,
  Tag,
  TriangleAlert,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  listAdminCategories,
  listAdminPermissions,
  listAdminRoles,
  type AdminPermission,
  type AdminRoleDetail,
} from "@/lib/admin-api";
import { DASHBOARD_MODULES } from "@/lib/dashboard-access";
import { listStaffTickets, type StaffTicket } from "@/lib/staff-api";
import { staffNav } from "@/lib/staff-nav";
import { useRbacPermissions } from "@/lib/rbac";
import type { Category, TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
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

function formatRelative(iso?: string) {
  if (!iso) return "Time unavailable";

  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ticketCreatedTime(ticket: StaffTicket) {
  return ticket.created_at ? new Date(ticket.created_at).getTime() : 0;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffDashboardPage() {
  const {
    hasPermission,
    isLoading: isPermissionLoading,
  } = useRbacPermissions();
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<AdminRoleDetail[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError(null);

      try {
        const [ticketRows, categoryRows, roleRows, permissionRows] = await Promise.all([
          hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission)
            ? listStaffTickets()
            : Promise.resolve([]),
          hasPermission(DASHBOARD_MODULES.categoryManagement.requiredPermission)
            ? listAdminCategories()
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
        setRoles(roleRows);
        setPermissions(permissionRows);
      } catch (error) {
        if (isMounted) {
          setPageError(extractApiError(error, "Failed to load staff dashboard."));
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

  const canViewTickets = hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission);
  const canViewCategories = hasPermission(DASHBOARD_MODULES.categoryManagement.requiredPermission);
  const canViewRoles = hasPermission(DASHBOARD_MODULES.roleManagement.requiredPermission);
  const canViewPermissions =
    canViewRoles && hasPermission(DASHBOARD_MODULES.accessControls.requiredPermission);

  const total = tickets.length;
  const open = tickets.filter((t) => t.status !== "RESOLVED").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const highPriority = tickets.filter((t) => t.priority === "HIGH" && t.status !== "RESOLVED").length;
  const submitted = tickets.filter((t) => t.status === "SUBMITTED").length;
  const resolvedToday = tickets.filter((t) => {
    if (!t.resolved_at) return false;
    const d = new Date(t.resolved_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }).length;

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => ticketCreatedTime(b) - ticketCreatedTime(a))
        .slice(0, 5),
    [tickets],
  );

  const stats = [
    ...(canViewTickets
      ? [
          { label: "All Tickets", value: total, tone: "text-slate-900" },
          { label: "Open Cases", value: open, tone: "text-blue-700" },
          { label: "In Progress", value: inProgress, tone: "text-amber-700" },
          { label: "High Priority", value: highPriority, tone: "text-red-700" },
          { label: "Resolved Today", value: resolvedToday, tone: "text-emerald-700" },
        ]
      : []),
    ...(canViewCategories
      ? [
          {
            label: "Active Categories",
            value: categories.filter((category) => category.is_active).length,
            tone: "text-violet-700",
          },
          {
            label: "Total Categories",
            value: categories.length,
            tone: "text-slate-900",
          },
        ]
      : []),
    ...(canViewRoles
      ? [
          {
            label: "RBAC Roles",
            value: roles.length,
            tone: "text-indigo-700",
          },
        ]
      : []),
    ...(canViewPermissions
      ? [
          {
            label: "Permissions",
            value: permissions.length,
            tone: "text-slate-700",
          },
        ]
      : []),
  ];

  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Staff Dashboard"
      description="Review incoming reports, prioritise urgent cases, and move them through the resolution pipeline."
      navItems={staffNav}
    >
      <div className="space-y-6">
        {/* ── Stats ────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-slate-700 mb-5">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
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
          </div>
        </div>

        {stats.length === 0 && !isLoading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No dashboard modules are available for your current permissions.
          </div>
        )}

        {/* ── Recent tickets ────────────────────────────────── */}
        {canViewTickets && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent Tickets</h2>
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

          <div className="space-y-2">
            {isLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading recent tickets...
              </div>
            )}

            {!isLoading && recentTickets.length === 0 && !pageError && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No tickets are available yet.
              </div>
            )}

            {!isLoading && recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/staff/tickets/${ticket.id}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
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
                  <p className="mt-1.5 truncate text-sm font-medium text-slate-900">{ticket.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{ticket.category_name}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[ticket.status]}`}
                  >
                    {statusLabel[ticket.status]}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelative(ticket.created_at)}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* ── Category overview ─────────────────────────────── */}
        {canViewCategories && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-slate-900">Category Overview</h2>
              </div>
              <Link
                href="/staff/categories"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:text-blue-700"
              >
                Manage
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {isLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Loading categories...
                </div>
              )}
              {!isLoading && categories.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No categories are available yet.
                </div>
              )}
              {!isLoading &&
                categories.slice(0, 6).map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {category.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          category.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {category.description}
                    </p>
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
              <p className="font-semibold text-red-900">High Priority Queue</p>
              <p className="mt-0.5 text-sm text-red-700">
                {highPriority} urgent case{highPriority !== 1 ? "s" : ""} need attention
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
                {submitted} ticket{submitted !== 1 ? "s" : ""} awaiting review
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
          </Link>
          )}

          {canViewCategories && (
            <Link
              href={DASHBOARD_MODULES.categoryManagement.href.staff}
              className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-5 transition hover:border-violet-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Tag className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-violet-950">
                  {DASHBOARD_MODULES.categoryManagement.label}
                </p>
                <p className="mt-0.5 text-sm text-violet-700">
                  {categories.filter((category) => category.is_active).length} active categor
                  {categories.filter((category) => category.is_active).length === 1 ? "y" : "ies"}
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-violet-400" />
            </Link>
          )}

          {canViewRoles && (
            <Link
              href={DASHBOARD_MODULES.roleManagement.href.staff}
              className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 transition hover:border-indigo-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-indigo-950">
                  {DASHBOARD_MODULES.roleManagement.label}
                </p>
                <p className="mt-0.5 text-sm text-indigo-700">
                  {roles.length} RBAC role{roles.length === 1 ? "" : "s"}
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-indigo-400" />
            </Link>
          )}

          {canViewPermissions && (
            <Link
              href={DASHBOARD_MODULES.accessControls.href.staff}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {DASHBOARD_MODULES.accessControls.label}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {permissions.length} permission{permissions.length === 1 ? "" : "s"} available
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
