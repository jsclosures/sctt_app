const STORAGE_KEY = 'sctt_config';
const SETUP_KEY = 'sctt_setup_complete';

const DEFAULT_PIPELINE = [
  { id: 'details', label: 'Details Script', field: 'testdetailscript', argsField: 'testdetailscript_s', enabled: true },
  { id: 'harvest', label: 'Harvest Log Files', field: 'testharvestscript', argsField: 'testharvestscript_s', enabled: true },
  { id: 'copy', label: 'Copy Collection', field: 'testcopyscript', argsField: 'testcopyscript_s', enabled: true },
  { id: 'build', label: 'Build Sample', field: 'testbuildscript', argsField: 'testbuildscript_s', enabled: true },
  { id: 'extract', label: 'Extract Results', field: 'testextractscript', argsField: 'testextractscript_s', enabled: true },
  { id: 'interpret', label: 'Interpret Widget', field: 'testinterpretscript', argsField: 'testinterpretscript_s', enabled: true },
  { id: 'summarize', label: 'Summarize Results', field: 'testsummaryscript', argsField: 'testsummaryscript_s', enabled: true },
  { id: 'summaryExtract', label: 'Summary Extract', field: 'testsummaryextractscript', argsField: 'testsummaryextractscript_s', enabled: true },
];

const DEFAULT_CONFIG = {
  workspace: {
    name: '',
    team: '',
  },
  search: {
    provider: 'solr',
    host: 'localhost',
    port: 8983,
    collection: 'validate',
    prefix: '/solr/',
    https: false,
    authKey: '',
  },
  auth: {
    provider: 'local',
    oauth: { clientId: '', authorizeUrl: '', tokenUrl: '', scope: 'openid profile' },
    auth0: { domain: '', clientId: '', audience: '' },
    ldap: { url: '', baseDn: '', bindDn: '' },
  },
  pipeline: DEFAULT_PIPELINE,
  preferences: {
    theme: 'light',
    pageSize: 20,
    terminalFontSize: 13,
    autoSave: false,
    showNotifications: true,
    compactMode: false,
    editorWordWrap: false,
  },
};

export function getConfig() {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return deepMerge(DEFAULT_CONFIG, JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function updateConfig(path, value) {
  const config = getConfig();
  setNestedValue(config, path, value);
  saveConfig(config);
  return config;
}

export function isSetupComplete() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SETUP_KEY) === 'true';
}

export function markSetupComplete() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETUP_KEY, 'true');
}

export function resetSetup() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SETUP_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function getDefaultPipeline() {
  return JSON.parse(JSON.stringify(DEFAULT_PIPELINE));
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}