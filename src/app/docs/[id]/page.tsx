import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ApiDocViewer from "@/components/ApiDocViewer"

interface ViewApiDocPageProps {
  params: {
    id: string | undefined
  }
}

export default async function ViewApiDocPage({ params }: ViewApiDocPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params;

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
    redirect(`/docs/${apiDoc.id}/access`)
  }

  return (
    <div className="min-h-screen-custom">
      <ApiDocViewer apiDoc={apiDoc} />
    </div>
  )
}
