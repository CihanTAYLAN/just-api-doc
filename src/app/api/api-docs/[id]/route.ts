import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSession(): Promise<any> {
	return getServerSession(authOptions);
}

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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	try {
		const { searchParams } = new URL(req.url);
		const accessCode = searchParams.get("code");

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id,
			},
		});

		if (!apiDoc) {
			return NextResponse.json({ error: "API Doc not found" }, { status: 404 });
		}

		if (!apiDoc.isPublic) {
			const session = await getSession();

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
	} catch {
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	try {
		const session = await getSession();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id,
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
				id,
			},
			data: body,
		});

		return NextResponse.json(updatedApiDoc);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: "Validation failed" }, { status: 400 });
		}

		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	try {
		const session = await getSession();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const apiDoc = await prisma.apiDoc.findUnique({
			where: {
				id,
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
				id,
			},
		});

		return NextResponse.json({ message: "API Doc deleted successfully" });
	} catch {
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
