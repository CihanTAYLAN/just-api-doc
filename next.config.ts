import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		// Build sırasında type hatalarını görmezden gel
		ignoreBuildErrors: true,
	},
	eslint: {
		// Build sırasında eslint hatalarını görmezden gel
		ignoreDuringBuilds: true,
	},
	images: {
		domains: ["ridenear.com"],
	},
};

export default nextConfig;
