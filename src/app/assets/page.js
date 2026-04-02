'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, Snackbar, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Editor, { loader } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { getAssets, saveAsset, deleteAsset } from '@/services/assetService';
import { useThemeConfig } from '../../context/themecontext';

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

const EMPTY_ASSET = { id: '', name: '', type: 'script', notes: '', script: '' };

export default function AssetsPage() {
  const { mode } = useThemeConfig();
  const editorTheme = mode === 'dark' ? 'sctt-dark' : 'sctt-light';

  const [current, setCurrent] = useState({ ...EMPTY_ASSET });
  const [tabValue, setTabValue] = useState(0);
  const [editorHeight, setEditorHeight] = useState(300);
  const [fullScreen, setFullScreen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await getAssets(paginationModel.page, paginationModel.pageSize);
      setAssets(items);
      setTotalAssets(total);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      showMessage('Failed to load assets. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleSelectionChange = (newSelection) => {
    let ids = [];
    if (Array.isArray(newSelection)) ids = newSelection;
    else if (newSelection && typeof newSelection[Symbol.iterator] === 'function') ids = [...newSelection];
    else if (newSelection && typeof newSelection === 'object') ids = Object.values(newSelection).filter(v => typeof v === 'string' || typeof v === 'number');

    setSelectedRowIds(ids);
    if (ids.length === 1) {
      const asset = assets.find(a => a.id === ids[0]);
      if (asset) setCurrent({ ...asset });
    }
  };

  const handleRowClick = (params) => {
    const asset = assets.find(a => a.id === params.id);
    if (asset) {
      setCurrent({ ...asset });
      setSelectedRowIds([asset.id]);
      showMessage(`Loaded "${asset.name}"`, 'info');
    }
  };

  const handleSave = async () => {
    if (!current.name.trim()) { showMessage('Name is required', 'error'); return; }
    try {
      await saveAsset({ id: current.id || undefined, name: current.name, type: current.type, notes: current.notes, script: current.script });
      showMessage(`Asset "${current.name}" saved`, 'success');
      setTimeout(fetchAssets, 600);
    } catch (err) {
      console.error('Save failed:', err);
      showMessage('Failed to save asset', 'error');
    }
  };

  const handleDelete = async () => {
    if (selectedRowIds.length === 0) { showMessage('No asset selected', 'error'); return; }
    const toDelete = assets.filter(a => selectedRowIds.includes(a.id));
    try {
      for (const asset of toDelete) await deleteAsset(asset.id);
      showMessage(`Deleted: ${toDelete.map(a => a.name).join(', ')}`, 'success');
      setCurrent({ ...EMPTY_ASSET });
      setSelectedRowIds([]);
      setTimeout(fetchAssets, 600);
    } catch (err) {
      console.error('Delete failed:', err);
      showMessage('Failed to delete asset(s)', 'error');
    }
  };

  const handleClear = () => {
    setCurrent({ ...EMPTY_ASSET });
    setSelectedRowIds([]);
  };

  const handleDuplicate = () => {
    if (selectedRowIds.length !== 1) { showMessage('Select exactly one asset to duplicate', 'error'); return; }
    const asset = assets.find(a => a.id === selectedRowIds[0]);
    if (!asset) return;
    setCurrent({ ...asset, id: '', name: asset.name + ' (copy)' });
    setSelectedRowIds([]);
    showMessage('Duplicated — edit the name and hit Save', 'info');
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
  ];

  return (
    <Box sx={{ height: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Assets</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Name" fullWidth size="small" value={current.name} onChange={e => setCurrent(prev => ({ ...prev, name: e.target.value }))} />
          <Select value={current.type} size="small" sx={{ minWidth: 150 }} onChange={e => setCurrent(prev => ({ ...prev, type: e.target.value }))}>
            <MenuItem value="script">script</MenuItem>
            <MenuItem value="other">other</MenuItem>
          </Select>
        </Box>

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 1 }}>
          <Tab label="Notes" sx={{ textTransform: 'none' }} />
          <Tab label="Script" sx={{ textTransform: 'none' }} />
        </Tabs>

        {tabValue === 0 && (
          <TextField multiline rows={6} placeholder="Enter notes..." fullWidth value={current.notes} onChange={e => setCurrent(prev => ({ ...prev, notes: e.target.value }))} />
        )}

        {tabValue === 1 && (
          <Box sx={{
            position: 'relative', border: '1px solid', borderRadius: 1, overflow: 'hidden',
            borderColor: mode === 'dark' ? '#09090a' : '#e0e0e0',
            bgcolor: mode === 'dark' ? '#1c1c1e' : '#fafafa',
            mb: 2,
          }}>
            <Tooltip title={fullScreen ? 'Exit Full Screen' : 'Full Screen'}>
              <IconButton onClick={() => setFullScreen(!fullScreen)} size="small" sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10, color: '#ff6b2b' }}>
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
                value={current.script}
                onChange={val => setCurrent(prev => ({ ...prev, script: val || '' }))}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            </ResizableBox>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button variant="contained" size="small" onClick={handleSave}>Save</Button>
          <Tooltip title="Delete selected">
            <span>
              <Button variant="outlined" color="error" size="small" onClick={handleDelete} disabled={selectedRowIds.length === 0}>
                Delete{selectedRowIds.length > 1 ? ` (${selectedRowIds.length})` : ''}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Clear form">
            <span>
              <Button variant="outlined" size="small" onClick={handleClear} disabled={selectedRowIds.length === 0 && !current.id}>Clear</Button>
            </span>
          </Tooltip>
          <Tooltip title="Duplicate selected">
            <span>
              <Button variant="outlined" size="small" onClick={handleDuplicate} disabled={selectedRowIds.length !== 1}>Duplicate</Button>
            </span>
          </Tooltip>
          {selectedRowIds.length > 0 && (
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>{selectedRowIds.length} selected</Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <DataGrid
            rows={assets} columns={columns} loading={loading}
            rowCount={totalAssets} paginationMode="server"
            paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]} checkboxSelection
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