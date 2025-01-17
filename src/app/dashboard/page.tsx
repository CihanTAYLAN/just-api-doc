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
  const [error, setError] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<ApiDoc | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const loadApiDocs = async () => {
    try {
      setError(null)
      const res = await fetch("/api/api-docs", {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to fetch API docs")
      }

      const data = await res.json()
      setApiDocs(data)
    } catch (error) {
      console.error("Error loading API docs:", error)
      setError(error instanceof Error ? error.message : "Failed to load API docs")
      setApiDocs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (!session?.user) {
      router.replace("/login")
      return
    }

    loadApiDocs()
  }, [session, status, router])

  const handleEdit = (doc: ApiDoc) => {
    setSelectedDoc(doc)
    console.log(doc);

    setIsEditModalOpen(true)
  }

  const handleEditClose = async () => {
    setIsEditModalOpen(false)
    setSelectedDoc(null)
    await loadApiDocs()
  }

  const handleCreateClose = async () => {
    setIsCreateModalOpen(false)
    await loadApiDocs()
  }

  if (status === "loading" || loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
        <button
          onClick={loadApiDocs}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your API Docs</h1>
        <CreateApiDocButton onClick={() => setIsCreateModalOpen(true)} />
      </div>

      <ApiDocList apiDocs={apiDocs} onEdit={handleEdit} />

      <EditApiDocForm
        apiDoc={selectedDoc}
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
      />

      <EditApiDocForm
        apiDoc={null}
        isOpen={isCreateModalOpen}
        onClose={handleCreateClose}
      />
    </div>
  )
}
