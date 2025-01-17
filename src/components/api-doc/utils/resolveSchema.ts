export function resolveSchemaRef(ref: string, spec: any): any {
  // Remove the '#/' prefix and split the path
  const path = ref.replace('#/', '').split('/');
  
  // Traverse the spec object using the path
  let schema = spec;
  for (const segment of path) {
    schema = schema?.[segment];
    if (!schema) {
      console.warn(`Could not resolve schema reference: ${ref}`);
      return null;
    }
  }
  
  // If the resolved schema also has a $ref, resolve it recursively
  if (schema.$ref) {
    return resolveSchemaRef(schema.$ref, spec);
  }
  
  return schema;
}

export function resolveSchema(schema: any, spec: any): any {
  if (!schema) return null;

  // If schema is a reference, resolve it
  if (schema.$ref) {
    return resolveSchema(resolveSchemaRef(schema.$ref, spec), spec);
  }

  // Handle array type
  if (schema.type === 'array' && schema.items) {
    return {
      ...schema,
      items: resolveSchema(schema.items, spec)
    };
  }

  // Handle object type
  if (schema.type === 'object' && schema.properties) {
    const resolvedProperties: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      resolvedProperties[key] = resolveSchema(prop, spec);
    });
    return {
      ...schema,
      properties: resolvedProperties
    };
  }

  // Handle allOf, oneOf, anyOf
  if (schema.allOf) {
    const resolved = schema.allOf.map((s: any) => resolveSchema(s, spec));
    // Merge all schemas
    return resolved.reduce((acc: any, curr: any) => ({
      ...acc,
      ...curr,
      properties: { ...(acc.properties || {}), ...(curr.properties || {}) }
    }), {});
  }

  if (schema.oneOf) {
    // For oneOf, we'll just use the first schema as an example
    return resolveSchema(schema.oneOf[0], spec);
  }

  if (schema.anyOf) {
    // For anyOf, we'll just use the first schema as an example
    return resolveSchema(schema.anyOf[0], spec);
  }

  return schema;
}
