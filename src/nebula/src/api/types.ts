export interface TemplateSummary {
  name: string
  description?: string | null
  version?: string | null
}

export interface TemplatesResponse {
  templates: TemplateSummary[]
}

export interface TemplateVariable {
  prompt?: string | null
  default?: string | null
  required: boolean
}

export interface TemplateMetaResponse {
  template: {
    name: string
    description: string
    version: string
  }
  variables: Record<string, TemplateVariable>
}

export type OverwriteMode = 'fail' | 'overwrite' | 'skip'

export interface CreateProjectRequest {
  templateName: string
  outputBase: string
  variables: Record<string, string>
  overwrite: OverwriteMode
  dryRun: boolean
}

export interface CreateProjectResponse {
  createdDirs: string[]
  createdFiles: string[]
  skippedFiles: string[]
  dryRun: boolean
}
