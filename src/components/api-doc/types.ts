import { ApiDoc } from "@prisma/client";

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export interface ApiDocViewerProps {
  apiDoc: ApiDoc & {
    user: {
      name: string | null;
      email: string;
    };
  };
}

export interface Reference {
  $ref: string;
}

export interface Schema {
  $schema?: string;
  $vocabulary?: { [uri: string]: boolean };
  $id?: string;
  $anchor?: string;
  $dynamicAnchor?: string;
  $ref?: string;
  $dynamicRef?: string;
  $defs?: { [key: string]: Schema };
  $comment?: string;
  
  type?: string | string[];
  format?: string;
  
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  contentEncoding?: string;
  contentMediaType?: string;
  contentSchema?: Schema;
  
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;
  
  minProperties?: number;
  maxProperties?: number;
  required?: string[];
  dependentRequired?: { [key: string]: string[] };
  
  enum?: any[];
  const?: any;
  default?: any;
  
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
  if?: Schema;
  then?: Schema;
  else?: Schema;
  
  properties?: { [key: string]: Schema };
  patternProperties?: { [key: string]: Schema };
  additionalProperties?: boolean | Schema;
  propertyNames?: Schema;
  unevaluatedProperties?: boolean | Schema;
  
  items?: Schema | Schema[];
  prefixItems?: Schema[];
  contains?: Schema;
  unevaluatedItems?: boolean | Schema;
  
  discriminator?: {
    propertyName: string;
    mapping?: { [key: string]: string };
  };
  xml?: {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  };
  externalDocs?: {
    description?: string;
    url: string;
  };
  example?: any;
  examples?: any[];
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: 'form' | 'simple' | 'label' | 'matrix' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: { [key: string]: Example | Reference };
  content?: { [key: string]: MediaType };
}

export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface MediaType {
  schema?: Schema | Reference;
  example?: any;
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
  parameters?: { [key: string]: any };
  requestBody?: any;
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
    [path: string]: {
      summary?: string;
      description?: string;
      servers?: Server[];
      parameters?: (Parameter | Reference)[];
      [method in HttpMethod]?: ApiEndpoint;
    };
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
