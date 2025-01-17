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
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="space-y-4 text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute w-full h-full border-4 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading API Documentation...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Authentication Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Unable to load the API documentation
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Possible Authentication Requirements
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        API Key or Token
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add authorization header with your API key
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Basic Authentication
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Username and password credentials may be required
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        OAuth 2.0
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        OAuth token might be needed for access
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Wrong Config URL
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Check if the provided URL is correct
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 -mx-6 -mb-6 p-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Please review your configuration and ensure you've provided the necessary authentication credentials. You can update these settings in the API documentation configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    <div className="flex h-full w-full overflow-hidden">
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
      <div className="flex-1 overflow-auto">
        {selectedEndpoint ? (
          <EndpointDetail
            endpoint={selectedEndpoint.endpoint}
            path={selectedEndpoint.path}
            method={selectedEndpoint.method}
            spec={spec!}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select an endpoint to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
