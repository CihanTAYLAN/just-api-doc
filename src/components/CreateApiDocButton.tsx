"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateApiDocButton() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const jsonUrl = formData.get("jsonUrl") as string
    const jsonFile = (formData.get("jsonFile") as File)?.size > 0
      ? formData.get("jsonFile") as File
      : null

    try {
      let jsonContent = null
      
      if (jsonUrl) {
        const response = await fetch(jsonUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch JSON from URL")
        }
        jsonContent = await response.text()
      } else if (jsonFile) {
        jsonContent = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result)
          reader.readAsText(jsonFile)
        })
      }

      const res = await fetch("/api/api-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          jsonUrl,
          jsonContent,
          isPublic: false,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to create API doc")
      }

      const data = await res.json()
      router.push(`/dashboard/docs/${data.id}`)
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create New Doc
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New API Documentation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="jsonUrl" className="block text-sm font-medium text-gray-700">
                  JSON URL (Optional)
                </label>
                <input
                  type="url"
                  name="jsonUrl"
                  id="jsonUrl"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700">
                  Or Upload JSON File
                </label>
                <input
                  type="file"
                  name="jsonFile"
                  id="jsonFile"
                  accept="application/json"
                  className="mt-1 block w-full"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
