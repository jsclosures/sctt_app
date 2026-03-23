'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TableSortLabel,
  Tooltip,
  Button,
  Stack,
  CircularProgress
} from '@mui/material';
import { getSummaryResults, downloadSummary } from '@/services/testResultsService';

const getDeltaColor = (value) => {
  if (value > 100 || value < -100) return 'red';
  if (value !== 0) return 'orange';
  return 'inherit';
};

const SummarizeResults = ({ testName, onCompare }) => {
  const [queryInput, setQueryInput] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('differencescore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchData = async () => {
    if (!testName) return;
    setLoading(true);
    try {
      const data = await getSummaryResults(
        testName,
        queryInput,
        page,
        pageSize,
        sortBy,
        sortDirection === 'asc'
      );
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to load summary:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [testName, sortBy, sortDirection, page]);

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const handleClear = () => {
    setQueryInput('');
    setPage(0);
    setTimeout(fetchData, 0);
  };

  const handleDownload = async () => {
    if (!testName) return;
    try {
      await downloadSummary(testName);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!testName) {
    return (
      <Box p={2}>
        <Typography color="text.secondary">Select a test to view summary results.</Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Summarize Results — {testName}
      </Typography>

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          label="Query"
          size="small"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} variant="outlined" size="small">Search</Button>
        <Button onClick={handleClear} variant="outlined" size="small">Clear</Button>
        <Button onClick={handleDownload} variant="contained" size="small">Download CSV</Button>
        {loading && <CircularProgress size={20} />}
        <Typography variant="caption" color="text.secondary">
          {total} results
        </Typography>
      </Stack>

      <TableContainer sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'query_txt'}
                  direction={sortDirection}
                  onClick={() => handleSort('query_txt')}
                >
                  Query
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <Tooltip title="Match Score — how much result ordering changed">
                  <TableSortLabel
                    active={sortBy === 'matchscore'}
                    direction={sortDirection}
                    onClick={() => handleSort('matchscore')}
                  >
                    MScore
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="QTime delta (before minus after)">
                  <TableSortLabel
                    active={sortBy === 'qtime'}
                    direction={sortDirection}
                    onClick={() => handleSort('qtime')}
                  >
                    Δ QTime
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
              <TableCell>Before</TableCell>
              <TableCell>After</TableCell>
              <TableCell>
                <Tooltip title="Row count delta">
                  <TableSortLabel
                    active={sortBy === 'differencescore'}
                    direction={sortDirection}
                    onClick={() => handleSort('differencescore')}
                  >
                    Δ Count
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
              <TableCell>Before Ct</TableCell>
              <TableCell>After Ct</TableCell>
              <TableCell>Compare</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id || i} hover sx={{ cursor: 'pointer' }}>
                <TableCell>{row.query_txt}</TableCell>
                <TableCell sx={{ color: getDeltaColor(row.matchscore || 0) }}>
                  {row.matchscore ?? '—'}
                </TableCell>
                <TableCell sx={{ color: getDeltaColor(row.qtime || 0) }}>
                  {row.qtime ?? '—'}
                </TableCell>
                <TableCell>{row.qtimeb ?? '—'}</TableCell>
                <TableCell>{row.qtimea ?? '—'}</TableCell>
                <TableCell sx={{ color: getDeltaColor(row.rowcount || 0) }}>
                  {row.rowcount ?? '—'}
                </TableCell>
                <TableCell>{row.rowcountb ?? row.rowcountbefore ?? '—'}</TableCell>
                <TableCell>{row.rowcounta ?? row.rowcountafter ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onCompare && onCompare(row.parentid || row.id, row.query_txt)}
                  >
                    Compare
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No summary data found. Run the summarize script first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > pageSize && (
        <Stack direction="row" spacing={2} mt={2} justifyContent="center">
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)} size="small">
            Previous
          </Button>
          <Typography variant="caption" sx={{ lineHeight: '30px' }}>
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </Typography>
          <Button disabled={(page + 1) * pageSize >= total} onClick={() => setPage(p => p + 1)} size="small">
            Next
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default SummarizeResults;