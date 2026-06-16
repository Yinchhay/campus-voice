"use client";

import { BookingsPage } from "@/components/meetings/BookingsPage";
import { staffNav } from "@/lib/dashboard-nav";

export default function StaffBookingsPage() {
  return (
    <BookingsPage
      roleName="Staff"
      navItems={staffNav}
      ticketBasePath="/staff/tickets"
    />
  );
}
