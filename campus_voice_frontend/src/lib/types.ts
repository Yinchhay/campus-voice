export type UserRole = "STUDENT" | "STAFF" | "ADMIN";
export type CategoryIssueType = "SERVICE" | "ACADEMIC";
export type TicketPriority = "HIGH" | "MEDIUM" | "LOW";
export type TicketStatus = "SUBMITTED" | "IN_PROGRESS" | "RESOLVED";
export type MeetingType = "ONLINE" | "IN_PERSON";
export type CampusLocation = "MAIN" | "EAS";
export type PermissionCodename = `${string}.${string}` | "*";

export interface Attachment {
  id: number;
  file: string;
  original_name?: string | null;
  uploaded_at?: string;
}

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
  issue_type?: CategoryIssueType;
  priority_level: TicketPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string; // uuid
  category_id: number;
  submitted_by: string | null; // uuid — stored privately for ticket tracking
  title: string;
  description: string;
  is_anonymous: boolean;
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
  attachment: Attachment | null;
  is_staff_message: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingSlot {
  id: number; // serial
  ticket: string; // uuid
  staff_member?: string | null; // uuid
  staff_name?: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  meeting_type: MeetingType;
  campus_location: CampusLocation;
  room_number: string | null;
  location_or_details: string | null;
  is_available: boolean;
  meeting_link: string | null;
  is_expired_status?: boolean;
  google_event_id?: string | null;
  created_at: string;
  updated_at?: string;
  student_booking?: StudentMeetingBooking | null;
}

export interface StudentMeetingBooking {
  id: number; // serial
  meeting_slot: number;
  ticket: string; // uuid
  public_ticket_id?: string;
  scheduled_time: string;
  is_confirmed: boolean;
  meeting_completed: boolean;
  completion_notes: string | null;
  meeting_details?: {
    id: string;
    start_time: string;
    end_time: string;
    meeting_type: string;
    location_or_details: string | null;
    meeting_link: string | null;
    staff_name: string;
  };
  booked_at: string;
  cancelled_at: string | null;
  meeting_slot_detail?: MeetingSlot;
}
