import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16 renamed Middleware to Proxy — same mechanics, new file name.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/new/:path*",
    "/meetings/:path*",
    "/actions/:path*",
    "/team/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/onboarding",
  ],
};
