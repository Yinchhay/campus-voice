"use client";

import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { ProfanityManagementPanel } from "@/components/profanity/ProfanityManagementPanel";
import { adminNav } from "@/lib/dashboard-nav";

export default function AdminProfanityPage() {
  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Profanity Management"
      description="Manage custom moderation words that are masked in student reports and staff conversations."
      navItems={adminNav}
    >
      <ProfanityManagementPanel />
    </RoleDashboardShell>
  );
}
