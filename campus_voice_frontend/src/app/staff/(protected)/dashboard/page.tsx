"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Inbox, LayoutDashboard, ListChecks, Settings, TriangleAlert } from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";

const queueStats = [
	{ label: "Assigned Cases", value: "18", tone: "text-slate-900" },
	{ label: "In Review", value: "7", tone: "text-blue-700" },
	{ label: "High Priority", value: "3", tone: "text-red-700" },
	{ label: "Resolved Today", value: "5", tone: "text-emerald-700" },
];

const recentTickets = [
	{
		id: "RPT-2025-0042",
		category: "Facility Hazard",
		status: "In Progress",
		priority: "Medium",
	},
	{
		id: "RPT-2025-0043",
		category: "Safety Threat",
		status: "Submitted",
		priority: "High",
	},
	{
		id: "RPT-2025-0044",
		category: "Service Quality",
		status: "Resolved",
		priority: "Low",
	},
];

export default function StaffDashboardPage() {
	return (
		<RoleDashboardShell
			roleName="Staff"
			title="Staff Dashboard"
			description="Review anonymous reports, prioritize urgent issues, and move cases through the response pipeline."
			navItems={[
				{ label: "Dashboard", href: "/staff/dashboard", Icon: LayoutDashboard },
				{ label: "Assigned Tickets", href: "/staff/tickets", Icon: ListChecks },
				{ label: "Settings", href: "/staff/settings", Icon: Settings },
			]}
		>
			<div className="space-y-6">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{queueStats.map((stat) => (
							<div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-sm text-slate-600">{stat.label}</p>
								<p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="mb-5 flex items-center gap-2 text-slate-900">
						<Inbox className="h-5 w-5 text-teal-600" />
						<h2 className="text-xl font-semibold">Recent Assigned Tickets</h2>
					</div>

					<div className="space-y-3">
						{recentTickets.map((ticket) => (
							<Link
								key={ticket.id}
								href={`/staff/tickets/${ticket.id}`}
								className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="font-medium text-slate-900">{ticket.id}</p>
									<p className="mt-1 text-sm text-slate-600">{ticket.category}</p>
								</div>
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
										<Clock3 className="h-3.5 w-3.5" />
										{ticket.status}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
										<TriangleAlert className="h-3.5 w-3.5" />
										{ticket.priority}
									</span>
									<ArrowRight className="h-4 w-4 text-slate-400" />
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>
		</RoleDashboardShell>
	);
}
