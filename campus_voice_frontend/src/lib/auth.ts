import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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

function buildLoginUrl(role: StaffAdminRole) {
	const override =
		role === "staff" ? process.env.STAFF_LOGIN_URL : process.env.ADMIN_LOGIN_URL;

	if (override) return override;

	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
	const path =
		role === "staff"
			? process.env.STAFF_LOGIN_PATH ?? "/api/staff/login/"
			: process.env.ADMIN_LOGIN_PATH ?? "/api/admin/login/";

	return new URL(path, baseUrl).toString();
}

async function loginWithCredentials(role: StaffAdminRole, credentials: Partial<Record<string, unknown>>) {
	const username = String(credentials.username ?? "").trim();
	const password = String(credentials.password ?? "");

	if (!username || !password) return null;

	const response = await fetch(buildLoginUrl(role), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			password,
			role,
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
		role: user.role ?? data.role ?? role,
		accessToken,
	};
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "paragoniu.edu.kh",
        },
      },
    }),
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
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      // Only allow @paragoniu.edu.kh emails
      return profile?.email?.endsWith("@paragoniu.edu.kh") ?? false;
    },
    async jwt({ token, account, user }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.provider === "google") {
        token.role = "student";
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
