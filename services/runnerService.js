/**
 * Script Runner Service
 *
 * Maps to the RUNNER handler in handlers.js.
 * The RUNNER loads a test by name, picks the script field by `type`,
 * decodes & evals it, then passes the input args to it.
 *
 * The `_s` suffix fields on each test hold the default arguments
 * for that script as a space-separated key=value string, e.g.:
 *   "testname=default useAsSeed=true csvData= requiredTag=collection1"
 */

import { restGet, restPost } from '@/lib/api';

// ─── Script type mapping ────────────────────────────────────────────

export const RUNNER_TYPES = [
  { label: 'Details Script',     type: 'testdetailscript',         argsField: 'testdetailscript_s' },
  { label: 'Harvest Log Files',  type: 'testharvestscript',        argsField: 'testharvestscript_s' },
  { label: 'Copy Collection',    type: 'testcopyscript',           argsField: 'testcopyscript_s' },
  { label: 'Build Sample',       type: 'testbuildscript',          argsField: 'testbuildscript_s' },
  { label: 'Extract Results',    type: 'testextractscript',        argsField: 'testextractscript_s' },
  { label: 'Interpret Widget',   type: 'testinterpretscript',      argsField: 'testinterpretscript_s' },
  { label: 'Summarize Results',  type: 'testsummaryscript',        argsField: 'testsummaryscript_s' },
  { label: 'Summary Extract',    type: 'testsummaryextractscript', argsField: 'testsummaryextractscript_s' },
];

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Parse a space-separated key=value string into an object.
 * e.g. "testname=default useAsSeed=true csvData=" →
 *   { testname: "default", useAsSeed: "true", csvData: "" }
 */
export function parseArgsString(str) {
  const result = {};
  if (!str) return result;

  str.split(' ').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      result[pair.substring(0, idx)] = pair.substring(idx + 1);
    }
  });

  return result;
}

/**
 * Convert an args object back to a space-separated key=value string.
 */
export function buildArgsString(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
}

// ─── API calls ──────────────────────────────────────────────────────

/**
 * Run a script via the RUNNER handler.
 *
 * @param {string} testname - Name of the test to run
 * @param {string} type     - Script type field (e.g. "testbuildscript")
 * @param {string} input    - Space-separated key=value args string
 * @returns {Promise<Object>}
 */
export async function runScript(testname, type, input) {
  return restGet({
    contenttype: 'RUNNER',
    testname,
    type,
    input,
  });
}

/**
 * Run an asset script directly via the ASSETRUNNER handler.
 *
 * @param {string} assetname - Name of the asset to run
 * @param {string} testname  - Test context name
 * @returns {Promise<Object>}
 */
export async function runAssetScript(assetname, testname) {
  return restGet({
    contenttype: 'ASSETRUNNER',
    assetname,
    testname,
  });
}

/**
 * Delete all test data for a given test name.
 */
export async function deleteAllTestData(testname) {
  return restPost({
    contenttype: 'DELETEALL',
    testname,
  });
}