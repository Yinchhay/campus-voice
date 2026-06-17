"use client";

import axios from "axios";
import { useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { changeAdminPassword } from "@/lib/admin-api";

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("detail" in data && typeof data.detail === "string") return data.detail;

    const firstFieldError = Object.values(data).find(Array.isArray);
    if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") {
      return firstFieldError[0];
    }
  }

  return fallback;
}

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

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <input
      id={id}
      type="password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={
        id.includes("current") ? "current-password" : "new-password"
      }
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

export function ChangePasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function clearMessages() {
    if (error) setError(null);
    if (success) setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All password fields are required.");
      setSuccess(null);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      setSuccess(null);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setSuccess(null);
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await changeAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess(response.message || "Password updated successfully.");
    } catch (submitError) {
      setError(extractApiError(submitError, "Unable to update password."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <KeyRound className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Security</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Update your password for this dashboard account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldRow label="Current password">
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value);
              clearMessages();
            }}
            placeholder="Current password"
            disabled={isSaving}
          />
        </FieldRow>
        <FieldRow label="New password">
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              clearMessages();
            }}
            placeholder="Min. 8 characters"
            disabled={isSaving}
          />
        </FieldRow>
        <FieldRow label="Confirm new password">
          <PasswordInput
            id="confirm-new-password"
            value={confirmNewPassword}
            onChange={(value) => {
              setConfirmNewPassword(value);
              clearMessages();
            }}
            placeholder="Repeat new password"
            disabled={isSaving}
          />
        </FieldRow>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            {success}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Changing password..." : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}
