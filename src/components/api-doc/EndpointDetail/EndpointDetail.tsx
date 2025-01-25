"use client";;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { OpenAPIV3 } from 'openapi-types';
import { ApiEndpoint, ApiSpec } from '../types';
import { ApiDoc } from '@prisma/client';
import { EndpointUrlBar } from './EndpointUrlBar';
import { CodeSamples } from './CodeSamples';
import { generateExampleFromSchema } from '../utils/schemaToExample';
import { resolveSchema } from '../utils/resolveSchema';
import { JsonEditor } from './JsonEditor';
import { Headers } from './Headers';
import { RequestBodySection } from './RequestBodySection';
import { ResponseSection } from './ResponseSection';
import { motion } from 'framer-motion';
import { PiLockKey, PiSealWarning } from 'react-icons/pi';

interface EndpointDetailProps {
  path: string;
  method: string;
  endpoint: ApiEndpoint;
  spec: ApiSpec;
  apiDoc: ApiDoc;
  headers?: Array<{ key: string; value: string; required?: boolean }>;
  onHeadersChange?: (headers: Array<{ key: string; value: string; required?: boolean }>) => void;
}

enum TTab {
  TRY = 'try',
  CODE = 'code'
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
  const [selectedServer, setSelectedServer] = useState(spec.servers?.[0]?.url ?? 'localhost:3000');
  const [requestBody, setRequestBody] = useState<Record<string, unknown> | null>(null);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TTab>(TTab.TRY);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string | string[] | number | boolean | null>;
    data: unknown;
  } | null>(null);
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

  // Reset and initialize state when endpoint changes
  useEffect(() => {
    const initializeState = async () => {
      // Reset all states
      setResponse(null);
      setError(null);
      setQueryParams({});
      setRequestBody(null);
      setFormData({});
      setPathParams({});

      // Initialize request body if available
      if (endpoint.requestBody && !('$ref' in endpoint.requestBody) && endpoint.requestBody.content?.['application/json']?.schema) {
        try {
          const schema = endpoint.requestBody.content['application/json'].schema;
          const resolvedSchema = resolveSchema(schema, spec);
          const example = generateExampleFromSchema(resolvedSchema);
          const parsedExample = typeof example === 'string' ? JSON.parse(example) : example;
          setRequestBody(parsedExample);
        } catch (error) {
          console.error('Error generating example request body:', error);
          setRequestBody(null);
        }
      }

      // Initialize content type
      if (endpoint.requestBody && !('$ref' in endpoint.requestBody) && endpoint.requestBody.content) {
        const contentTypes = Object.keys(endpoint.requestBody.content);
        if (contentTypes.length > 0) {
          const preferredType = contentTypes.includes('application/json')
            ? 'application/json'
            : contentTypes[0];
          setSelectedContentType(preferredType);
        }
      } else {
        setSelectedContentType('');
      }

      // Initialize query parameters
      const defaultParams: Record<string, string> = {};
      endpoint.parameters?.forEach(param => {
        if (!('$ref' in param) && param.in === 'query' && param.required) {
          defaultParams[param.name] = getDefaultValueForParameter(param);
        }
      });
      setQueryParams(defaultParams);

      // Initialize path parameters
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
        if (!('$ref' in param) && param.in === 'path') {
          defaultPathParams[param.name] = (initialParams as Record<string, string>)[param.name] || '';
        }
      });
      setPathParams(defaultPathParams);
    };

    initializeState();
  }, [endpoint, spec, apiDoc.id]);

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
      if (endpoint.requestBody && !('$ref' in endpoint.requestBody) && endpoint.requestBody.content) {
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
            if (scheme && 'type' in scheme && scheme.name) {
              if (scheme.type === 'apiKey' && scheme.in === 'header') {
                defaultHeaders.push({
                  key: scheme.name,
                  value: '',
                  required: true
                });
              } else if (scheme.type === 'http' && scheme.scheme === 'bearer') {
                defaultHeaders.push({
                  key: 'Authorization',
                  value: 'Bearer ',
                  required: true
                });
              }
            }
          });
        });
      }

      // Add headers from parameters
      endpoint.parameters?.forEach(param => {
        // Check if param is not a Reference (doesn't have $ref)
        if ('in' in param && param.in === 'header') {
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
    if (endpoint.requestBody && !('$ref' in endpoint.requestBody) && endpoint.requestBody.content) {
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

      if (scheme && 'type' in scheme && scheme.name) {
        if (scheme.type === 'apiKey' && scheme.in === 'header') {
          schemes.push({
            type: scheme.type,
            name: scheme.name,
            in: scheme.in
          });
        } else if (scheme.type === 'http' && scheme.scheme === 'bearer') {
          schemes.push({
            type: scheme.type,
            name: 'Bearer Token',
            in: scheme.in ?? 'header'
          });
        }
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
      const securityScheme = spec.components?.securitySchemes?.[authKey];
      console.log(securityScheme);

      // Check if it's not a Reference by looking for the 'in' property
      if (securityScheme && 'in' in securityScheme && securityScheme.in === 'header') {
        keys.push(securityScheme.scheme ?? securityScheme.type);
      }
    });
    console.log(keys);

    return keys;


  }, [endpoint.security]);

  // Render request body based on content type
  const renderRequestBody = useMemo(() => {
    if (!endpoint.requestBody) return null;

    // Check if it's a reference object
    if ('$ref' in endpoint.requestBody) {
      // Handle reference object if needed
      return null;
    }

    // At this point TypeScript knows it's a RequestBody
    if (!endpoint.requestBody.content || !selectedContentType) return null;

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
                const parsedJson = JSON.parse(value);
                setRequestBody(parsedJson);
              } catch {
                setRequestBody({});
              }
            }}
            height="200px"
          />
        );

      case 'multipart/form-data':
      case 'application/x-www-form-urlencoded': {
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
      }

      default:
        return (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full h-64 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm font-mono"
                value={requestBody ? JSON.stringify(requestBody, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const value = e.target.value;
                    if (!value.trim()) {
                      setRequestBody(null);
                    } else {
                      const parsedJson = JSON.parse(value);
                      setRequestBody(parsedJson);
                    }
                  } catch {
                    setRequestBody({});
                  }
                }}
                placeholder={`Enter ${selectedContentType} request body`}
              />
            </div>
          </div>
        );
    }
  }, [endpoint.requestBody, selectedContentType, requestBody, spec, setRequestBody]);

  // Helper function to convert header values to strings
  const convertHeadersToString = (headers: Record<string, string | number | boolean | string[] | null>): Record<string, string> => {
    const stringHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      stringHeaders[key] = value === null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
    }
    return stringHeaders;
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      // Validate server URL
      if (!selectedServer) {
        throw new Error('Server URL is required');
      }

      // Validate required path parameters
      const missingPathParams = endpoint.parameters
        ?.filter(param => !('$ref' in param) &&
          (param as OpenAPIV3.ParameterObject).in === 'path' &&
          (param as OpenAPIV3.ParameterObject).required &&
          !pathParams[(param as OpenAPIV3.ParameterObject).name])
        .map(param => !('$ref' in param) ? (param as OpenAPIV3.ParameterObject).name : '');

      if (missingPathParams?.length > 0) {
        throw new Error(`Missing required path parameters: ${missingPathParams.join(', ')}`);
      }

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
      } else if (requestBody) {
        finalRequestBody = JSON.stringify(requestBody);
      }

      // Prepare headers
      const headersObj = localHeaders.reduce((acc, h) => {
        const key = h.key.trim();
        const value = h.value.trim();
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      if (selectedContentType) {
        headersObj['Content-Type'] = selectedContentType;
      }

      // Prepare URL with path parameters and query parameters
      const url = new URL(`${selectedServer}${getUrlWithPathParams(path)}`);
      Object.entries(queryParams).forEach(([key, value]) => {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey && trimmedValue) {
          url.searchParams.append(trimmedKey, trimmedValue);
        }
      });

      // Get current request body or generate from schema if not set
      let currentBody = finalRequestBody;
      if (!currentBody && endpoint.requestBody &&
        !('$ref' in endpoint.requestBody) &&
        endpoint.requestBody.content?.['application/json']?.schema) {
        const schema = endpoint.requestBody.content['application/json'].schema;
        const resolvedSchema = resolveSchema(schema, spec);
        currentBody = JSON.stringify(generateExampleFromSchema(resolvedSchema));
      }

      // Send request through proxy
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.toString(),
          method: method.toLowerCase(),
          headers: headersObj,
          data: ['get', 'head'].includes(method.toLowerCase()) ? undefined : currentBody
        })
      });

      const responseData = await proxyResponse.json();

      const response = {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: Object.fromEntries(proxyResponse.headers.entries()),
        data: responseData
      };

      setResponse(response);

      console.log('Response received:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    } catch (err: any) {
      console.error('Request failed:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Request failed';
      setError(errorMessage);

      if (err?.response) {
        setResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data
        });
      } else {
        setResponse(null);
      }
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          {/* Method and Path */}
          <div className="flex items-center gap-2 mb-2 min-h-[26px]">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{path}</div>
            {endpoint.deprecated && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full group relative">
                <PiSealWarning />
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
                <PiLockKey />
                <span>Auth Required</span>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block z-10">
                  <div className="bg-gray-800 text-white text-xs rounded p-2 shadow-lg">
                    <div className="font-medium mb-1">Authentication Required</div>
                    <div className="text-gray-300">
                      {endpoint.security?.map((security, index) => {
                        const scheme = Object.keys(security)[0];
                        const schemeDetails = spec.components?.securitySchemes?.[scheme];
                        return schemeDetails ? (
                          <div key={index} className="flex items-center gap-1">
                            <span>{('$ref' in schemeDetails) ? scheme : (schemeDetails.type === 'http' ? 'Bearer Token' : schemeDetails.type || scheme)}</span>
                          </div>
                        ) : null;
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
        <div className="flex gap-2 p-2">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === TTab.TRY
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            onClick={() => {
              setActiveTab(TTab.TRY)
            }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Try it out
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'code'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            onClick={() => setActiveTab(TTab.CODE)}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code samples
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab.toString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {(activeTab === TTab.TRY) ?
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* URL Bar */}
              <div className="p-4 px-1">
                <EndpointUrlBar
                  servers={spec.servers || []}
                  selectedServer={selectedServer}
                  onServerChange={setSelectedServer}
                  path={getUrlWithPathParams(path)}
                  method={method}
                />
              </div>

              {/* Path Parameters Section */}
              {endpoint.parameters?.some(param => (param as OpenAPIV3.ParameterObject).in === 'path') && (
                <div className="p-4 px-1">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Path Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {endpoint.parameters
                        .filter(param => (param as OpenAPIV3.ParameterObject).in === 'path')
                        .map(param => (
                          <motion.div
                            key={(param as OpenAPIV3.ParameterObject).name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative"
                          >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <div className="flex items-center gap-1">
                                {(param as OpenAPIV3.ParameterObject).name}
                                {(param as OpenAPIV3.ParameterObject).required && (
                                  <span className="text-red-500 text-xs">*</span>
                                )}
                                {(param as OpenAPIV3.ParameterObject).description && (
                                  <div className="relative">
                                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                      {(param as OpenAPIV3.ParameterObject).description}
                                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </label>
                            <input
                              type="text"
                              value={pathParams[(param as OpenAPIV3.ParameterObject).name] || ''}
                              onChange={(e) => handlePathParamChange((param as OpenAPIV3.ParameterObject).name, e.target.value)}
                              placeholder={(param as OpenAPIV3.ParameterObject).description || (param as OpenAPIV3.ParameterObject).name}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         transition-shadow duration-200"
                            />
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Request Configuration Section */}
              <div className="p-4 px-1 space-y-6">
                {/* Headers and Body Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Headers Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <Headers
                      headers={localHeaders}
                      onHeaderChange={handleHeaderChange}
                    />
                  </motion.div>

                  {/* Request Body Section */}
                  {endpoint.requestBody && !('$ref' in endpoint.requestBody) && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <RequestBodySection requestBody={endpoint.requestBody}>
                        {renderRequestBody}
                      </RequestBodySection>
                    </motion.div>
                  )}
                </div>

                {/* Send Request Button */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className={`inline-flex items-center px-6 py-2.5 text-sm font-medium rounded-lg
                        transition-all duration-200 transform hover:scale-105 active:scale-95
                        ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      } text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Response Section */}
              <ResponseSection response={response} sending={loading} />
            </div>
            :
            <div className="p-4 px-1">
              <CodeSamples
                method={method}
                url={`${selectedServer || 'http://localhost'}${path}`}
                headers={localHeaders.reduce((acc, header) => ({
                  ...acc,
                  [header.key]: header.value
                }), {})}
                body={requestBody || undefined}
              />
            </div>
          }
        </motion.div>
      </div>
    </div>
  );
};
