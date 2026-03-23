'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Tooltip,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { getTests } from '@/services/testService';
import {
  runScript,
  deleteAllTestData,
  parseArgsString,
  buildArgsString,
  RUNNER_TYPES,
} from '@/services/runnerService';
import { useThemeConfig } from '../../context/themecontext';

export default function ScriptRunnerPage() {
  const { mode } = useThemeConfig();

  // --- Test list ---
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);

  // --- Form state ---
  const [selectedTestName, setSelectedTestName] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedType, setSelectedType] = useState(RUNNER_TYPES[0].type);

  // --- Args fields (parsed from the _s field) ---
  const [args, setArgs] = useState({});

  // --- Output ---
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // --- Feedback ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const appendOutput = (line) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput((prev) => prev + `[${timestamp}] ${line}\n`);
  };

  // --- Load test list on mount ---
  const fetchTests = useCallback(async () => {
    setLoadingTests(true);
    try {
      const { items } = await getTests(0, 100);
      setTests(items);
    } catch (err) {
      console.error('Failed to load tests:', err);
      showMessage('Failed to load tests', 'error');
    } finally {
      setLoadingTests(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // --- When a test is selected, load its default args ---
  const handleTestChange = (testname) => {
    setSelectedTestName(testname);
    const test = tests.find((t) => t.name === testname);
    setSelectedTest(test || null);

    if (test) {
      const runnerType = RUNNER_TYPES.find((r) => r.type === selectedType);
      if (runnerType && test[runnerType.argsField]) {
        setArgs(parseArgsString(test[runnerType.argsField]));
      } else {
        setArgs({ testname: testname });
      }
      appendOutput(`Loaded test: ${testname}`);
    }
  };

  // --- When script type changes, update args from that type's _s field ---
  const handleTypeChange = (type) => {
    setSelectedType(type);

    if (selectedTest) {
      const runnerType = RUNNER_TYPES.find((r) => r.type === type);
      if (runnerType && selectedTest[runnerType.argsField]) {
        setArgs(parseArgsString(selectedTest[runnerType.argsField]));
      } else {
        setArgs({ testname: selectedTestName });
      }
    }
  };

  // --- Update a single arg field ---
  const updateArg = (key, value) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  };

  // --- Run ---
  const handleRun = async () => {
    if (!selectedTestName) {
      showMessage('Select a test first', 'error');
      return;
    }

    const inputStr = buildArgsString(args);
    const typeLabel = RUNNER_TYPES.find((r) => r.type === selectedType)?.label || selectedType;

    setRunning(true);
    appendOutput(`Running "${typeLabel}" for test "${selectedTestName}"...`);
    appendOutput(`Args: ${inputStr}`);

    try {
      const result = await runScript(selectedTestName, selectedType, inputStr);

      if (result.error) {
        appendOutput(`ERROR: ${result.error}`);
        showMessage('Script returned an error', 'error');
      } else {
        appendOutput(`Status: ${result.message || 'OK'}`);
        if (result.items) {
          appendOutput(`Items returned: ${result.items.length}`);
          result.items.forEach((item, i) => {
            appendOutput(`  [${i}] ${JSON.stringify(item)}`);
          });
        }
        showMessage(`"${typeLabel}" executed`, 'success');
      }
    } catch (err) {
      console.error('Run failed:', err);
      appendOutput(`FAILED: ${err.message}`);
      showMessage('Script execution failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  // --- Clear ---
  const handleClear = () => {
    setArgs({});
    setOutput('');
    showMessage('Cleared', 'info');
  };

  // --- Delete All Test Data ---
  const handleDeleteAllData = async () => {
    if (!selectedTestName) {
      showMessage('Select a test first', 'error');
      return;
    }

    try {
      await deleteAllTestData(selectedTestName);
      appendOutput(`Deleted all test data for "${selectedTestName}"`);
      showMessage(`All data for "${selectedTestName}" deleted`, 'success');
    } catch (err) {
      console.error('Delete all data failed:', err);
      showMessage('Failed to delete test data', 'error');
    }
  };

  // --- Build the known arg field names from the current args ---
  const argKeys = Object.keys(args);

  // --- Friendly labels for common arg keys ---
  const ARG_LABELS = {
    testname: 'Test Name',
    useAsSeed: 'Use As Seed',
    csvData: 'CSV Data',
    requiredTag: 'Required Tag',
    inputFile: 'Input File Name',
  };

  // --- Terminal theme colors ---
  const terminalBg = mode === 'dark' ? '#121212' : '#fafafa';
  const terminalFg = mode === 'dark' ? '#eee' : '#3b3b3b';
  const terminalBorder = mode === 'dark' ? '#333' : '#e0e0e0';
  const terminalHeaderFg = mode === 'dark' ? '#eee' : '#3b3b3b';
  const terminalIconColor = mode === 'dark' ? '#aaa' : '#888';

  const containerStyle = {
    display: 'flex',
    flexDirection: fullscreen ? 'column' : 'row',
    gap: 3,
    height: fullscreen ? 'calc(100vh - 100px)' : 'auto',
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Script Runner
      </Typography>

      <Box sx={containerStyle}>
        {/* ── Form Section ─────────────────────────────────────── */}
        {!fullscreen && (
          <Box sx={{ flex: 1, maxWidth: 500 }}>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Script Settings
            </Typography>

            {/* Test selector */}
            <Tooltip title="Select which test to run">
              <TextField
                select
                fullWidth
                size="small"
                label="Test"
                value={selectedTestName}
                onChange={(e) => handleTestChange(e.target.value)}
                sx={{ mb: 2 }}
              >
                {loadingTests && (
                  <MenuItem disabled>Loading...</MenuItem>
                )}
                {tests.map((t) => (
                  <MenuItem key={t.id} value={t.name}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>

            {/* Script type selector */}
            <Tooltip title="Select which script step to run">
              <TextField
                select
                fullWidth
                size="small"
                label="Script Type"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                sx={{ mb: 2 }}
              >
                {RUNNER_TYPES.map((r) => (
                  <MenuItem key={r.type} value={r.type}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Script Arguments
            </Typography>

            {/* Dynamic arg fields from the _s string */}
            {argKeys.length > 0 ? (
              argKeys.map((key) => (
                <Tooltip key={key} title={`Argument: ${key}`}>
                  <TextField
                    fullWidth
                    size="small"
                    label={ARG_LABELS[key] || key}
                    value={args[key] || ''}
                    onChange={(e) => updateArg(key, e.target.value)}
                    multiline={key === 'csvData'}
                    minRows={key === 'csvData' ? 2 : 1}
                    sx={{ mb: 2 }}
                  />
                </Tooltip>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a test to load its default arguments.
              </Typography>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Execute the selected script">
                <span>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleRun}
                    disabled={running || !selectedTestName}
                    startIcon={running ? <CircularProgress size={16} /> : null}
                  >
                    {running ? 'Running...' : 'Run'}
                  </Button>
                </span>
              </Tooltip>
              <Button variant="outlined" onClick={handleClear}>
                Clear
              </Button>
              <Tooltip title="Delete all result data for this test">
                <span>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteAllData}
                    disabled={!selectedTestName}
                  >
                    Delete All Test Data
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
        )}

        {/* ── Terminal Output ──────────────────────────────────── */}
        <Box
          sx={{
            flex: fullscreen ? 1 : 2,
            height: fullscreen ? '100%' : '65vh',
            position: 'relative',
            borderRadius: 2,
            border: '1px solid',
            borderColor: terminalBorder,
            bgcolor: terminalBg,
            color: terminalFg,
            p: 2,
            fontFamily: 'monospace',
            fontSize: 13,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={500} sx={{ color: terminalHeaderFg }}>
              Terminal Output
            </Typography>
            <Tooltip title={fullscreen ? 'Exit Fullscreen' : 'Expand'}>
              <IconButton onClick={() => setFullscreen(!fullscreen)} size="small" sx={{ color: terminalIconColor }}>
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 1, borderColor: terminalBorder }} />
          <Box component="pre" sx={{ m: 0 }}>
            {output || '> Ready. Select a test and click Run.\n'}
          </Box>
        </Box>
      </Box>

      {/* ── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}