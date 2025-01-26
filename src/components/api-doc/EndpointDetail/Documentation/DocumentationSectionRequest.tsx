"use client";;

import { FC, useMemo } from "react";
import { ApiEndpoint, ApiSpec } from "../../types";

interface DocumentationSectionRequestProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

// Schema referanslarını çözümler
const resolveSchemaRef = (schema: any, spec: ApiSpec): any => {
  if (!schema) return null;

  if (schema.$ref) {
    const ref = schema.$ref.replace("#/", "").split("/");
    let resolvedSchema = spec;
    for (const path of ref) {
      resolvedSchema = resolvedSchema?.[path];
    }
    return resolveSchemaRef(resolvedSchema, spec);
  }

  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: resolveSchemaRef(schema.items, spec),
    };
  }

  if (schema.type === "object" && schema.properties) {
    const resolvedProperties: any = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      resolvedProperties[key] = resolveSchemaRef(value as any, spec);
    }
    return {
      ...schema,
      properties: resolvedProperties,
    };
  }

  return schema;
};

// Şema tipini formatlı gösterir
const formatSchemaType = (schema: any): string => {
  if (!schema) return "unknown";

  if (schema.type === "array") {
    const itemType = formatSchemaType(schema.items);
    return `array<${itemType}>`;
  }

  if (schema.type === "object" && schema.additionalProperties) {
    const valueType = formatSchemaType(schema.additionalProperties);
    return `Record<string, ${valueType}>`;
  }

  let type = schema.type || "any";
  if (schema.enum) {
    type = `enum(${schema.enum.join(" | ")})`;
  }
  if (schema.format) {
    type += ` (${schema.format})`;
  }
  if (schema.nullable) {
    type += " | null";
  }

  return type;
};

const DocumentationSectionRequest: FC<DocumentationSectionRequestProps> = ({
  endpoint,
  spec,
}) => {
  const resolvedContent = useMemo(() => {
    if (!endpoint.requestBody || !("content" in endpoint.requestBody)) {
      return null;
    }

    const content: Record<string, any> = {};
    Object.entries(endpoint.requestBody.content).forEach(
      ([contentType, contentSchema]) => {
        content[contentType] = {
          ...contentSchema,
          schema: contentSchema.schema
            ? resolveSchemaRef(contentSchema.schema, spec)
            : null,
        };
      }
    );
    return content;
  }, [endpoint.requestBody, spec]);

  // Parametreleri tipine göre grupla
  const parameterGroups = useMemo(() => {
    if (!endpoint.parameters?.length) return null;

    const groups: Record<string, any[]> = {};
    endpoint.parameters.forEach((param) => {
      if ("$ref" in param) return;
      if (!groups[param.in]) {
        groups[param.in] = [];
      }
      groups[param.in].push(param);
    });

    return groups;
  }, [endpoint.parameters]);

  return (
    <div className="space-y-2">
      {/* Parametreler */}
      <h3 className="text-lg font-semibold px-2 pb-0">Parameters</h3>
      {parameterGroups &&
        Object.entries(parameterGroups).map(([paramType, params]) => (
          <div key={paramType} className="p-2 pt-0 space-y-2">
            <div className="space-y-2">
              {Array.from(new Set(params.map((param) => param.name))).map(
                (paramName, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-900 px-2 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs">{paramName}</span>
                      <span className="text-xs text-gray-500">
                        {formatSchemaType(
                          params.find((param) => param.name === paramName)
                            .schema
                        )}
                      </span>
                      {params.find((param) => param.name === paramName)
                        .required && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300">
                            Required
                          </span>
                        )}
                    </div>
                    {params.find((param) => param.name === paramName)
                      .description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {
                            params.find((param) => param.name === paramName)
                              .description
                          }
                        </p>
                      )}
                    {params.find((param) => param.name === paramName).schema
                      ?.enum && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            Allowed values:{" "}
                            {params
                              .find((param) => param.name === paramName)
                              .schema.enum.join(", ")}
                          </span>
                        </div>
                      )}
                  </div>
                )
              )}
            </div>
          </div>
        ))}

      {/* Request Body */}
      {resolvedContent && (
        <div className="p-2 space-y-2">
          <h3 className="text-sm font-medium">Request Body</h3>
          <div className="space-y-1.5">
            {endpoint.requestBody?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {endpoint.requestBody.description}
              </p>
            )}
            {Object.entries(resolvedContent).map(([contentType, content]) => (
              <div key={contentType} className="mt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-1.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-300">
                    {contentType}
                  </span>
                  {content.schema?.required && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300">
                      Required
                    </span>
                  )}
                </div>
                {content.schema && (
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">
                    <code>{JSON.stringify(content.schema, null, 2)}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationSectionRequest;
