import { apiClient } from './client'
import type { CreateProjectRequest, CreateProjectResponse } from './types'

export async function createProject(request: CreateProjectRequest) {
  const response = await apiClient.post<CreateProjectResponse>('/api/projects', request)
  return response.data
}
