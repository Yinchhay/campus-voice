export type UserRole = "STUDENT" | "STAFF" | "ADMIN";
export type TicketPriority = "HIGH" | "MEDIUM" | "LOW";
export type TicketStatus = "SUBMITTED" | "IN_PROGRESS" | "RESOLVED";
export type MeetingType = "IN_PERSON" | "VIRTUAL" | "HYBRID";

export interface User {
  id: string; // uuid
  google_id?: string | null;
  username?: string | null; // for staff/admin credential accounts
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string; // ISO timestamp
  last_login: string | null;
}

export interface Category {
  id: number; // serial
  name: string;
  description: string;
  priority_level: TicketPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string; // uuid
  category_id: number;
  submitted_by: string | null; // uuid — null for anonymous
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  has_media: boolean;
  public_ticket_id: string; // e.g. "RPT-2026-0001"
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Message {
  id: number; // serial
  ticket_id: string; // uuid
  user_id: string | null; // uuid — null for anonymous student
  content: string;
  attachment: string | null;
  attachment_name: string | null;
  is_staff_message: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingSlot {
  id: number; // serial
  ticket_id: string; // uuid
  start_time: string;
  end_time: string;
  meeting_type: MeetingType;
  location_or_details: string | null;
  is_available: boolean;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentMeetingBooking {
  id: number; // serial
  meeting_slot_id: number;
  ticket_id: string; // uuid
  student_id: string | null; // uuid
  scheduled_time: string;
  is_confirmed: boolean;
  meeting_completed: boolean;
  completion_notes: string | null;
  booked_at: string;
  cancelled_at: string | null;
}
