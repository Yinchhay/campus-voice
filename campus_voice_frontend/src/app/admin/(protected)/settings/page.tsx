"use client";

import { useEffect, useState } from "react";
import {
  Check,
  KeyRound,
  Lock,
  LogOut,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { EmailNotificationSettings } from "@/components/settings/EmailNotificationSettings";
import {
  getCurrentStaffAccount,
  type CurrentStaffAccount,
} from "@/lib/admin-api";
import { adminNav } from "@/lib/admin-nav";

// ---------------------------------------------------------------------------
// Shared toggle component
// ---------------------------------------------------------------------------
function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors ${
        checked
          ? "border-[#1E3A8A] bg-[#1E3A8A]"
          : "border-slate-300 bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="sm:w-72">{children}</div>
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  id: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function formatAccountDate(iso: string | null) {
  if (!iso) return "Never";

  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fullName(account: CurrentStaffAccount | null) {
  if (!account) return "";
  return (
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    account.email
  );
}

function roleLabel(role?: string) {
  if (role === "ADMIN") return "Administrator";
  if (role === "STAFF") return "Staff";
  return role ?? "Account";
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved toast
// ---------------------------------------------------------------------------
function SavedBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Check className="h-3.5 w-3.5" />
      Saved
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminSettingsPage() {
  const [account, setAccount] = useState<CurrentStaffAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Platform
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  // Saved state
  const [platformSaved, setPlatformSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      setAccountLoading(true);
      setAccountError(null);

      try {
        const data = await getCurrentStaffAccount();
        if (isMounted) setAccount(data);
      } catch {
        if (isMounted) setAccountError("Unable to load account details.");
      } finally {
        if (isMounted) setAccountLoading(false);
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2500);
  }

  function handleSavePlatform() {
    flash(setPlatformSaved);
  }

  function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All password fields are required.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwError("");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    // In production: call API
    alert("Password changed successfully.");
  }

  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Settings"
      description="Manage your account, notification preferences, and platform-wide configuration."
      navItems={adminNav}
    >
      <div className="max-w-2xl space-y-6">
        {/* ── Profile ───────────────────────────────────────── */}
        <Section
          icon={<User className="h-5 w-5 text-slate-600" />}
          title="Account"
          description="Current signed-in account details."
        >
          {accountLoading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Loading account details...
            </div>
          )}
          {accountError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {accountError}
            </div>
          )}
          <FieldRow label="Display name">
            <TextInput
              id="admin-display-name"
              value={fullName(account)}
              disabled
              placeholder="Your name"
            />
          </FieldRow>
          <FieldRow label="Email address">
            <TextInput
              id="admin-email"
              value={account?.email ?? ""}
              disabled
              placeholder="email@paragoniu.edu.kh"
            />
          </FieldRow>
          <FieldRow label="Role">
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">
                {roleLabel(account?.role)}
              </span>
            </div>
          </FieldRow>
          <FieldRow label="Status">
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                account?.is_active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {account?.is_active ? "Active" : "Inactive"}
            </div>
          </FieldRow>
          <FieldRow label="Created">
            <TextInput
              id="admin-created-at"
              value={formatAccountDate(account?.created_at ?? null)}
              disabled
            />
          </FieldRow>
          <FieldRow label="Last login">
            <TextInput
              id="admin-last-login"
              value={formatAccountDate(account?.last_login ?? null)}
              disabled
            />
          </FieldRow>
        </Section>

        <EmailNotificationSettings />

        {/* ── Platform configuration ────────────────────────── */}
        <Section
          icon={<Shield className="h-5 w-5 text-slate-600" />}
          title="Platform Configuration"
          description="Global settings that affect all users on Campus Voice."
        >
          <ToggleRow
            id="allow-anonymous"
            label="Allow anonymous submissions"
            description="Students without a linked account can still submit reports."
            checked={allowAnonymous}
            onChange={setAllowAnonymous}
          />
          <ToggleRow
            id="auto-escalate"
            label="Auto-escalate stale tickets"
            description="Automatically raise priority of tickets unresolved after 72 hours."
            checked={autoEscalate}
            onChange={setAutoEscalate}
          />

          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <ToggleRow
              id="maintenance-mode"
              label="Maintenance mode"
              description="Disables new ticket submissions and shows a maintenance notice to students."
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
            />
            {maintenanceMode && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
                ⚠ Maintenance mode is ON — students cannot submit new reports.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSavePlatform}
              className="rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
            >
              Save configuration
            </button>
            <SavedBadge visible={platformSaved} />
          </div>
        </Section>

        {/* ── Security ──────────────────────────────────────── */}
        <Section
          icon={<KeyRound className="h-5 w-5 text-slate-600" />}
          title="Security"
          description="Update your password and manage account access."
        >
          <FieldRow label="Current password">
            <TextInput
              id="admin-current-pw"
              type="password"
              value={currentPw}
              onChange={setCurrentPw}
              placeholder="••••••••"
            />
          </FieldRow>
          <FieldRow label="New password">
            <TextInput
              id="admin-new-pw"
              type="password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Min. 8 characters"
            />
          </FieldRow>
          <FieldRow label="Confirm new password">
            <TextInput
              id="admin-confirm-pw"
              type="password"
              value={confirmPw}
              onChange={setConfirmPw}
              placeholder="Repeat new password"
            />
          </FieldRow>

          {pwError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {pwError}
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleChangePassword}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Change password
            </button>
          </div>
        </Section>

        {/* ── Danger zone ───────────────────────────────────── */}
        <Section
          icon={<Lock className="h-5 w-5 text-red-500" />}
          title="Session"
          description="Sign out of all active sessions."
        >
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>
              <p className="mt-0.5 text-xs text-slate-500">
                You will be redirected to the admin login page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </Section>
      </div>
    </RoleDashboardShell>
  );
}
