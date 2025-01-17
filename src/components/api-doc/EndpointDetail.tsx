"use client";;
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import axios from 'axios';
import { ApiEndpoint, ApiSpec } from './types';
import { MethodBadge } from './MethodBadge';
import { EndpointUrlBar } from './EndpointUrlBar';
import { CodeSamples } from './CodeSamples';
import { generateExampleFromSchema } from './utils/schemaToExample';
import { resolveSchema } from './utils/resolveSchema';
import { JsonEditor } from './JsonEditor';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface EndpointDetailProps {
  path: string;
  method: string;
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({
  path,
  method,
  endpoint,
  spec
}) => {
  const { theme } = useTheme();
  const [selectedServer, setSelectedServer] = useState(spec.servers?.[0]?.url || '');
  const [requestBody, setRequestBody] = useState<any>(null);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'Content-Type', value: 'application/json' }
  ]);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'try' | 'code'>('try');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get default headers from parameters
  const defaultHeaders = endpoint.parameters
    ?.filter(param => param.in === 'header')
    .map(param => ({
      key: param.name,
      value: param.schema?.example || ''
    })) || [];

  // Add security headers if needed
  useEffect(() => {
    const securityHeaders = [];
    if (endpoint.security && endpoint.security.length > 0) {
      endpoint.security.forEach(security => {
        Object.keys(security).forEach(key => {
          const scheme = spec.components?.securitySchemes?.[key];
          if (scheme?.type === 'apiKey' && scheme.in === 'header') {
            securityHeaders.push({
              key: scheme.name,
              value: ''
            });
          }
        });
      });
    }
    if (securityHeaders.length > 0) {
      setHeaders(prev => {
        const existingKeys = new Set(prev.map(h => h.key));
        const newHeaders = securityHeaders.filter(h => !existingKeys.has(h.key));
        return [...prev, ...newHeaders];
      });
    }
  }, [endpoint.security, spec.components?.securitySchemes]);

  // Initialize request body with example from schema
  useEffect(() => {
    if (endpoint.requestBody?.content?.['application/json']?.schema && !requestBody) {
      try {
        const schema = endpoint.requestBody.content['application/json'].schema;
        const resolvedSchema = resolveSchema(schema, spec);
        const example = generateExampleFromSchema(resolvedSchema);
        setRequestBody(example);
      } catch (error) {
        console.error('Error generating example request body:', error);
      }
    }
  }, [endpoint.requestBody, spec, requestBody]);

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate server URL
      if (!selectedServer) {
        throw new Error('Server URL is required');
      }

      // Prepare headers
      const headersObj = headers.reduce((acc, h) => {
        if (h.key.trim() && h.value.trim()) {
          acc[h.key.trim()] = h.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Prepare URL with query parameters
      const url = new URL(`${selectedServer}${path}`);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (key.trim() && value.trim()) {
          url.searchParams.append(key.trim(), value.trim());
        }
      });

      // Get current request body or generate from schema if not set
      let currentBody = requestBody;
      if (!currentBody && endpoint.requestBody?.content?.['application/json']?.schema) {
        const schema = endpoint.requestBody.content['application/json'].schema;
        const resolvedSchema = resolveSchema(schema, spec);
        currentBody = generateExampleFromSchema(resolvedSchema);
      }

      // Prepare request config
      const config = {
        method: method.toLowerCase(),
        url: url.toString(),
        headers: headersObj,
        data: ['get', 'head'].includes(method.toLowerCase()) ? undefined : currentBody
      };

      // Debug log
      console.log('Sending request with config:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      });

      const response = await axios(config);

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      console.log('Response received:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err.response?.data?.message || err.message || 'Request failed');
      setResponse(err.response ? {
        status: err.response.status,
        statusText: err.response.statusText,
        headers: err.response.headers,
        data: err.response.data
      } : null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700">
        {endpoint.deprecated && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/10 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Deprecated Endpoint</h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                  This endpoint is deprecated and may be removed in future versions. Please consider using alternative endpoints.
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col space-y-4">
          {/* Method and Path */}
          <div>
            <div className="flex items-center gap-2">
              <MethodBadge method={method} />
              <div className="text-sm font-medium text-gray-900 dark:text-white">{path}</div>
            </div>
            {endpoint.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 mb-3 mt-2">
                {endpoint.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'try'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('try')}
          >
            Try it out
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'code'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('code')}
          >
            Code samples
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'try' ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* URL Bar */}
            <div className="py-4">
              <EndpointUrlBar
                servers={spec.servers || []}
                selectedServer={selectedServer}
                onServerChange={setSelectedServer}
                path={path}
                method={method}
              />
            </div>

            {/* Security Warnings */}
            {endpoint.security && endpoint.security.length > 0 && (
              <div className="py-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Authentication Required
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <ul className="list-disc pl-5 space-y-1">
                          {endpoint.security.map((security, index) => (
                            <li key={index}>
                              {Object.keys(security).map(name => {
                                const scheme = spec.components?.securitySchemes?.[name];
                                return `${scheme?.type || name} authentication required`;
                              }).join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Request Configuration Section */}
            <div className="py-4">
              {/* Headers and Body Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Headers Section */}
                <div className={endpoint.requestBody ? "" : "lg:col-span-2"}>
                  <div className="space-y-4">
                    {/* Headers */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Headers</h3>
                      <div className="space-y-1.5">
                        {headers.map((header, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={header.key}
                              onChange={(e) => {
                                setHeaders(prev => {
                                  const newHeaders = [...prev];
                                  newHeaders[index].key = e.target.value;
                                  return newHeaders;
                                });
                              }}
                              placeholder="Key"
                              className="block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                            />
                            <input
                              type="text"
                              value={header.value}
                              onChange={(e) => {
                                setHeaders(prev => {
                                  const newHeaders = [...prev];
                                  newHeaders[index].value = e.target.value;
                                  return newHeaders;
                                });
                              }}
                              placeholder="Value"
                              className="block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                            />
                            <button
                              onClick={() => {
                                setHeaders(prev => prev.filter((h, i) => i !== index));
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setHeaders(prev => [...prev, { key: '', value: '' }]);
                        }}
                        className="mt-1.5 inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        Add Header
                      </button>
                    </div>

                    {/* Query Parameters */}
                    {endpoint.parameters?.some(param => param.in === 'query') && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Query Parameters</h3>
                        <div className="space-y-1.5">
                          {endpoint.parameters
                            .filter(param => param.in === 'query')
                            .map((param, index) => (
                              <div key={index} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={param.name}
                                  disabled
                                  className="block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm py-1"
                                />
                                <input
                                  type="text"
                                  value={queryParams[param.name] || ''}
                                  onChange={(e) => setQueryParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                                  placeholder={param.required ? 'Required' : 'Optional'}
                                  className="block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Body Section */}
                {endpoint.requestBody && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Request Body</h3>
                    <JsonEditor
                      value={(() => {
                        try {
                          if (requestBody) {
                            return typeof requestBody === 'string'
                              ? requestBody
                              : JSON.stringify(requestBody, null, 2);
                          }

                          const schema = endpoint.requestBody.content?.['application/json']?.schema;
                          if (!schema) return '{}';

                          const resolvedSchema = resolveSchema(schema, spec);
                          const example = generateExampleFromSchema(resolvedSchema);
                          if (!requestBody) {
                            setRequestBody(example);
                          }
                          return JSON.stringify(example, null, 2);
                        } catch (error) {
                          console.error('Error preparing JSON:', error);
                          return '{}';
                        }
                      })()}
                      onChange={(value) => {
                        try {
                          const parsedJson = JSON.parse(value);
                          setRequestBody(parsedJson);
                        } catch {
                          setRequestBody(value);
                        }
                      }}
                      height="400px"
                    />
                  </div>
                )}
              </div>

              {/* Send Request Button */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Request</span>
                  )}
                </button>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
            </div>

            {/* Response Section */}
            {response && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Response</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${response.status < 300 ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                    response.status < 400 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                      'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                    Status: {response.status}
                  </span>
                </div>
                <div className="rounded-md bg-gray-50 dark:bg-gray-900">
                  <JsonEditor
                    value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                    onChange={() => { }}
                    height="300px"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <CodeSamples
              method={method}
              url={`${selectedServer}${path}`}
              headers={headers}
              body={requestBody}
            />
          </div>
        )}
      </div>
    </div>
  );
};
