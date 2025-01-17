import { ApiDoc } from "@prisma/client";

export interface ApiDocViewerProps {
  apiDoc: ApiDoc & {
    user: {
      name: string | null
      email: string
    }
  }
}

export interface ApiEndpoint {
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

export interface ApiSpec {
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

export interface EndpointGroup {
  name: string
  endpoints: {
    path: string
    method: string
    endpoint: ApiEndpoint
  }[]
}
