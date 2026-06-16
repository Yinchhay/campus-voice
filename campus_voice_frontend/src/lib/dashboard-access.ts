import type { PermissionCodename } from "@/lib/types";

export const RBAC_PERMISSIONS = {
  ticket: {
    view: "ticket.view",
    create: "ticket.create",
    update: "ticket.update",
    delete: "ticket.delete",
    export: "ticket.export",
  },
  category: {
    view: "category.view",
    create: "category.create",
    update: "category.update",
    delete: "category.delete",
  },
  message: {
    view: "message.view",
    create: "message.create",
  },
  resolution: {
    view: "resolution.view",
    create: "resolution.create",
    update: "resolution.update",
  },
  user: {
    view: "user.view",
    create: "user.create",
    update: "user.update",
    delete: "user.delete",
  },
  role: {
    view: "role.view",
    create: "role.create",
    update: "role.update",
    delete: "role.delete",
  },
  permission: {
    view: "permission.view",
  },
  meeting: {
    view: "meeting.view",
    create: "meeting.create",
    update: "meeting.update",
    delete: "meeting.delete",
  },
} as const satisfies Record<string, Record<string, PermissionCodename>>;

export const DASHBOARD_MODULES = {
  ticketOverview: {
    label: "Ticket Overview",
    href: {
      admin: "/admin/tickets",
      staff: "/staff/tickets",
    },
    requiredPermission: RBAC_PERMISSIONS.ticket.view,
  },
  categoryManagement: {
    label: "Category Management",
    href: {
      admin: "/admin/categories",
      staff: "/staff/categories",
    },
    requiredPermission: RBAC_PERMISSIONS.category.view,
  },
  userManagement: {
    label: "User Management",
    href: {
      admin: "/admin/users",
    },
    requiredPermission: RBAC_PERMISSIONS.user.view,
  },
  roleManagement: {
    label: "Role Management",
    href: {
      admin: "/admin/roles",
      staff: "/staff/roles",
    },
    requiredPermission: RBAC_PERMISSIONS.role.view,
  },
  accessControls: {
    label: "Access Controls",
    href: {
      admin: "/admin/roles?view=permissions",
      staff: "/staff/roles?view=permissions",
    },
    requiredPermission: RBAC_PERMISSIONS.permission.view,
  },
  bookings: {
    label: "Bookings",
    href: {
      admin: "/admin/bookings",
      staff: "/staff/bookings",
    },
    requiredPermission: RBAC_PERMISSIONS.meeting.view,
  },
} as const;

export const STAFF_LANDING_MODULE_ORDER = [
  DASHBOARD_MODULES.ticketOverview,
  DASHBOARD_MODULES.categoryManagement,
  DASHBOARD_MODULES.roleManagement,
] as const;
