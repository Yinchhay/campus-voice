"use client";

import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { ProfanityManagementPanel } from "@/components/profanity/ProfanityManagementPanel";
import { staffNav } from "@/lib/dashboard-nav";

export default function StaffProfanityPage() {
  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Profanity Management"
      description="Review and maintain custom moderation words based on the permissions assigned to your staff role."
      navItems={staffNav}
    >
      <ProfanityManagementPanel />
    </RoleDashboardShell>
  );
}
