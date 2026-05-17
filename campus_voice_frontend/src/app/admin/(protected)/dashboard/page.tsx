"use client";

import {
	BarChart3,
	LayoutDashboard,
	Settings,
	ShieldCheck,
	TicketCheck,
	UsersRound,
} from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";

const adminStats = [
	{ label: "Total Reports", value: "126", tone: "text-slate-900" },
	{ label: "Open Cases", value: "32", tone: "text-blue-700" },
	{ label: "Staff Active", value: "12", tone: "text-teal-700" },
	{ label: "High Priority", value: "8", tone: "text-red-700" },
];

const activity = [
	"Safety reports reviewed by student affairs",
	"Facility hazards assigned to operations staff",
	"Resolved cases audited for response quality",
];

export default function AdminDashboardPage() {
	return (
		<RoleDashboardShell
			roleName="Admin"
			title="Admin Dashboard"
			description="Oversee report volume, staff response coverage, and platform-level campus safety activity."
			navItems={[
				{ label: "Dashboard", href: "/admin/dashboard", Icon: LayoutDashboard },
				{ label: "Reports", href: "/admin/reports", Icon: TicketCheck },
				{ label: "Staff Accounts", href: "/admin/staff", Icon: UsersRound },
				{ label: "Analytics", href: "/admin/analytics", Icon: BarChart3 },
				{ label: "Settings", href: "/admin/settings", Icon: Settings },
			]}
		>
			<div className="space-y-6">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
						<ShieldCheck className="h-4 w-4 text-emerald-600" />
						Admin console
					</div>
					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{adminStats.map((stat) => (
							<div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-sm text-slate-600">{stat.label}</p>
								<p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
							</div>
						))}
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="mb-5 flex items-center gap-2 text-slate-900">
							<BarChart3 className="h-5 w-5 text-teal-600" />
							<h2 className="text-xl font-semibold">Operational Summary</h2>
						</div>
						<div className="space-y-3">
							{activity.map((item) => (
								<div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
									{item}
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="mb-5 flex items-center gap-2 text-slate-900">
							<UsersRound className="h-5 w-5 text-teal-600" />
							<h2 className="text-xl font-semibold">Staff Coverage</h2>
						</div>
						<p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
							Staff assignment and role management controls can be connected here once the
							backend permission endpoints are available.
						</p>
					</div>
				</div>
			</div>
		</RoleDashboardShell>
	);
}
