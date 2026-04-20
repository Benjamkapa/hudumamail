// src/ui/pages/modules/billing/usage/index.tsx
//
// Usage & Quotas — /app/billing/usage
//
// Features:
//  - Current plan summary with billing cycle dates
//  - Email sends: used / limit with colour-coded progress bar
//  - Contacts: used / limit
//  - API requests, automations, team seats — same pattern
//  - 30-day daily send volume chart (bar chart via SVG)
//  - Per-resource overage alert when > 90%
//  - "Upgrade plan" CTA when near limits
//  - Role-aware

import { useState, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Divider, LinearProgress,
  Stack, Tooltip, Typography,
} from '@mui/material';

import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import GroupsIcon        from '@mui/icons-material/Groups';
import PeopleAltIcon     from '@mui/icons-material/PeopleAlt';
import SendIcon          from '@mui/icons-material/Send';
import StorageIcon       from '@mui/icons-material/Storage';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import UpgradeIcon       from '@mui/icons-material/Upgrade';
import ApiIcon           from '@mui/icons-material/Api';
import { useNavigate }   from 'react-router-dom';

import { GlassCard }    from '../../../../dashboard/GlassCard';
import { useAuth }      from '../../../../../state/auth/useAuth';
import { Role }         from '../../../../../types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuotaItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
  unit: string;
  resetDate?: string;     // monthly reset
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function pct(used: number, limit: number) {
  return Math.min(100, Math.round((used / limit) * 100));
}

function quotaColor(p: number): 'success' | 'warning' | 'error' {
  if (p >= 95) return 'error';
  if (p >= 80) return 'warning';
  return 'success';
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const PLAN = {
  name:       'Growth',
  price:      '$149',
  cycle:      'monthly',
  renewsOn:   '2025-08-01',
  startedOn:  '2025-07-01',
  daysLeft:   16,
  totalDays:  31,
};

const QUOTAS: QuotaItem[] = [
  {
    id: 'emails',
    label: 'Email sends',
    description: 'Total emails sent this billing period',
    icon: <SendIcon sx={{ fontSize: 20 }} />,
    used: 87_420, limit: 100_000, unit: 'emails', resetDate: 'Aug 1',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    description: 'Active (non-deleted, non-unsubscribed) contacts',
    icon: <PeopleAltIcon sx={{ fontSize: 20 }} />,
    used: 11_840, limit: 15_000, unit: 'contacts',
  },
  {
    id: 'api',
    label: 'API requests',
    description: 'REST API calls in the current calendar month',
    icon: <ApiIcon sx={{ fontSize: 20 }} />,
    used: 142_000, limit: 500_000, unit: 'requests', resetDate: 'Aug 1',
  },
  {
    id: 'automations',
    label: 'Automation flows',
    description: 'Active automation flows running concurrently',
    icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} />,
    used: 3, limit: 10, unit: 'flows',
  },
  {
    id: 'seats',
    label: 'Team seats',
    description: 'Active user accounts on this tenant',
    icon: <GroupsIcon sx={{ fontSize: 20 }} />,
    used: 4, limit: 5, unit: 'seats',
  },
  {
    id: 'storage',
    label: 'Media storage',
    description: 'Total media library storage used',
    icon: <StorageIcon sx={{ fontSize: 20 }} />,
    used: 1_843, limit: 5_120, unit: 'MB',
  },
];

// ─── Build 30-day daily send data ─────────────────────────────────────────────

function buildDailyData(): { day: number; sent: number; date: string }[] {
  const today = 15; // simulate mid-month
  return Array.from({ length: 30 }, (_, i) => {
    const day  = i + 1;
    const isPast = day <= today;
    return {
      day,
      date:  `Jul ${day}`,
      sent:  isPast ? Math.floor(1_200 + Math.random() * 4_800) : 0,
    };
  });
}

const DAILY_DATA = buildDailyData();

// ─── Daily bar chart ──────────────────────────────────────────────────────────

function DailyBarChart({ data }: { data: typeof DAILY_DATA }) {
  const max = Math.max(...data.map(d => d.sent));
  const W   = 100;
  const H   = 80;
  const barW = W / data.length - 0.4;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 96, display: 'block' }}>
        {data.map((d, i) => {
          const h     = max > 0 ? (d.sent / max) * (H - 4) : 0;
          const x     = i * (W / data.length);
          const today = d.day === 15;
          return (
            <Tooltip key={d.day} title={d.sent > 0 ? `${d.date}: ${fmtNum(d.sent)} sent` : d.date} placement="top">
              <rect
                x={x + 0.2} y={H - h} width={barW} height={h}
                rx={0.8}
                fill={today ? '#6366f1' : d.sent > 0 ? '#818cf8' : '#e2e8f0'}
                opacity={d.sent > 0 ? 1 : 0.4}
              />
            </Tooltip>
          );
        })}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.disabled">Jul 1</Typography>
        <Typography variant="caption" color="primary.main" fontWeight={700}>Today (Jul 15)</Typography>
        <Typography variant="caption" color="text.disabled">Jul 30</Typography>
      </Box>
    </Box>
  );
}

// ─── Quota row ────────────────────────────────────────────────────────────────

function QuotaRow({ q }: { q: QuotaItem }) {
  const p   = pct(q.used, q.limit);
  const col = quotaColor(p);

  return (
    <Box sx={{ py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ color: col === 'error' ? 'error.main' : col === 'warning' ? 'warning.main' : 'primary.main' }}>
          {q.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Box>
              <Typography variant="body2" fontWeight={700}>{q.label}</Typography>
              <Typography variant="caption" color="text.disabled">{q.description}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
              <Typography variant="body2" fontWeight={800}>
                {fmtNum(q.used)}
                <Typography component="span" variant="caption" color="text.disabled" fontWeight={400}>
                  {' '}/ {fmtNum(q.limit)} {q.unit}
                </Typography>
              </Typography>
              {q.resetDate && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                  resets {q.resetDate}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate" value={p} color={col}
          sx={{ flex: 1, height: 6, borderRadius: 1 }} />
        <Typography variant="caption" fontWeight={700}
          color={col === 'error' ? 'error.main' : col === 'warning' ? 'warning.main' : 'text.secondary'}>
          {p}%
        </Typography>
      </Box>
      {p >= 90 && (
        <Alert severity={p >= 100 ? 'error' : 'warning'} sx={{ mt: 1, fontSize: 12, py: 0.5 }}>
          {p >= 100
            ? `${q.label} limit reached. Upgrade your plan to continue sending.`
            : `${q.label} is at ${p}% — upgrade soon to avoid service interruption.`}
        </Alert>
      )}
    </Box>
  );
}

// ─── BillingUsagePage ─────────────────────────────────────────────────────────

export function BillingUsagePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const canUpgrade = user?.role !== Role.CLIENT_USER;

  const cycleProgress = Math.round(((PLAN.totalDays - PLAN.daysLeft) / PLAN.totalDays) * 100);

  const criticalQuotas = QUOTAS.filter(q => pct(q.used, q.limit) >= 80);

  const totalSentThisMonth = useMemo(
    () => DAILY_DATA.reduce((a, d) => a + d.sent, 0),
    []
  );

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Usage & quotas</Typography>
          <Typography variant="body2" color="text.secondary">
            Track your resource consumption against plan limits.
          </Typography>
        </Stack>
        {canUpgrade && (
          <Button variant="contained" startIcon={<UpgradeIcon />}
            sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => navigate('/app/billing/plans')}>
            Upgrade plan
          </Button>
        )}
      </Box>

      {/* Plan summary */}
      <GlassCard sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography variant="h6" fontWeight={900}>{PLAN.name} Plan</Typography>
              <Chip label="Current" size="small" color="primary" sx={{ fontSize: 10, height: 20 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {PLAN.price}/month · Renews {PLAN.renewsOn}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Billing period</Typography>
            <Typography variant="body2" fontWeight={700}>
              {PLAN.startedOn} → {PLAN.renewsOn}
            </Typography>
            <Typography variant="caption" color="text.disabled">{PLAN.daysLeft} days remaining</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress variant="determinate" value={cycleProgress}
            sx={{ flex: 1, height: 6, borderRadius: 1 }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary">{cycleProgress}% through cycle</Typography>
        </Box>
      </GlassCard>

      {/* Overuse alerts */}
      {criticalQuotas.length > 0 && (
        <Alert severity="warning" sx={{ fontSize: 13 }}>
          <strong>{criticalQuotas.length} resource{criticalQuotas.length > 1 ? 's are' : ' is'} above 80% usage:</strong>{' '}
          {criticalQuotas.map(q => q.label).join(', ')}.
          Consider upgrading your plan to avoid interruption.
        </Alert>
      )}

      {/* Summary stats */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Sent this month',  value: fmtNum(totalSentThisMonth), sub: `of ${fmtNum(100_000)} limit`,   color: 'primary.main'  },
          { label: 'Contacts',         value: fmtNum(11_840),             sub: `of ${fmtNum(15_000)} limit`,    color: 'text.primary'  },
          { label: 'Active flows',     value: '3',                        sub: 'of 10 limit',                   color: 'text.primary'  },
          { label: 'Days remaining',   value: PLAN.daysLeft.toString(),   sub: `in ${PLAN.name} cycle`,         color: 'text.primary'  },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>{s.value}</Typography>
            <Typography variant="caption" color="text.disabled">{s.sub}</Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Daily send chart */}
      <GlassCard sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>Daily email sends — July 2025</Typography>
            <Typography variant="caption" color="text.disabled">
              {fmtNum(totalSentThisMonth)} total sends · avg {fmtNum(Math.round(totalSentThisMonth / 15))}/day
            </Typography>
          </Box>
          <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        </Box>
        <DailyBarChart data={DAILY_DATA} />
      </GlassCard>

      {/* Quota breakdown */}
      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Resource quotas</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
          All limits reset on your billing renewal date unless noted otherwise.
        </Typography>
        {QUOTAS.map(q => <QuotaRow key={q.id} q={q} />)}
      </GlassCard>

    </Stack>
  );
}