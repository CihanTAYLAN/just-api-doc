import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		// Ignore type errors during build
		ignoreBuildErrors: true,
	},
	eslint: {
		// Ignore eslint errors during build
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
