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

    const { name, logo, jsonUrl, jsonContent, isPublic, accessCode } = await req.json()

    const apiDoc = await prisma.apiDoc.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!apiDoc) {
      return new NextResponse("API Doc not found", { status: 404 })
    }

    if (apiDoc.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const updatedApiDoc = await prisma.apiDoc.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        logo,
        jsonUrl,
        jsonContent,
        isPublic,
        accessCode,
      },
    })

    return NextResponse.json(updatedApiDoc)
  } catch (error) {
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

    const apiDoc = await prisma.apiDoc.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!apiDoc) {
      return new NextResponse("API Doc not found", { status: 404 })
    }

    if (apiDoc.userId !== session.user.id) {
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
