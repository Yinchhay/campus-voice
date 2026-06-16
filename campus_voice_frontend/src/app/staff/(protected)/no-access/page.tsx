"use client";

import { ShieldAlert } from "lucide-react";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
import { staffNav } from "@/lib/dashboard-nav";

export default function StaffNoAccessPage() {
  return (
    <RoleDashboardShell
      roleName="Staff"
      title="No Workspace Access"
      description="Your staff account is active, but no RBAC permissions are assigned yet."
      navItems={staffNav}
    >
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Permissions required</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800">
              Ask an administrator to assign a role such as Support Staff or Category Manager.
              Once a role is assigned, the matching dashboard modules will appear automatically.
            </p>
          </div>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
