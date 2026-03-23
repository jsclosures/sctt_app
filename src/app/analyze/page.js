'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  getRealTimeMetrics,
  getPageMetrics,
  collectMetrics
} from '@/services/analyzeService';

const DEFAULT_REGEX = '^[a-zA-Z0-9._/]+$';

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState(0);

  // ─── Real Time state ──────────────────────────────────────────────
  const [rtKey, setRtKey] = useState('');
  const [rtUrl, setRtUrl] = useState('');
  const [rtCollection, setRtCollection] = useState(DEFAULT_REGEX);
  const [rtHandler, setRtHandler] = useState(DEFAULT_REGEX);
  const [rtMetric, setRtMetric] = useState(DEFAULT_REGEX);
  const [rtResult, setRtResult] = useState(null);
  const [rtLoading, setRtLoading] = useState(false);

  // ─── Page Metrics state ───────────────────────────────────────────
  const [pmTestName, setPmTestName] = useState('');
  const [pmCollection, setPmCollection] = useState(DEFAULT_REGEX);
  const [pmHandler, setPmHandler] = useState(DEFAULT_REGEX);
  const [pmMetric, setPmMetric] = useState(DEFAULT_REGEX);
  const [pmPage, setPmPage] = useState(0);
  const [pmResult, setPmResult] = useState(null);
  const [pmLoading, setPmLoading] = useState(false);

  // ─── Metrics state ────────────────────────────────────────────────
  const [mTestName, setMTestName] = useState('');
  const [mCollection, setMCollection] = useState(DEFAULT_REGEX);
  const [mHandler, setMHandler] = useState(DEFAULT_REGEX);
  const [mMetric, setMMetric] = useState(DEFAULT_REGEX);
  const [mResult, setMResult] = useState(null);
  const [mLoading, setMLoading] = useState(false);

  // ─── Real Time handlers ───────────────────────────────────────────
  const handleAnalyze = async () => {
    setRtLoading(true);
    setRtResult(null);
    try {
      const data = await getRealTimeMetrics(rtUrl || undefined);
      setRtResult(data);
    } catch (e) {
      console.error('Real Time fetch failed:', e);
      setRtResult({ error: e.message });
    }
    setRtLoading(false);
  };

  // Filter RT results client-side using the regex fields
  const filterMetrics = (data) => {
    if (!data || data.error) return null;

    try {
      const collRe = new RegExp(rtCollection || '.*');
      const handRe = new RegExp(rtHandler || '.*');
      const metRe = new RegExp(rtMetric || '.*');
      const keyRe = rtKey ? new RegExp(rtKey) : null;

      const metrics = data.metrics || data;
      const filtered = {};

      for (const [groupKey, groupVal] of Object.entries(metrics)) {
        if (keyRe && !keyRe.test(groupKey)) continue;
        if (!collRe.test(groupKey)) continue;

        if (typeof groupVal === 'object' && groupVal !== null) {
          const filteredGroup = {};
          for (const [handlerKey, handlerVal] of Object.entries(groupVal)) {
            if (!handRe.test(handlerKey)) continue;
            if (typeof handlerVal === 'object' && handlerVal !== null) {
              const filteredHandler = {};
              for (const [metricKey, metricVal] of Object.entries(handlerVal)) {
                if (!metRe.test(metricKey)) continue;
                filteredHandler[metricKey] = metricVal;
              }
              if (Object.keys(filteredHandler).length > 0) {
                filteredGroup[handlerKey] = filteredHandler;
              }
            }
          }
          if (Object.keys(filteredGroup).length > 0) {
            filtered[groupKey] = filteredGroup;
          }
        }
      }
      return filtered;
    } catch (e) {
      return data;
    }
  };

  // ─── Page Metrics handlers ────────────────────────────────────────
  const handlePageMetricsStart = async () => {
    setPmPage(0);
    await fetchPageMetrics(0);
  };

  const handlePageMetricsPrev = async () => {
    const newPage = Math.max(0, pmPage - 1);
    setPmPage(newPage);
    await fetchPageMetrics(newPage);
  };

  const handlePageMetricsNext = async () => {
    const newPage = pmPage + 1;
    setPmPage(newPage);
    await fetchPageMetrics(newPage);
  };

  const fetchPageMetrics = async (page) => {
    setPmLoading(true);
    setPmResult(null);
    try {
      const data = await getPageMetrics(pmTestName, page, 1);
      setPmResult(data);
    } catch (e) {
      console.error('Page Metrics fetch failed:', e);
      setPmResult({ error: e.message });
    }
    setPmLoading(false);
  };

  // ─── Collect Metrics handler ──────────────────────────────────────
  const handleCollect = async () => {
    setMLoading(true);
    setMResult(null);
    try {
      const data = await collectMetrics(mTestName, mCollection, mHandler, mMetric);
      setMResult(data);
    } catch (e) {
      console.error('Collect Metrics failed:', e);
      setMResult({ error: e.message });
    }
    setMLoading(false);
  };

  // ─── Render metric data as a table ────────────────────────────────
  const renderMetricData = (data) => {
    if (!data) return null;
    if (data.error) {
      return <Typography color="error">{data.error}</Typography>;
    }

    // Handle payload responses (PAGEMETRIC and COLLECTMETRIC return {payload: "..."})
    let parsed = data;
    if (data.payload) {
      try {
        parsed = JSON.parse(data.payload);
      } catch {
        return (
          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
            <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{data.payload}</pre>
          </Box>
        );
      }
    }

    // If it's a Solr response with response.docs
    if (parsed.response && parsed.response.docs) {
      const docs = parsed.response.docs;
      if (docs.length === 0) return <Typography color="text.secondary">No data</Typography>;
      const keys = Object.keys(docs[0]).filter(k => !k.startsWith('_'));
      return (
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {keys.map(k => <TableCell key={k}><strong>{k}</strong></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc, i) => (
                <TableRow key={i}>
                  {keys.map(k => (
                    <TableCell key={k} sx={{ fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {typeof doc[k] === 'object' ? JSON.stringify(doc[k]) : String(doc[k] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // If it has docs array (COLLECTMETRIC shape: {numFound, docs: [...]})
    if (parsed.docs && Array.isArray(parsed.docs)) {
      return renderNestedMetrics(parsed.docs[0] || {});
    }

    // Generic object — render as nested JSON tree
    return renderNestedMetrics(parsed);
  };

  const renderNestedMetrics = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    const rows = [];
    const flatten = (o, prefix = '') => {
      for (const [key, val] of Object.entries(o)) {
        const path = prefix ? `${prefix} → ${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          flatten(val, path);
        } else {
          rows.push({ path, value: Array.isArray(val) ? val.join(', ') : String(val) });
        }
      }
    };
    flatten(obj);

    if (rows.length === 0) return <Typography color="text.secondary">No metrics data</Typography>;

    return (
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Metric Path</strong></TableCell>
              <TableCell><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{r.path}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{r.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ─── Field row component ──────────────────────────────────────────
  const FieldRow = ({ label, value, onChange, placeholder }) => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
      <Typography variant="body2" sx={{ minWidth: 100, fontWeight: 500 }}>{label}</Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        sx={{ maxWidth: 400 }}
      />
    </Stack>
  );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analyze
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Real Time" />
        <Tab label="Page Metrics" />
        <Tab label="Metrics" />
      </Tabs>

      {/* ─── Tab 0: Real Time ──────────────────────────────────────── */}
      {activeTab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FieldRow label="Key" value={rtKey} onChange={setRtKey} placeholder="Optional filter key" />
          <FieldRow label="URL" value={rtUrl} onChange={setRtUrl} placeholder="e.g. http://solrserver:8983/solr/admin/metrics?wt=json" />
          <FieldRow label="Collection" value={rtCollection} onChange={setRtCollection} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Handler" value={rtHandler} onChange={setRtHandler} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Metric" value={rtMetric} onChange={setRtMetric} placeholder={DEFAULT_REGEX} />

          <Stack direction="row" spacing={2} mt={2} alignItems="center">
            <Button variant="contained" size="small" onClick={handleAnalyze}>Analyze</Button>
            {rtLoading && <CircularProgress size={20} />}
          </Stack>

          {rtResult && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Results</Typography>
              {rtResult.error ? (
                <Typography color="error">{rtResult.error}</Typography>
              ) : (
                renderNestedMetrics(filterMetrics(rtResult) || rtResult)
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Tab 1: Page Metrics ───────────────────────────────────── */}
      {activeTab === 1 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FieldRow label="Test Name" value={pmTestName} onChange={setPmTestName} placeholder="e.g. listC" />
          <FieldRow label="Collection" value={pmCollection} onChange={setPmCollection} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Handler" value={pmHandler} onChange={setPmHandler} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Metric" value={pmMetric} onChange={setPmMetric} placeholder={DEFAULT_REGEX} />

          <Stack direction="row" spacing={2} mt={2} alignItems="center">
            <Button variant="outlined" size="small" onClick={handlePageMetricsStart}>Start</Button>
            <Button variant="outlined" size="small" onClick={handlePageMetricsPrev} disabled={pmPage === 0}>Previous</Button>
            <Button variant="outlined" size="small" onClick={handlePageMetricsNext}>Next</Button>
            <Typography variant="caption" color="text.secondary">Page: {pmPage}</Typography>
            {pmLoading && <CircularProgress size={20} />}
          </Stack>

          {pmResult && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Page Metrics — Page {pmPage}</Typography>
              {renderMetricData(pmResult)}
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Tab 2: Metrics (Collect) ──────────────────────────────── */}
      {activeTab === 2 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FieldRow label="Test Name" value={mTestName} onChange={setMTestName} placeholder="e.g. listC" />
          <FieldRow label="Collection" value={mCollection} onChange={setMCollection} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Handler" value={mHandler} onChange={setMHandler} placeholder={DEFAULT_REGEX} />
          <FieldRow label="Metric" value={mMetric} onChange={setMMetric} placeholder={DEFAULT_REGEX} />

          <Stack direction="row" spacing={2} mt={2} alignItems="center">
            <Button variant="contained" size="small" onClick={handleCollect}>Collect</Button>
            {mLoading && <CircularProgress size={20} />}
          </Stack>

          {mResult && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Collected Metrics</Typography>
              {renderMetricData(mResult)}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}