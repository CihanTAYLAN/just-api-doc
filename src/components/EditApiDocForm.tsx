"use client"

import { ApiDoc } from "@prisma/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface EditApiDocFormProps {
  apiDoc: ApiDoc
}

export default function EditApiDocForm({ apiDoc }: EditApiDocFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const logo = formData.get("logo") as string
    const jsonUrl = formData.get("jsonUrl") as string
    const isPublic = formData.get("isPublic") === "true"
    const accessCode = formData.get("accessCode") as string
    const jsonFile = (formData.get("jsonFile") as File)?.size > 0
      ? formData.get("jsonFile") as File
      : null

    try {
      let jsonContent = apiDoc.jsonContent

      if (jsonUrl && jsonUrl !== apiDoc.jsonUrl) {
        const response = await fetch(jsonUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch JSON from URL")
        }
        jsonContent = await response.text()
      } else if (jsonFile) {
        jsonContent = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsText(jsonFile)
        })
      }

      const res = await fetch(`/api/api-docs/${apiDoc.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          logo,
          jsonUrl: jsonUrl || null,
          jsonContent,
          isPublic,
          accessCode: accessCode || null,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update API doc")
      }

      router.refresh()
      router.push("/dashboard")
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          defaultValue={apiDoc.name}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
          Logo URL
        </label>
        <input
          type="url"
          name="logo"
          id="logo"
          defaultValue={apiDoc.logo || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="jsonUrl" className="block text-sm font-medium text-gray-700">
          JSON URL
        </label>
        <input
          type="url"
          name="jsonUrl"
          id="jsonUrl"
          defaultValue={apiDoc.jsonUrl || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700">
          Or Upload New JSON File
        </label>
        <input
          type="file"
          name="jsonFile"
          id="jsonFile"
          accept="application/json"
          className="mt-1 block w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isPublic"
          id="isPublic"
          value="true"
          defaultChecked={apiDoc.isPublic}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
          Make public
        </label>
      </div>

      <div>
        <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
          Access Code (optional)
        </label>
        <input
          type="text"
          name="accessCode"
          id="accessCode"
          defaultValue={apiDoc.accessCode || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-500">
          Leave empty for no access code
        </p>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
