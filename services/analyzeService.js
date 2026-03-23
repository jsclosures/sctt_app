/**
 * Analyze Service
 *
 * Maps to backend handlers: REALTIME, PAGEMETRIC, COLLECTMETRIC
 *
 * Place at: services/analyzeService.js
 */

import { restGet, ensureAuth } from '@/lib/api';

// ─── Real Time (REALTIME handler) ───────────────────────────────────

export async function getRealTimeMetrics(url) {
  await ensureAuth();
  const params = { contenttype: 'REALTIME' };
  if (url) params.url = url;
  const data = await restGet(params);
  return data;
}

// ─── Page Metrics (PAGEMETRIC handler) ──────────────────────────────

export async function getPageMetrics(testName, start = 0, rows = 1) {
  await ensureAuth();
  const params = {
    contenttype: 'PAGEMETRIC',
    testname: testName || 'default',
    _start: start,
    _rows: rows,
  };
  const data = await restGet(params);
  return data;
}

// ─── Collect Metrics (COLLECTMETRIC handler) ────────────────────────

export async function collectMetrics(testName, collection, handler, metric, rows = 1000) {
  await ensureAuth();
  const params = {
    contenttype: 'COLLECTMETRIC',
    testname: testName || 'default',
    _rows: rows,
  };
  if (collection) params.collection = collection;
  if (handler) params.handler = handler;
  if (metric) params.metric = metric;
  const data = await restGet(params);
  return data;
}