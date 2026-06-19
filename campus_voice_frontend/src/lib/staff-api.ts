import api from "@/lib/axios";
import {
  toPaginatedResponse,
  unwrapPaginated,
  withDefaultPageSize,
  type ListQueryParams,
  type PaginatedResponse,
} from "@/lib/pagination";
import type {
  Attachment,
  CampusLocation,
  MeetingSlot,
  MeetingType,
  StudentMeetingBooking,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

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
  is_anonymous?: boolean;
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
  is_anonymous: boolean;
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

export type CreateMeetingSlotPayload = {
  start_time: string;
  end_time: string;
  meeting_type: MeetingType;
  campus_location?: CampusLocation;
  room_number?: string | null;
  location_or_details?: string | null;
  meeting_link?: string | null;
};

export type UpdateMeetingSlotPayload = Partial<CreateMeetingSlotPayload> & {
  is_available?: boolean;
};

export type CreateMeetingSlotsPayload =
  | CreateMeetingSlotPayload
  | { slots: CreateMeetingSlotPayload[] };

export type GoogleCalendarStatus =
  | {
      connected: true;
      calendar_email: string;
      connected_at: string;
    }
  | {
      connected: false;
    };

export type GoogleCalendarConnectResponse = {
  authorization_url: string;
  message: string;
};

export type GoogleCalendarCallbackResponse = {
  message: string;
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
    is_anonymous: Boolean(ticket.is_anonymous),
    category_name:
      ticket.category_name ||
      (typeof ticket.category === "object" ? ticket.category.name ?? "Unknown" : "Unknown"),
    attachments: ticket.attachments ?? [],
    messages: ticket.messages ?? [],
  };
}

export async function listStaffTickets(params: ListQueryParams = {}) {
  const response = await api.get<
    BackendStaffTicket[] | PaginatedResponse<BackendStaffTicket>
  >("/admin/tickets", { params: withDefaultPageSize(params) });
  return unwrapPaginated(response.data).map(normalizeTicket);
}

export async function listStaffTicketsPage(params: ListQueryParams = {}) {
  const response = await api.get<
    BackendStaffTicket[] | PaginatedResponse<BackendStaffTicket>
  >("/admin/tickets", { params });
  const page = toPaginatedResponse(response.data);
  return {
    ...page,
    results: page.results.map(normalizeTicket),
  };
}

export async function getStaffTicket(ticketId: string) {
  const response = await api.get<BackendStaffTicket>(`/admin/tickets/${ticketId}`);
  return normalizeTicket(response.data);
}

export async function updateStaffTicketStatus(
  ticketId: string,
  status: TicketStatus,
) {
  const response = await api.patch<BackendStaffTicket>(
    `/admin/tickets/${ticketId}`,
    { status },
  );
  return normalizeTicket(response.data);
}

export async function deleteStaffTicket(ticketId: string) {
  await api.delete(`/admin/tickets/${ticketId}`);
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

export async function listAdminTicketMeetingSlots(
  ticketId: string,
  params: ListQueryParams = {},
) {
  const response = await api.get<MeetingSlot[] | PaginatedResponse<MeetingSlot>>(
    `/admin/tickets/${ticketId}/meetings`,
    { params: withDefaultPageSize(params) },
  );
  return unwrapPaginated(response.data);
}

export async function createAdminTicketMeetingSlots(
  ticketId: string,
  payload: CreateMeetingSlotsPayload,
) {
  const response = await api.post<{
    message: string;
    slots: MeetingSlot[];
    partial_errors?: unknown[];
  }>(`/admin/tickets/${ticketId}/meetings`, payload);
  return response.data;
}

export async function getAdminTicketMeetingSlot(
  ticketId: string,
  slotId: number,
) {
  const response = await api.get<MeetingSlot>(
    `/admin/tickets/${ticketId}/meetings/${slotId}`,
  );
  return response.data;
}

export async function updateAdminTicketMeetingSlot(
  ticketId: string,
  slotId: number,
  payload: UpdateMeetingSlotPayload,
) {
  const response = await api.patch<MeetingSlot>(
    `/admin/tickets/${ticketId}/meetings/${slotId}`,
    payload,
  );
  return response.data;
}

export async function deleteAdminTicketMeetingSlot(
  ticketId: string,
  slotId: number,
) {
  const response = await api.delete<{ message: string }>(
    `/admin/tickets/${ticketId}/meetings/${slotId}`,
  );
  return response.data;
}

export async function listAdminBookings() {
  const response = await api.get<StudentMeetingBooking[]>("/admin/bookings");
  return response.data;
}

export async function markAdminMeetingComplete(
  ticketId: string,
  bookingId: number,
  completionNotes = "",
) {
  const response = await api.patch<StudentMeetingBooking>(
    `/admin/tickets/${ticketId}/bookings/${bookingId}/complete`,
    { completion_notes: completionNotes },
  );
  return response.data;
}

export async function getGoogleCalendarConnectUrl() {
  const response = await api.get<GoogleCalendarConnectResponse>(
    "/admin/google-calendar/connect",
  );
  return response.data;
}

export async function getGoogleCalendarStatus() {
  const response = await api.get<GoogleCalendarStatus>(
    "/admin/google-calendar/status",
  );
  return response.data;
}

export async function disconnectGoogleCalendar() {
  const response = await api.delete<{ message: string }>(
    "/admin/google-calendar/status",
  );
  return response.data;
}

export async function completeGoogleCalendarConnection(code: string) {
  const response = await api.post<GoogleCalendarCallbackResponse>(
    "/admin/google-calendar/callback",
    { code },
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
