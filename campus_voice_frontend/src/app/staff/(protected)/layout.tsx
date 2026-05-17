import { auth } from "@/lib/auth";
import { dashboardPathForRole, loginPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";

export default async function StaffProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	const role = normalizeCampusVoiceRole(session?.user?.role);

	if (!session?.accessToken || !role) {
		redirect(loginPathForRole("staff"));
	}

	if (role !== "staff") {
		redirect(dashboardPathForRole(role));
	}

	return children;
}
