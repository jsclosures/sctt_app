'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Stack, Button, Chip, IconButton,
  Tooltip, LinearProgress, Skeleton, Divider
} from '@mui/material';
import {
  StorageRounded, ScienceRounded, ViewListRounded, TerminalRounded,
  AssessmentRounded, AnalyticsRounded, SettingsRounded, CheckCircleRounded,
  ErrorRounded, PlayArrowRounded, ArrowForwardRounded, AccessTimeRounded,
  TrendingUpRounded, RefreshRounded, HorizontalRuleRounded
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
    { label: 'Manage Assets',    desc: 'Reusable script components',     icon: ViewListRounded,  path: '/assets',        color: '#ff6b2b' },
    { label: 'Configure Tests',  desc: 'Set up test pipelines',           icon: ScienceRounded,   path: '/tests',         color: '#8b5cf6' },
    { label: 'Run Scripts',      desc: 'Execute test scripts',            icon: TerminalRounded,  path: '/script-runner', color: '#06b6d4' },
    { label: 'View Results',     desc: 'Compare and analyze',             icon: AssessmentRounded,path: '/test-results',  color: '#10b981' },
    { label: 'Analyze Metrics',  desc: 'Real-time performance data',      icon: AnalyticsRounded, path: '/analyze',       color: '#f59e0b' },
    { label: 'Settings',         desc: 'Configure workspace',             icon: SettingsRounded,  path: '/settings',      color: '#6b7280' },
  ];

  const workflowSteps = [
    { step: 1, label: 'Create Assets',      desc: 'Build reusable script components',              path: '/assets' },
    { step: 2, label: 'Configure a Test',   desc: 'Link assets to pipeline stages',                path: '/tests' },
    { step: 3, label: 'Run the Pipeline',   desc: 'Build sample → extract → summarize',            path: '/script-runner' },
    { step: 4, label: 'Compare Results',    desc: 'View BEFORE vs AFTER and analyze diffs',        path: '/test-results' },
  ];

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography sx={{
            fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.03em',
            color: 'text.primary', lineHeight: 1,
          }}>
            Dashboard
          </Typography>
          {teamLabel && (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.75 }}>
              {teamLabel}
            </Typography>
          )}
        </Box>
        <Tooltip title="Refresh stats">
          <IconButton onClick={fetchStats} size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
            <RefreshRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Status Strip ─────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <StatusCell
          label="Search Engine"
          loading={loading}
          status={stats.connected === true ? 'ok' : stats.connected === false ? 'error' : 'unknown'}
          primary={searchLabel}
          secondary={connectionUrl}
          first
        />
        <StatusCell
          label="Assets"
          loading={loading}
          primary={stats.assets !== null ? String(stats.assets) : '—'}
          secondary="Reusable script components"
        />
        <StatusCell
          label="Tests"
          loading={loading}
          primary={stats.tests !== null ? String(stats.tests) : '—'}
          secondary="Configured test definitions"
        />
        <StatusCell
          label="Pipeline"
          loading={false}
          primary={`${enabledStages} / ${totalStages}`}
          secondary="Active script stages"
          progress={totalStages > 0 ? (enabledStages / totalStages) * 100 : 0}
        />
      </Box>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <Typography sx={{
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'text.disabled', mb: 1.5,
      }}>
        Quick Actions
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 1,
        mb: 4,
      }}>
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Box
              key={action.label}
              onClick={() => router.push(action.path)}
              sx={{
                p: 2, borderRadius: 2, cursor: 'pointer',
                border: '1px solid', borderColor: 'divider',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: action.color,
                  bgcolor: `${action.color}06`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                bgcolor: `${action.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 1.5,
              }}>
                <Icon sx={{ fontSize: 16, color: action.color }} />
              </Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', mb: 0.25, lineHeight: 1.2 }}>
                {action.label}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.4 }}>
                {action.desc}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── Bottom Row ────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

        {/* Workflow */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography sx={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'text.disabled', mb: 2,
          }}>
            Typical Workflow
          </Typography>
          <Stack spacing={0}>
            {workflowSteps.map((item, idx) => (
              <Box key={item.step}>
                <Box
                  onClick={() => router.push(item.path)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    py: 1.5, px: 1, borderRadius: 1.5, cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:hover .arrow': { opacity: 1, transform: 'translateX(2px)' },
                  }}
                >
                  <Box sx={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(255,107,43,0.08)', color: '#ff6b2b',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {item.step}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                  <ArrowForwardRounded
                    className="arrow"
                    sx={{
                      fontSize: 15, color: 'text.disabled',
                      opacity: 0, transition: 'all 0.15s ease',
                    }}
                  />
                </Box>
                {idx < workflowSteps.length - 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', pl: '20px', py: '2px' }}>
                    <Box sx={{ width: 1, height: 12, borderLeft: '1px dashed', borderColor: 'divider', ml: '12px' }} />
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Activity */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography sx={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'text.disabled', mb: 2,
          }}>
            Recent Activity
          </Typography>

          {stats.connected === false ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
              }}>
                <ErrorRounded sx={{ fontSize: 20, color: '#ef4444' }} />
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                Backend offline
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Make sure the server is running on port 8180
              </Typography>
            </Box>
          ) : stats.assets === 0 && stats.tests === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,107,43,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
              }}>
                <PlayArrowRounded sx={{ fontSize: 20, color: '#ff6b2b' }} />
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                Ready to start
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 2 }}>
                Create your first asset to begin
              </Typography>
              <Button variant="outlined" size="small" onClick={() => router.push('/assets')}
                sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
                Create First Asset
              </Button>
            </Box>
          ) : (
            <Stack spacing={0} divider={<Divider />}>
              {[
                stats.assets > 0 && {
                  icon: ViewListRounded, color: '#ff6b2b',
                  label: `${stats.assets} asset${stats.assets !== 1 ? 's' : ''} available`,
                  sub: 'Ready for use in test pipelines',
                  action: () => router.push('/assets'),
                },
                stats.tests > 0 && {
                  icon: ScienceRounded, color: '#8b5cf6',
                  label: `${stats.tests} test${stats.tests !== 1 ? 's' : ''} configured`,
                  sub: 'Available for execution',
                  action: () => router.push('/tests'),
                },
                {
                  icon: TrendingUpRounded, color: '#10b981',
                  label: 'Pipeline ready',
                  sub: `${enabledStages} of ${totalStages} stages enabled`,
                  action: () => router.push('/settings'),
                },
              ].filter(Boolean).map((item, i) => {
                const Icon = item.icon;
                return (
                  <Box
                    key={i}
                    onClick={item.action}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      py: 1.5, px: 1, borderRadius: 1.5, cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                      bgcolor: `${item.color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon sx={{ fontSize: 15, color: item.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'text.primary' }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {item.sub}
                      </Typography>
                    </Box>
                    <ArrowForwardRounded sx={{ fontSize: 14, color: 'text.disabled', opacity: 0.5 }} />
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

// ─── Status Strip Cell ────────────────────────────────────────────

function StatusCell({ label, loading, status, primary, secondary, progress, first }) {
  return (
    <Box sx={{
      px: 2.5, py: 2,
      borderRight: first ? '1px solid' : 'none',
      borderColor: 'divider',
      position: 'relative',
      '&:not(:last-child)': { borderRight: '1px solid', borderColor: 'divider' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography sx={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.09em', color: 'text.disabled',
        }}>
          {label}
        </Typography>
        {status && (
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%',
            bgcolor: status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b',
            boxShadow: status === 'ok' ? '0 0 0 2px rgba(34,197,94,0.2)' : status === 'error' ? '0 0 0 2px rgba(239,68,68,0.2)' : '0 0 0 2px rgba(245,158,11,0.2)',
          }} />
        )}
      </Box>
      {loading ? (
        <Skeleton width={60} height={28} sx={{ mb: 0.25 }} />
      ) : (
        <Typography sx={{
          fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
          color: 'text.primary', lineHeight: 1.1, mb: 0.4,
        }}>
          {primary}
        </Typography>
      )}
      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.3 }}>
        {secondary}
      </Typography>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1.5, height: 2, borderRadius: 1, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #ff6b2b, #ffab87)',
              borderRadius: 1,
            },
          }}
        />
      )}
    </Box>
  );
}