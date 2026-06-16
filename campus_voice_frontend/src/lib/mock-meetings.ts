import type { MeetingSlot, StudentMeetingBooking } from "@/lib/types";

export const mockMeetingSlots: MeetingSlot[] = [
  {
    id: 1,
    ticket_id: "t-001",
    start_time: "2026-06-03T10:00:00Z",
    end_time: "2026-06-03T10:30:00Z",
    meeting_type: "VIRTUAL",
    location_or_details: "Google Meet link will be sent upon confirmation.",
    is_available: false,
    meeting_link: "https://meet.google.com/abc-defg-hij",
    created_at: "2026-05-30T09:00:00Z",
    updated_at: "2026-05-31T08:00:00Z",
  },
  {
    id: 2,
    ticket_id: "t-003",
    start_time: "2026-06-04T14:00:00Z",
    end_time: "2026-06-04T14:45:00Z",
    meeting_type: "IN_PERSON",
    location_or_details: "OSS Office, Room 105, Admin Building",
    is_available: true,
    meeting_link: null,
    created_at: "2026-05-31T09:00:00Z",
    updated_at: "2026-05-31T09:00:00Z",
  },
  {
    id: 3,
    ticket_id: "t-005",
    start_time: "2026-06-05T09:00:00Z",
    end_time: "2026-06-05T09:30:00Z",
    meeting_type: "HYBRID",
    location_or_details: "OSS Office, Room 105 or Google Meet (student's choice).",
    is_available: true,
    meeting_link: "https://meet.google.com/xyz-uvwx-yz",
    created_at: "2026-06-01T07:00:00Z",
    updated_at: "2026-06-01T07:00:00Z",
  },
];

export const mockBookings: StudentMeetingBooking[] = [
  {
    id: 1,
    meeting_slot_id: 1,
    ticket_id: "t-001",
    student_id: "u-001",
    scheduled_time: "2026-06-03T10:00:00Z",
    is_confirmed: true,
    meeting_completed: false,
    completion_notes: null,
    booked_at: "2026-05-31T08:00:00Z",
    cancelled_at: null,
  },
];
