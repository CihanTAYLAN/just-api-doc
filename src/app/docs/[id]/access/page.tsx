import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AccessCodeForm from "@/components/AccessCodeForm"

interface AccessPageProps {
  params: {
    id: string
  }
}

export default async function AccessPage({ params }: AccessPageProps) {
  const apiDoc = await prisma.apiDoc.findUnique({
    where: {
      id: params.id,
    },
    select: {
      name: true,
      isPublic: true,
      accessCode: true,
    },
  })

  if (!apiDoc || !apiDoc.accessCode || apiDoc.isPublic) {
    redirect("/")
  }

  return (
    <div className="min-h-screen-custom flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Access Required
        </h1>
        <p className="text-center mb-6 text-gray-600">
          This API documentation requires an access code to view
        </p>
        <AccessCodeForm docId={params.id} docName={apiDoc.name} />
      </div>
    </div>
  )
}
