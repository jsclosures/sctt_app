'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Stack, Chip, IconButton, Tooltip, Paper
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { SaveRounded, DeleteRounded, ClearRounded, ChatBubbleOutlineRounded } from '@mui/icons-material';
import { getFeedback, saveFeedback, deleteFeedback } from '@/services/testResultsService';

const QueryFeedback = ({ testName }) => {
  const [query, setQuery]           = useState('');
  const [comments, setComments]     = useState('');
  const [confidence, setConfidence] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading]       = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await getFeedback(0, 200);
      setFeedbackList((data.items || []).map((r, i) => ({ ...r, id: r.id || `fb-${i}` })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, []);

  const handleSave = async () => {
    if (!query) return;
    const doc = { query_txt: query, comments_s: comments, confidence_s: confidence };
    if (selectedId) doc.id = selectedId;
    try { await saveFeedback(doc); clearForm(); setTimeout(fetchFeedback, 600); }
    catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try { await deleteFeedback(selectedId); clearForm(); setTimeout(fetchFeedback, 600); }
    catch (e) { console.error(e); }
  };

  const clearForm = () => { setQuery(''); setComments(''); setConfidence(''); setSelectedId(null); };

  const handleRowClick = (params) => {
    const row = params.row;
    setSelectedId(row.id);
    setQuery(row.query_txt || '');
    setComments(row.comments_s || '');
    setConfidence(row.confidence_s || '');
  };

  const columns = [
    { field: 'query_txt',   headerName: 'Query',      flex: 1, minWidth: 180 },
    {
      field: 'confidence_s', headerName: 'Confidence', width: 110, type: 'number',
      renderCell: p => {
        const v = Number(p.value);
        const color = v >= 80 ? '#22c55e' : v >= 50 ? '#ff6b2b' : v > 0 ? '#ef4444' : 'inherit';
        return <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, fontFamily: 'monospace', color: v > 0 ? color : 'text.disabled' }}>{p.value || '—'}</Typography>;
      },
    },
    { field: 'comments_s',  headerName: 'Comments',   flex: 1, minWidth: 180 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Form */}
      <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <ChatBubbleOutlineRounded sx={{ fontSize: 15, color: '#ff6b2b' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
            {selectedId ? 'Edit Feedback' : 'Add Feedback'}
          </Typography>
          {selectedId && <Chip size="small" label="Editing" color="warning" sx={{ fontSize: '0.6rem', height: 17, borderRadius: '4px' }} />}
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <TextField size="small" label="Query" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            sx={{ flex: 2, minWidth: 160, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
          />
          <TextField size="small" label="Confidence" type="number" value={confidence}
            onChange={e => setConfidence(e.target.value)}
            sx={{ width: 110, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
          />
          <TextField size="small" label="Comments" value={comments}
            onChange={e => setComments(e.target.value)}
            multiline maxRows={2}
            sx={{ flex: 3, minWidth: 180, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
          />
          <Stack direction="row" spacing={0.5} sx={{ pt: 0.25, flexShrink: 0 }}>
            <Tooltip title="Save">
              <span>
                <IconButton size="small" onClick={handleSave} disabled={!query}
                  sx={{ width: 30, height: 30, bgcolor: '#ff6b2b', color: 'white',
                    '&:hover': { bgcolor: '#e85d1f' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
                  <SaveRounded sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton size="small" onClick={handleDelete} disabled={!selectedId}
                  sx={{ width: 30, height: 30, '&:not(:disabled):hover': { color: 'error.main' } }}>
                  <DeleteRounded sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Clear">
              <IconButton size="small" onClick={clearForm} sx={{ width: 30, height: 30 }}>
                <ClearRounded sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Grid */}
      <Box sx={{ flex: 1, minHeight: 280 }}>
        {feedbackList.length > 0 ? (
          <DataGrid
            rows={feedbackList} columns={columns} loading={loading}
            pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            density="compact" disableRowSelectionOnClick
            onRowClick={handleRowClick}
            rowSelectionModel={selectedId ? [selectedId] : []}
            sx={{
              height: '100%',
              '& .MuiDataGrid-row': { cursor: 'pointer' },
              '& .MuiDataGrid-row.Mui-selected': { bgcolor: 'rgba(255,107,43,0.05)' },
            }}
          />
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <ChatBubbleOutlineRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>No feedback entries yet</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.disabled' }}>Add feedback above to track query quality assessments.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QueryFeedback;