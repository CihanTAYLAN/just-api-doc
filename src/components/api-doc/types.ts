import { ApiDoc } from "@prisma/client";
import { OpenAPIV3 } from 'openapi-types';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export interface ApiDocViewerProps {
  apiDoc: ApiDoc & {
    user: {
      name: string | null;
      email: string;
    };
  };
}

export type Reference = OpenAPIV3.ReferenceObject;

export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

export type Schema = OpenAPIV3.SchemaObject;

export type Parameter = OpenAPIV3.ParameterObject;

export interface Example {
  summary?: string;
  description?: string;
  value?: string | number | boolean | object | null;
  externalValue?: string;
}

export interface MediaType {
  schema?: Schema | Reference;
  example?: string | number | boolean | object | null;
  examples?: { [key: string]: Example | Reference };
  encoding?: { [key: string]: Encoding };
}

export interface Encoding {
  contentType?: string;
  headers?: { [key: string]: Header | Reference };
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface RequestBody {
  description?: string;
  content: { [key: string]: MediaType };
  required?: boolean;
}

export interface Response {
  description: string;
  headers?: { [key: string]: Header | Reference };
  content?: { [key: string]: MediaType };
  links?: { [key: string]: Link | Reference };
}

export interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: Schema | Reference;
}

export interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: { [key: string]: string | number | boolean | object };
  requestBody?: string | number | boolean | object;
  description?: string;
  server?: Server;
}

export interface Server {
  url: string;
  description?: string;
  variables?: { [key: string]: ServerVariable };
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [key: string]: string };
}

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  summary?: string;
  description?: string;
  tags?: string[];
  externalDocs?: {
    description?: string;
    url: string;
  };
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: { [key: string]: Response | Reference };
  callbacks?: { [key: string]: { [key: string]: ApiEndpoint } | Reference };
  deprecated?: boolean;
  security?: { [key: string]: string[] }[];
  servers?: Server[];
  operationId?: string;
}

export type PathItem = {
  summary?: string;
  description?: string;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
} & {
  [K in HttpMethod]?: ApiEndpoint;
};

export interface ApiSpec {
  openapi: string;
  jsonSchemaDialect?: string;
  info: {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
      identifier?: string;
    };
    version: string;
  };
  servers?: Server[];
  paths: {
    [path: string]: PathItem;
  };
  webhooks?: {
    [key: string]: ApiEndpoint | Reference;
  };
  components?: {
    schemas?: { [key: string]: Schema | Reference };
    responses?: { [key: string]: Response | Reference };
    parameters?: { [key: string]: Parameter | Reference };
    examples?: { [key: string]: Example | Reference };
    requestBodies?: { [key: string]: RequestBody | Reference };
    headers?: { [key: string]: Header | Reference };
    securitySchemes?: { [key: string]: SecurityScheme | Reference };
    links?: { [key: string]: Link | Reference };
    callbacks?: { [key: string]: { [key: string]: ApiEndpoint } | Reference };
    pathItems?: { [key: string]: ApiEndpoint };
  };
  security?: { [key: string]: string[] }[];
  tags?: {
    name: string;
    description?: string;
    externalDocs?: {
      description?: string;
      url: string;
    };
  }[];
  externalDocs?: {
    description?: string;
    url: string;
  };
}

export interface EndpointGroup {
  name: string;
  endpoints: {
    path: string;
    method: HttpMethod;
    endpoint: ApiEndpoint;
  }[];
}
