"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	ClipboardCheck,
	KeyRound,
	LockKeyhole,
	ShieldCheck,
	UserRound,
} from "lucide-react";

type CredentialLoginPageProps = {
	roleName: "Staff" | "Admin";
	providerId: "staff-credentials" | "admin-credentials";
	badge: string;
	title: string;
	description: string;
	callbackUrl: string;
	features: string[];
	panelTitle: string;
	panelDescription: string;
	Icon?: LucideIcon;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	CredentialsSignin: "Invalid username or password.",
	AccessDenied: "You do not have permission to access this area.",
	Configuration: "Authentication is temporarily unavailable.",
	Default: "Unable to sign in right now. Please try again.",
};

function dashboardForRole(role?: string, fallbackUrl = "/admin/dashboard") {
	if (role === "staff") return "/staff/dashboard";
	if (role === "admin") return "/admin/dashboard";
	return fallbackUrl;
}

export function CredentialLoginPage({
	roleName,
	providerId,
	badge,
	title,
	description,
	callbackUrl,
	features,
	panelTitle,
	panelDescription,
	Icon = ShieldCheck,
}: CredentialLoginPageProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const routeError = useMemo(() => {
		const code = searchParams.get("error");
		if (!code) return null;
		return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
	}, [searchParams]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);

		if (!username.trim() || !password) {
			setFormError("Enter your username and password.");
			return;
		}

		setIsLoading(true);
		const result = await signIn(providerId, {
			username: username.trim(),
			password,
			redirect: false,
			callbackUrl,
		});
		setIsLoading(false);

		if (result?.error) {
			setFormError(AUTH_ERROR_MESSAGES[result.error] ?? AUTH_ERROR_MESSAGES.Default);
			return;
		}

		const session = await getSession();
		router.push(dashboardForRole(session?.user?.role, result?.url ?? callbackUrl));
		router.refresh();
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
							<KeyRound className="h-6 w-6 text-teal-200" />
						</div>

						<h2 className="mt-6 text-2xl font-semibold">{panelTitle}</h2>
						<p className="mt-3 text-blue-100">{panelDescription}</p>

						{formError || routeError ? (
							<div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{formError ?? routeError}
							</div>
						) : null}

						<form onSubmit={handleSubmit} className="mt-8 space-y-4">
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-blue-50">Username</span>
								<span className="flex items-center gap-3 rounded-xl border border-white/15 bg-white px-3 py-3 text-slate-900 shadow-sm">
									<UserRound className="h-4 w-4 shrink-0 text-slate-500" />
									<input
										type="text"
										value={username}
										onChange={(event) => setUsername(event.target.value)}
										autoComplete="username"
										className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
										placeholder={`${roleName.toLowerCase()} username`}
									/>
								</span>
							</label>

							<label className="block">
								<span className="mb-2 block text-sm font-medium text-blue-50">Password</span>
								<span className="flex items-center gap-3 rounded-xl border border-white/15 bg-white px-3 py-3 text-slate-900 shadow-sm">
									<LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
									<input
										type="password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										autoComplete="current-password"
										className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
										placeholder="Password"
									/>
								</span>
							</label>

							<button
								type="submit"
								disabled={isLoading}
								className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{isLoading ? "Signing in..." : `Sign in as ${roleName}`}
								<ArrowRight className="h-4 w-4" />
							</button>
						</form>

						<p className="mt-4 text-xs text-blue-100/90">
							Use the credentials created for your {roleName.toLowerCase()} account.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
