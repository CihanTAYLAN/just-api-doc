import { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject;

export function generateExampleFromSchema(schema: any): any {
  if (!schema) return undefined;

  // If schema has an example, use it
  if (schema.example !== undefined) {
    return schema.example;
  }

  // If schema has type property
  if (schema.type) {
    switch (schema.type) {
      case 'object':
        if (schema.properties) {
          const example: Record<string, any> = {};
          Object.entries(schema.properties).forEach(([key, prop]) => {
            example[key] = generateExampleFromSchema(prop);
          });
          return example;
        }
        return {};

      case 'array':
        if (schema.items) {
          return [generateExampleFromSchema(schema.items)];
        }
        return [];

      case 'string':
        if (schema.enum) return schema.enum[0];
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uri') return 'https://example.com';
        if (schema.format === 'password') return '********';
        return 'string';

      case 'number':
      case 'integer':
        if (schema.enum) return schema.enum[0];
        if (schema.minimum !== undefined) return schema.minimum;
        if (schema.maximum !== undefined) return schema.maximum;
        return 0;

      case 'boolean':
        return false;

      default:
        return null;
    }
  }

  // If schema is a reference ($ref)
  if (schema.$ref) {
    // Note: Ideally, we should resolve the reference here
    return { $ref: schema.$ref };
  }

  // If schema is an enum without a type
  if (schema.enum) {
    return schema.enum[0];
  }

  // If schema has properties but no type (assume object)
  if (schema.properties) {
    const example: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      example[key] = generateExampleFromSchema(prop);
    });
    return example;
  }

  // If all else fails
  return null;
}
