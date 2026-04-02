'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Chip, TextField, Drawer, Divider, Stack, Button
} from '@mui/material';
import {
  TerminalRounded, CloseRounded, DeleteSweepRounded,
  CircleRounded, PauseRounded, PlayArrowRounded, VerticalAlignBottomRounded
} from '@mui/icons-material';
import { useThemeConfig } from '../context/themecontext';

const MAX_LINES = 500;

export default function LogPanel() {
  const { mode } = useThemeConfig();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lines, setLines] = useState([]);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8180');
  const [filter, setFilter] = useState('');
  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  const pausedRef = useRef(false);
  const linesRef = useRef([]);

  pausedRef.current = paused;

  const addLine = useCallback((text, type = 'log') => {
    const entry = { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type };
    linesRef.current = [...linesRef.current.slice(-(MAX_LINES - 1)), entry];
    if (!pausedRef.current) {
      setLines([...linesRef.current]);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const url = `${wsUrl}?key=*`;
      addLine(`Connecting to ${url}...`, 'system');
      const ws = new WebSocket(url, 'echo-protocol');

      ws.onopen = () => {
        setConnected(true);
        addLine('Connected', 'system');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data.message || data.text || JSON.stringify(data);
          addLine(text, data.level || 'log');
        } catch {
          addLine(event.data, 'log');
        }
      };

      ws.onclose = () => {
        setConnected(false);
        addLine('Disconnected', 'system');
      };

      ws.onerror = () => {
        addLine('Connection failed', 'error');
      };

      wsRef.current = ws;
    } catch (err) {
      addLine(`Failed: ${err.message}`, 'error');
    }
  }, [wsUrl, addLine]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !paused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, paused]);

  const handleResume = () => {
    setPaused(false);
    setLines([...linesRef.current]);
  };

  const clearLines = () => {
    linesRef.current = [];
    setLines([]);
  };

  const filteredLines = filter
    ? lines.filter(l => l.text.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  const isDark = mode === 'dark';
  const bg = isDark ? '#0a0a0b' : '#fafafa';
  const fg = isDark ? '#e4e4e7' : '#3b3b3b';
  const dimFg = isDark ? '#52525b' : '#a1a1aa';
  const border = isDark ? '#27272a' : '#e4e4e7';

  const typeColor = (type) => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'system': return '#6366f1';
      default: return fg;
    }
  };

  return (
    <>
      <Tooltip title="Live Logs">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            height: "3rem",
            width: "3rem",
            position: 'fixed', bottom: 20, right: 60, zIndex: 1200,
            bgcolor: connected ? 'rgba(34,197,94,0.1)' : 'background.paper',
            border: `1px solid ${border}`,
            '&:hover': { bgcolor: 'rgba(255,107,43,0.08)' },
          }}
        >
          <TerminalRounded sx={{ fontSize: 20, color: connected ? '#22c55e' : 'text.secondary' }} />
          {connected && (
            <CircleRounded sx={{ fontSize: 8, color: '#22c55e', position: 'absolute', top: 8, right: 8 }} />
          )}
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 520, bgcolor: bg, borderLeft: `1px solid ${border}` },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${border}` }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TerminalRounded sx={{ fontSize: 18, color: '#ff6b2b' }} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: fg }}>Live Logs</Typography>
              <Chip
                size="small"
                label={connected ? 'Connected' : 'Disconnected'}
                sx={{
                  height: 20, fontSize: '0.6rem', fontWeight: 600,
                  bgcolor: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: connected ? '#16a34a' : '#ef4444',
                }}
              />
            </Stack>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${border}` }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField
                size="small" fullWidth placeholder="ws://localhost:8180"
                value={wsUrl} onChange={e => setWsUrl(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem', fontFamily: 'monospace' } }}
              />
              {connected ? (
                <Button variant="outlined" color="error" size="small" onClick={disconnect} sx={{ flexShrink: 0, fontSize: '0.75rem' }}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="contained" size="small" onClick={connect} sx={{ flexShrink: 0, fontSize: '0.75rem' }}>
                  Connect
                </Button>
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small" fullWidth placeholder="Filter logs..."
                value={filter} onChange={e => setFilter(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              />
              <Tooltip title={paused ? 'Resume' : 'Pause'}>
                <IconButton size="small" onClick={() => paused ? handleResume() : setPaused(true)}>
                  {paused ? <PlayArrowRounded sx={{ fontSize: 18 }} /> : <PauseRounded sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Scroll to bottom">
                <IconButton size="small" onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}>
                  <VerticalAlignBottomRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear">
                <IconButton size="small" onClick={clearLines}>
                  <DeleteSweepRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box
            ref={scrollRef}
            sx={{
              flex: 1, overflow: 'auto', px: 2, py: 1,
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', lineHeight: 1.7,
            }}
          >
            {filteredLines.length === 0 && (
              <Typography sx={{ color: dimFg, fontSize: '0.75rem', fontFamily: 'monospace', py: 4, textAlign: 'center' }}>
                {connected ? 'Waiting for log output...' : 'Connect to start receiving logs'}
              </Typography>
            )}
            {filteredLines.map(line => (
              <Box key={line.id} sx={{ display: 'flex', gap: 1, py: 0.15, '&:hover': { bgcolor: `${border}40` } }}>
                <Typography component="span" sx={{ color: dimFg, fontSize: '0.7rem', fontFamily: 'monospace', flexShrink: 0, mt: '1px' }}>
                  {line.time}
                </Typography>
                <Typography component="span" sx={{ color: typeColor(line.type), fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {line.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.65rem', color: dimFg }}>
              {filteredLines.length} lines {filter && `(filtered from ${lines.length})`}
            </Typography>
            {paused && (
              <Chip size="small" label="Paused" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }} />
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}