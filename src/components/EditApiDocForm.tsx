"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiDoc } from "@prisma/client";

interface EditApiDocFormProps {
  apiDoc: ApiDoc | null
  isOpen: boolean
  onClose: () => void
}

export default function EditApiDocForm({ apiDoc, isOpen, onClose }: EditApiDocFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: apiDoc?.name || "",
    jsonUrl: apiDoc?.jsonUrl || "",
    jsonContent: apiDoc?.jsonContent || "",
    isPublic: apiDoc?.isPublic || false,
    accessCode: apiDoc?.accessCode || "",
    authType: apiDoc?.authType || "NONE",
    authKey: apiDoc?.authKey || "",
    authSecret: apiDoc?.authSecret || "",
    authHeader: apiDoc?.authHeader || "",
  })

  useEffect(() => {
    if (apiDoc) {
      setFormData({
        name: apiDoc?.name,
        jsonUrl: apiDoc?.jsonUrl || "",
        jsonContent: apiDoc?.jsonContent || "",
        isPublic: apiDoc?.isPublic,
        accessCode: apiDoc?.accessCode || "",
        authType: apiDoc?.authType,
        authKey: apiDoc?.authKey || "",
        authSecret: apiDoc?.authSecret || "",
        authHeader: apiDoc?.authHeader || "",
      })
    }
  }, [apiDoc])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        apiDoc ? `/api/api-docs/${apiDoc.id}` : "/api/api-docs",
        {
          method: apiDoc ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      )


      const data = await response.json()

      if (!response.ok) {
        console.log(response);

        if (data.errors) {
          // Validation errors from zod
          const errorMessage = data.errors.map((err: any) => err.message).join(", ")
          throw new Error(errorMessage)
        } else if (data.error) {
          // Server error
          throw new Error(data.error)
        } else {
          throw new Error("Failed to save API doc")
        }
      }

      router.refresh()
      onClose()
    } catch (err) {
      console.error("Form submission error:", err)
      setError(err instanceof Error ? err.message : "An error occurred while saving the API doc")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {apiDoc ? "Edit API Documentation" : "Create New API Documentation"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} id="api-doc-form" className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter API documentation name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  JSON URL
                </label>
                <input
                  type="url"
                  name="jsonUrl"
                  value={formData.jsonUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com/api-spec.json"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  JSON Content
                </label>
                <textarea
                  name="jsonContent"
                  value={formData.jsonContent}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Paste your JSON content here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Authorization Type
                </label>
                <select
                  name="authType"
                  value={formData.authType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="NONE">None</option>
                  <option value="API_KEY">API Key</option>
                  <option value="BASIC_AUTH">Basic Auth</option>
                  <option value="BEARER_TOKEN">Bearer Token</option>
                </select>
              </div>

              {formData.authType !== "NONE" && (
                <div className="space-y-4">
                  {formData.authType === "API_KEY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key Header
                      </label>
                      <input
                        type="text"
                        name="authHeader"
                        value={formData.authHeader}
                        onChange={handleChange}
                        placeholder="X-API-Key"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {formData.authType === "API_KEY" ? "API Key" :
                        formData.authType === "BASIC_AUTH" ? "Username" :
                          "Bearer Token"}
                    </label>
                    <input
                      type="text"
                      name="authKey"
                      value={formData.authKey}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {formData.authType === "BASIC_AUTH" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="authSecret"
                        value={formData.authSecret}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
                />
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make this documentation public
                </label>
              </div>

              {!formData.isPublic && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Access Code
                  </label>
                  <input
                    type="text"
                    name="accessCode"
                    value={formData.accessCode}
                    onChange={handleChange}
                    placeholder="Optional access code for private docs"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="api-doc-form"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Saving..." : apiDoc ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}
