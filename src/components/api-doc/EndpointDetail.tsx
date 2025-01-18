"use client";;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Headers } from './Headers';

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
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'try' | 'code'>('try');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [securitySchemes, setSecuritySchemes] = useState<Array<{ type: string; name: string; in: string }>>([]);
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Reset state when endpoint changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    setQueryParams({});
    setRequestBody(null);
    setHeaders([]); // Reset headers when endpoint changes
  }, [endpoint.path, endpoint.method]);

  // Get default value for a parameter based on its schema
  const getDefaultValueForParameter = useCallback((param: OpenAPIV3.ParameterObject): string => {
    if (!param.schema) return '';

    const schema = param.schema as OpenAPIV3.SchemaObject;
    if (schema.default !== undefined) {
      return String(schema.default);
    }

    if (schema.example !== undefined) {
      return String(schema.example);
    }

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum[0] : 'string';
      case 'number':
      case 'integer':
        return '0';
      case 'boolean':
        return 'false';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return '';
    }
  }, []);

  // Store header values when they change
  const updateHeaderValues = useCallback((headers: Array<{ key: string; value: string }>) => {
    const newHeaderValues: Record<string, string> = {};
    headers.forEach(header => {
      newHeaderValues[header.key.toLowerCase()] = header.value;
    });
    setHeaderValues(newHeaderValues);
  }, []);

  // Get Content-Type header based on request body
  const getContentTypeHeader = useCallback(() => {
    if (!endpoint.requestBody) {
      return null;
    }

    let contentType = 'application/json';
    if (endpoint.requestBody.content) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      if (contentTypes.length > 0) {
        contentType = contentTypes[0];
      }
    }

    return {
      key: 'Content-Type',
      value: contentType
    };
  }, [endpoint.requestBody]);

  // Handle header changes
  const handleHeaderChange = useCallback((newHeaders: Array<{ key: string; value: string }>) => {
    const contentTypeHeader = getContentTypeHeader();
    
    // Yeni header'lar içinde Content-Type varsa onu kullan, yoksa eskisini ekle
    const updatedHeaders = newHeaders.filter(h => h.key.toLowerCase() !== 'content-type');
    if (contentTypeHeader) {
      updatedHeaders.unshift(contentTypeHeader);
    }

    setHeaders(updatedHeaders);
    updateHeaderValues(updatedHeaders);
  }, [getContentTypeHeader, updateHeaderValues]);

  // Initialize headers with security schemes and default parameters
  useEffect(() => {
    const defaultHeaders: { key: string; value: string }[] = [];

    // First, add Content-Type header if exists
    const contentTypeHeader = getContentTypeHeader();
    if (contentTypeHeader) {
      defaultHeaders.push(contentTypeHeader);
    }

    // Then add security-related headers
    securitySchemes.forEach(scheme => {
      if (scheme.in === 'header') {
        let headerKey: string;
        let defaultValue: string;

        switch (scheme.type.toLowerCase()) {
          case 'http':
            headerKey = 'Authorization';
            defaultValue = 'Bearer YOUR_TOKEN_HERE';
            break;
          case 'apikey':
            headerKey = scheme.name;
            defaultValue = 'YOUR_API_KEY_HERE';
            break;
          case 'oauth2':
            headerKey = 'Authorization';
            defaultValue = 'Bearer YOUR_OAUTH_TOKEN_HERE';
            break;
          default:
            return;
        }

        const existingHeader = defaultHeaders.find(h => h.key.toLowerCase() === headerKey.toLowerCase());
        if (!existingHeader) {
          defaultHeaders.push({
            key: headerKey,
            value: defaultValue
          });
        }
      }
    });

    // Finally add headers from parameters
    endpoint.parameters?.forEach(param => {
      if (param.in === 'header') {
        const existingHeader = defaultHeaders.find(h => h.key.toLowerCase() === param.name.toLowerCase());
        if (!existingHeader) {
          defaultHeaders.push({
            key: param.name,
            value: getDefaultValueForParameter(param)
          });
        }
      }
    });

    setHeaders(defaultHeaders);
    updateHeaderValues(defaultHeaders);
  }, [endpoint, securitySchemes, getContentTypeHeader, getDefaultValueForParameter, updateHeaderValues]);

  // Update header values when headers change
  useEffect(() => {
    updateHeaderValues(headers);
  }, [headers, updateHeaderValues]);

  // Initialize query parameters from OpenAPI spec
  useEffect(() => {
    const defaultParams: Record<string, string> = {};

    endpoint.parameters?.forEach(param => {
      if (param.in === 'query' && param.required) {
        defaultParams[param.name] = getDefaultValueForParameter(param);
      }
    });

    setQueryParams(defaultParams);
  }, [endpoint.parameters, endpoint.path, endpoint.method]);

  // Extract security schemes from OpenAPI spec
  useEffect(() => {
    if (!endpoint?.security || !spec.components?.securitySchemes) {
      setSecuritySchemes([]);
      return;
    }

    const schemes: Array<{ type: string; name: string; in: string }> = [];

    endpoint.security.forEach(security => {
      const securityKey = Object.keys(security)[0];
      const scheme = spec.components?.securitySchemes?.[securityKey];

      if (scheme && scheme.in === 'header') {
        schemes.push({
          type: scheme.type,
          name: scheme.name,
          in: scheme.in
        });
      }
    });

    setSecuritySchemes(schemes);
  }, [endpoint?.security, spec.components?.securitySchemes]);

  // Check if endpoint requires authentication
  const requiresAuth = useMemo(() => {
    if (!endpoint?.security || endpoint.security.length === 0) return [];

    const keys: string[] = [];

    endpoint.security.forEach(authType => {
      const authKey = Object.keys(authType)[0];
      console.log(spec.components?.securitySchemes?.[authKey]);
      if (spec.components?.securitySchemes?.[authKey]?.in === 'header') {
        keys.push(spec.components?.securitySchemes?.[authKey]?.scheme ?? spec.components?.securitySchemes?.[authKey]?.type);
      }
    });
    console.log(keys);

    return keys;


  }, [endpoint.security]);

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

  // Get available content types
  const contentTypes = useMemo(() => {
    if (!endpoint.requestBody?.content) return [];
    return Object.keys(endpoint.requestBody.content);
  }, [endpoint.requestBody]);

  // Initialize content type
  useEffect(() => {
    if (contentTypes.length > 0) {
      // Prefer application/json if available
      const defaultType = contentTypes.includes('application/json') 
        ? 'application/json' 
        : contentTypes[0];
      setSelectedContentType(defaultType);
    }
  }, [contentTypes]);

  // Handle form data changes
  const handleFormDataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Render request body based on content type
  const renderRequestBody = () => {
    if (!endpoint.requestBody?.content || !selectedContentType) return null;

    const content = endpoint.requestBody.content[selectedContentType];
    if (!content) return null;

    switch (selectedContentType) {
      case 'application/json':
        const jsonValue = (() => {
          try {
            if (requestBody) {
              return typeof requestBody === 'string' 
                ? requestBody 
                : JSON.stringify(requestBody, null, 2);
            }

            // Generate example from schema if no request body
            const schema = content.schema;
            if (!schema) return '{}';

            const resolvedSchema = resolveSchema(schema, spec);
            const example = generateExampleFromSchema(resolvedSchema);
            if (!requestBody) {
              setRequestBody(JSON.stringify(example, null, 2));
            }
            return JSON.stringify(example, null, 2);
          } catch (error) {
            console.error('Error preparing JSON:', error);
            return '{}';
          }
        })();

        return (
          <div className="space-y-4">
            <div className="relative">
              <JsonEditor
                value={jsonValue}
                onChange={(value) => {
                  try {
                    // Only parse if it's valid JSON
                    JSON.parse(value);
                    setRequestBody(value);
                  } catch {
                    // If not valid JSON, still update but don't parse
                    setRequestBody(value);
                  }
                }}
                height="400px"
              />
            </div>
          </div>
        );

      case 'multipart/form-data':
      case 'application/x-www-form-urlencoded':
        const schema = content.schema as OpenAPIV3.SchemaObject;
        const properties = schema.properties || {};

        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {Object.entries(properties).map(([key, prop]) => {
                const property = prop as OpenAPIV3.SchemaObject;
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium">
                      {key}
                      {schema.required?.includes(key) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {selectedContentType === 'multipart/form-data' && property.type === 'string' && property.format === 'binary' ? (
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          dark:file:bg-blue-900/20 dark:file:text-blue-200
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFormDataChange(key, file.name);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type={property.format === 'password' ? 'password' : 'text'}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm"
                        value={formData[key] || ''}
                        onChange={(e) => handleFormDataChange(key, e.target.value)}
                        placeholder={property.description || `Enter ${key}`}
                      />
                    )}
                    {property.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {property.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full h-64 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm font-mono"
                value={requestBody || ''}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder={`Enter ${selectedContentType} request body`}
              />
            </div>
          </div>
        );
    }
  };

  // Update request body when sending request
  const handleSendRequest = async () => {
    // Prepare request body based on content type
    let finalRequestBody: string | FormData | undefined;
    
    if (selectedContentType === 'multipart/form-data') {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      finalRequestBody = formDataObj;
    } else if (selectedContentType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        params.append(key, value);
      });
      finalRequestBody = params.toString();
    } else {
      finalRequestBody = requestBody;
    }

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
      let currentBody = finalRequestBody;
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
        <div className="flex flex-col">
          {/* Method and Path */}
          <div className="flex items-center gap-2 mb-2">
            <MethodBadge method={method} />
            <div className="text-sm font-medium text-gray-900 dark:text-white">{path}</div>
            {endpoint.deprecated && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full group relative">
                <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.25 4A.75.75 0 012.5 3.25v-1.5a.75.75 0 011.5 0v1.5A.75.75 0 013.25 4zm13.5 0a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zm-8-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM5 4.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V5A.75.75 0 015 4.25zm7 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V5a.75.75 0 01.75-.75zM4.25 17a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm11.5 0a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm-8-1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0v1.5zm-.75 3.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm8 0a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75z" />
                </svg>
                <span>Deprecated</span>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded p-2 shadow-lg">
                    <div className="font-medium mb-1">Deprecated Endpoint</div>
                    <div className="text-gray-300">
                      This endpoint is deprecated and may be removed in future versions. Please consider using alternative endpoints.
                    </div>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
            {requiresAuth.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-full group relative">
                <svg className="h-3.5 w-3.5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" clipRule="evenodd" />
                </svg>
                <span>Auth Required</span>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded p-2 shadow-lg">
                    <div className="font-medium mb-1">Authentication Required</div>
                    <div className="text-gray-300">
                      {endpoint.security?.map((security, index) => {
                        const scheme = Object.keys(security)[0];
                        const schemeDetails = spec.components?.securitySchemes?.[scheme];
                        return (
                          <div key={index} className="flex items-center gap-1">
                            <span>{schemeDetails?.type === 'http' ? 'Bearer Token' : schemeDetails?.type || scheme}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
          {endpoint.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {endpoint.description}
            </div>
          )}
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

            {/* Request Configuration Section */}
            <div className="py-4">
              {/* Headers and Body Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Headers Section */}
                <div className={endpoint.requestBody ? "" : "lg:col-span-2"}>
                  <div className="space-y-4">
                    {/* Headers */}
                    <Headers 
                      headers={headers}
                      onHeaderChange={handleHeaderChange}
                    />
                  </div>
                </div>

                {/* Request Body Section */}
                {endpoint.requestBody && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Request Body</h3>
                    {renderRequestBody()}
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
