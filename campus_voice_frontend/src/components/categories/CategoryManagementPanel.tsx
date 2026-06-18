"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { PaginationControls } from "@/components/common/PaginationControls";
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategoriesPage,
  updateAdminCategory,
  type CategoryPayload,
} from "@/lib/admin-api";
import { RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";
import type { Category, CategoryIssueType, TicketPriority } from "@/lib/types";

type CategoryFormState = {
  name: string;
  description: string;
  issue_type: CategoryIssueType;
  priority_level: TicketPriority;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  issue_type: "SERVICE",
  priority_level: "LOW",
};

const priorityBadge: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const issueTypeLabel: Record<CategoryIssueType, string> = {
  SERVICE: "Service",
  ACADEMIC: "Academic",
};

const issueTypeBadge: Record<CategoryIssueType, string> = {
  SERVICE: "border-teal-200 bg-teal-50 text-teal-700",
  ACADEMIC: "border-indigo-200 bg-indigo-50 text-indigo-700",
};
const DEFAULT_PAGE_SIZE = 20;

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object") {
    return Object.entries(data.error)
      .map(([field, messages]) => {
        const text = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);
        return `${field}: ${text}`;
      })
      .join(" ");
  }
  return fallback;
}

function extractDeleteCategoryError(error: unknown, categoryName: string) {
  if (axios.isAxiosError(error) && error.response?.status === 500) {
    return `Could not delete "${categoryName}". This category may already be used by reports, so deactivate it instead.`;
  }

  return extractApiError(error, "Failed to delete category.");
}

function validateCategory(form: CategoryFormState) {
  if (!form.name.trim()) return "Category name is required.";
  if (!form.description.trim()) return "Description is required.";
  return "";
}

export function CategoryManagementPanel() {
  const { hasPermission } = useRbacPermissions();
  const [rows, setRows] = useState<Category[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const categories = await listAdminCategoriesPage({
        page,
        page_size: pageSize,
        filters: search.trim() || undefined,
        sort_by: "name",
        sort_desc: false,
      });
      setRows(categories.results);
      setTotalRows(categories.count);
    } catch (error) {
      setPageError(extractApiError(error, "Failed to load categories."));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const active = useMemo(
    () => rows.filter((row) => row.is_active).length,
    [rows],
  );
  const inactive = rows.length - active;
  const canCreate = hasPermission(RBAC_PERMISSIONS.category.create);
  const canUpdate = hasPermission(RBAC_PERMISSIONS.category.update);
  const canDelete = hasPermission(RBAC_PERMISSIONS.category.delete);

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      issue_type: category.issue_type ?? "SERVICE",
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
      issue_type: newCategory.issue_type,
      priority_level: newCategory.priority_level,
      is_active: true,
    };

    setIsCreating(true);
    setFormError("");
    try {
      const category = await createAdminCategory(payload);
      setRows((prev) => [category, ...prev]);
      setTotalRows((prev) => prev + 1);
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
        issue_type: editForm.issue_type,
        priority_level: editForm.priority_level,
      });
      setRows((prev) =>
        prev.map((row) => (row.id === categoryId ? updated : row)),
      );
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
      setRows((prev) =>
        prev.map((row) => (row.id === category.id ? updated : row)),
      );
    } catch (error) {
      setPageError(extractApiError(error, "Failed to update category status."));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setPageError("");
    try {
      await deleteAdminCategory(category.id);
      setRows((prev) => prev.filter((row) => row.id !== category.id));
      setTotalRows((prev) => Math.max(0, prev - 1));
      if (editingId === category.id) {
        cancelEditing();
      }
    } catch (error) {
      setPageError(extractDeleteCategoryError(error, category.name));
    } finally {
      setDeletingId(null);
    }
  }

  return (
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
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          {canCreate && (
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
          )}
        </div>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {showForm && canCreate && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            New Category
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="cat-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                value={newCategory.name}
                onChange={(event) => {
                  setNewCategory((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }));
                  setFormError("");
                }}
                placeholder="e.g. Infrastructure Damage"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="cat-desc"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cat-desc"
                value={newCategory.description}
                onChange={(event) => {
                  setNewCategory((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }));
                  setFormError("");
                }}
                rows={3}
                placeholder="Describe what types of reports belong in this category..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="cat-priority"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
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

            <div>
              <label
                htmlFor="cat-issue-type"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Issue Type
              </label>
              <select
                id="cat-issue-type"
                value={newCategory.issue_type}
                onChange={(event) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    issue_type: event.target.value as CategoryIssueType,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1E3A8A]"
              >
                <option value="SERVICE">Service</option>
                <option value="ACADEMIC">Academic</option>
              </select>
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
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
        <div className="hidden grid-cols-[1fr_140px_110px_minmax(220px,1fr)] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Category</span>
          <span>Issue Type</span>
          <span>Priority</span>
          <span className="w-65 justify-self-end text-center">Actions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Tag className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No categories yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create the first category to make it available to reports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((cat) => {
              const isEditing = editingId === cat.id;
              const isSaving = savingId === cat.id;
              const isToggling = togglingId === cat.id;
              const isDeleting = deletingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`flex flex-col gap-4 px-6 py-5 sm:grid sm:grid-cols-[1fr_140px_110px_minmax(220px,1fr)] sm:items-center sm:gap-4 sm:py-4 ${
                    !cat.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editForm.name}
                          onChange={(event) => {
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }));
                            setEditError("");
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[#1E3A8A]"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(event) => {
                            setEditForm((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }));
                            setEditError("");
                          }}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-[#1E3A8A]"
                        />
                        {editError && (
                          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                            {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 shrink-0 text-slate-400" />
                          <p className="truncate text-base font-semibold text-slate-900 sm:text-sm sm:font-medium">
                            {cat.name}
                          </p>
                        </div>
                        {cat.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500 sm:text-xs">
                            {cat.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:block">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                      Issue type
                    </span>
                    {isEditing ? (
                      <select
                        value={editForm.issue_type}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            issue_type: event.target.value as CategoryIssueType,
                          }))
                        }
                        className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="SERVICE">SERVICE</option>
                        <option value="ACADEMIC">ACADEMIC</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${issueTypeBadge[cat.issue_type ?? "SERVICE"]}`}
                      >
                        {issueTypeLabel[cat.issue_type ?? "SERVICE"]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:block">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                      Priority
                    </span>
                    {isEditing ? (
                      <select
                        value={editForm.priority_level}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            priority_level: event.target
                              .value as TicketPriority,
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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:w-[260px] sm:justify-self-end sm:justify-center sm:border-t-0 sm:pt-0">
                    <span className="mr-auto text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                      Status & actions
                    </span>
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
                        {canUpdate && (
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
                              disabled={isToggling || isDeleting}
                              title={cat.is_active ? "Deactivate" : "Activate"}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                cat.is_active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
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
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(cat)}
                            disabled={isDeleting || isToggling}
                            title="Delete"
                            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalRows}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
