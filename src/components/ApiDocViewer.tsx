"use client"

import { ApiDoc, User } from "@prisma/client"
import { useEffect, useState } from "react"

interface ApiDocViewerProps {
  apiDoc: ApiDoc & {
    user: {
      name: string | null
      email: string
    }
  }
}

export default function ApiDocViewer({ apiDoc }: ApiDocViewerProps) {
  const [jsonData, setJsonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJsonData = async () => {
      try {
        if (apiDoc.jsonContent) {
          setJsonData(JSON.parse(apiDoc.jsonContent))
        } else if (apiDoc.jsonUrl) {
          const response = await fetch(apiDoc.jsonUrl)
          if (!response.ok) {
            throw new Error("Failed to fetch API documentation")
          }
          const data = await response.json()
          setJsonData(data)
        } else {
          throw new Error("No API documentation content available")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load API documentation")
      } finally {
        setLoading(false)
      }
    }

    loadJsonData()
  }, [apiDoc])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {apiDoc.logo && (
                <img
                  src={apiDoc.logo}
                  alt={`${apiDoc.name} logo`}
                  className="h-8 w-8 mr-3"
                />
              )}
              <h1 className="text-xl font-bold">{apiDoc.name}</h1>
            </div>
            <div className="text-sm text-gray-500">
              By {apiDoc.user.name || apiDoc.user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Here you would typically use a specialized component to render the API documentation
            based on the format of your JSON data (e.g., OpenAPI/Swagger UI) */}
        <pre className="bg-white p-4 rounded-lg shadow overflow-auto">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
