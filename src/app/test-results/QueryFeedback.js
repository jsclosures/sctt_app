'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import { getFeedback, saveFeedback, deleteFeedback } from '@/services/testResultsService';

const QueryFeedback = ({ testName }) => {
  const [query, setQuery] = useState('');
  const [comments, setComments] = useState('');
  const [confidence, setConfidence] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await getFeedback(0, 200);
      setFeedbackList(data.items || []);
    } catch (e) {
      console.error('Failed to load feedback:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSave = async () => {
    if (!query) return;
    const doc = {
      query_txt: query,
      comments_s: comments,
      confidence_s: confidence,
    };
    if (selectedId) doc.id = selectedId;
    try {
      await saveFeedback(doc);
      clearForm();
      setTimeout(fetchFeedback, 600);
    } catch (e) {
      console.error('Failed to save feedback:', e);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteFeedback(selectedId);
      clearForm();
      setTimeout(fetchFeedback, 600);
    } catch (e) {
      console.error('Failed to delete feedback:', e);
    }
  };

  const handleRowClick = (row) => {
    setSelectedId(row.id);
    setQuery(row.query_txt || '');
    setComments(row.comments_s || '');
    setConfidence(row.confidence_s || '');
  };

  const clearForm = () => {
    setQuery('');
    setComments('');
    setConfidence('');
    setSelectedId(null);
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Query Feedback
      </Typography>

      <Box display="flex" flexDirection="row" gap={2} flexWrap="wrap" mb={2}>
        <TextField
          label="Query"
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Confidence Score"
          type="number"
          variant="outlined"
          size="small"
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
          sx={{ width: 150 }}
        />
        <TextField
          label="Comments"
          variant="outlined"
          size="small"
          multiline
          rows={1}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          sx={{ flex: 1, minWidth: 300 }}
        />
        <Box display="flex" gap={1} alignItems="center">
          <Button variant="contained" onClick={handleSave}>Save</Button>
          <Button variant="outlined" color="error" onClick={handleDelete} disabled={!selectedId}>
            Delete
          </Button>
          <Button variant="outlined" onClick={clearForm}>Clear</Button>
          {loading && <CircularProgress size={20} />}
        </Box>
      </Box>

      <TableContainer sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Query</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedbackList.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={selectedId === row.id}
                onClick={() => handleRowClick(row)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{row.query_txt}</TableCell>
                <TableCell>{row.confidence_s}</TableCell>
                <TableCell>{row.comments_s}</TableCell>
              </TableRow>
            ))}
            {!loading && feedbackList.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No feedback entries
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QueryFeedback;