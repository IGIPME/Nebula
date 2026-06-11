import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { type FormEvent, useMemo, useState } from 'react'
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  OverwriteMode,
  TemplateMetaResponse,
} from '../api/types'

interface ProjectCreateFormProps {
  templateName: string
  templateMeta: TemplateMetaResponse | null
  loading?: boolean
  onSubmit: (request: CreateProjectRequest) => Promise<CreateProjectResponse>
  onCreated: (response: CreateProjectResponse) => void
}

const defaultOutputBase = '/home/igipme/Nebula/projects'

export function ProjectCreateForm({
  templateName,
  templateMeta,
  loading = false,
  onSubmit,
  onCreated,
}: ProjectCreateFormProps) {
  const [outputBase, setOutputBase] = useState(defaultOutputBase)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [overwrite, setOverwrite] = useState<OverwriteMode>('fail')
  const [dryRun, setDryRun] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variableEntries = useMemo(
    () => Object.entries(templateMeta?.variables ?? {}).sort(([left], [right]) => left.localeCompare(right)),
    [templateMeta],
  )

  const variables = useMemo(
    () =>
      Object.fromEntries(
        variableEntries.map(([name, definition]) => [
          name,
          overrides[name] ?? definition.default ?? '',
        ]),
      ),
    [overrides, variableEntries],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await onSubmit({
        templateName,
        outputBase,
        variables,
        overwrite,
        dryRun,
      })
      onCreated(response)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '项目创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = loading || submitting || !templateMeta

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="h6">项目位置</Typography>
        <TextField
          fullWidth
          helperText="后端会以此目录作为模板输出父目录"
          label="输出目录"
          required
          value={outputBase}
          onChange={(event) => setOutputBase(event.target.value)}
        />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">模板变量</Typography>
        {variableEntries.length === 0 ? (
          <Alert severity="info">该模板没有声明变量。</Alert>
        ) : (
          variableEntries.map(([name, definition]) => (
            <TextField
              fullWidth
              helperText={name}
              key={name}
              label={definition.prompt ?? name}
              required={definition.required}
              value={variables[name] ?? ''}
              onChange={(event) =>
                setOverrides((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))
              }
            />
          ))
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">创建选项</Typography>
        <FormControl fullWidth>
          <InputLabel id="overwrite-select-label">冲突处理</InputLabel>
          <Select
            labelId="overwrite-select-label"
            label="冲突处理"
            value={overwrite}
            onChange={(event) => setOverwrite(event.target.value as OverwriteMode)}
          >
            <MenuItem value="fail">遇到已有文件时报错</MenuItem>
            <MenuItem value="skip">跳过已有文件</MenuItem>
            <MenuItem value="overwrite">覆盖已有文件</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />}
          label="Dry-run：只预览将创建的路径，不写入文件"
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Button disabled={disabled} size="large" type="submit" variant="contained">
        {submitting ? '提交中...' : dryRun ? '预览创建' : '创建项目'}
      </Button>
    </Stack>
  )
}
