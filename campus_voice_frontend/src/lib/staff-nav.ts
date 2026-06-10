import {
  LayoutDashboard,
  ListChecks,
  Settings,
  Tag,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/RoleDashboardShell";

export const staffNav: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/staff/dashboard",
    Icon: LayoutDashboard,
    requiredPermission: "ticket.view",
  },
  {
    label: "Ticket Queue",
    href: "/staff/tickets",
    Icon: ListChecks,
    requiredPermission: "ticket.view",
  },
  {
    label: "Categories",
    href: "/staff/categories",
    Icon: Tag,
    requiredPermission: "category.view",
  },
  { label: "Settings", href: "/staff/settings", Icon: Settings },
];
