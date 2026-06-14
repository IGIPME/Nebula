import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import theme from './theme';
import { SplashScreen } from './pages/SplashScreen';
import { LauncherHub } from './pages/LauncherHub';
import { NewProjectPage } from './pages/NewProjectPage';

const Placeholder = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div style={{
    height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #0D0D1A 0%, #151530 50%, #1A1040 100%)',
    color: '#E0E0E0',
  }}>
    <h2 style={{ fontWeight: 600, margin: 0 }}>{title}</h2>
    <p style={{ color: '#9E9E9E', marginTop: 8 }}>{subtitle}</p>
    <p style={{ color: '#546E7A', fontSize: 14 }}>即将推出</p>
  </div>
);

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LauncherHub />} />
            <Route path="/project" element={<NewProjectPage />} />
            <Route path="/projects" element={<Placeholder title="打开项目" subtitle="浏览现有设计项目" />} />
            <Route path="/sim" element={<Placeholder title="仿真中心" subtitle="Meep FDTD · ANSYS Lumerical" />} />
            <Route path="/settings" element={<Placeholder title="系统设置" subtitle="环境与仿真参数配置" />} />
            <Route path="/docs" element={<Placeholder title="文档" subtitle="用户手册与开发指南" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}

export default App;
