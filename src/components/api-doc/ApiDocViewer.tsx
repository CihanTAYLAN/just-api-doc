"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ApiDocViewerProps, ApiEndpoint, ApiSpec } from './types';
import { fetchApiSpec } from './utils';
import { Sidebar } from './Sidebar';
import { EndpointDetail } from './EndpointDetail';

export const ApiDocViewer: React.FC<ApiDocViewerProps> = ({ apiDoc }) => {
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string;
    method: string;
    endpoint: ApiEndpoint;
  } | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadSpec = async () => {
      try {
        const data = await fetchApiSpec(apiDoc);
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSpec();
  }, [apiDoc]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
    document.body.style.userSelect = 'none';
  }, []);

  const toggleGroup = useCallback((name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleEndpointSelect = useCallback((endpoint: {
    path: string;
    method: string;
    endpoint: ApiEndpoint;
  }) => {
    setSelectedEndpoint(endpoint);
  }, []);

  const groupedEndpoints = useMemo(() => {
    if (!spec?.paths) return {};

    const groups: Record<string, Array<{
      path: string;
      method: string;
      endpoint: ApiEndpoint;
    }>> = {};

    const defaultTag = 'Other';
    const query = searchQuery.toLowerCase();

    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        if (query && !path.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).summary?.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).tags?.join(', ')?.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).description?.toLowerCase().includes(query)) {
          return;
        }

        const tags = (endpoint as ApiEndpoint).tags || [defaultTag];

        tags.forEach(tag => {
          if (!groups[tag]) {
            groups[tag] = [];
          }

          groups[tag].push({
            path,
            method: method.toUpperCase(),
            endpoint: endpoint as ApiEndpoint
          });
        });
      });
    });

    return Object.fromEntries(
      Object.entries(groups).map(([tag, endpoints]) => [
        tag,
        endpoints.sort((a, b) => {
          const methodOrder = { GET: 1, POST: 2, PUT: 3, DELETE: 4 };
          const methodDiff =
            (methodOrder[a.method as keyof typeof methodOrder] || 99) -
            (methodOrder[b.method as keyof typeof methodOrder] || 99);
          return methodDiff || a.path.localeCompare(b.path);
        })
      ])
    );
  }, [spec?.paths, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500 flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5" />
          <span>No API specification found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        groupedEndpoints={groupedEndpoints}
        openGroups={openGroups}
        onToggleGroup={toggleGroup}
        onSelectEndpoint={handleEndpointSelect}
        selectedEndpoint={selectedEndpoint}
        width={sidebarWidth}
        onStartResizing={startResizing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-hidden">
        {selectedEndpoint ? (
          <EndpointDetail
            path={selectedEndpoint.path}
            method={selectedEndpoint.method}
            endpoint={selectedEndpoint.endpoint}
            spec={spec}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <InformationCircleIcon className="h-8 w-8 mb-2" />
            <div className="text-center">
              <h3 className="font-medium">Select an endpoint</h3>
              <p className="text-sm">Choose an endpoint from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
