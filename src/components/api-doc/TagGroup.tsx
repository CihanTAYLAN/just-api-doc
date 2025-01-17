"use client";

import React from 'react';
import { ApiEndpoint } from './types';
import { MethodBadge } from './MethodBadge';

interface TagGroupProps {
  name: string;
  endpoints: Array<{
    path: string;
    method: string;
    endpoint: ApiEndpoint;
  }>;
  tagDescription?: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectEndpoint: (endpoint: { path: string; method: string; endpoint: ApiEndpoint }) => void;
  selectedEndpoint?: { path: string; method: string } | null;
}

export const TagGroup: React.FC<TagGroupProps> = ({
  name,
  endpoints,
  tagDescription,
  isOpen,
  onToggle,
  onSelectEndpoint,
  selectedEndpoint
}) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="
          flex items-center justify-between w-full px-3 py-1
          text-left font-mono text-xs font-medium
          text-gray-900 dark:text-white
          hover:bg-gray-50 dark:hover:bg-gray-800/50
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
        "
      >
        <div className="flex items-center space-x-2">
          <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span>{name}</span>
          <span className="text-gray-500">({endpoints.length})</span>
        </div>
      </button>

      {isOpen && (
        <div className="py-1">
          {tagDescription && (
            <div className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
              {tagDescription}
            </div>
          )}
          {endpoints.map((endpoint, index) => (
            <button
              key={`${endpoint.path}-${endpoint.method}-${index}`}
              onClick={() => onSelectEndpoint(endpoint)}
              className={`
                w-full px-3 py-1 text-left
                flex items-center space-x-2
                text-xs
                hover:bg-gray-50 dark:hover:bg-gray-800/50
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                ${selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : ''
                }
              `}
            >
              <MethodBadge method={endpoint.method} />
              <span className="font-mono truncate">{endpoint.path}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
