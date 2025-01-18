import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// API doc validation schema
const apiDocSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		logo: z.string().optional().default(""),
		jsonUrl: z.string().optional().default(""),
		jsonContent: z.string().optional().default(""),
		isPublic: z.boolean().optional().default(false),
		accessCode: z.string().optional().default(""),
		authType: z.enum(["NONE", "API_KEY", "BASIC_AUTH", "BEARER_TOKEN"]).optional().default("NONE"),
		authKey: z.string().optional().default(""),
		authSecret: z.string().optional().default(""),
		authHeader: z.string().optional().default(""),
	})
	.refine((data) => data.jsonUrl || data.jsonContent, {
		message: "Either JSON URL or content must be provided",
	});

export async function GET(req: Request, { params }: { params: { id: string } }) {
	try {
		const { searchParams } = new URL(req.url);
		const accessCode = searchParams.get("code");

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!apiDoc) {
			return NextResponse.json({ error: "API Doc not found" }, { status: 404 });
		}

		if (!apiDoc.isPublic) {
			const session = await getServerSession(authOptions);

			if (!session?.user?.id || apiDoc.userId !== session.user.id) {
				// Check access code if provided
				if (apiDoc.accessCode && accessCode !== apiDoc.accessCode) {
					return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
				} else if (!apiDoc.accessCode) {
					return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
				}
			}
		}

		return NextResponse.json(apiDoc);
	} catch (error) {
		console.error("Error fetching API Doc:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!apiDoc) {
			return NextResponse.json({ error: "API Doc not found" }, { status: 404 });
		}

		if (apiDoc.userId !== session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const json = await req.json();
		const body = apiDocSchema.parse(json);

		const updatedApiDoc = await prisma.apiDoc.update({
			where: {
				id: params.id,
			},
			data: body,
		});

		return NextResponse.json(updatedApiDoc);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		console.error("Error updating API Doc:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!apiDoc) {
			return NextResponse.json({ error: "API Doc not found" }, { status: 404 });
		}

		if (apiDoc.userId !== session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await prisma.apiDoc.delete({
			where: {
				id: params.id,
			},
		});

		return NextResponse.json({ message: "API Doc deleted successfully" });
	} catch (error) {
		console.error("Error deleting API Doc:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
