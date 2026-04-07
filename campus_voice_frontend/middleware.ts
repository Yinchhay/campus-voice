export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/submit/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};