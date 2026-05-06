"use client";

import { RoleLoginPage } from "@/components/auth/RoleLoginPage";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
	return (
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
			Icon={ShieldCheck}
		/>
	);
}
