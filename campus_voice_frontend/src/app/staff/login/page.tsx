"use client";

import { CredentialLoginPage } from "@/components/auth/CredentialLoginPage";
import { UsersRound } from "lucide-react";
import { Suspense } from "react";

export default function StaffLoginPage() {
	return (
		<Suspense fallback={null}>
			<CredentialLoginPage
				roleName="Staff"
				providerId="staff-credentials"
				badge="Staff account access"
				title="Campus Voice Staff"
				description="Sign in with your staff account to review assigned reports, update case progress, and coordinate responses while student identities remain protected."
				callbackUrl="/staff/dashboard"
				features={[
					"Monitor anonymous reports by priority and category",
					"Update case status through the review pipeline",
					"Open staff tickets without exposing student identity",
				]}
				panelTitle="Staff Login"
				panelDescription="Use the username and password assigned to your staff account."
				Icon={UsersRound}
			/>
		</Suspense>
	);
}
