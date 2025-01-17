import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apiDoc = await prisma.apiDoc.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!apiDoc) {
      return new NextResponse("API Doc not found", { status: 404 })
    }

    if (!apiDoc.isPublic) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id || apiDoc.userId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
    }

    return NextResponse.json(apiDoc)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, jsonUrl, isPublic, accessCode } = await req.json()

    const existingDoc = await prisma.apiDoc.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingDoc) {
      return new NextResponse("API Doc not found", { status: 404 })
    }

    if (existingDoc.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const apiDoc = await prisma.apiDoc.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        jsonUrl,
        isPublic,
        accessCode,
      },
    })

    return NextResponse.json(apiDoc)
  } catch (error) {
    console.error("Error updating API doc:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const existingDoc = await prisma.apiDoc.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingDoc) {
      return new NextResponse("API Doc not found", { status: 404 })
    }

    if (existingDoc.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.apiDoc.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
