"use client";;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import axios from 'axios';
import { ApiEndpoint, ApiSpec } from './types';
import { ApiDoc } from '@prisma/client';
import { MethodBadge } from './MethodBadge';
import { EndpointUrlBar } from './EndpointUrlBar';
import { CodeSamples } from './CodeSamples';
import { generateExampleFromSchema } from './utils/schemaToExample';
import { resolveSchema } from './utils/resolveSchema';
import { JsonEditor } from './JsonEditor';
import { Headers } from './Headers';
import { RequestBodySection } from './RequestBodySection';

interface EndpointDetailProps {
  path: string;
  method: string;
  endpoint: ApiEndpoint;
  spec: ApiSpec;
  apiDoc: ApiDoc;
  headers?: Array<{ key: string; value: string; required?: boolean }>;
  onHeadersChange?: (headers: Array<{ key: string; value: string; required?: boolean }>) => void;
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({
  path,
  method,
  endpoint,
  spec,
  apiDoc,
  headers,
  onHeadersChange
}) => {
  const { theme } = useTheme();
  const [selectedServer, setSelectedServer] = useState(spec.servers?.[0]?.url || '');
  const [requestBody, setRequestBody] = useState<any>(null);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'try' | 'code'>('try');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [securitySchemes, setSecuritySchemes] = useState<Array<{ type: string; name: string; in: string }>>([]);
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [localHeaders, setLocalHeaders] = useState<Array<{ key: string; value: string; required?: boolean }>>(headers || []);

  // Header'lar değiştiğinde localStorage'a kaydet
  useEffect(() => {
    try {
      const storageKey = `headers-${apiDoc?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(localHeaders));
    } catch (error) {
      console.error('Error saving headers to localStorage:', error);
    }
  }, [localHeaders, apiDoc?.id]);

  // Reset state when endpoint changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    setQueryParams({});
    setRequestBody(null);
  }, [endpoint]);

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
  const updateHeaderValues = useCallback((headers: Array<{ key: string; value: string; required?: boolean }>) => {
    const newHeaderValues: Record<string, string> = {};
    headers.forEach(header => {
      newHeaderValues[header.key.toLowerCase()] = header.value;
    });
    setHeaderValues(newHeaderValues);
  }, []);

  // Handle form data changes
  const handleFormDataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Initialize headers when endpoint changes
  useEffect(() => {
    const initializeHeaders = () => {
      const defaultHeaders: Array<{ key: string; value: string; required?: boolean }> = [];

      // Add Content-Type header if endpoint has request body
      if (endpoint.requestBody?.content) {
        const contentTypes = Object.keys(endpoint.requestBody.content);
        if (contentTypes.length > 0) {
          defaultHeaders.push({
            key: 'Content-Type',
            value: contentTypes[0],
            required: true
          });
        }
      }

      // Add required headers from security schemes
      if (endpoint.security?.length) {
        endpoint.security.forEach(securityRequirement => {
          Object.keys(securityRequirement).forEach(schemeName => {
            const scheme = spec.components?.securitySchemes?.[schemeName];
            if (scheme?.type === 'apiKey' && scheme.in === 'header') {
              defaultHeaders.push({
                key: scheme.name,
                value: '',
                required: true
              });
            } else if (scheme?.type === 'http' && scheme.scheme === 'bearer') {
              defaultHeaders.push({
                key: 'Authorization',
                value: 'Bearer ',
                required: true
              });
            }
          });
        });
      }

      // Add headers from parameters
      endpoint.parameters?.forEach(param => {
        if (param.in === 'header') {
          defaultHeaders.push({
            key: param.name,
            value: '',
            required: param.required || false
          });
        }
      });

      // Load saved headers from localStorage
      const storageKey = `headers-${apiDoc?.id}`;
      const storedHeaders = localStorage.getItem(storageKey);
      let savedHeaders: Array<{ key: string; value: string; required?: boolean }> = [];

      if (storedHeaders) {
        try {
          savedHeaders = JSON.parse(storedHeaders);
        } catch (error) {
          console.error('Error parsing stored headers:', error);
        }
      }

      // Merge required headers with saved headers
      const mergedHeaders = defaultHeaders.map(header => {
        const savedHeader = savedHeaders.find(h => h.key.toLowerCase() === header.key.toLowerCase());
        return savedHeader ? { ...header, value: savedHeader.value } : header;
      });

      // Add non-required saved headers
      savedHeaders.forEach(header => {
        if (!mergedHeaders.some(h => h.key.toLowerCase() === header.key.toLowerCase())) {
          mergedHeaders.push(header);
        }
      });

      setLocalHeaders(mergedHeaders);
    };

    initializeHeaders();
  }, [endpoint, spec, path, apiDoc?.id]);

  // Update Content-Type header when content type changes
  useEffect(() => {
    if (selectedContentType) {
      setLocalHeaders(prevHeaders =>
        prevHeaders.map(header =>
          header.key.toLowerCase() === 'content-type'
            ? { ...header, value: selectedContentType }
            : header
        )
      );
    }
  }, [selectedContentType]);

  // Handle header changes
  const handleHeaderChange = (newHeaders: Array<{ key: string; value: string; required?: boolean }>) => {
    // Ensure Content-Type header is preserved if it exists
    const contentTypeHeader = localHeaders.find(h => h.key.toLowerCase() === 'content-type');
    if (contentTypeHeader && !newHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
      newHeaders.unshift(contentTypeHeader);
    }

    setLocalHeaders(newHeaders);

    // Save to localStorage
    const storageKey = `headers-${apiDoc?.id}`;
    localStorage.setItem(storageKey, JSON.stringify(newHeaders));

    if (onHeadersChange) {
      onHeadersChange(newHeaders);
    }
  };

  // Header'ları endpoint'e göre düzenle
  useEffect(() => {
    const currentHeaders = new Map(localHeaders.map(h => [h.key.toLowerCase(), h]));
    const newHeaders = [...localHeaders].filter(h => h.key.toLowerCase() !== 'content-type');
    let hasChanges = false;

    // Content-Type kontrolü
    if (endpoint.requestBody?.content) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      if (contentTypes.length > 0) {
        const contentType = contentTypes[0];
        newHeaders.unshift({ key: 'Content-Type', value: contentType, required: true });
        setSelectedContentType(contentType);
        hasChanges = true;
      }
    }

    // Authorization kontrolü
    const hasAuth = currentHeaders.has('authorization');
    if (endpoint.security?.length && !hasAuth) {
      newHeaders.push({ key: 'Authorization', value: 'Bearer YOUR_ACCESS_TOKEN', required: true });
      hasChanges = true;
    }

    // Sadece değişiklik varsa güncelle
    if (hasChanges) {
      setLocalHeaders(newHeaders);
    }
  }, [endpoint, endpoint.security?.length]); // endpoint değiştiğinde de çalış

  // Update header values when headers change
  useEffect(() => {
    updateHeaderValues(localHeaders);
  }, [localHeaders, updateHeaderValues]);

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

  // Set initial content type when endpoint changes
  useEffect(() => {
    if (endpoint.requestBody?.content) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      if (contentTypes.length > 0) {
        // Prefer application/json if available, otherwise use the first content type
        const preferredType = contentTypes.includes('application/json')
          ? 'application/json'
          : contentTypes[0];
        setSelectedContentType(preferredType);
      }
    } else {
      setSelectedContentType('');
    }
  }, [endpoint.requestBody]);

  // Get available content types
  const contentTypes = useMemo(() => {
    if (!endpoint.requestBody?.content) return [];
    return Object.keys(endpoint.requestBody.content);
  }, [endpoint.requestBody]);

  // Render request body based on content type
  const renderRequestBody = useMemo(() => {
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
                  <div key={key} className="flex items-center gap-2 min-w-[200px] group">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 whitespace-nowrap">
                      {key}
                      {schema.required?.includes(key) && <span className="text-red-500">*</span>}
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
                      <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs rounded p-2 z-10 mt-1 -translate-y-12">
                        {property.description}
                      </div>
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
  }, [endpoint.requestBody, selectedContentType, requestBody, spec, setRequestBody]);

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

      // Validate required path parameters
      const missingPathParams = endpoint.parameters
        ?.filter(param => param.in === 'path' && param.required && !pathParams[param.name])
        .map(param => param.name);

      if (missingPathParams && missingPathParams.length > 0) {
        throw new Error(`Missing required path parameters: ${missingPathParams.join(', ')}`);
      }

      // Prepare headers
      const headersObj = localHeaders.reduce((acc, h) => {
        if (h.key.trim() && h.value.trim()) {
          acc[h.key.trim()] = h.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Prepare URL with path parameters and query parameters
      const url = new URL(`${selectedServer}${getUrlWithPathParams(path)}`);
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

  // Load path parameters from localStorage
  useEffect(() => {
    const storedParams = localStorage.getItem(`pathParams-${apiDoc.id}`);
    if (storedParams) {
      try {
        const parsedParams = JSON.parse(storedParams);
        setPathParams(parsedParams);
      } catch (error) {
        console.error('Error parsing stored path parameters:', error);
      }
    }
  }, [path]);

  // Save path parameters to localStorage when they change
  useEffect(() => {
    if (Object.keys(pathParams).length > 0) {
      localStorage.setItem(`pathParams-${apiDoc.id}`, JSON.stringify(pathParams));
    }
  }, [pathParams, path]);

  // Initialize path parameters from OpenAPI spec
  useEffect(() => {
    const defaultPathParams: Record<string, string> = {};
    const storedParams = localStorage.getItem(`pathParams-${apiDoc.id}`);
    let initialParams = {};

    if (storedParams) {
      try {
        initialParams = JSON.parse(storedParams);
      } catch (error) {
        console.error('Error parsing stored path parameters:', error);
      }
    }

    endpoint.parameters?.forEach(param => {
      if (param.in === 'path') {
        defaultPathParams[param.name] = (initialParams as Record<string, string>)[param.name] || '';
      }
    });

    setPathParams(defaultPathParams);
  }, [endpoint.parameters, path]);

  // Function to replace path parameters in URL
  const getUrlWithPathParams = useCallback((urlPath: string) => {
    let finalUrl = urlPath;
    Object.entries(pathParams).forEach(([key, value]) => {
      finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(value || `{${key}}`));
    });
    return finalUrl;
  }, [pathParams]);

  // Handle path parameter changes
  const handlePathParamChange = (paramName: string, value: string) => {
    const newParams = {
      ...pathParams,
      [paramName]: value
    };
    setPathParams(newParams);
    localStorage.setItem(`pathParams-${apiDoc.id}`, JSON.stringify(newParams));
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
                  <path d="M3.25 4A.75.75 0 012.5 3.25v-1.5a.75.75 0 011.5 0v1.5A.75.75 0 013.25 4zm13.5 0a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zm-8-1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0v1.5zM5 4.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V5A.75.75 0 015 4.25zm7 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V5a.75.75 0 01.75-.75zM4.25 17a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm11.5 0a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm-8-1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0v1.5zm-.75 3.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75zm8 0a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75z" />
                </svg>
                <span>Deprecated</span>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block z-10">
                  <div className="bg-gray-800 text-white text-xs rounded p-2 shadow-lg">
                    <div className="font-medium mb-1">Deprecated Endpoint</div>
                    <div className="text-gray-300">
                      This endpoint is deprecated and may be removed in future versions. Please consider using alternative endpoints.
                    </div>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-1 w-2 h-2 bg-gray-800 rotate-45"></div>
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
                  <div className="bg-gray-800 text-white text-xs rounded p-2 shadow-lg">
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
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-1 w-2 h-2 bg-gray-800 rotate-45"></div>
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
                path={getUrlWithPathParams(path)}
                method={method}
              />
            </div>

            {/* Path Parameters Section */}
            {endpoint.parameters?.some(param => param.in === 'path') && (
              <div className="py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Path Parameters:</span>
                  {endpoint.parameters
                    .filter(param => param.in === 'path')
                    .map(param => (
                      <div key={param.name} className="flex items-center gap-2 min-w-[200px] group">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 whitespace-nowrap">
                          {param.name}
                          {param.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={pathParams[param.name] || ''}
                          onChange={(e) => handlePathParamChange(param.name, e.target.value)}
                          placeholder={param.description || param.name}
                          className="flex-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 
                                   focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 
                                   dark:bg-gray-800 dark:text-gray-100"
                        />
                        {param.description && (
                          <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs rounded p-2 z-10 mt-1 -translate-y-12">
                            {param.description}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Request Configuration Section */}
            <div className="py-4">
              {/* Headers and Body Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Headers Section */}
                <div className="space-y-4">
                  <Headers
                    headers={localHeaders}
                    onHeaderChange={handleHeaderChange}
                  />
                </div>

                {/* Request Body Section */}
                {endpoint.requestBody && (
                  <RequestBodySection requestBody={endpoint.requestBody}>
                    {renderRequestBody}
                  </RequestBodySection>
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
              headers={localHeaders}
              body={requestBody}
            />
          </div>
        )}
      </div>
    </div>
  );
};
