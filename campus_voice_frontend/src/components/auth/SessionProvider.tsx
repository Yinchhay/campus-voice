"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type AppSessionProviderProps = {
	session: Session | null;
	children: React.ReactNode;
};

export function AppSessionProvider({ session, children }: AppSessionProviderProps) {
	return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
