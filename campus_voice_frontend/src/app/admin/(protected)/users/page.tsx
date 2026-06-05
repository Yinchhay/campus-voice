"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { mockUsers } from "@/lib/mock-data";
import { adminNav } from "../dashboard/page";
import type { User, UserRole } from "@/lib/types";

// ---------------------------------------------------------------------------
// Auth method helpers
// ---------------------------------------------------------------------------
/** Students always use Google SSO; staff/admin use username + password. */
function authMethod(user: User): "google" | "credentials" {
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
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ---------------------------------------------------------------------------
// Create Staff Modal
// ---------------------------------------------------------------------------
type CreateStaffForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "STAFF" | "ADMIN";
};

const emptyForm: CreateStaffForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STAFF",
};

function CreateStaffModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (user: User) => void;
}) {
  const [form, setForm] = useState<CreateStaffForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateStaffForm, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [created, setCreated] = useState<User | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof CreateStaffForm>(key: K, value: CreateStaffForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function useTempPassword() {
    const pw = generateTempPassword();
    setForm((prev) => ({ ...prev, password: pw, confirmPassword: pw }));
    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.username.trim()) next.username = "Username is required.";
    else if (!/^[a-zA-Z0-9._-]+$/.test(form.username.trim()))
      next.username = "Only letters, numbers, dots, hyphens and underscores.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Minimum 8 characters.";
    if (!form.confirmPassword) next.confirmPassword = "Please confirm the password.";
    else if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: form.username.trim(),
      email: form.email.trim() || `${form.username.trim()}@paragoniu.edu.kh`,
      role: form.role,
      is_active: true,
      created_at: now,
      last_login: null,
    };
    setCreated(newUser);
    onCreate(newUser);
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
            <h2 className="text-base font-semibold text-slate-900">Create Staff Account</h2>
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
                <h3 className="text-base font-semibold text-slate-900">Account created</h3>
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
                  <span className="text-slate-500">Username</span>
                  <span className="font-mono font-medium text-slate-900">{created.username}</span>
                </div>
                {created.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900">{created.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Password</span>
                  <span className="font-mono font-medium text-slate-900">{form.password}</span>
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
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
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

              {/* Username */}
              <div>
                <label htmlFor="new-username" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="e.g. sarah.oss"
                  className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.username
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#1E3A8A] focus:ring-blue-100"
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Email (optional) */}
              <div>
                <label htmlFor="new-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email{" "}
                  <span className="font-normal text-slate-400">(optional — defaults to username@paragoniu.edu.kh)</span>
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
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
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
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
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
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [localActive, setLocalActive] = useState<Record<string, boolean>>({});
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);

  const allUsers = useMemo(() => [...localUsers, ...mockUsers], [localUsers]);

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.email.toLowerCase().includes(q) &&
          !(u.username ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allUsers, roleFilter, search]);

  function isActive(userId: string, defaultValue: boolean) {
    return localActive[userId] ?? defaultValue;
  }

  function toggleActive(userId: string, defaultValue: boolean) {
    setLocalActive((prev) => ({
      ...prev,
      [userId]: !(prev[userId] ?? defaultValue),
    }));
  }

  const roleTabs: Array<{ key: UserRole | "ALL"; label: string; count: number }> = [
    { key: "ALL", label: "All", count: allUsers.length },
    { key: "STUDENT", label: "Students", count: allUsers.filter((u) => u.role === "STUDENT").length },
    { key: "STAFF", label: "Staff", count: allUsers.filter((u) => u.role === "STAFF").length },
    { key: "ADMIN", label: "Admins", count: allUsers.filter((u) => u.role === "ADMIN").length },
  ];

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="User Management"
      description="Students log in via Google SSO. Staff and admin accounts are created here with username and password credentials."
      navItems={adminNav}
    >
      <div className="space-y-5">
        {/* ── Auth method info cards ────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Students */}
          <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              {/* Google SVG icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-label="Google">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Students — Google SSO</p>
              <p className="mt-0.5 text-xs text-blue-700">
                Students sign in with their <strong>@paragoniu.edu.kh</strong> Google account.
                Accounts are auto-created on first login — no manual provisioning needed.
              </p>
            </div>
          </div>

          {/* Staff / Admin */}
          <div className="flex items-start gap-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <KeyRound className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-900">Staff &amp; Admin — Credentials</p>
              <p className="mt-0.5 text-xs text-teal-700">
                Staff and admin accounts are provisioned by an administrator with a
                username, optional email, and temporary password.
              </p>
            </div>
          </div>
        </div>

        {/* ── Filters + Create button ───────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email…"
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
                      isActiveTab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Staff Account
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-800">{filtered.length}</span> user
          {filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Table ────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Column headers */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Account</span>
            <span>Role</span>
            <span>Auth</span>
            <span>Last Login</span>
            <span>Joined</span>
            <span>Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No users match the current filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const active = isActive(user.id, user.is_active);
                const method = authMethod(user);

                return (
                  <div
                    key={user.id}
                    className={`flex flex-col gap-3 px-5 py-4 transition sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4 ${
                      !active ? "opacity-60" : ""
                    }`}
                  >
                    {/* Account column */}
                    <div>
                      {/* Username (staff/admin) or email (student) as primary identifier */}
                      {method === "credentials" && user.username ? (
                        <>
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {user.username}
                          </p>
                          {user.email && (
                            <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{user.email}</p>
                      )}
                    </div>

                    {/* Role badge */}
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge[user.role]}`}
                    >
                      {roleIcon[user.role]}
                      {user.role}
                    </span>

                    {/* Auth method */}
                    {method === "google" ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {/* Mini Google G */}
                        <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google SSO
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <KeyRound className="h-3 w-3" />
                        Credentials
                      </span>
                    )}

                    <span className="text-xs text-slate-500">{formatDate(user.last_login)}</span>
                    <span className="text-xs text-slate-500">{formatDate(user.created_at)}</span>

                    {/* Active toggle — students cannot be manually deactivated here */}
                    {method === "credentials" ? (
                      <button
                        type="button"
                        onClick={() => toggleActive(user.id, user.is_active)}
                        title={active ? "Deactivate account" : "Activate account"}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
                        {active ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
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
          onCreate={(user) => {
            setLocalUsers((prev) => [user, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </RoleDashboardShell>
  );
}
