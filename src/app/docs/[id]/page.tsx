import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ApiDocViewer from "@/components/ApiDocViewer"

interface ViewApiDocPageProps {
  params: {
    id: string
  }
  searchParams: {
    code?: string
  }
}

export default async function ViewApiDocPage({ params, searchParams }: ViewApiDocPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params;
  const accessCode = (await searchParams).code;

  const apiDoc = await prisma.apiDoc.findUnique({
    where: {
      id: id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!apiDoc) {
    redirect("/dashboard")
  }

  if (!apiDoc.isPublic && (!session?.user?.id || session.user.id !== apiDoc.userId)) {
    if (apiDoc.accessCode) {
      if (!accessCode) {
        redirect(`/docs/${apiDoc.id}/access`)
      }
      if (accessCode !== apiDoc.accessCode) {
        redirect(`/docs/${apiDoc.id}/access?error=invalid`)
      }
    } else {
      redirect(`/docs/${apiDoc.id}/access`)
    }
  }

  return (
    <div className="min-h-screen-custom">
      <ApiDocViewer apiDoc={apiDoc} />
    </div>
  )
}
