import { Box, Typography, LinearProgress } from '@mui/material';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing engine...');

  useEffect(() => {
    const texts = [
      'Initializing engine...',
      'Loading simulation modules...',
      'Preparing design environment...',
      'Starting Nebula...',
    ];

    let idx = 0;
    const textInterval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 800);

    const start = Date.now();
    const duration = 2500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        clearInterval(textInterval);
        setTimeout(onComplete, 300);
      }
    }, 30);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0D0D1A 0%, #151530 40%, #1A1040 70%, #0D0D1A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              borderRadius: '50%',
              bgcolor: i % 2 === 0 ? '#7C4DFF' : '#00E5FF',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </Box>

      <Box sx={{ mb: 4, position: 'relative', animation: 'pulse-glow 2s ease-in-out infinite' }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(124,77,255,0.4)',
          }}
        >
          <Typography
            sx={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: -2, userSelect: 'none' }}
          >
            N
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="h2"
        sx={{
          fontWeight: 800,
          background: 'linear-gradient(135deg, #B388FF 0%, #00E5FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
          letterSpacing: '0.05em',
        }}
      >
        NEBULA
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, letterSpacing: '0.15em', fontSize: 14 }}>
        微纳米光子器件 EDA 平台
      </Typography>

      <Box sx={{ width: 320, mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 2,
            bgcolor: 'rgba(124,77,255,0.15)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              background: 'linear-gradient(90deg, #7C4DFF, #00E5FF, #7C4DFF)',
              backgroundSize: '200% 100%',
              animation: 'progress-glow 2s linear infinite',
            },
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {loadingText}
      </Typography>

      <Typography variant="caption" sx={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
        v0.1.0-alpha · Powered by Rust + React
      </Typography>
    </Box>
  );
}
