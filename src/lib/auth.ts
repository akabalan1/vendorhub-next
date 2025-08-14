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

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" as const },

  providers: [
    EmailProvider({
      // Minimal SMTP to satisfy runtime checks (not used when we override sendVerificationRequest)
      server: {
        host: "localhost",
        port: 587,
        auth: { user: "noop", pass: "noop" },
      },
      from: process.env.EMAIL_FROM!, // e.g. "VendorHub <auth@yourdomain.com>"
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
    // Enforce @meta.com sign-ins
    async signIn(params: {
      user: { email?: string | null };
      account?: unknown;
      profile?: unknown;
      email?: { verificationRequest?: boolean };
      credentials?: unknown;
    }) {
      const addr = (params.user?.email ?? "").toLowerCase();
      return addr.endsWith("@meta.com");
    },

    // Add id + isAdmin on the session
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

    /**
     * 👇 This powers the edge middleware via `export { auth as middleware }`
     * Return true to allow the request, false to block (and redirect to /signin).
     */
    authorized({ auth, request }: { auth: import("next-auth").Session | null; request: Request }) {
      const url = new URL(request.url);
      const { pathname } = url;

      // Public routes (no auth needed)
      const isPublic =
        pathname.startsWith("/signin") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml";

      if (isPublic) return true;

      // All other routes require a session
      return !!auth?.user?.email;
    },
  },

  events: {
    async createUser(message: { user: { id?: string; email?: string | null } }) {
      const id = message.user.id;
      if (!id) return; // type-safety: id can be undefined in the generic type
      const emailLower = (message.user.email ?? "").toLowerCase();
      if (ADMIN_EMAILS.includes(emailLower)) {
        await prisma.user.update({ where: { id }, data: { isAdmin: true } });
      }
    },
  },

  trustHost: true,
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
