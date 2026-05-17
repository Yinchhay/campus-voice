import type { DefaultSession } from "next-auth";
import type { CampusVoiceRole } from "@/lib/auth-routes";
import type {} from "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		accessToken?: string;
		accessTokenExpiresAt?: string;
		user: {
			id: string;
			role?: CampusVoiceRole;
		} & DefaultSession["user"];
	}

	interface User {
		accessToken?: string;
		refreshToken?: string;
		accessTokenExpiresAt?: string;
		refreshTokenExpiresAt?: string;
		role?: CampusVoiceRole;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		accessToken?: string;
		refreshToken?: string;
		accessTokenExpiresAt?: string;
		refreshTokenExpiresAt?: string;
		role?: CampusVoiceRole;
	}
}

export {};
