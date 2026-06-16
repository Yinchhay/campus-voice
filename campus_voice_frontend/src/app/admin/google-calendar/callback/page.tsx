"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { CalendarCheck, Loader2, TriangleAlert } from "lucide-react";
import { completeGoogleCalendarConnection } from "@/lib/staff-api";
import { normalizeCampusVoiceRole } from "@/lib/auth-routes";

type CallbackState = "loading" | "success" | "error";

function settingsPathForCurrentRole(role?: string | null) {
  return role === "staff" ? "/staff/settings" : "/admin/settings";
}

export default function GoogleCalendarCallbackPage() {
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState("Connecting Google Calendar...");
  const [settingsPath, setSettingsPath] = useState("/admin/settings");

  useEffect(() => {
    let isMounted = true;

    async function redirectToSettings(result: "connected" | "failed", delay: number) {
      const session = await getSession();
      const role = normalizeCampusVoiceRole(session?.user?.role);
      const path = settingsPathForCurrentRole(role);
      if (isMounted) setSettingsPath(path);

      window.setTimeout(() => {
        window.location.assign(`${path}?calendar=${result}`);
      }, delay);
    }

    async function completeConnection() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setState("error");
        setMessage("Google Calendar authorization was cancelled or denied.");
        await redirectToSettings("failed", 1800);
        return;
      }

      if (!code) {
        setState("error");
        setMessage("Missing Google authorization code.");
        await redirectToSettings("failed", 1800);
        return;
      }

      try {
        await completeGoogleCalendarConnection(code);
        if (!isMounted) return;
        setState("success");
        setMessage("Google Calendar connected successfully.");
        await redirectToSettings("connected", 900);
      } catch {
        if (!isMounted) return;
        setState("error");
        setMessage("Unable to connect Google Calendar.");
        await redirectToSettings("failed", 1800);
      }
    }

    completeConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600"
              : state === "error"
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-[#1E3A8A]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isSuccess ? (
            <CalendarCheck className="h-6 w-6" />
          ) : (
            <TriangleAlert className="h-6 w-6" />
          )}
        </div>
        <h1 className="mt-5 text-lg font-semibold text-slate-900">
          Google Calendar
        </h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {state === "error" && (
          <Link
            href={settingsPath}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Back to settings
          </Link>
        )}
      </div>
    </main>
  );
}
