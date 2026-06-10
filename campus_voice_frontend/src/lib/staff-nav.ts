import {
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Tag,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/RoleDashboardShell";
import { DASHBOARD_MODULES } from "@/lib/dashboard-access";

export const staffNav: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/staff/dashboard",
    Icon: LayoutDashboard,
    requiredPermission: DASHBOARD_MODULES.ticketOverview.requiredPermission,
  },
  {
    label: "Ticket Queue",
    href: DASHBOARD_MODULES.ticketOverview.href.staff,
    Icon: ListChecks,
    requiredPermission: DASHBOARD_MODULES.ticketOverview.requiredPermission,
  },
  {
    label: "Categories",
    href: DASHBOARD_MODULES.categoryManagement.href.staff,
    Icon: Tag,
    requiredPermission: DASHBOARD_MODULES.categoryManagement.requiredPermission,
  },
  {
    label: "Roles",
    href: DASHBOARD_MODULES.roleManagement.href.staff,
    Icon: ShieldCheck,
    requiredPermission: DASHBOARD_MODULES.roleManagement.requiredPermission,
  },
  { label: "Settings", href: "/staff/settings", Icon: Settings },
];
