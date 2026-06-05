import api from "@/lib/axios";
import axios from "axios";
import type { CategoryIssueType, TicketPriority, TicketStatus } from "@/lib/types";

export type StudentCategory = {
  id: number;
  name: string;
  description: string;
  issue_type: CategoryIssueType;
  priority_level: TicketPriority;
  is_active: boolean;
};

export type StudentTicket = {
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
  has_media: boolean;
  created_at?: string;
  updated_at?: string;
  resolved_at: string | null;
  messages?: StudentTicketMessage[];
};

export type StudentTicketMessage = {
  id: number;
  content: string;
  is_staff_message: boolean;
  created_at: string;
  attachment_name: string | null;
};

type BackendStudentTicket = Omit<StudentTicket, "category" | "category_id" | "category_name" | "has_media"> & {
  category: number | { id: number | string; name?: string };
  category_name?: string;
  has_media?: boolean;
  messages?: StudentTicketMessage[];
};

export type CreateStudentTicketPayload = {
  category: number;
  title: string;
  description: string;
};

function normalizeTicket(ticket: BackendStudentTicket): StudentTicket {
  const categoryId =
    typeof ticket.category === "object"
      ? Number(ticket.category.id)
      : Number(ticket.category);

  return {
    ...ticket,
    category: categoryId,
    category_id: categoryId,
    has_media: Boolean(ticket.has_media),
    category_name:
      ticket.category_name ||
      (typeof ticket.category === "object" ? ticket.category.name ?? "Unknown" : "Unknown"),
  };
}

export async function listStudentCategories() {
  const response = await api.get<StudentCategory[]>("/v1/categories");
  return response.data;
}

export async function createStudentTicket(payload: CreateStudentTicketPayload) {
  try {
    const response = await api.post<BackendStudentTicket>("/v1/tickets", payload);
    return normalizeTicket(response.data);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 500) {
      throw error;
    }

    const tickets = await listMyTickets();
    const createdTicket = tickets
      .filter(
        (ticket) =>
          ticket.category_id === payload.category &&
          ticket.title === payload.title &&
          ticket.description === payload.description,
      )
      .sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      })[0];

    if (!createdTicket) throw error;
    return createdTicket;
  }
}

export async function listMyTickets() {
  const response = await api.get<BackendStudentTicket[]>("/v1/tickets");
  return response.data.map(normalizeTicket);
}

export async function getMyTicket(ticketId: string) {
  try {
    const response = await api.get<BackendStudentTicket>(`/v1/tickets/${ticketId}`);
    return normalizeTicket(response.data);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 500) {
      throw error;
    }

    const tickets = await listMyTickets();
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) throw error;
    return ticket;
  }
}
