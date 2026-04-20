import { useMemo } from 'react';
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
} from '@mui/material';

// Icons
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { StatCard } from '../dashboard/StatCard';
import { AreaChartCard } from '../dashboard/AreaChartCard';
import { EngagementGauge } from '../dashboard/EngagementGauge';
import { GlassCard } from '../dashboard/GlassCard';
import { useAuth } from '../../state/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../../lib/api/dashboardApi';
import { Role } from '../../types/auth';


// ─── Placeholder data ─────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CLIENT_SENT = [320, 520, 480, 1620, 780, 900, 760, 820, 1100, 940, 1200, 420];
const PLATFORM_SENT = [12000, 18500, 16200, 24800, 21000, 27400, 23100, 25600, 31000, 28400, 33200, 29800];

// Daily contact additions over last 52 weeks (364 days) — placeholder
// Generates realistic-looking spiky data
function generateDailyContactData(scale = 1): number[] {
  const days = 364;
  const data: number[] = [];
  for (let i = 0; i < days; i++) {
    const base = Math.random() < 0.15 ? 0 : Math.floor(Math.random() * 8 * scale);
    const spike = Math.random() < 0.05 ? Math.floor(Math.random() * 40 * scale) : 0;
    data.push(base + spike);
  }
  return data;
}

const CLIENT_DAILY = generateDailyContactData(1);
const PLATFORM_DAILY = generateDailyContactData(50);

const RECENT_CAMPAIGNS = [
  { id: 1, name: 'Summer Sale Blast', status: 'sent', sent: 4210, openRate: 34.2, clickRate: 8.1, date: 'Jul 12' },
  { id: 2, name: 'Product Update v2.4', status: 'sent', sent: 3870, openRate: 29.7, clickRate: 6.4, date: 'Jul 8' },
  { id: 3, name: 'Re-engagement Flow', status: 'sending', sent: 1540, openRate: 22.1, clickRate: 4.9, date: 'Jul 15' },
  { id: 4, name: 'Weekly Newsletter #48', status: 'draft', sent: 0, openRate: 0, clickRate: 0, date: 'Jul 16' },
  { id: 5, name: 'Onboarding Series #1', status: 'sent', sent: 2980, openRate: 41.3, clickRate: 12.6, date: 'Jul 3' },
];

const TOP_CAMPAIGNS = [
  { name: 'Onboarding Series #1', openRate: 41.3, clickRate: 12.6, sent: 2980 },
  { name: 'Summer Sale Blast', openRate: 34.2, clickRate: 8.1, sent: 4210 },
  { name: 'Product Update v2.4', openRate: 29.7, clickRate: 6.4, sent: 3870 },
  { name: 'Re-engagement Flow', openRate: 22.1, clickRate: 4.9, sent: 1540 },
];

const ACTIVITY_LOG = [
  { id: 1, action: 'Campaign "Summer Sale Blast" was sent', time: '2h ago', type: 'campaign' },
  { id: 2, action: '142 new contacts imported to "Newsletter List"', time: '5h ago', type: 'contacts' },
  { id: 3, action: 'Template "Promo v3" updated', time: 'Yesterday', type: 'template' },
  { id: 4, action: 'Sending domain verified: mail.acme.com', time: 'Jul 13', type: 'domain' },
  { id: 5, action: 'New segment "High-value subscribers" created', time: 'Jul 11', type: 'segment' },
];

const ADMIN_ACTIVITY_LOG = [
  { id: 1, action: 'New client "Acme Corp" registered', time: '1h ago', type: 'client' },
  { id: 2, action: 'Client "BrightMedia" exceeded send quota', time: '3h ago', type: 'warning' },
  { id: 3, action: 'Domain mail.brightmedia.io verified', time: '6h ago', type: 'domain' },
  { id: 4, action: '3 bounce threshold alerts triggered', time: 'Yesterday', type: 'warning' },
  { id: 5, action: 'Platform-wide: 89,200 contacts total', time: 'Jul 13', type: 'stats' },
];

const PLATFORM_CLIENTS = [
  { name: 'Acme Corp', contacts: 12400, sent30d: 38200, health: 96 },
  { name: 'BrightMedia', contacts: 8700, sent30d: 29100, health: 78 },
  { name: 'TechFlow Inc', contacts: 15200, sent30d: 52000, health: 99 },
  { name: 'GreenLeaf Co', contacts: 4300, sent30d: 11800, health: 91 },
  { name: 'NovaStar Ltd', contacts: 6100, sent30d: 18600, health: 85 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const activityDotColor: Record<string, string> = {
  campaign: '#0284c7', contacts: '#16a34a', template: '#9333ea',
  domain: '#ea580c', segment: '#0891b2', client: '#7c3aed',
  warning: '#dc2626', stats: '#64748b',
};

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: 'success' | 'warning' | 'default' | 'info' }> = {
    sent: { label: 'Sent', color: 'success' },
    sending: { label: 'Sending', color: 'info' },
    draft: { label: 'Draft', color: 'default' },
    scheduled: { label: 'Scheduled', color: 'warning' },
  };
  const cfg = map[status] ?? { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: -0.2 }}>{title}</Typography>
      {action}
    </Box>
  );
}

function HealthBar({ value }: { value: number }) {
  const color = value >= 90 ? 'success' : value >= 75 ? 'warning' : 'error';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress variant="determinate" value={value} color={color} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>{value}%</Typography>
    </Box>
  );
}

// ─── Contact Growth Heatmap ───────────────────────────────────────────────────
// GitHub-style grid: 52 columns (weeks) × 7 rows (days Mon–Sun)

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

// Heatmap intensity levels using the MUI primary palette
// These resolve to the theme's primary color at different opacities
const HEAT_LEVELS = [
  'primary.100',   // lightest — very few contacts
  'primary.200',
  'primary.400',
  'primary.600',
  'primary.main',  // darkest — highest activity
] as const;

function getHeatLevel(value: number, max: number): number {
  if (value === 0) return -1; // empty
  const ratio = value / max;
  if (ratio < 0.15) return 0;
  if (ratio < 0.35) return 1;
  if (ratio < 0.6)  return 2;
  if (ratio < 0.85) return 3;
  return 4;
}

type ContactHeatmapProps = {
  data: number[]; // 364 values (52 weeks × 7 days)
  title: string;
  subtitle: string;
};

function ContactHeatmap({ data, title, subtitle }: ContactHeatmapProps) {
  const CELL = 13;
  const GAP = 3;
  const STEP = CELL + GAP;
  const WEEKS = 52;
  const DAYS = 7;
  const LABEL_W = 28;
  const MONTH_H = 20;

  const max = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);

  // Build month label positions (approx every 4-5 cols)
  const monthPositions = HEATMAP_MONTHS.map((m, i) => ({
    label: m,
    x: LABEL_W + Math.floor((i / HEATMAP_MONTHS.length) * WEEKS) * STEP,
  }));

  const gridW = LABEL_W + WEEKS * STEP;
  const gridH = MONTH_H + DAYS * STEP;

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: -0.2 }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
            {total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="success.main" fontWeight={600}>contacts added</Typography>
        </Box>
      </Box>

      {/* Scrollable grid for small screens */}
      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <svg
          width={gridW}
          height={gridH}
          style={{ display: 'block' }}
        >
          {/* Month labels */}
          {monthPositions.map((m) => (
            <text
              key={m.label}
              x={m.x}
              y={12}
              style={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)', fontFamily: 'inherit' }}
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {WEEK_DAYS.map((d, di) => (
            di % 2 === 0 ? (
              <text
                key={d}
                x={0}
                y={MONTH_H + di * STEP + CELL * 0.75}
                style={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)', fontFamily: 'inherit' }}
              >
                {d}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {Array.from({ length: WEEKS }, (_, wi) =>
            Array.from({ length: DAYS }, (_, di) => {
              const idx = wi * DAYS + di;
              const value = data[idx] ?? 0;
              const level = getHeatLevel(value, max);
              const x = LABEL_W + wi * STEP;
              const y = MONTH_H + di * STEP;

              // Use Box to get access to the sx theme color system per cell
              return (
                <Tooltip
                  key={`${wi}-${di}`}
                  title={value > 0 ? `${value.toLocaleString()} contacts added` : 'No new contacts'}
                  placement="top"
                  arrow
                >
                  <Box
                    component="rect"
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    sx={{
                      fill: level === -1
                        ? 'action.selected'
                        : HEAT_LEVELS[level],
                      cursor: value > 0 ? 'pointer' : 'default',
                      transition: 'opacity 0.15s',
                      '&:hover': value > 0 ? { opacity: 0.75 } : {},
                    }}
                  />
                </Tooltip>
              );
            })
          )}
        </svg>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Less</Typography>
        {(['action.selected', ...HEAT_LEVELS] as const).map((c, i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '2px',
              bgcolor: c,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        ))}
        <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>More</Typography>
      </Box>
    </GlassCard>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ role }: { role?: Role }) {
  const actions =
    role === Role.SUPER_ADMIN
      ? [
          { label: 'Add Client', icon: <BusinessIcon fontSize="small" />, variant: 'contained' as const },
          { label: 'View All Logs', icon: <OpenInNewIcon fontSize="small" />, variant: 'outlined' as const },
          { label: 'Send Announcement', icon: <SendIcon fontSize="small" />, variant: 'outlined' as const },
        ]
      : [
          { label: 'New hhhCampaign', icon: <AddIcon fontSize="small" />, variant: 'contained' as const },
          { label: 'Import Contacts', icon: <UploadIcon fontSize="small" />, variant: 'outlined' as const },
          { label: 'New Template', icon: <EditIcon fontSize="small" />, variant: 'outlined' as const },
        ];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {actions.map((a) => (
        <Button key={a.label} variant={a.variant} size="small" startIcon={a.icon} sx={{ borderRadius: 2 }}>
          {a.label}
        </Button>
      ))}
    </Stack>
  );
}

// ─── Recent Campaigns Table ───────────────────────────────────────────────────

function RecentCampaignsTable() {
  return (
    <GlassCard sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 1 }}>
        <SectionHeader
          title="Recent Campaigns"
          action={<Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12 }}>View all</Button>}
        />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
              <TableCell>Campaign</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Sent</TableCell>
              <TableCell align="right">Open rate</TableCell>
              <TableCell align="right">Click rate</TableCell>
              <TableCell align="right">Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {RECENT_CAMPAIGNS.map((c) => (
              <TableRow key={c.id} hover sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell><Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>{c.name}</Typography></TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell align="right">{c.sent > 0 ? c.sent.toLocaleString() : '—'}</TableCell>
                <TableCell align="right">
                  {c.openRate > 0
                    ? <Typography variant="body2" color={c.openRate > 30 ? 'success.main' : 'text.primary'} fontWeight={500}>{c.openRate}%</Typography>
                    : '—'}
                </TableCell>
                <TableCell align="right">{c.clickRate > 0 ? `${c.clickRate}%` : '—'}</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>{c.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}

// ─── Top Performing Campaigns ─────────────────────────────────────────────────

function TopCampaigns() {
  const max = Math.max(...TOP_CAMPAIGNS.map((c) => c.openRate));
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <SectionHeader title="Top Performing" />
      <Stack spacing={2}>
        {TOP_CAMPAIGNS.map((c, i) => (
          <Box key={c.name}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 150 }}>{c.name}</Typography>
              <Typography variant="body2" color="success.main" fontWeight={700}>{c.openRate}% open</Typography>
            </Box>
            <LinearProgress variant="determinate" value={(c.openRate / max) * 100} color="primary" sx={{ height: 5, borderRadius: 3 }} />
            <Typography variant="caption" color="text.disabled">{c.sent.toLocaleString()} sent · {c.clickRate}% CTR</Typography>
            {i < TOP_CAMPAIGNS.length - 1 && <Divider sx={{ mt: 1.5 }} />}
          </Box>
        ))}
      </Stack>
    </GlassCard>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function ActivityLog({ isAdmin }: { isAdmin: boolean }) {
  const log = isAdmin ? ADMIN_ACTIVITY_LOG : ACTIVITY_LOG;
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <SectionHeader title="Recent Activity" />
      <Stack spacing={0}>
        {log.map((entry, i) => (
          <Box key={entry.id}>
            <Box sx={{ display: 'flex', gap: 1.5, py: 1.25, alignItems: 'flex-start' }}>
              <FiberManualRecordIcon sx={{ fontSize: 10, mt: 0.6, flexShrink: 0, color: activityDotColor[entry.type] ?? 'text.disabled' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.45 }}>{entry.action}</Typography>
                <Typography variant="caption" color="text.disabled">{entry.time}</Typography>
              </Box>
            </Box>
            {i < log.length - 1 && <Divider />}
          </Box>
        ))}
      </Stack>
    </GlassCard>
  );
}

// ─── Deliverability Health ────────────────────────────────────────────────────

function DeliverabilityPanel() {
  const metrics = [
    { label: 'Bounce rate', value: 0.8, threshold: 2, unit: '%', status: 'good' },
    { label: 'Complaint rate', value: 0.02, threshold: 0.1, unit: '%', status: 'excellent' },
    { label: 'Unsubscribe rate', value: 0.3, threshold: 0.5, unit: '%', status: 'good' },
    { label: 'Delivery rate', value: 98.7, threshold: 95, unit: '%', status: 'excellent' },
  ];
  const statusColor: Record<string, 'success' | 'warning' | 'error'> = {
    excellent: 'success', good: 'success', warning: 'warning', critical: 'error',
  };
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <SectionHeader title="Deliverability Health" />
      <Stack spacing={1.5}>
        {metrics.map((m) => (
          <Box key={m.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <Typography variant="body2" color="text.secondary">{m.label}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="body2" fontWeight={600}>{m.value}{m.unit}</Typography>
                <Chip label={m.status} color={statusColor[m.status]} size="small" sx={{ height: 18, fontSize: 10, textTransform: 'capitalize' }} />
              </Box>
            </Box>
            <LinearProgress variant="determinate" value={Math.min((m.value / m.threshold) * 100, 100)} color={statusColor[m.status]} sx={{ height: 4, borderRadius: 2 }} />
          </Box>
        ))}
      </Stack>
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.dark', mt: 0.1, flexShrink: 0 }} />
        <Typography variant="caption" color="warning.dark" lineHeight={1.5}>
          <strong>Next best action:</strong> Verify a second sending domain for redundancy to improve delivery resilience.
        </Typography>
      </Box>
    </GlassCard>
  );
}

// ─── Client Overview Table ────────────────────────────────────────────────────

function ClientOverviewTable() {
  return (
    <GlassCard sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 1 }}>
        <SectionHeader
          title="Client Overview"
          action={<Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12 }}>Manage clients</Button>}
        />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
              <TableCell>Client</TableCell>
              <TableCell align="right">Contacts</TableCell>
              <TableCell align="right">Sent (30d)</TableCell>
              <TableCell sx={{ minWidth: 140 }}>Health score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PLATFORM_CLIENTS.map((c) => (
              <TableRow key={c.name} hover sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: 'primary.main' }}>{c.name[0]}</Avatar>
                    <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{c.contacts.toLocaleString()}</TableCell>
                <TableCell align="right">{c.sent30d.toLocaleString()}</TableCell>
                <TableCell sx={{ minWidth: 140 }}><HealthBar value={c.health} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.SUPER_ADMIN;
  const accessToken = useAuth().accessToken!;

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats(accessToken),
    enabled: !!accessToken,
  });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);


  return (
    <Stack spacing={3}>

      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.4}>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.6 }}>
            {greeting}{user ? `, ${user.name}` : ''}{user?.tenantName ? ` (${user.tenantName})` : ''} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'Platform overview — all clients, send volumes, and health metrics.'
              : "Here's what's happening in your email workspace today."}
          </Typography>
        </Stack>
        <QuickActions role={user?.role} />
      </Box>

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
        {isAdmin ? (
          <>
            <StatCard title="Total emails sent (30d)" value={statsQuery.data?.emailsSent30d?.toLocaleString() ?? '—'} delta={{ value: '+12.3%', direction: 'up' }} icon={<MailOutlineIcon />} />
            <StatCard title="Active clients" value="5" delta={{ value: '+1', direction: 'up' }} icon={<BusinessIcon />} />
            <StatCard title="Total contacts" value="89,200" delta={{ value: '+5.5%', direction: 'up' }} icon={<PeopleIcon />} />
            <StatCard title="Avg. delivery rate" value={statsQuery.data?.deliveryRate?.toFixed(1) ?? '—'} delta={{ value: '+0.3%', direction: 'up' }} icon={<VerifiedIcon />} />
          </>
        ) : (
          <>
            <StatCard title="Emails sent (30d)" value={statsQuery.data?.emailsSent30d?.toLocaleString() ?? '—'} delta={{ value: '+9.1%', direction: 'up' }} icon={<MailOutlineIcon />} />
            <StatCard title="Delivery rate" value={statsQuery.data?.deliveryRate?.toFixed(1) ?? '—'} delta={{ value: '+0.6%', direction: 'up' }} icon={<VerifiedIcon />} />
            <StatCard title="Open rate" value={statsQuery.data?.openRate?.toFixed(1) ?? '—'} delta={{ value: '-1.2%', direction: 'down' }} icon={<TrendingUpIcon />} />
            <StatCard title="Active campaigns" value={statsQuery.data?.activeCampaigns ?? '—'} delta={{ value: '+1', direction: 'up' }} icon={<CampaignIcon />} />
          </>
        )}

      </Box>

      {/* ── Charts row ── */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, minmax(0, 1fr))' }, alignItems: 'stretch' }}>
        <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 8' } }}>
          <AreaChartCard
            title="Send volume"
            subtitle="Last 12 months"
            xLabels={MONTHS}
            seriesLabel="Emails sent"
            seriesData={isAdmin ? PLATFORM_SENT : CLIENT_SENT}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 4' } }}>
          <EngagementGauge title="Engagement score" subtitle="Opens + clicks health" value={isAdmin ? 71 : 34} />
        </Box>
      </Box>

      {/* ── Contact growth heatmap (replaces area chart) ── */}
      <ContactHeatmap
        data={isAdmin ? PLATFORM_DAILY : CLIENT_DAILY}
        title="Contact list growth"
        subtitle="Daily new contacts — last 52 weeks"
      />

      {/* ── Admin: Client overview ── */}
      {isAdmin && <ClientOverviewTable />}

      {/* ── Client: Campaigns + top performers ── */}
      {!isAdmin && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, minmax(0, 1fr))' }, alignItems: 'start' }}>
          <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 8' } }}><RecentCampaignsTable /></Box>
          <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 4' } }}><TopCampaigns /></Box>
        </Box>
      )}

      {/* ── Deliverability + Activity ── */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start' }}>
        <DeliverabilityPanel />
        <ActivityLog isAdmin={isAdmin} />
      </Box>

    </Stack>
  );
}
