"use client";

import { CategoryManagementPanel } from "@/components/categories/CategoryManagementPanel";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { staffNav } from "@/lib/dashboard-nav";

export default function StaffCategoriesPage() {
  return (
    <RoleDashboardShell
      roleName="Staff"
      title="Categories"
      description="Manage report categories, default priorities, and availability for student submissions."
      navItems={staffNav}
    >
      <CategoryManagementPanel />
    </RoleDashboardShell>
  );
}
