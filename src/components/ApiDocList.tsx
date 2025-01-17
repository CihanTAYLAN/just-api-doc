"use client"

import { ApiDoc } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarIcon, LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline"

interface ApiDocListProps {
  apiDocs: ApiDoc[]
  onEdit: (doc: ApiDoc) => void
}

export default function ApiDocList({ apiDocs, onEdit }: ApiDocListProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/api-docs/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete API doc")
      }

      router.refresh()
    } catch (error) {
      console.error("Error deleting API doc:", error)
    }
  }

  if (apiDocs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No API documentation found. Create your first one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apiDocs.map((doc) => (
        <div
          key={doc.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {doc.logo ? (
                  <img
                    src={doc.logo}
                    alt={`${doc.name} logo`}
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {doc.name.charAt(0)}
                    </span>
                  </div>
                )}
                <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {doc.name}
                </h3>
              </div>
              {doc.isPublic ? (
                <LockOpenIcon className="w-4 h-4 text-green-500" />
              ) : (
                <LockClosedIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {new Date(doc.updatedAt).toLocaleDateString()}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                doc.isPublic ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
              }`}>
                {doc.isPublic ? "Public" : "Private"}
                {!doc.isPublic && doc.accessCode && " • Protected"}
              </span>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => onEdit(doc)}
                className="flex-1 inline-flex justify-center items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
              >
                Edit
              </button>
              <Link
                href={`/docs/${doc.id}`}
                className="flex-1 inline-flex justify-center items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-colors"
              >
                View
              </Link>
              <button
                onClick={() => handleDelete(doc.id)}
                className="inline-flex justify-center items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
