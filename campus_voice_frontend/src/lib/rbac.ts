import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentStaffAccount, type CurrentStaffAccount } from "@/lib/admin-api";
import { STAFF_LANDING_MODULE_ORDER } from "@/lib/dashboard-access";
import type { PermissionCodename } from "@/lib/types";

let cachedAccount: CurrentStaffAccount | null = null;
let hasLoadedAccount = false;

export function permissionsForAccount(account: CurrentStaffAccount | null) {
  if (!account) return new Set<PermissionCodename>();
  if (account.is_superadmin || account.role === "ADMIN") {
    return new Set<PermissionCodename>(["*"]);
  }

  return new Set<PermissionCodename>(
    (account.roles ?? []).flatMap((role) =>
      role.is_active === false
        ? []
        : (role.permissions ?? []).map((permission) => permission.codename as PermissionCodename),
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
  for (const dashboardModule of STAFF_LANDING_MODULE_ORDER) {
    if (canUsePermission(permissions, dashboardModule.requiredPermission)) {
      return dashboardModule.href.staff ?? "/staff/no-access";
    }
  }
  return "/staff/no-access";
}

export async function getStaffLandingPath() {
  try {
    const account = await getCurrentStaffAccount();
    cachedAccount = account;
    hasLoadedAccount = true;
    return resolveStaffLandingPath(permissionsForAccount(account));
  } catch {
    return "/staff/no-access";
  }
}

export function useRbacPermissions() {
  const [account, setAccount] = useState<CurrentStaffAccount | null>(cachedAccount);
  const [isLoading, setIsLoading] = useState(!hasLoadedAccount);

  useEffect(() => {
    // Skip the network call entirely if we already have a cached result.
    // Multiple components on the same page all call this hook; without
    // this guard every mount triggers a fresh /api/auth/session round-trip.
    if (hasLoadedAccount) {
      setAccount(cachedAccount);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadAccount() {
      try {
        const current = await getCurrentStaffAccount();
        cachedAccount = current;
        hasLoadedAccount = true;
        if (isMounted) setAccount(current);
      } catch {
        cachedAccount = null;
        hasLoadedAccount = true;
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
