import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import './styles/App.css'
import { getApiErrorMessage } from './api/client'
import { createProject } from './api/projects'
import { getTemplate, listTemplates } from './api/templates'
import type { CreateProjectRequest, CreateProjectResponse, TemplateMetaResponse, TemplateSummary } from './api/types'
import { ProjectCreateForm } from './components/ProjectCreateForm'
import { ScaffoldResult } from './components/ScaffoldResult'
import { TemplateSelector } from './components/TemplateSelector'

function App() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateMeta, setTemplateMeta] = useState<TemplateMetaResponse | null>(null)
  const [result, setResult] = useState<CreateProjectResponse | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      setLoadingTemplates(true)
      setError(null)

      try {
        const loadedTemplates = await listTemplates()
        if (cancelled) {
          return
        }

        setTemplates(loadedTemplates)
        setSelectedTemplate((current) => current || loadedTemplates[0]?.name || '')
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError))
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplates(false)
        }
      }
    }

    void loadTemplates()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedTemplate) {
      return
    }

    let cancelled = false

    async function loadTemplateMeta() {
      setLoadingMeta(true)
      setError(null)
      setResult(null)

      try {
        const loadedMeta = await getTemplate(selectedTemplate)
        if (!cancelled) {
          setTemplateMeta(loadedMeta)
        }
      } catch (loadError) {
        if (!cancelled) {
          setTemplateMeta(null)
          setError(getApiErrorMessage(loadError))
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false)
        }
      }
    }

    void loadTemplateMeta()

    return () => {
      cancelled = true
    }
  }, [selectedTemplate])

  async function handleCreateProject(request: CreateProjectRequest) {
    try {
      return await createProject(request)
    } catch (createError) {
      throw new Error(getApiErrorMessage(createError), { cause: createError })
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Stack spacing={1} sx={{ textAlign: 'left' }}>
          <Typography component="h1" variant="h3">
            Nebula 项目脚手架
          </Typography>
          <Typography color="text.secondary">
            选择模板、填写变量，并通过本地 Axum 后端创建 Nebula 项目。
          </Typography>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            {loadingTemplates ? (
              <Stack spacing={2} sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress />
                <Typography color="text.secondary">正在连接 Nebula 后端...</Typography>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <TemplateSelector
                  disabled={loadingMeta}
                  templates={templates}
                  value={selectedTemplate}
                  onChange={setSelectedTemplate}
                />
                {loadingMeta ? (
                  <Stack spacing={2} sx={{ alignItems: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                    <Typography color="text.secondary">正在读取模板变量...</Typography>
                  </Stack>
                ) : (
                  <ProjectCreateForm
                    loading={loadingMeta}
                    templateMeta={templateMeta}
                    templateName={selectedTemplate}
                    onCreated={setResult}
                    onSubmit={handleCreateProject}
                  />
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        {result ? (
          <Card>
            <CardContent>
              <ScaffoldResult result={result} />
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  )
}

export default App
