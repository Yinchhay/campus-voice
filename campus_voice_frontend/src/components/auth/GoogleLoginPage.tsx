"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
	ClipboardCheck,
	LayoutDashboard,
	ShieldCheck,
	UsersRound,
} from "lucide-react";

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (options: {
						client_id: string;
						callback: (response: { credential?: string }) => void;
						hd?: string;
					}) => void;
					renderButton: (
						parent: HTMLElement,
						options: {
							theme?: "outline" | "filled_blue" | "filled_black";
							size?: "large" | "medium" | "small";
							type?: "standard" | "icon";
							text?: "signin_with" | "signup_with" | "continue_with" | "signin";
							shape?: "rectangular" | "pill" | "circle" | "square";
							width?: number;
						},
					) => void;
				};
			};
		};
	}
}

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

function getCookie(name: string) {
	const cookie = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${name}=`));

	return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : "";
}

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
	const googleButtonRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const searchParams = useSearchParams();

	const errorMessage = useMemo(() => {
		if (localError) return localError;
		const code = searchParams.get("error");
		if (!code) return null;
		return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
	}, [localError, searchParams]);

	const handleGoogleCredential = useCallback(async (credential?: string) => {
		if (!credential) {
			setLocalError("Google sign-in did not return a valid credential. Please try again.");
			return;
		}

		try {
			setIsLoading(true);
			setLocalError(null);

			await fetch("/api/v1/auth/csrf", {
				method: "GET",
				credentials: "include",
			});

			const response = await fetch("/api/v1/auth/google", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": getCookie("csrftoken"),
				},
				credentials: "include",
				body: JSON.stringify({ token: credential }),
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => null)) as { error?: string } | null;
				setLocalError(data?.error ?? "Unable to sign in right now. Please try again.");
				return;
			}

			router.push(callbackUrl);
			router.refresh();
		} catch {
			setLocalError("Unable to reach the authentication server. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}, [callbackUrl, router]);

	useEffect(() => {
		const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

		if (!clientId) {
			setLocalError("Google sign-in is not configured.");
			return;
		}

		const renderGoogleButton = () => {
			if (!window.google || !googleButtonRef.current) return;

			googleButtonRef.current.innerHTML = "";
			window.google.accounts.id.initialize({
				client_id: clientId,
				callback: ({ credential }) => handleGoogleCredential(credential),
				hd: "paragoniu.edu.kh",
			});
			window.google.accounts.id.renderButton(googleButtonRef.current, {
				theme: "outline",
				size: "large",
				type: "standard",
				text: "continue_with",
				shape: "rectangular",
				width: Math.min(360, googleButtonRef.current.clientWidth || 360),
			});
		};

		if (window.google) {
			renderGoogleButton();
			return;
		}

		const existingScript = document.querySelector<HTMLScriptElement>(
			'script[src="https://accounts.google.com/gsi/client"]',
		);

		if (existingScript) {
			existingScript.addEventListener("load", renderGoogleButton, { once: true });
			return () => existingScript.removeEventListener("load", renderGoogleButton);
		}

		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = renderGoogleButton;
		script.onerror = () => setLocalError("Could not load Google sign-in. Please try again.");
		document.head.appendChild(script);

		return () => {
			script.onload = null;
			script.onerror = null;
		};
	}, [handleGoogleCredential]);

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

						<div className="mt-8 flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-4 py-2">
							{isLoading ? (
								<p className="text-sm font-medium text-slate-700">Signing in...</p>
							) : (
								<div ref={googleButtonRef} className="flex w-full justify-center" />
							)}
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
