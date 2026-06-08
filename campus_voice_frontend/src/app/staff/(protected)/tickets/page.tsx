"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  TriangleAlert,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { listStaffTickets, type StaffTicket } from "@/lib/staff-api";
import type { TicketPriority, TicketStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const statusTabs: Array<{ key: TicketStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
];

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

const navItems = [
  { label: "Dashboard", href: "/staff/dashboard", Icon: LayoutDashboard },
  { label: "Ticket Queue", href: "/staff/tickets", Icon: ListChecks },
  { label: "Settings", href: "/staff/settings", Icon: Settings },
];

// ---------------------------------------------------------------------------
// Helpers
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

function formatDate(iso?: string) {
  if (!iso) return "Date unavailable";

  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffTicketsPage() {
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTickets() {
      setIsLoading(true);
      setPageError(null);

      try {
        const data = await listStaffTickets();
        if (isMounted) setTickets(data);
      } catch (error) {
        if (isMounted) setPageError(extractApiError(error, "Failed to load tickets."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => {
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
        if (categoryFilter !== "ALL" && t.category_id !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !t.public_ticket_id.toLowerCase().includes(q) &&
            !t.title.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, search]);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tickets.map((ticket) => [
            ticket.category_id,
            { id: ticket.category_id, name: ticket.category_name },
          ]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [tickets],
  );

  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Ticket Queue"
      description="All campus reports. Filter by status, priority, or category to find what needs attention."
      navItems={navItems}
    >
      <div className="space-y-5">
        {/* ── Search + filters ─────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ticket-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or title…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            <div className="ml-auto flex flex-wrap gap-2">
              {/* Priority filter */}
              <div className="relative">
                <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "ALL")}
                  className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-8 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Category filter */}
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Result count ─────────────────────────────────── */}
        <p className="text-sm text-slate-500">
          {isLoading ? (
            "Loading tickets..."
          ) : (
            <>
              Showing <span className="font-medium text-slate-800">{filtered.length}</span> ticket
              {filtered.length !== 1 ? "s" : ""}
            </>
          )}
        </p>

        {/* ── Ticket rows ──────────────────────────────────── */}
        <div className="space-y-2">
          {pageError && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {pageError}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading ticket queue...
            </div>
          ) : filtered.length === 0 && !pageError ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h3 className="text-base font-semibold text-slate-900">No tickets match</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/staff/tickets/${ticket.id}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
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
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[ticket.status]}`}
                    >
                      {statusLabel[ticket.status]}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-slate-900">{ticket.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{ticket.category_name}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                  <span>{formatDate(ticket.created_at)}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
