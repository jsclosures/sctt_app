'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField, Button, MenuItem, Tooltip,
  IconButton, Snackbar, Alert, CircularProgress, Paper, Stack,
  Chip, Collapse
} from '@mui/material';
import {
  Fullscreen, FullscreenExit, PlayArrowRounded, DeleteSweepRounded,
  ContentCopyRounded, ExpandMoreRounded, ExpandLessRounded
} from '@mui/icons-material';
import { getTests, getScriptTabs } from '@/services/testService';
import {
  runScript, deleteAllTestData, parseArgsString, buildArgsString,
} from '@/services/runnerService';
import { useThemeConfig } from '../../context/themecontext';

export default function ScriptRunnerPage() {
  const { mode } = useThemeConfig();
  const terminalRef = useRef(null);

  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [selectedTestName, setSelectedTestName] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [runnerTypes, setRunnerTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [args, setArgs] = useState({});
  const [argsOpen, setArgsOpen] = useState(true);
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const tabs = getScriptTabs().filter(t => t.id !== 'notes');
    const types = tabs.map(t => ({ type: t.field, label: t.label, argsField: t.argsField }));
    setRunnerTypes(types);
    if (types.length > 0) setSelectedType(types[0].type);
  }, []);

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const addOutput = (text, type = 'log') => {
    const time = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, { id: Date.now() + Math.random(), time, text, type }]);
  };

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [output]);

  const fetchTests = useCallback(async () => {
    setLoadingTests(true);
    try {
      const { items } = await getTests(0, 100);
      setTests(items);
    } catch {
      showMessage('Failed to load tests', 'error');
    } finally {
      setLoadingTests(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleTestChange = (testname) => {
    setSelectedTestName(testname);
    const test = tests.find(t => t.name === testname);
    setSelectedTest(test || null);
    if (test) {
      const rt = runnerTypes.find(r => r.type === selectedType);
      setArgs(rt && test[rt.argsField] ? parseArgsString(test[rt.argsField]) : { testname });
      addOutput(`Loaded test: ${testname}`, 'system');
    }
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    if (selectedTest) {
      const rt = runnerTypes.find(r => r.type === type);
      setArgs(rt && selectedTest[rt.argsField] ? parseArgsString(selectedTest[rt.argsField]) : { testname: selectedTestName });
    }
  };

  const handleRun = async () => {
    if (!selectedTestName) { showMessage('Select a test first', 'error'); return; }
    const inputStr = buildArgsString(args);
    const label = runnerTypes.find(r => r.type === selectedType)?.label || selectedType;
    setRunning(true);
    addOutput(`Running "${label}" for "${selectedTestName}"...`, 'system');
    try {
      const result = await runScript(selectedTestName, selectedType, inputStr);
      if (result.error) {
        addOutput(`ERROR: ${result.error}`, 'error');
      } else {
        addOutput(`Status: ${result.message || 'OK'}`, 'success');
        if (result.items) {
          addOutput(`${result.items.length} items returned`, 'log');
          result.items.forEach((item, i) => addOutput(`  [${i}] ${JSON.stringify(item)}`, 'log'));
        }
        showMessage(`"${label}" executed`, 'success');
      }
    } catch (err) {
      addOutput(`FAILED: ${err.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output.map(l => `[${l.time}] ${l.text}`).join('\n'));
    showMessage('Copied to clipboard', 'info');
  };

  const handleDeleteAllData = async () => {
    if (!selectedTestName) return;
    try {
      await deleteAllTestData(selectedTestName);
      addOutput(`Deleted all data for "${selectedTestName}"`, 'system');
      showMessage(`Data deleted`, 'success');
    } catch { showMessage('Failed to delete', 'error'); }
  };

  const isDark = mode === 'dark';
  const termBg = isDark ? '#0c0c0d' : '#fafafa';
  const termFg = isDark ? '#d4d4d8' : '#3b3b3b';
  const termDim = isDark ? '#52525b' : '#a1a1aa';
  const termBorder = isDark ? '#27272a' : '#e4e4e7';
  const typeColor = (t) => {
    if (t === 'error') return '#ef4444';
    if (t === 'success') return '#22c55e';
    if (t === 'system') return '#6366f1';
    return termFg;
  };

  const argKeys = Object.keys(args);

  if (fullscreen) {
    return (
      <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Output</Typography>
            {running && <CircularProgress size={14} />}
            <Chip size="small" label={`${output.length} lines`} sx={{ height: 20, fontSize: '0.6rem' }} />
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={handleCopyOutput}><ContentCopyRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => setOutput([])}><DeleteSweepRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => setFullscreen(false)}><FullscreenExit sx={{ fontSize: 18 }} /></IconButton>
          </Stack>
        </Box>
        <Paper ref={terminalRef} sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: termBg, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem', lineHeight: 1.8 }}>
          {output.map(line => (
            <Box key={line.id} sx={{ display: 'flex', gap: 1 }}>
              <span style={{ color: termDim, fontSize: '0.7rem', flexShrink: 0 }}>{line.time}</span>
              <span style={{ color: typeColor(line.type), wordBreak: 'break-word' }}>{line.text}</span>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Script Runner</Typography>
      {/* Top toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select size="small" label="Test" value={selectedTestName}
            onChange={e => handleTestChange(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {loadingTests && <MenuItem disabled>Loading...</MenuItem>}
            {tests.map(t => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}
          </TextField>

          <TextField
            select size="small" label="Script Type" value={selectedType}
            onChange={e => handleTypeChange(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {runnerTypes.map(r => <MenuItem key={r.type} value={r.type}>{r.label}</MenuItem>)}
          </TextField>

          <Button
            variant="contained" onClick={handleRun}
            disabled={running || !selectedTestName}
            startIcon={running ? <CircularProgress size={16} /> : <PlayArrowRounded />}
            sx={{ px: 3, flexShrink: 0 }}
          >
            {running ? 'Running...' : 'Run'}
          </Button>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Delete all result data for this test">
            <span>
              <Button variant="outlined" color="error" size="small" onClick={handleDeleteAllData} disabled={!selectedTestName}>
                Delete Data
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Collapsible args section */}
      {argKeys.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Box
            onClick={() => setArgsOpen(p => !p)}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 2, py: 1, cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                Arguments
              </Typography>
              <Chip size="small" label={`${argKeys.length} fields`} sx={{ height: 18, fontSize: '0.6rem' }} />
            </Stack>
            {argsOpen ? <ExpandLessRounded sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreRounded sx={{ fontSize: 18, color: 'text.secondary' }} />}
          </Box>
          <Collapse in={argsOpen}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 1.5, px: 2, pb: 2,
            }}>
              {argKeys.map(key => (
                <TextField
                  key={key} size="small" label={key}
                  value={args[key] || ''}
                  onChange={e => setArgs(prev => ({ ...prev, [key]: e.target.value }))}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Terminal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Output
            </Typography>
            {running && <CircularProgress size={12} />}
            {output.length > 0 && (
              <Chip size="small" label={`${output.length} lines`} sx={{ height: 18, fontSize: '0.6rem' }} />
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Copy"><IconButton size="small" onClick={handleCopyOutput}><ContentCopyRounded sx={{ fontSize: 15 }} /></IconButton></Tooltip>
            <Tooltip title="Clear"><IconButton size="small" onClick={() => setOutput([])}><DeleteSweepRounded sx={{ fontSize: 15 }} /></IconButton></Tooltip>
            <Tooltip title="Fullscreen"><IconButton size="small" onClick={() => setFullscreen(true)}><Fullscreen sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          </Stack>
        </Box>

        <Paper
          ref={terminalRef}
          sx={{
            flex: 1, overflow: 'auto', p: 2, bgcolor: termBg,
            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem', lineHeight: 1.8,
          }}
        >
          {output.length === 0 && (
            <Typography sx={{ color: termDim, fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {selectedTestName ? '> Ready. Click Run to execute.' : '> Select a test and script type to begin.'}
            </Typography>
          )}
          {output.map(line => (
            <Box key={line.id} sx={{ display: 'flex', gap: 1, '&:hover': { bgcolor: `${termBorder}30` } }}>
              <Typography component="span" sx={{ color: termDim, fontSize: '0.68rem', fontFamily: 'monospace', flexShrink: 0, mt: '2px' }}>
                {line.time}
              </Typography>
              <Typography component="span" sx={{ color: typeColor(line.type), fontSize: '0.78rem', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {line.text}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}