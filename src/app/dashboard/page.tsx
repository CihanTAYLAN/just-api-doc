"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ApiDoc } from "@prisma/client"
import CreateApiDocButton from "@/components/CreateApiDocButton"
import EditApiDocForm from "@/components/EditApiDocForm"
import ApiDocList from "@/components/ApiDocList"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiDocs, setApiDocs] = useState<ApiDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<ApiDoc | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const loadApiDocs = async () => {
    try {
      const res = await fetch("/api/api-docs")
      if (!res.ok) throw new Error("Failed to fetch API docs")

      const data = await res.json()
      setApiDocs(data)
    } catch (error) {
      console.error("Error loading API docs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
      return
    }

    loadApiDocs()
  }, [session, status, router])

  const handleEdit = (doc: ApiDoc) => {
    setSelectedDoc(doc)
    setIsEditModalOpen(true)
  }

  const handleEditClose = async () => {
    setIsEditModalOpen(false)
    setSelectedDoc(null)
    await loadApiDocs() // Liste güncellemesi için
  }

  const handleCreateClose = async () => {
    setIsCreateModalOpen(false)
    await loadApiDocs() // Liste güncellemesi için
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen-custom p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen-custom p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your API Documentation</h1>
          <CreateApiDocButton
            isOpen={isCreateModalOpen}
            onClose={handleCreateClose}
            onOpen={() => setIsCreateModalOpen(true)}
          />
        </div>

        <ApiDocList
          apiDocs={apiDocs}
          onEdit={handleEdit}
        />

        {selectedDoc && (
          <EditApiDocForm
            apiDoc={selectedDoc}
            isOpen={isEditModalOpen}
            onClose={handleEditClose}
          />
        )}
      </div>
    </div>
  )
}
