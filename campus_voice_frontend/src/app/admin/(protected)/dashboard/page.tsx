"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tag,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  listAdminCategories,
  listAdminTickets,
  type AdminTicket,
} from "@/lib/admin-api";
import type { Category, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------
export const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", Icon: LayoutDashboard },
  { label: "Tickets", href: "/admin/tickets", Icon: TicketCheck },
  { label: "Users", href: "/admin/users", Icon: UsersRound },
  { label: "Categories", href: "/admin/categories", Icon: Tag },
  { label: "Settings", href: "/admin/settings", Icon: Settings },
];

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setPageError("");

      try {
        const [ticketRows, categoryRows] = await Promise.all([
          listAdminTickets(),
          listAdminCategories(),
        ]);
        if (!isMounted) return;
        setTickets(ticketRows);
        setCategories(categoryRows);
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
  }, []);

  const total = tickets.length;
  const open = tickets.filter((t) => t.status !== "RESOLVED").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const highPriority = tickets.filter((t) => t.priority === "HIGH" && t.status !== "RESOLVED").length;

  const stats = [
    { label: "Total Tickets", value: total, tone: "text-slate-900" },
    { label: "Open Cases", value: open, tone: "text-blue-700" },
    { label: "In Progress", value: inProgress, tone: "text-amber-700" },
    { label: "Resolved", value: resolved, tone: "text-emerald-700" },
    { label: "High Priority", value: highPriority, tone: "text-red-700" },
  ];

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime(),
        )
        .slice(0, 5),
    [tickets],
  );

  const categoryBreakdown = useMemo(
    () =>
      categories
        .filter((c) => c.is_active)
        .map((c) => ({
          ...c,
          count: tickets.filter((t) => t.category_id === c.id).length,
          open: tickets.filter((t) => t.category_id === c.id && t.status !== "RESOLVED").length,
        }))
        .sort((a, b) => b.count - a.count),
    [categories, tickets],
  );

  const categoryPriorityBadge: Record<string, string> = {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-slate-100 text-slate-600 border-slate-200",
  };

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
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Recent tickets ────────────────────────────── */}
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
              {recentTickets.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading tickets..." : "No tickets found."}
                </div>
              )}
              {recentTickets.map((ticket) => (
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

          {/* ── Category breakdown ────────────────────────── */}
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
                    <p className="mt-0.5 text-xs text-slate-500">
                      {cat.open} open of {cat.count} total
                    </p>
                  </div>
                  {/* Bar */}
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
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/admin/tickets",
              icon: <TicketCheck className="h-5 w-5 text-blue-600" />,
              bg: "bg-blue-50 border-blue-100",
              label: "Manage Tickets",
              sub: `${open} open cases`,
            },
            {
              href: "/admin/users",
              icon: <UsersRound className="h-5 w-5 text-teal-600" />,
              bg: "bg-teal-50 border-teal-100",
              label: "Manage Users",
              sub: "Backend users API pending",
            },
            {
              href: "/admin/categories",
              icon: <Tag className="h-5 w-5 text-violet-600" />,
              bg: "bg-violet-50 border-violet-100",
              label: "Manage Categories",
              sub: `${categories.filter((c) => c.is_active).length} active categories`,
            },
          ].map((item) => (
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
