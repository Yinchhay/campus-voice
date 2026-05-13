import Link from "next/link";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";

export default function SubmitReportPage() {
	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
			<section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<Link
					href="/student/dashboard"
					className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to dashboard
				</Link>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
						<ShieldCheck className="h-4 w-4 text-emerald-600" />
						Anonymous report submission
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
						Submit New Report
					</h1>
					<p className="mt-3 max-w-2xl text-slate-600">
						The full submission form can be connected here when the report creation API is
						ready.
					</p>

					<button
						type="button"
						disabled
						className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-medium text-white opacity-70"
					>
						<Send className="h-4 w-4" />
						Submission form coming soon
					</button>
				</div>
			</section>
		</main>
	);
}
