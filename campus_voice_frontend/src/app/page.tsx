import { auth } from "@/lib/auth";
import { dashboardPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  const role = normalizeCampusVoiceRole(session?.user?.role);

  if (session?.accessToken && role) {
    redirect(dashboardPathForRole(role));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="Campus Voice logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Campus Voice
            </span>
          </Link>

          {/* Get Started */}
          <Link
            href="/login"
            id="nav-get-started"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1e40af] hover:shadow-md"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-24 pt-20 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
          Restricted to Paragon International University
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Your voice,{" "}
          <span className="text-[#1E3A8A]">heard anonymously</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Campus Voice lets Paragon students submit feedback and incident
          reports safely. Your institutional sign-in verifies identity for
          anti-spam — staff only ever see anonymous report details.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            id="hero-get-started"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1e40af] hover:shadow-lg"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            Learn more
          </a>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            How it works
          </h2>
          <p className="mt-3 text-slate-500">
            Three simple steps from concern to resolution.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A8A]/8 text-[#1E3A8A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Step 01
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Sign in securely
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Log in with your @paragoniu.edu.kh Google account. Your identity
              is used only to prevent spam — it is never shared with staff.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A8A]/8 text-[#1E3A8A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Step 02
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Submit a report
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Describe your concern, pick a category, and submit. Each report
              gets a unique anonymous tracking ID so you stay in control.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A8A]/8 text-[#1E3A8A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Step 03
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Track progress
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Follow your report through the full pipeline — Submitted, In
              Review, In Progress, and Resolved — all without revealing who
              you are.
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy callout ── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#1E3A8A] px-8 py-12 text-center text-white shadow-lg sm:px-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            Privacy by design
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Staff never see your name
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Campus Voice uses your institutional account only to issue an
            anonymous tracking ID. The moment a report is created, your
            personal details are decoupled from the case — so you can speak
            freely.
          </p>
          <Link
            href="/login"
            id="cta-get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1E3A8A] shadow-md transition-all duration-200 hover:bg-slate-50 hover:shadow-lg"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Campus Voice"
              width={22}
              height={22}
              className="h-5 w-5 object-contain opacity-60"
            />
            <span>Campus Voice — Paragon International University</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
