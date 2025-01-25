declare module "next-auth" {
	interface DefaultSession {
		user?: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
		};
	}
	interface Session {
		user?: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
		};
	}
}
