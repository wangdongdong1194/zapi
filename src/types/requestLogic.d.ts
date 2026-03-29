// src/types/requestLogic.d.ts

export interface RequestPayload {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  bodyText?: string
  bodyMode: 'json' | 'text' | 'xml' | 'form-data'
  bodyFormData?: Array<PairRow>
  params?: Array<PairRow>
  headers?: Array<PairRow>
  cookies?: Array<PairRow>
}

export interface PairRow {
  id: number
  key: string
  value: string
  valueType: 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object' | 'null'
  description: string
  enabled: boolean
}
