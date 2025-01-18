import { NextResponse } from "next/server";

export async function GET() {
	const openApiSpec = {
		openapi: "3.0.0",
		info: {
			title: "Example API",
			description: "This is an example API documentation",
			version: "1.0.0",
		},
		servers: [
			{
				url: "https://api.example.com",
				description: "Production server",
			},
		],
		tags: [
			{
				name: "Users",
				description: "Operations about users",
			},
			{
				name: "Authentication",
				description: "Authentication related operations",
			},
			{
				name: "Files",
				description: "File upload and download operations",
			},
		],
		paths: {
			"/users": {
				get: {
					tags: ["Users"],
					summary: "List Users",
					description: "Retrieve all users from the system",
					responses: {
						"200": {
							description: "Successful response",
							content: {
								"application/json": {
									schema: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: {
													type: "integer",
													example: 1,
												},
												name: {
													type: "string",
													example: "John Smith",
												},
												email: {
													type: "string",
													example: "john@example.com",
												},
											},
										},
									},
								},
							},
						},
					},
				},
				post: {
					tags: ["Users", "Authentication"],
					summary: "Create User",
					description: "Create a new user in the system",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											example: "Jane Doe",
										},
										email: {
											type: "string",
											example: "jane@example.com",
										},
										password: {
											type: "string",
											example: "********",
										},
									},
									required: ["name", "email", "password"],
								},
							},
						},
					},
					responses: {
						"201": {
							description: "User created successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											id: {
												type: "integer",
												example: 1,
											},
											name: {
												type: "string",
												example: "Jane Doe",
											},
											email: {
												type: "string",
												example: "jane@example.com",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/users/{userId}/avatar": {
				post: {
					tags: ["Users", "Files"],
					summary: "Upload User Avatar",
					description: "Upload a profile picture for a user using multipart/form-data",
					parameters: [
						{
							name: "userId",
							in: "path",
							required: true,
							schema: {
								type: "integer",
							},
							description: "ID of the user",
						},
					],
					requestBody: {
						required: true,
						content: {
							"multipart/form-data": {
								schema: {
									type: "object",
									properties: {
										avatar: {
											type: "string",
											format: "binary",
											description: "The avatar image file",
										},
									},
									required: ["avatar"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Avatar uploaded successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											avatarUrl: {
												type: "string",
												example: "https://api.example.com/avatars/123.jpg",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/files/upload": {
				post: {
					tags: ["Files"],
					summary: "Upload Multiple Files",
					description: "Upload multiple files with additional metadata using multipart/form-data",
					requestBody: {
						required: true,
						content: {
							"multipart/form-data": {
								schema: {
									type: "object",
									properties: {
										files: {
											type: "array",
											items: {
												type: "string",
												format: "binary",
											},
											description: "Multiple files to upload",
										},
										description: {
											type: "string",
											description: "Description for the uploaded files",
										},
										category: {
											type: "string",
											enum: ["documents", "images", "videos"],
											description: "Category of the files",
										},
									},
									required: ["files"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Files uploaded successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											uploadedFiles: {
												type: "array",
												items: {
													type: "object",
													properties: {
														fileName: {
															type: "string",
															example: "document.pdf",
														},
														fileUrl: {
															type: "string",
															example: "https://api.example.com/files/document.pdf",
														},
														fileSize: {
															type: "integer",
															example: 1024576,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};

	return NextResponse.json(openApiSpec);
}
