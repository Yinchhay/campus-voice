import axios from "axios";
import type { Session } from "next-auth";
import { getSession, signOut } from "next-auth/react";
import { dashboardPathForRole, loginPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const studentApi = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionRequest: Promise<Session | null> | null = null;
let cachedSession: Session | null = null;
let sessionCachedAt = 0;
const SESSION_CACHE_TTL_MS = 30_000; // 30 s — stays well inside NextAuth's refresh window

function getSharedSession() {
  // Return cached value if it's still fresh
  if (cachedSession && Date.now() - sessionCachedAt < SESSION_CACHE_TTL_MS) {
    return Promise.resolve(cachedSession);
  }
  // Deduplicate concurrent in-flight requests
  sessionRequest ??= getSession().then((session) => {
    cachedSession = session;
    sessionCachedAt = Date.now();
    sessionRequest = null;
    return session;
  }).catch((err) => {
    sessionRequest = null;
    throw err;
  });
  return sessionRequest;
}

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const session = await getSharedSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

studentApi.interceptors.request.use(async (config) => {
  const session = await getSharedSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

const handleAuthError = async (error: unknown) => {
  if (!axios.isAxiosError(error) || typeof window === "undefined") {
    return Promise.reject(error);
  }

  const status = error.response?.status;
  if (status !== 401 && status !== 403) {
    return Promise.reject(error);
  }

  const session = await getSharedSession();
  const role = normalizeCampusVoiceRole(session?.user?.role);

  if (status === 401) {
    await signOut({ callbackUrl: loginPathForRole(role) });
    return Promise.reject(error);
  }

  window.location.assign(dashboardPathForRole(role));
  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleAuthError);
studentApi.interceptors.response.use((response) => response, handleAuthError);

export default api;
