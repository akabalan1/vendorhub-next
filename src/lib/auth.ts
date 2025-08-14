// src/lib/auth.ts
import NextAuth, { type DefaultSession, type Session } from "next-auth";
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

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" as const },

  // Use our custom sign-in page
  pages: { signIn: "/signin" },

  providers: [
    EmailProvider({
      // Minimal SMTP to satisfy runtime checks; actual sending is via Resend below
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
    // Only allow @meta.com emails
    async signIn(params: any) {
      const addr = String(params?.user?.email || "").toLowerCase();
      return addr.endsWith("@meta.com");
    },

    // Add id and isAdmin to the session object
    async session({
      session,
      user,
    }: {
      session: Session;
      user: { id?: string; email?: string | null; isAdmin?: boolean };
    }) {
      if (session.user) {
        if (user.id) {
          // only assign when present to satisfy typing at runtime
          (session.user as any).id = user.id;
        }
        const emailLower = (user.email ?? "").toLowerCase();
        session.user.isAdmin = !!user.isAdmin || ADMIN_EMAILS.includes(emailLower);
      }
      return session;
    },

    // Used by middleware’s auth() to decide if a request is authorized
    authorized({ auth }: { auth: Session | null }) {
      return !!auth?.user?.email;
    },
  },

  events: {
    // Auto-mark user as admin if their email is in ADMIN_EMAILS
    async createUser(message: any) {
      const user = message?.user as { id?: string; email?: string | null } | undefined;
      if (!user?.id) return; // nothing to do if id is missing
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
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
