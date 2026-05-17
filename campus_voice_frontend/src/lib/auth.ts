import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

type StaffAdminRole = "staff" | "admin";
type CampusVoiceRole = "student" | StaffAdminRole;

type LoginResponse = {
	access?: string;
	accessToken?: string;
	access_token?: string;
	refresh_token?: string;
	token?: string;
	user?: {
		id?: string | number;
		email?: string;
		name?: string;
		username?: string;
		role?: CampusVoiceRole | Uppercase<CampusVoiceRole>;
	};
	id?: string | number;
	email?: string;
	name?: string;
	username?: string;
	role?: CampusVoiceRole | Uppercase<CampusVoiceRole>;
};

function normalizeRole(role?: string): CampusVoiceRole | undefined {
	const normalized = role?.toLowerCase();
	if (normalized === "student" || normalized === "staff" || normalized === "admin") {
		return normalized;
	}
	return undefined;
}

function buildApiUrl(path: string) {
	const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
	const baseUrl =
		process.env.SERVER_API_URL ??
		(publicApiUrl && /^https?:\/\//.test(publicApiUrl) ? publicApiUrl : undefined) ??
		"http://localhost:8000/api";

	if (/^https?:\/\//.test(path)) return path;
	if (/^https?:\/\//.test(baseUrl)) {
		const normalizedPath = baseUrl.endsWith("/api") && path.startsWith("/api/")
			? path.slice(5)
			: path.replace(/^\//, "");
		return new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
	}

	return path;
}

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
	const accessToken = data.accessToken ?? data.access_token ?? data.access ?? data.token;
	const role = normalizeRole(user.role ?? data.role) ?? fallbackRole;

	return {
		id: String(user.id ?? data.id ?? username),
		name: user.name ?? data.name ?? user.username ?? data.username ?? username,
		email: user.email ?? data.email ?? undefined,
		role,
		accessToken,
	};
}

async function exchangeGoogleToken(accessToken: string) {
	const response = await fetch(buildApiUrl("/api/v1/auth/google"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			access_token: accessToken,
		}),
	});

	if (!response.ok) return null;

	const data = (await response.json()) as LoginResponse;
	const user = data.user ?? data;
	const djangoAccessToken = data.access_token ?? data.accessToken ?? data.access ?? data.token;
	const role = normalizeRole(user.role ?? data.role);

	if (!djangoAccessToken || role !== "student") return null;

	return {
		id: String(user.id ?? data.id ?? user.email ?? ""),
		name: user.name ?? data.name ?? user.username ?? data.username ?? user.email ?? undefined,
		email: user.email ?? data.email ?? undefined,
		role,
		accessToken: djangoAccessToken,
	};
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_OAUTH_CLIENT_ID ??
        process.env.GOOGLE_CLIENT_ID ??
        process.env.AUTH_GOOGLE_ID ??
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
        "",
      clientSecret:
        process.env.GOOGLE_OAUTH_CLIENT_SECRET ??
        process.env.GOOGLE_CLIENT_SECRET ??
        process.env.AUTH_GOOGLE_SECRET ??
        "",
      authorization: {
        params: {
          hd: "paragoniu.edu.kh",
          prompt: "select_account",
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
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;
      if (!account.access_token) return false;

      const exchangedUser = await exchangeGoogleToken(account.access_token);
      if (!exchangedUser) return false;

      user.id = exchangedUser.id;
      user.name = exchangedUser.name;
      user.email = exchangedUser.email;
      user.role = exchangedUser.role;
      user.accessToken = exchangedUser.accessToken;
      return true;
    },
    async jwt({ token, account, user }) {
      const exchangedUser =
        account?.provider === "google" && account.access_token && !user?.accessToken
          ? await exchangeGoogleToken(account.access_token)
          : null;
      const sessionUser = exchangedUser ?? user;

      if (sessionUser?.accessToken) {
        token.accessToken = sessionUser.accessToken;
      }
      if (sessionUser?.role) {
        token.role = sessionUser.role;
      }
      if (sessionUser?.id) {
        token.sub = sessionUser.id;
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
