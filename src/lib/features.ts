import { DocumentIcon, LockClosedIcon, PaintBrushIcon, ShareIcon, BeakerIcon, KeyIcon, CloudArrowUpIcon, CodeBracketIcon, MoonIcon } from "@heroicons/react/24/outline";

export const features = [
	{
		name: "OpenAPI 3.0 Support",
		description: "Import your OpenAPI 3.0 JSON schemas directly from files or URLs to create beautiful and interactive API documentation.",
		icon: DocumentIcon,
	},
	{
		name: "API Testing",
		description: "Test your APIs directly from the documentation interface. Make requests and view responses in real-time.",
		icon: BeakerIcon,
	},
	{
		name: "Authorization Support",
		description: "Handle various authorization methods for accessing API documentation, including URL security keys and Basic Authentication.",
		icon: KeyIcon,
	},
	{
		name: "Multiple Import Methods",
		description: "Import API documentation from various sources - upload JSON files directly or fetch from URLs with custom authorization.",
		icon: CloudArrowUpIcon,
	},
	{
		name: "Interactive Documentation",
		description: "Explore and test API endpoints with an interactive interface that makes understanding and using APIs easier.",
		icon: CodeBracketIcon,
	},
	{
		name: "Access Control",
		description: "Control who can view your documentation with public access or password protection options.",
		icon: LockClosedIcon,
	},
	{
		name: "Custom Branding",
		description: "Add your logo and customize the appearance to match your brand identity.",
		icon: PaintBrushIcon,
	},
	{
		name: "Easy Sharing",
		description: "Share your API documentation with team members or clients using a simple URL and optional access codes.",
		icon: ShareIcon,
	},
	{
		name: "Dark Mode",
		description: "Provide an optional dark mode for users who prefer a darker interface.",
		icon: MoonIcon,
	},
];
