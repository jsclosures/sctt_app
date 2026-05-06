'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Stack, Chip, TextField, Button, Paper,
  InputAdornment, alpha, Tabs, Tab
} from '@mui/material';
import {
  SearchRounded, CompareArrowsRounded, QueryStatsRounded,
  InfoOutlined, FormatListNumberedRounded, ChatBubbleOutlineRounded,
  ArrowForwardRounded
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import SummarizeResults from './SummarizeResults';
import QueryFeedback from './QueryFeedback';
import { restGet, ensureAuth } from '@/lib/api';
import { getSampleQueries, getDetails, getCompareResults } from '@/services/testResultsService';
import { useThemeConfig } from '../../context/themecontext';

const compareColors = (mode) => ({
  same:    mode === 'dark' ? { bg: '#1b3a1b', border: '#2e6b2e', text: '#8fd88f' } : { bg: '#e8f5e9', border: '#a5d6a7', text: '#2e7d32' },
  moved:   mode === 'dark' ? { bg: '#3a3418', border: '#6b6030', text: '#e8d87f' } : { bg: '#fff8e1', border: '#ffe082', text: '#f57f17' },
  missing: mode === 'dark' ? { bg: '#3a1b1b', border: '#6b2e2e', text: '#d88f8f' } : { bg: '#ffebee', border: '#ef9a9a', text: '#c62828' },
});

const TABS = [
  { label: 'Sample Queries', icon: <FormatListNumberedRounded sx={{ fontSize: 14 }} /> },
  { label: 'Details',        icon: <InfoOutlined sx={{ fontSize: 14 }} /> },
  { label: 'Compare',        icon: <CompareArrowsRounded sx={{ fontSize: 14 }} /> },
  { label: 'Summarize',      icon: <QueryStatsRounded sx={{ fontSize: 14 }} /> },
  { label: 'Feedback',       icon: <ChatBubbleOutlineRounded sx={{ fontSize: 14 }} /> },
];

const EmptyState = ({ icon, title, subtitle }) => (
  <Box sx={{ py: 10, textAlign: 'center' }}>
    <Box sx={{ mb: 2, color: 'text.disabled', '& svg': { fontSize: 44 } }}>{icon}</Box>
    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>{subtitle}</Typography>
  </Box>
);

export default function TestResultsPage() {
  const { mode } = useThemeConfig();
  const colors = compareColors(mode);

  const [activeTab, setActiveTab]       = useState(0);
  const [tests, setTests]               = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [loading, setLoading]           = useState(false);
  const [sampleQueries, setSampleQueries] = useState([]);
  const [sampleFilter, setSampleFilter] = useState('');
  const [sampleTotal, setSampleTotal]   = useState(0);
  const [detailsData, setDetailsData]   = useState(null);
  const [compareParentId, setCompareParentId] = useState('');
  const [compareQuery, setCompareQuery] = useState('');
  const [compareLeft, setCompareLeft]   = useState([]);
  const [compareRight, setCompareRight] = useState([]);

  const containerRef = useRef();
  const canvasRef    = useRef();

  useEffect(() => {
    (async () => {
      try {
        await ensureAuth();
        const data = await restGet({ contenttype: 'TEST', action: 'GET', _rows: 100 });
        const items = data.items || [];
        setTests(items);
        if (items.length > 0) setSelectedTest(items[0].testname);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => { if (selectedTest) fetchSamples(); }, [selectedTest]);

  const fetchSamples = async () => {
    if (!selectedTest) return;
    setLoading(true);
    try {
      const data = await getSampleQueries(selectedTest, sampleFilter, 0, 200);
      setSampleQueries(data.items || []);
      setSampleTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 1 && selectedTest) fetchDetails();
  }, [activeTab, selectedTest]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getDetails(selectedTest);
      setDetailsData(data);
    } catch { setDetailsData({ items: [{ error: 'Failed to load' }] }); }
    setLoading(false);
  };

  const handleCompare = async (parentId, queryTxt) => {
    setCompareParentId(parentId);
    setCompareQuery(queryTxt || parentId);
    setActiveTab(2);
    setLoading(true);
    try {
      const data = await getCompareResults(selectedTest, encodeURIComponent(parentId));
      const items = data.items || [];
      setCompareLeft(items.filter(d => d.contenttype === 'BEFORE'));
      setCompareRight(items.filter(d => d.contenttype === 'AFTER'));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab !== 2) return;
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !containerRef.current) return;
      const lefts = Array.from(containerRef.current.querySelectorAll('.left-result'));
      const rights = Array.from(containerRef.current.querySelectorAll('.right-result'));
      const cRect = containerRef.current.getBoundingClientRect();
      canvas.width = cRect.width; canvas.height = cRect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ff6b2b'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      lefts.forEach(left => {
        const right = rights.find(r => r.dataset.docid === left.dataset.docid);
        if (!right) return;
        const lR = left.getBoundingClientRect(), rR = right.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(lR.right - cRect.left, lR.top + lR.height / 2 - cRect.top);
        ctx.lineTo(rR.left - cRect.left, rR.top + rR.height / 2 - cRect.top);
        ctx.stroke();
      });
    };
    const t = setTimeout(() => requestAnimationFrame(draw), 250);
    return () => clearTimeout(t);
  }, [activeTab, compareLeft, compareRight]);

  const getTopDocList = (doc) => doc?.topdoc ? doc.topdoc.split('~').filter(Boolean) : [];

  const sampleColumns = [
    { field: 'query_txt', headerName: 'Query', flex: 1, minWidth: 200 },
    { field: 'testname',  headerName: 'Test', width: 110 },
    {
      field: 'actions', headerName: '', width: 110, sortable: false,
      renderCell: (p) => (
        <Button size="small" variant="text"
          endIcon={<CompareArrowsRounded sx={{ fontSize: 13 }} />}
          onClick={(e) => { e.stopPropagation(); handleCompare(p.row.id, p.row.query_txt); }}
          sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#ff6b2b' }}>
          Compare
        </Button>
      ),
    },
  ];

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
            Test Results
          </Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: '0.78rem' }}>Test</InputLabel>
            <Select value={selectedTest} label="Test"
              onChange={e => setSelectedTest(e.target.value)}
              sx={{ fontSize: '0.8rem' }}>
              {tests.map(t => <MenuItem key={t.id} value={t.testname} sx={{ fontSize: '0.8rem' }}>{t.testname}</MenuItem>)}
            </Select>
          </FormControl>
          {loading && <CircularProgress size={16} sx={{ color: '#ff6b2b' }} />}
        </Stack>
        {selectedTest && (
          <Chip size="small" label={selectedTest}
            sx={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 600, bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b', borderRadius: '5px' }} />
        )}
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ minHeight: 38, px: 2, '& .MuiTab-root': { minHeight: 38, py: 0, textTransform: 'none', fontSize: '0.78rem' } }}>
          {TABS.map(({ label, icon }) => (
            <Tab key={label} label={label} icon={icon} iconPosition="start" sx={{ gap: 0.5 }} />
          ))}
        </Tabs>
      </Box>

      {/* ── Content ──────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* Sample Queries */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <TextField size="small" placeholder="Filter queries..." value={sampleFilter}
                onChange={e => setSampleFilter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSamples()}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>, sx: { fontSize: '0.8rem' } } }}
                sx={{ flex: 1, maxWidth: 380 }}
              />
              <Button size="small" variant="outlined" onClick={fetchSamples} sx={{ textTransform: 'none', fontSize: '0.76rem', height: 32 }}>Search</Button>
              <Button size="small" variant="text" onClick={() => { setSampleFilter(''); setTimeout(fetchSamples, 0); }} sx={{ textTransform: 'none', fontSize: '0.76rem' }}>Clear</Button>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{sampleTotal} queries</Typography>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 300 }}>
              {sampleQueries.length > 0 ? (
                <DataGrid rows={sampleQueries} columns={sampleColumns}
                  pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  density="compact" disableRowSelectionOnClick
                  sx={{ height: '100%', '& .MuiDataGrid-row': { cursor: 'pointer' } }}
                  onRowClick={p => handleCompare(p.row.id, p.row.query_txt)}
                />
              ) : (
                <EmptyState icon={<FormatListNumberedRounded />}
                  title="No sample queries found"
                  subtitle="Run the Build Sample script to generate queries for this test." />
              )}
            </Box>
          </Box>
        )}

        {/* Details */}
        {activeTab === 1 && (
          <Box>
            {detailsData?.items?.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                {detailsData.items.map((item, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    {Object.entries(item).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{key}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                ))}
              </Box>
            ) : (
              <EmptyState icon={<InfoOutlined />}
                title="No details available"
                subtitle={loading ? 'Loading...' : 'Run the Details script to generate test statistics.'} />
            )}
          </Box>
        )}

        {/* Compare */}
        {activeTab === 2 && (
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <TextField size="small" fullWidth placeholder="Enter Parent ID or Query ID..."
                value={compareParentId} onChange={e => setCompareParentId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCompare(compareParentId, compareQuery)}
                sx={{ maxWidth: 480 }}
              />
              <Button variant="contained" size="small"
                onClick={() => handleCompare(compareParentId, compareQuery)}
                disabled={!compareParentId}
                sx={{ textTransform: 'none', fontSize: '0.78rem', height: 32, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
                Compare
              </Button>
            </Stack>

            {compareQuery && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 0.5 }}>
                <SearchRounded sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Query:</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace', color: 'text.primary' }}>{compareQuery}</Typography>
              </Box>
            )}

            {(compareLeft.length > 0 || compareRight.length > 0) ? (
              <Box>
                {/* Legend */}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: 'Same position', c: colors.same },
                    { label: 'Moved',         c: colors.moved },
                    { label: 'Missing',       c: colors.missing },
                  ].map(({ label, c }) => (
                    <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                      <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: c.bg, border: '1px solid', borderColor: c.border }} />
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{label}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box sx={{ position: 'relative' }} ref={containerRef}>
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', zIndex: 2, position: 'relative' }}>

                    {/* BEFORE */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, px: 0.5 }}>
                        <Chip size="small" label="BEFORE"
                          sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: colors.same.bg, color: colors.same.text, height: 20, borderRadius: '4px' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{compareLeft[0]?.source || ''}</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
                          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                            QTime <strong>{compareLeft[0]?.qtime ?? '—'}</strong>
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                            Rows <strong>{compareLeft[0]?.rowcount ?? '—'}</strong>
                          </Typography>
                        </Stack>
                      </Box>
                      {getTopDocList(compareLeft[0]).map((docId, idx) => (
                        <Box key={idx} className="left-result" data-docid={docId} sx={{
                          bgcolor: colors.same.bg, border: '1px solid', borderColor: colors.same.border,
                          mb: 0.5, px: 1.5, py: 0.625, borderRadius: 1.5,
                          display: 'flex', alignItems: 'center', gap: 1,
                        }}>
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: alpha(colors.same.text, 0.6), fontFamily: 'monospace', flexShrink: 0, minWidth: 18 }}>
                            {idx + 1}
                          </Typography>
                          <Typography sx={{ fontSize: '0.74rem', fontFamily: 'monospace', color: colors.same.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {docId}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Center */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 3 }}>
                      <ArrowForwardRounded sx={{ color: 'text.disabled', fontSize: 18 }} />
                    </Box>

                    {/* AFTER */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, px: 0.5 }}>
                        <Chip size="small" label="AFTER"
                          sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b', height: 20, borderRadius: '4px' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{compareRight[0]?.source || ''}</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
                          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                            QTime <strong>{compareRight[0]?.qtime ?? '—'}</strong>
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                            Rows <strong>{compareRight[0]?.rowcount ?? '—'}</strong>
                          </Typography>
                        </Stack>
                      </Box>
                      {getTopDocList(compareRight[0]).map((docId, idx) => {
                        const beforeList = getTopDocList(compareLeft[0]);
                        const beforeIdx = beforeList.indexOf(docId);
                        const c = beforeIdx === idx ? colors.same : beforeIdx >= 0 ? colors.moved : colors.missing;
                        return (
                          <Box key={idx} className="right-result" data-docid={docId} sx={{
                            bgcolor: c.bg, border: '1px solid', borderColor: c.border,
                            mb: 0.5, px: 1.5, py: 0.625, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', gap: 1,
                          }}>
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: alpha(c.text, 0.6), fontFamily: 'monospace', flexShrink: 0, minWidth: 18 }}>
                              {idx + 1}
                            </Typography>
                            <Typography sx={{ fontSize: '0.74rem', fontFamily: 'monospace', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {docId}
                            </Typography>
                            {beforeIdx >= 0 && beforeIdx !== idx && (
                              <Chip size="small" label={`was #${beforeIdx + 1}`}
                                sx={{ ml: 'auto', fontSize: '0.57rem', height: 15, bgcolor: alpha(c.text, 0.1), color: c.text, borderRadius: '3px', flexShrink: 0 }} />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <EmptyState icon={<CompareArrowsRounded />}
                title="No comparison loaded"
                subtitle="Select a query from Sample Queries or Summarize to compare BEFORE vs AFTER." />
            )}
          </Box>
        )}

        {activeTab === 3 && <SummarizeResults testName={selectedTest} onCompare={handleCompare} />}
        {activeTab === 4 && <QueryFeedback testName={selectedTest} />}
      </Box>
    </Box>
  );
}