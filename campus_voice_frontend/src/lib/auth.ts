import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type StaffAdminRole = "staff" | "admin";

type LoginResponse = {
	access?: string;
	accessToken?: string;
	token?: string;
	user?: {
		id?: string | number;
		email?: string;
		name?: string;
		username?: string;
		role?: StaffAdminRole;
	};
	id?: string | number;
	email?: string;
	name?: string;
	username?: string;
	role?: StaffAdminRole;
};

function buildStaffAdminLoginUrl() {
	const override = process.env.STAFF_ADMIN_LOGIN_URL ?? process.env.ADMIN_LOGIN_URL;

	if (override) return override;

	const baseUrl =
		process.env.STAFF_ADMIN_API_URL ??
		process.env.SERVER_API_URL ??
		process.env.NEXT_PUBLIC_API_URL ??
		"http://localhost:8000/api";
	const path = process.env.STAFF_ADMIN_LOGIN_PATH ?? process.env.ADMIN_LOGIN_PATH ?? "/api/admin/login/";

	if (/^https?:\/\//.test(path)) return path;
	if (/^https?:\/\//.test(baseUrl)) {
		const normalizedPath = baseUrl.endsWith("/api") && path.startsWith("/api/")
			? path.slice(5)
			: path.replace(/^\//, "");
		return new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
	}

	return path;
}

async function loginWithCredentials(fallbackRole: StaffAdminRole, credentials: Partial<Record<string, unknown>>) {
	const username = String(credentials.username ?? "").trim();
	const password = String(credentials.password ?? "");

	if (!username || !password) return null;

	const response = await fetch(buildStaffAdminLoginUrl(), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			password,
		}),
	});

	if (!response.ok) return null;

	const data = (await response.json()) as LoginResponse;
	const user = data.user ?? data;
	const accessToken = data.accessToken ?? data.access ?? data.token;

	return {
		id: String(user.id ?? data.id ?? username),
		name: user.name ?? data.name ?? user.username ?? data.username ?? username,
		email: user.email ?? data.email ?? undefined,
		role: user.role ?? data.role ?? fallbackRole,
		accessToken,
	};
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "staff-credentials",
      name: "Staff Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return loginWithCredentials("staff", credentials ?? {});
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return loginWithCredentials("admin", credentials ?? {});
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        if (token.role === "student" || token.role === "staff" || token.role === "admin") {
          session.user.role = token.role;
        }
      }
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
