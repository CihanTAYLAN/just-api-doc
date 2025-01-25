"use client";
import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { ApiEndpoint, ApiSpec } from "../types";
import DocumentSectionRequest from "./DocumentSectionRequest";
import DocumentationSectionResponse from "./DocumentationSectionResponse";

interface DocumentationSectionProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

// schema resolver
const resolveSchemaFromSpec = (schema: any, spec: ApiSpec): any => {
  if (!schema) return null;

  if (schema.$ref) {
    const ref = schema.$ref.replace("#/", "").split("/");
    let resolvedSchema = spec;
    for (const path of ref) {
      resolvedSchema = resolvedSchema?.[path];
    }
    return resolveSchemaFromSpec(resolvedSchema, spec);
  }

  // Handle array type
  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: resolveSchemaFromSpec(schema.items, spec),
    };
  }

  // Handle object type with properties
  if (schema.type === "object" && schema.properties) {
    const resolvedProperties: any = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      resolvedProperties[key] = resolveSchemaFromSpec(value as any, spec);
    }
    return {
      ...schema,
      properties: resolvedProperties,
    };
  }
  return schema;
};

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  endpoint,
  spec,
}) => {
  const [resolvedSchemaObject, setResolvedSchemaObject] = useState<any>({});
  const [selectedResponseCode, setSelectedResponseCode] = useState<
    number | null
  >(null);

  useEffect(() => {
    console.log(endpoint, spec);
    setResolvedSchemaObject(resolveSchemaFromSpec(endpoint, spec));
  }, []);

  return (
    <div className="h-full">
      {/* Request Body Section */}
      <DocumentSectionRequest endpoint={endpoint} spec={spec} />

      {/* Responses Section */}
      <DocumentationSectionResponse endpoint={endpoint} spec={spec} />

      {/* Additional Information */}
      {(endpoint.externalDocs || endpoint.servers) && (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            {endpoint.externalDocs && (
              <div>
                <h4 className="font-medium mb-2">External Documentation</h4>
                <a
                  href={endpoint.externalDocs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {endpoint.externalDocs.description ||
                    endpoint.externalDocs.url}
                </a>
              </div>
            )}
            {endpoint.servers && endpoint.servers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Servers</h4>
                <div className="space-y-2">
                  {endpoint.servers.map((server, index) => (
                    <div key={index}>
                      <p className="font-mono text-sm">{server.url}</p>
                      {server.description && (
                        <p className="text-sm text-muted-foreground">
                          {server.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
