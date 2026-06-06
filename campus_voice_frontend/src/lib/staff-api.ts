import api from "@/lib/axios";
import type { TicketPriority, TicketStatus } from "@/lib/types";

export type StaffTicketMessage = {
  id: number;
  content: string;
  attachment?: string | null;
  attachment_name?: string | null;
  is_staff_message: boolean;
  created_at: string;
  updated_at?: string;
};

type BackendStaffTicket = {
  id: string;
  public_ticket_id: string;
  category: number | { id: number | string; name?: string };
  category_name?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  priority_display?: string;
  status: TicketStatus;
  status_display?: string;
  attachment?: string | null;
  submitted_by_email?: string | null;
  assigned_to_info?: {
    id: string;
    email: string;
    name: string;
  } | null;
  messages?: StaffTicketMessage[];
  resolved_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StaffTicket = {
  id: string;
  public_ticket_id: string;
  category: number;
  category_id: number;
  category_name: string;
  title: string;
  description: string;
  priority: TicketPriority;
  priority_display?: string;
  status: TicketStatus;
  status_display?: string;
  attachment?: string | null;
  submitted_by_email?: string | null;
  assigned_to_info?: {
    id: string;
    email: string;
    name: string;
  } | null;
  messages: StaffTicketMessage[];
  resolved_at: string | null;
  created_at?: string;
  updated_at?: string;
};

function normalizeTicket(ticket: BackendStaffTicket): StaffTicket {
  const categoryId =
    typeof ticket.category === "object"
      ? Number(ticket.category.id)
      : Number(ticket.category);

  return {
    ...ticket,
    category: categoryId,
    category_id: categoryId,
    category_name:
      ticket.category_name ||
      (typeof ticket.category === "object" ? ticket.category.name ?? "Unknown" : "Unknown"),
    messages: ticket.messages ?? [],
  };
}

export async function listStaffTickets() {
  const response = await api.get<BackendStaffTicket[]>("/admin/tickets");
  return response.data.map(normalizeTicket);
}

export async function getStaffTicket(ticketId: string) {
  const response = await api.get<BackendStaffTicket>(`/admin/tickets/${ticketId}`);
  return normalizeTicket(response.data);
}
