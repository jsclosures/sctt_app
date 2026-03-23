'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Editor, { loader } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import 'react-resizable/css/styles.css';
import {
  getTests,
  saveTest,
  deleteTest,
  deleteAllTestData,
  exportAllTests,
  createEmptyTest,
  SCRIPT_TABS,
} from '@/services/testService';
import { useThemeConfig } from '../../context/themecontext';;

// ─── Monaco themes ──────────────────────────────────────────────────

let monacoThemesDefined = false;

loader.init().then((monaco) => {
  if (monacoThemesDefined) return;
  monacoThemesDefined = true;

  monaco.editor.defineTheme('sctt-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'ff6b2b', fontStyle: 'bold' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#09090a',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#1a1a1c',
      'editorCursor.foreground': '#ff6b2b',
      'editorIndentGuide.background': '#30363d',
      'editor.selectionBackground': '#264f78',
    },
  });

  monaco.editor.defineTheme('sctt-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'c2410c', fontStyle: 'bold' },
      { token: 'string', foreground: 'a31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267f99' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#3b3b3b',
      'editor.lineHighlightBackground': '#f3f3f3',
      'editorCursor.foreground': '#ff6b2b',
      'editorIndentGuide.background': '#e0e0e0',
      'editor.selectionBackground': '#add6ff',
      'editorLineNumber.foreground': '#b0b0b0',
      'editorLineNumber.activeForeground': '#ff6b2b',
      'editor.lineHighlightBorder': '#e8e8e8',
      'editorBracketMatch.background': '#ffeedd',
      'editorBracketMatch.border': '#ff6b2b',
    },
  });
});

// ─── Component ──────────────────────────────────────────────────────

export default function TestsPage() {
  const { mode } = useThemeConfig();
  const editorTheme = mode === 'dark' ? 'sctt-dark' : 'sctt-light';
  const EMPTY_TEST = createEmptyTest();

  // --- Form state ---
  const [current, setCurrent] = useState({ ...EMPTY_TEST });
  const [tabValue, setTabValue] = useState(0);
  const [editorHeight, setEditorHeight] = useState(300);
  const [fullScreen, setFullScreen] = useState(false);

  // --- List state ---
  const [tests, setTests] = useState([]);
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });

  // --- Feedback ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Fetch tests list ---
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await getTests(
        paginationModel.page,
        paginationModel.pageSize
      );
      setTests(items);
      setTotalTests(total);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
      showMessage('Failed to load tests. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // --- Handle checkbox selection ---
  const handleSelectionChange = (newSelection) => {
    let ids = [];

    if (Array.isArray(newSelection)) {
      ids = newSelection;
    } else if (newSelection && typeof newSelection.toArray === 'function') {
      ids = newSelection.toArray();
    } else if (newSelection && newSelection.ids) {
      ids = Array.isArray(newSelection.ids) ? newSelection.ids : [...newSelection.ids];
    } else if (newSelection && typeof newSelection[Symbol.iterator] === 'function') {
      ids = [...newSelection];
    } else if (newSelection && typeof newSelection === 'object') {
      ids = Object.values(newSelection).filter((v) => typeof v === 'string' || typeof v === 'number');
    }

    setSelectedRowIds(ids);

    if (ids.length === 1) {
      const test = tests.find((t) => t.id === ids[0]);
      if (test) setCurrent({ ...test });
    }
  };

  // --- Row click → load into form + select ---
  const handleRowClick = (params) => {
    const test = tests.find((t) => t.id === params.id);
    if (test) {
      setCurrent({ ...test });
      setSelectedRowIds([test.id]);
      showMessage(`Loaded "${test.name}"`, 'info');
    }
  };

  // --- Save ---
  const handleSave = async () => {
    if (!current.name.trim()) {
      showMessage('Name is required', 'error');
      return;
    }

    try {
      await saveTest(current);
      showMessage(`Test "${current.name}" saved`, 'success');
      setTimeout(fetchTests, 600);
    } catch (err) {
      console.error('Save failed:', err);
      showMessage('Failed to save test', 'error');
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (selectedRowIds.length === 0) {
      showMessage('No test selected to delete', 'error');
      return;
    }

    const toDelete = tests.filter((t) => selectedRowIds.includes(t.id));
    const names = toDelete.map((t) => t.name).join(', ');

    try {
      for (const test of toDelete) {
        await deleteTest(test.id);
      }
      showMessage(`Deleted: ${names}`, 'success');
      setCurrent({ ...EMPTY_TEST });
      setSelectedRowIds([]);
      setTimeout(fetchTests, 600);
    } catch (err) {
      console.error('Delete failed:', err);
      showMessage('Failed to delete test(s)', 'error');
    }
  };

  // --- Reset / Clear ---
  const handleReset = () => {
    setCurrent({ ...EMPTY_TEST });
    setSelectedRowIds([]);
    showMessage('Form cleared', 'info');
  };

  // --- Duplicate ---
  const handleDuplicate = () => {
    if (selectedRowIds.length !== 1) {
      showMessage('Select exactly one test to duplicate', 'error');
      return;
    }
    const test = tests.find((t) => t.id === selectedRowIds[0]);
    if (!test) return;

    setCurrent({
      ...test,
      id: '',
      name: test.name + ' (copy)',
    });
    setSelectedRowIds([]);
    showMessage('Duplicated — edit the name and hit Save', 'info');
  };

  // --- Delete All Test Data ---
  const handleDeleteAllData = async () => {
    if (!current.name.trim()) {
      showMessage('Enter or select a test name first', 'error');
      return;
    }

    try {
      await deleteAllTestData(current.name);
      showMessage(`All test data for "${current.name}" deleted`, 'success');
    } catch (err) {
      console.error('Delete all data failed:', err);
      showMessage('Failed to delete test data', 'error');
    }
  };

  // --- Export All Tests ---
  const handleExportAll = async () => {
    try {
      const data = await exportAllTests();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alltests.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('Exported all tests', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showMessage('Failed to export tests', 'error');
    }
  };

  // --- Get the active tab's field info ---
  const activeTab = SCRIPT_TABS[tabValue];
  const isNotesTab = tabValue === 0;

  // --- Table columns ---
  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'comments', headerName: 'Comments', flex: 1 },
  ];

  // --- Render ───────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Tests
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ── Inputs ───────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Name your test">
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={current.name}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Tooltip>
          <Tooltip title="Choose test type">
            <Select
              value="script"
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="script">Script</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </Tooltip>
          <Tooltip title="Link to Sample Queries (Optional)">
            <TextField
              fullWidth
              size="small"
              label="Sample Queries"
              value={current.sample}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, sample: e.target.value }))
              }
            />
          </Tooltip>
        </Box>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1 }}
        >
          {SCRIPT_TABS.map((tab) => (
            <Tab key={tab.field} label={tab.label} sx={{ textTransform: 'none' }} />
          ))}
        </Tabs>

        {/* ── Notes tab ────────────────────────────────────────── */}
        {isNotesTab && (
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Enter notes..."
            variant="outlined"
            value={current[activeTab.field] || ''}
            onChange={(e) =>
              setCurrent((prev) => ({
                ...prev,
                [activeTab.field]: e.target.value,
              }))
            }
          />
        )}

        {/* ── Script tabs (1-8) ────────────────────────────────── */}
        {!isNotesTab && (
          <Box
            sx={{
              position: 'relative',
              border: '1px solid',
              borderColor: mode === 'dark' ? '#09090a' : '#e0e0e0',
              borderRadius: 1,
              bgcolor: mode === 'dark' ? '#1c1c1e' : '#fafafa',
              overflow: 'hidden',
            }}
          >
            <Tooltip title={fullScreen ? 'Exit Full Screen' : 'Full Screen'}>
              <IconButton
                onClick={() => setFullScreen(!fullScreen)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  zIndex: 10,
                  color: '#ff6b2b',
                }}
              >
                {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            <ResizableBox
              width={Infinity}
              height={fullScreen ? window.innerHeight - 200 : editorHeight}
              minConstraints={[Infinity, 150]}
              maxConstraints={[Infinity, fullScreen ? window.innerHeight - 200 : 800]}
              axis="y"
              resizeHandles={['s']}
              onResizeStop={(_, data) => setEditorHeight(data.size.height)}
            >
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme={editorTheme}
                value={current[activeTab.field] || ''}
                onChange={(val) =>
                  setCurrent((prev) => ({
                    ...prev,
                    [activeTab.field]: val || '',
                  }))
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </ResizableBox>
          </Box>
        )}

        {/* ── Action buttons ───────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Save this test">
            <Button variant="contained" color="primary" size="small" onClick={handleSave}>
              Save
            </Button>
          </Tooltip>
          <Tooltip title={selectedRowIds.length > 1 ? `Delete ${selectedRowIds.length} tests` : 'Delete selected test'}>
            <span>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleDelete}
                disabled={selectedRowIds.length === 0}
              >
                Delete{selectedRowIds.length > 1 ? ` (${selectedRowIds.length})` : ''}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Clear selection and form">
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleReset}
                disabled={selectedRowIds.length === 0 && !current.id}
              >
                Reset
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={selectedRowIds.length === 1 ? 'Duplicate selected test' : 'Select one test to duplicate'}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleDuplicate}
                disabled={selectedRowIds.length !== 1}
              >
                Duplicate Test
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Delete all result data for this test (not the test itself)">
            <span>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleDeleteAllData}
                disabled={!current.name.trim()}
              >
                Delete All Test Data
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Export all test definitions as JSON">
            <Button variant="outlined" color="primary" size="small" onClick={handleExportAll}>
              Export All Tests
            </Button>
          </Tooltip>

          {selectedRowIds.length > 0 && (
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              {selectedRowIds.length} selected
            </Typography>
          )}
        </Box>

        {/* ── Tests table ──────────────────────────────────────── */}
        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <DataGrid
            rows={tests}
            columns={columns}
            loading={loading}
            rowCount={totalTests}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 50, 100]}
            checkboxSelection
            onRowSelectionModelChange={handleSelectionChange}
            onRowClick={handleRowClick}
            sx={{
              height: '100%',
              '& .MuiDataGrid-row': { cursor: 'pointer' },
            }}
          />
        </Box>
      </Box>

      {/* ── Snackbar feedback ────────────────────────────────────── */}
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