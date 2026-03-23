'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import SummarizeResults from './SummarizeResults';
import QueryFeedback from './QueryFeedback';
import { restGet, ensureAuth } from '@/lib/api';
import {
  getSampleQueries,
  getDetails,
  getCompareResults
} from '@/services/testResultsService';

export default function TestResultsPage() {
  // ─── State ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [loading, setLoading] = useState(false);

  // Sample Queries tab
  const [queryText, setQueryText] = useState('');
  const [sampleQueries, setSampleQueries] = useState([]);
  const [sampleFilter, setSampleFilter] = useState('');
  const [sampleTotal, setSampleTotal] = useState(0);

  // Details tab
  const [detailsData, setDetailsData] = useState(null);

  // Compare tab
  const [compareParentId, setCompareParentId] = useState('');
  const [compareQuery, setCompareQuery] = useState('');
  const [compareLeft, setCompareLeft] = useState([]);
  const [compareRight, setCompareRight] = useState([]);

  const containerRef = useRef();
  const canvasRef = useRef();

  // ─── Load tests on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchTests = async () => {
      try {
        await ensureAuth();
        const data = await restGet({ contenttype: 'TEST', action: 'GET', _rows: 100 });
        const items = data.items || [];
        setTests(items);
        if (items.length > 0) {
          setSelectedTest(items[0].testname);
        }
      } catch (e) {
        console.error('Failed to load tests:', e);
      }
    };
    fetchTests();
  }, []);

  // ─── Load sample queries when test changes ────────────────────────
  useEffect(() => {
    if (selectedTest) {
      fetchSamples();
    }
  }, [selectedTest]);

  const fetchSamples = async () => {
    if (!selectedTest) return;
    setLoading(true);
    try {
      const data = await getSampleQueries(selectedTest, sampleFilter, 0, 200);
      setSampleQueries(data.items);
      setSampleTotal(data.total);
    } catch (e) {
      console.error('Failed to load samples:', e);
    }
    setLoading(false);
  };

  // ─── Fetch details when Details tab selected ──────────────────────
  useEffect(() => {
    if (activeTab === 1 && selectedTest) {
      fetchDetails();
    }
  }, [activeTab, selectedTest]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getDetails(selectedTest);
      setDetailsData(data);
    } catch (e) {
      console.error('Failed to load details:', e);
      setDetailsData({ items: [{ error: 'Failed to load details' }] });
    }
    setLoading(false);
  };

  // ─── Compare ──────────────────────────────────────────────────────
  const handleCompare = async (parentId, queryTxt) => {
    setCompareParentId(parentId);
    setCompareQuery(queryTxt || parentId);
    setActiveTab(2);
    setLoading(true);
    try {
      const data = await getCompareResults(selectedTest, parentId);
      const items = data.items || [];
      // Split into BEFORE and AFTER docs
      const before = items.filter(d => d.contenttype === 'BEFORE');
      const after = items.filter(d => d.contenttype === 'AFTER');
      setCompareLeft(before);
      setCompareRight(after);
    } catch (e) {
      console.error('Failed to load compare results:', e);
    }
    setLoading(false);
  };

  const handleCompareSearch = async () => {
    if (!compareParentId || !selectedTest) return;
    await handleCompare(compareParentId, compareQuery);
  };

  // ─── Draw connecting lines for compare view ───────────────────────
  useEffect(() => {
    if (activeTab !== 2) return;
    const drawLines = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !containerRef.current) return;

      const leftItems = Array.from(containerRef.current.querySelectorAll('.left-result'));
      const rightItems = Array.from(containerRef.current.querySelectorAll('.right-result'));
      const lines = [];

      leftItems.forEach((left) => {
        const leftId = left.dataset.docid;
        if (!leftId) return;
        const matchIndex = rightItems.findIndex((right) => right.dataset.docid === leftId);
        if (matchIndex !== -1) {
          const leftRect = left.getBoundingClientRect();
          const rightRect = rightItems[matchIndex].getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          lines.push({
            x1: leftRect.right - containerRect.left,
            y1: leftRect.top + leftRect.height / 2 - containerRect.top,
            x2: rightRect.left - containerRect.left,
            y2: rightRect.top + rightRect.height / 2 - containerRect.top
          });
        }
      });

      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ff6b2b';
      ctx.lineWidth = 1;
      lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      });
    };

    const timeout = setTimeout(() => requestAnimationFrame(drawLines), 200);
    return () => clearTimeout(timeout);
  }, [activeTab, compareLeft, compareRight]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getTopDocList = (doc) => {
    if (!doc || !doc.topdoc) return [];
    return doc.topdoc.split('~').filter(Boolean);
  };

  const getMatchColor = (leftDoc, rightDoc) => {
    if (!leftDoc || !rightDoc) return '#4c1c1c';
    const leftList = getTopDocList(leftDoc);
    const rightList = getTopDocList(rightDoc);
    if (leftList.length === 0 || rightList.length === 0) return '#4c1c1c';
    const matchCount = leftList.filter(item => rightList.includes(item)).length;
    if (matchCount === leftList.length) return '#1e4620';
    if (matchCount > 0) return '#4e4308';
    return '#4c1c1c';
  };

  return (
    <Box p={3}>
      <Stack direction="row" spacing={3} alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Test Results</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Test</InputLabel>
          <Select
            value={selectedTest}
            label="Test"
            onChange={(e) => setSelectedTest(e.target.value)}
          >
            {tests.map((t) => (
              <MenuItem key={t.id} value={t.testname}>{t.testname}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {loading && <CircularProgress size={20} />}
      </Stack>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Sample Queries" />
        <Tab label="Details" />
        <Tab label="Compare Results" />
        <Tab label="Summarize Results" />
        <Tab label="Query Feedback" />
      </Tabs>

      {/* ─── Tab 0: Sample Queries ─────────────────────────────────── */}
      {activeTab === 0 && (
        <Box>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <TextField
                label="Filter Queries"
                size="small"
                value={sampleFilter}
                onChange={(e) => setSampleFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSamples()}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" size="small" onClick={fetchSamples}>Search</Button>
              <Button variant="outlined" size="small" onClick={() => { setSampleFilter(''); setTimeout(fetchSamples, 0); }}>Clear</Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {sampleTotal} queries found for test "{selectedTest}"
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Saved Queries</Typography>
            <Grid container spacing={1}>
              {sampleQueries.map((item) => (
                <Grid
                  key={item.id}
                  container
                  item
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                    px: 2, py: 1,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <Grid item xs={6}>
                    <Typography variant="body2">{item.query_txt}</Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => handleCompare(item.id, item.query_txt)}
                    >
                      Compare
                    </Button>
                  </Grid>
                </Grid>
              ))}
              {sampleQueries.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No sample queries found. Run the Build Sample script first.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* ─── Tab 1: Details ────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Test Details — {selectedTest}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {detailsData && detailsData.items ? (
            <Box>
              {detailsData.items.map((item, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  {Object.entries(item).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </Typography>
                  ))}
                  {i < detailsData.items.length - 1 && <Divider sx={{ my: 1 }} />}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading...' : 'No details available. Select a test and switch to this tab.'}
            </Typography>
          )}
        </Paper>
      )}

      {/* ─── Tab 2: Compare Results ────────────────────────────────── */}
      {activeTab === 2 && (
        <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Compare Results — {selectedTest}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <TextField
              label="Parent ID / Query ID"
              variant="outlined"
              fullWidth
              size="small"
              value={compareParentId}
              onChange={(e) => setCompareParentId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompareSearch()}
            />
            <Button variant="contained" size="small" onClick={handleCompareSearch}>
              Compare
            </Button>
          </Stack>

          {compareQuery && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Query: <strong>{compareQuery}</strong>
            </Typography>
          )}

          {(compareLeft.length > 0 || compareRight.length > 0) && (
            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }} ref={containerRef}>
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
              />
              <Grid container spacing={4} sx={{ zIndex: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    BEFORE ({compareLeft[0]?.source || ''})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    QTime: {compareLeft[0]?.qtime} | Rows: {compareLeft[0]?.rowcount}
                  </Typography>
                  {getTopDocList(compareLeft[0]).map((docId, idx) => (
                    <Box
                      key={idx}
                      className="left-result"
                      data-docid={docId}
                      sx={{
                        backgroundColor: '#1e4620',
                        color: 'white',
                        mb: 0.5, px: 1, py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.8rem'
                      }}
                    >
                      {idx + 1}. {docId}
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    AFTER ({compareRight[0]?.source || ''})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    QTime: {compareRight[0]?.qtime} | Rows: {compareRight[0]?.rowcount}
                  </Typography>
                  {getTopDocList(compareRight[0]).map((docId, idx) => {
                    const beforeList = getTopDocList(compareLeft[0]);
                    const beforeIdx = beforeList.indexOf(docId);
                    let bg = '#4c1c1c'; // red = not found in before
                    if (beforeIdx === idx) bg = '#1e4620'; // green = same position
                    else if (beforeIdx >= 0) bg = '#4e4308'; // yellow = different position

                    return (
                      <Box
                        key={idx}
                        className="right-result"
                        data-docid={docId}
                        sx={{
                          backgroundColor: bg,
                          color: 'white',
                          mb: 0.5, px: 1, py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        {idx + 1}. {docId}
                      </Box>
                    );
                  })}
                </Grid>
              </Grid>
            </Box>
          )}

          {compareLeft.length === 0 && compareRight.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              Select a query from Sample Queries or Summarize Results to compare BEFORE vs AFTER.
            </Typography>
          )}
        </Paper>
      )}

      {/* ─── Tab 3: Summarize Results ──────────────────────────────── */}
      {activeTab === 3 && (
        <SummarizeResults testName={selectedTest} onCompare={handleCompare} />
      )}

      {/* ─── Tab 4: Query Feedback ─────────────────────────────────── */}
      {activeTab === 4 && (
        <QueryFeedback testName={selectedTest} />
      )}
    </Box>
  );
}