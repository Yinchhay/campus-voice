"use client";

import { use } from "react";
import { TicketDetailWorkspace } from "@/components/tickets/TicketDetailWorkspace";
import { adminNav } from "@/lib/dashboard-nav";

export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TicketDetailWorkspace
      ticketId={id}
      roleName="Admin"
      navItems={adminNav}
      ticketsHref="/admin/tickets"
      backLabel="Back to Tickets"
      unavailableBackLabel="Back to tickets"
    />
  );
}
