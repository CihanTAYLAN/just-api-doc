import { PlusIcon } from "@heroicons/react/24/outline"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen-custom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your API Docs</h1>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600/50 rounded-lg cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5 mr-1.5" />
            Create New
          </button>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 max-w-[60%]">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse" />
                    <div className="flex items-center space-x-1">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
