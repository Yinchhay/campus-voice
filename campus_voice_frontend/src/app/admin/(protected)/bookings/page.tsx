"use client";

import { BookingsPage } from "@/components/meetings/BookingsPage";
import { adminNav } from "@/lib/dashboard-nav";

export default function AdminBookingsPage() {
  return (
    <BookingsPage
      roleName="Admin"
      navItems={adminNav}
      ticketBasePath="/admin/tickets"
    />
  );
}
