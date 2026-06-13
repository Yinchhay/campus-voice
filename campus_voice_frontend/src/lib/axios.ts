import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { dashboardPathForRole, loginPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000/api";

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

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

studentApi.interceptors.request.use(async (config) => {
  const session = await getSession();
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

  const session = await getSession();
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
