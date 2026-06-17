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
    is_superadmin?: boolean;
    is_active: boolean;
    roles?: AdminRoleSummary[];
    created_at: string;
    last_login: string | null;
  };
};

export type CurrentStaffAccount = {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_superadmin?: boolean;
  roles?: AdminRoleSummary[];
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

export type AdminPermission = {
  id: number;
  resource: string;
  action: string;
  action_display: string;
  description: string;
  codename: string;
};

export type AdminRoleDetail = {
  id: number;
  name: string;
  description: string;
  is_superadmin: boolean;
  permissions: AdminPermission[];
  user_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminRolePayload = {
  name: string;
  description?: string;
  is_superadmin?: boolean;
  is_active?: boolean;
  permission_ids?: number[];
};

export type UserRoleAssignment = {
  id: number;
  role: AdminRoleSummary;
  assigned_at: string;
  assigned_by: string | null;
  assigned_by_name: string | null;
};

export type UserRolesResponse = {
  user_id: string;
  email?: string;
  roles: UserRoleAssignment[];
  message?: string;
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

export type AdminEmailSetting = {
  ticket_notification_email: string | null;
  updated_by: string | null;
  updated_at: string | null;
};

export type AdminProfanityWord = {
  id: number;
  word: string;
  created_at: string;
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

export async function getAdminEmailSetting() {
  const response = await api.get<AdminEmailSetting>("/admin/settings/email");
  return response.data;
}

export async function updateAdminEmailSetting(ticket_notification_email: string) {
  const response = await api.put<AdminEmailSetting>("/admin/settings/email", {
    ticket_notification_email,
  });
  return response.data;
}

export async function listAdminProfanityWords() {
  const response = await api.get<AdminProfanityWord[]>("/admin/settings/profanity-words");
  return response.data;
}

export async function createAdminProfanityWord(word: string) {
  const response = await api.post<AdminProfanityWord>("/admin/settings/profanity-words", {
    word,
  });
  return response.data;
}

export async function deleteAdminProfanityWord(wordId: number) {
  const response = await api.delete<{ message?: string }>(
    `/admin/settings/profanity-words/${wordId}`,
  );
  return response.data;
}

export async function listAdminRoles() {
  const response = await api.get<AdminRoleDetail[]>("/admin/roles");
  return response.data;
}

export async function createAdminRole(payload: AdminRolePayload) {
  const response = await api.post<AdminRoleDetail>("/admin/roles", payload);
  return response.data;
}

export async function updateAdminRole(roleId: number, payload: Partial<AdminRolePayload>) {
  const response = await api.patch<AdminRoleDetail>(`/admin/roles/${roleId}`, payload);
  return response.data;
}

export async function deleteAdminRole(roleId: number) {
  const response = await api.delete<{ message: string }>(`/admin/roles/${roleId}`);
  return response.data;
}

export async function listAdminPermissions() {
  const response = await api.get<AdminPermission[]>("/admin/permissions");
  return response.data;
}

export async function getUserRoles(userId: string) {
  const response = await api.get<UserRolesResponse>(`/admin/users/${userId}/roles`);
  return response.data;
}

export async function setUserRoles(userId: string, roleIds: number[]) {
  const response = await api.put<UserRolesResponse>(`/admin/users/${userId}/roles`, {
    role_ids: roleIds,
  });
  return response.data;
}

export async function setRolePermissions(roleId: number, permissionIds: number[]) {
  const response = await api.put<{ message: string; role: AdminRoleDetail }>(
    `/admin/roles/${roleId}/permissions`,
    { permission_ids: permissionIds },
  );
  return response.data;
}
