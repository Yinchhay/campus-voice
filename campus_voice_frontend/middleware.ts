import { auth } from "@/lib/auth";
import {
  dashboardPathForRole,
  isAuthPagePath,
  loginPathForRole,
  normalizeCampusVoiceRole,
  roleForProtectedPath,
} from "@/lib/auth-routes";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const role = normalizeCampusVoiceRole(req.auth?.user?.role);
  const pathname = req.nextUrl.pathname;

  const requiredRole = roleForProtectedPath(pathname);
  const isAuthPage = isAuthPagePath(pathname);

  if (requiredRole && (!isLoggedIn || !role)) {
    return NextResponse.redirect(new URL(loginPathForRole(requiredRole), req.nextUrl));
  }

  if (requiredRole && role !== requiredRole) {
    return NextResponse.redirect(new URL(dashboardPathForRole(role), req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL(dashboardPathForRole(role), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/student/:path*", "/staff/:path*", "/admin/:path*"],
};
