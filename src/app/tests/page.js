'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, Snackbar, Alert, Chip, Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Editor, { loader } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
  getTests, saveTest, deleteTest, deleteAllTestData,
  exportAllTests, createEmptyTest, getScriptTabs,
} from '@/services/testService';
import { useThemeConfig } from '../../context/themecontext';

let monacoThemesDefined = false;

loader.init().then((monaco) => {
  if (monacoThemesDefined) return;
  monacoThemesDefined = true;

  monaco.editor.defineTheme('sctt-dark', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'ff6b2b', fontStyle: 'bold' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#09090a', 'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#1a1a1c', 'editorCursor.foreground': '#ff6b2b',
      'editorIndentGuide.background': '#30363d', 'editor.selectionBackground': '#264f78',
    },
  });

  monaco.editor.defineTheme('sctt-light', {
    base: 'vs', inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'c2410c', fontStyle: 'bold' },
      { token: 'string', foreground: 'a31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267f99' },
    ],
    colors: {
      'editor.background': '#ffffff', 'editor.foreground': '#3b3b3b',
      'editor.lineHighlightBackground': '#f3f3f3', 'editorCursor.foreground': '#ff6b2b',
      'editorIndentGuide.background': '#e0e0e0', 'editor.selectionBackground': '#add6ff',
      'editorLineNumber.foreground': '#b0b0b0', 'editorLineNumber.activeForeground': '#ff6b2b',
      'editor.lineHighlightBorder': '#e8e8e8',
    },
  });
});

export default function TestsPage() {
  const { mode } = useThemeConfig();
  const editorTheme = mode === 'dark' ? 'sctt-dark' : 'sctt-light';

  const [scriptTabs, setScriptTabs] = useState([]);
  const [current, setCurrent] = useState({ id: '', name: '', comments: '', sample: '' });
  const [tabValue, setTabValue] = useState(0);
  const [editorHeight, setEditorHeight] = useState(300);
  const [fullScreen, setFullScreen] = useState(false);
  const [tests, setTests] = useState([]);
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const tabs = getScriptTabs();
    setScriptTabs(tabs);
    setCurrent(createEmptyTest(tabs));
  }, []);

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await getTests(paginationModel.page, paginationModel.pageSize);
      setTests(items);
      setTotalTests(total);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
      showMessage('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleSelectionChange = (sel) => {
    let ids = [];
    if (Array.isArray(sel)) ids = sel;
    else if (sel && typeof sel[Symbol.iterator] === 'function') ids = [...sel];
    else if (sel && typeof sel === 'object') ids = Object.values(sel).filter(v => typeof v === 'string' || typeof v === 'number');
    setSelectedRowIds(ids);
    if (ids.length === 1) {
      const test = tests.find(t => t.id === ids[0]);
      if (test) setCurrent({ ...test });
    }
  };

  const handleRowClick = (params) => {
    const test = tests.find(t => t.id === params.id);
    if (test) {
      setCurrent({ ...test });
      setSelectedRowIds([test.id]);
      showMessage(`Loaded "${test.name}"`, 'info');
    }
  };

  const handleSave = async () => {
    if (!current.name.trim()) { showMessage('Name is required', 'error'); return; }
    try {
      await saveTest(current);
      showMessage(`Test "${current.name}" saved`, 'success');
      setTimeout(fetchTests, 600);
    } catch { showMessage('Failed to save test', 'error'); }
  };

  const handleDelete = async () => {
    if (selectedRowIds.length === 0) { showMessage('No test selected', 'error'); return; }
    const toDelete = tests.filter(t => selectedRowIds.includes(t.id));
    try {
      for (const test of toDelete) await deleteTest(test.id);
      showMessage(`Deleted: ${toDelete.map(t => t.name).join(', ')}`, 'success');
      setCurrent(createEmptyTest(scriptTabs));
      setSelectedRowIds([]);
      setTimeout(fetchTests, 600);
    } catch { showMessage('Failed to delete', 'error'); }
  };

  const handleReset = () => {
    setCurrent(createEmptyTest(scriptTabs));
    setSelectedRowIds([]);
  };

  const handleDuplicate = () => {
    if (selectedRowIds.length !== 1) return;
    const test = tests.find(t => t.id === selectedRowIds[0]);
    if (!test) return;
    setCurrent({ ...test, id: '', name: test.name + ' (copy)' });
    setSelectedRowIds([]);
    showMessage('Duplicated — edit name and save', 'info');
  };

  const handleDeleteAllData = async () => {
    if (!current.name.trim()) { showMessage('Select a test first', 'error'); return; }
    try {
      await deleteAllTestData(current.name);
      showMessage(`All data for "${current.name}" deleted`, 'success');
    } catch { showMessage('Failed to delete test data', 'error'); }
  };

  const handleExportAll = async () => {
    try {
      const data = await exportAllTests();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'alltests.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showMessage('Exported all tests', 'success');
    } catch { showMessage('Failed to export', 'error'); }
  };

  if (scriptTabs.length === 0) return null;

  const activeTab = scriptTabs[tabValue];
  const isNotesTab = activeTab?.id === 'notes';

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'comments', headerName: 'Comments', flex: 1 },
  ];

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Tests</Typography>
        <Chip
          size="small"
          label={`${scriptTabs.length - 1} pipeline stages`}
          sx={{ bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b', fontWeight: 600 }}
        />
      </Stack>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField fullWidth size="small" label="Name" value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} />
          <Select value="script" size="small" sx={{ minWidth: 140 }}>
            <MenuItem value="script">Script</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
          <TextField fullWidth size="small" label="Sample Queries" value={current.sample} onChange={e => setCurrent(p => ({ ...p, sample: e.target.value }))} />
        </Box>

        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1 }}
        >
          {scriptTabs.map(tab => (
            <Tab key={tab.field} label={tab.label} sx={{ textTransform: 'none' }} />
          ))}
        </Tabs>

        {isNotesTab && (
          <TextField
            fullWidth multiline rows={6} placeholder="Enter notes..."
            value={current[activeTab.field] || ''}
            onChange={e => setCurrent(p => ({ ...p, [activeTab.field]: e.target.value }))}
          />
        )}

        {!isNotesTab && (
          <Box sx={{
            position: 'relative', border: '1px solid', borderRadius: 1, overflow: 'hidden',
            borderColor: mode === 'dark' ? '#09090a' : '#e0e0e0',
            bgcolor: mode === 'dark' ? '#1c1c1e' : '#fafafa',
          }}>
            <Tooltip title={fullScreen ? 'Exit Full Screen' : 'Full Screen'}>
              <IconButton
                onClick={() => setFullScreen(!fullScreen)} size="small"
                sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10, color: '#ff6b2b' }}
              >
                {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <ResizableBox
              width={Infinity}
              height={fullScreen ? window.innerHeight - 200 : editorHeight}
              minConstraints={[Infinity, 150]}
              maxConstraints={[Infinity, fullScreen ? window.innerHeight - 200 : 800]}
              axis="y" resizeHandles={['s']}
              onResizeStop={(_, data) => setEditorHeight(data.size.height)}
            >
              <Editor
                height="100%" defaultLanguage="javascript" theme={editorTheme}
                value={current[activeTab.field] || ''}
                onChange={val => setCurrent(p => ({ ...p, [activeTab.field]: val || '' }))}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            </ResizableBox>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="small" onClick={handleSave}>Save</Button>
          <Tooltip title="Delete selected">
            <span><Button variant="outlined" color="error" size="small" onClick={handleDelete} disabled={selectedRowIds.length === 0}>
              Delete{selectedRowIds.length > 1 ? ` (${selectedRowIds.length})` : ''}
            </Button></span>
          </Tooltip>
          <Tooltip title="Clear form">
            <span><Button variant="outlined" size="small" onClick={handleReset} disabled={selectedRowIds.length === 0 && !current.id}>Reset</Button></span>
          </Tooltip>
          <Tooltip title="Duplicate selected">
            <span><Button variant="outlined" size="small" onClick={handleDuplicate} disabled={selectedRowIds.length !== 1}>Duplicate</Button></span>
          </Tooltip>
          <Tooltip title="Delete all result data for this test">
            <span><Button variant="outlined" color="error" size="small" onClick={handleDeleteAllData} disabled={!current.name.trim()}>Delete Test Data</Button></span>
          </Tooltip>
          <Button variant="outlined" size="small" onClick={handleExportAll}>Export All</Button>
          {selectedRowIds.length > 0 && (
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>{selectedRowIds.length} selected</Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 250 }}>
          <DataGrid
            rows={tests} columns={columns} loading={loading}
            rowCount={totalTests} paginationMode="server"
            paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 50, 100]} checkboxSelection
            onRowSelectionModelChange={handleSelectionChange}
            onRowClick={handleRowClick}
            sx={{ height: '100%', '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}