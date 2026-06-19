"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Filter,
  Search,
  TriangleAlert,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { PaginationControls } from "@/components/common/PaginationControls";
import {
  listAdminCategories,
  listAdminTicketsPage,
  type AdminTicket,
} from "@/lib/admin-api";
import { adminNav } from "@/lib/dashboard-nav";
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
  HIGH: "bg-red-100 text-red-900 border-red-300",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};
const priorityIcon: Record<TicketPriority, React.ReactNode> = {
  HIGH: <TriangleAlert className="h-3.5 w-3.5" />,
  MEDIUM: <Clock className="h-3.5 w-3.5" />,
  LOW: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso?: string) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const priorityRank: Record<TicketPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};
const DEFAULT_PAGE_SIZE = 20;

function ticketSortTime(ticket: AdminTicket) {
  return Date.parse(ticket.created_at ?? ticket.resolved_at ?? "") || 0;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalTickets, setTotalTickets] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadTickets() {
      setIsLoading(true);
      setPageError("");

      try {
        const [ticketRows, categoryRows] = await Promise.all([
          listAdminTicketsPage({
            page,
            page_size: pageSize,
            filters: search.trim() || undefined,
            sort_by: "created_at",
            sort_desc: true,
          }),
          listAdminCategories({ sort_by: "name", sort_desc: false }),
        ]);
        if (!isMounted) return;
        setTickets(ticketRows.results);
        setTotalTickets(ticketRows.count);
        setCategories(categoryRows);
      } catch {
        if (isMounted) setPageError("Failed to load tickets.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tickets
      .filter((t) => {
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
        if (categoryFilter !== "ALL" && t.category_id !== categoryFilter) return false;
        if (normalizedSearch) {
          if (
            !t.public_ticket_id.toLowerCase().includes(normalizedSearch) &&
            !t.title.toLowerCase().includes(normalizedSearch)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return ticketSortTime(b) - ticketSortTime(a);
      });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, search]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  function categoryName(id: number) {
    return categoryById.get(id) ?? "Unknown";
  }

  const statusCounts = useMemo(() => {
    const counts: Record<TicketStatus | "ALL", number> = {
      ALL: tickets.length,
      SUBMITTED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    for (const ticket of tickets) {
      counts[ticket.status] += 1;
    }

    return counts;
  }, [tickets]);

  const statusTabs: Array<{ key: TicketStatus | "ALL"; label: string; count: number }> = [
    { key: "ALL", label: "All", count: statusCounts.ALL },
    {
      key: "SUBMITTED",
      label: "Submitted",
      count: statusCounts.SUBMITTED,
    },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: statusCounts.IN_PROGRESS,
    },
    {
      key: "RESOLVED",
      label: "Resolved",
      count: statusCounts.RESOLVED,
    },
  ];

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Ticket Management"
      description="Full visibility across all campus reports. Filter, inspect, and manage every ticket."
      navItems={adminNav}
    >
      <div className="space-y-5">
        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="admin-ticket-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID or title…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <div className="ml-auto flex flex-wrap gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  id="admin-priority-filter"
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as TicketPriority | "ALL");
                    setPage(1);
                  }}
                  className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-8 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <select
                id="admin-category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-800">{filtered.length}</span> ticket
          {filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Ticket rows ──────────────────────────────────── */}
        <div className="space-y-2 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:shadow-sm">
          {/* Header */}
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Ticket</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Date</span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">
                {isLoading ? "Loading tickets..." : "No tickets match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-0 sm:divide-y sm:divide-slate-100">
              {filtered.map((ticket) => {
                const isHighPriority = ticket.priority === "HIGH";

                return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className={`flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition hover:shadow-md sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:px-5 sm:py-4 sm:shadow-none sm:hover:shadow-none ${
                    isHighPriority
                      ? "border-red-300 bg-red-100/80 hover:border-red-400 hover:bg-red-100 sm:bg-red-100/70"
                      : "border-slate-200 bg-white hover:border-blue-200 sm:hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {ticket.public_ticket_id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium sm:hidden ${priorityBadgeClass[ticket.priority]}`}
                      >
                        {priorityIcon[ticket.priority]}
                        {ticket.priority}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium sm:hidden ${statusBadgeClass[ticket.status]}`}
                      >
                        {statusLabel[ticket.status]}
                      </span>
                      {ticket.is_anonymous && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          Anon
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium text-slate-900 sm:mt-1 sm:line-clamp-1">
                      {ticket.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                      {categoryName(ticket.category_id)}
                    </p>
                  </div>

                  <p className="hidden text-xs text-slate-600 sm:block">{categoryName(ticket.category_id)}</p>

                  <span
                    className={`hidden w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium sm:inline-flex ${priorityBadgeClass[ticket.priority]}`}
                  >
                    {priorityIcon[ticket.priority]}
                    {ticket.priority}
                  </span>

                  <span
                    className={`hidden w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium sm:inline-block ${statusBadgeClass[ticket.status]}`}
                  >
                    {statusLabel[ticket.status]}
                  </span>

                  <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400 sm:block">
                    <span>{formatDate(ticket.resolved_at ?? undefined)}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300 sm:hidden" />
                  </div>

                  <ArrowRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                </Link>
                );
              })}
            </div>
          )}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={totalTickets}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </div>
      </div>
    </RoleDashboardShell>
  );
}
