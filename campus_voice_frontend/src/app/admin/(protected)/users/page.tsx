"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminRoles,
  listAdminUsers,
  updateAdminUser,
  type AdminRoleDetail,
  type AdminUser,
} from "@/lib/admin-api";
import { adminNav } from "../dashboard/page";
import { useAdminPermissions } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

// ---------------------------------------------------------------------------
// Auth method helpers
// ---------------------------------------------------------------------------
/** Students always use Google SSO; staff/admin use username + password. */
function authMethod(user: AdminUser): "google" | "credentials" {
  if (user.role === "STUDENT") return "google";
  return "credentials";
}

const roleBadge: Record<UserRole, string> = {
  STUDENT: "bg-blue-50 text-blue-700 border-blue-200",
  STAFF: "bg-teal-50 text-teal-700 border-teal-200",
  ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
};

const roleIcon: Record<UserRole, React.ReactNode> = {
  STUDENT: <UserCircle className="h-3.5 w-3.5" />,
  STAFF: <Users className="h-3.5 w-3.5" />,
  ADMIN: <ShieldCheck className="h-3.5 w-3.5" />,
};

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    if ("message" in data && typeof data.message === "string")
      return data.message;
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Create Staff Modal
// ---------------------------------------------------------------------------
type CreateStaffForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "STAFF" | "ADMIN";
  roleIds: number[];
};

const emptyForm: CreateStaffForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STAFF",
  roleIds: [],
};

function CreateStaffModal({
  onClose,
  onCreate,
  roles,
}: {
  onClose: () => void;
  onCreate: (form: CreateStaffForm) => Promise<AdminUser>;
  roles: AdminRoleDetail[];
}) {
  const [form, setForm] = useState<CreateStaffForm>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateStaffForm, string>>
  >({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [created, setCreated] = useState<AdminUser | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof CreateStaffForm>(
    key: K,
    value: CreateStaffForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function useTempPassword() {
    const pw = generateTempPassword();
    setForm((prev) => ({ ...prev, password: pw, confirmPassword: pw }));
    setErrors((prev) => ({
      ...prev,
      password: undefined,
      confirmPassword: undefined,
    }));
  }

  function toggleRole(roleId: number) {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Minimum 8 characters.";
    if (!form.confirmPassword)
      next.confirmPassword = "Please confirm the password.";
    else if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const newUser = await onCreate(form);
      setCreated(newUser);
    } catch (error) {
      setSubmitError(extractApiError(error, "Failed to create account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A8A]">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Create Staff Account
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

        {/* Body */}
        <div className="px-6 py-5">
          {created ? (
            /* ── Success state ── */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Account created
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Share these credentials with the new staff member securely.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadge[created.role]}`}
                  >
                    {roleIcon[created.role]}
                    {created.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-900">
                    {created.full_name ||
                      [created.first_name, created.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      created.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900">
                    {created.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password</span>
                  <span className="font-mono font-medium text-slate-900">
                    {form.password}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
                <AlertCircle className="mb-0.5 mr-1.5 inline h-3.5 w-3.5" />
                This password is shown once. Please copy it now before closing.
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["STAFF", "ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role", r)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                        form.role === r
                          ? r === "STAFF"
                            ? "border-teal-300 bg-teal-50 text-teal-700"
                            : "border-violet-300 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {roleIcon[r]}
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-first-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    First name
                  </label>
                  <input
                    id="new-first-name"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Campus"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-last-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Last name
                  </label>
                  <input
                    id="new-last-name"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Staff"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {form.role === "STAFF" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    RBAC roles
                  </label>
                  <div className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {roles.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-slate-500">
                        No roles available.
                      </p>
                    ) : (
                      roles
                        .filter((role) => role.is_active && !role.is_superadmin)
                        .map((role) => {
                          const checked = form.roleIds.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => toggleRole(role.id)}
                              className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                                checked
                                  ? "border-[#1E3A8A] bg-white text-slate-900"
                                  : "border-transparent bg-transparent text-slate-700 hover:bg-white"
                              }`}
                            >
                              <span>
                                <span className="block text-sm font-medium">{role.name}</span>
                                {role.description && (
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    {role.description}
                                  </span>
                                )}
                              </span>
                              <span
                                className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                                  checked
                                    ? "border-[#1E3A8A] bg-[#1E3A8A]"
                                    : "border-slate-300 bg-white"
                                }`}
                              />
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="new-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="sarah.oss@paragoniu.edu.kh"
                  className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#1E3A8A] focus:ring-blue-100"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="new-password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Temporary password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={useTempPassword}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:text-blue-700"
                  >
                    <KeyRound className="h-3 w-3" />
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 pr-10 font-mono text-sm text-slate-800 placeholder-slate-400 placeholder:font-sans outline-none transition focus:bg-white focus:ring-2 ${
                      errors.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#1E3A8A] focus:ring-blue-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 pr-10 font-mono text-sm text-slate-800 placeholder-slate-400 placeholder:font-sans outline-none transition focus:bg-white focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#1E3A8A] focus:ring-blue-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManageUserRolesModal({
  user,
  roles,
  onClose,
  onSave,
}: {
  user: AdminUser;
  roles: AdminRoleDetail[];
  onClose: () => void;
  onSave: (roleIds: number[]) => Promise<void>;
}) {
  const [roleIds, setRoleIds] = useState<number[]>((user.roles ?? []).map((role) => role.id));
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  function toggleRole(roleId: number) {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  }

  async function handleSave() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onSave(roleIds);
      onClose();
    } catch (error) {
      setSubmitError(extractApiError(error, "Failed to update roles."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A8A]">
              <SlidersHorizontal className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Manage roles</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {user.role === "ADMIN" ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              Admin platform accounts bypass RBAC permission checks.
            </div>
          ) : null}

          <div className="grid max-h-80 gap-2 overflow-y-auto">
            {roles.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No roles available.
              </div>
            ) : (
              roles.map((role) => {
                const checked = roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    disabled={role.is_superadmin && user.role !== "ADMIN"}
                    className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      checked
                        ? "border-[#1E3A8A] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        {role.name}
                        {role.is_superadmin && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                            Superadmin
                          </span>
                        )}
                      </span>
                      {role.description && (
                        <span className="mt-1 block text-xs text-slate-500">
                          {role.description}
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                        checked ? "border-[#1E3A8A] bg-[#1E3A8A]" : "border-slate-300 bg-white"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save roles"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminUsersPage() {
  const { hasPermission, isLoading: isPermissionLoading } = useAdminPermissions();
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRoleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (isPermissionLoading) return;

    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setPageError("");
      try {
        const [userRows, roleRows] = await Promise.all([
          listAdminUsers(),
          hasPermission("role.view") ? listAdminRoles() : Promise.resolve([]),
        ]);
        if (isMounted) {
          setUsers(userRows);
          setRoles(roleRows);
        }
      } catch (error) {
        if (isMounted)
          setPageError(extractApiError(error, "Failed to load users."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isPermissionLoading, hasPermission]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.email.toLowerCase().includes(q) &&
          !(u.full_name ?? "").toLowerCase().includes(q) &&
          !(u.first_name ?? "").toLowerCase().includes(q) &&
          !(u.last_name ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  async function handleCreateUser(form: CreateStaffForm) {
    const user = await createAdminUser({
      email: form.email.trim(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      role: form.role,
      password: form.password,
      is_active: true,
      is_staff: true,
      role_ids: form.role === "STAFF" ? form.roleIds : [],
    });
    setUsers((prev) => [user, ...prev]);
    return user;
  }

  async function toggleActive(user: AdminUser) {
    setUpdatingId(user.id);
    setPageError("");
    try {
      const updated = await updateAdminUser(user.id, {
        is_active: !user.is_active,
      });
      setUsers((prev) =>
        prev.map((row) => (row.id === user.id ? updated : row)),
      );
    } catch (error) {
      setPageError(extractApiError(error, "Failed to update user status."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Delete ${user.email}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    setPageError("");
    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((row) => row.id !== user.id));
    } catch (error) {
      setPageError(extractApiError(error, "Failed to delete user."));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdateUserRoles(user: AdminUser, roleIds: number[]) {
    const updated = await updateAdminUser(user.id, { role_ids: roleIds });
    setUsers((prev) => prev.map((row) => (row.id === user.id ? updated : row)));
  }

  const roleTabs: Array<{
    key: UserRole | "ALL";
    label: string;
    count: number;
  }> = [
    { key: "ALL", label: "All", count: users.length },
    {
      key: "STAFF",
      label: "Staff",
      count: users.filter((u) => u.role === "STAFF").length,
    },
    {
      key: "ADMIN",
      label: "Admins",
      count: users.filter((u) => u.role === "ADMIN").length,
    },
  ];

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="User Management"
      description="Students log in via Google SSO. Staff and admin accounts are created here with username and password credentials."
      navItems={adminNav}
    >
      <div className="space-y-5">
        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* ── Filters + Create button ───────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roleTabs.map((tab) => {
              const isActiveTab = roleFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActiveTab
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      isActiveTab
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {hasPermission("user.create") && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Staff Account
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-800">{filtered.length}</span>{" "}
          user
          {filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Table ────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Column headers */}
          <div suppressHydrationWarning className="hidden items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[minmax(220px,2fr)_120px_120px_120px_104px_132px]">
            <span>Account</span>
            <span>Role</span>
            <span>Last Login</span>
            <span>Joined</span>
            <span suppressHydrationWarning className="text-center">Status</span>
            <span suppressHydrationWarning className="text-center">Action</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              {isLoading
                ? "Loading users..."
                : "No users match the current filters."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const active = user.is_active;
                const method = authMethod(user);

                return (
                  <div
                    key={user.id}
                    className={`flex flex-col gap-3 px-5 py-4 transition sm:grid sm:grid-cols-[minmax(220px,2fr)_120px_120px_120px_104px_132px] sm:items-center sm:gap-4 ${
                      !active ? "opacity-60" : ""
                    }`}
                  >
                    {/* Account column */}
                    <div>
                      {/* Username (staff/admin) or email (student) as primary identifier */}
                      {method === "credentials" ? (
                        <>
                          <p className="text-sm font-medium text-slate-900">
                            {user.full_name ||
                              [user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ") ||
                              user.email}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {user.email}
                          </p>
                          {user.roles && user.roles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                >
                                  {role.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-medium text-slate-900">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {/* Role badge */}
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge[user.role]}`}
                    >
                      {roleIcon[user.role]}
                      {user.role}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatDate(user.last_login)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(user.created_at)}
                    </span>

                    {/* Active toggle — students cannot be manually deactivated here */}
                    {method === "credentials" ? (
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        disabled={
                          updatingId === user.id ||
                          deletingId === user.id ||
                          !hasPermission("user.update")
                        }
                        title={
                          active ? "Deactivate account" : "Activate account"
                        }
                        className={`inline-flex h-8 w-[104px] items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        {active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {updatingId === user.id
                          ? "Saving..."
                          : active
                            ? "Active"
                            : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex h-8 w-[104px] items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-medium ${
                          active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                        title="Student accounts are managed via Google"
                      >
                        {active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {active ? "Active" : "Inactive"}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1.5 sm:justify-center">
                      {hasPermission("user.update") && hasPermission("role.view") && (
                        <button
                          type="button"
                          onClick={() => setRoleUser(user)}
                          disabled={deletingId === user.id || updatingId === user.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Manage roles"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {hasPermission("user.delete") && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={
                            deletingId === user.id || updatingId === user.id
                          }
                          className="inline-flex h-8 w-[84px] items-center justify-center rounded-full border border-red-200 bg-white px-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Staff Modal ─────────────────────────────── */}
      {showModal && (
        <CreateStaffModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateUser}
          roles={roles}
        />
      )}
      {roleUser && (
        <ManageUserRolesModal
          user={roleUser}
          roles={roles}
          onClose={() => setRoleUser(null)}
          onSave={(roleIds) => handleUpdateUserRoles(roleUser, roleIds)}
        />
      )}
    </RoleDashboardShell>
  );
}
