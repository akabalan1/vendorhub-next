import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_SET = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
);

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' }, // stays signed in across devices
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM!,
      // Custom email: simple magic-link with code in subject
      async sendVerificationRequest({ identifier, url }) {
        const domain = new URL(url).host;
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: identifier,
          subject: `Sign in to VendorHub (${domain})`,
          html: `<p>Click the link to sign in:</p><p><a href="${url}">${url}</a></p>`
        });
      },
      // Only allow @meta.com
      async authorize() {
        // NextAuth v5 uses callbacks.signIn instead; we'll gate there.
        return null;
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const e = (email?.email || user.email || '').toLowerCase();
      if (!e.endsWith('@meta.com')) return false; // gate by domain

      // Set isAdmin based on env list (first time & every sign-in)
      if (e && typeof user.id === 'string') {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: ADMIN_SET.has(e) }
        }).catch(() => {});
      }
      return true;
    },
    async session({ session, user }) {
      // expose isAdmin to client
      if (session.user) {
        (session.user as any).isAdmin = (user as any).isAdmin ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin'
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
