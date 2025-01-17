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
      className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      style={{ width }}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search endpoints..."
          className="w-full px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
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
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50"
        onMouseDown={onStartResizing}
      />
    </div>
  );
};
