import { StudentDashboardClient } from "@/app/student/dashboard/StudentDashboardClient";
import { listMyTicketsServer } from "@/lib/server-api";
import type { StudentTicket } from "@/lib/student-api";

export default async function StudentDashboardPage() {
  let tickets: StudentTicket[] = [];
  let errorMessage: string | null = null;

  try {
    tickets = await listMyTicketsServer();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load your reports.";
  }

  return (
    <StudentDashboardClient
      initialTickets={tickets}
      initialError={errorMessage}
    />
  );
}
