import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, jsonUrl, isPublic, accessCode } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const apiDoc = await prisma.apiDoc.create({
      data: {
        name,
        jsonUrl,
        isPublic,
        accessCode,
        userId: session.user.id,
      },
    })

    return NextResponse.json(apiDoc)
  } catch (error) {
    console.error("Error creating API doc:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const isPublic = searchParams.get("public") === "true"

    if (isPublic) {
      const apiDocs = await prisma.apiDoc.findMany({
        where: {
          isPublic: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      return NextResponse.json(apiDocs)
    }

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const apiDocs = await prisma.apiDoc.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(apiDocs)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
