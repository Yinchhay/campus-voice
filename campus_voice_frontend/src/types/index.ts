import type { DefaultSession } from "next-auth";
import type {} from "next-auth/jwt";

type CampusVoiceRole = "student" | "staff" | "admin";

declare module "next-auth" {
	interface Session {
		accessToken?: string;
		user: {
			id: string;
			role?: CampusVoiceRole;
		} & DefaultSession["user"];
	}

	interface User {
		accessToken?: string;
		role?: CampusVoiceRole;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		accessToken?: string;
		role?: CampusVoiceRole;
	}
}

export {};
