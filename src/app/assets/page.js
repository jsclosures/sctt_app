'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, Snackbar, Alert,
  Stack, Chip, InputAdornment
} from '@mui/material';
import {
  FullscreenRounded, FullscreenExitRounded, SearchRounded,
  AddRounded, DeleteRounded, ContentCopyRounded, SaveRounded,
  CodeRounded, NotesRounded
} from '@mui/icons-material';
import Editor, { loader } from '@monaco-editor/react';
import { getAssets, saveAsset, deleteAsset } from '@/services/assetService';
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

const EMPTY = { id: '', name: '', type: 'script', notes: '', script: '' };

export default function AssetsPage() {
  const { mode } = useThemeConfig();
  const editorTheme = mode === 'dark' ? 'sctt-dark' : 'sctt-light';
  const isDark = mode === 'dark';

  const [current, setCurrent]       = useState({ ...EMPTY });
  const [tabValue, setTabValue]     = useState(1);
  const [fullScreen, setFullScreen] = useState(false);
  const [assets, setAssets]         = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch]         = useState('');
  const [snackbar, setSnackbar]     = useState({ open: false, message: '', severity: 'info' });

  const showMessage = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await getAssets(0, 100);
      setAssets(items);
      setTotalAssets(total);
    } catch {
      showMessage('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleSelect = (asset) => {
    setCurrent({ ...asset });
    setSelectedId(asset.id);
    setTabValue(1);
  };

  const handleNew = () => {
    setCurrent({ ...EMPTY });
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!current.name.trim()) { showMessage('Name is required', 'error'); return; }
    try {
      await saveAsset({ id: current.id || undefined, name: current.name, type: current.type, notes: current.notes, script: current.script });
      showMessage(`"${current.name}" saved`, 'success');
      setTimeout(fetchAssets, 600);
    } catch {
      showMessage('Failed to save', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const asset = assets.find(a => a.id === selectedId);
    try {
      await deleteAsset(selectedId);
      showMessage(`Deleted "${asset?.name}"`, 'success');
      setCurrent({ ...EMPTY });
      setSelectedId(null);
      setTimeout(fetchAssets, 600);
    } catch {
      showMessage('Failed to delete', 'error');
    }
  };

  const handleDuplicate = () => {
    const asset = assets.find(a => a.id === selectedId);
    if (!asset) return;
    setCurrent({ ...asset, id: '', name: asset.name + ' (copy)' });
    setSelectedId(null);
    showMessage('Duplicated — edit name and save', 'info');
  };

  const filtered = search
    ? assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : assets;

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
            Assets
          </Typography>
          {!loading && totalAssets > 0 && (
            <Chip size="small" label={totalAssets}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px' }} />
          )}
        </Stack>
        <Stack direction="row" spacing={0.75}>
          <Button
            size="small" variant="contained"
            startIcon={<SaveRounded sx={{ fontSize: 14 }} />}
            onClick={handleSave}
            disabled={!current.name.trim()}
            sx={{ textTransform: 'none', fontSize: '0.78rem', height: 30, px: 1.5 }}
          >
            Save
          </Button>
          <Tooltip title="New asset">
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
          <Tooltip title="Delete">
            <span>
              <IconButton size="small" onClick={handleDelete} disabled={!selectedId}
                sx={{
                  height: 30, width: 30, border: '1px solid', borderColor: 'divider',
                  '&:not(:disabled):hover': { borderColor: 'error.main', color: 'error.main', bgcolor: 'error.50' },
                }}>
                <DeleteRounded sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Body: split panel ─────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: asset list ─────────────────────────────────── */}
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
                  {search ? 'No matches' : 'No assets yet'}
                </Typography>
              </Box>
            ) : (
              filtered.map(asset => {
                const isSelected = selectedId === asset.id;
                return (
                  <Box
                    key={asset.id}
                    onClick={() => handleSelect(asset)}
                    sx={{
                      px: 1.5, py: 1, mx: 0.75, mb: 0.25, borderRadius: 1.5,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.25,
                      bgcolor: isSelected ? 'rgba(255,107,43,0.08)' : 'transparent',
                      borderLeft: `2px solid ${isSelected ? '#ff6b2b' : 'transparent'}`,
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
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#ff6b2b' : 'text.primary',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}>
                        {asset.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: 'monospace' }}>
                        {asset.type}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* ── RIGHT: editor panel ──────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Editor header: name + type */}
          <Box sx={{
            px: 2.5, py: 1.25, display: 'flex', alignItems: 'center',
            gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
          }}>
            <TextField
              size="small" placeholder="Asset name..."
              value={current.name}
              onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))}
              sx={{
                flex: 1, maxWidth: 360,
                '& .MuiOutlinedInput-root': { fontSize: '0.85rem', height: 32 },
              }}
            />
            <Select
              size="small" value={current.type}
              onChange={e => setCurrent(p => ({ ...p, type: e.target.value }))}
              sx={{ minWidth: 100, fontSize: '0.78rem', height: 32 }}
            >
              <MenuItem value="script" sx={{ fontSize: '0.78rem' }}>script</MenuItem>
              <MenuItem value="other" sx={{ fontSize: '0.78rem' }}>other</MenuItem>
            </Select>
            {current.id && (
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: 'monospace', ml: 'auto' }}>
                {current.id}
              </Typography>
            )}
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tabs
              value={tabValue} onChange={(_, v) => setTabValue(v)}
              sx={{
                minHeight: 36, px: 2,
                '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontSize: '0.78rem' },
              }}
            >
              <Tab icon={<NotesRounded sx={{ fontSize: 13 }} />} iconPosition="start" label="Notes" />
              <Tab icon={<CodeRounded sx={{ fontSize: 13 }} />} iconPosition="start" label="Script" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

            {/* Notes tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 2.5, height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
                <TextField
                  multiline fullWidth
                  placeholder="Add notes — purpose, usage, parameters, dependencies..."
                  value={current.notes}
                  onChange={e => setCurrent(p => ({ ...p, notes: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': { fontSize: '0.85rem', lineHeight: 1.75 },
                    '& textarea': { minHeight: '200px !important' },
                  }}
                />
              </Box>
            )}

            {/* Script tab */}
            {tabValue === 1 && (
              <Box sx={{ height: '100%', position: 'relative' }}>
                <Tooltip title={fullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
                  <IconButton
                    size="small" onClick={() => setFullScreen(p => !p)}
                    sx={{
                      position: 'absolute', top: 8, right: 8, zIndex: 10,
                      color: 'text.disabled',
                      bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
                      '&:hover': { color: '#ff6b2b' },
                    }}
                  >
                    {fullScreen
                      ? <FullscreenExitRounded sx={{ fontSize: 16 }} />
                      : <FullscreenRounded sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme={editorTheme}
                  value={current.script}
                  onChange={val => setCurrent(p => ({ ...p, script: val || '' }))}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 20,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 10, bottom: 10 },
                    scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                    renderLineHighlight: 'gutter',
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}