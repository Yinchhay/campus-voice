"use client";

import { use } from "react";
import { TicketDetailWorkspace } from "@/components/tickets/TicketDetailWorkspace";
import { staffNav } from "@/lib/dashboard-nav";

export default function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TicketDetailWorkspace
      ticketId={id}
      roleName="Staff"
      navItems={staffNav}
      ticketsHref="/staff/tickets"
      backLabel="Back to Tickets"
      unavailableBackLabel="Back Tickets queue"
    />
  );
}
