"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface AccessCodeFormProps {
  docId: string
  docName: string
}

export default function AccessCodeForm({ docId, docName }: AccessCodeFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = formData.get("code") as string

    try {
      // Redirect to the doc page with the access code
      router.push(`/docs/${docId}?code=${encodeURIComponent(code)}`)
    } catch (error) {
      setError("Invalid access code")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Access Code for {docName}
        </label>
        <input
          type="text"
          name="code"
          id="code"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Enter access code"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Access Documentation"}
      </button>
    </form>
  )
}
