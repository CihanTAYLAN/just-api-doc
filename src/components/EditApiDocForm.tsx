"use client"

import { useState } from "react"
import { ApiDoc } from "@prisma/client"
import { useRouter } from "next/navigation"

interface EditApiDocFormProps {
  apiDoc: ApiDoc
  onClose: () => void
  isOpen: boolean
}

export default function EditApiDocForm({ apiDoc, onClose, isOpen }: EditApiDocFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: apiDoc.name,
    jsonUrl: apiDoc.jsonUrl || "",
    isPublic: apiDoc.isPublic,
    accessCode: apiDoc.accessCode || "",
    logo: apiDoc.logo || ""
  })

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const form = e.target as HTMLFormElement
    const formDataToSend = new FormData(form)
    const jsonFile = formDataToSend.get("jsonFile") as File
    const logoFile = formDataToSend.get("logo") as File

    try {
      // Handle file uploads if present
      if (jsonFile && jsonFile.size > 0) {
        const jsonContent = await jsonFile.text()
        try {
          JSON.parse(jsonContent) // Validate JSON
          formDataToSend.append("jsonContent", jsonContent)
        } catch (error) {
          console.error("Invalid JSON file:", error)
          return
        }
      }

      if (logoFile && logoFile.size > 0) {
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(logoFile)
        })
        formDataToSend.append("logo", logoBase64)
      }

      const res = await fetch(`/api/api-docs/${apiDoc.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          logo: formDataToSend.get("logo") || formData.logo,
          jsonContent: formDataToSend.get("jsonContent"),
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update API doc")
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error("Error updating API doc:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit API Documentation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label htmlFor="jsonUrl" className="block text-sm font-medium mb-1">
              JSON URL
            </label>
            <input
              type="url"
              id="jsonUrl"
              name="jsonUrl"
              value={formData.jsonUrl}
              onChange={(e) => setFormData({ ...formData, jsonUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="jsonFile" className="block text-sm font-medium mb-1">
              Or Upload JSON Schema
            </label>
            <input
              type="file"
              id="jsonFile"
              name="jsonFile"
              accept="application/json"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium mb-1">
              Logo
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
            {formData.logo && (
              <div className="mt-2">
                <img
                  src={formData.logo}
                  alt="Current logo"
                  className="w-16 h-16 object-contain rounded"
                />
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              Public Access
            </label>
          </div>

          {!formData.isPublic && (
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium mb-1">
                Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                name="accessCode"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
