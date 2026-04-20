// src/ui/pages/modules/sending/reputation/index.tsx
//
// Sender Reputation — /app/sending/reputation
//
// Features:
//  - Overall reputation score per domain (0–100 with colour-coded health)
//  - Deliverability breakdown: inbox %, spam %, missing %, bounce rate
//  - Blacklist monitoring (MX Toolbox-style, check if listed on major RBLs)
//  - Complaint rate, unsubscribe rate, spam trap hits
//  - Historical sparkline per metric (last 30 days)
//  - Recommendations panel for improving reputation
//  - Per-domain view toggle

import { useState, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Divider, IconButton, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem,
  Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';

import BlockIcon          from '@mui/icons-material/Block';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import DomainIcon         from '@mui/icons-material/Language';
import ErrorIcon          from '@mui/icons-material/Error';
import InfoOutlinedIcon   from '@mui/icons-material/InfoOutlined';
import RefreshIcon        from '@mui/icons-material/Refresh';
import ShieldIcon         from '@mui/icons-material/Shield';
import TrendingDownIcon   from '@mui/icons-material/TrendingDown';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import VerifiedIcon       from '@mui/icons-material/Verified';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor';
type RblStatus   = 'clean' | 'listed';

type RblCheck = {
  name: string;
  url: string;
  status: RblStatus;
  listedSince?: string;
};

type DomainReputation = {
  id: string;
  domain: string;
  score: number;           // 0–100
  health: HealthLevel;
  inboxRate: number;       // %
  spamRate: number;        // %
  missingRate: number;     // %
  bounceRate: number;      // %
  complaintRate: number;   // %
  unsubRate: number;       // %
  spamTrapHits: number;
  rblChecks: RblCheck[];
  trend: number[];         // last 14 scores for sparkline
  lastChecked: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const HEALTH_CFG: Record<HealthLevel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  excellent: { label: 'Excellent', color: '#22c55e', bg: '#dcfce7', icon: <VerifiedIcon       sx={{ fontSize: 20, color: '#22c55e' }} /> },
  good:      { label: 'Good',      color: '#3b82f6', bg: '#dbeafe', icon: <CheckCircleIcon    sx={{ fontSize: 20, color: '#3b82f6' }} /> },
  fair:      { label: 'Fair',      color: '#f59e0b', bg: '#fef3c7', icon: <WarningAmberIcon   sx={{ fontSize: 20, color: '#f59e0b' }} /> },
  poor:      { label: 'Poor',      color: '#ef4444', bg: '#fee2e2', icon: <ErrorIcon          sx={{ fontSize: 20, color: '#ef4444' }} /> },
};

const RBLS = [
  'Spamhaus ZEN', 'Barracuda', 'SORBS', 'SpamCop', 'MX Toolbox', 'UCEPROTECT',
];

// ─── Seed data ────────────────────────────────────────────────────────────────

function buildTrend(base: number, len = 14): number[] {
  let v = base;
  return Array.from({ length: len }, () => {
    v = Math.max(0, Math.min(100, v + (Math.random() - 0.5) * 4));
    return Math.round(v);
  });
}

function buildRbls(listed: string[] = []): RblCheck[] {
  return RBLS.map(name => ({
    name,
    url: `https://mxtoolbox.com/SuperTool.aspx?action=blacklist`,
    status: listed.includes(name) ? 'listed' : 'clean',
    listedSince: listed.includes(name) ? '2025-07-10' : undefined,
  }));
}

const INITIAL_DOMAINS: DomainReputation[] = [
  {
    id: 'r_01', domain: 'acme.com',
    score: 91, health: 'excellent',
    inboxRate: 96.4, spamRate: 2.1, missingRate: 1.5,
    bounceRate: 0.4, complaintRate: 0.02, unsubRate: 0.3, spamTrapHits: 0,
    rblChecks: buildRbls([]),
    trend: buildTrend(91), lastChecked: '2025-07-15 09:12',
  },
  {
    id: 'r_02', domain: 'mail.acme.com',
    score: 72, health: 'good',
    inboxRate: 88.2, spamRate: 7.4, missingRate: 4.4,
    bounceRate: 1.1, complaintRate: 0.08, unsubRate: 0.6, spamTrapHits: 2,
    rblChecks: buildRbls([]),
    trend: buildTrend(72), lastChecked: '2025-07-15 09:12',
  },
  {
    id: 'r_03', domain: 'updates.acme.com',
    score: 44, health: 'fair',
    inboxRate: 71.0, spamRate: 18.6, missingRate: 10.4,
    bounceRate: 2.8, complaintRate: 0.21, unsubRate: 1.4, spamTrapHits: 11,
    rblChecks: buildRbls(['SORBS', 'SpamCop']),
    trend: buildTrend(44), lastChecked: '2025-07-15 09:12',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string) { return s; }

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80; const H = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Score dial ───────────────────────────────────────────────────────────────

function ScoreDial({ score, health }: { score: number; health: HealthLevel }) {
  const cfg = HEALTH_CFG[health];
  return (
    <Box sx={{
      width: 80, height: 80, borderRadius: '50%',
      bgcolor: cfg.bg, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      border: `3px solid ${cfg.color}`, flexShrink: 0,
    }}>
      <Typography variant="h5" fontWeight={900} sx={{ color: cfg.color, lineHeight: 1 }}>
        {score}
      </Typography>
      <Typography sx={{ fontSize: 9, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ label, value, unit, good, warn, bad, desc }: {
  label: string; value: number; unit: string;
  good: number; warn: number; bad: number;
  desc?: string;
}) {
  const color = value <= good ? '#22c55e' : value <= warn ? '#f59e0b' : '#ef4444';
  const progress = Math.min(100, (value / bad) * 100);
  return (
    <Box sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>{label}</Typography>
          {desc && (
            <Tooltip title={desc}>
              <InfoOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            </Tooltip>
          )}
        </Box>
        <Typography variant="caption" fontWeight={700} sx={{ color }}>
          {value}{unit}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress}
        sx={{ height: 4, borderRadius: 1,
          '& .MuiLinearProgress-bar': { bgcolor: color },
          bgcolor: color + '22',
        }} />
    </Box>
  );
}

// ─── Domain reputation card ───────────────────────────────────────────────────

function ReputationCard({ rep, onRecheck }: { rep: DomainReputation; onRecheck: (r: DomainReputation) => void }) {
  const [showRbl, setShowRbl] = useState(false);
  const listedCount = rep.rblChecks.filter(r => r.status === 'listed').length;
  const cfg = HEALTH_CFG[rep.health];

  return (
    <GlassCard sx={{ p: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <ScoreDial score={rep.score} health={rep.health} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>{rep.domain}</Typography>
              <Typography variant="caption" color="text.disabled">
                Last checked: {rep.lastChecked}
              </Typography>
            </Box>
            <Tooltip title="Re-check reputation">
              <IconButton size="small" onClick={() => onRecheck(rep)}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
            <Chip label={`📥 ${rep.inboxRate}% inbox`} size="small"
              sx={{ fontSize: 11, height: 20, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }} />
            <Chip label={`🚫 ${rep.spamRate}% spam`} size="small"
              sx={{ fontSize: 11, height: 20, bgcolor: rep.spamRate > 5 ? '#fee2e2' : '#f3f4f6', color: rep.spamRate > 5 ? '#dc2626' : '#6b7280', fontWeight: 600 }} />
            {listedCount > 0 && (
              <Chip label={`⚠️ ${listedCount} RBL`} size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: '#fef3c7', color: '#d97706', fontWeight: 600 }} />
            )}
          </Box>
          <Sparkline data={rep.trend} color={cfg.color} />
        </Box>
      </Box>

      {/* Metrics */}
      <MetricRow label="Bounce rate"     value={rep.bounceRate}    unit="%" good={0.5} warn={1.5} bad={3}   desc="Hard + soft bounces as % of sends. Keep below 0.5%." />
      <MetricRow label="Complaint rate"  value={rep.complaintRate} unit="%" good={0.05} warn={0.1} bad={0.3} desc="Spam complaints / sends. Google recommends below 0.1%." />
      <MetricRow label="Unsubscribe rate"value={rep.unsubRate}     unit="%" good={0.3} warn={0.8} bad={2}   desc="Unsubscribes per send. High rates signal relevance issues." />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        <Typography variant="caption" fontWeight={600}>Spam trap hits</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" fontWeight={700}
          sx={{ color: rep.spamTrapHits > 0 ? '#ef4444' : '#22c55e' }}>
          {rep.spamTrapHits === 0 ? '✓ None detected' : `⚠️ ${rep.spamTrapHits} hits`}
        </Typography>
      </Box>

      {/* RBL */}
      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ShieldIcon sx={{ fontSize: 14, color: listedCount > 0 ? 'error.main' : 'success.main' }} />
            <Typography variant="caption" fontWeight={700}>
              Blacklist status — {listedCount === 0 ? 'Clean on all lists' : `Listed on ${listedCount} RBL${listedCount > 1 ? 's' : ''}`}
            </Typography>
          </Box>
          <Button size="small" sx={{ fontSize: 11, p: 0, minWidth: 0, textTransform: 'none', color: 'text.secondary' }}
            onClick={() => setShowRbl(v => !v)}>
            {showRbl ? 'Hide' : 'Show all'}
          </Button>
        </Box>
        {showRbl && (
          <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            {rep.rblChecks.map(r => (
              <Box key={r.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {r.status === 'clean'
                  ? <CheckCircleIcon sx={{ fontSize: 12, color: '#22c55e' }} />
                  : <BlockIcon       sx={{ fontSize: 12, color: '#ef4444' }} />}
                <Typography variant="caption" sx={{ fontSize: 11, color: r.status === 'listed' ? 'error.main' : 'text.secondary' }}>
                  {r.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function Recommendations({ domains }: { domains: DomainReputation[] }) {
  const recs: { sev: 'error'|'warning'|'info'; msg: string }[] = [];

  for (const d of domains) {
    if (d.rblChecks.some(r => r.status === 'listed'))
      recs.push({ sev: 'error', msg: `${d.domain} is listed on one or more RBLs. Submit a delisting request immediately.` });
    if (d.bounceRate > 1.5)
      recs.push({ sev: 'warning', msg: `${d.domain} has a high bounce rate (${d.bounceRate}%). Clean your list to remove invalid addresses.` });
    if (d.complaintRate > 0.1)
      recs.push({ sev: 'warning', msg: `${d.domain} complaint rate (${d.complaintRate}%) exceeds Google's recommended threshold. Review your content and list quality.` });
    if (d.spamTrapHits > 0)
      recs.push({ sev: 'error', msg: `${d.domain} has ${d.spamTrapHits} spam trap hits. Remove inactive/purchased addresses from your list immediately.` });
    if (d.spamRate > 10)
      recs.push({ sev: 'warning', msg: `${d.domain} spam folder rate is ${d.spamRate}%. Check SPF, DKIM, and DMARC alignment.` });
  }

  if (recs.length === 0) return null;

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={800} gutterBottom>
        ⚡ Recommendations
      </Typography>
      <Stack spacing={1}>
        {recs.map((r, i) => (
          <Alert key={i} severity={r.sev} sx={{ fontSize: 12, py: 0.5 }}>{r.msg}</Alert>
        ))}
      </Stack>
    </GlassCard>
  );
}

// ─── SendingReputationPage ────────────────────────────────────────────────────

export function SendingReputationPage() {
  const { user } = useAuth();

  const [domains,   setDomains]   = useState<DomainReputation[]>(INITIAL_DOMAINS);
  const [snack,     setSnack]     = useState<string | null>(null);

  const handleRecheck = (r: DomainReputation) => {
    setSnack(`Re-checking reputation for ${r.domain}…`);
    setTimeout(() => {
      setDomains(prev => prev.map(x => x.id === r.id
        ? { ...x, lastChecked: 'Just now', trend: buildTrend(x.score) }
        : x));
      setSnack(`Reputation check complete for ${r.domain}.`);
    }, 1500);
  };

  const overall = useMemo(() => {
    const avg = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
    const health: HealthLevel = avg >= 85 ? 'excellent' : avg >= 65 ? 'good' : avg >= 45 ? 'fair' : 'poor';
    return { avg, health };
  }, [domains]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Sender reputation</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor inbox placement, blacklist status, and deliverability health across your sending domains.
          </Typography>
        </Stack>
        <Tooltip title="Re-check all domains">
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
            onClick={() => { domains.forEach(d => handleRecheck(d)); }}>
            Check all
          </Button>
        </Tooltip>
      </Box>

      {/* Overall score banner */}
      <GlassCard sx={{ p: 2.5, background: `linear-gradient(135deg, ${HEALTH_CFG[overall.health].bg}, transparent)` }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ScoreDial score={overall.avg} health={overall.health} />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Overall reputation: {HEALTH_CFG[overall.health].label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average across {domains.length} sending domain{domains.length > 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
              <Chip label={`${domains.filter(d => d.health === 'excellent' || d.health === 'good').length} healthy`}
                size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
              <Chip label={`${domains.filter(d => d.health === 'fair').length} needs attention`}
                size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }} />
              <Chip label={`${domains.filter(d => d.health === 'poor').length} critical`}
                size="small" color="error" variant="outlined" sx={{ fontSize: 11 }} />
            </Box>
          </Box>
        </Box>
      </GlassCard>

      {/* Recommendations */}
      <Recommendations domains={domains} />

      {/* Per-domain cards */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' } }}>
        {domains.map(d => (
          <ReputationCard key={d.id} rep={d} onRecheck={handleRecheck} />
        ))}
      </Box>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}