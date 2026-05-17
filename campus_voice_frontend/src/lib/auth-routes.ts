export type CampusVoiceRole = "student" | "staff" | "admin";

const campusVoiceRoles = new Set<CampusVoiceRole>(["student", "staff", "admin"]);

export function normalizeCampusVoiceRole(role: unknown): CampusVoiceRole | undefined {
	if (typeof role !== "string") return undefined;

	const normalized = role.toLowerCase();
	return campusVoiceRoles.has(normalized as CampusVoiceRole)
		? (normalized as CampusVoiceRole)
		: undefined;
}

export function dashboardPathForRole(role?: CampusVoiceRole) {
	if (role === "admin") return "/admin/dashboard";
	if (role === "staff") return "/staff/dashboard";
	return "/student/dashboard";
}

export function loginPathForRole(role?: CampusVoiceRole) {
	if (role === "admin") return "/admin/login";
	if (role === "staff") return "/staff/login";
	return "/login";
}

export function roleForProtectedPath(pathname: string): CampusVoiceRole | undefined {
	if (pathname.startsWith("/student")) return "student";
	if (pathname.startsWith("/staff") && pathname !== "/staff/login") return "staff";
	if (pathname.startsWith("/admin") && pathname !== "/admin/login") return "admin";
	return undefined;
}

export function isAuthPagePath(pathname: string) {
	return pathname === "/" || pathname === "/login" || pathname === "/staff/login" || pathname === "/admin/login";
}
