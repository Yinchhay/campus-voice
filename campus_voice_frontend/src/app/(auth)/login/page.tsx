"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, ShieldCheck } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Sign-in failed. Please use your @paragon.edu.kh account.",
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in callback failed. Please try again.",
  Callback: "Sign-in callback failed. Please try again.",
  OAuthAccountNotLinked:
    "This Google account is already linked differently. Try a different account.",
  Configuration: "Authentication is temporarily unavailable. Please try again.",
  Default: "Unable to sign in right now. Please try again.",
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const errorMessage = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/student/dashboard" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified Anonymity Enabled
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Campus Voice
            </h1>
            <p className="mt-4 max-w-prose text-slate-600">
              Submit feedback and incident reports safely. Your institutional sign-in verifies
              identity for anti-spam, while staff only see anonymous report details.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>Anonymous tracking ID for every submission</li>
              <li>Clear status pipeline: Submitted → In Review → In Progress → Resolved</li>
              <li>Restricted to Paragon institutional accounts</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-[#1E3A8A] p-6 text-white shadow-lg sm:p-10">
            <h2 className="text-2xl font-semibold">Sign in with Google</h2>
            <p className="mt-3 text-blue-100">
              Use your @paragon.edu.kh account to continue.
            </p>

            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Redirecting..." : "Continue with Google"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-xs text-blue-100/90">
              If your account is not from paragon.edu.kh, access will be denied.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}