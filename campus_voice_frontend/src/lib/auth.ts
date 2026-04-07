import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "paragon.edu.kh", // Restrict to Paragon Google accounts only
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow @paragon.edu.kh emails
      return profile?.email?.endsWith("@paragon.edu.kh") ?? false;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};