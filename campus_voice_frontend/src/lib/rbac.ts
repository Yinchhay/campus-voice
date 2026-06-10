import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentStaffAccount, type CurrentStaffAccount } from "@/lib/admin-api";

export type PermissionCodename = `${string}.${string}` | "*";

export function permissionsForAccount(account: CurrentStaffAccount | null) {
  if (!account) return new Set<PermissionCodename>();
  if (account.is_superadmin || account.role === "ADMIN") {
    return new Set<PermissionCodename>(["*"]);
  }

  return new Set<PermissionCodename>(
    (account.roles ?? []).flatMap((role) =>
      (role.permissions ?? []).map((permission) => permission.codename as PermissionCodename),
    ),
  );
}

export function canUsePermission(
  permissions: Set<PermissionCodename>,
  codename?: PermissionCodename,
) {
  if (!codename) return true;
  return permissions.has("*") || permissions.has(codename);
}

export function canUseAnyPermission(
  permissions: Set<PermissionCodename>,
  codenames: PermissionCodename[],
) {
  if (permissions.has("*")) return true;
  return codenames.some((codename) => permissions.has(codename));
}

export function resolveStaffLandingPath(permissions: Set<PermissionCodename>) {
  if (canUsePermission(permissions, "ticket.view")) return "/staff/dashboard";
  if (canUsePermission(permissions, "category.view")) return "/staff/categories";
  return "/staff/no-access";
}

export async function getStaffLandingPath() {
  try {
    const account = await getCurrentStaffAccount();
    return resolveStaffLandingPath(permissionsForAccount(account));
  } catch {
    return "/staff/no-access";
  }
}

export function useRbacPermissions() {
  const [account, setAccount] = useState<CurrentStaffAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const current = await getCurrentStaffAccount();
        if (isMounted) setAccount(current);
      } catch {
        if (isMounted) setAccount(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  const permissions = useMemo(() => permissionsForAccount(account), [account]);
  const isSuperadmin = permissions.has("*");
  const hasPermission = useCallback(
    (codename?: PermissionCodename) => canUsePermission(permissions, codename),
    [permissions],
  );
  const hasAnyPermission = useCallback(
    (codenames: PermissionCodename[]) => canUseAnyPermission(permissions, codenames),
    [permissions],
  );

  return {
    account,
    permissions,
    isLoading,
    isSuperadmin,
    hasPermission,
    hasAnyPermission,
  };
}

export const useAdminPermissions = useRbacPermissions;
