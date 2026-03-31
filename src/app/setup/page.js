'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, IconButton, Chip, Stack,
  LinearProgress, Fade, CircularProgress, Paper
} from '@mui/material';
import {
  StorageRounded, SecurityRounded, AccountTreeRounded,
  TuneRounded, RocketLaunchRounded, CheckCircleRounded,
  DragIndicatorRounded, ArrowForwardRounded, ArrowBackRounded,
  DeleteOutlineRounded, AddRounded, LinkRounded
} from '@mui/icons-material';
import { getDefaultConfig, saveConfig, markSetupComplete } from '@/lib/config';

const SEARCH_PROVIDERS = [
  { id: 'solr', name: 'Apache Solr', desc: 'Full-text search platform built on Lucene', color: '#D9411E' },
  { id: 'elasticsearch', name: 'Elasticsearch', desc: 'Distributed RESTful search and analytics engine', color: '#00BFB3' },
  { id: 'opensearch', name: 'OpenSearch', desc: 'Community-driven, open-source search suite', color: '#005EB8' },
  { id: 'typesense', name: 'Typesense', desc: 'Fast, typo-tolerant search engine', color: '#5928ED' },
  { id: 'meilisearch', name: 'Meilisearch', desc: 'Lightning-fast, hyper-relevant search engine', color: '#FF5CAA' },
];

const AUTH_PROVIDERS = [
  { id: 'local', name: 'Local Auth', desc: 'Built-in username/password authentication' },
  { id: 'oauth2', name: 'OAuth 2.0', desc: 'Industry-standard authorization protocol' },
  { id: 'auth0', name: 'Auth0', desc: 'Universal authentication & authorization platform' },
  { id: 'ldap', name: 'LDAP / SAML', desc: 'Enterprise directory service authentication' },
];

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: RocketLaunchRounded },
  { id: 'search', label: 'Search Engine', icon: StorageRounded },
  { id: 'auth', label: 'Authentication', icon: SecurityRounded },
  { id: 'pipeline', label: 'Pipeline', icon: AccountTreeRounded },
  { id: 'preferences', label: 'Preferences', icon: TuneRounded },
  { id: 'launch', label: 'Launch', icon: CheckCircleRounded },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(getDefaultConfig());
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);

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
  };

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus('success');
    setTesting(false);
  };

  const handleLaunch = () => {
    saveConfig(config);
    markSetupComplete();
    router.push('/');
  };

  const movePipelineItem = (fromIndex, direction) => {
    const items = [...config.pipeline];
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= items.length) return;
    [items[fromIndex], items[toIndex]] = [items[toIndex], items[fromIndex]];
    update('pipeline', items);
  };

  const togglePipelineItem = (index) => {
    const items = [...config.pipeline];
    items[index] = { ...items[index], enabled: !items[index].enabled };
    update('pipeline', items);
  };

  const renamePipelineItem = (index, label) => {
    const items = [...config.pipeline];
    items[index] = { ...items[index], label };
    update('pipeline', items);
  };

  const removePipelineItem = (index) => {
    const items = [...config.pipeline];
    items.splice(index, 1);
    update('pipeline', items);
  };

  const addPipelineItem = () => {
    const items = [...config.pipeline];
    const id = `custom_${Date.now()}`;
    items.push({
      id, label: 'Custom Stage', field: `test${id}script`,
      argsField: `test${id}script_s`, enabled: true, custom: true,
    });
    update('pipeline', items);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 280, bgcolor: '#ffffff', color: '#fff', p: 4,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <Box>
            <Box sx={{ mb: 6 }}>
                <Box
                    component="img"
                    src="/assets/sctt.PNG"
                    alt="SCTT"
                    sx={{ height: 150, display: 'block' }}
                />
                <Typography sx={{ fontSize: '0.75rem', color: '#71717a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Initial Setup
                </Typography>
            </Box>

          <Stack spacing={0.5}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <Box
                  key={s.id}
                  onClick={() => i <= step && setStep(i)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: '10px 12px', borderRadius: '8px',
                    cursor: i <= step ? 'pointer' : 'default',
                    bgcolor: isActive ? 'rgba(255,107,43,0.12)' : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': i <= step ? { bgcolor: isActive ? 'rgba(255,107,43,0.16)' : 'rgba(255,255,255,0.04)' } : {},
                  }}
                >
                  <Icon sx={{
                    fontSize: 18,
                    color: isDone ? '#22c55e' : isActive ? '#ff6b2b' : '#52525b',
                  }} />
                  <Typography sx={{
                    fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
                    color: isDone ? '#a1a1aa' : isActive ? '#fff' : '#52525b',
                  }}>
                    {s.label}
                  </Typography>
                  {isDone && <CheckCircleRounded sx={{ fontSize: 14, color: '#22c55e', ml: 'auto' }} />}
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3, borderRadius: 2, bgcolor: '#27272a',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ff6b2b, #ff8c52)',
                borderRadius: 2,
              },
            }}
          />
          <Typography sx={{ fontSize: '0.7rem', color: '#52525b', mt: 1, textAlign: 'center' }}>
            Step {step + 1} of {STEPS.length}
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, maxWidth: 720, mx: 'auto', width: '100%', p: 6 }}>
          <Fade in key={step} timeout={300}>
            <Box>
              {/* Welcome */}
              {step === 0 && (
                <Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', mb: 1, color: '#18181b' }}>
                    Welcome to SCTT
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', color: '#71717a', mb: 5, lineHeight: 1.6 }}>
                    Search Configuration & Testing Toolkit. Let's get your workspace configured
                    for search relevance testing, performance benchmarking, and result comparison.
                    </Typography>

                    <Stack spacing={3}>
                    <TextField
                        label="Team / Organization"
                        fullWidth
                        value={config.workspace.team}
                        onChange={e => update('workspace.team', e.target.value)}
                        helperText="Your company or team name"
                    />
                    <TextField
                        label="Project Name"
                        fullWidth
                        value={config.workspace.project}
                        onChange={e => update('workspace.project', e.target.value)}
                        helperText="Optional — useful if running multiple SCTT instances"
                    />
                    </Stack>
                </Box>
            )}

              {/* Search Engine */}
              {step === 1 && (
                <Box>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 1, color: '#18181b' }}>
                    Search Engine
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#71717a', mb: 4 }}>
                    Select and configure the search engine you want to test against.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5, mb: 4 }}>
                    {SEARCH_PROVIDERS.map(p => (
                      <Paper
                        key={p.id}
                        onClick={() => update('search.provider', p.id)}
                        sx={{
                          p: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          borderColor: config.search.provider === p.id ? '#ff6b2b' : undefined,
                          boxShadow: config.search.provider === p.id ? '0 0 0 1px #ff6b2b' : 'none',
                          '&:hover': { borderColor: '#ff6b2b' },
                        }}
                      >
                        <Box sx={{
                          width: 8, height: 8, borderRadius: '50%', bgcolor: p.color, mb: 1.5,
                        }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#18181b', mb: 0.5 }}>
                          {p.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                          {p.desc}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>

                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Host"
                        fullWidth
                        value={config.search.host}
                        onChange={e => update('search.host', e.target.value)}
                      />
                      <TextField
                        label="Port"
                        type="number"
                        sx={{ width: 120 }}
                        value={config.search.port}
                        onChange={e => update('search.port', parseInt(e.target.value) || 0)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Collection / Index"
                        fullWidth
                        value={config.search.collection}
                        onChange={e => update('search.collection', e.target.value)}
                      />
                      <TextField
                        label="Path Prefix"
                        sx={{ width: 160 }}
                        value={config.search.prefix}
                        onChange={e => update('search.prefix', e.target.value)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.search.https}
                            onChange={e => update('search.https', e.target.checked)}
                          />
                        }
                        label="Use HTTPS"
                      />
                      <TextField
                        label="Auth Key (Base64)"
                        fullWidth
                        value={config.search.authKey}
                        onChange={e => update('search.authKey', e.target.value)}
                        type="password"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        startIcon={testing ? <CircularProgress size={16} /> : <LinkRounded />}
                        onClick={testConnection}
                        disabled={testing}
                      >
                        {testing ? 'Testing...' : 'Test Connection'}
                      </Button>
                      {connectionStatus === 'success' && (
                        <Chip
                          icon={<CheckCircleRounded />}
                          label="Connected"
                          size="small"
                          sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#16a34a', fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Authentication */}
              {step === 2 && (
                <Box>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 1, color: '#18181b' }}>
                    Authentication
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#71717a', mb: 4 }}>
                    Choose how users authenticate with the dashboard.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 4 }}>
                    {AUTH_PROVIDERS.map(p => (
                      <Paper
                        key={p.id}
                        onClick={() => update('auth.provider', p.id)}
                        sx={{
                          p: 2.5, cursor: 'pointer',
                          borderColor: config.auth.provider === p.id ? '#ff6b2b' : undefined,
                          boxShadow: config.auth.provider === p.id ? '0 0 0 1px #ff6b2b' : 'none',
                          '&:hover': { borderColor: '#ff6b2b' },
                        }}
                      >
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#18181b', mb: 0.5 }}>
                          {p.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                          {p.desc}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>

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
                      <TextField label="Domain" fullWidth value={config.auth.auth0.domain} onChange={e => update('auth.auth0.domain', e.target.value)} placeholder="your-tenant.auth0.com" />
                      <TextField label="Client ID" fullWidth value={config.auth.auth0.clientId} onChange={e => update('auth.auth0.clientId', e.target.value)} />
                      <TextField label="Audience" fullWidth value={config.auth.auth0.audience} onChange={e => update('auth.auth0.audience', e.target.value)} />
                    </Stack>
                  )}

                  {config.auth.provider === 'ldap' && (
                    <Stack spacing={2.5}>
                      <TextField label="LDAP URL" fullWidth value={config.auth.ldap.url} onChange={e => update('auth.ldap.url', e.target.value)} placeholder="ldap://ldap.example.com:389" />
                      <TextField label="Base DN" fullWidth value={config.auth.ldap.baseDn} onChange={e => update('auth.ldap.baseDn', e.target.value)} placeholder="dc=example,dc=com" />
                      <TextField label="Bind DN" fullWidth value={config.auth.ldap.bindDn} onChange={e => update('auth.ldap.bindDn', e.target.value)} />
                    </Stack>
                  )}

                  {config.auth.provider === 'local' && (
                    <Paper sx={{ p: 3, bgcolor: '#fafafa' }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#71717a', lineHeight: 1.6 }}>
                        Local authentication uses the built-in username/password system. Users are managed
                        directly through the backend. No external identity provider required.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

            {step === 3 && (
                <Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 1, color: '#18181b' }}>
                    Test Pipeline
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#71717a', mb: 4 }}>
                    Configure the script stages that make up your testing workflow. Drag to reorder, rename, or disable stages.
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 3 }}>
                    {config.pipeline.map((item, index) => (
                        <Paper
                        key={item.id}
                        draggable
                        onDragStart={e => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', index.toString());
                            e.currentTarget.style.opacity = '0.4';
                        }}
                        onDragEnd={e => {
                            e.currentTarget.style.opacity = '1';
                        }}
                        onDragOver={e => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            e.currentTarget.style.borderTop = '2px solid #ff6b2b';
                        }}
                        onDragLeave={e => {
                            e.currentTarget.style.borderTop = '';
                        }}
                        onDrop={e => {
                            e.preventDefault();
                            e.currentTarget.style.borderTop = '';
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (fromIndex === index || isNaN(fromIndex)) return;
                            const items = [...config.pipeline];
                            const [moved] = items.splice(fromIndex, 1);
                            items.splice(index, 0, moved);
                            update('pipeline', items);
                        }}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, p: '8px 12px',
                            opacity: item.enabled ? 1 : 0.5,
                            transition: 'opacity 0.15s ease',
                        }}
                        >
                        <DragIndicatorRounded sx={{ fontSize: 18, color: '#a1a1aa', cursor: 'grab', '&:active': { cursor: 'grabbing' } }} />

                        <Box sx={{
                            width: 24, height: 24, borderRadius: '6px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: item.enabled ? 'rgba(255,107,43,0.1)' : '#f4f4f5',
                            color: item.enabled ? '#ff6b2b' : '#a1a1aa',
                            fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                        }}>
                            {index + 1}
                        </Box>

                        <TextField
                            size="small"
                            variant="standard"
                            value={item.label}
                            onChange={e => renamePipelineItem(index, e.target.value)}
                            onMouseDown={e => e.stopPropagation()}
                            sx={{
                            flex: 1,
                            '& .MuiInput-root': { fontSize: '0.85rem' },
                            '& .MuiInput-root:before': { borderBottom: '1px solid transparent' },
                            '& .MuiInput-root:hover:before': { borderBottom: '1px solid #e4e4e7 !important' },
                            }}
                            InputProps={{ disableUnderline: false }}
                        />

                        <Typography sx={{
                            fontSize: '0.65rem', color: '#a1a1aa', fontFamily: 'monospace',
                            bgcolor: '#f4f4f5', px: 1, py: 0.25, borderRadius: '4px', flexShrink: 0,
                        }}>
                            {item.field}
                        </Typography>

                        <Switch
                            size="small"
                            checked={item.enabled}
                            onChange={() => togglePipelineItem(index)}
                        />

                        <IconButton size="small" onClick={() => movePipelineItem(index, -1)} disabled={index === 0} sx={{ p: 0.5 }}>
                            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>↑</Typography>
                        </IconButton>
                        <IconButton size="small" onClick={() => movePipelineItem(index, 1)} disabled={index === config.pipeline.length - 1} sx={{ p: 0.5 }}>
                            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>↓</Typography>
                        </IconButton>

                        {item.custom && (
                            <IconButton size="small" onClick={() => removePipelineItem(index)} sx={{ p: 0.5 }}>
                            <DeleteOutlineRounded sx={{ fontSize: 16, color: '#ef4444' }} />
                            </IconButton>
                        )}
                        </Paper>
                    ))}
                    </Stack>

                    <Button variant="outlined" size="small" startIcon={<AddRounded />} onClick={addPipelineItem}>
                    Add Custom Stage
                    </Button>
                </Box>
            )}
              {/* Preferences */}
              {step === 4 && (
                <Box>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 1, color: '#18181b' }}>
                    Preferences
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#71717a', mb: 4 }}>
                    Customize the look and behavior of your workspace.
                  </Typography>

                  <Stack spacing={3}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={config.preferences.theme}
                        label="Theme"
                        onChange={e => update('preferences.theme', e.target.value)}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="system">System</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Default Page Size"
                        type="number"
                        value={config.preferences.pageSize}
                        onChange={e => update('preferences.pageSize', parseInt(e.target.value) || 20)}
                        sx={{ width: 180 }}
                      />
                      <TextField
                        label="Terminal Font Size"
                        type="number"
                        value={config.preferences.terminalFontSize}
                        onChange={e => update('preferences.terminalFontSize', parseInt(e.target.value) || 13)}
                        sx={{ width: 180 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={<Switch checked={config.preferences.autoSave} onChange={e => update('preferences.autoSave', e.target.checked)} />}
                        label={<Box><Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#18181b' }}>Auto-save</Typography><Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Automatically save changes as you type</Typography></Box>}
                      />
                      <FormControlLabel
                        control={<Switch checked={config.preferences.showNotifications} onChange={e => update('preferences.showNotifications', e.target.checked)} />}
                        label={<Box><Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#18181b' }}>Notifications</Typography><Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Show toast notifications for actions</Typography></Box>}
                      />
                      <FormControlLabel
                        control={<Switch checked={config.preferences.compactMode} onChange={e => update('preferences.compactMode', e.target.checked)} />}
                        label={<Box><Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#18181b' }}>Compact Mode</Typography><Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Reduce spacing for denser layouts</Typography></Box>}
                      />
                      <FormControlLabel
                        control={<Switch checked={config.preferences.editorWordWrap} onChange={e => update('preferences.editorWordWrap', e.target.checked)} />}
                        label={<Box><Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#18181b' }}>Editor Word Wrap</Typography><Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Wrap long lines in the code editor</Typography></Box>}
                      />
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Launch */}
              {step === 5 && (
                <Box>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 1, color: '#18181b' }}>
                    Ready to Launch
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#71717a', mb: 4 }}>
                    Review your configuration and launch the dashboard.
                  </Typography>

                  <Stack spacing={2}>
                    {[
                      { label: 'Workspace', value: [config.workspace.team, config.workspace.project].filter(Boolean).join(' — ') || 'SCTT' },
                      { label: 'Search Engine', value: `${SEARCH_PROVIDERS.find(p => p.id === config.search.provider)?.name} @ ${config.search.host}:${config.search.port}` },
                      { label: 'Authentication', value: AUTH_PROVIDERS.find(p => p.id === config.auth.provider)?.name },
                      { label: 'Pipeline Stages', value: `${config.pipeline.filter(p => p.enabled).length} of ${config.pipeline.length} enabled` },
                      { label: 'Theme', value: config.preferences.theme.charAt(0).toUpperCase() + config.preferences.theme.slice(1) },
                    ].map(row => (
                      <Paper key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#71717a' }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#18181b' }}>{row.value}</Typography>
                      </Paper>
                    ))}
                  </Stack>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleLaunch}
                    sx={{
                      mt: 4, py: 1.5, fontSize: '1rem', fontWeight: 600,
                      background: 'linear-gradient(135deg, #ff6b2b 0%, #e85d1e 100%)',
                    }}
                    endIcon={<RocketLaunchRounded />}
                  >
                    Launch Dashboard
                  </Button>
                </Box>
              )}
            </Box>
          </Fade>
        </Box>

        {/* Footer Nav */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', p: 3,
          borderTop: '1px solid #e4e4e7', bgcolor: '#fff',
        }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRounded />}
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {step < STEPS.length - 1 && (
              <Button variant="text" onClick={() => { saveConfig(config); markSetupComplete(); router.push('/'); }} sx={{ color: '#a1a1aa' }}>
                Skip Setup
              </Button>
            )}
            {step < STEPS.length - 1 && (
              <Button variant="contained" endIcon={<ArrowForwardRounded />} onClick={next}>
                Continue
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}