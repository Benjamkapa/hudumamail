import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Tooltip,
  Alert,
} from '@mui/material';

import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MouseIcon from '@mui/icons-material/Mouse';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import BlockIcon from '@mui/icons-material/Block';

import { StatCard } from '../../../dashboard/StatCard';
import { AreaChartCard } from '../../../dashboard/AreaChartCard';
import { EngagementGauge } from '../../../dashboard/EngagementGauge';
import { GlassCard } from '../../../dashboard/GlassCard';
import { useAuth } from '../../../../state/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview } from '../../../../lib/api/dashboardApi';
import { Role } from '../../../../types/auth';

// --- Helpers ---------------------------------------------------------------

const buildMonthLabels = () => {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setMonth(start.getMonth() - 11);
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(d.toLocaleString('en-US', { month: 'short' }));
  }
  return months;
};

const EMPTY_HEATMAP = Array.from({ length: 364 }, () => 0);

type ActivityType = 'campaign'|'contacts'|'domain'|'warning'|'client'|'stats';
type ActivityItem  = { id: string; action: string; time: string; type: ActivityType };

const activityColor: Record<ActivityType, string> = {
  campaign: '#0284c7',
  contacts: '#16a34a',
  domain:   '#ea580c',
  warning:  '#dc2626',
  client:   '#7c3aed',
  stats:    '#64748b',
};

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: 'success'|'warning'|'default'|'info' }> = {
    sent:      { label: 'Sent',      color: 'success' },
    sending:   { label: 'Sending',   color: 'info'    },
    draft:     { label: 'Draft',     color: 'default' },
    scheduled: { label: 'Scheduled', color: 'warning' },
  };
  const cfg = map[status] ?? { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />;
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>{title}</Typography>
      {action}
    </Box>
  );
}

// --- Heatmap ---------------------------------------------------------------

const WEEK_DAYS     = ['Mon','','Wed','','Fri','','Sun'];
const HEATMAP_MNTHS = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'];
const HEAT_LEVELS   = ['primary.100','primary.200','primary.400','primary.600','primary.main'] as const;

function heatLevel(value: number, max: number): number {
  if (value === 0) return -1;
  const r = value / max;
  if (r < 0.15) return 0;
  if (r < 0.35) return 1;
  if (r < 0.6)  return 2;
  if (r < 0.85) return 3;
  return 4;
}

function ContactHeatmap({ data, title, subtitle }: { data: number[]; title: string; subtitle: string }) {
  const CELL = 12; const GAP = 2; const STEP = CELL + GAP;
  const WEEKS = 52; const DAYS = 7; const LABEL_W = 24; const MONTH_H = 18;
  const max   = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);
  const gridW = LABEL_W + WEEKS * STEP;
  const gridH = MONTH_H + DAYS  * STEP;

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1}>{total.toLocaleString()}</Typography>
          <Typography variant="caption" color="success.main" fontWeight={600}>contacts added</Typography>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <svg width={gridW} height={gridH} style={{ display: 'block' }}>
          {HEATMAP_MNTHS.map((m, i) => (
            <text key={m} x={LABEL_W + Math.floor((i / HEATMAP_MNTHS.length) * WEEKS) * STEP} y={12}
              style={{ fontSize: 9, fill: 'var(--color-text-secondary,#888)', fontFamily: 'inherit' }}>{m}</text>
          ))}
          {WEEK_DAYS.map((d, di) => d ? (
            <text key={di} x={0} y={MONTH_H + di * STEP + CELL * 0.8}
              style={{ fontSize: 8, fill: 'var(--color-text-secondary,#888)', fontFamily: 'inherit' }}>{d}</text>
          ) : null)}
          {Array.from({ length: WEEKS }, (_, wi) =>
            Array.from({ length: DAYS }, (_, di) => {
              const idx   = wi * DAYS + di;
              const value = data[idx] ?? 0;
              const level = heatLevel(value, max);
              return (
                <Tooltip key={`${wi}-${di}`}
                  title={value > 0 ? `${value.toLocaleString()} contacts added` : 'No new contacts'}
                  placement="top" arrow>
                  <Box component="rect"
                    x={LABEL_W + wi * STEP} y={MONTH_H + di * STEP}
                    width={CELL} height={CELL} rx={2}
                    sx={{
                      fill:   level === -1 ? 'action.selected' : HEAT_LEVELS[level],
                      cursor: value > 0 ? 'pointer' : 'default',
                      '&:hover': value > 0 ? { opacity: 0.7 } : {},
                    }}
                  />
                </Tooltip>
              );
            })
          )}
        </svg>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Less</Typography>
        {(['action.selected', ...HEAT_LEVELS] as const).map((c, i) => (
          <Box key={i} sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: c, border: '1px solid', borderColor: 'divider' }} />
        ))}
        <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>More</Typography>
      </Box>
    </GlassCard>
  );
}

// --- Deliverability panel --------------------------------------------------

function DeliverabilityPanel({ stats }: { stats: { deliveryRate: number; bounceRate: number; complaintRate: number; unsubscribeRate: number } }) {
  const rows = [
    { label: 'Delivery rate',    value: stats.deliveryRate,    unit: '%', good: (v: number) => v >= 97,   fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Bounce rate',      value: stats.bounceRate,      unit: '%', good: (v: number) => v < 2,     fmt: (v: number) => `${v.toFixed(2)}%` },
    { label: 'Complaint rate',   value: stats.complaintRate,   unit: '%', good: (v: number) => v < 0.1,   fmt: (v: number) => `${v.toFixed(3)}%` },
    { label: 'Unsubscribe rate', value: stats.unsubscribeRate, unit: '%', good: (v: number) => v < 0.5,   fmt: (v: number) => `${v.toFixed(2)}%` },
  ];

  const hasAlert = rows.some(r => !r.good(r.value));

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <SectionHeader title="Deliverability health" />

      {hasAlert && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }}>
          One or more metrics need attention. Review bounces and complaints.
        </Alert>
      )}

      <Stack spacing={1.5}>
        {rows.map((r) => {
          const isGood = r.good(r.value);
          return (
            <Box key={r.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" fontWeight={600}>{r.fmt(r.value)}</Typography>
                  <Chip
                    label={isGood ? 'healthy' : 'review'}
                    color={isGood ? 'success' : 'warning'}
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(r.label === 'Delivery rate' ? r.value : (r.value / (r.label === 'Complaint rate' ? 0.1 : 2)) * 100, 100)}
                color={isGood ? 'success' : 'warning'}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          );
        })}
      </Stack>
    </GlassCard>
  );
}

// --- Recent campaigns table -----------------------------------------------

function RecentCampaigns({ items }: { items: Array<{ id: string; name: string; status: string; sent: number; openRate: number; clickRate: number; bounceRate: number; date: string }> }) {
  return (
    <GlassCard sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 1 }}>
        <SectionHeader
          title="Recent campaigns"
          action={<Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12 }}>All campaigns</Button>}
        />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Sent</TableCell>
              <TableCell align="right">
                <Tooltip title="Open rate"><span>Open</span></Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Click-to-open rate"><span>Click</span></Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Bounce rate - keep below 2%"><span>Bounce</span></Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} hover sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>{c.name}</Typography>
                </TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell align="right">{c.sent > 0 ? c.sent.toLocaleString() : '-'}</TableCell>
                <TableCell align="right">
                  {c.openRate > 0
                    ? <Typography variant="body2" color={c.openRate >= 25 ? 'success.main' : 'text.secondary'} fontWeight={500}>{c.openRate}%</Typography>
                    : '-'}
                </TableCell>
                <TableCell align="right">{c.clickRate > 0 ? `${c.clickRate}%` : '-'}</TableCell>
                <TableCell align="right">
                  {c.bounceRate > 0
                    ? <Typography variant="body2" color={c.bounceRate >= 2 ? 'error.main' : 'text.secondary'} fontWeight={c.bounceRate >= 2 ? 600 : 400}>{c.bounceRate}%</Typography>
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}

// --- Activity feed ---------------------------------------------------------

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <SectionHeader title="Recent activity" />
      <Stack spacing={0} divider={<Divider />}>
        {items.map((item) => (
          <Box key={item.id} sx={{ display: 'flex', gap: 1.5, py: 1.2, alignItems: 'flex-start' }}>
            <FiberManualRecordIcon sx={{ fontSize: 10, mt: 0.7, flexShrink: 0, color: activityColor[item.type] }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ lineHeight: 1.45 }}>{item.action}</Typography>
              <Typography variant="caption" color="text.disabled">{item.time}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </GlassCard>
  );
}

// --- Admin: client table ---------------------------------------------------

function ClientTable({ clients }: { clients: Array<{ name: string; contacts: number; sent30d: number; deliveryRate: number; bounceRate: number }> }) {
  return (
    <GlassCard sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 1 }}>
        <SectionHeader
          title="Client accounts"
          action={<Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12 }}>Manage</Button>}
        />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
              <TableCell>Client</TableCell>
              <TableCell align="right">Contacts</TableCell>
              <TableCell align="right">Sent (30d)</TableCell>
              <TableCell align="right">Delivery</TableCell>
              <TableCell align="right">Bounce</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.name} hover sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: 'primary.main' }}>{c.name[0]}</Avatar>
                    <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{c.contacts.toLocaleString()}</TableCell>
                <TableCell align="right">{c.sent30d.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color={c.deliveryRate >= 97 ? 'success.main' : 'warning.main'} fontWeight={500}>
                    {c.deliveryRate}%
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color={c.bounceRate >= 2 ? 'error.main' : 'text.secondary'} fontWeight={c.bounceRate >= 2 ? 600 : 400}>
                    {c.bounceRate}%
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}

// --- DashboardPage ---------------------------------------------------------

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === Role.SUPER_ADMIN;

  const overviewQuery = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => getDashboardOverview(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const overview = overviewQuery.data;

  const stats = overview?.stats ?? {
    emailsSent30d: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    unsubscribeRate: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    activeClients: isAdmin ? 0 : 1,
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const statCards = isAdmin
    ? [
        { title: 'Emails sent (30d)',  value: stats.emailsSent30d.toLocaleString(), delta: { value: '+12%', direction: 'up' as const },   icon: <MailOutlineIcon /> },
        { title: 'Active clients',     value: String(stats.activeClients),          delta: { value: '+1',   direction: 'up' as const },   icon: <BusinessIcon /> },
        { title: 'Total contacts',     value: stats.totalContacts.toLocaleString(), delta: { value: '+5.5%', direction: 'up' as const },  icon: <PeopleIcon /> },
        { title: 'Avg. delivery rate', value: `${stats.deliveryRate.toFixed(1)}%`,  delta: { value: '+0.3%', direction: 'up' as const },  icon: <VerifiedIcon /> },
      ]
    : [
        { title: 'Emails sent (30d)',  value: stats.emailsSent30d.toLocaleString(), delta: { value: '+9.1%', direction: 'up' as const },  icon: <MailOutlineIcon /> },
        { title: 'Delivery rate',      value: `${stats.deliveryRate.toFixed(1)}%`,  delta: { value: '+0.6%', direction: 'up' as const },  icon: <VerifiedIcon /> },
        { title: 'Open rate',          value: `${stats.openRate.toFixed(1)}%`,      delta: { value: '-1.2%', direction: 'down' as const }, icon: <TrendingUpIcon /> },
        { title: 'Click rate',         value: `${stats.clickRate.toFixed(1)}%`,     delta: { value: '+0.4%', direction: 'up' as const },  icon: <MouseIcon /> },
        { title: 'Bounce rate',        value: `${stats.bounceRate.toFixed(2)}%`,    delta: stats.bounceRate >= 2 ? { value: 'Review', direction: 'down' as const } : { value: 'Healthy', direction: 'up' as const }, icon: <BlockIcon /> },
        { title: 'Active campaigns',   value: String(stats.activeCampaigns),        delta: { value: '+1',   direction: 'up' as const },   icon: <MailOutlineIcon /> },
      ];

  const months = overview?.volume?.months?.length ? overview.volume.months : buildMonthLabels();
  const sentSeries = overview?.volume?.sent?.length ? overview.volume.sent : Array(12).fill(0);
  const heatmapData = overview?.contactHeatmap?.length ? overview.contactHeatmap : EMPTY_HEATMAP;
  const recentCampaigns = overview?.recentCampaigns ?? [];
  const activityItems = overview?.activity ?? [];
  const platformClients = overview?.platformClients ?? [];

  return (
    <Stack spacing={3}>

      {/* --- Header --- */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>
            {greeting}{user?.name ? `, ${user.name}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? "Platform overview - all clients, send volumes and stats."
              : "Here's what's happening in your email workspace."}
          </Typography>
        </Stack>

        {/* Quick actions - minimal and purposeful */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {isAdmin ? (
            <>
              <Button variant="contained" size="small" startIcon={<BusinessIcon fontSize="small" />} sx={{ borderRadius: 2 }}>Add client</Button>
              <Button variant="outlined"  size="small" startIcon={<OpenInNewIcon fontSize="small" />} sx={{ borderRadius: 2 }}>All logs</Button>
            </>
          ) : (
            <>
              <Button variant="outlined"  size="small" startIcon={<UploadIcon fontSize="small" />} sx={{ borderRadius: 2 }}>Import contacts</Button>
            </>
          )}
        </Stack>
      </Box>

      {/* --- Stat cards --- */}
      <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0,1fr))',
          lg: isAdmin ? 'repeat(4, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))',
          xl: isAdmin ? 'repeat(4, minmax(0,1fr))' : 'repeat(6, minmax(0,1fr))',
        },
      }}>
        {statCards.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} delta={s.delta} icon={s.icon} />
        ))}
      </Box>

      {/* --- Send volume + engagement (one chart, one gauge - not two charts) --- */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        <AreaChartCard
          title="Send volume"
          subtitle="Last 12 months"
          xLabels={months}
          seriesLabel="Emails sent"
          seriesData={sentSeries}
        />
        <EngagementGauge
          title="Engagement score"
          subtitle="Based on open + click rates"
          value={stats.openRate}
        />
      </Box>

      {/* --- Contact growth heatmap --- */}
      <ContactHeatmap
        data={heatmapData}
        title="Contact list growth"
        subtitle="Daily new contacts - last 52 weeks"
      />

      {/* --- Admin layout: client table + activity --- */}
      {isAdmin && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' } }}>
          <ClientTable clients={platformClients} />
          <ActivityFeed items={activityItems} />
        </Box>
      )}

      {/* --- Client layout: campaigns + deliverability + activity --- */}
      {!isAdmin && (
        <>
          <RecentCampaigns items={recentCampaigns} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <DeliverabilityPanel stats={stats} />
            <ActivityFeed items={activityItems} />
          </Box>
        </>
      )}

    </Stack>
  );
}
