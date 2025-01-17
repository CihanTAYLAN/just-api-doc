"use client";

import React from 'react';
import { ApiEndpoint } from './types';
import { TagGroup } from './TagGroup';

interface SidebarProps {
  groupedEndpoints: Record<string, Array<{
    path: string;
    method: string;
    endpoint: ApiEndpoint;
  }>>;
  openGroups: Record<string, boolean>;
  onToggleGroup: (name: string) => void;
  onSelectEndpoint: (endpoint: { path: string; method: string; endpoint: ApiEndpoint }) => void;
  selectedEndpoint: { path: string; method: string } | null;
  width: number;
  onStartResizing: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groupedEndpoints,
  openGroups,
  onToggleGroup,
  onSelectEndpoint,
  selectedEndpoint,
  width,
  onStartResizing,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div
      className="relative h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      style={{ width, minWidth: '150px', maxWidth: '600px' }}
    >
      {/* Search */}
      <div className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
        <div className="relative flex items-center p-1">
          <svg className="absolute left-2.5 h-3 w-3 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ padding: '2px 20px' }}
            className="block w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEndpoints).map(([name, endpoints]) => (
          <TagGroup
            key={name}
            name={name}
            endpoints={endpoints}
            isOpen={openGroups[name] || false}
            onToggle={() => onToggleGroup(name)}
            onSelectEndpoint={onSelectEndpoint}
            selectedEndpoint={selectedEndpoint}
          />
        ))}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500"
        onMouseDown={onStartResizing}
      />
    </div>
  );
};
