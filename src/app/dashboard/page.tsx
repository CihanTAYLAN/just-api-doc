import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ApiDocList from "@/components/ApiDocList"
import CreateApiDocButton from "@/components/CreateApiDocButton"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const apiDocs = await prisma.apiDoc.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your API Documentation</h1>
          <CreateApiDocButton />
        </div>

        <ApiDocList apiDocs={apiDocs} />
      </div>
    </div>
  )
}
