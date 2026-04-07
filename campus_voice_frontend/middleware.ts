export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/submit/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};