import { apiClient } from './client'
import type { TemplateMetaResponse, TemplatesResponse } from './types'

export async function listTemplates() {
  const response = await apiClient.get<TemplatesResponse>('/api/templates')
  return response.data.templates
}

export async function getTemplate(templateName: string) {
  const response = await apiClient.get<TemplateMetaResponse>(
    `/api/templates/${encodeURIComponent(templateName)}`,
  )
  return response.data
}
