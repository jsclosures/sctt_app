/**
 * Test Results Service
 *
 * Maps to backend handlers: SAMPLE, SUMMARY, COMPARE, FEEDBACK,
 * DETAILSRUNNER, DOWNLOADSUMMARY
 *
 * Place at: services/testResultsService.js
 */

import { restGet, restPost, ensureAuth } from '@/lib/api';

// ─── Sample Queries (SAMPLE handler) ────────────────────────────────

export async function getSampleQueries(testName, queryFilter = '', start = 0, rows = 100, sort, ascending) {
  await ensureAuth();
  const params = {
    contenttype: 'SAMPLE',
    testname: testName,
    _start: start,
    _rows: rows,
  };
  if (queryFilter) params.query_s = queryFilter;
  if (sort) {
    params._sort = sort;
    params._ascending = ascending;
  }
  const data = await restGet(params);
  return {
    items: data.items || [],
    total: data._totalItems || 0,
  };
}

// ─── Summary Results (SUMMARY handler) ──────────────────────────────

export async function getSummaryResults(testName, queryFilter = '', start = 0, rows = 10, sort, ascending) {
  await ensureAuth();
  const params = {
    contenttype: 'SUMMARY',
    testname: testName,
    _start: start,
    _rows: rows,
  };
  if (queryFilter) params.query_s = queryFilter;
  if (sort) {
    params._sort = sort;
    params._ascending = ascending;
  }
  const data = await restGet(params);
  return {
    items: data.items || [],
    total: data._totalItems || 0,
  };
}

// ─── Compare Results (COMPARE handler) ──────────────────────────────

export async function getCompareResults(testName, parentId) {
  await ensureAuth();
  const params = {
    contenttype: 'COMPARE',
    testname: testName,
  };
  if (parentId) params.parentid = parentId;
  const data = await restGet(params);
  return {
    items: data.items || [],
    count: data.count || 0,
  };
}

// ─── Details Runner (DETAILSRUNNER handler) ─────────────────────────

export async function getDetails(testName) {
  await ensureAuth();
  const data = await restGet({
    contenttype: 'DETAILSRUNNER',
    testname: testName,
  });
  return data;
}

// ─── Download Summary CSV (DOWNLOADSUMMARY handler) ─────────────────

export async function downloadSummary(testName) {
  await ensureAuth();
  // This returns a special payload response, not standard JSON
  const data = await restGet({
    contenttype: 'DOWNLOADSUMMARY',
    testname: testName,
  });
  // If the backend returned a payload (CSV string), trigger download
  if (data.payload) {
    const blob = new Blob([data.payload], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return data;
}

// ─── Feedback (FEEDBACK handler) ────────────────────────────────────

export async function getFeedback(start = 0, rows = 100, sort, ascending) {
  await ensureAuth();
  const params = {
    contenttype: 'FEEDBACK',
    action: 'GET',
    _start: start,
    _rows: rows,
  };
  if (sort) {
    params._sort = sort;
    params._ascending = ascending;
  }
  const data = await restGet(params);
  return {
    items: data.items || [],
    total: data._totalItems || 0,
  };
}

export async function saveFeedback(doc) {
  await ensureAuth();
  return restPost({
    contenttype: 'FEEDBACK',
    action: 'POST',
    doc,
  });
}

export async function deleteFeedback(id) {
  await ensureAuth();
  return restPost({
    contenttype: 'FEEDBACK',
    action: 'DELETE',
    doc: { id },
  });
}