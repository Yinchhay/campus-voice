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
