/**
 * Test Service
 *
 * Maps to the backend TEST, DELETEALL, and EXPORTALLTEST handlers.
 * All tests are stored in Solr with contenttype: "TEST".
 *
 * Solr document shape:
 *   id                      – unique ID (e.g. "TESTdefault")
 *   contenttype             – always "TEST"
 *   testname                – display name
 *   comments                – description / comments
 *   testsample              – sample queries reference
 *   testnotes               – base64 encoded notes
 *   testdetailscript        – base64 encoded (or "ASSET:<name>")
 *   testharvestscript       – base64 encoded (or "ASSET:<name>")
 *   testcopyscript          – base64 encoded (or "ASSET:<name>")
 *   testbuildscript         – base64 encoded (or "ASSET:<name>")
 *   testextractscript       – base64 encoded (or "ASSET:<name>")
 *   testinterpretscript     – base64 encoded (or "ASSET:<name>")
 *   testsummaryscript       – base64 encoded (or "ASSET:<name>")
 *   testsummaryextractscript – base64 encoded (or "ASSET:<name>")
 *   + corresponding _s fields for script arguments
 */

import { restGet, restPost, toBase64, fromBase64 } from '@/lib/api';

// ─── Tab → Solr field mapping ───────────────────────────────────────

export const SCRIPT_TABS = [
  { label: 'Notes',             field: 'testnotes',               argsField: null },
  { label: 'Details Script',    field: 'testdetailscript',        argsField: 'testdetailscript_s' },
  { label: 'Harvest Log Files', field: 'testharvestscript',       argsField: 'testharvestscript_s' },
  { label: 'Copy Collection',   field: 'testcopyscript',          argsField: 'testcopyscript_s' },
  { label: 'Build Sample',      field: 'testbuildscript',         argsField: 'testbuildscript_s' },
  { label: 'Extract Results',   field: 'testextractscript',       argsField: 'testextractscript_s' },
  { label: 'Interpret Widget',  field: 'testinterpretscript',     argsField: 'testinterpretscript_s' },
  { label: 'Summarize Results', field: 'testsummaryscript',       argsField: 'testsummaryscript_s' },
  { label: 'Summary Extract',   field: 'testsummaryextractscript', argsField: 'testsummaryextractscript_s' },
];

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Convert a raw Solr test doc into a friendly object.
 */
function docToTest(doc) {
  const test = {
    id: doc.id,
    name: doc.testname || '',
    comments: doc.comments || '',
    sample: doc.testsample || '',
  };

  // Decode each script/notes field
  for (const tab of SCRIPT_TABS) {
    const raw = doc[tab.field];
    if (raw) {
      test[tab.field] = fromBase64(raw);
    } else {
      test[tab.field] = '';
    }

    // Also carry over the _s args fields as-is
    if (tab.argsField && doc[tab.argsField]) {
      test[tab.argsField] = doc[tab.argsField];
    } else if (tab.argsField) {
      test[tab.argsField] = '';
    }
  }

  return test;
}

/**
 * Convert a friendly test object into a Solr doc for saving.
 */
function testToDoc(test) {
  const doc = {};

  if (test.id) doc.id = test.id;
  if (test.name !== undefined) doc.testname = test.name;
  if (test.comments !== undefined) doc.comments = test.comments;
  if (test.sample !== undefined) doc.testsample = test.sample;

  // Encode each script/notes field to base64
  for (const tab of SCRIPT_TABS) {
    if (test[tab.field] !== undefined && test[tab.field] !== '') {
      doc[tab.field] = toBase64(test[tab.field]);
    }

    // Pass through _s args fields
    if (tab.argsField && test[tab.argsField] !== undefined) {
      doc[tab.argsField] = test[tab.argsField];
    }
  }

  return doc;
}

// ─── Empty test (for form reset) ────────────────────────────────────

export function createEmptyTest() {
  const empty = {
    id: '',
    name: '',
    comments: '',
    sample: '',
  };

  for (const tab of SCRIPT_TABS) {
    empty[tab.field] = '';
    if (tab.argsField) empty[tab.argsField] = '';
  }

  return empty;
}

// ─── API calls ──────────────────────────────────────────────────────

/**
 * Fetch all tests from the backend.
 */
export async function getTests(start = 0, rows = 100, sort, ascending) {
  const params = {
    contenttype: 'TEST',
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
    items: (data.items || []).map(docToTest),
    total: data._totalItems || 0,
  };
}

/**
 * Save (create or update) a test.
 */
export async function saveTest(test) {
  const doc = testToDoc(test);

  return restPost({
    contenttype: 'TEST',
    action: 'POST',
    doc,
  });
}

/**
 * Delete a test by its Solr document id.
 */
export async function deleteTest(id) {
  return restPost({
    contenttype: 'TEST',
    action: 'DELETE',
    doc: { id },
  });
}

/**
 * Delete all test DATA (results, summaries, etc.) for a given test name.
 * This does NOT delete the test definition itself.
 */
export async function deleteAllTestData(testname) {
  return restPost({
    contenttype: 'DELETEALL',
    testname,
  });
}

/**
 * Export all tests as JSON (triggers a download).
 */
export async function exportAllTests() {
  const params = {
    contenttype: 'EXPORTALLTEST',
  };

  const data = await restGet(params);
  return data;
}