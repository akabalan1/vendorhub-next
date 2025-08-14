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

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" }, // keep "database" since you have Session model
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  // 👇 Tell NextAuth where your sign-in page is.
  // If your page is at src/app/(auth)/signin/page.tsx, the route is "/signin".
  // If you kept it under /auth/signin, change this to "/auth/signin".
  pages: {
    signIn: "/signin",
  },

  providers: [
    EmailProvider({
      // Dummy SMTP to satisfy runtime check; we actually send via Resend below.
      server: {
        host: "localhost",
        port: 587,
        auth: { user: "noop", pass: "noop" },
      },
      from: process.env.EMAIL_FROM!, // e.g. "VendorHub <auth@yourdomain.com>"

      // Send magic link via Resend
      async sendVerificationRequest({ identifier, url }) {
        const { host } = new URL(url);
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
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
    // Only allow @meta.com emails to complete sign-in
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

    // 👇 This powers the middleware gate.
    // Return true only when a session user exists.
    authorized({ auth }) {
      return !!auth?.user?.email;
    },

    // Add id and isAdmin to the session object
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
    // Auto-mark user as admin if their email is in ADMIN_EMAILS
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
} as any);
