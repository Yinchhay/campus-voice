import api from "@/lib/axios";
import type { UserRole } from "@/lib/types";

type BackendAdminMeResponse = {
  success: boolean;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
  };
};

export type CurrentStaffAccount = {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

export async function getCurrentStaffAccount() {
  const response = await api.get<BackendAdminMeResponse>("/admin/me");
  const { id: _id, ...account } = response.data.user;
  void _id;
  return account;
}
