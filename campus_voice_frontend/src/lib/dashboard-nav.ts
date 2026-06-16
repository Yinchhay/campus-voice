import {
  CalendarCheck,
  LayoutDashboard,
  ListChecks,
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
  {
    label: "Bookings",
    href: DASHBOARD_MODULES.bookings.href.admin,
    Icon: CalendarCheck,
    requiredPermission: DASHBOARD_MODULES.bookings.requiredPermission,
  },
  { label: "Settings", href: "/admin/settings", Icon: Settings },
];

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
  {
    label: "Bookings",
    href: DASHBOARD_MODULES.bookings.href.staff,
    Icon: CalendarCheck,
    requiredPermission: DASHBOARD_MODULES.bookings.requiredPermission,
  },
  { label: "Settings", href: "/staff/settings", Icon: Settings },
];
