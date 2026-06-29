"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import axios from "axios";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { PaginationControls } from "@/components/common/PaginationControls";
import {
  createAdminRole,
  deleteAdminRole,
  listAdminPermissions,
  listAdminRolesPage,
  updateAdminRole,
  type AdminPermission,
  type AdminRoleDetail,
} from "@/lib/admin-api";
import { RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";

type RoleForm = {
  name: string;
  description: string;
  is_active: boolean;
  is_superadmin: boolean;
  permissionIds: number[];
};

const emptyForm: RoleForm = {
  name: "",
  description: "",
  is_active: true,
  is_superadmin: false,
  permissionIds: [],
};
const DEFAULT_PAGE_SIZE = 20;

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    if ("message" in data && typeof data.message === "string") return data.message;
  }
  return fallback;
}

function groupPermissions(permissions: AdminPermission[]) {
  return permissions.reduce<Record<string, AdminPermission[]>>((groups, permission) => {
    groups[permission.resource] = groups[permission.resource] ?? [];
    groups[permission.resource].push(permission);
    return groups;
  }, {});
}

function permissionLabel(permission: AdminPermission) {
  return permission.action_display || permission.action;
}

function RoleModal({
  role,
  permissions,
  canManagePermissions,
  onClose,
  onSave,
}: {
  role: AdminRoleDetail | null;
  permissions: AdminPermission[];
  canManagePermissions: boolean;
  onClose: () => void;
  onSave: (form: RoleForm) => Promise<void>;
}) {
  const [form, setForm] = useState<RoleForm>(() =>
    role
      ? {
          name: role.name,
          description: role.description ?? "",
          is_active: role.is_active,
          is_superadmin: role.is_superadmin,
          permissionIds: role.permissions.map((permission) => permission.id),
        }
      : emptyForm,
  );
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  function togglePermission(permissionId: number) {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setSubmitError("Role name is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      setSubmitError(extractApiError(error, "Failed to save role."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A8A]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {role ? "Edit role" : "Create role"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Role name
              </label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Support Staff"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
                  form.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {form.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="What this role can do"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, is_superadmin: !prev.is_superadmin }))
            }
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              form.is_superadmin
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Superadmin role
          </button>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Permissions</h3>
              {!canManagePermissions && (
                <span className="text-xs text-slate-500">
                  Permission list unavailable for this account.
                </span>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([resource, rows]) => (
                <div key={resource} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {resource}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rows.map((permission) => {
                      const selected = form.permissionIds.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          type="button"
                          disabled={!canManagePermissions || form.is_superadmin}
                          onClick={() => togglePermission(permission.id)}
                          title={permission.description || permission.codename}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected
                              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {permissionLabel(permission)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {permissions.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No permissions loaded.
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save role"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoleManagementPanel() {
  const { hasPermission, isLoading: isPermissionLoading } = useRbacPermissions();
  const [roles, setRoles] = useState<AdminRoleDetail[]>([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [editingRole, setEditingRole] = useState<AdminRoleDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [rolePendingDelete, setRolePendingDelete] =
    useState<AdminRoleDetail | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState("");

  const canCreate = hasPermission(RBAC_PERMISSIONS.role.create);
  const canUpdate = hasPermission(RBAC_PERMISSIONS.role.update);
  const canDelete = hasPermission(RBAC_PERMISSIONS.role.delete);
  const canViewPermissions = hasPermission(RBAC_PERMISSIONS.permission.view);

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadRoles() {
      setIsLoading(true);
      setPageError("");
      try {
        const [roleRows, permissionRows] = await Promise.all([
          listAdminRolesPage({
            page,
            page_size: pageSize,
            filters: search.trim() || undefined,
            sort_by: "name",
            sort_desc: false,
          }),
          canViewPermissions ? listAdminPermissions() : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setRoles(roleRows.results);
        setTotalRoles(roleRows.count);
        setPermissions(permissionRows);
      } catch (error) {
        if (isMounted) setPageError(extractApiError(error, "Failed to load roles."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [isPermissionLoading, canViewPermissions, page, pageSize, search]);

  const filteredRoles = roles;

  async function handleSaveRole(form: RoleForm, role: AdminRoleDetail | null) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
      is_superadmin: form.is_superadmin,
      permission_ids: form.is_superadmin ? [] : form.permissionIds,
    };

    if (role) {
      const updated = await updateAdminRole(role.id, payload);
      setRoles((prev) => prev.map((row) => (row.id === role.id ? updated : row)));
      return;
    }

    const created = await createAdminRole(payload);
    setRoles((prev) => [created, ...prev]);
    setTotalRoles((prev) => prev + 1);
  }

  async function handleDelete(role: AdminRoleDetail) {
    if (role.is_superadmin) return;

    setDeletingId(role.id);
    setPageError("");
    setDeleteDialogError("");
    try {
      await deleteAdminRole(role.id);
      setRoles((prev) => prev.filter((row) => row.id !== role.id));
      setTotalRoles((prev) => Math.max(0, prev - 1));
      setRolePendingDelete(null);
    } catch (error) {
      const message = extractApiError(error, "Failed to delete role.");
      setDeleteDialogError(message);
      setPageError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-5">
        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search roles..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
              >
                <Plus className="h-4 w-4" />
                Create Role
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRoles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">
              {isLoading ? "Loading roles..." : "No roles match the current filters."}
            </div>
          ) : (
            filteredRoles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{role.name}</h2>
                      {role.is_superadmin && (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          Superadmin
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          role.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {role.description && (
                      <p className="mt-1 max-w-3xl text-sm text-slate-600">
                        {role.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {role.user_count ?? 0} user{role.user_count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => setEditingRole(role)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        title="Edit role"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteDialogError("");
                          setRolePendingDelete(role);
                        }}
                        disabled={role.is_superadmin || deletingId === role.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={role.is_superadmin ? "Superadmin roles cannot be deleted" : "Delete role"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {role.is_superadmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      All permissions
                    </span>
                  ) : role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <span
                        key={permission.id}
                        title={permission.description || permission.codename}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {permission.codename}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      <AlertCircle className="h-3.5 w-3.5" />
                      No permissions
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={totalRoles}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </div>
      </div>

      {showCreateModal && (
        <RoleModal
          role={null}
          permissions={permissions}
          canManagePermissions={canViewPermissions}
          onClose={() => setShowCreateModal(false)}
          onSave={(form) => handleSaveRole(form, null)}
        />
      )}
      {editingRole && (
        <RoleModal
          role={editingRole}
          permissions={permissions}
          canManagePermissions={canViewPermissions}
          onClose={() => setEditingRole(null)}
          onSave={(form) => handleSaveRole(form, editingRole)}
        />
      )}
      {rolePendingDelete && (
        <DeleteConfirmDialog
          title="Delete role?"
          description="This removes the role from the dashboard. Users assigned to this role may lose those permissions."
          itemLabel={rolePendingDelete.name}
          isDeleting={deletingId === rolePendingDelete.id}
          error={deleteDialogError}
          confirmLabel="Delete Role"
          onClose={() => {
            if (deletingId === null) {
              setDeleteDialogError("");
              setRolePendingDelete(null);
            }
          }}
          onConfirm={() => void handleDelete(rolePendingDelete)}
        />
      )}
    </>
  );
}
