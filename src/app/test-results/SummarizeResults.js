'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Chip, InputAdornment
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { SearchRounded, DownloadRounded, CompareArrowsRounded, QueryStatsRounded } from '@mui/icons-material';
import { getSummaryResults, downloadSummary } from '@/services/testResultsService';

const DeltaCell = ({ value }) => {
  const v = Number(value) || 0;
  const color = v > 100 || v < -100 ? '#e53935' : v !== 0 ? '#ff6b2b' : 'inherit';
  const prefix = v > 0 ? '+' : '';
  return (
    <Typography sx={{ fontSize: '0.76rem', fontWeight: v !== 0 ? 600 : 400, color: v === 0 ? 'text.disabled' : color, fontFamily: 'monospace' }}>
      {v !== 0 ? `${prefix}${v}` : '—'}
    </Typography>
  );
};

const Mono = ({ value, fallback }) => (
  <Typography sx={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'text.secondary' }}>
    {value ?? fallback ?? '—'}
  </Typography>
);

const SummarizeResults = ({ testName, onCompare }) => {
  const [queryInput, setQueryInput]     = useState('');
  const [rows, setRows]                 = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [sortModel, setSortModel]       = useState([{ field: 'differencescore', sort: 'desc' }]);
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
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [testName, sortModel, paginationModel]);

  const handleSearch = () => { setPaginationModel(p => ({ ...p, page: 0 })); fetchData(); };
  const handleClear  = () => { setQueryInput(''); setPaginationModel(p => ({ ...p, page: 0 })); setTimeout(fetchData, 0); };
  const handleDownload = async () => { if (testName) try { await downloadSummary(testName); } catch (e) { console.error(e); } };

  const columns = [
    {
      field: 'query_txt', headerName: 'Query', flex: 1, minWidth: 180,
      renderCell: p => <Typography sx={{ fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.value}</Typography>,
    },
    { field: 'matchscore',     headerName: 'Match',    width: 90,  type: 'number', renderCell: p => <DeltaCell value={p.value} /> },
    { field: 'qtime',          headerName: 'Δ QTime',  width: 90,  type: 'number', renderCell: p => <DeltaCell value={p.value} /> },
    { field: 'qtimeb',         headerName: 'Bef QT',   width: 80,  type: 'number', renderCell: p => <Mono value={p.value} /> },
    { field: 'qtimea',         headerName: 'Aft QT',   width: 80,  type: 'number', renderCell: p => <Mono value={p.value} /> },
    { field: 'differencescore',headerName: 'Δ Count',  width: 90,  type: 'number', renderCell: p => <DeltaCell value={p.value} /> },
    { field: 'rowcountb',      headerName: 'Bef Ct',   width: 80,  type: 'number', renderCell: p => <Mono value={p.value ?? p.row.rowcountbefore} /> },
    { field: 'rowcounta',      headerName: 'Aft Ct',   width: 80,  type: 'number', renderCell: p => <Mono value={p.value ?? p.row.rowcountafter} /> },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: p => (
        <Button size="small" variant="text"
          endIcon={<CompareArrowsRounded sx={{ fontSize: 12 }} />}
          onClick={e => { e.stopPropagation(); onCompare?.(p.row.parentid || p.row.id, p.row.query_txt); }}
          sx={{ fontSize: '0.68rem', textTransform: 'none', color: '#ff6b2b' }}>
          Compare
        </Button>
      ),
    },
  ];

  if (!testName) return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <QueryStatsRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>Select a test to view summary results</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="Search queries..." value={queryInput}
          onChange={e => setQueryInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment>, sx: { fontSize: '0.8rem' } } }}
          sx={{ flex: 1, maxWidth: 340 }}
        />
        <Button size="small" variant="outlined" onClick={handleSearch} sx={{ textTransform: 'none', fontSize: '0.76rem', height: 32 }}>Search</Button>
        <Button size="small" variant="text" onClick={handleClear} sx={{ textTransform: 'none', fontSize: '0.76rem' }}>Clear</Button>
        <Box sx={{ flex: 1 }} />
        <Chip size="small" label={`${total} results`} sx={{ fontWeight: 600, fontSize: '0.68rem', borderRadius: '5px' }} />
        <Button size="small" variant="contained"
          startIcon={<DownloadRounded sx={{ fontSize: 13 }} />}
          onClick={handleDownload}
          sx={{ textTransform: 'none', fontSize: '0.74rem', height: 30, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
          CSV
        </Button>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={rows} columns={columns} loading={loading}
          rowCount={total} paginationMode="server"
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          sortingMode="server" sortModel={sortModel} onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50]} density="compact" disableRowSelectionOnClick
          onRowClick={p => onCompare?.(p.row.parentid || p.row.id, p.row.query_txt)}
          sx={{
            height: '100%',
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(255,107,43,0.03)' },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <QueryStatsRounded sx={{ fontSize: 38, color: 'text.disabled', mb: 1 }} />
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>No summary data found</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>Run the Summarize script first.</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default SummarizeResults;