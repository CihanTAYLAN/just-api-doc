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
  const apiDoc = await prisma.apiDoc.findUnique({
    where: {
      id: params.id,
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
    redirect("/")
  }

  // Check access permissions
  if (!apiDoc.isPublic) {
    // If not public, check if user is owner
    if (session?.user?.id === apiDoc.userId) {
      // Allow access to owner
    } else if (apiDoc.accessCode) {
      // If has access code, check if provided code matches
      if (searchParams.code !== apiDoc.accessCode) {
        redirect(`/docs/${params.id}/access`)
      }
    } else {
      // If private and no access code, only owner can view
      redirect("/")
    }
  }

  return (
    <div className="min-h-screen-custom">
      <ApiDocViewer apiDoc={apiDoc} />
    </div>
  )
}
