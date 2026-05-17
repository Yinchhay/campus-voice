import { RoleLoginPage } from "@/components/auth/GoogleLoginPage";
import { auth } from "@/lib/auth";
import { dashboardPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LoginPage() {
	const session = await auth();
	const role = normalizeCampusVoiceRole(session?.user?.role);

	if (session?.accessToken && role) {
		redirect(dashboardPathForRole(role));
	}

	return (
		<Suspense fallback={null}>
			<RoleLoginPage
				roleName="Student"
				badge="Verified Anonymity Enabled"
				title="Campus Voice"
				description="Submit feedback and incident reports safely. Your institutional sign-in verifies identity for anti-spam, while staff only see anonymous report details."
				callbackUrl="/student/dashboard"
				features={[
					"Anonymous tracking ID for every submission",
					"Clear status pipeline: Submitted, In Review, In Progress, Resolved",
					"Restricted to Paragon institutional accounts",
				]}
				panelTitle="Sign in with Google"
				panelDescription="Use your @paragoniu.edu.kh account to continue."
			/>
		</Suspense>
	);
}
