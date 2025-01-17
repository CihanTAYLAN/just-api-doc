import { DocumentTextIcon } from "@heroicons/react/24/outline"

export default function EmptyState() {
  return (
    <div className="relative block w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
      <span className="mt-4 block text-sm font-semibold text-gray-900 dark:text-white">
        No API Docs Found
      </span>
      <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first API documentation
      </span>
    </div>
  )
}
