import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import type { SxProps } from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as OpenIcon,
  Science as SimIcon,
  Settings as SettingsIcon,
  MenuBook as DocsIcon,
  GitHub as GitHubIcon,
  Language as WebIcon,
  RocketLaunch as RocketIcon,
  Memory as CpuIcon,
  CloudQueue as CloudIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ModuleCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
  delay: number;
}

const modules: ModuleCard[] = [
  {
    id: 'new-project',
    title: '新建项目',
    subtitle: '从模板创建光子器件设计项目',
    icon: <AddIcon sx={{ fontSize: 40 }} />,
    gradient: 'linear-gradient(135deg, #7C4DFF 0%, #B388FF 100%)',
    badge: 'v0.1',
    delay: 0,
  },
  {
    id: 'open-project',
    title: '打开项目',
    subtitle: '浏览并继续编辑现有设计项目',
    icon: <OpenIcon sx={{ fontSize: 40 }} />,
    gradient: 'linear-gradient(135deg, #00E5FF 0%, #6EFFFF 100%)',
    delay: 100,
  },
  {
    id: 'simulation',
    title: '仿真中心',
    subtitle: 'Meep FDTD · ANSYS Lumerical 仿真',
    icon: <SimIcon sx={{ fontSize: 40 }} />,
    gradient: 'linear-gradient(135deg, #FF6D00 0%, #FFAB40 100%)',
    badge: 'BETA',
    delay: 200,
  },
  {
    id: 'settings',
    title: '系统设置',
    subtitle: '配置环境、PDK 和仿真参数',
    icon: <SettingsIcon sx={{ fontSize: 40 }} />,
    gradient: 'linear-gradient(135deg, #546E7A 0%, #90A4AE 100%)',
    delay: 300,
  },
  {
    id: 'docs',
    title: '文档',
    subtitle: '阅读用户手册与开发指南',
    icon: <DocsIcon sx={{ fontSize: 40 }} />,
    gradient: 'linear-gradient(135deg, #00C853 0%, #69F0AE 100%)',
    delay: 400,
  },
];

const recentProjects = [
  { name: 'ridge_waveguide', type: 'pic-design', updated: '2 小时前' },
  { name: 'mmi_coupler', type: 'pic-design', updated: '昨天' },
  { name: 'ring_resonator', type: 'pic-design', updated: '3 天前' },
];

const floatKeyframes: SxProps = {
  animation: 'float 3s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-6px)' },
  },
};

const slideUpKeyframes: SxProps = {
  '@keyframes slideUp': {
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export function LauncherHub() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'auto',
        background: 'linear-gradient(160deg, #0D0D1A 0%, #151530 50%, #1A1040 100%)',
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 4,
          py: 2,
          borderBottom: '1px solid rgba(124,77,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(124,77,255,0.3)',
            }}
          >
            <RocketIcon sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
            NEBULA
          </Typography>
          <Chip label="v0.1.0-alpha" size="small" sx={{ bgcolor: 'rgba(124,77,255,0.15)', color: '#B388FF', fontSize: 11 }} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="GitHub">
            <IconButton
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={() => window.open('https://github.com/IGIPME/Nebula', '_blank')}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="官网">
            <IconButton
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={() => window.open('http://nebula.istaroth.xin/', '_blank')}
            >
              <WebIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: 5 }}>
        {/* Hero */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
            mt: 2,
            animation: 'slideUp 0.6s ease-out',
            ...slideUpKeyframes,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              boxShadow: '0 0 40px rgba(124,77,255,0.3)',
              ...floatKeyframes,
            }}
          >
            <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>N</Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #B388FF 0%, #00E5FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            微纳米光子器件 EDA 平台
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            React + Rust 驱动，支持 Meep FDTD 与 ANSYS Lumerical 仿真
          </Typography>
        </Box>

        {/* Module cards grid */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {modules.map((mod, idx) => {
            const size = idx < 3 ? 4 : 3;
            const isSm = idx < 2 ? 6 : 6;
            return (
              <Grid key={mod.id} size={{ xs: 12, sm: isSm, md: size } as Record<string, number>}>
                <Card
                  sx={{
                    height: '100%',
                    animation: 'slideUp 0.6s ease-out forwards',
                    animationDelay: `${mod.delay}ms`,
                    opacity: 0,
                    ...slideUpKeyframes,
                  }}
                >
                  <CardActionArea
                    onClick={() => {
                      if (mod.id === 'new-project') navigate('/project');
                      if (mod.id === 'open-project') navigate('/projects');
                      if (mod.id === 'simulation') navigate('/sim');
                      if (mod.id === 'settings') navigate('/settings');
                      if (mod.id === 'docs') window.open('http://docs.nebula.istaroth.xin/', '_blank');
                    }}
                    sx={{ height: '100%', p: 0 }}
                  >
                    <CardContent sx={{ p: 3, position: 'relative' }}>
                      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            background: mod.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            boxShadow: `0 4px 16px ${
                              mod.id === 'new-project' ? 'rgba(124,77,255,0.3)' :
                              mod.id === 'open-project' ? 'rgba(0,229,255,0.3)' :
                              mod.id === 'simulation' ? 'rgba(255,109,0,0.3)' :
                              'rgba(84,110,122,0.3)'
                            }`,
                          }}
                        >
                          {mod.icon}
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {mod.title}
                            </Typography>
                            {mod.badge && (
                              <Chip
                                label={mod.badge}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: 10,
                                  bgcolor: mod.badge === 'BETA' ? 'rgba(255,109,0,0.2)' : 'rgba(124,77,255,0.2)',
                                  color: mod.badge === 'BETA' ? '#FFAB40' : '#B388FF',
                                }}
                              />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {mod.subtitle}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Recent projects */}
        <Box sx={{ animation: 'slideUp 0.6s ease-out 500ms forwards', opacity: 0, ...slideUpKeyframes }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            最近项目
          </Typography>
          <Grid container spacing={2}>
            {recentProjects.map((proj) => (
              <Grid key={proj.name} size={{ xs: 12, sm: 6, md: 4 } as Record<string, number>}>
                <Card>
                  <CardActionArea>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,229,255,0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CpuIcon sx={{ color: '#B388FF' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {proj.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {proj.type} · {proj.updated}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Bottom info bar */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CloudIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
              <Typography variant="caption" color="text.secondary">
                服务器已连接
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CpuIcon sx={{ fontSize: 14, color: '#00E5FF' }} />
              <Typography variant="caption" color="text.secondary">
                Rust 后端 v0.1.0
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.disabled">
            © 2026 IGIPME · GPL v3
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
