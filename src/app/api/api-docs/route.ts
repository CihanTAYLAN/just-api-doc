import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// API doc validation schema
const apiDocSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		jsonUrl: z.string().url("Invalid URL format").optional(),
		jsonContent: z.string().optional(),
		isPublic: z.boolean().optional().default(false),
		accessCode: z.string().optional(),
		authType: z.enum(["NONE", "API_KEY", "BASIC_AUTH", "BEARER_TOKEN"]).optional().default("NONE"),
		authKey: z.string().optional(),
		authSecret: z.string().optional(),
		authHeader: z.string().optional(),
	})
	.refine((data) => data.jsonUrl || data.jsonContent, {
		message: "Either JSON URL or content must be provided",
	});

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const data = await req.json();

		// Validate input data
		const validationResult = apiDocSchema.safeParse(data);
		if (!validationResult.success) {
			return NextResponse.json({ errors: validationResult.error.errors }, { status: 400 });
		}

		const validatedData = validationResult.data;

		// If jsonContent is provided, validate it's valid JSON
		if (validatedData.jsonContent) {
			try {
				JSON.parse(validatedData.jsonContent);
			} catch {
				return NextResponse.json({ errors: [{ message: "Invalid JSON content" }] }, { status: 400 });
			}
		}

		// Create API doc
		const apiDoc = await prisma.apiDoc.create({
			data: {
				...validatedData,
				userId: session.user.id,
			},
		});

		return NextResponse.json(apiDoc);
	} catch (error) {
		console.error("Error creating API doc:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal Server Error",
				details: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const { searchParams } = new URL(req.url);
		const isPublic = searchParams.get("public") === "true";

		if (isPublic) {
			const apiDocs = await prisma.apiDoc.findMany({
				where: {
					isPublic: true,
				},
				orderBy: {
					updatedAt: "desc",
				},
			});
			return NextResponse.json(apiDocs);
		}

		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const apiDocs = await prisma.apiDoc.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		return NextResponse.json(apiDocs);
	} catch (error) {
		console.error("Error fetching API docs:", error);
		if (error instanceof Error) {
			return new NextResponse(error.message, { status: 500 });
		}
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
