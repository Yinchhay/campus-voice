"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";

type DashboardNavItem = {
	label: string;
	href: string;
	Icon: LucideIcon;
};

type RoleDashboardShellProps = {
	roleName: string;
	title: string;
	description: string;
	navItems: DashboardNavItem[];
	children: React.ReactNode;
};

export function RoleDashboardShell({
	roleName,
	title,
	description,
	navItems,
	children,
}: RoleDashboardShellProps) {
	const pathname = usePathname();

	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
				<aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0">
					<div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="border-b border-slate-200 px-2 pb-4">
							<div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<h2 className="mt-3 text-lg font-semibold text-slate-900">
								Campus Voice
							</h2>
							<p className="mt-1 text-sm text-slate-600">{roleName} workspace</p>
						</div>

						<nav className="mt-4 grid gap-1">
							{navItems.map(({ label, href, Icon }) => {
								const isActive = pathname === href || pathname.startsWith(`${href}/`);

								return (
									<Link
										key={href}
										href={href}
										className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
											isActive
												? "bg-blue-50 text-blue-800"
												: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
										}`}
									>
										<Icon className="h-4 w-4" />
										{label}
									</Link>
								);
							})}
						</nav>

						<button
							type="button"
							onClick={() => signOut({ callbackUrl: roleName === "Admin" ? "/admin/login" : "/staff/login" })}
							className="mt-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:mt-auto"
						>
							<LogOut className="h-4 w-4" />
							Sign out
						</button>
					</div>
				</aside>

				<section className="min-w-0 flex-1">
					<div className="mb-6">
						<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							{title}
						</h1>
						<p className="mt-3 max-w-2xl text-slate-600">{description}</p>
					</div>
					{children}
				</section>
			</div>
		</main>
	);
}
