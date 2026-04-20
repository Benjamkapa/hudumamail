// src/ui/pages/modules/billing/invoices/index.tsx
//
// Invoices — /app/billing/invoices
//
// Features:
//  - Chronological invoice list with amount, status, period, payment method
//  - Status: paid / open / failed / void
//  - Download PDF (simulated)
//  - Payment method summary (card on file)
//  - Upcoming invoice preview
//  - Total spent this year
//  - Role-aware

import { useState, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Divider, IconButton,
  Snackbar, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';

import CreditCardIcon    from '@mui/icons-material/CreditCard';
import DownloadIcon      from '@mui/icons-material/FileDownload';
import ReceiptIcon       from '@mui/icons-material/Receipt';
import RefreshIcon       from '@mui/icons-material/Refresh';
import UpgradeIcon       from '@mui/icons-material/Upgrade';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import ErrorIcon         from '@mui/icons-material/Error';
import HourglassIcon     from '@mui/icons-material/HourglassEmpty';
import { useNavigate }   from 'react-router-dom';

import { GlassCard }    from '../../../../dashboard/GlassCard';
import { useAuth }      from '../../../../../state/auth/useAuth';
import { Role }         from '../../../../../types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'paid' | 'open' | 'failed' | 'void';

type Invoice = {
  id: string;
  number: string;
  period: string;
  amount: number;       // USD cents
  status: InvoiceStatus;
  plan: string;
  paymentMethod: string;
  paidAt?: string;
  dueAt?: string;
  issuedAt: string;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<InvoiceStatus, {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
  icon: React.ReactNode;
}> = {
  paid:   { label: 'Paid',   color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 13 }} /> },
  open:   { label: 'Open',   color: 'warning', icon: <HourglassIcon   sx={{ fontSize: 13 }} /> },
  failed: { label: 'Failed', color: 'error',   icon: <ErrorIcon       sx={{ fontSize: 13 }} /> },
  void:   { label: 'Void',   color: 'default', icon: null },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CARD_ON_FILE = {
  brand:   'Visa',
  last4:   '4242',
  expiry:  '09/27',
  name:    'Alice Morgan',
};

const UPCOMING = {
  amount:  14900,
  period:  'Aug 1 – Aug 31, 2025',
  dueDate: '2025-08-01',
  plan:    'Growth',
  items: [
    { description: 'Growth Plan — monthly',  amount: 14900 },
    { description: 'Overage: 0 extra emails', amount: 0     },
  ],
};

const INVOICES: Invoice[] = [
  { id:'inv_01', number:'INV-2025-007', period:'Jul 1–31, 2025',  amount:14900, status:'open',   plan:'Growth', paymentMethod:'Visa ••4242', dueAt:'2025-08-01', issuedAt:'2025-07-01' },
  { id:'inv_02', number:'INV-2025-006', period:'Jun 1–30, 2025',  amount:14900, status:'paid',   plan:'Growth', paymentMethod:'Visa ••4242', paidAt:'2025-06-01', issuedAt:'2025-06-01' },
  { id:'inv_03', number:'INV-2025-005', period:'May 1–31, 2025',  amount:14900, status:'paid',   plan:'Growth', paymentMethod:'Visa ••4242', paidAt:'2025-05-01', issuedAt:'2025-05-01' },
  { id:'inv_04', number:'INV-2025-004', period:'Apr 1–30, 2025',  amount:14900, status:'paid',   plan:'Growth', paymentMethod:'Visa ••4242', paidAt:'2025-04-01', issuedAt:'2025-04-01' },
  { id:'inv_05', number:'INV-2025-003', period:'Mar 1–31, 2025',  amount: 4900, status:'paid',   plan:'Starter', paymentMethod:'Visa ••4242', paidAt:'2025-03-01', issuedAt:'2025-03-01' },
  { id:'inv_06', number:'INV-2025-002', period:'Feb 1–28, 2025',  amount: 4900, status:'paid',   plan:'Starter', paymentMethod:'Visa ••4242', paidAt:'2025-02-01', issuedAt:'2025-02-01' },
  { id:'inv_07', number:'INV-2025-001', period:'Jan 1–31, 2025',  amount: 4900, status:'failed', plan:'Starter', paymentMethod:'Visa ••4242', dueAt:'2025-02-01', issuedAt:'2025-01-01' },
];

// ─── BillingInvoicesPage ──────────────────────────────────────────────────────

export function BillingInvoicesPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [snack, setSnack] = useState<string | null>(null);

  const paidTotal = useMemo(() =>
    INVOICES.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0),
    []
  );
  const failedCount = INVOICES.filter(i => i.status === 'failed').length;

  const handleDownload = (inv: Invoice) => {
    setSnack(`Downloading ${inv.number}…`);
  };

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Invoices</Typography>
          <Typography variant="body2" color="text.secondary">
            Billing history, receipts, and upcoming charges.
          </Typography>
        </Stack>
      </Box>

      {/* Failed payment alert */}
      {failedCount > 0 && (
        <Alert severity="error" sx={{ fontSize: 13 }}
          action={
            <Button size="small" color="error" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
              Update payment method
            </Button>
          }>
          <strong>Payment failed</strong> — {failedCount} invoice{failedCount > 1 ? 's' : ''} could not be collected. Please update your payment method.
        </Alert>
      )}

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Paid this year',    value: fmtCurrency(paidTotal), color: 'success.main' },
          { label: 'Current plan',      value: 'Growth',               color: undefined      },
          { label: 'Next invoice',      value: fmtCurrency(UPCOMING.amount), color: undefined },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>
              {s.value}
            </Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Payment method */}
      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Payment method</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{
            px: 2, py: 1.5, borderRadius: 1.5, border: '1.5px solid',
            borderColor: 'primary.main', bgcolor: 'primary.50',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <CreditCardIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {CARD_ON_FILE.brand} ending in {CARD_ON_FILE.last4}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expires {CARD_ON_FILE.expiry} · {CARD_ON_FILE.name}
              </Typography>
            </Box>
            <Chip label="Default" size="small" color="primary" sx={{ fontSize: 10, height: 20, ml: 1 }} />
          </Box>
          <Button size="small" variant="outlined" sx={{ ml: 'auto' }}>Update card</Button>
        </Box>
      </GlassCard>

      {/* Upcoming invoice */}
      <GlassCard sx={{ p: 2.5, border: '1px dashed', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>Upcoming invoice</Typography>
            <Typography variant="caption" color="text.secondary">
              Due {fmtDate(UPCOMING.dueDate)} · {UPCOMING.period}
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={900} color="primary.main">
            {fmtCurrency(UPCOMING.amount)}
          </Typography>
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        {UPCOMING.items.map(item => (
          <Box key={item.description} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{item.description}</Typography>
            <Typography variant="caption" fontWeight={600}>
              {item.amount > 0 ? fmtCurrency(item.amount) : '—'}
            </Typography>
          </Box>
        ))}
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" fontWeight={700}>Total due</Typography>
          <Typography variant="caption" fontWeight={800}>{fmtCurrency(UPCOMING.amount)}</Typography>
        </Box>
      </GlassCard>

      {/* Invoice table */}
      <GlassCard sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800}>Invoice history</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell sx={{ pl: 2.5 }}>Invoice</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Date</TableCell>
                <TableCell align="right" sx={{ pr: 2 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.map(inv => {
                const cfg = STATUS_CFG[inv.status];
                return (
                  <TableRow key={inv.id} hover
                    sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {inv.number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{inv.period}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.plan} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{inv.paymentMethod}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={cfg.icon as any}
                        label={cfg.label}
                        color={cfg.color}
                        size="small" variant="outlined"
                        sx={{ fontSize: 11, height: 22, '& .MuiChip-icon': { fontSize: 13, ml: 0.5 } }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{fmtCurrency(inv.amount)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {fmtDate(inv.paidAt ?? inv.dueAt ?? inv.issuedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => handleDownload(inv)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}