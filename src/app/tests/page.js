'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, Snackbar, Alert, Chip, Stack,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Divider
} from '@mui/material';
import {
  LinkRounded, VisibilityRounded, LinkOffRounded, CloseRounded,
  SaveRounded, DeleteRounded, ContentCopyRounded, AddRounded,
  SearchRounded, CodeRounded, NotesRounded, DownloadRounded,
  FullscreenRounded, FullscreenExitRounded
} from '@mui/icons-material';
import Editor, { loader } from '@monaco-editor/react';
import {
  getTests, saveTest, deleteTest, deleteAllTestData,
  exportAllTests, createEmptyTest, refreshScriptTabs,
} from '@/services/testService';
import { getAssets } from '@/services/assetService';
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
    },
  });
});

export default function TestsPage() {
  const { mode } = useThemeConfig();
  const editorTheme = mode === 'dark' ? 'sctt-dark' : 'sctt-light';
  const isDark = mode === 'dark';

  const [scriptTabs, setScriptTabs]   = useState([]);
  const [assets, setAssets]           = useState([]);
  const [current, setCurrent]         = useState({ id: '', name: '', comments: '', sample: '' });
  const [tabValue, setTabValue]       = useState(0);
  const [fullScreen, setFullScreen]   = useState(false);
  const [tests, setTests]             = useState([]);
  const [totalTests, setTotalTests]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [snackbar, setSnackbar]       = useState({ open: false, message: '', severity: 'info' });
  const [viewDialog, setViewDialog]   = useState({ open: false, assetName: '', script: '', loading: false });

  const showMessage = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });

  useEffect(() => {
    async function init() {
      const tabs = await refreshScriptTabs();
      setScriptTabs(tabs);
      setCurrent(createEmptyTest(tabs));
      try {
        const { items } = await getAssets(0, 200);
        setAssets(items);
      } catch { /* ignore */ }
    }
    init();
  }, []);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await getTests(0, 100);
      setTests(items);
      setTotalTests(total);
    } catch {
      showMessage('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleSelect = (test) => {
    setCurrent({ ...test });
    setSelectedId(test.id);
    setTabValue(0);
  };

  const handleNew = () => {
    setCurrent(createEmptyTest(scriptTabs));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!current.name.trim()) { showMessage('Name is required', 'error'); return; }
    try {
      await saveTest(current);
      showMessage(`"${current.name}" saved`, 'success');
      setTimeout(fetchTests, 600);
    } catch { showMessage('Failed to save', 'error'); }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const test = tests.find(t => t.id === selectedId);
    try {
      await deleteTest(selectedId);
      showMessage(`Deleted "${test?.name}"`, 'success');
      setCurrent(createEmptyTest(scriptTabs));
      setSelectedId(null);
      setTimeout(fetchTests, 600);
    } catch { showMessage('Failed to delete', 'error'); }
  };

  const handleDuplicate = () => {
    const test = tests.find(t => t.id === selectedId);
    if (!test) return;
    setCurrent({ ...test, id: '', name: test.name + ' (copy)' });
    setSelectedId(null);
    showMessage('Duplicated — edit name and save', 'info');
  };

  const handleDeleteAllData = async () => {
    if (!current.name.trim()) return;
    try {
      await deleteAllTestData(current.name);
      showMessage(`Result data for "${current.name}" cleared`, 'success');
    } catch { showMessage('Failed to clear data', 'error'); }
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
    } catch { showMessage('Export failed', 'error'); }
  };

  // ─── Asset linking ────────────────────────────────────────────

  const getFieldValue = (field) => current[field] || '';
  const isAssetRef = (field) => getFieldValue(field).startsWith('ASSET:');
  const getAssetRefName = (field) => getFieldValue(field).replace('ASSET:', '');
  const linkAsset = (field, name) => setCurrent(p => ({ ...p, [field]: `ASSET:${name}` }));
  const unlinkAsset = (field) => setCurrent(p => ({ ...p, [field]: '' }));

  const handleViewScript = async (assetName) => {
    setViewDialog({ open: true, assetName, script: '', loading: true });
    try {
      const { items } = await getAssets(0, 200);
      const found = items.find(a => a.name === assetName);
      setViewDialog(d => ({ ...d, script: found?.script || '// Asset not found', loading: false }));
    } catch {
      setViewDialog(d => ({ ...d, script: '// Failed to load', loading: false }));
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (scriptTabs.length === 0) return null;

  const activeTab   = scriptTabs[tabValue];
  const isNotesTab  = activeTab?.id === 'notes';
  const isLinked    = !isNotesTab && isAssetRef(activeTab?.field);
  const linkedName  = isLinked ? getAssetRefName(activeTab?.field) : '';
  const filtered    = search ? tests.filter(t => t.name?.toLowerCase().includes(search.toLowerCase())) : tests;
  const scriptAssets = assets.filter(a => a.type === 'script');

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 1.5, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid',
        borderColor: 'divider', flexShrink: 0, minHeight: 52,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tests
          </Typography>
          {!loading && totalTests > 0 && (
            <Chip size="small" label={totalTests}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px' }} />
          )}
          {scriptTabs.length > 1 && (
            <Chip size="small"
              label={`${scriptTabs.length - 1} pipeline stages`}
              sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b', borderRadius: '5px' }}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={0.75}>
          <Button size="small" variant="contained"
            startIcon={<SaveRounded sx={{ fontSize: 14 }} />}
            onClick={handleSave} disabled={!current.name.trim()}
            sx={{ textTransform: 'none', fontSize: '0.78rem', height: 30, px: 1.5 }}>
            Save
          </Button>
          <Tooltip title="New test">
            <IconButton size="small" onClick={handleNew}
              sx={{ height: 30, width: 30, border: '1px solid', borderColor: 'divider' }}>
              <AddRounded sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <span>
              <IconButton size="small" onClick={handleDuplicate} disabled={!selectedId}
                sx={{ height: 30, width: 30, border: '1px solid', borderColor: 'divider' }}>
                <ContentCopyRounded sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete test">
            <span>
              <IconButton size="small" onClick={handleDelete} disabled={!selectedId}
                sx={{ height: 30, width: 30, border: '1px solid', borderColor: 'divider',
                  '&:not(:disabled):hover': { borderColor: 'error.main', color: 'error.main' } }}>
                <DeleteRounded sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear result data for this test">
            <span>
              <IconButton size="small" onClick={handleDeleteAllData} disabled={!current.name.trim()}
                sx={{ height: 30, width: 30, border: '1px solid', borderColor: 'divider',
                  '&:not(:disabled):hover': { borderColor: 'warning.main', color: 'warning.main' } }}>
                <DeleteRounded sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Export all tests">
            <IconButton size="small" onClick={handleExportAll}
              sx={{ height: 30, width: 30, border: '1px solid', borderColor: 'divider' }}>
              <DownloadRounded sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Body: split panel ─────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: test list ──────────────────────────────────── */}
        <Box sx={{
          width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              size="small" fullWidth placeholder="Filter..."
              value={search} onChange={e => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 15, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.78rem', height: 32 },
                }
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
            {loading ? (
              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>Loading...</Typography>
              </Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                  {search ? 'No matches' : 'No tests yet'}
                </Typography>
              </Box>
            ) : filtered.map(test => {
              const isSelected = selectedId === test.id;
              return (
                <Box
                  key={test.id}
                  onClick={() => handleSelect(test)}
                  sx={{
                    px: 1.5, py: 1, mx: 0.75, mb: 0.25, borderRadius: 1.5,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.25,
                    bgcolor: isSelected ? 'rgba(255,107,43,0.08)' : 'transparent',
                    transition: 'all 0.1s',
                    '&:hover': { bgcolor: isSelected ? 'rgba(255,107,43,0.1)' : 'action.hover' },
                  }}
                >
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
                    bgcolor: isSelected ? 'rgba(255,107,43,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CodeRounded sx={{ fontSize: 13, color: isSelected ? '#ff6b2b' : 'text.disabled' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: '0.78rem', fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#ff6b2b' : 'text.primary',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}>
                      {test.name}
                    </Typography>
                    {test.comments && (
                      <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {test.comments}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── RIGHT: editor ────────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Test metadata: name, comments, sample */}
          <Box sx={{
            px: 2.5, py: 1.25, display: 'flex', alignItems: 'center',
            gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
          }}>
            <TextField size="small" placeholder="Test name..."
              value={current.name}
              onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))}
              sx={{ width: 200, '& .MuiOutlinedInput-root': { fontSize: '0.85rem', height: 32 } }}
            />
            <TextField size="small" placeholder="Comments..."
              value={current.comments || ''}
              onChange={e => setCurrent(p => ({ ...p, comments: e.target.value }))}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.82rem', height: 32 } }}
            />
            <TextField size="small" placeholder="Sample queries..."
              value={current.sample || ''}
              onChange={e => setCurrent(p => ({ ...p, sample: e.target.value }))}
              sx={{ width: 180, '& .MuiOutlinedInput-root': { fontSize: '0.82rem', height: 32 } }}
            />
          </Box>

          {/* Pipeline stage tabs */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tabs
              value={tabValue} onChange={(_, v) => setTabValue(v)}
              variant="scrollable" scrollButtons="auto"
              sx={{
                minHeight: 36, px: 1,
                '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontSize: '0.75rem', px: 1.5 },
              }}
            >
              {scriptTabs.map((tab, i) => (
                <Tab
                  key={tab.id}
                  label={tab.label}
                  icon={tab.id !== 'notes' && isAssetRef(tab.field)
                    ? <LinkRounded sx={{ fontSize: 11, color: '#ff6b2b' }} />
                    : undefined}
                  iconPosition="end"
                  sx={{ gap: 0.5 }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab content */}
          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Notes tab */}
            {isNotesTab && (
              <Box sx={{ p: 2.5, flex: 1 }}>
                <TextField
                  multiline fullWidth
                  placeholder="Test notes — purpose, configurations, dependencies..."
                  value={current[activeTab.field] || ''}
                  onChange={e => setCurrent(p => ({ ...p, [activeTab.field]: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': { fontSize: '0.85rem', lineHeight: 1.75 },
                    '& textarea': { minHeight: '200px !important' },
                  }}
                />
              </Box>
            )}

            {/* Script tab: LINKED */}
            {!isNotesTab && isLinked && (
              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Linked asset card */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.75, borderRadius: 2, border: '1px solid',
                  borderColor: 'rgba(255,107,43,0.2)', bgcolor: 'rgba(255,107,43,0.04)',
                }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                    bgcolor: 'rgba(255,107,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <LinkRounded sx={{ fontSize: 16, color: '#ff6b2b' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 0.25 }}>
                      Linked to asset
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: '#ff6b2b' }}>
                      {linkedName}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75}>
                    <Button size="small" variant="outlined"
                      startIcon={<VisibilityRounded sx={{ fontSize: 13 }} />}
                      onClick={() => handleViewScript(linkedName)}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', height: 28 }}>
                      View
                    </Button>
                    <Button size="small" variant="outlined" color="error"
                      startIcon={<LinkOffRounded sx={{ fontSize: 13 }} />}
                      onClick={() => unlinkAsset(activeTab.field)}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', height: 28 }}>
                      Unlink
                    </Button>
                  </Stack>
                </Box>

                {/* Change asset */}
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled', mb: 0.75 }}>
                    Change asset
                  </Typography>
                  <Select size="small" fullWidth value={linkedName}
                    onChange={e => linkAsset(activeTab.field, e.target.value)}
                    sx={{ fontSize: '0.8rem' }}>
                    {scriptAssets.map(a => (
                      <MenuItem key={a.id} value={a.name} sx={{ fontSize: '0.8rem' }}>{a.name}</MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Args */}
                {activeTab.argsField && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled', mb: 0.75 }}>
                      Script Arguments
                    </Typography>
                    <TextField
                      fullWidth size="small" multiline minRows={3}
                      placeholder="key=value key2=value2"
                      value={current[activeTab.argsField] || ''}
                      onChange={e => setCurrent(p => ({ ...p, [activeTab.argsField]: e.target.value }))}
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Script tab: INLINE */}
            {!isNotesTab && !isLinked && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Link to asset bar */}
                <Box sx={{
                  px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5,
                  borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                }}>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Inline
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>·</Typography>
                  <Select size="small" displayEmpty value=""
                    onChange={e => { if (e.target.value) linkAsset(activeTab.field, e.target.value); }}
                    sx={{ height: 26, fontSize: '0.72rem', '& .MuiSelect-select': { py: 0.5 } }}
                    renderValue={() => <span style={{ color: 'var(--mui-palette-text-disabled)' }}>Link to asset...</span>}
                  >
                    {scriptAssets.map(a => (
                      <MenuItem key={a.id} value={a.name} sx={{ fontSize: '0.78rem' }}>{a.name}</MenuItem>
                    ))}
                  </Select>
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title={fullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
                    <IconButton size="small" onClick={() => setFullScreen(p => !p)}
                      sx={{ color: 'text.disabled', '&:hover': { color: '#ff6b2b' } }}>
                      {fullScreen ? <FullscreenExitRounded sx={{ fontSize: 16 }} /> : <FullscreenRounded sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Monaco editor */}
                <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 200 }}>
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme={editorTheme}
                    value={current[activeTab.field] || ''}
                    onChange={val => setCurrent(p => ({ ...p, [activeTab.field]: val || '' }))}
                    options={{
                      minimap: { enabled: false }, fontSize: 13, lineHeight: 20,
                      scrollBeyondLastLine: false, automaticLayout: true,
                      padding: { top: 10, bottom: 10 },
                      scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                    }}
                  />
                </Box>

                {/* Args below editor */}
                {activeTab.argsField && (
                  <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled', mb: 0.75 }}>
                      Script Arguments
                    </Typography>
                    <TextField
                      fullWidth size="small"
                      placeholder="key=value key2=value2"
                      value={current[activeTab.argsField] || ''}
                      onChange={e => setCurrent(p => ({ ...p, [activeTab.argsField]: e.target.value }))}
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.8rem', height: 32 } }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── View Script Dialog ────────────────────────────────── */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog(d => ({ ...d, open: false }))} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <VisibilityRounded sx={{ fontSize: 16, color: '#ff6b2b' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{viewDialog.assetName}</Typography>
            <Chip size="small" label="Read Only" sx={{ fontSize: '0.6rem', height: 18 }} />
          </Stack>
          <IconButton size="small" onClick={() => setViewDialog(d => ({ ...d, open: false }))}>
            <CloseRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 520 }}>
          {viewDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>Loading...</Typography>
            </Box>
          ) : (
            <Editor height="100%" defaultLanguage="javascript" theme={editorTheme}
              value={viewDialog.script}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 10 } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ py: 1 }}>
          <Button size="small" onClick={() => setViewDialog(d => ({ ...d, open: false }))}
            sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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