"use client";

import { CredentialLoginPage } from "@/components/auth/CredentialLoginPage";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
	return (
		<CredentialLoginPage
			roleName="Admin"
			providerId="admin-credentials"
			badge="Admin account access"
			title="Campus Voice Admin"
			description="Sign in with your admin account to manage reporting operations, oversee staff activity, and review platform-level campus trends."
			callbackUrl="/admin/dashboard"
			features={[
				"View platform-wide report and resolution activity",
				"Oversee staff workflows and response coverage",
				"Maintain administrative visibility across campus reports",
			]}
			panelTitle="Admin Login"
			panelDescription="Use the username and password assigned to your admin account."
			Icon={ShieldCheck}
		/>
	);
}
