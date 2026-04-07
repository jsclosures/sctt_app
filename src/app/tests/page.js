'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, Snackbar, Alert, Chip, Stack,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  LinkRounded, EditRounded, VisibilityRounded, LinkOffRounded, CloseRounded
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import Editor, { loader } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
  getTests, saveTest, deleteTest, deleteAllTestData,
  exportAllTests, createEmptyTest, getScriptTabs, refreshScriptTabs,
} from '@/services/testService';
import { getAssets } from '@/services/assetService';
import { useThemeConfig } from '../../context/themecontext';
import { fromBase64 } from '@/lib/api';

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
  const [assets, setAssets] = useState([]);
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

  // View script dialog
  const [viewDialog, setViewDialog] = useState({ open: false, assetName: '', script: '', loading: false });

  useEffect(() => {
    async function init() {
      const tabs = await refreshScriptTabs();
      setScriptTabs(tabs);
      setCurrent(createEmptyTest(tabs));
      // Also load assets for the dropdown
      try {
        const { items } = await getAssets(0, 200);
        setAssets(items);
      } catch { /* ignore */ }
    }
    init();
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

  // ─── Asset linking helpers ──────────────────────────────────────

  const getFieldValue = (field) => current[field] || '';

  const isAssetRef = (field) => {
    const val = getFieldValue(field);
    return val.startsWith('ASSET:');
  };

  const getAssetRefName = (field) => {
    const val = getFieldValue(field);
    return val.startsWith('ASSET:') ? val.substring(6) : '';
  };

  const linkAsset = (field, assetName) => {
    setCurrent(p => ({ ...p, [field]: `ASSET:${assetName}` }));
  };

  const unlinkAsset = (field) => {
    setCurrent(p => ({ ...p, [field]: '' }));
  };

  const handleViewScript = async (assetName) => {
    setViewDialog({ open: true, assetName, script: '', loading: true });
    try {
      const asset = assets.find(a => a.name === assetName);
      if (asset && asset.script) {
        setViewDialog(d => ({ ...d, script: asset.script, loading: false }));
      } else {
        // Fetch fresh
        const { items } = await getAssets(0, 200);
        const found = items.find(a => a.name === assetName);
        setViewDialog(d => ({ ...d, script: found?.script || '// Asset not found', loading: false }));
      }
    } catch {
      setViewDialog(d => ({ ...d, script: '// Failed to load asset', loading: false }));
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (scriptTabs.length === 0) return null;

  const activeTab = scriptTabs[tabValue];
  const isNotesTab = activeTab?.id === 'notes';
  const isLinked = !isNotesTab && isAssetRef(activeTab?.field);
  const linkedAssetName = isLinked ? getAssetRefName(activeTab?.field) : '';

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

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
          {scriptTabs.map(tab => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={!isNotesTab && tab.field && isAssetRef(tab.field) ? <LinkRounded sx={{ fontSize: 14 }} /> : undefined}
              iconPosition="start"
              sx={{ textTransform: 'none', minHeight: 40 }}
            />
          ))}
        </Tabs>

        {/* ── Notes tab ──────────────────────────────────────── */}
        {isNotesTab && (
          <TextField
            fullWidth multiline rows={6} placeholder="Enter notes..."
            value={current[activeTab.field] || ''}
            onChange={e => setCurrent(p => ({ ...p, [activeTab.field]: e.target.value }))}
          />
        )}

        {/* ── Script tab: Linked to Asset ────────────────────── */}
        {!isNotesTab && isLinked && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LinkRounded sx={{ color: '#ff6b2b', fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
                  Linked to Asset
                </Typography>
              </Stack>

              <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    label={linkedAssetName}
                    size="small"
                    sx={{ fontWeight: 600, fontFamily: 'monospace', bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b' }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    Script will be loaded from this asset at runtime
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View asset script">
                    <Button
                      size="small" variant="outlined"
                      startIcon={<VisibilityRounded />}
                      onClick={() => handleViewScript(linkedAssetName)}
                    >
                      View Script
                    </Button>
                  </Tooltip>
                  <Tooltip title="Unlink — switch to inline script">
                    <Button
                      size="small" variant="outlined" color="error"
                      startIcon={<LinkOffRounded />}
                      onClick={() => unlinkAsset(activeTab.field)}
                    >
                      Unlink
                    </Button>
                  </Tooltip>
                </Stack>
              </Paper>

              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>
                  Change linked asset
                </Typography>
                <Select
                  size="small" fullWidth
                  value={linkedAssetName}
                  onChange={e => linkAsset(activeTab.field, e.target.value)}
                >
                  {assets.filter(a => a.type === 'script').map(a => (
                    <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Args field */}
              {activeTab.argsField && (
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>
                    Script Arguments
                  </Typography>
                  <TextField
                    fullWidth size="small" multiline minRows={2}
                    placeholder="key=value key2=value2"
                    value={current[activeTab.argsField] || ''}
                    onChange={e => setCurrent(p => ({ ...p, [activeTab.argsField]: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
                  />
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* ── Script tab: Inline script (no ASSET: ref) ──────── */}
        {!isNotesTab && !isLinked && (
          <Box>
            {/* Link to asset option */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                Inline Script
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>or</Typography>
              <Select
                size="small"
                displayEmpty
                value=""
                onChange={e => { if (e.target.value) linkAsset(activeTab.field, e.target.value); }}
                sx={{ minWidth: 180, '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.5 } }}
              >
                <MenuItem value="" disabled>Link to an asset...</MenuItem>
                {assets.filter(a => a.type === 'script').map(a => (
                  <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                ))}
              </Select>
            </Stack>

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

            {/* Args field for inline too */}
            {activeTab.argsField && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>
                  Script Arguments
                </Typography>
                <TextField
                  fullWidth size="small"
                  placeholder="key=value key2=value2"
                  value={current[activeTab.argsField] || ''}
                  onChange={e => setCurrent(p => ({ ...p, [activeTab.argsField]: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* ── Action buttons ─────────────────────────────────── */}
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

        {/* ── Tests table ────────────────────────────────────── */}
        <Box sx={{ flexGrow: 1, minHeight: 250 }}>
          <DataGrid
            rows={tests} columns={columns} loading={loading}
            rowCount={totalTests} paginationMode="server"
            paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 50, 100]} checkboxSelection
            onRowSelectionModelChange={(sel) => {
              let ids = [];
              if (Array.isArray(sel)) ids = sel;
              else if (sel && typeof sel[Symbol.iterator] === 'function') ids = [...sel];
              setSelectedRowIds(ids);
              if (ids.length === 1) {
                const test = tests.find(t => t.id === ids[0]);
                if (test) setCurrent({ ...test });
              }
            }}
            onRowClick={handleRowClick}
            sx={{ height: '100%', '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        </Box>
      </Box>

      {/* ── View Script Dialog ───────────────────────────────── */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog(d => ({ ...d, open: false }))} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <VisibilityRounded sx={{ fontSize: 18, color: '#ff6b2b' }} />
            <Typography sx={{ fontWeight: 600 }}>{viewDialog.assetName}</Typography>
            <Chip size="small" label="Read Only" sx={{ fontSize: '0.65rem', height: 20 }} />
          </Stack>
          <IconButton size="small" onClick={() => setViewDialog(d => ({ ...d, open: false }))}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 500 }}>
          {viewDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : (
            <Editor
              height="100%" defaultLanguage="javascript" theme={editorTheme}
              value={viewDialog.script}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(d => ({ ...d, open: false }))}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ─────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}