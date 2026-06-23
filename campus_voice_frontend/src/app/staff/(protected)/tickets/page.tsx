"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Paperclip,
  Search,
  TriangleAlert,
} from "lucide-react";
import { PaginationControls } from "@/components/common/PaginationControls";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { DASHBOARD_MODULES, RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { formatPriorityLabel } from "@/lib/priority";
import {
  downloadTicketExportExcel,
  listStaffTicketsPage,
  type StaffTicket,
} from "@/lib/staff-api";
import { staffNav } from "@/lib/dashboard-nav";
import { useRbacPermissions } from "@/lib/rbac";
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

const priorityRank: Record<TicketPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};
const DEFAULT_PAGE_SIZE = 20;
type DateRangeFilter = "ALL" | "WEEK" | "MONTH";
const dateRangeOptions: Array<{ value: DateRangeFilter; label: string }> = [
  { value: "ALL", label: "All time" },
  { value: "WEEK", label: "Past week" },
  { value: "MONTH", label: "Past month" },
];

function ticketSortTime(ticket: StaffTicket) {
  return Date.parse(ticket.created_at ?? ticket.resolved_at ?? "") || 0;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffTicketsPage() {
  const router = useRouter();
  const {
    hasPermission,
    isLoading: isPermissionLoading,
  } = useRbacPermissions();
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isPermissionLoading) return;
    if (!hasPermission(DASHBOARD_MODULES.ticketOverview.requiredPermission)) {
      if (hasPermission(DASHBOARD_MODULES.categoryManagement.requiredPermission)) {
        router.replace(DASHBOARD_MODULES.categoryManagement.href.staff);
      } else if (hasPermission(DASHBOARD_MODULES.roleManagement.requiredPermission)) {
        router.replace(DASHBOARD_MODULES.roleManagement.href.staff);
      } else {
        setIsLoading(false);
      }
      return;
    }

    let isMounted = true;

    async function loadTickets() {
      setIsLoading(true);
      setPageError(null);

      try {
        const data = await listStaffTicketsPage({
          page,
          page_size: pageSize,
          filters: search.trim() || undefined,
          date_range: dateRangeFilter.toLowerCase(),
          sort_by: "created_at",
          sort_desc: true,
        });
        if (isMounted) {
          setTickets(data.results);
          setTotalTickets(data.count);
        }
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
  }, [dateRangeFilter, hasPermission, isPermissionLoading, page, pageSize, router, search]);

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
        const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return ticketSortTime(b) - ticketSortTime(a);
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

  const canExportTickets =
    !isPermissionLoading && hasPermission(RBAC_PERMISSIONS.ticket.export);

  async function handleExportTickets() {
    if (isExporting) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await downloadTicketExportExcel();
    } catch (error) {
      setExportError(extractApiError(error, "Failed to export tickets."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Ticket Queue"
      description="All campus reports. Filter by status, priority, or category to find what needs attention."
      navItems={staffNav}
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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

              {/* Category filter */}
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                id="date-range-filter"
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value as DateRangeFilter);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1E3A8A]"
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Result count ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          {canExportTickets && (
            <button
              type="button"
              onClick={handleExportTickets}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#107C41] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d6b38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting" : "Export Excel"}
            </button>
          )}
        </div>

        {exportError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {exportError}
          </p>
        )}

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
            filtered.map((ticket) => {
              const isHighPriority = ticket.priority === "HIGH";

              return (
              <Link
                key={ticket.id}
                href={`/staff/tickets/${ticket.id}`}
                className={`flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                  isHighPriority
                    ? "border-red-300 bg-red-100/80 hover:border-red-400 hover:bg-red-100"
                    : "border-slate-200 bg-white hover:border-blue-200"
                }`}
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
                      {formatPriorityLabel(ticket.priority)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[ticket.status]}`}
                    >
                      {statusLabel[ticket.status]}
                    </span>
                    {ticket.is_anonymous && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        Anon
                      </span>
                    )}
                    {ticket.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        <Paperclip className="h-3 w-3" />
                        {ticket.attachments.length} file
                        {ticket.attachments.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-slate-900">{ticket.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{ticket.category_name}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                  <span>{formatDate(ticket.created_at)}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
              );
            })
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
