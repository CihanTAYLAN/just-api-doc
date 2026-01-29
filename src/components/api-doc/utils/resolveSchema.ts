import { OpenAPIV3 } from "openapi-types";

export type SchemaObject = OpenAPIV3.SchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type ApiSpec = OpenAPIV3.Document;

export function resolveSchemaRef(
	ref: string,
	spec: ApiSpec
): SchemaObject | null {
	// Remove the '#/' prefix and split the path
	const path = ref.replace("#/", "").split("/");

	// Traverse the spec object using the path
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let schema: any = spec;
	for (const segment of path) {
		schema = schema?.[segment];
		if (!schema) {
			return null;
		}
	}

	// If the resolved schema also has a $ref, resolve it recursively
	if (isReferenceObject(schema)) {
		return resolveSchemaRef(schema.$ref, spec);
	}

	return schema as SchemaObject;
}

export function resolveSchema(
	schema: SchemaObject | ReferenceObject | undefined,
	spec: ApiSpec
): SchemaObject | null {
	if (!schema) return null;

	// If schema is a reference, resolve it
	if (isReferenceObject(schema)) {
		const resolved = resolveSchemaRef(schema.$ref, spec);
		return resolved ? resolveSchema(resolved, spec) : null;
	}

	// Handle array type
	if (schema.type === "array" && schema.items) {
		return {
			...schema,
			items: resolveSchema(schema.items, spec) || schema.items,
		};
	}

	// Handle object type
	if (schema.type === "object" && schema.properties) {
		const resolvedProperties: Record<string, SchemaObject> = {};
		Object.entries(schema.properties).forEach(([key, prop]) => {
			const resolved = resolveSchema(prop, spec);
			if (resolved) {
				resolvedProperties[key] = resolved;
			}
		});
		return {
			...schema,
			properties: resolvedProperties,
		};
	}

	// Handle allOf, oneOf, anyOf
	if (schema.allOf) {
		const resolved = schema.allOf.map((s) => resolveSchema(s, spec));
		// Merge all schemas
		return resolved.reduce<SchemaObject>(
			(acc, curr) => ({
				...acc,
				...curr,
				properties: { ...(acc?.properties || {}), ...(curr?.properties || {}) },
			}),
			{}
		);
	}

	if (schema.oneOf && schema.oneOf.length > 0) {
		// For oneOf, we'll just use the first schema as an example
		return resolveSchema(schema.oneOf[0], spec);
	}

	if (schema.anyOf && schema.anyOf.length > 0) {
		// For anyOf, we'll just use the first schema as an example
		return resolveSchema(schema.anyOf[0], spec);
	}

	return schema;
}

export const formatSchemaType = (schema: SchemaObject | null | undefined): string => {
	if (!schema) return "unknown";

	if (schema.type === "array" && schema.items) {
		const itemType = formatSchemaType(
			isReferenceObject(schema.items)
				? null
				: (schema.items as SchemaObject)
		);
		return `array<${itemType}>`;
	}

	if (schema.type === "object" && schema.additionalProperties) {
		const valueType = formatSchemaType(
			isReferenceObject(schema.additionalProperties)
				? null
				: (schema.additionalProperties as SchemaObject)
		);
		return `Record<string, ${valueType}>`;
	}

	let type = schema.type || "any";
	if (schema.enum) {
		type = `enum[${schema.enum.join(" | ")}]`;
	}
	if (schema.format) {
		type += ` (${schema.format})`;
	}
	if (schema.nullable) {
		type += " | null";
	}

	return type;
};

function isReferenceObject(
	obj: SchemaObject | ReferenceObject | unknown
): obj is ReferenceObject {
	return typeof obj === "object" && obj !== null && "$ref" in obj;
}
