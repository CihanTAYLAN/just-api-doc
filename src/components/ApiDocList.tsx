"use client";
import { ApiDoc } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { CalendarIcon, LockClosedIcon, LockOpenIcon, PencilIcon, TrashIcon, EyeIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface ApiDocListProps {
  apiDocs: ApiDoc[];
  onEdit: (doc: ApiDoc) => void;
}

export default function ApiDocList({ apiDocs, onEdit }: ApiDocListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/api-docs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete API doc");
      }

      setDeleteConfirm(null);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting API doc:", error);
    }
  };

  const copyToClipboard = async (doc: ApiDoc) => {
    try {
      const baseUrl = `${window.location.origin}/docs/${doc.id}`;
      const url = doc.accessCode ? `${baseUrl}?code=${doc.accessCode}` : baseUrl;
      await navigator.clipboard.writeText(url);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  if (apiDocs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No API documentation found. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete API Documentation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete this API documentation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ul className="space-y-4">
        {apiDocs.map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/docs/${doc.id}`}
              className="block w-full group bg-white dark:bg-gray-800 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 transition-shadow duration-200"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 max-w-[60%]">
                      {doc.logo ? (
                        <img
                          src={doc.logo}
                          alt={`${doc.name} logo`}
                          className="w-10 h-10 object-contain rounded-lg ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0 my-0.5"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                          <span className="text-lg font-semibold text-white">
                            {doc.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 py-0.5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                          {doc.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs mt-0.5">
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="truncate">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {!doc.isPublic ? (
                            <div className="flex items-center space-x-1 bg-gray-900/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                              <LockClosedIcon className="w-3 h-3 flex-shrink-0" />
                              <span>Private</span>
                              {doc.accessCode && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                  <span>Protected</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 bg-green-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                              <LockOpenIcon className="w-3 h-3 flex-shrink-0" />
                              <span>Public</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/docs/${doc.id}`, "_blank");
                        }}
                        className="inline-flex justify-center items-center p-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                        title="View Documentation"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyToClipboard(doc);
                        }}
                        className="inline-flex justify-center items-center p-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                        title={`Copy ${doc.isPublic ? "Public" : doc.accessCode ? "Protected" : "Private"} URL`}
                      >
                        {copiedId === doc.id ? (
                          <CheckIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onEdit(doc);
                        }}
                        className="inline-flex justify-center items-center p-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteConfirm(doc.id);
                        }}
                        className="inline-flex justify-center items-center p-2 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
