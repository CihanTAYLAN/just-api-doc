import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
	try {
		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!apiDoc) {
			return new NextResponse("API Doc not found", { status: 404 });
		}

		if (!apiDoc.isPublic) {
			const session = await getServerSession(authOptions);

			if (!session?.user?.id || apiDoc.userId !== session.user.id) {
				return new NextResponse("Unauthorized", { status: 401 });
			}
		}

		return NextResponse.json(apiDoc);
	} catch (error) {
		return new NextResponse("Internal error", { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!apiDoc) {
			return new NextResponse("API Doc not found", { status: 404 });
		}

		if (apiDoc.userId !== session.user.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const data = await req.json();
		
		// Validate the request data using Zod
		const validationResult = apiDocSchema.safeParse(data);
		
		if (!validationResult.success) {
			return NextResponse.json(
				{
					message: "Validation failed",
					errors: validationResult.error.errors,
				},
				{ status: 400 }
			);
		}

		const updatedApiDoc = await prisma.apiDoc.update({
			where: {
				id: params.id,
			},
			data: validationResult.data,
		});

		return NextResponse.json(updatedApiDoc);
	} catch (error) {
		console.error("Error updating API doc:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const existingDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!existingDoc) {
			return new NextResponse("API Doc not found", { status: 404 });
		}

		if (existingDoc.userId !== session.user.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		await prisma.apiDoc.delete({
			where: {
				id: params.id,
			},
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		return new NextResponse("Internal error", { status: 500 });
	}
}
