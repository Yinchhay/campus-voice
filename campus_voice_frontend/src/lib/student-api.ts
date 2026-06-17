import api from "@/lib/axios";
import axios from "axios";
import type {
  Attachment,
  CategoryIssueType,
  MeetingSlot,
  StudentMeetingBooking,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

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
  is_anonymous: boolean;
  priority: TicketPriority;
  priority_display?: string;
  status: TicketStatus;
  status_display?: string;
  has_media: boolean;
  attachments: Attachment[];
  resolution?: StudentTicketResolution | null;
  created_at?: string;
  updated_at?: string;
  resolved_at: string | null;
  messages?: StudentTicketMessage[];
};

export type StudentTicketMessage = {
  id: number;
  sender?: string | null;
  content: string;
  attachment?: Attachment | null;
  is_staff_message: boolean;
  created_at: string;
};

export type StudentTicketResolution = {
  note: string;
  attachments: Attachment[];
  resolved_by?: string | null;
  created_at: string;
  updated_at?: string;
};

type BackendStudentTicket = Omit<
  StudentTicket,
  "category" | "category_id" | "category_name" | "has_media" | "attachments"
> & {
  category: number | { id: number | string; name?: string };
  category_name?: string;
  has_media?: boolean;
  attachments?: Attachment[];
  messages?: StudentTicketMessage[];
};

export type CreateStudentTicketPayload = {
  category: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  attachments?: File[];
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
    attachments: ticket.attachments ?? [],
    has_media: Boolean(ticket.has_media || ticket.attachments?.length),
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
    const { attachments = [], ...ticketPayload } = payload;
    const requestBody =
      attachments.length > 0
        ? buildStudentTicketFormData(ticketPayload, attachments)
        : ticketPayload;

    const response = await api.post<BackendStudentTicket>("/v1/tickets", requestBody);
    return normalizeTicket(response.data);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 500) {
      throw error;
    }

    const tickets = await listMyTickets();
    const recentCutoff = Date.now() - 120_000;
    const createdTicket = tickets
      .filter(
        (ticket) => {
          if (
            ticket.category_id !== payload.category ||
            ticket.is_anonymous !== payload.is_anonymous
          ) {
            return false;
          }

          const exactContentMatch =
            ticket.title === payload.title &&
            ticket.description === payload.description;
          const createdAt = ticket.created_at ? Date.parse(ticket.created_at) : 0;
          const recentTicket = createdAt > recentCutoff;

          return exactContentMatch || recentTicket;
        },
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

export async function listStudentTicketMessages(ticketId: string) {
  const response = await api.get<StudentTicketMessage[]>(`/v1/tickets/${ticketId}/messages`);
  return response.data;
}

export async function createStudentTicketMessage(
  ticketId: string,
  content: string,
  attachment?: File | null,
) {
  const requestBody = attachment
    ? buildMessageFormData(content, attachment)
    : { content };

  const response = await api.post<StudentTicketMessage>(
    `/v1/tickets/${ticketId}/messages`,
    requestBody,
  );
  return response.data;
}

export async function listStudentTicketMeetingSlots(ticketId: string) {
  const response = await api.get<MeetingSlot[]>(
    `/v1/tickets/${ticketId}/meetings`,
  );
  return response.data;
}

export async function confirmStudentTicketMeeting(
  ticketId: string,
  slotId: number,
) {
  const response = await api.post<{
    message: string;
    booking: StudentMeetingBooking;
  }>(`/v1/tickets/${ticketId}/meetings/${slotId}/confirm`);
  return response.data;
}

export async function cancelStudentTicketMeetingBooking(
  ticketId: string,
  bookingId: number,
) {
  const response = await api.post<{ message: string }>(
    `/v1/tickets/${ticketId}/bookings/${bookingId}/cancel`,
  );
  return response.data;
}

export async function listStudentMeetingBookings() {
  const response = await api.get<StudentMeetingBooking[]>("/v1/my-bookings");
  return response.data;
}

function buildStudentTicketFormData(
  payload: Omit<CreateStudentTicketPayload, "attachments">,
  attachments: File[],
) {
  const formData = new FormData();
  formData.append("category", String(payload.category));
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("is_anonymous", String(payload.is_anonymous));
  attachments.forEach((file) => formData.append("attachments", file));
  return formData;
}

function buildMessageFormData(content: string, attachment: File) {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("attachment", attachment);
  return formData;
}
