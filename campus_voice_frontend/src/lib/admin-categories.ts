import api from "@/lib/axios";
import type { Category, TicketPriority } from "@/lib/types";

export type CategoryPayload = {
  name: string;
  description: string;
  priority_level: TicketPriority;
  is_active: boolean;
};

export type CategoryUpdatePayload = Partial<CategoryPayload>;

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
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/categories/${id}`);
  return response.data;
}
