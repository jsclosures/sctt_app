'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Chip, InputAdornment, alpha
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  SearchRounded, DownloadRounded, CompareArrowsRounded, QueryStatsRounded
} from '@mui/icons-material';
import { getSummaryResults, downloadSummary } from '@/services/testResultsService';

const DeltaCell = ({ value }) => {
  const v = Number(value) || 0;
  const color = v > 100 || v < -100 ? '#e53935' : v !== 0 ? '#ff6b2b' : 'text.secondary';
  const prefix = v > 0 ? '+' : '';
  return (
    <Typography sx={{ fontSize: '0.78rem', fontWeight: v !== 0 ? 600 : 400, color, fontFamily: 'monospace' }}>
      {v !== 0 ? `${prefix}${v}` : '—'}
    </Typography>
  );
};

const SummarizeResults = ({ testName, onCompare }) => {
  const [queryInput, setQueryInput] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortModel, setSortModel] = useState([{ field: 'differencescore', sort: 'desc' }]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const fetchData = async () => {
    if (!testName) return;
    setLoading(true);
    try {
      const sortField = sortModel[0]?.field || 'differencescore';
      const ascending = sortModel[0]?.sort === 'asc';
      const data = await getSummaryResults(testName, queryInput, paginationModel.page, paginationModel.pageSize, sortField, ascending);
      setRows((data.items || []).map((r, i) => ({ ...r, id: r.id || `row-${i}` })));
      setTotal(data.total || 0);
    } catch (e) { console.error('Failed to load summary:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [testName, sortModel, paginationModel]);

  const handleSearch = () => { setPaginationModel(p => ({ ...p, page: 0 })); fetchData(); };
  const handleClear = () => { setQueryInput(''); setPaginationModel(p => ({ ...p, page: 0 })); setTimeout(fetchData, 0); };

  const handleDownload = async () => {
    if (!testName) return;
    try { await downloadSummary(testName); } catch (e) { console.error('Download failed:', e); }
  };

  const columns = [
    {
      field: 'query_txt', headerName: 'Query', flex: 1, minWidth: 180,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'matchscore', headerName: 'Match Score', width: 110, type: 'number',
      renderCell: (p) => <DeltaCell value={p.value} />,
    },
    {
      field: 'qtime', headerName: 'Δ QTime', width: 100, type: 'number',
      description: 'Query time delta (before - after)',
      renderCell: (p) => <DeltaCell value={p.value} />,
    },
    {
      field: 'qtimeb', headerName: 'Before', width: 90, type: 'number',
      renderCell: (p) => <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'text.secondary' }}>{p.value ?? '—'}</Typography>,
    },
    {
      field: 'qtimea', headerName: 'After', width: 90, type: 'number',
      renderCell: (p) => <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'text.secondary' }}>{p.value ?? '—'}</Typography>,
    },
    {
      field: 'differencescore', headerName: 'Δ Count', width: 100, type: 'number',
      description: 'Row count delta',
      renderCell: (p) => <DeltaCell value={p.value} />,
    },
    {
      field: 'rowcountb', headerName: 'Before Ct', width: 100, type: 'number',
      renderCell: (p) => <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'text.secondary' }}>{p.value ?? p.row.rowcountbefore ?? '—'}</Typography>,
    },
    {
      field: 'rowcounta', headerName: 'After Ct', width: 100, type: 'number',
      renderCell: (p) => <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'text.secondary' }}>{p.value ?? p.row.rowcountafter ?? '—'}</Typography>,
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (p) => (
        <Button
          size="small" variant="text"
          endIcon={<CompareArrowsRounded sx={{ fontSize: 13 }} />}
          onClick={(e) => { e.stopPropagation(); onCompare?.(p.row.parentid || p.row.id, p.row.query_txt); }}
          sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#ff6b2b' }}
        >
          Compare
        </Button>
      ),
    },
  ];

  if (!testName) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <QueryStatsRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'text.secondary' }}>Select a test to view summary results</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          size="small" placeholder="Search queries..." value={queryInput}
          onChange={e => setQueryInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ flex: 1, maxWidth: 350 }}
        />
        <Button size="small" variant="outlined" onClick={handleSearch}>Search</Button>
        <Button size="small" variant="text" onClick={handleClear}>Clear</Button>
        <Box sx={{ flex: 1 }} />
        <Chip size="small" label={`${total} results`} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
        <Button
          size="small" variant="contained" startIcon={<DownloadRounded sx={{ fontSize: 14 }} />}
          onClick={handleDownload}
          sx={{ textTransform: 'none', fontSize: '0.76rem' }}
        >
          CSV
        </Button>
      </Stack>

      {/* DataGrid */}
      <Box sx={{ flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={rows} columns={columns} loading={loading}
          rowCount={total} paginationMode="server"
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          sortingMode="server" sortModel={sortModel} onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50]} density="compact" disableRowSelectionOnClick
          onRowClick={(p) => onCompare?.(p.row.parentid || p.row.id, p.row.query_txt)}
          sx={{
            height: '100%',
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(255,107,43,0.04)' },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <QueryStatsRounded sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>No summary data found</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>Run the Summarize script first to generate results.</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default SummarizeResults;