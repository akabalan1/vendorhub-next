// src/lib/auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

// ---- Session augmentation: add id and isAdmin to session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Comma-separated list of admin emails in env
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const authConfig = {
  adapter: PrismaAdapter(prisma),
  // Using database sessions because you have the Session model in Prisma
  session: { strategy: "database" as const },
  providers: [
    EmailProvider({
      maxAge: 60 * 60 * 24, // 24 hours
      async sendVerificationRequest({ identifier, url }) {
        const { host } = new URL(url);
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM!, // e.g. "VendorHub <auth@yourdomain.com>"
          to: identifier,
          subject: "Sign in to VendorHub",
          html: `
            <p>Sign in to <strong>${host}</strong></p>
            <p><a href="${url}">Click here to sign in</a></p>
            <p style="color:#666">Or paste this link into your browser:<br>${url}</p>
          `,
          text: `Sign in to ${host}\n${url}`,
        });
        if ((result as any)?.error) {
          throw new Error((result as any).error.message || "Failed to send email");
        }
      },
    }),
  ],
  callbacks: {
    // Only allow @meta.com emails
    async signIn({
      user,
      email,
    }: {
      user: { email?: string | null } | null;
      email?: { email?: string | null };
    }) {
      const addr = (email?.email ?? user?.email ?? "").toLowerCase();
      return addr.endsWith("@meta.com");
    },

    // Inject id and isAdmin into the session
    async session({
      session,
      user,
    }: {
      session: import("next-auth").Session;
      user: { id: string; email?: string | null; isAdmin?: boolean };
    }) {
      if (session.user) {
        session.user.id = user.id;
        const emailLower = (user.email ?? "").toLowerCase();
        session.user.isAdmin = !!user.isAdmin || ADMIN_EMAILS.includes(emailLower);
      }
      return session;
    },
  },
  events: {
    // Auto-mark as admin if their email is in ADMIN_EMAILS on first creation
    async createUser({ user }: { user: { id: string; email?: string | null } }) {
      const emailLower = (user.email ?? "").toLowerCase();
      if (ADMIN_EMAILS.includes(emailLower)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
      }
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig as any);
