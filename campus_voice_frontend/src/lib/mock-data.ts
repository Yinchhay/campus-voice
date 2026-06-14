import type {
  Category,
  Message,
  MeetingSlot,
  StudentMeetingBooking,
  Ticket,
  User,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const mockUsers: User[] = [
  {
    id: "u-001",
    email: "alice@paragoniu.edu.kh",
    role: "STUDENT",
    is_active: true,
    created_at: "2025-09-01T08:00:00Z",
    last_login: "2026-05-30T09:15:00Z",
  },
  {
    id: "u-002",
    email: "bob@paragoniu.edu.kh",
    role: "STUDENT",
    is_active: true,
    created_at: "2025-09-01T08:10:00Z",
    last_login: "2026-05-28T14:20:00Z",
  },
  {
    id: "u-003",
    email: "carol@paragoniu.edu.kh",
    role: "STUDENT",
    is_active: true,
    created_at: "2025-09-02T09:00:00Z",
    last_login: "2026-05-25T11:00:00Z",
  },
  {
    id: "u-004",
    username: "david.oss",
    email: "david.oss@paragoniu.edu.kh",
    role: "STAFF",
    is_active: true,
    created_at: "2024-06-01T07:00:00Z",
    last_login: "2026-06-01T07:30:00Z",
  },
  {
    id: "u-005",
    username: "eva.oss",
    email: "eva.oss@paragoniu.edu.kh",
    role: "STAFF",
    is_active: true,
    created_at: "2024-06-01T07:05:00Z",
    last_login: "2026-05-31T16:45:00Z",
  },
  {
    id: "u-006",
    username: "frank.admin",
    email: "frank.admin@paragoniu.edu.kh",
    role: "ADMIN",
    is_active: true,
    created_at: "2024-01-15T06:00:00Z",
    last_login: "2026-06-01T08:00:00Z",
  },
  {
    id: "u-007",
    email: "grace@paragoniu.edu.kh",
    role: "STUDENT",
    is_active: false,
    created_at: "2025-09-03T08:30:00Z",
    last_login: "2025-12-20T10:00:00Z",
  },
  {
    id: "u-008",
    username: "henry.oss",
    email: "henry.oss@paragoniu.edu.kh",
    role: "STAFF",
    is_active: true,
    created_at: "2024-08-01T07:00:00Z",
    last_login: "2026-05-29T09:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const mockCategories: Category[] = [
  {
    id: 1,
    name: "Safety & Security",
    description: "Reports related to physical safety threats, suspicious activity, or security incidents on campus.",
    priority_level: "HIGH",
    is_active: true,
    created_at: "2024-01-15T06:00:00Z",
    updated_at: "2025-06-01T06:00:00Z",
  },
  {
    id: 2,
    name: "Facility & Maintenance",
    description: "Issues with campus facilities, equipment breakdowns, or maintenance requests.",
    priority_level: "MEDIUM",
    is_active: true,
    created_at: "2024-01-15T06:05:00Z",
    updated_at: "2025-06-01T06:05:00Z",
  },
  {
    id: 3,
    name: "Academic Integrity",
    description: "Reports of academic misconduct, cheating, plagiarism, or unfair grading practices.",
    priority_level: "HIGH",
    is_active: true,
    created_at: "2024-01-15T06:10:00Z",
    updated_at: "2025-06-01T06:10:00Z",
  },
  {
    id: 4,
    name: "Harassment & Discrimination",
    description: "Reports of bullying, harassment, or discriminatory behaviour by students or staff.",
    priority_level: "HIGH",
    is_active: true,
    created_at: "2024-01-15T06:15:00Z",
    updated_at: "2025-06-01T06:15:00Z",
  },
  {
    id: 5,
    name: "Service Quality",
    description: "Feedback on administrative services, student support quality, or policy improvement suggestions.",
    priority_level: "LOW",
    is_active: true,
    created_at: "2024-01-15T06:20:00Z",
    updated_at: "2025-06-01T06:20:00Z",
  },
  {
    id: 6,
    name: "Health & Wellbeing",
    description: "Reports related to student mental health concerns, health crises, or wellbeing issues.",
    priority_level: "HIGH",
    is_active: true,
    created_at: "2024-01-15T06:25:00Z",
    updated_at: "2025-06-01T06:25:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
export const mockTickets: Ticket[] = [
  {
    id: "t-001",
    category_id: 1,
    submitted_by: "u-001",
    title: "Suspicious individual loitering near parking lot",
    description:
      "For the past three nights I have observed an unknown individual loitering near the B-block parking lot between 10 PM and midnight. The person has been photographing cars and checking door handles. Campus security should be alerted immediately.",
    is_anonymous: false,
    priority: "HIGH",
    status: "IN_PROGRESS",
    has_media: true,
    public_ticket_id: "RPT-2026-0001",
    created_at: "2026-05-28T22:15:00Z",
    updated_at: "2026-05-29T09:00:00Z",
    resolved_at: null,
  },
  {
    id: "t-002",
    category_id: 2,
    submitted_by: "u-001",
    title: "Air conditioning failure in Room 302",
    description:
      "The air conditioning unit in Room 302 (Engineering Building) has not been working for over two weeks. Temperatures inside the room reach 35°C during afternoon lectures, making it nearly impossible to concentrate. Multiple students have experienced heat exhaustion symptoms.",
    is_anonymous: false,
    priority: "MEDIUM",
    status: "SUBMITTED",
    has_media: false,
    public_ticket_id: "RPT-2026-0002",
    created_at: "2026-05-26T10:30:00Z",
    updated_at: "2026-05-26T10:30:00Z",
    resolved_at: null,
  },
  {
    id: "t-003",
    category_id: 3,
    submitted_by: "u-002",
    title: "Exam answer sheet leak before midterm",
    description:
      "I have credible evidence that the midterm exam answer sheet for CS301 was circulating in a student group chat before the exam took place. At least 15 students had access to the answers prior to the test, significantly skewing the grade distribution.",
    is_anonymous: false,
    priority: "HIGH",
    status: "IN_PROGRESS",
    has_media: true,
    public_ticket_id: "RPT-2026-0003",
    created_at: "2026-05-24T16:45:00Z",
    updated_at: "2026-05-27T11:00:00Z",
    resolved_at: null,
  },
  {
    id: "t-004",
    category_id: 5,
    submitted_by: "u-002",
    title: "Student services counter signage unclear for new students",
    description:
      "The directional signage for the student services counter is confusing for first-year students. Many students queue at the wrong window for transcript requests versus financial aid queries. Adding clearer labels and a floor map would significantly improve the experience.",
    is_anonymous: false,
    priority: "LOW",
    status: "RESOLVED",
    has_media: false,
    public_ticket_id: "RPT-2026-0004",
    created_at: "2026-05-10T09:10:00Z",
    updated_at: "2026-05-20T14:00:00Z",
    resolved_at: "2026-05-20T14:00:00Z",
  },
  {
    id: "t-005",
    category_id: 4,
    submitted_by: "u-003",
    title: "Verbal harassment by senior student in cafeteria",
    description:
      "I was verbally harassed by a senior student in the main cafeteria on 28 May at approximately 12:30 PM. The individual used offensive language and made threatening remarks in front of multiple witnesses. I feel unsafe returning to the cafeteria alone.",
    is_anonymous: false,
    priority: "HIGH",
    status: "SUBMITTED",
    has_media: false,
    public_ticket_id: "RPT-2026-0005",
    created_at: "2026-05-28T13:05:00Z",
    updated_at: "2026-05-28T13:05:00Z",
    resolved_at: null,
  },
  {
    id: "t-006",
    category_id: 6,
    submitted_by: "u-003",
    title: "Peer struggling with severe anxiety — needs counselling referral",
    description:
      "A close friend of mine has been showing signs of severe anxiety and depression for the past month. They have expressed reluctance to seek help themselves. I am reporting this on their behalf and requesting that the counselling office reach out discreetly.",
    is_anonymous: false,
    priority: "HIGH",
    status: "RESOLVED",
    has_media: false,
    public_ticket_id: "RPT-2026-0006",
    created_at: "2026-05-15T08:00:00Z",
    updated_at: "2026-05-22T10:30:00Z",
    resolved_at: "2026-05-22T10:30:00Z",
  },
  {
    id: "t-007",
    category_id: 2,
    submitted_by: null,
    title: "Broken water fountain on second floor of Library",
    description:
      "The water fountain on the second floor of the library has been out of order for three weeks. A handwritten 'out of order' note is taped to it, but no repair has been made. Students rely on this as the nearest water source to the reading area.",
    is_anonymous: true,
    priority: "LOW",
    status: "IN_PROGRESS",
    has_media: false,
    public_ticket_id: "RPT-2026-0007",
    created_at: "2026-05-18T11:00:00Z",
    updated_at: "2026-05-29T08:00:00Z",
    resolved_at: null,
  },
  {
    id: "t-008",
    category_id: 1,
    submitted_by: null,
    title: "Broken CCTV camera at main gate",
    description:
      "The CCTV camera mounted above the main entrance gate appears to have been damaged — the casing is cracked and the camera is pointed downward at an unusable angle. This is a significant security gap, especially at night.",
    is_anonymous: true,
    priority: "HIGH",
    status: "SUBMITTED",
    has_media: false,
    public_ticket_id: "RPT-2026-0008",
    created_at: "2026-05-30T07:45:00Z",
    updated_at: "2026-05-30T07:45:00Z",
    resolved_at: null,
  },
  {
    id: "t-009",
    category_id: 3,
    submitted_by: "u-002",
    title: "Instructor reading directly from slides without explanation",
    description:
      "The instructor for BUS201 spends the entire lecture reading text directly from slides with no additional explanation or engagement. Several students have raised concerns but no changes have been made. The course pass rate is noticeably lower than similar courses.",
    is_anonymous: false,
    priority: "MEDIUM",
    status: "RESOLVED",
    has_media: false,
    public_ticket_id: "RPT-2026-0009",
    created_at: "2026-04-20T14:00:00Z",
    updated_at: "2026-05-05T09:30:00Z",
    resolved_at: "2026-05-05T09:30:00Z",
  },
];

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export const mockMessages: Message[] = [
  // Thread for t-001 (Safety — In Progress)
  {
    id: 1,
    ticket_id: "t-001",
    user_id: "u-001",
    content:
      "Just wanted to add — I also noticed the same person was checking the bike rack area on the evening of 27 May. I have photos if you need them.",
    attachment: null,
    is_staff_message: false,
    created_at: "2026-05-28T22:45:00Z",
    updated_at: "2026-05-28T22:45:00Z",
  },
  {
    id: 2,
    ticket_id: "t-001",
    user_id: "u-004",
    content:
      "Thank you for this report. We have alerted campus security and they will be conducting increased patrols in the B-block parking area starting tonight. Could you please share any photos or video footage you have? This will be very helpful for our investigation.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-29T09:00:00Z",
    updated_at: "2026-05-29T09:00:00Z",
  },
  {
    id: 3,
    ticket_id: "t-001",
    user_id: "u-001",
    content: "I have uploaded two photos. They are a bit dark but you can clearly see the person examining the car handles. Please keep me updated.",
    attachment: {
      id: 1,
      file: "/uploads/parking-lot-photo.jpg",
      original_name: "parking-lot-photo.jpg",
      uploaded_at: "2026-05-29T10:30:00Z",
    },
    is_staff_message: false,
    created_at: "2026-05-29T10:30:00Z",
    updated_at: "2026-05-29T10:30:00Z",
  },
  {
    id: 4,
    ticket_id: "t-001",
    user_id: "u-004",
    content:
      "We have received the photos. Our security team is reviewing CCTV footage from the same period to corroborate. We will update you within 48 hours. In the meantime, please avoid the parking area alone at night.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-30T08:15:00Z",
    updated_at: "2026-05-30T08:15:00Z",
  },

  // Thread for t-003 (Academic integrity — In Progress)
  {
    id: 5,
    ticket_id: "t-003",
    user_id: "u-002",
    content:
      "I have screenshots of the group chat where the answers were shared. The timestamps clearly show they were sent the evening before the exam. I can provide these privately.",
    attachment: null,
    is_staff_message: false,
    created_at: "2026-05-24T17:00:00Z",
    updated_at: "2026-05-24T17:00:00Z",
  },
  {
    id: 6,
    ticket_id: "t-003",
    user_id: "u-005",
    content:
      "This is a serious allegation and we are treating it with the utmost priority. We have escalated this to the Academic Integrity Committee. Do NOT share the screenshots publicly — please send them directly to our secure email: integrity@paragoniu.edu.kh with your ticket ID as the subject.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-25T09:30:00Z",
    updated_at: "2026-05-25T09:30:00Z",
  },
  {
    id: 7,
    ticket_id: "t-003",
    user_id: "u-002",
    content: "Sent. Reference: RPT-2026-0003. Please let me know once received.",
    attachment: null,
    is_staff_message: false,
    created_at: "2026-05-25T11:15:00Z",
    updated_at: "2026-05-25T11:15:00Z",
  },
  {
    id: 8,
    ticket_id: "t-003",
    user_id: "u-005",
    content:
      "Confirmed receipt. The committee will convene on 30 May to review the evidence. All affected students have been notified that a re-assessment may be required. We will update this ticket with the outcome.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-27T11:00:00Z",
    updated_at: "2026-05-27T11:00:00Z",
  },

  // Thread for t-004 (Resolved)
  {
    id: 9,
    ticket_id: "t-004",
    user_id: "u-004",
    content:
      "Thank you for this suggestion. We have forwarded it to the campus facilities and communications team. New directional signage and a floor map have been approved for installation.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-12T10:00:00Z",
    updated_at: "2026-05-12T10:00:00Z",
  },
  {
    id: 10,
    ticket_id: "t-004",
    user_id: "u-004",
    content:
      "Update: new signage has been installed at all service counters and a floor guide map is now displayed at the entrance. This ticket is now resolved. Thank you for helping us improve the student experience.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-20T14:00:00Z",
    updated_at: "2026-05-20T14:00:00Z",
  },

  // Thread for t-006 (Health — Resolved)
  {
    id: 11,
    ticket_id: "t-006",
    user_id: "u-005",
    content:
      "We appreciate you reaching out on behalf of your friend. Our counsellor will make a discreet, non-intrusive contact. You do not need to share their identity at this time — if you are comfortable, you may share their student ID securely.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-15T09:00:00Z",
    updated_at: "2026-05-15T09:00:00Z",
  },
  {
    id: 12,
    ticket_id: "t-006",
    user_id: "u-003",
    content: "Thank you. I have sent the student ID via the secure email. I really appreciate how quickly you responded.",
    attachment: null,
    is_staff_message: false,
    created_at: "2026-05-15T10:30:00Z",
    updated_at: "2026-05-15T10:30:00Z",
  },
  {
    id: 13,
    ticket_id: "t-006",
    user_id: "u-005",
    content:
      "Confirmed. Our counsellor has successfully made contact and the student has agreed to weekly sessions. This case is now resolved. If you have further concerns, please don't hesitate to open a new report.",
    attachment: null,
    is_staff_message: true,
    created_at: "2026-05-22T10:30:00Z",
    updated_at: "2026-05-22T10:30:00Z",
  },
];

// ---------------------------------------------------------------------------
// Meeting Slots
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Student Meeting Bookings
// ---------------------------------------------------------------------------
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
