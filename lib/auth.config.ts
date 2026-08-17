import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/new",
  "/meetings",
  "/actions",
  "/team",
  "/billing",
  "/settings",
  "/onboarding",
];

/** Edge-safe config (no Prisma/bcrypt) — consumed by proxy.ts and lib/auth.ts. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
