// src/ui/pages/modules/audience/verification/index.tsx
//
// ─── WHAT IS EMAIL VERIFICATION? ─────────────────────────────────────────────
//
// Email Verification checks whether an email address is safe to send to
// BEFORE you add it to a campaign.  This is different from suppression:
//
//   VERIFICATION → runs BEFORE sending (prevent bad addresses getting in)
//   SUPPRESSION  → runs AFTER sending (remove addresses that caused problems)
//
// Why verify?
//   If you import a CSV from a trade show, old database, or lead gen form,
//   some addresses will be invalid.  Sending to them causes bounces.
//   High bounce rates damage your sender reputation with ISPs.
//
// Verification result statuses:
//
//   VALID    ✓ → The address exists and is deliverable.  Safe to send.
//
//   INVALID  ✗ → The domain doesn't exist, or the mailbox is not found.
//                Do NOT send to these — they will hard-bounce.
//
//   RISKY    ⚠ → The address exists but is a:
//                  • Disposable/temporary email (mailinator, guerrilla mail etc.)
//                  • Role address (info@, admin@, support@) — often not a real person
//                  • Catch-all domain — accepts everything but may bounce later
//                Send with caution or skip entirely.
//
//   UNKNOWN  ? → The server timed out or could not be reached.
//                The address may be valid.  Retry later or skip if low-priority.
//
// How it works technically:
//   1. DNS check — does the domain have valid MX records?
//   2. SMTP check — does the mail server acknowledge the mailbox?
//   3. Pattern analysis — is it a disposable or role address?
//
// Actions:
//   Verify addresses → POST /api/contacts/verify  { emails: string[] }
//   Get history      → GET  /api/contacts/verify/history

import { useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton,
  LinearProgress, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorIcon from '@mui/icons-material/Error';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { GlassCard } from '../../../../dashboard/GlassCard';

const API = () => (import.meta as any).env?.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifStatus = 'valid' | 'invalid' | 'risky' | 'unknown';

type VerifResult = {
  id: number; email: string; status: VerifStatus;
  reason: string; checkedAt: string;
};

// ─── Seed history ─────────────────────────────────────────────────────────────

const SEED: VerifResult[] = [
  { id: 1, email: 'alice@example.com', status: 'valid', reason: 'Mailbox confirmed and deliverable', checkedAt: 'Jul 15, 2025 · 14:32' },
  { id: 2, email: 'bob@acmecorp.com', status: 'valid', reason: 'Mailbox confirmed and deliverable', checkedAt: 'Jul 15, 2025 · 14:32' },
  { id: 3, email: 'test@mailinator.com', status: 'risky', reason: 'Disposable/temporary email provider', checkedAt: 'Jul 15, 2025 · 14:32' },
  { id: 4, email: 'info@company.io', status: 'risky', reason: 'Role address — may not be a real person', checkedAt: 'Jul 14, 2025 · 09:10' },
  { id: 5, email: 'ghost@fakeemail.xyz', status: 'invalid', reason: 'Domain does not have valid MX records', checkedAt: 'Jul 14, 2025 · 09:10' },
  { id: 6, email: 'nobody@defunct.co', status: 'invalid', reason: 'Mailbox does not exist on this server', checkedAt: 'Jul 13, 2025 · 16:45' },
  { id: 7, email: 'slow@timeoutmail.net', status: 'unknown', reason: 'Mail server timed out — try again later', checkedAt: 'Jul 13, 2025 · 16:45' },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VerifStatus, {
  label: string; color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode; advice: string;
}> = {
  valid: { label: 'Valid', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />, advice: 'Safe to send' },
  invalid: { label: 'Invalid', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />, advice: 'Do not send — will hard-bounce' },
  risky: { label: 'Risky', color: 'warning', icon: <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />, advice: 'Send with caution or skip' },
  unknown: { label: 'Unknown', color: 'default', icon: <HelpOutlineIcon sx={{ fontSize: 16, color: 'text.disabled' }} />, advice: 'Retry later or skip if low-priority' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AudienceVerificationPage() {
  const [history, setHistory] = useState<VerifResult[]>(SEED);
  const [input, setInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleVerify = useCallback(async () => {
    const emails = input.split('\n').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) { setError('Enter at least one email address'); return; }
    if (emails.length > 1000) { setError('Maximum 1,000 emails per batch'); return; }

    // Validate formats first
    const invalid = emails.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid.length > 0) {
      setError(`Invalid email format: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? ` +${invalid.length - 3} more` : ''}`);
      return;
    }

    setError('');
    setVerifying(true);
    setProgress(0);

    // Simulate progress during API call
    const ticker = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 200);

    try {
      const res = await fetch(`${API()}/api/contacts/verify`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      clearInterval(ticker); setProgress(100);
      if (res.ok) {
        const results: VerifResult[] = await res.json();
        setHistory(prev => [...results, ...prev]);
      } else { throw new Error('API error'); }
    } catch {
      clearInterval(ticker); setProgress(100);
      // Offline: simulate results
      const now = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      const simulated: VerifResult[] = emails.map((email, idx) => ({
        id: Date.now() + idx,
        email,
        status: 'unknown' as VerifStatus,
        reason: 'API not connected — result simulated',
        checkedAt: now,
      }));
      setHistory(prev => [...simulated, ...prev]);
    } finally {
      setVerifying(false);
      setTimeout(() => setProgress(0), 800);
      setInput('');
    }
  }, [input]);

  const handleRemove = useCallback((id: number) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  }, []);

  const counts = {
    valid: history.filter(r => r.status === 'valid').length,
    invalid: history.filter(r => r.status === 'invalid').length,
    risky: history.filter(r => r.status === 'risky').length,
    unknown: history.filter(r => r.status === 'unknown').length,
  };

  const deliverabilityScore = history.length > 0
    ? Math.round((counts.valid / history.length) * 100)
    : null;

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Email verification</Typography>
            <Chip label="New" size="small" sx={{ bgcolor: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, height: 20 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Check email addresses before importing to protect your sender reputation and reduce bounces.
          </Typography>
        </Stack>
      </Box>

      {/* Verify input */}
      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Verify email addresses</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Enter one email per line. Supports up to 1,000 addresses per batch.
        </Typography>
        <Stack spacing={1.5}>
          <Box sx={{ position: 'relative' }}>
            <textarea
              rows={6}
              placeholder={'alice@example.com\nbob@company.io\ntest@domain.net'}
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                padding: '10px 14px', fontFamily: 'inherit', fontSize: 13,
                border: `1px solid ${error ? '#dc2626' : 'rgba(0,0,0,0.23)'}`,
                borderRadius: 6, outline: 'none', lineHeight: 1.6,
                background: 'transparent', color: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#0284c7'}
              onBlur={e => e.target.style.borderColor = error ? '#dc2626' : 'rgba(0,0,0,0.23)'}
            />
          </Box>
          {error && <Typography variant="caption" color="error.main">{error}</Typography>}
          {verifying && (
            <Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Verifying {input.split('\n').filter(Boolean).length} addresses…
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" startIcon={verifying ? <CircularProgress size={14} color="inherit" /> : <FactCheckIcon fontSize="small" />}
              onClick={handleVerify} disabled={verifying || !input.trim()}
              sx={{ borderRadius: 1, fontWeight: 600 }}>
              {verifying ? 'Verifying…' : 'Verify emails'}
            </Button>
            {input && (
              <Typography variant="caption" color="text.secondary">
                {input.split('\n').filter(Boolean).length} address{input.split('\n').filter(Boolean).length !== 1 ? 'es' : ''} entered
              </Typography>
            )}
          </Box>
        </Stack>
      </GlassCard>

      {/* Summary */}
      {history.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
            {([
              { key: 'valid', label: 'Valid', color: 'success.main', advice: 'Safe to send' },
              { key: 'invalid', label: 'Invalid', color: 'error.main', advice: 'Do not send' },
              { key: 'risky', label: 'Risky', color: 'warning.main', advice: 'Send with caution' },
              { key: 'unknown', label: 'Unknown', color: 'text.secondary', advice: 'Retry later' },
            ] as const).map(s => (
              <GlassCard key={s.key} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  {STATUS_CONFIG[s.key as VerifStatus].icon}
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color={s.color}>{counts[s.key as keyof typeof counts]}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{s.advice}</Typography>
              </GlassCard>
            ))}
          </Box>

          {deliverabilityScore !== null && (
            <GlassCard sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>List deliverability score</Typography>
                <Typography variant="body2" fontWeight={700}
                  color={deliverabilityScore >= 90 ? 'success.main' : deliverabilityScore >= 70 ? 'warning.main' : 'error.main'}>
                  {deliverabilityScore}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={deliverabilityScore}
                color={deliverabilityScore >= 90 ? 'success' : deliverabilityScore >= 70 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {deliverabilityScore >= 90 ? '✓ Excellent — safe to send this list' :
                  deliverabilityScore >= 70 ? '⚠ Fair — remove invalid addresses before sending' :
                    '✗ Poor — clean this list before sending to avoid reputation damage'}
              </Typography>
            </GlassCard>
          )}
        </>
      )}

      {/* Results table */}
      {history.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Verification history</Typography>
              <Typography variant="caption" color="text.secondary">
                {history.length} address{history.length !== 1 ? 'es' : ''} checked — most recent first
              </Typography>
            </Box>
            <Button size="small" variant="outlined" sx={{ fontSize: 11, borderRadius: 1 }}
              onClick={async () => {
                const csv = ['Email,Status,Reason,Checked',
                  ...history.map(r => `${r.email},${r.status},"${r.reason}",${r.checkedAt}`)
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob); a.download = 'verification-results.csv'; a.click();
              }}>
              Export CSV
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Email address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Advice</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Checked at</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(r => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <TableRow key={r.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{r.email}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {cfg.icon}
                          <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption"
                          color={r.status === 'valid' ? 'success.main' : r.status === 'invalid' ? 'error.main' : r.status === 'risky' ? 'warning.main' : 'text.secondary'}>
                          {cfg.advice}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="caption" color="text.secondary" noWrap>{r.reason}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.disabled">{r.checkedAt}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove from history">
                          <IconButton size="small" onClick={() => handleRemove(r.id)}>
                            <CloseIcon sx={{ fontSize: 14 }} />
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
      )}

      {/* How it works */}
      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          How verification works
        </Typography>
        <Stack spacing={1}>
          {[
            { step: '1. DNS check', desc: 'Does the email domain have valid MX records? Invalid domains fail here.' },
            { step: '2. SMTP check', desc: 'Does the mail server acknowledge the specific mailbox exists?' },
            { step: '3. Pattern check', desc: 'Is it a known disposable provider, role address, or catch-all domain?' },
          ].map(s => (
            <Box key={s.step} sx={{ display: 'flex', gap: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ minWidth: 100, flexShrink: 0 }}>{s.step}</Typography>
              <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
            </Box>
          ))}
        </Stack>
      </GlassCard>
    </Stack>
  );
}