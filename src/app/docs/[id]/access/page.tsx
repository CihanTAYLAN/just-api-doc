import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AccessCodeForm from "@/components/AccessCodeForm"

interface AccessPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AccessPage({ params }: AccessPageProps) {
  const { id } = await params;
  const apiDoc = await prisma.apiDoc.findUnique({
    where: {
      id,
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
    <div className="min-h-screen-custom flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Protected Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please enter the access code to view {apiDoc.name}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ring-1 ring-gray-900/5 backdrop-blur-sm">
          <AccessCodeForm docId={(await params).id} docName={apiDoc.name} />
        </div>
      </div>
    </div>
  )
}
