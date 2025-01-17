"use client"

import { ApiDoc } from "@prisma/client"
import Link from "next/link"
import { useState } from "react"

interface ApiDocListProps {
  apiDocs: ApiDoc[]
}

export default function ApiDocList({ apiDocs }: ApiDocListProps) {
  const [docs, setDocs] = useState(apiDocs)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/api-docs/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete API doc")
      }

      setDocs(docs.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("Error deleting API doc:", error)
    }
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No API documentation found. Create your first one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{doc.name}</h3>
            {doc.logo && (
              <img
                src={doc.logo}
                alt={`${doc.name} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
            <p className="text-sm">
              Status: {doc.isPublic ? "Public" : "Private"}
              {!doc.isPublic && doc.accessCode && " (Password Protected)"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/docs/${doc.id}`}
              className="flex-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 text-center"
            >
              Edit
            </Link>
            <Link
              href={`/docs/${doc.id}`}
              className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 text-center"
            >
              View
            </Link>
            <button
              onClick={() => handleDelete(doc.id)}
              className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
