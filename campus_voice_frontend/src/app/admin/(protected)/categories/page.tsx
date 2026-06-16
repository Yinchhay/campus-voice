"use client";

import { CategoryManagementPanel } from "@/components/categories/CategoryManagementPanel";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { adminNav } from "@/lib/admin-nav";

export default function AdminCategoriesPage() {
  return (
    <RoleDashboardShell
      roleName="Admin"
      title="Category Management"
      description="Configure report categories, their default priority levels, and active status."
      navItems={adminNav}
    >
      <CategoryManagementPanel />
    </RoleDashboardShell>
  );
}
