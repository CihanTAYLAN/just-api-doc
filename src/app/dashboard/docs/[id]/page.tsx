import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EditApiDocForm from "@/components/EditApiDocForm"

interface EditApiDocPageProps {
  params: {
    id: string
  }
}

export default async function EditApiDocPage({ params }: EditApiDocPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const apiDoc = await prisma.apiDoc.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!apiDoc) {
    redirect("/dashboard")
  }

  if (apiDoc.userId !== session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit API Documentation</h1>
        <EditApiDocForm apiDoc={apiDoc} />
      </div>
    </div>
  )
}
