"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import axios from "axios";
import {
  createAdminCategory,
  listAdminCategories,
  updateAdminCategory,
  type CategoryPayload,
} from "@/lib/admin-categories";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { adminNav } from "../dashboard/page";
import type { Category, TicketPriority } from "@/lib/types";

type CategoryFormState = {
  name: string;
  description: string;
  priority_level: TicketPriority;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  priority_level: "LOW",
};

const priorityBadge: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object") {
    return Object.entries(data.error)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
        return `${field}: ${text}`;
      })
      .join(" ");
  }
  return fallback;
}

function validateCategory(form: CategoryFormState) {
  if (!form.name.trim()) return "Category name is required.";
  if (!form.description.trim()) return "Description is required.";
  return "";
}

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(emptyForm);
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setPageError("");
    try {
      const categories = await listAdminCategories();
      setRows(categories);
    } catch (error) {
      setPageError(extractApiError(error, "Failed to load categories."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const active = useMemo(() => rows.filter((row) => row.is_active).length, [rows]);
  const inactive = rows.length - active;

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      priority_level: category.priority_level,
    });
    setEditError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError("");
  }

  async function handleCreate() {
    const validationError = validateCategory(newCategory);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: CategoryPayload = {
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      priority_level: newCategory.priority_level,
      is_active: true,
    };

    setIsCreating(true);
    setFormError("");
    try {
      const category = await createAdminCategory(payload);
      setRows((prev) => [category, ...prev]);
      setNewCategory(emptyForm);
      setShowForm(false);
    } catch (error) {
      setFormError(extractApiError(error, "Failed to create category."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEdit(categoryId: number) {
    const validationError = validateCategory(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSavingId(categoryId);
    setEditError("");
    try {
      const updated = await updateAdminCategory(categoryId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        priority_level: editForm.priority_level,
      });
      setRows((prev) => prev.map((row) => (row.id === categoryId ? updated : row)));
      cancelEditing();
    } catch (error) {
      setEditError(extractApiError(error, "Failed to update category."));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(category: Category) {
    setTogglingId(category.id);
    setPageError("");
    try {
      const updated = await updateAdminCategory(category.id, {
        is_active: !category.is_active,
      });
      setRows((prev) => prev.map((row) => (row.id === category.id ? updated : row)));
    } catch (error) {
      setPageError(extractApiError(error, "Failed to update category status."));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Category Management"
      description="Configure report categories, their default priority levels, and active status."
      navItems={adminNav}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              {active} active
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {inactive} inactive
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadCategories()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setFormError("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>

        {pageError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

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
                  value={newCategory.name}
                  onChange={(event) => {
                    setNewCategory((prev) => ({ ...prev, name: event.target.value }));
                    setFormError("");
                  }}
                  placeholder="e.g. Infrastructure Damage"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-slate-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="cat-desc"
                  value={newCategory.description}
                  onChange={(event) => {
                    setNewCategory((prev) => ({ ...prev, description: event.target.value }));
                    setFormError("");
                  }}
                  rows={3}
                  placeholder="Describe what types of reports belong in this category..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="cat-priority" className="mb-1 block text-sm font-medium text-slate-700">
                  Default Priority
                </label>
                <select
                  id="cat-priority"
                  value={newCategory.priority_level}
                  onChange={(event) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      priority_level: event.target.value as TicketPriority,
                    }))
                  }
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
                  onClick={() => void handleCreate()}
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewCategory(emptyForm);
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Category</span>
            <span>Priority</span>
            <span>Created</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading categories
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Tag className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">No categories yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create the first category to make it available to reports.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((cat) => {
                const isEditing = editingId === cat.id;
                const isSaving = savingId === cat.id;
                const isToggling = togglingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={`flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center sm:gap-4 ${
                      !cat.is_active ? "opacity-60" : ""
                    }`}
                  >
                    <div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={editForm.name}
                            onChange={(event) => {
                              setEditForm((prev) => ({ ...prev, name: event.target.value }));
                              setEditError("");
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[#1E3A8A]"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(event) => {
                              setEditForm((prev) => ({ ...prev, description: event.target.value }));
                              setEditError("");
                            }}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-[#1E3A8A]"
                          />
                          {editError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-slate-400" />
                            <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                          </div>
                          {cat.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{cat.description}</p>
                          )}
                        </>
                      )}
                    </div>

                    {isEditing ? (
                      <select
                        value={editForm.priority_level}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            priority_level: event.target.value as TicketPriority,
                          }))
                        }
                        className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadge[cat.priority_level]}`}
                      >
                        {cat.priority_level}
                      </span>
                    )}

                    <span className="text-xs text-slate-500">{formatDate(cat.created_at)}</span>

                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(cat.id)}
                            disabled={isSaving}
                            title="Save"
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            title="Cancel"
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(cat)}
                            title="Edit"
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleActive(cat)}
                            disabled={isToggling}
                            title={cat.is_active ? "Deactivate" : "Activate"}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              cat.is_active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : cat.is_active ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {cat.is_active ? "Active" : "Inactive"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
