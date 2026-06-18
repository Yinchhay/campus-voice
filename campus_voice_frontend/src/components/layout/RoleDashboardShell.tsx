"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { loginPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { useRbacPermissions } from "@/lib/rbac";
import type { PermissionCodename } from "@/lib/types";

export type DashboardNavItem = {
	label: string;
	href: string;
	Icon: LucideIcon;
	requiredPermission?: PermissionCodename;
};

type RoleDashboardShellProps = {
	roleName: string;
	title: string;
	description: string;
	navItems: DashboardNavItem[];
	children: React.ReactNode;
};

function getInitials(name?: string | null, email?: string | null) {
	const label = name || email || "User";
	const parts = label
		.split(/[.@\s_-]+/)
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function RoleDashboardShell({
	roleName,
	title,
	description,
	navItems,
	children,
}: RoleDashboardShellProps) {
	const pathname = usePathname();
	const role = normalizeCampusVoiceRole(roleName);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isAccountOpen, setIsAccountOpen] = useState(false);
	const accountMenuRef = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();
	const { hasPermission, isLoading } = useRbacPermissions();

	const accountName = session?.user?.name || session?.user?.email || "Signed in user";
	const accountEmail = session?.user?.email;
	const accountInitials = getInitials(session?.user?.name, accountEmail);

	const visibleNavItems = navItems.filter((item) => {
		if (!item.requiredPermission) return true;
		if (isLoading) return false;
		return hasPermission(item.requiredPermission);
	});

	const closeMobileMenu = () => setIsMobileMenuOpen(false);

	// Close account dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
				setIsAccountOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="min-h-screen bg-slate-50">

			{/* ════════════════════════════════════════════════════
			    TOP NAV BAR  —  branding (left) + account (right)
			    ════════════════════════════════════════════════════ */}
			<header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
				<div className="flex h-full items-center gap-4 px-4 sm:px-6">
					{/* Mobile hamburger */}
					<button
						type="button"
						onClick={() => setIsMobileMenuOpen(true)}
						aria-label="Open navigation menu"
						aria-expanded={isMobileMenuOpen}
						aria-controls="mobile-dashboard-navigation"
						className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 lg:hidden"
					>
						<Menu className="h-5 w-5" />
					</button>

					{/* Branding */}
					<div className="flex min-w-0 shrink-0 items-center gap-2.5 lg:w-64">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] text-white shadow-sm">
							<ShieldCheck className="h-4 w-4" />
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-bold leading-none text-slate-900">Campus Voice</p>
							<p className="mt-0.5 truncate text-xs leading-none text-slate-500">{roleName} workspace</p>
						</div>
					</div>

					{/* Spacer */}
					<div className="flex-1" />

					{/* Account dropdown — desktop */}
					<div className="relative hidden lg:block" ref={accountMenuRef}>
						<button
							type="button"
							id="account-menu-button"
							aria-haspopup="true"
							aria-expanded={isAccountOpen}
							onClick={() => setIsAccountOpen((v) => !v)}
							className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
						>
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
								{accountInitials}
							</div>
							<div className="text-left">
								<p className="max-w-36 truncate text-sm font-semibold leading-none text-slate-900">
									{accountName}
								</p>
								<p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
									<UserRound className="h-3 w-3" />
									{roleName}
								</p>
							</div>
							<ChevronDown
								className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
									isAccountOpen ? "rotate-180" : ""
								}`}
							/>
						</button>

						{/* Dropdown panel */}
						{isAccountOpen && (
							<div
								role="menu"
								aria-labelledby="account-menu-button"
								className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
							>
								{/* User info */}
								<div className="border-b border-slate-100 px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
											{accountInitials}
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold text-slate-900">{accountName}</p>
											{accountEmail && (
												<p className="truncate text-xs text-slate-500">{accountEmail}</p>
											)}
											<span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
												<UserRound className="h-3 w-3" />
												{roleName}
											</span>
										</div>
									</div>
								</div>

								{/* Sign out */}
								<div className="p-2">
									<button
										type="button"
										role="menuitem"
										onClick={() => signOut({ callbackUrl: loginPathForRole(role) })}
										className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
									>
										<LogOut className="h-4 w-4" />
										Sign out
									</button>
								</div>
							</div>
						)}
					</div>

				</div>
			</header>

			{/* ════════════════════════════════════════════════════
			    LEFT SIDEBAR  —  nav links + sign out (desktop only)
			    ════════════════════════════════════════════════════ */}
			<aside className="fixed inset-y-0 left-0 top-16 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
				<div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-4">
					{visibleNavItems.map(({ label, href, Icon }) => {
						const isActive = pathname === href || pathname.startsWith(`${href}/`);
						return (
							<Link
								key={href}
								href={href}
								className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
									isActive
										? "bg-blue-50 text-blue-800 shadow-[inset_0_0_0_1px] shadow-blue-100"
										: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
								}`}
							>
								<Icon
									className={`h-4 w-4 shrink-0 transition-colors ${
										isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
									}`}
								/>
								{label}
								{isActive && (
									<span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
								)}
							</Link>
						);
					})}
				</div>

				{/* Sign out at the bottom of sidebar */}
				<div className="border-t border-slate-200 p-3">
					<button
						type="button"
						onClick={() => signOut({ callbackUrl: loginPathForRole(role) })}
						className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</button>
				</div>
			</aside>

			{/* ════════════════════════════════════════════════════
			    MOBILE SLIDE-OVER  —  nav + account + sign out
			    ════════════════════════════════════════════════════ */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					{/* Backdrop */}
					<button
						type="button"
						aria-label="Close navigation menu"
						className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
						onClick={closeMobileMenu}
					/>

					{/* Panel */}
					<div
						id="mobile-dashboard-navigation"
						className="absolute left-0 right-auto top-0 flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-2xl"
					>
						{/* Header */}
						<div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
							<button
								type="button"
								onClick={closeMobileMenu}
								aria-label="Close navigation menu"
								className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
							>
								<X className="h-4 w-4" />
							</button>
							<div className="flex min-w-0 items-center gap-2.5">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] text-white">
									<ShieldCheck className="h-4 w-4" />
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-bold text-slate-900">Campus Voice</p>
									<p className="truncate text-xs text-slate-500">{roleName} workspace</p>
								</div>
							</div>
						</div>

						{/* Nav links */}
						<nav className="flex-1 overflow-y-auto p-3">
							<div className="grid gap-1">
								{visibleNavItems.map(({ label, href, Icon }) => {
									const isActive = pathname === href || pathname.startsWith(`${href}/`);
									return (
										<Link
											key={href}
											href={href}
											onClick={closeMobileMenu}
											className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
												isActive
													? "bg-blue-50 text-blue-800"
													: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
											}`}
										>
											<Icon className="h-4 w-4 shrink-0" />
											{label}
										</Link>
									);
								})}
							</div>
						</nav>

						{/* Account + sign out */}
						<div className="border-t border-slate-200 p-3 space-y-2">
							<div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
									{accountInitials}
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-slate-900">{accountName}</p>
									{accountEmail && (
										<p className="truncate text-xs text-slate-500">{accountEmail}</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => signOut({ callbackUrl: loginPathForRole(role) })}
								className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
							>
								<LogOut className="h-4 w-4" />
								Sign out
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ════════════════════════════════════════════════════
			    PAGE CONTENT  —  offset below top nav + beside sidebar
			    ════════════════════════════════════════════════════ */}
			<main className="pt-16 lg:pl-64">
				<div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
					{/* Page header */}
					<div className="mb-8">
						<h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							{title}
						</h1>
						<p className="mt-2 max-w-2xl text-sm text-slate-600 sm:mt-3 sm:text-base">
							{description}
						</p>
					</div>

					{children}
				</div>
			</main>
		</div>
	);
}
