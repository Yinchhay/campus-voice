"use client";

import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { RoleManagementPanel } from "@/components/roles/RoleManagementPanel";
import { staffNav } from "@/lib/staff-nav";

export default function StaffRolesPage() {
  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Roles"
      description="Review and manage RBAC role bundles based on your assigned permissions."
      navItems={staffNav}
    >
      <RoleManagementPanel />
    </RoleDashboardShell>
  );
}
