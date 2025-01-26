"use client";;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { OpenAPIV3 } from "openapi-types";
import { ApiEndpoint, ApiSpec } from "../types";
import { ApiDoc } from "@prisma/client";
import { CodeSamples } from "./CodeSamples";
import { generateExampleFromSchema } from "../utils/schemaToExample";
import { resolveSchema } from "../utils/resolveSchema";
import { motion } from "framer-motion";
import { PiLockKey, PiSealWarning } from "react-icons/pi";
import { ResponseSection } from "./ResponseSection";
import { RequestBodySection } from "./RequestBodySection";
import { EndpointUrlBar } from "./EndpointUrlBar";
import { Headers } from "./Headers";
import { DocumentationSection } from "./DocumentationSection";
import { useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";
import { TEXT_STYLES, BADGE_STYLES, BUTTON_STYLES } from "./styles";

interface EndpointDetailProps {
  path: string;
  method: string;
  endpoint: ApiEndpoint;
  spec: ApiSpec;
  apiDoc: ApiDoc;
  headers?: Array<{ key: string; value: string; required?: boolean }>;
  onHeadersChange?: (
    headers: Array<{ key: string; value: string; required?: boolean }>
  ) => void;
}

enum TTab {
  PLAYGROUND = "playground",
  DOCUMENTATION = "documentation",
  CODE = "code",
}



export const EndpointDetail: React.FC<EndpointDetailProps> = ({
  path,
  method,
  endpoint,
  spec,
  apiDoc,
  headers,
  onHeadersChange,
}) => {
  const [selectedServer, setSelectedServer] = useState(
    spec.servers?.[0]?.url ?? "localhost:3000"
  );
  const [requestBody, setRequestBody] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab")?.toLowerCase();
  const initialTab =
    tabFromUrl && Object.values(TTab).includes(tabFromUrl as TTab)
      ? (tabFromUrl as TTab)
      : TTab.PLAYGROUND;

  const [activeTab, setActiveTab] = useState<TTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string | string[] | number | boolean | null>;
    data: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [localHeaders, setLocalHeaders] = useState<
    Array<{ key: string; value: string; required?: boolean }>
  >(headers || []);

  const router = useRouter();

  // Get current request body or generate from schema if not set
  const getCurrentRequestBody = useCallback(() => {
    let currentBody = requestBody;
    if (
      !currentBody &&
      endpoint.requestBody &&
      !("$ref" in endpoint.requestBody) &&
      endpoint.requestBody.content?.["application/json"]?.schema
    ) {
      const schema = endpoint.requestBody.content["application/json"].schema;
      const resolvedSchema = resolveSchema(schema, spec);
      currentBody = generateExampleFromSchema(resolvedSchema);
    }
    return currentBody;
  }, [endpoint.requestBody, requestBody, spec]);

  // Function to replace path parameters in URL
  const getUrlWithPathParams = useCallback(
    (urlPath: string) => {
      let finalUrl = urlPath;
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(
          `{${key}}`,
          encodeURIComponent(value || `{${key}}`)
        );
      });
      return finalUrl;
    },
    [pathParams]
  );

  // Handle send request
  const handleSendRequest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      // Validate server URL
      if (!selectedServer) {
        throw new Error("Server URL is required");
      }

      // Validate required path parameters
      const missingPathParams = endpoint.parameters
        ?.filter(
          (param) =>
            !("$ref" in param) &&
            (param as OpenAPIV3.ParameterObject).in === "path" &&
            (param as OpenAPIV3.ParameterObject).required &&
            !pathParams[(param as OpenAPIV3.ParameterObject).name]
        )
        .map((param) =>
          !("$ref" in param) ? (param as OpenAPIV3.ParameterObject).name : ""
        );

      if (missingPathParams?.length > 0) {
        throw new Error(
          `Missing required path parameters: ${missingPathParams.join(", ")}`
        );
      }

      // Prepare request body based on content type
      let finalRequestBody: string | FormData | undefined;
      if (selectedContentType === "multipart/form-data") {
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value);
        });
        finalRequestBody = formDataObj;
      } else if (selectedContentType === "application/x-www-form-urlencoded") {
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
        headersObj["Content-Type"] = selectedContentType;
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

      const currentBody = getCurrentRequestBody();

      // Send request through proxy
      const proxyResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.toString(),
          method: method.toLowerCase(),
          headers: headersObj,
          data: ["get", "head"].includes(method.toLowerCase())
            ? undefined
            : currentBody,
        }),
      });

      const responseData = await proxyResponse.json();

      const response = {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: Object.fromEntries(proxyResponse.headers.entries()),
        data: responseData,
      };

      setResponse(response);

      console.log("Response received:", {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
    } catch (err: any) {
      console.error("Request failed:", err);
      const errorMessage =
        err?.response?.data?.error || err?.message || "Request failed";
      setError(errorMessage);

      if (err?.response) {
        setResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
        });
      } else {
        setResponse(null);
      }
    } finally {
      setLoading(false);
    }
  }, [
    selectedServer,
    endpoint.parameters,
    pathParams,
    selectedContentType,
    formData,
    requestBody,
    localHeaders,
    path,
    queryParams,
    getCurrentRequestBody,
    getUrlWithPathParams,
    method,
  ]);

  // Read tab from URL when component mounts or URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")?.toLowerCase();
    if (
      tabFromUrl &&
      Object.values(TTab).includes(tabFromUrl as TTab) &&
      activeTab !== tabFromUrl
    ) {
      setActiveTab(tabFromUrl as TTab);
    }
  }, [searchParams, activeTab]);

  // Update URL when tab changes
  const updateTab = (newTab: TTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
    setActiveTab(newTab);
  };

  // Header'lar değiştiğinde localStorage'a kaydet
  useEffect(() => {
    try {
      const storageKey = `headers-${apiDoc?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(localHeaders));
    } catch (error) {
      console.error("Error saving headers to localStorage:", error);
    }
  }, [localHeaders, apiDoc?.id]);

  // Reset and initialize state when d changes
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
      if (
        endpoint.requestBody &&
        !("$ref" in endpoint.requestBody) &&
        endpoint.requestBody.content?.["application/json"]?.schema
      ) {
        try {
          const schema =
            endpoint.requestBody.content["application/json"].schema;
          const resolvedSchema = resolveSchema(schema, spec);
          const example = generateExampleFromSchema(resolvedSchema);
          const parsedExample =
            typeof example === "string" ? JSON.parse(example) : example;
          setRequestBody(parsedExample);
        } catch (error) {
          console.error("Error generating example request body:", error);
          setRequestBody(null);
        }
      }

      // Initialize content type
      if (
        endpoint.requestBody &&
        !("$ref" in endpoint.requestBody) &&
        endpoint.requestBody.content
      ) {
        const contentTypes = Object.keys(endpoint.requestBody.content);
        if (contentTypes.length > 0) {
          const preferredType = contentTypes.includes("application/json")
            ? "application/json"
            : contentTypes[0];
          setSelectedContentType(preferredType);
        }
      } else {
        setSelectedContentType("");
      }

      // Initialize query parameters
      const defaultParams: Record<string, string> = {};
      endpoint.parameters?.forEach((param) => {
        if (!("$ref" in param) && param.in === "query" && param.required) {
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
          console.error("Error parsing stored path parameters:", error);
        }
      }

      endpoint.parameters?.forEach((param) => {
        if (!("$ref" in param) && param.in === "path") {
          defaultPathParams[param.name] =
            (initialParams as Record<string, string>)[param.name] || "";
        }
      });
      setPathParams(defaultPathParams);
    };

    initializeState();
  }, [endpoint, spec, apiDoc.id]);

  // Get default value for a parameter based on its schema
  const getDefaultValueForParameter = useCallback(
    (param: OpenAPIV3.ParameterObject): string => {
      if (!param.schema) return "";

      const schema = param.schema as OpenAPIV3.SchemaObject;
      if (schema.default !== undefined) {
        return String(schema.default);
      }

      if (schema.example !== undefined) {
        return String(schema.example);
      }

      switch (schema.type) {
        case "string":
          return schema.enum ? schema.enum[0] : "string";
        case "number":
        case "integer":
          return "0";
        case "boolean":
          return "false";
        case "array":
          return "[]";
        case "object":
          return "{}";
        default:
          return "";
      }
    },
    []
  );

  // Store header values when they change
  const updateHeaderValues = useCallback(
    (headers: Array<{ key: string; value: string; required?: boolean }>) => {
      const newHeaderValues: Record<string, string> = {};
      headers.forEach((header) => {
        newHeaderValues[header.key.toLowerCase()] = header.value;
      });
    },
    []
  );



  // Handle header changes
  const handleHeaderChange = useCallback(
    (newHeaders: Array<{ key: string; value: string; required?: boolean }>) => {
      setLocalHeaders(newHeaders);
      onHeadersChange?.(newHeaders);
    },
    [onHeadersChange]
  );

  // Initialize headers when endpoint changes
  useEffect(() => {
    const initializeHeaders = () => {
      const defaultHeaders: Array<{
        key: string;
        value: string;
        required?: boolean;
      }> = [];

      // Add Content-Type header if endpoint has request body
      if (
        endpoint.requestBody &&
        !("$ref" in endpoint.requestBody) &&
        endpoint.requestBody.content
      ) {
        const contentTypes = Object.keys(endpoint.requestBody.content);
        if (contentTypes.length > 0) {
          defaultHeaders.push({
            key: "Content-Type",
            value: contentTypes[0],
            required: true,
          });
        }
      }

      // Add required headers from security schemes
      if (endpoint.security?.length) {
        endpoint.security.forEach((securityRequirement) => {
          Object.keys(securityRequirement).forEach((schemeName) => {
            const scheme = spec.components?.securitySchemes?.[schemeName];
            if (scheme && "type" in scheme && scheme.name) {
              if (scheme.type === "apiKey" && scheme.in === "header") {
                defaultHeaders.push({
                  key: scheme.name,
                  value: "",
                  required: true,
                });
              } else if (scheme.type === "http" && scheme.scheme === "bearer") {
                defaultHeaders.push({
                  key: "Authorization",
                  value: "Bearer ",
                  required: true,
                });
              }
            }
          });
        });
      }

      // Add headers from parameters
      endpoint.parameters?.forEach((param) => {
        // Check if param is not a Reference (doesn't have $ref)
        if ("in" in param && param.in === "header") {
          defaultHeaders.push({
            key: param.name,
            value: "",
            required: param.required || false,
          });
        }
      });

      // Load saved headers from localStorage
      const storageKey = `headers-${apiDoc?.id}`;
      const storedHeaders = localStorage.getItem(storageKey);
      let savedHeaders: Array<{
        key: string;
        value: string;
        required?: boolean;
      }> = [];

      if (storedHeaders) {
        try {
          savedHeaders = JSON.parse(storedHeaders);
        } catch (error) {
          console.error("Error parsing stored headers:", error);
        }
      }

      // Merge required headers with saved headers
      const mergedHeaders = defaultHeaders.map((header) => {
        const savedHeader = savedHeaders.find(
          (h) => h.key.toLowerCase() === header.key.toLowerCase()
        );
        return savedHeader ? { ...header, value: savedHeader.value } : header;
      });

      // Add non-required saved headers
      savedHeaders.forEach((header) => {
        if (
          !mergedHeaders.some(
            (h) => h.key.toLowerCase() === header.key.toLowerCase()
          )
        ) {
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
      setLocalHeaders((prevHeaders) =>
        prevHeaders.map((header) =>
          header.key.toLowerCase() === "content-type"
            ? { ...header, value: selectedContentType }
            : header
        )
      );
    }
  }, [selectedContentType]);

  // Header'ları endpoint'e göre düzenle
  useEffect(() => {
    const currentHeaders = new Map(
      localHeaders.map((h) => [h.key.toLowerCase(), h])
    );
    const newHeaders = [...localHeaders].filter(
      (h) => h.key.toLowerCase() !== "content-type"
    );
    let hasChanges = false;

    // Content-Type kontrolü
    if (
      endpoint.requestBody &&
      !("$ref" in endpoint.requestBody) &&
      endpoint.requestBody.content
    ) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      if (contentTypes.length > 0) {
        const contentType = contentTypes[0];
        newHeaders.unshift({
          key: "Content-Type",
          value: contentType,
          required: true,
        });
        setSelectedContentType(contentType);
        hasChanges = true;
      }
    }

    // Authorization kontrolü
    const hasAuth = currentHeaders.has("authorization");
    if (endpoint.security?.length && !hasAuth) {
      newHeaders.push({
        key: "Authorization",
        value: "Bearer YOUR_ACCESS_TOKEN",
        required: true,
      });
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
      return;
    }

    const schemes: Array<{ type: string; name: string; in: string }> = [];

    endpoint.security.forEach((security) => {
      const securityKey = Object.keys(security)[0];
      const scheme = spec.components?.securitySchemes?.[securityKey];

      if (scheme && "type" in scheme && scheme.name) {
        if (scheme.type === "apiKey" && scheme.in === "header") {
          schemes.push({
            type: scheme.type,
            name: scheme.name,
            in: scheme.in,
          });
        } else if (scheme.type === "http" && scheme.scheme === "bearer") {
          schemes.push({
            type: scheme.type,
            name: "Bearer Token",
            in: scheme.in ?? "header",
          });
        }
      }
    });
  }, [endpoint?.security, spec.components?.securitySchemes]);

  // Check if endpoint requires authentication
  const requiresAuth = useMemo(() => {
    if (!endpoint?.security || endpoint.security.length === 0) return [];

    const keys: string[] = [];

    endpoint.security.forEach((authType) => {
      const authKey = Object.keys(authType)[0];
      const securityScheme = spec.components?.securitySchemes?.[authKey];
      console.log(securityScheme);

      // Check if it's not a Reference by looking for the 'in' property
      if (
        securityScheme &&
        "in" in securityScheme &&
        securityScheme.in === "header"
      ) {
        keys.push(securityScheme.scheme ?? securityScheme.type);
      }
    });
    console.log(keys);

    return keys;
  }, [endpoint.security]);


  // Memoize tab contents
  const playgroundContent = useMemo(
    () => (
      <div className="p-4">
        <div className="space-y-4">
          <EndpointUrlBar
            method={method}
            path={path}
            servers={spec.servers || []}
            selectedServer={selectedServer}
            onServerChange={setSelectedServer}
          />

          <div className="space-y-4 flex flex-row">
            {/* Headers Section */}
            <div className="flex-1">
              <Headers
                headers={localHeaders}
                onHeadersChange={handleHeaderChange}
              />
            </div>

            {/* Request Body Section */}
            <div className="flex-1">
              <RequestBodySection
                endpoint={endpoint}
                spec={spec}
                requestBody={requestBody}
                setRequestBody={setRequestBody}
                selectedContentType={selectedContentType}
                setSelectedContentType={setSelectedContentType}
                formData={formData}
                onFormDataChange={setFormData}
              />
            </div>

          </div>
          {/* Send Request Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className={classNames(
                "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm",
                loading ? BUTTON_STYLES.disabled : BUTTON_STYLES.primary
              )}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                  <span>Send Request</span>
                </>
              )}
            </button>
            {error && (
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={classNames(
                  "px-4 py-2 rounded-lg",
                  BADGE_STYLES.error
                )}
              >
                {error}
              </motion.p>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="mt-6">
          <h3 className={TEXT_STYLES.subheading}>Response</h3>
          <ResponseSection response={response} sending={loading} />
        </div>
      </div>
    ),
    [
      method,
      path,
      spec.servers,
      selectedServer,
      pathParams,
      localHeaders,
      endpoint,
      requestBody,
      selectedContentType,
      formData,
      loading,
      error,
      response,
      handleHeaderChange,
      handleSendRequest,
    ]
  );

  const documentationContent = useMemo(
    () => (
      <div className="p-4">
        <DocumentationSection endpoint={endpoint} spec={spec} />
      </div>
    ),
    [endpoint, spec]
  );

  const codeContent = useMemo(
    () => (
      <div className="p-4">
        <CodeSamples
          method={method}
          url={`${selectedServer || "http://localhost"}${path}`}
          headers={localHeaders.reduce(
            (acc, header) => ({
              ...acc,
              [header.key]: header.value,
            }),
            {}
          )}
          body={requestBody || undefined}
        />
      </div>
    ),
    [method, selectedServer, path, localHeaders, requestBody]
  );

  // Load path parameters from localStorage
  useEffect(() => {
    const storedParams = localStorage.getItem(`pathParams-${apiDoc.id}`);
    if (storedParams) {
      try {
        const parsedParams = JSON.parse(storedParams);
        setPathParams(parsedParams);
      } catch (error) {
        console.error("Error parsing stored path parameters:", error);
      }
    }
  }, [path]);

  useEffect(() => {
    if (Object.keys(pathParams).length > 0) {
      localStorage.setItem(
        `pathParams-${apiDoc.id}`,
        JSON.stringify(pathParams)
      );
    }
  }, [pathParams, path]);


  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col">
          {/* Method and Path */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={classNames(
                "text-xs py-0.5 px-1.5 rounded",
                BADGE_STYLES.neutral
              )}
            >
              {endpoint?.operationId}
            </span>
            <div className={TEXT_STYLES.small}>{path}</div>
            {endpoint?.deprecated && (
              <div
                className={classNames(
                  "flex items-center gap-1 px-1 py-0.5 rounded-full border text-xs",
                  BADGE_STYLES.error
                )}
              >
                <PiSealWarning />
                <span>Deprecated</span>
              </div>
            )}
            {requiresAuth.length > 0 && (
              <div
                className={classNames(
                  "flex items-center gap-1 px-1 py-0.5 rounded-full border text-xs",
                  BADGE_STYLES.warning
                )}
              >
                <PiLockKey />
                <span>Auth Required</span>
              </div>
            )}
          </div>
          {endpoint?.description && (
            <div className={TEXT_STYLES.body}>{endpoint?.description}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 p-2">
          {Object.values(TTab).map((tab) => (
            <button
              key={tab}
              className={classNames(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === tab
                  ? BADGE_STYLES.primary
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => updateTab(tab)}
            >
              <div className="flex items-center gap-2">
                {tab === TTab.PLAYGROUND && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                )}
                {tab === TTab.DOCUMENTATION && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                )}
                {tab === TTab.CODE && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                )}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === TTab.PLAYGROUND && playgroundContent}
        {activeTab === TTab.DOCUMENTATION && documentationContent}
        {activeTab === TTab.CODE && codeContent}
      </div>
    </div>
  );
};

export default EndpointDetail;
