"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	ClipboardCheck,
	LayoutDashboard,
	ShieldCheck,
	UsersRound,
} from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
	AccessDenied: "Sign-in failed. Please use your @paragoniu.edu.kh account.",
	OAuthSignin: "Could not start Google sign-in. Please try again.",
	OAuthCallback: "Google sign-in callback failed. Please try again.",
	Callback: "Sign-in callback failed. Please try again.",
	OAuthAccountNotLinked:
		"This Google account is already linked differently. Try a different account.",
	Configuration: "Authentication is temporarily unavailable. Please try again.",
	Default: "Unable to sign in right now. Please try again.",
};

type RoleLoginPageProps = {
	roleName: string;
	badge: string;
	title: string;
	description: string;
	callbackUrl: string;
	features: string[];
	panelTitle: string;
	panelDescription: string;
	Icon?: LucideIcon;
};

export function RoleLoginPage({
	roleName,
	badge,
	title,
	description,
	callbackUrl,
	features = [],
	panelTitle,
	panelDescription,
	Icon = ShieldCheck,
}: RoleLoginPageProps) {
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
			await signIn("google", { callbackUrl });
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
							<Icon className="h-4 w-4 text-emerald-600" />
							{badge}
						</div>

						<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							{title}
						</h1>
						<p className="mt-4 max-w-prose text-slate-600">{description}</p>

						<ul className="mt-6 space-y-3 text-sm text-slate-700">
							{features.map((feature) => (
								<li key={feature} className="flex gap-2">
									<ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-3xl bg-[#1E3A8A] p-6 text-white shadow-lg sm:p-10">
						<div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
							<LayoutDashboard className="h-6 w-6 text-teal-200" />
						</div>

						<h2 className="mt-6 text-2xl font-semibold">{panelTitle}</h2>
						<p className="mt-3 text-blue-100">{panelDescription}</p>

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
							{isLoading ? "Redirecting..." : `Continue as ${roleName}`}
							<ArrowRight className="h-4 w-4" />
						</button>

						<p className="mt-4 text-xs text-blue-100/90">
							Use your @paragoniu.edu.kh account. Access permissions are checked after
							sign-in.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}

export const staffLoginContent = {
	roleName: "Staff",
	badge: "Staff workspace access",
	title: "Campus Voice Staff",
	description:
		"Review assigned reports, update case progress, and coordinate responses while student identities remain protected.",
	callbackUrl: "/staff/dashboard",
	features: [
		"Monitor anonymous reports by priority and category",
		"Update case status through the review pipeline",
		"Open staff tickets without exposing student identity",
	],
	panelTitle: "Sign in to Staff Dashboard",
	panelDescription: "Use your institutional Google account to continue to staff tools.",
	Icon: UsersRound,
} satisfies RoleLoginPageProps;

export const adminLoginContent = {
	roleName: "Admin",
	badge: "Admin console access",
	title: "Campus Voice Admin",
	description:
		"Manage reporting operations, oversee staff activity, and review platform-level trends for campus safety and service quality.",
	callbackUrl: "/admin/dashboard",
	features: [
		"View platform-wide report and resolution activity",
		"Oversee staff workflows and response coverage",
		"Maintain administrative visibility across campus reports",
	],
	panelTitle: "Sign in to Admin Dashboard",
	panelDescription: "Use your institutional Google account to continue to admin tools.",
	Icon: ShieldCheck,
} satisfies RoleLoginPageProps;
