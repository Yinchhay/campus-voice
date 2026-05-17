"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
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
	const [localError, setLocalError] = useState<string | null>(null);
	const searchParams = useSearchParams();

	const errorMessage = useMemo(() => {
		if (localError) return localError;
		const code = searchParams.get("error");
		if (!code) return null;
		return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
	}, [localError, searchParams]);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		setLocalError(null);
		await signIn("google", { callbackUrl });
		setIsLoading(false);
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

						<div className="mt-8">
							<button
								type="button"
								onClick={handleGoogleSignIn}
								disabled={isLoading}
								className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-800 shadow-md transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-teal-400 hover:ring-offset-2 hover:ring-offset-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isLoading ? (
									<>
										<svg className="h-5 w-5 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
										</svg>
										<span className="text-slate-500">Signing in…</span>
									</>
								) : (
									<>
										{/* Official Google 'G' logo */}
										<svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
											<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
											<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
											<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
										</svg>
										<span>Continue with Google</span>
									</>
								)}
							</button>
						</div>

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
