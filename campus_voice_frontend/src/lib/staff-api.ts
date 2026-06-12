import api from "@/lib/axios";
import type { Attachment, TicketPriority, TicketStatus } from "@/lib/types";

export type StaffTicketMessage = {
  id: number;
  sender?: string | null;
  content: string;
  attachment?: Attachment | null;
  is_staff_message: boolean;
  created_at: string;
  updated_at?: string;
};

export type StaffTicketResolution = {
  id: number;
  note: string;
  attachments: Attachment[];
  resolved_by_info?: {
    name: string;
    email: string;
  } | null;
  resolved_by?: string | null;
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
  attachments?: Attachment[];
  resolution?: StaffTicketResolution | null;
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
  attachments: Attachment[];
  resolution?: StaffTicketResolution | null;
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
    attachments: ticket.attachments ?? [],
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

export async function getTicketResolution(ticketId: string) {
  const response = await api.get<StaffTicketResolution>(
    `/admin/tickets/${ticketId}/resolution`,
  );
  return response.data;
}

export async function createTicketResolution(
  ticketId: string,
  note: string,
  attachments: File[] = [],
) {
  const response = await api.post<StaffTicketResolution>(
    `/admin/tickets/${ticketId}/resolution`,
    buildResolutionRequestBody(note, attachments),
  );
  return response.data;
}

export async function updateTicketResolution(
  ticketId: string,
  note: string,
  attachments: File[] = [],
) {
  const response = await api.patch<StaffTicketResolution>(
    `/admin/tickets/${ticketId}/resolution`,
    buildResolutionRequestBody(note, attachments),
  );
  return response.data;
}

export const createStaffTicketResolution = createTicketResolution;

export async function listStaffTicketMessages(ticketId: string) {
  const response = await api.get<StaffTicketMessage[]>(`/admin/tickets/${ticketId}/messages`);
  return response.data;
}

export async function createStaffTicketMessage(
  ticketId: string,
  content: string,
  attachment?: File | null,
) {
  const response = await api.post<StaffTicketMessage>(
    `/admin/tickets/${ticketId}/messages`,
    attachment ? buildMessageFormData(content, attachment) : { content },
  );
  return response.data;
}

function buildResolutionRequestBody(note: string, attachments: File[]) {
  if (attachments.length === 0) return { note };

  const formData = new FormData();
  formData.append("note", note);
  attachments.forEach((file) => formData.append("attachments", file));
  return formData;
}

function buildMessageFormData(content: string, attachment: File) {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("attachment", attachment);
  return formData;
}
