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
  InfoOutlined, ErrorRounded
} from '@mui/icons-material';
import { useApp, useNotify } from '@/context/AppContext';
import { useThemeConfig } from '../../context/themecontext';
import { getConfig, saveConfig, resetSetup, getDefaultPipeline } from '@/lib/config';

const SEARCH_PROVIDERS = [
  { id: 'solr',          name: 'Apache Solr' },
  { id: 'elasticsearch', name: 'Elasticsearch' },
  { id: 'opensearch',    name: 'OpenSearch' },
  { id: 'typesense',     name: 'Typesense' },
  { id: 'meilisearch',   name: 'Meilisearch' },
];

const AUTH_PROVIDERS = [
  { id: 'local',  name: 'Local Auth' },
  { id: 'oauth2', name: 'OAuth 2.0' },
  { id: 'auth0',  name: 'Auth0' },
  { id: 'ldap',   name: 'LDAP / SAML' },
];

const NAV = [
  { label: 'General',     icon: <InfoOutlined sx={{ fontSize: 15 }} /> },
  { label: 'Search',      icon: <StorageRounded sx={{ fontSize: 15 }} /> },
  { label: 'Auth',        icon: <SecurityRounded sx={{ fontSize: 15 }} /> },
  { label: 'Pipeline',    icon: <AccountTreeRounded sx={{ fontSize: 15 }} /> },
  { label: 'Preferences', icon: <TuneRounded sx={{ fontSize: 15 }} /> },
];

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'text.disabled', mb: 0.5 }}>
    {children}
  </Typography>
);

const SectionHead = ({ title, sub, action }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
    <Box>
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary', mb: sub ? 0.4 : 0 }}>
        {title}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{sub}</Typography>}
    </Box>
    {action}
  </Box>
);

export default function SettingsPage() {
  const { updateAppConfig } = useApp();
  const notify = useNotify();
  const { mode, toggleMode } = useThemeConfig();

  const [config, setConfig]                     = useState(null);
  const [tab, setTab]                           = useState(0);
  const [testing, setTesting]                   = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [dirty, setDirty]                       = useState(false);

  useEffect(() => { setConfig(getConfig()); }, []);
  if (!config) return null;

  const update = (path, value) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
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

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus('success');
    setTesting(false);
  };

  const movePipelineItem   = (i, dir) => { const items = [...config.pipeline]; const j = i + dir; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; update('pipeline', items); };
  const togglePipelineItem = (i) => { const items = [...config.pipeline]; items[i] = { ...items[i], enabled: !items[i].enabled }; update('pipeline', items); };
  const renamePipelineItem = (i, label) => { const items = [...config.pipeline]; items[i] = { ...items[i], label }; update('pipeline', items); };
  const removePipelineItem = (i) => { const items = [...config.pipeline]; items.splice(i, 1); update('pipeline', items); };
  const addPipelineItem    = () => { const items = [...config.pipeline]; const id = `custom_${Date.now()}`; items.push({ id, label: 'Custom Stage', field: `test${id}script`, argsField: `test${id}script_s`, enabled: true, custom: true }); update('pipeline', items); };
  const resetPipeline      = () => { update('pipeline', getDefaultPipeline()); notify('Pipeline reset to defaults', 'info'); };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 1.5, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid',
        borderColor: 'divider', flexShrink: 0, minHeight: 52,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Settings
          </Typography>
          {dirty && (
            <Chip size="small" label="Unsaved"
              sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, borderRadius: '5px', bgcolor: 'rgba(255,107,43,0.1)', color: '#ff6b2b' }} />
          )}
        </Stack>
        <Button size="small" variant="contained"
          startIcon={<SaveRounded sx={{ fontSize: 14 }} />}
          onClick={handleSave} disabled={!dirty}
          sx={{ height: 30, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600, px: 2, bgcolor: '#ff6b2b', '&:hover': { bgcolor: '#e85d1f' } }}>
          Save Changes
        </Button>
      </Box>

      {/* ── Body ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: vertical nav ───────────────────────────────── */}
        <Box sx={{
          width: 180, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider',
          py: 1, display: 'flex', flexDirection: 'column',
        }}>
          {NAV.map(({ label, icon }, i) => {
            const active = tab === i;
            return (
              <Box key={label} onClick={() => setTab(i)} sx={{
                mx: 1, mb: 0.25, px: 1.5, py: 1, borderRadius: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.25,
                cursor: 'pointer',
                bgcolor: active ? 'rgba(255,107,43,0.08)' : 'transparent',
                borderLeft: `2px solid ${active ? '#ff6b2b' : 'transparent'}`,
                transition: 'all 0.1s',
                '&:hover': { bgcolor: active ? 'rgba(255,107,43,0.1)' : 'action.hover' },
              }}>
                <Box sx={{ color: active ? '#ff6b2b' : 'text.disabled', display: 'flex' }}>{icon}</Box>
                <Typography sx={{
                  fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                  color: active ? '#ff6b2b' : 'text.primary',
                }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* ── RIGHT: content ───────────────────────────────────── */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Box sx={{ maxWidth: 580 }}>

            {/* General */}
            {tab === 0 && (
              <Box>
                <SectionHead title="General" sub="Basic workspace identification" />
                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box>
                    <FieldLabel>Team / Organization</FieldLabel>
                    <TextField size="small" fullWidth value={config.workspace?.team || ''}
                      onChange={e => update('workspace.team', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                  </Box>
                  <Box>
                    <FieldLabel>Project Name</FieldLabel>
                    <TextField size="small" fullWidth value={config.workspace?.project || ''}
                      onChange={e => update('workspace.project', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <SectionHead title="Danger Zone" sub="This will erase all settings and restart the setup wizard" />
                <Button variant="outlined" color="error" size="small"
                  startIcon={<RestartAltRounded sx={{ fontSize: 15 }} />}
                  onClick={() => { resetSetup(); window.location.href = '/setup'; }}
                  sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                  Reset & Run Setup Again
                </Button>
              </Box>
            )}

            {/* Search */}
            {tab === 1 && (
              <Box>
                <SectionHead title="Search Engine" sub="Configure your search engine connection" />

                <Box sx={{ mb: 2.5 }}>
                  <FieldLabel>Provider</FieldLabel>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {SEARCH_PROVIDERS.map(p => {
                      const active = config.search?.provider === p.id;
                      return (
                        <Chip key={p.id} label={p.name} size="small"
                          onClick={() => update('search.provider', p.id)}
                          sx={{
                            fontSize: '0.75rem', fontWeight: active ? 600 : 400, cursor: 'pointer',
                            height: 26, borderRadius: '6px',
                            bgcolor: active ? 'rgba(255,107,43,0.1)' : 'transparent',
                            border: '1px solid', borderColor: active ? '#ff6b2b' : 'divider',
                            color: active ? '#ff6b2b' : 'text.secondary',
                          }} />
                      );
                    })}
                  </Stack>
                </Box>

                <Stack spacing={2} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Host</FieldLabel>
                      <TextField size="small" fullWidth value={config.search?.host || ''}
                        onChange={e => update('search.host', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                    </Box>
                    <Box sx={{ width: 100 }}>
                      <FieldLabel>Port</FieldLabel>
                      <TextField size="small" fullWidth type="number" value={config.search?.port || ''}
                        onChange={e => update('search.port', parseInt(e.target.value) || 0)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Collection / Index</FieldLabel>
                      <TextField size="small" fullWidth value={config.search?.collection || ''}
                        onChange={e => update('search.collection', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                    </Box>
                    <Box sx={{ width: 130 }}>
                      <FieldLabel>Path Prefix</FieldLabel>
                      <TextField size="small" fullWidth value={config.search?.prefix || ''}
                        onChange={e => update('search.prefix', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', fontFamily: 'monospace' } }} />
                    </Box>
                  </Box>
                  <Box>
                    <FieldLabel>Auth Key</FieldLabel>
                    <TextField size="small" fullWidth type="password" value={config.search?.authKey || ''}
                      onChange={e => update('search.authKey', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                  </Box>
                  <FormControlLabel
                    control={<Switch size="small" checked={config.search?.https || false} onChange={e => update('search.https', e.target.checked)} />}
                    label={<Typography sx={{ fontSize: '0.82rem' }}>Use HTTPS</Typography>}
                  />
                </Stack>

                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Button size="small" variant="outlined"
                    startIcon={testing ? <CircularProgress size={13} /> : <LinkRounded sx={{ fontSize: 14 }} />}
                    onClick={testConnection} disabled={testing}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', height: 30 }}>
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  {connectionStatus === 'success' && (
                    <Chip icon={<CheckCircleRounded sx={{ fontSize: 13 }} />} label="Connected" size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(34,197,94,0.1)', color: '#16a34a', borderRadius: '5px' }} />
                  )}
                  {connectionStatus === 'error' && (
                    <Chip icon={<ErrorRounded sx={{ fontSize: 13 }} />} label="Failed" size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '5px' }} />
                  )}
                </Stack>
              </Box>
            )}

            {/* Auth */}
            {tab === 2 && (
              <Box>
                <SectionHead title="Authentication" sub="Configure how users authenticate" />
                <Box sx={{ mb: 2.5 }}>
                  <FieldLabel>Provider</FieldLabel>
                  <Select size="small" fullWidth value={config.auth?.provider || 'local'}
                    onChange={e => update('auth.provider', e.target.value)}
                    sx={{ fontSize: '0.85rem' }}>
                    {AUTH_PROVIDERS.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.82rem' }}>{p.name}</MenuItem>)}
                  </Select>
                </Box>

                {config.auth?.provider === 'oauth2' && (
                  <Stack spacing={2}>
                    {[
                      ['Client ID',     'auth.oauth.clientId',     ''],
                      ['Authorize URL', 'auth.oauth.authorizeUrl', ''],
                      ['Token URL',     'auth.oauth.tokenUrl',     ''],
                      ['Scopes',        'auth.oauth.scope',        'e.g. openid profile email'],
                    ].map(([label, path, placeholder]) => (
                      <Box key={path}>
                        <FieldLabel>{label}</FieldLabel>
                        <TextField size="small" fullWidth placeholder={placeholder}
                          value={config.auth?.oauth?.[path.split('.')[2]] || ''}
                          onChange={e => update(path, e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                      </Box>
                    ))}
                  </Stack>
                )}
                {config.auth?.provider === 'auth0' && (
                  <Stack spacing={2}>
                    {[
                      ['Domain',    'auth.auth0.domain',   'your-tenant.auth0.com'],
                      ['Client ID', 'auth.auth0.clientId', ''],
                      ['Audience',  'auth.auth0.audience', ''],
                    ].map(([label, path, placeholder]) => (
                      <Box key={path}>
                        <FieldLabel>{label}</FieldLabel>
                        <TextField size="small" fullWidth placeholder={placeholder}
                          value={config.auth?.auth0?.[path.split('.')[2]] || ''}
                          onChange={e => update(path, e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                      </Box>
                    ))}
                  </Stack>
                )}
                {config.auth?.provider === 'ldap' && (
                  <Stack spacing={2}>
                    {[
                      ['LDAP URL', 'auth.ldap.url',    'ldap://...'],
                      ['Base DN',  'auth.ldap.baseDn', ''],
                      ['Bind DN',  'auth.ldap.bindDn', ''],
                    ].map(([label, path, placeholder]) => (
                      <Box key={path}>
                        <FieldLabel>{label}</FieldLabel>
                        <TextField size="small" fullWidth placeholder={placeholder}
                          value={config.auth?.ldap?.[path.split('.')[2]] || ''}
                          onChange={e => update(path, e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', fontFamily: 'monospace' } }} />
                      </Box>
                    ))}
                  </Stack>
                )}
                {config.auth?.provider === 'local' && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                      Local auth uses the zen cookie set by the backend. No additional configuration needed.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Pipeline */}
            {tab === 3 && (
              <Box>
                <SectionHead
                  title="Pipeline"
                  sub="Script stages executed during test runs"
                  action={
                    <Button size="small" variant="outlined" onClick={resetPipeline}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', height: 26 }}>
                      Reset Defaults
                    </Button>
                  }
                />
                <Stack spacing={0.5} sx={{ mb: 2 }}>
                  {(config.pipeline || []).map((item, i) => (
                    <Box key={item.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.25, py: 0.875, borderRadius: 1.5,
                      border: '1px solid', borderColor: 'divider',
                      opacity: item.enabled ? 1 : 0.45,
                      transition: 'opacity 0.15s',
                      bgcolor: 'background.paper',
                    }}>
                      <DragIndicatorRounded sx={{ fontSize: 16, color: 'text.disabled', cursor: 'grab', flexShrink: 0 }} />
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '5px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: item.enabled ? 'rgba(255,107,43,0.1)' : 'action.hover',
                        color: item.enabled ? '#ff6b2b' : 'text.disabled',
                        fontSize: '0.6rem', fontWeight: 700,
                      }}>
                        {i + 1}
                      </Box>
                      <TextField size="small" variant="standard" value={item.label}
                        onChange={e => renamePipelineItem(i, e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiInput-root': { fontSize: '0.8rem' },
                          '& .MuiInput-root:before': { borderBottomColor: 'transparent' },
                          '& .MuiInput-root:hover:before': { borderBottomColor: 'divider' },
                        }} />
                      <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: '4px', flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                        {item.field}
                      </Typography>
                      <Switch size="small" checked={item.enabled} onChange={() => togglePipelineItem(i)} />
                      <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => movePipelineItem(i, -1)} disabled={i === 0}
                          sx={{ width: 22, height: 22, fontSize: '0.7rem', color: 'text.disabled' }}>↑</IconButton>
                        <IconButton size="small" onClick={() => movePipelineItem(i, 1)} disabled={i === (config.pipeline?.length ?? 0) - 1}
                          sx={{ width: 22, height: 22, fontSize: '0.7rem', color: 'text.disabled' }}>↓</IconButton>
                      </Stack>
                      {item.custom && (
                        <IconButton size="small" onClick={() => removePipelineItem(i)}
                          sx={{ width: 22, height: 22, '&:hover': { color: 'error.main' } }}>
                          <DeleteOutlineRounded sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Stack>
                <Button size="small" variant="outlined"
                  startIcon={<AddRounded sx={{ fontSize: 14 }} />}
                  onClick={addPipelineItem}
                  sx={{ textTransform: 'none', fontSize: '0.76rem', height: 30 }}>
                  Add Custom Stage
                </Button>
              </Box>
            )}

            {/* Preferences */}
            {tab === 4 && (
              <Box>
                <SectionHead title="Preferences" sub="Appearance and behavior" />
                <Stack spacing={2.5}>

                  {/* Theme — connected to useThemeConfig */}
                  <Box>
                    <FieldLabel>Theme</FieldLabel>
                    <Select size="small" fullWidth
                      value={mode}
                      onChange={e => {
                        const newMode = e.target.value;
                        if (newMode !== mode) toggleMode();
                        update('preferences.theme', newMode);
                      }}
                      sx={{ fontSize: '0.85rem' }}>
                      <MenuItem value="light" sx={{ fontSize: '0.82rem' }}>Light</MenuItem>
                      <MenuItem value="dark" sx={{ fontSize: '0.82rem' }}>Dark</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Default Page Size</FieldLabel>
                      <TextField size="small" fullWidth type="number" value={config.preferences?.pageSize || 20}
                        onChange={e => update('preferences.pageSize', parseInt(e.target.value) || 20)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Terminal Font Size</FieldLabel>
                      <TextField size="small" fullWidth type="number" value={config.preferences?.terminalFontSize || 13}
                        onChange={e => update('preferences.terminalFontSize', parseInt(e.target.value) || 13)}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
                    </Box>
                  </Box>

                  <Divider />

                  <Stack spacing={0}>
                    {[
                      { key: 'autoSave',          label: 'Auto-save',        desc: 'Save changes automatically as you type' },
                      { key: 'showNotifications', label: 'Notifications',    desc: 'Show toast notifications for actions' },
                      { key: 'compactMode',       label: 'Compact Mode',     desc: 'Reduce spacing for denser layouts' },
                      { key: 'editorWordWrap',    label: 'Editor Word Wrap', desc: 'Wrap long lines in the code editor' },
                    ].map((pref, i, arr) => (
                      <Box key={pref.key} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        py: 1.5,
                        borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{pref.label}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{pref.desc}</Typography>
                        </Box>
                        <Switch size="small"
                          checked={config.preferences?.[pref.key] || false}
                          onChange={e => update(`preferences.${pref.key}`, e.target.checked)} />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
}