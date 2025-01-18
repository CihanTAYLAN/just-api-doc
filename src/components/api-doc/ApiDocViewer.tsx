"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ApiDocViewerProps, ApiEndpoint, ApiSpec } from './types';
import { fetchApiSpec } from './utils';
import { Sidebar } from './Sidebar';
import { EndpointDetail } from './EndpointDetail';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const ApiDocViewer: React.FC<ApiDocViewerProps> = ({ apiDoc }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [headers, setHeaders] = useState<{ key: string; value: string; required?: boolean }[]>(() => {
    try {
      const storageKey = `headers-${apiDoc.id}`;
      const savedHeaders = localStorage.getItem(storageKey);
      
      if (savedHeaders) {
        const parsedHeaders = JSON.parse(savedHeaders);
        if (Array.isArray(parsedHeaders) && parsedHeaders.length > 0 && 
            parsedHeaders.every(h => typeof h === 'object' && 'key' in h && 'value' in h)) {
          return parsedHeaders;
        }
      }
    } catch (error) {
      console.error('Error loading headers from localStorage:', error);
    }
    
    // Default headers with required Content-Type
    return [{
      key: 'Content-Type',
      value: 'application/json',
      required: true
    }];
  });

  // Header değişikliklerini yönet
  const handleHeadersChange = useCallback((newHeaders: { key: string; value: string; required?: boolean }[]) => {
    // Gelen header'ları doğrula
    const validHeaders = newHeaders.filter(h => h.key && typeof h.key === 'string');
    
    setHeaders(validHeaders);
    try {
      const storageKey = `headers-${apiDoc.id}`;
      localStorage.setItem(storageKey, JSON.stringify(validHeaders));
    } catch (error) {
      console.error('Error saving headers to localStorage:', error);
    }
  }, [apiDoc]);

  // URL'den endpoint ve grup bilgisini yükle
  useEffect(() => {
    if (!spec?.paths || !isInitialLoad) return;

    const path = searchParams.get('path');
    const method = searchParams.get('method')?.toLowerCase();
    const group = searchParams.get('group');

    // Endpoint varsa yükle
    if (path && method && spec.paths[path]?.[method]) {
      const endpoint = spec.paths[path][method] as ApiEndpoint;
      const tag = endpoint.tags?.[0] || 'Other';
      
      setSelectedEndpoint({ path, method, endpoint });
      setOpenGroups(prev => ({ ...prev, [tag]: true }));
    }

    // Grup varsa aç
    if (group) {
      setOpenGroups(prev => ({ ...prev, [group]: true }));
    }

    setIsInitialLoad(false);
  }, [spec, searchParams, isInitialLoad]);

  // URL'i sessizce güncelle
  const updateUrlSilently = useCallback((params: { path?: string; method?: string; group?: string }) => {
    const urlParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    });

    const newUrl = `${pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    if (window.location.search !== `?${urlParams.toString()}`) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [pathname, searchParams]);

  // API spec'i yükle
  useEffect(() => {
    const loadSpec = async () => {
      try {
        setLoading(true);
        setError(null);
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

  // Mouse hareketlerini izle
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
    setOpenGroups(prev => {
      const newState = { ...prev, [name]: !prev[name] };
      
      // Grup durumu değiştiğinde URL'i sessizce güncelle
      if (newState[name]) {
        updateUrlSilently({ group: name });
      } else {
        updateUrlSilently({ group: undefined });
      }
      
      return newState;
    });
  }, [updateUrlSilently]);

  const handleEndpointSelect = useCallback((endpoint: {
    path: string;
    method: string;
    endpoint: ApiEndpoint;
  }) => {
    setSelectedEndpoint(endpoint);
    
    // Endpoint seçildiğinde URL'i sessizce güncelle
    const currentGroup = searchParams.get('group');
    updateUrlSilently({
      path: endpoint.path,
      method: endpoint.method,
      group: currentGroup || endpoint.endpoint.tags?.[0] || 'Other'
    });

    // Endpoint'in tag'ini otomatik olarak aç
    if (endpoint.endpoint.tags?.[0]) {
      setOpenGroups(prev => ({ ...prev, [endpoint.endpoint.tags[0]]: true }));
    }
  }, [searchParams, updateUrlSilently]);

  const handleOverviewSelect = useCallback(() => {
    setSelectedEndpoint(null);
    // Overview seçildiğinde URL'i sessizce güncelle
    const currentGroup = searchParams.get('group');
    updateUrlSilently({
      path: undefined,
      method: undefined,
      group: currentGroup
    });
  }, [searchParams, updateUrlSilently]);

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
        onOverviewSelect={handleOverviewSelect}
      />
      <div className="flex-1 overflow-auto">
        {selectedEndpoint ? (
          <div className="h-full px-2 sm:px-4 md:px-6 py-5">
            <EndpointDetail
              path={selectedEndpoint.path}
              method={selectedEndpoint.method}
              endpoint={selectedEndpoint.endpoint}
              spec={spec}
              apiDoc={apiDoc}
              headers={headers}
              onHeadersChange={handleHeadersChange}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 px-3 py-4 sm:p-4 md:p-6 lg:p-8">
            {/* Overview */}
            <div className="w-full max-w-[95%] xs:max-w-[90%] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Logo ve Başlık */}
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center">
                  {apiDoc?.logo ? (
                    <img src={apiDoc.logo} alt="API Logo" className="h-10 xs:h-12 sm:h-14 lg:h-16 w-auto" />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center text-white text-xl xs:text-2xl sm:text-3xl font-bold">
                      {(spec?.info?.title || 'API').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 px-2">
                  {spec?.info?.title || 'API Documentation'}
                </h1>
                <p className="text-sm xs:text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xs xs:max-w-sm sm:max-w-xl lg:max-w-2xl mx-auto px-2">
                  {spec?.info?.description || 'Welcome to our API documentation. Select an endpoint from the sidebar to get started.'}
                </p>
              </div>

              {/* API Bilgileri */}
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 text-left px-2">
                {/* Versiyon Bilgisi */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Version Information
                  </h3>
                  <dl className="space-y-2 sm:space-y-3">
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">API Version</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">{spec?.info?.version || 'Not specified'}</dd>
                    </div>
                    {spec?.info?.contact && (
                      <div>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Contact</dt>
                        <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {spec.info.contact.name && <div>{spec.info.contact.name}</div>}
                          {spec.info.contact.email && (
                            <a href={`mailto:${spec.info.contact.email}`} className="text-blue-500 hover:text-blue-600 break-all">
                              {spec.info.contact.email}
                            </a>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Server Information */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    Server Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {spec?.servers?.map((server, index) => (
                      <div key={index} className="text-xs sm:text-sm">
                        <div className="font-medium text-gray-500 dark:text-gray-400">Server {index + 1}</div>
                        <div className="mt-1 text-gray-900 dark:text-gray-100">{server.url}</div>
                        {server.description && (
                          <div className="mt-1 text-gray-500 dark:text-gray-400">{server.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hızlı Başlangıç */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Start
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Browse the API endpoints in the sidebar to:
                    </p>
                    <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 list-none">
                      <li className="flex items-center">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        View detailed documentation
                      </li>
                      <li className="flex items-center">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Test endpoints directly
                      </li>
                      <li className="flex items-center">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        See request/response examples
                      </li>
                      <li className="flex items-center">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Explore parameters
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Lisans ve Terms */}
              {(spec?.info?.license || spec?.info?.termsOfService) && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {spec.info.license && (
                    <div className="flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      License: {spec.info.license.name}
                      {spec.info.license.url && (
                        <a href={spec.info.license.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-600 inline-flex items-center">
                          (View License)
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 01-2 2M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2m-2-4h.01M17 16h.01" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                  {spec.info.termsOfService && (
                    <div className="flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <a href={spec.info.termsOfService} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 inline-flex items-center">
                        Terms of Service
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 01-2 2M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2m-2-4h.01M17 16h.01" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
};
