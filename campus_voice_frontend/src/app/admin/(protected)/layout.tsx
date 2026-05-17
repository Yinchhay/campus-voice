import { auth } from "@/lib/auth";
import { dashboardPathForRole, loginPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";

export default async function AdminProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	const role = normalizeCampusVoiceRole(session?.user?.role);

	if (!session?.accessToken || !role) {
		redirect(loginPathForRole("admin"));
	}

	if (role !== "admin") {
		redirect(dashboardPathForRole(role));
	}

	return children;
}
