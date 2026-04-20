import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login");
  const isStudent = pathname.startsWith("/student");
  const isStaff = pathname.startsWith("/staff");
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = isStudent || isStaff || isAdmin;

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/student/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/student/:path*", "/staff/:path*", "/admin/:path*"],
};