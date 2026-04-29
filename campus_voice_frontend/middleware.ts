import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  const isStudentAuthPage = pathname === "/login";
  const isStaffAuthPage = pathname === "/staff/login";
  const isAdminAuthPage = pathname === "/admin/login";
  const isAuthPage = isStudentAuthPage || isStaffAuthPage || isAdminAuthPage;
  const isStudent = pathname.startsWith("/student");
  const isStaff = pathname.startsWith("/staff");
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = (isStudent || isStaff || isAdmin) && !isAuthPage;

  const roleHome =
    role === "admin"
      ? "/admin/dashboard"
      : role === "staff"
        ? "/staff/dashboard"
        : "/student/dashboard";

  if (!isLoggedIn && isProtected) {
    if (isStaff) {
      return NextResponse.redirect(new URL("/staff/login", req.nextUrl));
    }

    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }

    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isProtected) {
    if (isStaff && role !== "staff") {
      return NextResponse.redirect(new URL(roleHome, req.nextUrl));
    }

    if (isAdmin && role !== "admin") {
      return NextResponse.redirect(new URL(roleHome, req.nextUrl));
    }

    if (isStudent && role && role !== "student") {
      return NextResponse.redirect(new URL(roleHome, req.nextUrl));
    }
  }

  if (isLoggedIn && isAuthPage) {
    if (isStaffAuthPage) {
      return NextResponse.redirect(new URL(role === "staff" ? "/staff/dashboard" : roleHome, req.nextUrl));
    }

    if (isAdminAuthPage) {
      return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : roleHome, req.nextUrl));
    }

    return NextResponse.redirect(new URL(roleHome, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/student/:path*", "/staff/:path*", "/admin/:path*"],
};
