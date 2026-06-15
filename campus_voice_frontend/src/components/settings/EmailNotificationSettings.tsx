"use client";

import { useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import {
  getAdminEmailSetting,
  updateAdminEmailSetting,
  type AdminEmailSetting,
} from "@/lib/admin-api";

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

function formatSettingDate(iso: string | null) {
  if (!iso) return "";

  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emailSettingStatus(setting: AdminEmailSetting | null) {
  if (!setting?.ticket_notification_email) {
    return "No notification email configured. New ticket emails may be skipped.";
  }

  if (!setting.updated_at) {
    return "Using default email from server configuration.";
  }

  const updatedBy = setting.updated_by ?? "an admin";
  return `Last updated by ${updatedBy} on ${formatSettingDate(setting.updated_at)}.`;
}

export function EmailNotificationSettings() {
  const [notificationEmail, setNotificationEmail] = useState("");
  const [emailSetting, setEmailSetting] = useState<AdminEmailSetting | null>(
    null,
  );
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSaved, setEmailSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEmailSetting() {
      setEmailLoading(true);
      setEmailError(null);

      try {
        const data = await getAdminEmailSetting();
        if (!isMounted) return;
        setEmailSetting(data);
        setNotificationEmail(data.ticket_notification_email ?? "");
      } catch {
        if (isMounted) {
          setEmailError("Unable to load notification email.");
        }
      } finally {
        if (isMounted) setEmailLoading(false);
      }
    }

    loadEmailSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  function flashSaved() {
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2500);
  }

  async function handleSaveEmailSetting() {
    const email = notificationEmail.trim();

    if (!email) {
      setEmailError("Notification email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailSaving(true);
    setEmailError(null);

    try {
      const updated = await updateAdminEmailSetting(email);
      setEmailSetting(updated);
      setNotificationEmail(updated.ticket_notification_email ?? "");
      flashSaved();
    } catch {
      setEmailError("Unable to update notification email.");
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <Section
      icon={<Mail className="h-5 w-5 text-slate-600" />}
      title="Email Notifications"
      description="Set the inbox that receives new ticket notifications."
    >
      {emailLoading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Loading notification email...
        </div>
      )}
      <FieldRow label="Ticket notifications">
        <TextInput
          id="ticket-notification-email"
          type="email"
          value={notificationEmail}
          onChange={(value) => {
            setNotificationEmail(value);
            if (emailError) setEmailError(null);
          }}
          placeholder="admin@campus-voice.xyz"
          disabled={emailLoading || emailSaving}
        />
      </FieldRow>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-600">
          {emailSettingStatus(emailSetting)}
        </p>
        {emailSetting?.ticket_notification_email && (
          <p className="mt-1 text-xs text-slate-500">
            New ticket notifications are sent to{" "}
            <span className="font-medium text-slate-700">
              {emailSetting.ticket_notification_email}
            </span>
            .
          </p>
        )}
      </div>

      {emailError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {emailError}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveEmailSetting}
          disabled={emailLoading || emailSaving}
          className="rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {emailSaving ? "Saving..." : "Save email"}
        </button>
        <SavedBadge visible={emailSaved} />
      </div>
    </Section>
  );
}
