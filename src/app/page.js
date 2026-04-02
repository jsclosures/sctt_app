'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Stack, Button, Chip, IconButton,
  Tooltip, LinearProgress, Skeleton
} from '@mui/material';
import {
  StorageRounded, ScienceRounded, ViewListRounded, TerminalRounded,
  AssessmentRounded, AnalyticsRounded, SettingsRounded, CheckCircleRounded,
  ErrorRounded, PlayArrowRounded, ArrowForwardRounded, AccessTimeRounded,
  TrendingUpRounded, RefreshRounded
} from '@mui/icons-material';
import { getAssets } from '@/services/assetService';
import { getTests } from '@/services/testService';
import { ensureAuth } from '@/lib/api';
import { getConfig } from '@/lib/config';

const SEARCH_LABELS = {
  solr: 'Apache Solr',
  elasticsearch: 'Elasticsearch',
  opensearch: 'OpenSearch',
  typesense: 'Typesense',
  meilisearch: 'Meilisearch',
};

export default function DashboardPage() {
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({ assets: null, tests: null, connected: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setConfig(getConfig());
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      await ensureAuth();
      const [assetData, testData] = await Promise.allSettled([
        getAssets(0, 1),
        getTests(0, 1),
      ]);

      setStats({
        assets: assetData.status === 'fulfilled' ? assetData.value.total : null,
        tests: testData.status === 'fulfilled' ? testData.value.total : null,
        connected: assetData.status === 'fulfilled' || testData.status === 'fulfilled',
      });
    } catch {
      setStats({ assets: null, tests: null, connected: false });
    }
    setLoading(false);
  };

  if (!config) return null;

  const searchLabel = SEARCH_LABELS[config.search?.provider] || config.search?.provider || 'Not configured';
  const connectionUrl = `${config.search?.https ? 'https' : 'http'}://${config.search?.host}:${config.search?.port}`;
  const enabledStages = config.pipeline?.filter(p => p.enabled).length || 0;
  const totalStages = config.pipeline?.length || 0;
  const teamLabel = [config.workspace?.team, config.workspace?.project].filter(Boolean).join(' · ') || null;

  const quickActions = [
    { label: 'Manage Assets', desc: 'Create and edit reusable scripts', icon: ViewListRounded, path: '/assets', color: '#ff6b2b' },
    { label: 'Configure Tests', desc: 'Set up test pipelines', icon: ScienceRounded, path: '/tests', color: '#8b5cf6' },
    { label: 'Run Scripts', desc: 'Execute test scripts', icon: TerminalRounded, path: '/script-runner', color: '#06b6d4' },
    { label: 'View Results', desc: 'Compare and analyze', icon: AssessmentRounded, path: '/test-results', color: '#10b981' },
    { label: 'Analyze Metrics', desc: 'Real-time performance data', icon: AnalyticsRounded, path: '/analyze', color: '#f59e0b' },
    { label: 'Settings', desc: 'Configure workspace', icon: SettingsRounded, path: '/settings', color: '#6b7280' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'text.primary', mb: 0.5 }}>
            Dashboard
          </Typography>
          {teamLabel && (
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
              {teamLabel}
            </Typography>
          )}
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchStats} size="small">
            <RefreshRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 4 }}>
        <StatusCard
          label="Search Engine"
          value={searchLabel}
          sub={connectionUrl}
          loading={loading}
          status={stats.connected === true ? 'ok' : stats.connected === false ? 'error' : 'unknown'}
          icon={StorageRounded}
        />
        <StatusCard
          label="Assets"
          value={stats.assets !== null ? stats.assets : '—'}
          sub="Reusable script components"
          loading={loading}
          icon={ViewListRounded}
        />
        <StatusCard
          label="Tests"
          value={stats.tests !== null ? stats.tests : '—'}
          sub="Configured test definitions"
          loading={loading}
          icon={ScienceRounded}
        />
        <StatusCard
          label="Pipeline"
          value={`${enabledStages} / ${totalStages}`}
          sub="Active script stages"
          loading={false}
          icon={TrendingUpRounded}
          progress={totalStages > 0 ? (enabledStages / totalStages) * 100 : 0}
        />
      </Box>

      {/* Quick Actions */}
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1.5 }}>
        Quick Actions
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5, mb: 4 }}>
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Paper
              key={action.label}
              onClick={() => router.push(action.path)}
              sx={{
                p: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: action.color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${action.color}15`,
                },
              }}
            >
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', mb: 1.5,
                bgcolor: `${action.color}12`,
              }}>
                <Icon sx={{ fontSize: 18, color: action.color }} />
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                {action.label}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.4 }}>
                {action.desc}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Workflow + Activity */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Typical Workflow */}
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
            Typical Workflow
          </Typography>
          <Stack spacing={1.5}>
            {[
              { step: 1, label: 'Create Assets', desc: 'Build reusable script components', path: '/assets' },
              { step: 2, label: 'Configure a Test', desc: 'Link assets to pipeline stages', path: '/tests' },
              { step: 3, label: 'Run the Pipeline', desc: 'Execute harvest → build → extract → summarize', path: '/script-runner' },
              { step: 4, label: 'Compare Results', desc: 'View BEFORE vs AFTER and analyze diffs', path: '/test-results' },
            ].map(item => (
              <Box
                key={item.step}
                onClick={() => router.push(item.path)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5, borderRadius: '8px', cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {item.step}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {item.desc}
                  </Typography>
                </Box>
                <ArrowForwardRounded sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.4 }} />
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Recent Activity */}
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
            Recent Activity
          </Typography>
          <Stack spacing={1.5}>
            {stats.connected === false ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <ErrorRounded sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                  Unable to connect to the backend
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.5 }}>
                  Make sure the server is running on port 8180
                </Typography>
              </Box>
            ) : stats.tests === 0 && stats.assets === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <PlayArrowRounded sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                  No activity yet
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.5 }}>
                  Start by creating assets and configuring tests
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/assets')}
                >
                  Create First Asset
                </Button>
              </Box>
            ) : (
              <>
                {stats.assets > 0 && (
                  <ActivityRow
                    icon={ViewListRounded}
                    label={`${stats.assets} asset${stats.assets !== 1 ? 's' : ''} available`}
                    sub="Ready for use in test pipelines"
                    color="#ff6b2b"
                  />
                )}
                {stats.tests > 0 && (
                  <ActivityRow
                    icon={ScienceRounded}
                    label={`${stats.tests} test${stats.tests !== 1 ? 's' : ''} configured`}
                    sub="Available for execution"
                    color="#8b5cf6"
                  />
                )}
                <ActivityRow
                  icon={AccessTimeRounded}
                  label="Pipeline ready"
                  sub={`${enabledStages} stages enabled`}
                  color="#10b981"
                />
              </>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

function StatusCard({ label, value, sub, loading, status, icon: Icon, progress }) {
  return (
    <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          {label}
        </Typography>
        {status && (
          <Chip
            size="small"
            label={status === 'ok' ? 'Connected' : status === 'error' ? 'Offline' : 'Checking'}
            icon={status === 'ok' ? <CheckCircleRounded /> : status === 'error' ? <ErrorRounded /> : undefined}
            sx={{
              height: 20, fontSize: '0.6rem', fontWeight: 600,
              bgcolor: status === 'ok' ? 'rgba(34,197,94,0.1)' : status === 'error' ? 'rgba(239,68,68,0.1)' : 'action.hover',
              color: status === 'ok' ? '#16a34a' : status === 'error' ? '#ef4444' : 'text.secondary',
              '& .MuiChip-icon': { fontSize: 12 },
            }}
          />
        )}
      </Box>
      {loading ? (
        <Skeleton width={80} height={32} />
      ) : (
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', mb: 0.25 }}>
          {value}
        </Typography>
      )}
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
        {sub}
      </Typography>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1.5, height: 3, borderRadius: 2, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #ff6b2b, #ff8c52)', borderRadius: 2 },
          }}
        />
      )}
    </Paper>
  );
}

function ActivityRow({ icon: Icon, label, sub, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: '8px' }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '8px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        bgcolor: `${color}12`,
      }}>
        <Icon sx={{ fontSize: 15, color }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'text.primary' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{sub}</Typography>
      </Box>
    </Box>
  );
}