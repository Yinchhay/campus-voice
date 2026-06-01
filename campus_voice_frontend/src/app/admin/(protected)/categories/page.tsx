"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { mockCategories, mockTickets } from "@/lib/mock-data";
import { adminNav } from "../dashboard/page";
import type { TicketPriority } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CategoryRow = {
  id: number;
  name: string;
  description: string;
  priority_level: TicketPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ticketCount: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const priorityBadge: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminCategoriesPage() {
  const baseRows: CategoryRow[] = useMemo(
    () =>
      mockCategories.map((c) => ({
        ...c,
        ticketCount: mockTickets.filter((t) => t.category_id === c.id).length,
      })),
    [],
  );

  const [rows, setRows] = useState<CategoryRow[]>(baseRows);

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TicketPriority>("LOW");
  const [formError, setFormError] = useState("");

  function toggleActive(id: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r)),
    );
  }

  function handleAdd() {
    if (!newName.trim()) {
      setFormError("Category name is required.");
      return;
    }
    if (rows.some((r) => r.name.toLowerCase() === newName.trim().toLowerCase())) {
      setFormError("A category with this name already exists.");
      return;
    }
    const now = new Date().toISOString();
    const newRow: CategoryRow = {
      id: Math.max(...rows.map((r) => r.id)) + 1,
      name: newName.trim(),
      description: newDesc.trim(),
      priority_level: newPriority,
      is_active: true,
      created_at: now,
      updated_at: now,
      ticketCount: 0,
    };
    setRows((prev) => [newRow, ...prev]);
    setNewName("");
    setNewDesc("");
    setNewPriority("LOW");
    setFormError("");
    setShowForm(false);
  }

  const active = rows.filter((r) => r.is_active).length;
  const inactive = rows.filter((r) => !r.is_active).length;

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Category Management"
      description="Configure report categories, their default priority levels, and active status."
      navItems={adminNav}
    >
      <div className="space-y-5">
        {/* ── Summary + Add button ─────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              {active} active
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {inactive} inactive
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* ── Add form ─────────────────────────────────────── */}
        {showForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">New Category</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFormError("");
                  }}
                  placeholder="e.g. Infrastructure Damage"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe what types of reports belong in this category…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="cat-priority" className="mb-1 block text-sm font-medium text-slate-700">
                  Default Priority
                </label>
                <select
                  id="cat-priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1E3A8A]"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Category</span>
            <span>Priority</span>
            <span>Tickets</span>
            <span>Created</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-slate-100">
            {rows.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4 ${
                  !cat.is_active ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                  </div>
                  {cat.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{cat.description}</p>
                  )}
                </div>

                <span
                  className={`inline-block w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadge[cat.priority_level]}`}
                >
                  {cat.priority_level}
                </span>

                <span className="text-sm font-semibold text-slate-700">{cat.ticketCount}</span>
                <span className="text-xs text-slate-500">{formatDate(cat.created_at)}</span>

                <button
                  type="button"
                  onClick={() => toggleActive(cat.id)}
                  title={cat.is_active ? "Deactivate" : "Activate"}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    cat.is_active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  }`}
                >
                  {cat.is_active ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {cat.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
