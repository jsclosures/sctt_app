'use client';

import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import {
  Box, Typography, TextField, Button, MenuItem, Select,
  IconButton, Tooltip, Snackbar, Alert, CircularProgress,
  Stack, Chip, FormControl, InputLabel
} from '@mui/material';
import {
  PlayArrowRounded, DeleteSweepRounded,
  ContentCopyRounded, FullscreenRounded, FullscreenExitRounded,
  ExpandMoreRounded, ExpandLessRounded, DeleteRounded,
  CheckCircleRounded, ErrorRounded, InfoRounded
} from '@mui/icons-material';
import { getTests, refreshScriptTabs } from '@/services/testService';
import {
  runScript, deleteAllTestData, parseArgsString, buildArgsString,
} from '@/services/runnerService';
import { useThemeConfig } from '../../context/themecontext';

export default function ScriptRunnerPage() {
  const { mode } = useThemeConfig();
  const terminalRef = useRef(null);
  const isDark = mode === 'dark';

  const [tests, setTests]                       = useState([]);
  const [loadingTests, setLoadingTests]         = useState(false);
  const [selectedTestName, setSelectedTestName] = useState('');
  const [selectedTest, setSelectedTest]         = useState(null);
  const [runnerTypes, setRunnerTypes]           = useState([]);
  const [selectedType, setSelectedType]         = useState('');
  const [args, setArgs]                         = useState({});
  const [argsOpen, setArgsOpen]                 = useState(true);
  const [output, setOutput]                     = useState([]);
  const [running, setRunning]                   = useState(false);
  const [fullscreen, setFullscreen]             = useState(false);
  const [snackbar, setSnackbar]                 = useState({ open: false, message: '', severity: 'info' });

  const termBg   = isDark ? '#0a0a0b' : '#f8f8f9';
  const termFg   = isDark ? '#d4d4d8' : '#3b3b3b';
  const termDim  = isDark ? '#52525b' : '#a1a1aa';
  const termLine = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const lineColor = (t) => {
    if (t === 'error')   return '#ef4444';
    if (t === 'success') return '#22c55e';
    if (t === 'system')  return '#818cf8';
    return termFg;
  };

  const lineIcon = (t) => {
    if (t === 'error')   return <ErrorRounded sx={{ fontSize: 11, color: '#ef4444', flexShrink: 0, mt: '3px' }} />;
    if (t === 'success') return <CheckCircleRounded sx={{ fontSize: 11, color: '#22c55e', flexShrink: 0, mt: '3px' }} />;
    if (t === 'system')  return <InfoRounded sx={{ fontSize: 11, color: '#818cf8', flexShrink: 0, mt: '3px' }} />;
    return null;
  };

  useEffect(() => {
    async function init() {
      const tabs = await refreshScriptTabs();
      const types = tabs.filter(t => t.id !== 'notes').map(t => ({ type: t.field, label: t.label, argsField: t.argsField }));
      setRunnerTypes(types);
      if (types.length > 0) setSelectedType(types[0].type);
    }
    init();
  }, []);

  const showMessage = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });

  const addOutput = (text, type = 'log') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

    const sendArgs = { ...args };
    if (sendArgs.csvData && sendArgs.csvData.trim()) {
      sendArgs.csvData = sendArgs.csvData
        .split('\n').map(q => q.trim()).filter(Boolean)
        .map(q => q.replace(/ /g, '+')).join('\n');
    }

    const inputStr = buildArgsString(sendArgs);
    const label = runnerTypes.find(r => r.type === selectedType)?.label || selectedType;
    setRunning(true);
    addOutput(`▶ ${label} · ${selectedTestName}`, 'system');
    try {
      const result = await runScript(selectedTestName, selectedType, inputStr);
      if (result.error) {
        addOutput(result.error, 'error');
      } else {
        addOutput(result.message || 'OK', 'success');
        if (result.items?.length) {
          addOutput(`${result.items.length} item${result.items.length !== 1 ? 's' : ''} returned`, 'log');
          result.items.forEach((item, i) => addOutput(`  [${i}] ${JSON.stringify(item)}`, 'log'));
        }
      }
    } catch (err) {
      addOutput(err.message, 'error');
    } finally {
      setRunning(false);
      addOutput('─'.repeat(40), 'dim');
    }
  };

  const handleDeleteAllData = async () => {
    if (!selectedTestName) return;
    try {
      await deleteAllTestData(selectedTestName);
      addOutput(`Cleared result data for "${selectedTestName}"`, 'system');
      showMessage('Data cleared', 'success');
    } catch { showMessage('Failed to clear data', 'error'); }
  };

  const argKeys = Object.keys(args);

  // ─── Fullscreen ───────────────────────────────────────────────
  if (fullscreen) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: termBg }}>
        <Box sx={{
          px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace', color: termDim }}>
              OUTPUT
            </Typography>
            {running && <CircularProgress size={12} sx={{ color: '#818cf8' }} />}
            <Chip size="small" label={`${output.length} lines`}
              sx={{ height: 18, fontSize: '0.6rem', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: termDim }} />
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(output.map(l => `[${l.time}] ${l.text}`).join('\n'))}>
              <ContentCopyRounded sx={{ fontSize: 15, color: termDim }} />
            </IconButton>
            <IconButton size="small" onClick={() => setOutput([])}>
              <DeleteSweepRounded sx={{ fontSize: 15, color: termDim }} />
            </IconButton>
            <IconButton size="small" onClick={() => setFullscreen(false)}>
              <FullscreenExitRounded sx={{ fontSize: 16, color: termDim }} />
            </IconButton>
          </Stack>
        </Box>
        <TerminalContent
          ref={terminalRef} output={output}
          termBg={termBg} termDim={termDim} termFg={termFg}
          termLine={termLine} lineColor={lineColor} lineIcon={lineIcon}
          selectedTestName={selectedTestName}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
     <Box sx={{
        px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, minHeight: 52,
      }}>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Script Runner
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Clear result data for selected test">
            <span>
              <Button size="small" variant="outlined" color="error"
                startIcon={<DeleteRounded sx={{ fontSize: 13 }} />}
                onClick={handleDeleteAllData} disabled={!selectedTestName}
                sx={{ textTransform: 'none', fontSize: '0.72rem', height: 30 }}>
                Clear Data
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={running || !selectedTestName}
            startIcon={running ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <PlayArrowRounded sx={{ fontSize: 17 }} />}
            sx={{
              height: 30, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600, px: 2,
              bgcolor: running ? undefined : '#ff6b2b',
              '&:hover': { bgcolor: running ? undefined : '#e85d1f' },
            }}
          >
            {running ? 'Running...' : 'Run'}
          </Button>
        </Stack>
      </Box>

      {/* ── Body ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: controls ───────────────────────────────────── */}
        <Box sx={{
          width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>

          {/* Selectors + Run button */}
          <Box sx={{
            p: 1.5, borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: '0.78rem' }}>Test</InputLabel>
              <Select value={selectedTestName} label="Test"
                onChange={e => handleTestChange(e.target.value)}
                sx={{ fontSize: '0.8rem' }}>
                {loadingTests && <MenuItem disabled sx={{ fontSize: '0.78rem' }}>Loading...</MenuItem>}
                {tests.map(t => (
                  <MenuItem key={t.id} value={t.name} sx={{ fontSize: '0.8rem' }}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: '0.78rem' }}>Script Type</InputLabel>
              <Select value={selectedType} label="Script Type"
                onChange={e => handleTypeChange(e.target.value)}
                sx={{ fontSize: '0.8rem' }}>
                {runnerTypes.map(r => (
                  <MenuItem key={r.type} value={r.type} sx={{ fontSize: '0.8rem' }}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Args section */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {argKeys.length > 0 && (
              <>
                <Box
                  onClick={() => setArgsOpen(p => !p)}
                  sx={{
                    px: 1.5, py: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', cursor: 'pointer',
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled' }}>
                      Arguments
                    </Typography>
                    <Chip size="small" label={argKeys.length}
                      sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, borderRadius: '4px' }} />
                  </Stack>
                  {argsOpen
                    ? <ExpandLessRounded sx={{ fontSize: 16, color: 'text.disabled' }} />
                    : <ExpandMoreRounded sx={{ fontSize: 16, color: 'text.disabled' }} />}
                </Box>

                {argsOpen && (
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {argKeys.map(key => (
                      <Box key={key}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.disabled', mb: 0.4, fontFamily: 'monospace' }}>
                          {key}
                        </Typography>
                        <TextField
                          size="small" fullWidth
                          value={args[key] || ''}
                          onChange={e => setArgs(p => ({ ...p, [key]: e.target.value }))}
                          multiline={key === 'csvData'}
                          minRows={key === 'csvData' ? 4 : 1}
                          placeholder={key === 'csvData' ? 'One query per line' : ''}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.78rem', fontFamily: 'monospace',
                              ...(key === 'csvData' ? {} : { height: 30 }),
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* ── RIGHT: terminal ──────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: termBg }}>

          {/* Terminal header */}
          <Box sx={{
            px: 2, py: 0.875, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'divider',
            flexShrink: 0,
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: termDim, fontFamily: 'monospace' }}>
                Output
              </Typography>
              {running && <CircularProgress size={11} sx={{ color: '#818cf8' }} />}
              {output.length > 0 && (
                <Chip size="small" label={`${output.length} lines`}
                  sx={{ height: 16, fontSize: '0.58rem', fontWeight: 600, borderRadius: '4px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: termDim }} />
              )}
              {selectedTestName && selectedType && (
                <Chip size="small"
                  label={`${selectedTestName} · ${runnerTypes.find(r => r.type === selectedType)?.label || ''}`}
                  sx={{ height: 16, fontSize: '0.58rem', borderRadius: '4px', bgcolor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(129,140,248,0.1)', color: '#818cf8' }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={0.25}>
              <Tooltip title="Copy output">
                <IconButton size="small" onClick={() => {
                  navigator.clipboard.writeText(output.map(l => `[${l.time}] ${l.text}`).join('\n'));
                  showMessage('Copied', 'info');
                }}>
                  <ContentCopyRounded sx={{ fontSize: 14, color: termDim }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear output">
                <IconButton size="small" onClick={() => setOutput([])}>
                  <DeleteSweepRounded sx={{ fontSize: 14, color: termDim }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={() => setFullscreen(true)}>
                  <FullscreenRounded sx={{ fontSize: 15, color: termDim }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <TerminalContent
            ref={terminalRef} output={output}
            termBg={termBg} termDim={termDim} termFg={termFg}
            termLine={termLine} lineColor={lineColor} lineIcon={lineIcon}
            selectedTestName={selectedTestName}
          />
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Terminal content ─────────────────────────────────────────────

const TerminalContent = forwardRef(function TerminalContent(
  { output, termBg, termDim, termFg, termLine, lineColor, lineIcon, selectedTestName },
  ref
) {
  return (
    <Box ref={ref} sx={{
      flex: 1, overflow: 'auto', p: 2, bgcolor: termBg,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: '0.76rem', lineHeight: 1.75,
    }}>
      {output.length === 0 ? (
        <Typography sx={{ color: termDim, fontFamily: 'monospace', fontSize: '0.76rem', opacity: 0.5 }}>
          {selectedTestName ? '> Ready. Hit Run to execute.' : '> Select a test and script type, then hit Run.'}
        </Typography>
      ) : (
        output.map(line => (
          <Box key={line.id} sx={{
            display: 'flex', gap: 1.5, alignItems: 'flex-start',
            px: 0.5, py: 0.25, borderRadius: 0.5,
            '&:hover': { bgcolor: termLine },
            ...(line.type === 'dim' ? { opacity: 0.3 } : {}),
          }}>
            <Typography component="span" sx={{
              color: termDim, fontSize: '0.65rem', fontFamily: 'monospace',
              flexShrink: 0, mt: '3px', letterSpacing: '0.02em', userSelect: 'none',
            }}>
              {line.time}
            </Typography>
            {lineIcon(line.type)}
            <Typography component="span" sx={{
              color: lineColor(line.type), fontSize: '0.76rem',
              fontFamily: 'monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap', flex: 1,
            }}>
              {line.text}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
});