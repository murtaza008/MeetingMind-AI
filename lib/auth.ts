import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

const providers: NonNullable<NextAuthConfig["providers"]> = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.displayName ?? undefined,
        image: user.avatarUrl ?? undefined,
      };
    },
  }),
];

// Google sign-in only appears once GOOGLE_CLIENT_ID/SECRET are configured — free
// to set up in Google Cloud Console, but optional so the app works without it.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;

      // First Google sign-in for this email: create the local user record so
      // the rest of the app (Prisma FKs) has something to point at.
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (!existing) {
        const created = await prisma.user.create({
          data: {
            email: user.email,
            displayName: user.name ?? undefined,
            avatarUrl: user.image ?? undefined,
          },
        });
        user.id = created.id;
      } else {
        user.id = existing.id;
      }
      return true;
    },
  },
});

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
