import { restGet, restPost, toBase64, fromBase64, ensureAuth } from '@/lib/api';

const KNOWN_FIELD_MAP = {
  detailsScript:          'testdetailscript',
  harvestLogFilesScript:  'testharvestscript',
  copyCollectionScript:   'testcopyscript',
  buildSampleScript:      'testbuildscript',
  extractScript:          'testextractscript',
  extractGroupScript:     'testextractscript',
  interpretScript:        'testinterpretscript',
  summarizeScript:        'testsummaryscript',
  summaryExportScript:    'testsummaryextractscript',
};

function assetToLabel(name) {
  let label = name.replace(/Script$/, '');
  label = label.replace(/([A-Z])/g, ' $1').trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

let _cachedTabs = null;
let _fieldMap = { ...KNOWN_FIELD_MAP }; // assetName → testField

export function getScriptTabs() {
  if (_cachedTabs && _cachedTabs.length > 0) return _cachedTabs;
  return [{ id: 'notes', label: 'Notes', field: 'testnotes', argsField: null, assetName: null }];
}


export async function refreshScriptTabs() {
  await ensureAuth();
  const data = await restGet({ contenttype: 'ASSET', action: 'GET', _start: 0, _rows: 200 });
  const assets = data.items || [];

  const tabs = [
    { id: 'notes', label: 'Notes', field: 'testnotes', argsField: null, assetName: null },
  ];

  for (const asset of assets) {
    const name = asset.assetname;
    if (!name) continue;

    const field = _fieldMap[name] || ('test' + name.toLowerCase().replace(/script$/, '') + 'script');
    const argsField = field + '_s';

    // Update the field map for future use
    if (!_fieldMap[name]) _fieldMap[name] = field;

    tabs.push({
      id: name,
      label: assetToLabel(name),
      field,
      argsField,
      assetName: name,
    });
  }

  _cachedTabs = tabs;
  return tabs;
}

function learnFieldMapFromDoc(doc) {
  for (const key of Object.keys(doc)) {
    if (!key.startsWith('test') || key.endsWith('_s') || key.startsWith('_')) continue;
    if (['testname', 'testsample', 'testnotes'].includes(key)) continue;

    try {
      const decoded = fromBase64(doc[key]);
      if (decoded && decoded.startsWith('ASSET:')) {
        const assetName = decoded.substring(6);
        _fieldMap[assetName] = key;
      }
    } catch {
      // Not base64 or not an asset reference
    }
  }
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

  // Refresh tabs from assets if not cached
  if (!_cachedTabs) {
    await refreshScriptTabs();
  }

  const params = { contenttype: 'TEST', action: 'GET', _start: start, _rows: rows };
  if (sort) { params._sort = sort; params._ascending = ascending; }
  const data = await restGet(params);
  const rawDocs = data.items || [];

  // Learn ASSET: references from raw docs to improve field mapping
  for (const doc of rawDocs) {
    learnFieldMapFromDoc(doc);
  }

  const tabs = getScriptTabs();

  return {
    items: rawDocs.map(doc => docToTest(doc, tabs)),
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