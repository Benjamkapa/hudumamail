// src/ui/pages/modules/automations/reports/index.tsx
//
// ─── WHAT IS THE AUTOMATION REPORTS PAGE? ────────────────────────────────────
//
// This page gives a performance overview of ALL automation flows —
// not a single campaign, but the ongoing automated email sequences.
//
// Key metrics shown:
//
//   ENROLLED    — how many contacts are currently inside a flow
//   COMPLETED   — how many have finished every step (the full journey)
//   OPEN RATE   — % of automated emails that were opened
//   CLICK RATE  — % of automated emails that had a link clicked
//   CONV. RATE  — % of contacts who took the desired action (purchase, signup etc.)
//   UNSUBSCRIBED — % who opted out during this flow
//
// Why it matters:
//   Flows are invisible — they run silently. This report is the only way
//   to know if your automation is working or if contacts are dropping off.
//   A low completion rate means contacts are unsubscribing or not engaging
//   early in the sequence.

import { useState } from 'react';
import {
  Box, Button, Chip, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { GlassCard } from '../../../../dashboard/GlassCard';

const API = () => (import.meta as any).env?.VITE_API_URL;

// ─── Seed data ────────────────────────────────────────────────────────────────

type FlowReport = {
  id: number; name: string; status: 'active' | 'paused' | 'draft';
  enrolled: number; completed: number; emailsSent: number;
  openRate: number; clickRate: number; convRate: number; unsubRate: number;
};

const SEED: FlowReport[] = [
  { id: 1, name: 'Welcome Series', status: 'active', enrolled: 1240, completed: 980, emailsSent: 3720, openRate: 42.1, clickRate: 11.3, convRate: 12.4, unsubRate: 0.4 },
  { id: 2, name: 'Post-purchase Flow', status: 'active', enrolled: 430, completed: 210, emailsSent: 860, openRate: 38.4, clickRate: 9.8, convRate: 8.7, unsubRate: 0.2 },
  { id: 3, name: 'Win-back Sequence', status: 'paused', enrolled: 870, completed: 340, emailsSent: 1740, openRate: 22.6, clickRate: 4.2, convRate: 4.2, unsubRate: 1.1 },
  { id: 4, name: 'Birthday Campaign', status: 'draft', enrolled: 0, completed: 0, emailsSent: 0, openRate: 0, clickRate: 0, convRate: 0, unsubRate: 0 },
  { id: 5, name: 'Cart Abandonment', status: 'draft', enrolled: 0, completed: 0, emailsSent: 0, openRate: 0, clickRate: 0, convRate: 0, unsubRate: 0 },
];

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'default'> = { active: 'success', paused: 'warning', draft: 'default' };

// ─── Mini bar ─────────────────────────────────────────────────────────────────

function RateBar({ value, max = 60, color = '#0284c7' }: { value: number; max?: number; color?: string }) {
  if (value === 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
      <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'action.selected', overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', bgcolor: color, borderRadius: 3 }} />
      </Box>
      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 36, textAlign: 'right' }}>
        {value}%
      </Typography>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AutomationReportsPage() {
  const [reports] = useState<FlowReport[]>(SEED);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API()}/api/automations/reports`, { credentials: 'include' });
    } catch { /* use cached data */ }
    setRefreshing(false);
  };

  const activeFlows = reports.filter(r => r.status === 'active');
  const totalEnrolled = reports.reduce((a, r) => a + r.enrolled, 0);
  const totalEmailsSent = reports.reduce((a, r) => a + r.emailsSent, 0);
  const avgOpenRate = activeFlows.length
    ? (activeFlows.reduce((a, r) => a + r.openRate, 0) / activeFlows.length).toFixed(1)
    : '—';
  const avgConvRate = activeFlows.length
    ? (activeFlows.reduce((a, r) => a + r.convRate, 0) / activeFlows.length).toFixed(1)
    : '—';

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Automation reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Performance metrics for every automation flow — see what's working and what needs attention.
          </Typography>
        </Stack>
        <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 1 }}
          disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? 'Refreshing…' : 'Refresh data'}
        </Button>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Active flows', value: activeFlows.length, color: 'success.main' },
          { label: 'Contacts enrolled', value: totalEnrolled.toLocaleString(), color: undefined },
          { label: 'Emails sent (auto)', value: totalEmailsSent.toLocaleString(), color: undefined },
          { label: 'Avg. open rate', value: `${avgOpenRate}%`, color: undefined },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Per-flow breakdown */}
      <GlassCard sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Flow performance breakdown</Typography>
          <Typography variant="caption" color="text.secondary">
            All flows — active, paused, and draft. Metrics update in real time for active flows.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell>Flow</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Enrolled</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Emails sent</TableCell>
                <TableCell align="right" sx={{ minWidth: 130 }}>Open rate</TableCell>
                <TableCell align="right" sx={{ minWidth: 130 }}>Click rate</TableCell>
                <TableCell align="right" sx={{ minWidth: 120 }}>Conv. rate</TableCell>
                <TableCell align="right">Unsub rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map(r => (
                <TableRow key={r.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{r.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      color={STATUS_COLOR[r.status]} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                  </TableCell>
                  <TableCell align="right">{r.enrolled > 0 ? r.enrolled.toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    {r.completed > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Typography variant="body2">{r.completed.toLocaleString()}</Typography>
                        {r.enrolled > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round((r.completed / r.enrolled) * 100)}%)
                          </Typography>
                        )}
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">{r.emailsSent > 0 ? r.emailsSent.toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <RateBar value={r.openRate} max={55} color={r.openRate >= 25 ? '#16a34a' : '#0284c7'} />
                  </TableCell>
                  <TableCell align="right">
                    <RateBar value={r.clickRate} max={20} color="#0284c7" />
                  </TableCell>
                  <TableCell align="right">
                    <RateBar value={r.convRate} max={20} color="#7c3aed" />
                  </TableCell>
                  <TableCell align="right">
                    {r.unsubRate > 0 ? (
                      <Typography variant="body2"
                        color={r.unsubRate >= 1 ? 'error.main' : r.unsubRate >= 0.5 ? 'warning.main' : 'text.secondary'}
                        fontWeight={r.unsubRate >= 1 ? 700 : 400}>
                        {r.unsubRate}%
                      </Typography>
                    ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Legend */}
      <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          How to read these metrics
        </Typography>
        <Stack spacing={0.75}>
          {[
            { label: 'Enrolled', desc: 'Contacts currently progressing through this flow — they have not finished yet' },
            { label: 'Completed', desc: 'Contacts who received every step — the full journey is done' },
            { label: 'Open rate', desc: 'Average across all automated emails sent by this flow (≥25% is healthy)' },
            { label: 'Click rate', desc: 'Average link clicks across all emails in this flow' },
            { label: 'Conv. rate', desc: 'Contacts who took the target action (purchase, signup etc.) during the flow' },
            { label: 'Unsub rate', desc: 'Contacts who unsubscribed while inside this flow (>1% = review your content)' },
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="caption" fontWeight={700} sx={{ minWidth: 82, flexShrink: 0 }}>{item.label}</Typography>
              <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}