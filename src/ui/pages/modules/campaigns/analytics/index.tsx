// src/ui/pages/modules/campaigns/analytics/index.tsx
import {
  Box, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { GlassCard }    from '../../../../dashboard/GlassCard';

// ─── Seed data ────────────────────────────────────────────────────────────────

const STATS = [
  { name: 'Summer Sale Blast',     sent: 4210, openRate: 34.2, clickRate: 8.1,  unsubRate: 0.2, bounceRate: 0.6  },
  { name: 'Onboarding Series #1',  sent: 2980, openRate: 41.3, clickRate: 12.6, unsubRate: 0.1, bounceRate: 0.3  },
  { name: 'Feature Announcement',  sent: 5120, openRate: 38.6, clickRate: 10.2, unsubRate: 0.3, bounceRate: 0.4  },
  { name: 'Product Update v2.4',   sent: 3870, openRate: 29.7, clickRate: 6.4,  unsubRate: 0.4, bounceRate: 0.9  },
  { name: 'Monthly Digest — June', sent: 3340, openRate: 26.8, clickRate: 5.7,  unsubRate: 0.5, bounceRate: 0.7  },
  { name: 'Winback Campaign Q3',   sent: 890,  openRate: 18.4, clickRate: 3.2,  unsubRate: 0.6, bounceRate: 2.4  },
  { name: 'Re-engagement Flow',    sent: 1540, openRate: 22.1, clickRate: 4.9,  unsubRate: 0.8, bounceRate: 1.1  },
];

const totalSent = STATS.reduce((a, b) => a + b.sent, 0);
const avgOpen   = (STATS.reduce((a, b) => a + b.openRate,  0) / STATS.length).toFixed(1);
const avgClick  = (STATS.reduce((a, b) => a + b.clickRate, 0) / STATS.length).toFixed(1);
const avgBounce = (STATS.reduce((a, b) => a + b.bounceRate,0) / STATS.length).toFixed(2);

// ─── Mini bar helper ──────────────────────────────────────────────────────────

function Bar({ value, max, color = '#0284c7' }: { value: number; max: number; color?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 110 }}>
      <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'action.selected', overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', bgcolor: color, borderRadius: 3 }} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', fontWeight: 600 }}>
        {value > 0 ? `${value}%` : '—'}
      </Typography>
    </Box>
  );
}

// ─── CampaignAnalyticsPage ────────────────────────────────────────────────────

export function CampaignAnalyticsPage() {
  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Campaign analytics</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          Aggregated performance across all sent campaigns.
        </Typography>
      </Box>

      {/* KPI summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Total emails sent', value: totalSent.toLocaleString(), delta: '+12% vs last period', good: true  },
          { label: 'Avg. open rate',    value: `${avgOpen}%`,              delta: '+2.1 pp',            good: true  },
          { label: 'Avg. click rate',   value: `${avgClick}%`,             delta: '+0.8 pp',            good: true  },
          { label: 'Avg. bounce rate',  value: `${avgBounce}%`,            delta: 'Below 2% threshold', good: true  },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ my: 0.5 }}>{s.value}</Typography>
            <Chip
              icon={s.good ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
              label={s.delta}
              color={s.good ? 'success' : 'error'} size="small" variant="outlined"
              sx={{ fontSize: 10, height: 20 }}
            />
          </GlassCard>
        ))}
      </Box>

      {/* Per-campaign table */}
      <GlassCard sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Per-campaign breakdown</Typography>
          <Typography variant="caption" color="text.secondary">All sent campaigns, most recent first</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell>Campaign</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Open rate</TableCell>
                <TableCell align="right">Click rate</TableCell>
                <TableCell align="right">Unsub rate</TableCell>
                <TableCell align="right">Bounce rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {STATS.map(c => (
                <TableRow key={c.name} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{c.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{c.sent.toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Bar value={c.openRate} max={55} color={c.openRate >= 25 ? '#16a34a' : '#0284c7'} />
                  </TableCell>
                  <TableCell align="right">
                    <Bar value={c.clickRate} max={20} color="#0284c7" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={c.unsubRate > 0.5 ? 'warning.main' : 'text.secondary'}
                      fontWeight={c.unsubRate > 0.5 ? 700 : 400}>
                      {c.unsubRate}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2"
                      color={c.bounceRate >= 2 ? 'error.main' : 'text.secondary'}
                      fontWeight={c.bounceRate >= 2 ? 700 : 400}>
                      {c.bounceRate >= 2 && '⚠ '}{c.bounceRate}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
        Showing {STATS.length} sent campaigns
      </Typography>
    </Stack>
  );
} 