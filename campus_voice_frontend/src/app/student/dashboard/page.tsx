"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
	ArrowRight,
	CheckCircle2,
	Clock3,
	ListFilter,
	Plus,
	ShieldCheck,
	TriangleAlert,
} from "lucide-react";

type TicketPriority = "low" | "medium" | "high";
type TicketStatus = "submitted" | "in_review" | "in_progress" | "resolved";

type StudentTicket = {
	id: string;
	trackingId: string;
	category: string;
	priority: TicketPriority;
	status: TicketStatus;
	description: string;
	createdAt: string;
	updatedAt: string;
};

const mockTickets: StudentTicket[] = [
	{
		id: "1",
		trackingId: "RPT-2025-0042",
		category: "facility",
		priority: "medium",
		status: "in_progress",
		description: "The AC in Room 302 has been broken for 2 weeks.",
		createdAt: "2025-12-01T10:30:00Z",
		updatedAt: "2025-12-03T14:00:00Z",
	},
	{
		id: "2",
		trackingId: "RPT-2025-0043",
		category: "safety",
		priority: "high",
		status: "submitted",
		description: "Suspicious behavior observed near the parking lot at night.",
		createdAt: "2025-12-02T22:15:00Z",
		updatedAt: "2025-12-02T22:15:00Z",
	},
	{
		id: "3",
		trackingId: "RPT-2025-0044",
		category: "service quality",
		priority: "low",
		status: "resolved",
		description:
			"Queue handling at student services has improved, but signage is still unclear for first-year students.",
		createdAt: "2025-11-22T09:10:00Z",
		updatedAt: "2025-11-28T16:45:00Z",
	},
];

const statusFlow: TicketStatus[] = ["submitted", "in_review", "in_progress", "resolved"];

const statusLabel: Record<TicketStatus, string> = {
	submitted: "Submitted",
	in_review: "In Review",
	in_progress: "In Progress",
	resolved: "Resolved",
};

const statusBadgeClass: Record<TicketStatus, string> = {
	submitted: "bg-slate-100 text-slate-700 border-slate-200",
	in_review: "bg-amber-50 text-amber-700 border-amber-200",
	in_progress: "bg-blue-50 text-blue-700 border-blue-200",
	resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const priorityBadgeClass: Record<TicketPriority, string> = {
	high: "bg-red-50 text-red-700 border-red-200",
	medium: "bg-amber-50 text-amber-700 border-amber-200",
	low: "bg-slate-100 text-slate-700 border-slate-200",
};

const priorityLabel: Record<TicketPriority, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
};

const categoryLabel: Record<string, string> = {
	safety: "Safety Threat",
	facility: "Facility Hazard",
	"service quality": "Service Quality",
	harassment: "Harassment",
	assault: "Assault",
	"health crisis": "Health Crisis",
	academic: "Academic Misconduct",
	instructor: "Instructor Misconduct",
	maintenance: "Facility Maintenance",
	policy: "Policy Suggestion",
};

const filterTabs: Array<{ key: TicketStatus | "all"; label: string }> = [
	{ key: "all", label: "All" },
	{ key: "submitted", label: "Submitted" },
	{ key: "in_review", label: "In Review" },
	{ key: "in_progress", label: "In Progress" },
	{ key: "resolved", label: "Resolved" },
];

function normalizeCategory(category: string): string {
	const normalized = categoryLabel[category.toLowerCase()];
	return normalized ?? category.replace(/(^\w)|(-\w)/g, (chunk) => chunk.replace("-", " ").toUpperCase());
}

function TicketFlow({ status }: { status: TicketStatus }) {
	const currentStep = statusFlow.indexOf(status);

	return (
		<ol className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
			{statusFlow.map((step, index) => {
				const isDone = index <= currentStep;

				return (
					<li
						key={step}
						className={`rounded-lg border px-3 py-2 ${
							isDone
								? "border-emerald-200 bg-emerald-50 text-emerald-700"
								: "border-slate-200 bg-white text-slate-500"
						}`}
					>
						{statusLabel[step]}
					</li>
				);
			})}
		</ol>
	);
}

export default function StudentDashboardPage() {
	const [activeFilter, setActiveFilter] = useState<TicketStatus | "all">("all");

	const filteredTickets = useMemo(() => {
		if (activeFilter === "all") return mockTickets;
		return mockTickets.filter((ticket) => ticket.status === activeFilter);
	}, [activeFilter]);

	const stats = useMemo(() => {
		const total = mockTickets.length;
		const open = mockTickets.filter((ticket) => ticket.status !== "resolved").length;
		const inProgress = mockTickets.filter((ticket) => ticket.status === "in_progress").length;
		const highPriority = mockTickets.filter((ticket) => ticket.priority === "high").length;

		return { total, open, inProgress, highPriority };
	}, []);

	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
			<section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
								<ShieldCheck className="h-4 w-4 text-emerald-600" />
								Verified anonymous reporting
							</div>
							<h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
								My Reports Dashboard
							</h1>
							<p className="mt-3 max-w-2xl text-slate-600">
								Track every report by anonymous tracking ID. You are authenticated to prevent spam,
								while report content remains anonymous to staff.
							</p>
						</div>

						<Link
							href="/student/submit"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-medium text-white transition hover:bg-teal-600"
						>
							<Plus className="h-4 w-4" />
							Submit New Report
						</Link>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm text-slate-600">Total Reports</p>
							<p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm text-slate-600">Open Cases</p>
							<p className="mt-1 text-2xl font-semibold text-slate-900">{stats.open}</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm text-slate-600">In Progress</p>
							<p className="mt-1 text-2xl font-semibold text-slate-900">{stats.inProgress}</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm text-slate-600">High Priority</p>
							<p className="mt-1 text-2xl font-semibold text-red-700">{stats.highPriority}</p>
						</div>
					</div>
				</div>

				<div className="mb-4 flex flex-wrap items-center gap-2">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
						<ListFilter className="h-4 w-4 text-slate-500" />
						Filter status
					</div>
					{filterTabs.map((tab) => {
						const isActive = activeFilter === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveFilter(tab.key)}
								className={`rounded-full border px-3 py-1.5 text-sm transition ${
									isActive
										? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
										: "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>

				<div className="space-y-4">
					{filteredTickets.length ? (
						filteredTickets.map((ticket) => (
							<article
								key={ticket.id}
								className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
							>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
												{ticket.trackingId}
											</span>
											<span
												className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[ticket.status]}`}
											>
												{statusLabel[ticket.status]}
											</span>
											<span
												className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadgeClass[ticket.priority]}`}
											>
												{priorityLabel[ticket.priority]}
											</span>
										</div>

										<h2 className="mt-3 text-lg font-semibold text-slate-900">
											{normalizeCategory(ticket.category)}
										</h2>
										<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
											{ticket.description}
										</p>
									</div>

									<div className="min-w-fit text-sm text-slate-600">
										<p className="inline-flex items-center gap-1.5">
											<Clock3 className="h-4 w-4" />
											Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
										</p>
										<p className="mt-1 text-xs text-slate-500">
											Submitted on {format(new Date(ticket.createdAt), "PPP")}
										</p>
									</div>
								</div>

								<TicketFlow status={ticket.status} />

								<div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
									<p className="inline-flex items-center gap-2 text-sm text-slate-600">
										{ticket.status === "resolved" ? (
											<CheckCircle2 className="h-4 w-4 text-emerald-600" />
										) : (
											<TriangleAlert className="h-4 w-4 text-amber-600" />
										)}
										{ticket.status === "resolved"
											? "Case closed and recorded."
											: "Your report is being handled by OSS."}
									</p>

									<Link
										href={`/student/reports/${ticket.id}`}
										className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:text-blue-700"
									>
										View details
										<ArrowRight className="h-4 w-4" />
									</Link>
								</div>
							</article>
						))
					) : (
						<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
							<h3 className="text-lg font-semibold text-slate-900">No reports in this stage</h3>
							<p className="mt-2 text-sm text-slate-600">
								Switch filters or submit a new report to start tracking its status.
							</p>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
