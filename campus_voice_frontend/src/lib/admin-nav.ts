import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tag,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/RoleDashboardShell";
import { DASHBOARD_MODULES } from "@/lib/dashboard-access";

export const adminNav: DashboardNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", Icon: LayoutDashboard },
  {
    label: "Tickets",
    href: DASHBOARD_MODULES.ticketOverview.href.admin,
    Icon: TicketCheck,
    requiredPermission: DASHBOARD_MODULES.ticketOverview.requiredPermission,
  },
  {
    label: "Users",
    href: DASHBOARD_MODULES.userManagement.href.admin,
    Icon: UsersRound,
    requiredPermission: DASHBOARD_MODULES.userManagement.requiredPermission,
  },
  {
    label: "Roles",
    href: DASHBOARD_MODULES.roleManagement.href.admin,
    Icon: ShieldCheck,
    requiredPermission: DASHBOARD_MODULES.roleManagement.requiredPermission,
  },
  {
    label: "Categories",
    href: DASHBOARD_MODULES.categoryManagement.href.admin,
    Icon: Tag,
    requiredPermission: DASHBOARD_MODULES.categoryManagement.requiredPermission,
  },
  { label: "Settings", href: "/admin/settings", Icon: Settings },
];
