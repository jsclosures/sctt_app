import { restGet, restPost, toBase64, fromBase64, ensureAuth } from '@/lib/api';
import { getConfig } from '@/lib/config';

const NOTES_TAB = { id: 'notes', label: 'Notes', field: 'testnotes', argsField: null, enabled: true };

export function getScriptTabs() {
  const config = getConfig();
  const pipeline = config.pipeline || [];
  const enabled = pipeline.filter(p => p.enabled);
  return [NOTES_TAB, ...enabled];
}

function docToTest(doc, tabs) {
  const test = {
    id: doc.id,
    name: doc.testname || '',
    comments: doc.comments || '',
    sample: doc.testsample || '',
  };

  for (const tab of tabs) {
    test[tab.field] = doc[tab.field] ? fromBase64(doc[tab.field]) : '';
    if (tab.argsField) {
      test[tab.argsField] = doc[tab.argsField] || '';
    }
  }

  return test;
}

function testToDoc(test, tabs) {
  const doc = {};
  if (test.id) doc.id = test.id;
  if (test.name !== undefined) doc.testname = test.name;
  if (test.comments !== undefined) doc.comments = test.comments;
  if (test.sample !== undefined) doc.testsample = test.sample;

  for (const tab of tabs) {
    if (test[tab.field] !== undefined && test[tab.field] !== '') {
      doc[tab.field] = toBase64(test[tab.field]);
    }
    if (tab.argsField && test[tab.argsField] !== undefined) {
      doc[tab.argsField] = test[tab.argsField];
    }
  }

  return doc;
}

export function createEmptyTest(tabs) {
  const scriptTabs = tabs || getScriptTabs();
  const empty = { id: '', name: '', comments: '', sample: '' };
  for (const tab of scriptTabs) {
    empty[tab.field] = '';
    if (tab.argsField) empty[tab.argsField] = '';
  }
  return empty;
}

export async function getTests(start = 0, rows = 100, sort, ascending) {
  await ensureAuth();
  const tabs = getScriptTabs();
  const params = { contenttype: 'TEST', action: 'GET', _start: start, _rows: rows };
  if (sort) { params._sort = sort; params._ascending = ascending; }
  const data = await restGet(params);
  return {
    items: (data.items || []).map(doc => docToTest(doc, tabs)),
    total: data._totalItems || 0,
  };
}

export async function saveTest(test) {
  await ensureAuth();
  const tabs = getScriptTabs();
  return restPost({ contenttype: 'TEST', action: 'POST', doc: testToDoc(test, tabs) });
}

export async function deleteTest(id) {
  await ensureAuth();
  return restPost({ contenttype: 'TEST', action: 'DELETE', doc: { id } });
}

export async function deleteAllTestData(testname) {
  await ensureAuth();
  return restPost({ contenttype: 'DELETEALL', testname });
}

export async function exportAllTests() {
  await ensureAuth();
  return restGet({ contenttype: 'EXPORTALLTEST' });
}