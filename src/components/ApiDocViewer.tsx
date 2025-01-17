"use client";
import { ApiDoc } from "@prisma/client";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ApiDocViewerProps {
  apiDoc: ApiDoc & {
    user: {
      name: string | null
      email: string
    }
  }
}

interface ApiEndpoint {
  path: string
  method: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: {
    name: string
    in: string
    description?: string
    required?: boolean
    schema?: {
      type: string
      format?: string
    }
  }[]
  requestBody?: {
    description?: string
    content?: {
      [key: string]: {
        schema: any
      }
    }
  }
  responses?: {
    [key: string]: {
      description: string
      content?: {
        [key: string]: {
          schema: any
        }
      }
    }
  }
}

interface ApiSpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: {
    url: string
    description?: string
  }[]
  paths: {
    [key: string]: {
      [key: string]: ApiEndpoint
    }
  }
}

interface EndpointGroup {
  name: string
  endpoints: {
    path: string
    method: string
    endpoint: ApiEndpoint
  }[]
}

function generateCodeSample(path: string, method: string, parameters: any, requestBody: any) {
  const samples = {
    'Node / Axios': `const axios = require('axios');
${requestBody ? `const data = ${JSON.stringify(requestBody, null, 2)};` : ''}
const options = {
  method: '${method.toUpperCase()}',
  url: '${path}',
  headers: {
    'gttm-api-key': '',
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }${requestBody ? ',\n  data' : ''}
};

try {
  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error);
}`,
    'Python / Requests': `import requests

url = "${path}"
${requestBody ? `payload = ${JSON.stringify(requestBody, null, 2)}` : ''}
headers = {
    "gttm-api-key": "",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

try:
    response = requests.${method.toLowerCase()}(url${requestBody ? ', json=payload' : ''}, headers=headers)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(e)`,
    'cURL': `curl -X ${method.toUpperCase()} '${path}' \\
     -H 'gttm-api-key: ' \\
     -H 'Content-Type: application/json' \\
     -H 'Accept: application/json'${requestBody ? ` \\\n     -d '${JSON.stringify(requestBody)}'` : ''}`
  }

  return samples
}



function EndpointDetail({
  path,
  method,
  endpoint,
  spec
}: {
  path: string
  method: string
  endpoint: ApiEndpoint
  spec: ApiSpec
}) {
  const { theme } = useTheme()
  const [selectedTab, setSelectedTab] = useState<'docs' | 'try'>('docs')
  const [selectedCodeLang, setSelectedCodeLang] = useState('Node / Axios')
  const [selectedServer, setSelectedServer] = useState<string>(spec.servers?.[0]?.url || '')
  const [requestData, setRequestData] = useState<any>({})
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fullUrl = `${selectedServer}${path}`

  const codeSamples = generateCodeSample(
    fullUrl,
    method,
    endpoint.parameters,
    endpoint.requestBody?.content?.['application/json']?.schema
  )

  const handleSendRequest = async () => {
    setLoading(true)
    try {
      const requestConfig = {
        url: fullUrl,
        method: method.toLowerCase(),
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
        }
      }

      // Try direct request first
      const { data } = await axios(requestConfig).catch(async (error) => {
        console.log('Direct request failed, trying proxy:', error.message)
        // If direct request fails (likely due to CORS), try proxy
        return await axios.post('/api/proxy', requestConfig)
      })

      setResponse(data)
      setSelectedTab('try')
    } catch (error) {
      console.error('Request failed:', error)
      if (axios.isAxiosError(error)) {
        setResponse({
          error: error.response?.data || error.message
        })
      } else {
        setResponse({
          error: 'An unexpected error occurred'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium uppercase ${method.toLowerCase() === 'get' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
              method.toLowerCase() === 'post' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                method.toLowerCase() === 'put' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  method.toLowerCase() === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
              }`}
          >
            {method}
          </span>
          <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{path}</code>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <select
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value as 'docs' | 'try')}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
          >
            <option value="docs">Documentation</option>
            <option value="try">Try It</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedTab === 'docs' ? (
          <div className="p-4 space-y-4">
            {/* Description */}
            {endpoint.description && (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {endpoint.description}
              </div>
            )}

            {/* Authentication */}
            {endpoint.security && endpoint.security.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Authentication</h3>
                <div className="text-sm space-y-1">
                  {endpoint.security.map((security, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-gray-500">•</span>
                      <span>{Object.keys(security)[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Parameters</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">In</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Required</th>
                        <th className="px-2 py-1 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.parameters.map((param, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-2 py-1 font-mono">{param.name}</td>
                          <td className="px-2 py-1">{param.in}</td>
                          <td className="px-2 py-1">{param.schema?.type}</td>
                          <td className="px-2 py-1">{param.required ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-1">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Body */}
            {endpoint.requestBody && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Request Body</h3>
                {Object.entries(endpoint.requestBody.content).map(([contentType, content]) => (
                  <div key={contentType} className="space-y-2">
                    <div className="text-sm font-mono text-gray-500">{contentType}</div>
                    {content.schema && (
                      <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(content.schema, null, 2)}
                      </pre>
                    )}
                    {content.example && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Example:</div>
                        <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                          {JSON.stringify(content.example, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Responses */}
            {endpoint.responses && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Responses</h3>
                {Object.entries(endpoint.responses).map(([status, response]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.startsWith('2') ? 'bg-green-100 text-green-800' :
                        status.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                          status.startsWith('5') ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {status}
                      </span>
                      <span className="text-sm">{response.description}</span>
                    </div>
                    {response.content && Object.entries(response.content).map(([contentType, content]) => (
                      <div key={contentType} className="space-y-1">
                        <div className="text-sm font-mono text-gray-500">{contentType}</div>
                        {content.schema && (
                          <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                            {JSON.stringify(content.schema, null, 2)}
                          </pre>
                        )}
                        {content.example && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Example:</div>
                            <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                              {JSON.stringify(content.example, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Code Samples */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Code Samples</h3>
              <div className="space-y-2">
                <select
                  value={selectedCodeLang}
                  onChange={(e) => setSelectedCodeLang(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
                >
                  <option>Node / Axios</option>
                  <option>Python / Requests</option>
                  <option>cURL</option>
                </select>
                <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {codeSamples[selectedCodeLang]}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Try It Form */}
            <div className="space-y-4">
              {/* Server Selection */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Server</label>
                <select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                >
                  {spec.servers?.map((server, index) => (
                    <option key={index} value={server.url}>
                      {server.description || server.url}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Request URL: <code className="font-mono">{fullUrl}</code>
                </div>
              </div>

              {/* Parameters */}
              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Parameters</h3>
                  {endpoint.parameters.map((param, index) => (
                    <div key={index} className="space-y-1">
                      <label className="text-sm">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={param.description}
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Request Body */}
              {endpoint.requestBody && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Request Body</h3>
                  <textarea
                    value={JSON.stringify(requestData, null, 2)}
                    onChange={(e) => {
                      try {
                        setRequestData(JSON.parse(e.target.value))
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="w-full h-40 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                  />
                </div>
              )}

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Response</h3>
                  <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function fetchApiSpec(apiDoc: ApiDoc) {
  try {
    if (apiDoc.jsonContent) {
      return JSON.parse(apiDoc.jsonContent)
    }

    if (apiDoc.jsonUrl) {
      const headers: Record<string, string> = {}

      // Add authorization headers based on authType
      switch (apiDoc.authType) {
        case "API_KEY":
          if (apiDoc.authKey) {
            headers[apiDoc.authHeader || "X-API-Key"] = apiDoc.authKey
          }
          break
        case "BASIC_AUTH":
          if (apiDoc.authKey && apiDoc.authSecret) {
            const credentials = btoa(`${apiDoc.authKey}:${apiDoc.authSecret}`)
            headers["Authorization"] = `Basic ${credentials}`
          }
          break
        case "BEARER_TOKEN":
          if (apiDoc.authKey) {
            headers["Authorization"] = `Bearer ${apiDoc.authKey}`
          }
          break
      }

      // Use proxy endpoint to fetch the API spec
      const { data } = await axios.post("/api/proxy", {
        url: apiDoc.jsonUrl,
        headers,
      })

      return data
    }

    throw new Error("No JSON content or URL provided")
  } catch (error) {
    console.error("Error fetching API spec:", error)
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch API spec: ${error.response?.data?.error || error.message}`
      )
    }
    throw error
  }
}

export default function ApiDocViewer({ apiDoc }: ApiDocViewerProps) {
  const [spec, setSpec] = useState<ApiSpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string
    method: string
    endpoint: ApiEndpoint
  } | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [sidebarWidth, setSidebarWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = Math.max(150, Math.min(600, e.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const startResizing = () => {
    setIsResizing(true)
    document.body.style.userSelect = 'none'
  }

  const groupedEndpoints = useMemo(() => {
    if (!spec?.paths) return {}

    const groups: Record<string, Array<{
      path: string
      method: string
      endpoint: ApiEndpoint
    }>> = {}

    const defaultTag = 'Other'
    const query = searchQuery.toLowerCase()

    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        // Skip if doesn't match search

        if (query && !path.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).path?.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).summary?.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).tags?.join(', ')?.toLowerCase().includes(query) &&
          !(endpoint as ApiEndpoint).description?.toLowerCase().includes(query)) {
          return
        }

        const tags = (endpoint as ApiEndpoint).tags || [defaultTag]

        // Add endpoint to each of its tags
        tags.forEach(tag => {
          if (!groups[tag]) {
            groups[tag] = []
          }

          groups[tag].push({
            path,
            method: method.toUpperCase(),
            endpoint: endpoint as ApiEndpoint
          })
        })
      })
    })

    // Sort endpoints within each group
    return Object.fromEntries(
      Object.entries(groups).map(([tag, endpoints]) => [
        tag,
        endpoints.sort((a, b) => {
          // Sort by method first, then by path
          const methodOrder = { GET: 1, POST: 2, PUT: 3, DELETE: 4 }
          const methodDiff =
            (methodOrder[a.method as keyof typeof methodOrder] || 99) -
            (methodOrder[b.method as keyof typeof methodOrder] || 99)

          return methodDiff || a.path.localeCompare(b.path)
        })
      ])
    )
  }, [spec?.paths, searchQuery])

  const TagGroup = ({
    name,
    endpoints,
    tagDescription,
  }: {
    name: string
    endpoints: Array<{
      path: string
      method: string
      endpoint: ApiEndpoint
    }>
    tagDescription?: string
  }) => {
    const isOpen = openGroups[name] ?? false

    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleGroup(name)}
          className="
            flex items-center justify-between w-full px-3 py-1.5
            text-left font-mono text-xs font-medium
            text-gray-900 dark:text-white
            hover:bg-gray-50 dark:hover:bg-gray-800/50
            border-l-2 border-transparent
            hover:border-gray-300 dark:hover:border-gray-600
          "
          title={tagDescription}
        >
          <div className="flex items-center space-x-2">
            <span>🌐</span>
            <span>{name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({endpoints.length})
            </span>
          </div>
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? 'transform rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {isOpen && (
          <div className="py-1">
            {endpoints.map((endpoint) => (
              <SidebarItem
                key={`${endpoint.method}-${endpoint.path}`}
                method={endpoint.method}
                path={endpoint.path}
                summary={endpoint.endpoint.summary}
                isSelected={
                  selectedEndpoint?.method === endpoint.method &&
                  selectedEndpoint?.path === endpoint.path
                }
                onClick={() => setSelectedEndpoint(endpoint)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  function SidebarItem({
    method,
    path,
    summary,
    isSelected,
    onClick,
  }: {
    method: string
    path: string
    summary?: string
    isSelected: boolean
    onClick: () => void
  }) {
    const methodColors = {
      get: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      post: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      put: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      patch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    }

    // Format path to show segments in different colors
    const pathSegments = path.split('/').filter(Boolean)
    const formattedPath = (
      <span className="flex items-center text-xs">
        <span className="text-gray-400 dark:text-gray-500">/</span>
        {pathSegments.map((segment, index) => (
          <span key={index} className="flex items-center whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">{segment}</span>
            {index < pathSegments.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500">/</span>
            )}
          </span>
        ))}
      </span>
    )

    return (
      <button
        onClick={onClick}
        className={`
          group flex items-center w-full px-3 py-1
          text-left font-mono text-xs
          ${isSelected
            ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-gray-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
        title={summary}
      >
        <div className="flex items-center min-w-0">
          <span
            className={`
              inline-flex items-center justify-center shrink-0
              w-14 px-1.5 py-0.5 mr-2 rounded text-xs font-medium uppercase
              ${methodColors[method.toLowerCase() as keyof typeof methodColors] || 'bg-gray-100 text-gray-800'}
            `}
          >
            {method}
          </span>
          <div className="truncate">
            {formattedPath}
          </div>
        </div>
      </button>
    )
  }

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  useEffect(() => {
    const loadApiSpec = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchApiSpec(apiDoc)
        setSpec(data)
        // Select first endpoint by default
        const firstPath = Object.keys(data.paths)[0]
        if (firstPath) {
          const firstMethod = Object.keys(data.paths[firstPath])[0]
          setSelectedEndpoint({
            path: firstPath,
            method: firstMethod,
            endpoint: data.paths[firstPath][firstMethod]
          })
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load API documentation")
      } finally {
        setLoading(false)
      }
    }

    loadApiSpec()
  }, [apiDoc])

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
    )
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
    )
  }

  if (!spec) {
    return <div className="flex items-center justify-center h-full">No API specification found</div>
  }

  return (
    <div className="flex h-full">
      {/* Sidebar with resize handle */}
      <div className="relative" style={{ width: sidebarWidth }}>
        {/* Sidebar content */}
        <div className="h-full overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '2px 20px' }}
                className="block w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 41px)' }}>
            {Object.entries(groupedEndpoints).map(([tagName, endpoints]) => (
              <TagGroup
                key={tagName}
                name={tagName}
                endpoints={endpoints}
                tagDescription={spec?.tags?.find(t => t.name === tagName)?.description}
              />
            ))}
          </div>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600"
          style={{ cursor: isResizing ? 'col-resize' : undefined }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedEndpoint ? (
          <EndpointDetail
            path={selectedEndpoint.path}
            method={selectedEndpoint.method}
            endpoint={selectedEndpoint.endpoint}
            spec={spec}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select an endpoint from the sidebar
          </div>
        )}
      </div>
    </div>
  )
}
