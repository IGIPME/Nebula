import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { TemplateSummary } from '../api/types'

interface TemplateSelectorProps {
  templates: TemplateSummary[]
  value: string
  disabled?: boolean
  onChange: (templateName: string) => void
}

export function TemplateSelector({
  templates,
  value,
  disabled = false,
  onChange,
}: TemplateSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <FormControl fullWidth disabled={disabled || templates.length === 0}>
        <InputLabel id="template-select-label">模板</InputLabel>
        <Select
          labelId="template-select-label"
          label="模板"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {templates.map((template) => (
            <MenuItem key={template.name} value={template.name}>
              {template.name}
              {template.version ? ` · ${template.version}` : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {value ? (
        <Typography color="text.secondary" variant="body2">
          {templates.find((template) => template.name === value)?.description ?? '无模板描述'}
        </Typography>
      ) : null}
    </Stack>
  )
}
