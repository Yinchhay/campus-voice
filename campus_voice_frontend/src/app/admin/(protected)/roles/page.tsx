"use client";

import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { RoleManagementPanel } from "@/components/roles/RoleManagementPanel";
import { adminNav } from "@/lib/dashboard-nav";

export default function AdminRolesPage() {
  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Roles"
      description="Create permission bundles for staff and assign access by resource and action."
      navItems={adminNav}
    >
      <RoleManagementPanel />
    </RoleDashboardShell>
  );
}
