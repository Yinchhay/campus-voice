import api from "@/lib/axios";
import {
  getStaffTicket,
  listStaffTickets,
  type StaffTicket,
  type StaffTicketMessage,
} from "@/lib/staff-api";
import type { Category, CategoryIssueType, TicketPriority, UserRole } from "@/lib/types";

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

export type CategoryPayload = {
  name: string;
  description: string;
  issue_type: CategoryIssueType;
  priority_level: TicketPriority;
  is_active: boolean;
};

export type CategoryUpdatePayload = Partial<CategoryPayload>;

export type AdminTicketMessage = StaffTicketMessage;
export type AdminTicket = StaffTicket;

export type AdminRoleSummary = {
  id: number;
  name: string;
  description: string;
  is_superadmin: boolean;
  permissions?: Array<{
    codename: string;
    resource: string;
    action: string;
  }>;
};

export type AdminUser = {
  id: string;
  username?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: UserRole;
  role_display?: string;
  is_superadmin?: boolean;
  google_picture_url?: string;
  is_staff: boolean;
  is_active: boolean;
  roles?: AdminRoleSummary[];
  created_at: string;
  last_login: string | null;
  generated_password?: string;
};

export type CreateAdminUserPayload = {
  email: string;
  first_name?: string;
  last_name?: string;
  role: Extract<UserRole, "STAFF" | "ADMIN">;
  password?: string;
  is_active?: boolean;
  is_staff?: boolean;
  role_ids?: number[];
};

export type UpdateAdminUserPayload = Partial<
  Pick<AdminUser, "email" | "first_name" | "last_name" | "is_active" | "is_staff" | "role">
> & {
  password?: string;
  role_ids?: number[];
};

export async function getCurrentStaffAccount() {
  const response = await api.get<BackendAdminMeResponse>("/admin/me");
  const { id: _id, ...account } = response.data.user;
  void _id;
  return account;
}

export async function listAdminCategories() {
  const response = await api.get<Category[]>("/admin/categories");
  return response.data;
}

export async function createAdminCategory(payload: CategoryPayload) {
  const response = await api.post<Category>("/admin/categories", payload);
  return response.data;
}

export async function updateAdminCategory(id: number, payload: CategoryUpdatePayload) {
  const response = await api.patch<Category>(`/admin/categories/${id}`, payload);
  return response.data;
}

export async function deleteAdminCategory(id: number) {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/admin/categories/${id}`,
  );
  return response.data;
}

export async function listAdminTickets() {
  return listStaffTickets();
}

export async function getAdminTicket(ticketId: string) {
  return getStaffTicket(ticketId);
}

export async function listAdminUsers() {
  const response = await api.get<AdminUser[]>("/admin/users");
  return response.data;
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  const response = await api.post<AdminUser>("/admin/users", payload);
  return response.data;
}

export async function getAdminUser(userId: string) {
  const response = await api.get<AdminUser>(`/admin/users/${userId}`);
  return response.data;
}

export async function updateAdminUser(userId: string, payload: UpdateAdminUserPayload) {
  const response = await api.patch<AdminUser>(`/admin/users/${userId}`, payload);
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  const response = await api.delete<{ message: string }>(`/admin/users/${userId}`);
  return response.data;
}
