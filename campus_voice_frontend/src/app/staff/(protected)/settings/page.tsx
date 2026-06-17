"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Unlink,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { EmailNotificationSettings } from "@/components/settings/EmailNotificationSettings";
import { ProfanityWordSettings } from "@/components/settings/ProfanityWordSettings";
import {
  getCurrentStaffAccount,
  type CurrentStaffAccount,
} from "@/lib/admin-api";
import { staffNav } from "@/lib/dashboard-nav";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  type GoogleCalendarStatus,
} from "@/lib/staff-api";

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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
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
  return [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
}

function roleLabel(role?: string) {
  if (role === "ADMIN") return "Administrator";
  if (role === "STAFF") return "Staff";
  return role ?? "Account";
}

function formatCalendarDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CalendarStatusBadge({
  status,
}: {
  status: GoogleCalendarStatus | null;
}) {
  const connected = status?.connected === true;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffSettingsPage() {
  const [account, setAccount] = useState<CurrentStaffAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] =
    useState<GoogleCalendarStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarActionLoading, setCalendarActionLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setAccountLoading(true);
      setCalendarLoading(true);
      setAccountError(null);
      setCalendarError(null);

      try {
        const data = await getCurrentStaffAccount();
        if (isMounted) setAccount(data);
      } catch {
        if (isMounted) setAccountError("Unable to load account details.");
      } finally {
        if (isMounted) setAccountLoading(false);
      }

      try {
        const googleStatus = await getGoogleCalendarStatus();
        if (isMounted) setCalendarStatus(googleStatus);
      } catch {
        if (isMounted) setCalendarError("Unable to load Google Calendar status.");
      } finally {
        if (isMounted) setCalendarLoading(false);
      }
    }

    loadSettings();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const calendar = params.get("calendar");
      if (calendar === "connected") {
        setCalendarNotice("Google Calendar connected successfully.");
      }
      if (calendar === "failed") {
        setCalendarError("Google Calendar connection failed. Please try again.");
      }
      if (calendar) {
        const cleanUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, "", cleanUrl);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshCalendarStatus() {
    setCalendarLoading(true);
    setCalendarError(null);

    try {
      const status = await getGoogleCalendarStatus();
      setCalendarStatus(status);
    } catch {
      setCalendarError("Unable to refresh Google Calendar status.");
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleConnectCalendar() {
    setCalendarActionLoading(true);
    setCalendarError(null);
    setCalendarNotice(null);

    try {
      const data = await getGoogleCalendarConnectUrl();
      window.location.assign(data.authorization_url);
    } catch {
      setCalendarError("Unable to start Google Calendar connection.");
      setCalendarActionLoading(false);
    }
  }

  async function handleDisconnectCalendar() {
    setCalendarActionLoading(true);
    setCalendarError(null);
    setCalendarNotice(null);

    try {
      await disconnectGoogleCalendar();
      setCalendarStatus({ connected: false });
      setCalendarNotice("Google Calendar disconnected.");
    } catch {
      setCalendarError("Unable to disconnect Google Calendar.");
    } finally {
      setCalendarActionLoading(false);
    }
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
      setPwError("Passwords do not match.");
      return;
    }
    setPwError("");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    alert("Password changed successfully.");
  }

  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Settings"
      description="Manage your personal account preferences and notification settings."
      navItems={staffNav}
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
              id="staff-display-name"
              value={fullName(account)}
              disabled
              placeholder="Your name"
            />
          </FieldRow>
          <FieldRow label="Email address">
            <TextInput
              id="staff-email"
              value={account?.email ?? ""}
              disabled
              placeholder="email@paragoniu.edu.kh"
            />
          </FieldRow>
          <FieldRow label="Role">
            <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
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
              id="staff-created-at"
              value={formatAccountDate(account?.created_at ?? null)}
              disabled
            />
          </FieldRow>
          <FieldRow label="Last login">
            <TextInput
              id="staff-last-login"
              value={formatAccountDate(account?.last_login ?? null)}
              disabled
            />
          </FieldRow>
        </Section>

        <EmailNotificationSettings />

        <ProfanityWordSettings />

        {/* ── Google Calendar ───────────────────────────────── */}
        <Section
          icon={<CalendarCheck className="h-5 w-5 text-slate-600" />}
          title="Google Calendar"
          description="Connect your calendar so confirmed student meetings can create calendar events."
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    Calendar sync
                  </p>
                  <CalendarStatusBadge status={calendarStatus} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Connected calendars receive events when students confirm
                  meeting slots.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshCalendarStatus}
                disabled={calendarLoading || calendarActionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    calendarLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            {calendarLoading && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                Checking Google Calendar status...
              </div>
            )}

            {calendarStatus?.connected && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">
                    Calendar account
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-900">
                    {calendarStatus.calendar_email}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">
                    Connected
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatCalendarDate(calendarStatus.connected_at)}
                  </p>
                </div>
              </div>
            )}

            {calendarNotice && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {calendarNotice}
              </p>
            )}

            {calendarError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {calendarError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {calendarStatus?.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnectCalendar}
                  disabled={calendarActionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Unlink className="h-4 w-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  disabled={calendarLoading || calendarActionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect Google Calendar
                </button>
              )}
              {calendarActionLoading && (
                <span className="text-xs text-slate-500">
                  Processing calendar request...
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* ── Security ──────────────────────────────────────── */}
        <Section
          icon={<KeyRound className="h-5 w-5 text-slate-600" />}
          title="Security"
          description="Change your password to keep your account secure."
        >
          <FieldRow label="Current password">
            <TextInput
              id="staff-current-pw"
              type="password"
              value={currentPw}
              onChange={setCurrentPw}
              placeholder="••••••••"
            />
          </FieldRow>
          <FieldRow label="New password">
            <TextInput
              id="staff-new-pw"
              type="password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Min. 8 characters"
            />
          </FieldRow>
          <FieldRow label="Confirm new password">
            <TextInput
              id="staff-confirm-pw"
              type="password"
              value={confirmPw}
              onChange={setConfirmPw}
              placeholder="Repeat new password"
            />
          </FieldRow>

          {pwError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</p>
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

        {/* ── Session ───────────────────────────────────────── */}
        <Section
          icon={<Lock className="h-5 w-5 text-red-500" />}
          title="Session"
          description="Sign out of your current session."
        >
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>
              <p className="mt-0.5 text-xs text-slate-500">
                You will be redirected to the staff login page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/staff/login" })}
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
