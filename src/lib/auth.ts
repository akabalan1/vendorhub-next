// src/lib/auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

// ---- Extend Session: add id and isAdmin
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Comma-separated list of admin emails (optional)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" as const },
  pages: {
    signIn: "/signin", // where unauthorized users get redirected
  },
  providers: [
    EmailProvider({
      // A minimal SMTP object is still required by the provider’s runtime checks.
      server: { host: "localhost", port: 587, auth: { user: "noop", pass: "noop" } },
      from: process.env.EMAIL_FROM!, // e.g. "VendorHub <auth@yourdomain.com>"

      // We actually send mail via Resend:
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
    /**
     * This is evaluated by the exported middleware (below).
     * Return true only when the request has an authenticated user.
     * If false, NextAuth’s middleware redirects to pages.signIn.
     */
    authorized({ auth }: { auth: { user?: { email?: string | null } } | null }) {
      return !!auth?.user?.email; // gate everything behind a session
    },

    // Gate sign-in to @meta.com addresses
    async signIn(params: {
      user: { email?: string | null } | null;
      account?: unknown;
      profile?: unknown;
      email?: { email?: string | null };
      credentials?: Record<string, unknown>;
    }) {
      const addr = (params.email?.email ?? params.user?.email ?? "").toLowerCase();
      return addr.endsWith("@meta.com");
    },

    // Populate session with id + isAdmin flag
    async session(params: {
      session: import("next-auth").Session;
      user: { id: string; email?: string | null; isAdmin?: boolean };
      token?: unknown;
    }) {
      const { session, user } = params;
      if (session.user) {
        session.user.id = user.id;
        const emailLower = (user.email ?? "").toLowerCase();
        session.user.isAdmin = !!user.isAdmin || ADMIN_EMAILS.includes(emailLower);
      }
      return session;
    },
  },

  events: {
    // Mark newly-created users as admin if their email is in ADMIN_EMAILS
    async createUser(message: { user: { id: string; email?: string | null } }) {
      const emailLower = (message.user.email ?? "").toLowerCase();
      if (ADMIN_EMAILS.includes(emailLower)) {
        await prisma.user.update({
          where: { id: message.user.id },
          data: { isAdmin: true },
        });
      }
    },
  },

  trustHost: true,
};

// Expose NextAuth helpers (and the middleware entry used above)
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig as any);
