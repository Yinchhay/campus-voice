import { auth, signIn } from "@/lib/auth";
import { dashboardPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

async function signInWithGoogle() {
  "use server";

  await signIn("google", { redirectTo: "/student/dashboard" });
}

const impactStats = [
  { value: "01", label: "Submit concerns from anywhere on campus" },
  { value: "02", label: "Route requests to the right support team" },
  { value: "03", label: "Track every update until resolution" },
];

const workflowSteps = [
  {
    icon: LockKeyhole,
    label: "Verified access",
    title: "Sign in with your university account",
    description:
      "Campus Voice confirms eligible Paragon access before a ticket is created, reducing spam while keeping the report experience simple.",
  },
  {
    icon: MessageSquareText,
    label: "Organized reporting",
    title: "Share the concern with useful context",
    description:
      "Students can describe feedback, incidents, or service requests with categories that help staff understand urgency and ownership.",
  },
  {
    icon: CheckCircle2,
    label: "Transparent progress",
    title: "Follow the case from intake to resolution",
    description:
      "Each ticket moves through clear statuses so students know what has been received, reviewed, assigned, and resolved.",
  },
];

const trustPoints = [
  {
    icon: EyeOff,
    title: "Anonymous by default",
    text: "Identity verification protects the platform, while report details stay separated from the person submitting them.",
  },
  {
    icon: ClipboardList,
    title: "Structured intake",
    text: "Categories, descriptions, and statuses turn scattered concerns into work staff can prioritize and act on.",
  },
  {
    icon: Timer,
    title: "Visible accountability",
    text: "Students can see movement on their tickets instead of wondering whether a concern disappeared into email threads.",
  },
];

export default async function Home() {
  const session = await auth();
  const role = normalizeCampusVoiceRole(session?.user?.role);

  if (session?.accessToken && role) {
    redirect(dashboardPathForRole(role));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f3] text-[#12201d]">
      <nav className="sticky top-0 z-50 border-b border-[#12201d]/10 bg-[#f6f7f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-full transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
          >
            <Image
              src="/logo.png"
              alt="Campus Voice logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <div className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-[#12201d]">
                Campus Voice
              </span>
              <span className="hidden text-xs font-medium text-[#5c6b65] sm:block">
                Paragon International University
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="#how-it-works"
              className="hidden text-sm font-semibold text-[#43534d] transition hover:text-[#12201d] sm:inline-flex"
            >
              How it works
            </a>
            <form action={signInWithGoogle}>
              <button
                type="submit"
                id="nav-get-started"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ffb000] px-5 py-2.5 text-sm font-bold text-[#1b1606] shadow-[0_12px_30px_rgba(255,176,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffc247] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      <section className="relative border-b border-[#12201d]/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,176,0,0.22),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#f6f7f3_0%,#fffaf0_58%,#eef7f4_100%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#12201d]/10 bg-white/70 px-4 py-2 text-sm font-semibold text-[#43534d] shadow-sm">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#14b8a6]" />
              Restricted to Paragon International University
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.94] tracking-tight text-[#12201d] sm:text-6xl lg:text-7xl">
              Turn campus concerns into visible action.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4f625b] sm:text-xl">
              Campus Voice is a ticketing and feedback platform for students to
              report concerns, request services, and follow progress through a
              clear, organized, and privacy-conscious workflow.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  id="hero-get-started"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#1E3A8A] px-7 py-4 text-base font-bold text-white shadow-[0_18px_45px_rgba(30,58,138,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2447a7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffb000] sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </form>
              <a
                href="#how-it-works"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#12201d]/15 bg-white/80 px-7 py-4 text-base font-bold text-[#12201d] shadow-sm transition hover:-translate-y-0.5 hover:border-[#12201d]/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
              >
                Learn more
              </a>
            </div>

            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
              {impactStats.map((stat) => (
                <div
                  key={stat.value}
                  className="border-l-2 border-[#ffb000] bg-white/45 px-4 py-3"
                >
                  <p className="font-mono text-sm font-bold text-[#1E3A8A]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-[#43534d]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -left-4 top-10 h-24 w-24 rounded-full bg-[#ffb000]/25 blur-2xl" />
            <div className="absolute -right-8 bottom-14 h-32 w-32 rounded-full bg-[#14b8a6]/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-[#12201d]/10 bg-[#10231f] p-3 shadow-[0_30px_80px_rgba(18,32,29,0.28)]">
              <div className="rounded-[1.45rem] bg-[#f8faf7] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[#12201d]/10 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#688079]">
                      Ticket board
                    </p>
                    <h2 className="mt-1 text-xl font-black text-[#12201d]">
                      Student concerns
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#dff8f3] px-3 py-1 text-xs font-bold text-[#0f766e]">
                    Live workflow
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-[#12201d]/10 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#1E3A8A]">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-[#12201d]">
                            Library Wi-Fi issue
                          </h3>
                          <span className="rounded-full bg-[#fff1c6] px-3 py-1 text-xs font-bold text-[#8a5b00]">
                            In review
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#5c6b65]">
                          Category routed to IT support with an anonymous
                          tracking ID.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#12201d]/10 bg-white p-4">
                      <ShieldCheck
                        className="h-5 w-5 text-[#14b8a6]"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-2xl font-black text-[#12201d]">
                        4 stages
                      </p>
                      <p className="mt-1 text-sm text-[#5c6b65]">
                        Submitted, review, progress, resolved
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#12201d]/10 bg-[#1E3A8A] p-4 text-white">
                      <Sparkles className="h-5 w-5 text-[#ffcf66]" aria-hidden="true" />
                      <p className="mt-4 text-2xl font-black">Anonymous</p>
                      <p className="mt-1 text-sm text-blue-100">
                        Staff receive the case, not your identity
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-[#14b8a6]/60 bg-[#e9fbf7] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-[#0f766e]">
                          Next update
                        </p>
                        <p className="mt-1 font-bold text-[#12201d]">
                          Assigned staff can respond with status notes.
                        </p>
                      </div>
                      <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-sm sm:flex">
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-[#1E3A8A]">
              One organized flow
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#12201d] sm:text-4xl">
              From student report to staff resolution.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#5c6b65] lg:justify-self-end">
            The landing page mirrors the product promise: concerns should feel
            easy to raise, simple to follow, and structured enough for staff to
            manage without losing context.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="group rounded-3xl border border-[#12201d]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,32,29,0.12)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f5ff] text-[#1E3A8A] transition group-hover:bg-[#1E3A8A] group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-sm font-black text-[#ffb000]">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-6 text-sm font-black uppercase text-[#0f766e]">
                  {step.label}
                </p>
                <h3 className="mt-2 text-xl font-black text-[#12201d]">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#5c6b65]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#12201d]/10 bg-[#10231f] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#ffcf66]">
              Built for trust
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Students get confidence. Staff get clarity.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#c9d8d3]">
              Campus Voice improves campus service management by giving every
              concern a place, every request a status, and every resolution a
              visible path.
            </p>
          </div>

          <div className="grid gap-4">
            {trustPoints.map((point) => {
              const Icon = point.icon;

              return (
                <article
                  key={point.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffb000] text-[#1b1606]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-black text-white">{point.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#c9d8d3]">
                        {point.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#12201d]/10 bg-white shadow-[0_28px_80px_rgba(18,32,29,0.12)] lg:grid-cols-[1fr_0.72fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-black uppercase text-[#1E3A8A]">
              Start with one report
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#12201d] sm:text-5xl">
              Make student feedback easier to submit and harder to overlook.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5c6b65]">
              Sign in with your Paragon account to access a reporting workflow
              designed for accessibility, transparency, and accountable service
              response.
            </p>
            <form action={signInWithGoogle}>
              <button
                type="submit"
                id="cta-get-started"
                className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#ffb000] px-7 py-4 text-base font-black text-[#1b1606] shadow-[0_18px_45px_rgba(255,176,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffc247] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
              >
                Get Started
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          </div>
          <div className="flex min-h-64 items-center justify-center bg-[#1E3A8A] p-8 text-white">
            <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase text-blue-100">
                Case status
              </p>
              <div className="mt-6 space-y-4">
                {["Submitted", "In Review", "In Progress", "Resolved"].map(
                  (status, index) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#1E3A8A]">
                        {index + 1}
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-white/20">
                        <div
                          className="h-2 rounded-full bg-[#ffcf66]"
                          style={{ width: `${100 - index * 18}%` }}
                        />
                      </div>
                      <span className="w-24 text-sm font-bold">{status}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#12201d]/10 bg-[#f6f7f3]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm font-medium text-[#5c6b65] sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Campus Voice"
              width={24}
              height={24}
              className="h-6 w-6 object-contain opacity-70"
            />
            <span>Campus Voice, Paragon International University</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
