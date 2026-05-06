'use client';

import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Chip,
  CircularProgress, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  PlayArrowRounded, NavigateBeforeRounded, NavigateNextRounded,
  FirstPageRounded, BarChartRounded, SpeedRounded, DatasetRounded
} from '@mui/icons-material';
import { getRealTimeMetrics, getPageMetrics, collectMetrics } from '@/services/analyzeService';
import { useThemeConfig } from '../../context/themecontext';

const DEFAULT_REGEX = '^[a-zA-Z0-9._/]+$';

const TABS = [
  { label: 'Real Time',    icon: <SpeedRounded sx={{ fontSize: 14 }} /> },
  { label: 'Page Metrics', icon: <BarChartRounded sx={{ fontSize: 14 }} /> },
  { label: 'Metrics',      icon: <DatasetRounded sx={{ fontSize: 14 }} /> },
];

const Field = ({ label, value, onChange, placeholder, monospace }) => (
  <Box>
    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled', mb: 0.5 }}>
      {label}
    </Typography>
    <TextField size="small" fullWidth value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.78rem', ...(monospace ? { fontFamily: 'monospace' } : {}) } }}
    />
  </Box>
);

function ResultsTable({ rows, isDark }) {
  if (!rows || rows.length === 0) return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>No results</Typography>
    </Box>
  );
  return (
    <TableContainer sx={{ maxHeight: '100%', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {Object.keys(rows[0]).map(k => (
              <TableCell key={k} sx={{
                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'text.disabled',
                bgcolor: isDark ? '#111112' : '#f9f9fa',
                borderBottom: '1px solid', borderColor: 'divider',
                py: 1, px: 1.5,
              }}>
                {k}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              {Object.values(row).map((val, j) => (
                <TableCell key={j} sx={{
                  fontSize: '0.74rem', fontFamily: 'monospace',
                  py: 0.75, px: 1.5, borderColor: 'divider',
                  maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function flattenMetrics(obj, prefix = '') {
  const rows = [];
  if (!obj || typeof obj !== 'object') return rows;
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix} › ${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      rows.push(...flattenMetrics(val, path));
    } else {
      rows.push({ path, value: Array.isArray(val) ? val.join(', ') : String(val ?? '') });
    }
  }
  return rows;
}

function parseResult(data) {
  if (!data || data.error) return { error: data?.error || 'Unknown error', rows: [] };
  let parsed = data;
  if (data.payload) {
    try { parsed = JSON.parse(data.payload); } catch { return { rows: [], raw: data.payload }; }
  }
  if (parsed.response?.docs) {
    const docs = parsed.response.docs;
    if (docs.length === 0) return { rows: [] };
    const keys = Object.keys(docs[0]).filter(k => !k.startsWith('_'));
    return { rows: docs.map(d => Object.fromEntries(keys.map(k => [k, d[k]]))) };
  }
  if (parsed.docs && Array.isArray(parsed.docs)) {
    return { rows: flattenMetrics(parsed.docs[0] || {}).map(r => ({ 'Metric Path': r.path, Value: r.value })) };
  }
  return { rows: flattenMetrics(parsed).map(r => ({ 'Metric Path': r.path, Value: r.value })) };
}

export default function AnalyzePage() {
  const { mode } = useThemeConfig();
  const isDark = mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);

  const [rtKey, setRtKey]               = useState('');
  const [rtUrl, setRtUrl]               = useState('');
  const [rtCollection, setRtCollection] = useState(DEFAULT_REGEX);
  const [rtHandler, setRtHandler]       = useState(DEFAULT_REGEX);
  const [rtMetric, setRtMetric]         = useState(DEFAULT_REGEX);
  const [rtResult, setRtResult]         = useState(null);
  const [rtLoading, setRtLoading]       = useState(false);

  const [pmTestName, setPmTestName]     = useState('');
  const [pmPage, setPmPage]             = useState(0);
  const [pmResult, setPmResult]         = useState(null);
  const [pmLoading, setPmLoading]       = useState(false);

  const [mTestName, setMTestName]       = useState('');
  const [mCollection, setMCollection]   = useState(DEFAULT_REGEX);
  const [mHandler, setMHandler]         = useState(DEFAULT_REGEX);
  const [mMetric, setMMetric]           = useState(DEFAULT_REGEX);
  const [mResult, setMResult]           = useState(null);
  const [mLoading, setMLoading]         = useState(false);

  const handleRealTime = async () => {
    setRtLoading(true); setRtResult(null);
    try {
      const data = await getRealTimeMetrics(rtUrl || undefined);
      const collRe = new RegExp(rtCollection || '.*');
      const handRe = new RegExp(rtHandler || '.*');
      const metRe  = new RegExp(rtMetric || '.*');
      const keyRe  = rtKey ? new RegExp(rtKey) : null;
      const metrics = data?.metrics || data;
      const filtered = {};
      for (const [gk, gv] of Object.entries(metrics || {})) {
        if (keyRe && !keyRe.test(gk)) continue;
        if (!collRe.test(gk)) continue;
        if (typeof gv !== 'object') continue;
        const fg = {};
        for (const [hk, hv] of Object.entries(gv)) {
          if (!handRe.test(hk) || typeof hv !== 'object') continue;
          const fh = {};
          for (const [mk, mv] of Object.entries(hv)) {
            if (metRe.test(mk)) fh[mk] = mv;
          }
          if (Object.keys(fh).length) fg[hk] = fh;
        }
        if (Object.keys(fg).length) filtered[gk] = fg;
      }
      setRtResult(filtered);
    } catch (e) { setRtResult({ error: e.message }); }
    setRtLoading(false);
  };

  const fetchPageMetrics = async (page) => {
    setPmLoading(true); setPmResult(null);
    try {
      const data = await getPageMetrics(pmTestName, page, 1);
      setPmResult(data);
    } catch (e) { setPmResult({ error: e.message }); }
    setPmLoading(false);
  };

  const handleCollect = async () => {
    setMLoading(true); setMResult(null);
    try {
      const data = await collectMetrics(mTestName, mCollection, mHandler, mMetric);
      setMResult(data);
    } catch (e) { setMResult({ error: e.message }); }
    setMLoading(false);
  };

  const rtParsed = rtResult ? (rtResult.error ? null : { rows: flattenMetrics(rtResult).map(r => ({ 'Metric Path': r.path, Value: r.value })) }) : null;
  const pmParsed = pmResult ? parseResult(pmResult) : null;
  const mParsed  = mResult  ? parseResult(mResult)  : null;

  const isLoading = [rtLoading, pmLoading, mLoading][activeTab];
  const result    = [rtResult, pmResult, mResult][activeTab];
  const parsed    = [rtParsed, pmParsed, mParsed][activeTab];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 1.5, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid',
        borderColor: 'divider', flexShrink: 0, minHeight: 52,
      }}>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Analyze
        </Typography>

        {/* Action buttons in top bar */}
        <Stack direction="row" spacing={1} alignItems="center">
          {isLoading && <CircularProgress size={16} sx={{ color: '#ff6b2b' }} />}

          {activeTab === 0 && (
            <Button size="small" variant="contained" onClick={handleRealTime} disabled={rtLoading}
              startIcon={rtLoading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <PlayArrowRounded sx={{ fontSize: 16 }} />}
              sx={{ height: 30, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600, px: 2, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
              {rtLoading ? 'Fetching...' : 'Analyze'}
            </Button>
          )}

          {activeTab === 1 && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Chip size="small" label={`Page ${pmPage}`}
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace', borderRadius: '5px' }} />
              <Button size="small" variant="outlined" onClick={() => { setPmPage(0); fetchPageMetrics(0); }}
                sx={{ minWidth: 32, height: 30, p: 0 }} disabled={pmLoading}>
                <FirstPageRounded sx={{ fontSize: 15 }} />
              </Button>
              <Button size="small" variant="outlined" onClick={() => { const p = Math.max(0, pmPage - 1); setPmPage(p); fetchPageMetrics(p); }}
                sx={{ minWidth: 32, height: 30, p: 0 }} disabled={pmPage === 0 || pmLoading}>
                <NavigateBeforeRounded sx={{ fontSize: 16 }} />
              </Button>
              <Button size="small" variant="outlined" onClick={() => { const p = pmPage + 1; setPmPage(p); fetchPageMetrics(p); }}
                sx={{ minWidth: 32, height: 30, p: 0 }} disabled={pmLoading}>
                <NavigateNextRounded sx={{ fontSize: 16 }} />
              </Button>
              <Button size="small" variant="contained" onClick={() => fetchPageMetrics(pmPage)} disabled={pmLoading}
                startIcon={<PlayArrowRounded sx={{ fontSize: 16 }} />}
                sx={{ height: 30, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600, px: 1.5, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
                Load
              </Button>
            </Stack>
          )}

          {activeTab === 2 && (
            <Button size="small" variant="contained" onClick={handleCollect} disabled={mLoading}
              startIcon={mLoading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <PlayArrowRounded sx={{ fontSize: 16 }} />}
              sx={{ height: 30, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600, px: 2, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
              {mLoading ? 'Collecting...' : 'Collect'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ minHeight: 38, px: 2, '& .MuiTab-root': { minHeight: 38, py: 0, textTransform: 'none', fontSize: '0.78rem' } }}>
          {TABS.map(({ label, icon }) => (
            <Tab key={label} label={label} icon={icon} iconPosition="start" sx={{ gap: 0.5 }} />
          ))}
        </Tabs>
      </Box>

      {/* ── Body: split panel ─────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: form fields ────────────────────────────────── */}
        <Box sx={{
          width: 280, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider',
          overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          {activeTab === 0 && (
            <>
              <Field label="Key" value={rtKey} onChange={setRtKey} placeholder="Optional filter key" />
              <Field label="URL" value={rtUrl} onChange={setRtUrl} placeholder="http://solrserver:8983/solr/admin/metrics?wt=json" monospace />
              <Field label="Collection" value={rtCollection} onChange={setRtCollection} placeholder={DEFAULT_REGEX} monospace />
              <Field label="Handler" value={rtHandler} onChange={setRtHandler} placeholder={DEFAULT_REGEX} monospace />
              <Field label="Metric" value={rtMetric} onChange={setRtMetric} placeholder={DEFAULT_REGEX} monospace />
            </>
          )}

          {activeTab === 1 && (
            <Field label="Test Name" value={pmTestName} onChange={setPmTestName} placeholder="e.g. skuC" />
          )}

          {activeTab === 2 && (
            <>
              <Field label="Test Name" value={mTestName} onChange={setMTestName} placeholder="e.g. skuC" />
              <Field label="Collection" value={mCollection} onChange={setMCollection} placeholder={DEFAULT_REGEX} monospace />
              <Field label="Handler" value={mHandler} onChange={setMHandler} placeholder={DEFAULT_REGEX} monospace />
              <Field label="Metric" value={mMetric} onChange={setMMetric} placeholder={DEFAULT_REGEX} monospace />
            </>
          )}
        </Box>

        {/* ── RIGHT: results ───────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{
            px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
          }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled' }}>
              Results
            </Typography>
            {parsed?.rows?.length > 0 && (
              <Chip size="small" label={`${parsed.rows.length} rows`}
                sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, borderRadius: '4px' }} />
            )}
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoading ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#ff6b2b' }} />
              </Box>
            ) : !result ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                  {activeTab === 0 ? 'Configure filters and click Analyze.' :
                   activeTab === 1 ? 'Enter a test name and click Load.' :
                   'Enter a test name and click Collect.'}
                </Typography>
              </Box>
            ) : result.error || parsed?.error ? (
              <Box sx={{ p: 2.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'error.main', fontFamily: 'monospace' }}>
                  {result.error || parsed?.error}
                </Typography>
              </Box>
            ) : parsed?.raw ? (
              <Box sx={{ p: 2.5 }}>
                <pre style={{ fontSize: '0.76rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                  {parsed.raw}
                </pre>
              </Box>
            ) : (
              <ResultsTable rows={parsed?.rows || []} isDark={isDark} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}