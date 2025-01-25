"use client"

import { PlusIcon } from "@heroicons/react/24/outline"

interface CreateApiDocButtonProps {
  onClick: () => void
}

export default function CreateApiDocButton({ onClick }: CreateApiDocButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
    >
      <PlusIcon className="w-5 h-5 mr-1.5" />
      Create New
    </button>
  )
}
