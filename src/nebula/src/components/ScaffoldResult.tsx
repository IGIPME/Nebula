import { Divider, List, ListItem, Stack, Typography } from '@mui/material'
import type { CreateProjectResponse } from '../api/types'

interface ScaffoldResultProps {
  result: CreateProjectResponse
}

export function ScaffoldResult({ result }: ScaffoldResultProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">
        {result.dryRun ? 'Dry-run 结果' : '项目创建结果'}
      </Typography>
      <PathList paths={result.createdDirs} title="将创建/已创建目录" />
      <Divider />
      <PathList paths={result.createdFiles} title="将创建/已创建文件" />
      {result.skippedFiles.length > 0 ? (
        <>
          <Divider />
          <PathList paths={result.skippedFiles} title="已跳过文件" />
        </>
      ) : null}
    </Stack>
  )
}

interface PathListProps {
  title: string
  paths: string[]
}

function PathList({ title, paths }: PathListProps) {
  return (
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="subtitle2">
        {title}（{paths.length}）
      </Typography>
      {paths.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          无
        </Typography>
      ) : (
        <List dense disablePadding>
          {paths.map((path) => (
            <ListItem disableGutters key={path}>
              <Typography
                component="code"
                sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}
                variant="body2"
              >
                {path}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  )
}
