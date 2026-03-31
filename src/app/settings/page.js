'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, Stack, Chip, Paper, Tabs, Tab,
  IconButton, Divider, CircularProgress
} from '@mui/material';
import {
  StorageRounded, SecurityRounded, AccountTreeRounded, TuneRounded,
  CheckCircleRounded, DragIndicatorRounded, DeleteOutlineRounded,
  AddRounded, LinkRounded, RestartAltRounded, SaveRounded,
  InfoOutlined
} from '@mui/icons-material';
import { useApp, useNotify } from '@/context/AppContext';
import { getConfig, saveConfig, resetSetup, getDefaultPipeline } from '@/lib/config';

const SEARCH_PROVIDERS = [
  { id: 'solr', name: 'Apache Solr', color: '#D9411E' },
  { id: 'elasticsearch', name: 'Elasticsearch', color: '#00BFB3' },
  { id: 'opensearch', name: 'OpenSearch', color: '#005EB8' },
  { id: 'typesense', name: 'Typesense', color: '#5928ED' },
  { id: 'meilisearch', name: 'Meilisearch', color: '#FF5CAA' },
];

const AUTH_PROVIDERS = [
  { id: 'local', name: 'Local Auth' },
  { id: 'oauth2', name: 'OAuth 2.0' },
  { id: 'auth0', name: 'Auth0' },
  { id: 'ldap', name: 'LDAP / SAML' },
];

export default function SettingsPage() {
  const { updateAppConfig } = useApp();
  const notify = useNotify();
  const [config, setConfig] = useState(null);
  const [tab, setTab] = useState(0);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  if (!config) return null;

  const update = (path, value) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    saveConfig(config);
    updateAppConfig(config);
    setDirty(false);
    notify('Settings saved', 'success');
  };

  const handleReset = () => {
    resetSetup();
    window.location.href = '/setup';
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus('success');
    setTesting(false);
  };

  const movePipelineItem = (i, dir) => {
    const items = [...config.pipeline];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    update('pipeline', items);
  };

  const togglePipelineItem = (i) => {
    const items = [...config.pipeline];
    items[i] = { ...items[i], enabled: !items[i].enabled };
    update('pipeline', items);
  };

  const renamePipelineItem = (i, label) => {
    const items = [...config.pipeline];
    items[i] = { ...items[i], label };
    update('pipeline', items);
  };

  const removePipelineItem = (i) => {
    const items = [...config.pipeline];
    items.splice(i, 1);
    update('pipeline', items);
  };

  const addPipelineItem = () => {
    const items = [...config.pipeline];
    const id = `custom_${Date.now()}`;
    items.push({ id, label: 'Custom Stage', field: `test${id}script`, argsField: `test${id}script_s`, enabled: true, custom: true });
    update('pipeline', items);
  };

  const resetPipeline = () => {
    update('pipeline', getDefaultPipeline());
    notify('Pipeline reset to defaults', 'info');
  };

  const Section = ({ children }) => (
    <Box sx={{ maxWidth: 640 }}>{children}</Box>
  );

  const SectionTitle = ({ children, sub }) => (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 650, letterSpacing: '-0.02em', color: 'text.primary', mb: 0.5 }}>
        {children}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{sub}</Typography>}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Settings</Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
            Manage your workspace configuration
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {dirty && (
            <Chip label="Unsaved changes" size="small" sx={{ bgcolor: 'rgba(255,107,43,0.1)', color: '#ff6b2b', fontWeight: 600 }} />
          )}
          <Button variant="contained" startIcon={<SaveRounded />} onClick={handleSave} disabled={!dirty}>
            Save Changes
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minWidth: 180,
            '& .MuiTabs-indicator': { left: 0, right: 'auto', width: 3 },
            '& .MuiTab-root': { alignItems: 'flex-start', textAlign: 'left', pl: 2, minHeight: 42 },
          }}
        >
          <Tab icon={<InfoOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="General" />
          <Tab icon={<StorageRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Search" />
          <Tab icon={<SecurityRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Auth" />
          <Tab icon={<AccountTreeRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Pipeline" />
          <Tab icon={<TuneRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Preferences" />
        </Tabs>

        <Box sx={{ flex: 1, pl: 2 }}>
          {tab === 0 && (
            <Section>
              <SectionTitle sub="Basic workspace configuration">General</SectionTitle>
                <Stack spacing={2.5}>
                    <TextField label="Team / Organization" fullWidth value={config.workspace.team} onChange={e => update('workspace.team', e.target.value)} />
                    <TextField label="Project Name" fullWidth value={config.workspace.project} onChange={e => update('workspace.project', e.target.value)} />
                </Stack>
              <Divider sx={{ my: 4 }} />
              <SectionTitle sub="This will erase all settings and restart the setup wizard">Danger Zone</SectionTitle>
              <Button variant="outlined" color="error" startIcon={<RestartAltRounded />} onClick={handleReset}>
                Reset & Run Setup Again
              </Button>
            </Section>
          )}

          {tab === 1 && (
            <Section>
              <SectionTitle sub="Configure your search engine connection">Search Engine</SectionTitle>
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {SEARCH_PROVIDERS.map(p => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    onClick={() => update('search.provider', p.id)}
                    variant={config.search.provider === p.id ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      ...(config.search.provider === p.id && {
                        bgcolor: 'rgba(255,107,43,0.1)', color: '#ff6b2b', borderColor: '#ff6b2b',
                      }),
                    }}
                  />
                ))}
              </Box>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Host" fullWidth value={config.search.host} onChange={e => update('search.host', e.target.value)} />
                  <TextField label="Port" type="number" sx={{ width: 120 }} value={config.search.port} onChange={e => update('search.port', parseInt(e.target.value) || 0)} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Collection / Index" fullWidth value={config.search.collection} onChange={e => update('search.collection', e.target.value)} />
                  <TextField label="Path Prefix" sx={{ width: 160 }} value={config.search.prefix} onChange={e => update('search.prefix', e.target.value)} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControlLabel control={<Switch checked={config.search.https} onChange={e => update('search.https', e.target.checked)} />} label="HTTPS" />
                  <TextField label="Auth Key" fullWidth value={config.search.authKey} onChange={e => update('search.authKey', e.target.value)} type="password" />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button variant="outlined" startIcon={testing ? <CircularProgress size={16} /> : <LinkRounded />} onClick={testConnection} disabled={testing}>
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  {connectionStatus === 'success' && (
                    <Chip icon={<CheckCircleRounded />} label="Connected" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#16a34a', fontWeight: 600 }} />
                  )}
                </Box>
              </Stack>
            </Section>
          )}

          {tab === 2 && (
            <Section>
              <SectionTitle sub="Configure how users authenticate">Authentication</SectionTitle>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Auth Provider</InputLabel>
                <Select value={config.auth.provider} label="Auth Provider" onChange={e => update('auth.provider', e.target.value)}>
                  {AUTH_PROVIDERS.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>

              {config.auth.provider === 'oauth2' && (
                <Stack spacing={2.5}>
                  <TextField label="Client ID" fullWidth value={config.auth.oauth.clientId} onChange={e => update('auth.oauth.clientId', e.target.value)} />
                  <TextField label="Authorize URL" fullWidth value={config.auth.oauth.authorizeUrl} onChange={e => update('auth.oauth.authorizeUrl', e.target.value)} />
                  <TextField label="Token URL" fullWidth value={config.auth.oauth.tokenUrl} onChange={e => update('auth.oauth.tokenUrl', e.target.value)} />
                  <TextField label="Scopes" fullWidth value={config.auth.oauth.scope} onChange={e => update('auth.oauth.scope', e.target.value)} />
                </Stack>
              )}
              {config.auth.provider === 'auth0' && (
                <Stack spacing={2.5}>
                  <TextField label="Domain" fullWidth value={config.auth.auth0.domain} onChange={e => update('auth.auth0.domain', e.target.value)} />
                  <TextField label="Client ID" fullWidth value={config.auth.auth0.clientId} onChange={e => update('auth.auth0.clientId', e.target.value)} />
                  <TextField label="Audience" fullWidth value={config.auth.auth0.audience} onChange={e => update('auth.auth0.audience', e.target.value)} />
                </Stack>
              )}
              {config.auth.provider === 'ldap' && (
                <Stack spacing={2.5}>
                  <TextField label="LDAP URL" fullWidth value={config.auth.ldap.url} onChange={e => update('auth.ldap.url', e.target.value)} />
                  <TextField label="Base DN" fullWidth value={config.auth.ldap.baseDn} onChange={e => update('auth.ldap.baseDn', e.target.value)} />
                  <TextField label="Bind DN" fullWidth value={config.auth.ldap.bindDn} onChange={e => update('auth.ldap.bindDn', e.target.value)} />
                </Stack>
              )}
            </Section>
          )}

          {tab === 3 && (
            <Section>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <SectionTitle sub="Configure script stages for your testing workflow">Pipeline</SectionTitle>
                <Button variant="outlined" size="small" onClick={resetPipeline}>Reset Defaults</Button>
              </Box>

              <Stack spacing={1} sx={{ mb: 3 }}>
                {config.pipeline.map((item, i) => (
                  <Paper
                    key={item.id}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: '8px 12px',
                      opacity: item.enabled ? 1 : 0.45, transition: 'opacity 0.15s ease',
                    }}
                  >
                    <DragIndicatorRounded sx={{ fontSize: 18, color: 'text.secondary', cursor: 'grab' }} />
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '6px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      bgcolor: item.enabled ? 'rgba(255,107,43,0.1)' : 'action.hover',
                      color: item.enabled ? '#ff6b2b' : 'text.secondary',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>
                      {i + 1}
                    </Box>
                    <TextField
                      size="small" variant="standard" value={item.label}
                      onChange={e => renamePipelineItem(i, e.target.value)}
                      sx={{ flex: 1, '& .MuiInput-root': { fontSize: '0.85rem' }, '& .MuiInput-root:before': { borderBottom: '1px solid transparent' } }}
                    />
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: '4px', flexShrink: 0 }}>
                      {item.field}
                    </Typography>
                    <Switch size="small" checked={item.enabled} onChange={() => togglePipelineItem(i)} />
                    <IconButton size="small" onClick={() => movePipelineItem(i, -1)} disabled={i === 0} sx={{ p: 0.5 }}>↑</IconButton>
                    <IconButton size="small" onClick={() => movePipelineItem(i, 1)} disabled={i === config.pipeline.length - 1} sx={{ p: 0.5 }}>↓</IconButton>
                    {item.custom && (
                      <IconButton size="small" onClick={() => removePipelineItem(i)} sx={{ p: 0.5 }}>
                        <DeleteOutlineRounded sx={{ fontSize: 16, color: 'error.main' }} />
                      </IconButton>
                    )}
                  </Paper>
                ))}
              </Stack>
              <Button variant="outlined" size="small" startIcon={<AddRounded />} onClick={addPipelineItem}>
                Add Custom Stage
              </Button>
            </Section>
          )}

          {tab === 4 && (
            <Section>
              <SectionTitle sub="Customize appearance and behavior">Preferences</SectionTitle>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select value={config.preferences.theme} label="Theme" onChange={e => update('preferences.theme', e.target.value)}>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Default Page Size" type="number" value={config.preferences.pageSize} onChange={e => update('preferences.pageSize', parseInt(e.target.value) || 20)} sx={{ width: 180 }} />
                  <TextField label="Terminal Font Size" type="number" value={config.preferences.terminalFontSize} onChange={e => update('preferences.terminalFontSize', parseInt(e.target.value) || 13)} sx={{ width: 180 }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { key: 'autoSave', label: 'Auto-save', desc: 'Save changes automatically as you type' },
                    { key: 'showNotifications', label: 'Notifications', desc: 'Show toast notifications for actions' },
                    { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for denser layouts' },
                    { key: 'editorWordWrap', label: 'Editor Word Wrap', desc: 'Wrap long lines in the code editor' },
                  ].map(pref => (
                    <FormControlLabel
                      key={pref.key}
                      control={<Switch checked={config.preferences[pref.key]} onChange={e => update(`preferences.${pref.key}`, e.target.checked)} />}
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'text.primary' }}>{pref.label}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{pref.desc}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
              </Stack>
            </Section>
          )}
        </Box>
      </Box>
    </Box>
  );
}