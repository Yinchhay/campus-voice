import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type StudentReportPageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function StudentReportPage({ params }: StudentReportPageProps) {
	const { id } = await params;

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
						Anonymous tracking enabled
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
						Report {decodeURIComponent(id)}
					</h1>
					<p className="mt-3 text-slate-600">
						Report status, updates, and resolution details can be connected here when the
						report API is ready.
					</p>
				</div>
			</section>
		</main>
	);
}
