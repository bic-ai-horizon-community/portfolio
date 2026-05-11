import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

const ALLOWED_DOMAIN = "bicnepal.edu.np";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      const email = user.email;
      if (!email || !email.endsWith(ALLOWED_DOMAIN)) {
        return `/login?error=domain`;
      }

      // Upsert user on first Google sign-in
      await prisma.user.upsert({
        where: { email },
        update: { name: user.name || "Student" },
        create: {
          email,
          name: user.name || "Student",
          role: "PUBLIC",
        },
      });

      return true;
    },

    async jwt({ token, user, account }) {
      // On initial sign-in, fetch the DB user to get id + role
      if (account && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
