import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { normalizeCampusVoiceRole, type CampusVoiceRole } from "@/lib/auth-routes";

type StaffAdminRole = "staff" | "admin";

type UserFields = {
  id?: string | number;
  email?: string;
  name?: string;
  username?: string;
  role?: CampusVoiceRole | Uppercase<CampusVoiceRole>;
};

type LoginResponse = UserFields & {
  access?: string;
  accessToken?: string;
  access_token?: string;
  refresh_token?: string;
  access_token_expires_at?: string;
  refresh_token_expires_at?: string;
  token?: string;
  user?: UserFields;
};

// Resolves a relative API path against the server-side or public base URL.
function buildApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  const baseUrl =
    process.env.SERVER_API_URL ??
    (process.env.NEXT_PUBLIC_API_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL)
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined) ??
    "http://localhost:8000/api";

  if (!/^https?:\/\//.test(baseUrl)) return path;

  const normalizedPath =
    baseUrl.endsWith("/api") && path.startsWith("/api/")
      ? path.slice(5)
      : path.replace(/^\//, "");

  return new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function buildStaffAdminLoginUrl(): string {
  const override = process.env.STAFF_ADMIN_LOGIN_URL ?? process.env.ADMIN_LOGIN_URL;
  if (override) return override;

  // Allow a separate base URL for the staff/admin API (e.g. internal service URL).
  const staffBase = process.env.STAFF_ADMIN_API_URL;
  const path = process.env.STAFF_ADMIN_LOGIN_PATH ?? process.env.ADMIN_LOGIN_PATH ?? "/api/admin/login/";

  if (staffBase) {
    // Temporarily override SERVER_API_URL by constructing the URL inline.
    if (!/^https?:\/\//.test(path)) {
      const normalizedPath =
        staffBase.endsWith("/api") && path.startsWith("/api/")
          ? path.slice(5)
          : path.replace(/^\//, "");
      return new URL(normalizedPath, staffBase.endsWith("/") ? staffBase : `${staffBase}/`).toString();
    }
    return path;
  }

  return buildApiUrl(path);
}

function extractToken(data: LoginResponse): string | undefined {
  return data.access_token ?? data.accessToken ?? data.access ?? data.token;
}

function extractUser(data: LoginResponse): UserFields {
  return data.user ?? data;
}

async function loginWithCredentials(
  fallbackRole: StaffAdminRole,
  credentials: Partial<Record<string, unknown>>,
) {
  const username = String(credentials.username ?? "").trim();
  const password = String(credentials.password ?? "");

  if (!username || !password) return null;

  const response = await fetch(buildStaffAdminLoginUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as LoginResponse;
  const user = extractUser(data);
  const accessToken = extractToken(data);
  const role = normalizeCampusVoiceRole(user.role ?? data.role) ?? fallbackRole;

  if (!accessToken) return null;

  return {
    id: String(user.id ?? data.id ?? username),
    name: user.name ?? data.name ?? user.username ?? data.username ?? username,
    email: user.email ?? data.email ?? undefined,
    role,
    accessToken,
  };
}

async function exchangeGoogleIdToken(idToken: string) {
  const response = await fetch(buildApiUrl("/api/v1/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as LoginResponse;
  const user = extractUser(data);
  const djangoAccessToken = extractToken(data);
  const role = normalizeCampusVoiceRole(user.role ?? data.role);

  if (!djangoAccessToken || role !== "student") return null;

  return {
    id: String(user.id ?? data.id ?? user.email ?? ""),
    name: user.name ?? data.name ?? user.username ?? data.username ?? user.email ?? undefined,
    email: user.email ?? data.email ?? undefined,
    role,
    accessToken: djangoAccessToken,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: data.access_token_expires_at,
    refreshTokenExpiresAt: data.refresh_token_expires_at,
  };
}

export const authOptions = {
  session: { strategy: "jwt", maxAge: 365 * 24 * 60 * 60 },
  jwt: { maxAge: 365 * 24 * 60 * 60 },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile",
          hd: "paragoniu.edu.kh",
          prompt: "select_account",
        },
      },
    }),
    // Collapse the two identical CredentialsProviders into a single map.
    ...(["staff", "admin"] as const).map((role) =>
      CredentialsProvider({
        id: `${role}-credentials`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Credentials`,
        credentials: {
          username: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          return loginWithCredentials(role, credentials ?? {});
        },
      }),
    ),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;
      if (!account.id_token) return false;

      const exchangedUser = await exchangeGoogleIdToken(account.id_token);
      if (!exchangedUser) return false;

      // Mutate the user object so the jwt callback receives the Django tokens.
      Object.assign(user, exchangedUser);
      return true;
    },

    // signIn already enriches `user` for Google; jwt just persists it to the token.
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.sub = user.id;
        if (user.role) token.role = user.role;
        if (user.accessToken) token.accessToken = user.accessToken;
        if (user.refreshToken) token.refreshToken = user.refreshToken;
        if (user.accessTokenExpiresAt) token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        if (user.refreshTokenExpiresAt) token.refreshTokenExpiresAt = user.refreshTokenExpiresAt;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        const role = normalizeCampusVoiceRole(token.role);
        if (role) session.user.role = role;
      }
      if (typeof token.accessToken === "string") session.accessToken = token.accessToken;
      if (typeof token.accessTokenExpiresAt === "string") session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
