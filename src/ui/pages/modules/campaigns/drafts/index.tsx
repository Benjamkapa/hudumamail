// src/ui/pages/modules/campaigns/drafts/index.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormHelperText,
  IconButton, InputAdornment, InputLabel, LinearProgress, MenuItem, Select,
  Stack, Step, StepLabel, Stepper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DraftsIcon        from '@mui/icons-material/Drafts';
import EditIcon          from '@mui/icons-material/Edit';
import SearchIcon        from '@mui/icons-material/Search';
import SendIcon          from '@mui/icons-material/Send';
import ScheduleSendIcon  from '@mui/icons-material/ScheduleSend';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';

const BASE = () => (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

type Draft = {
  id: string; name: string; subject: string; previewText: string;
  fromName: string; fromEmail: string; replyTo: string;
  listName: string; updatedAt: string;
};


type ApiCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  audienceTags?: any;
  sender?: { fromName?: string | null; fromEmail?: string | null; replyTo?: string | null } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
};

const toLocalInput = (value?: Date | string | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mapDraft = (c: ApiCampaign): Draft => {
  const tags = (c.audienceTags ?? {}) as any;
  return {
    id: c.id,
    name: c.name,
    subject: c.subject,
    previewText: tags.previewText ?? '',
    fromName: c.sender?.fromName ?? '',
    fromEmail: c.sender?.fromEmail ?? '',
    replyTo: c.sender?.replyTo ?? '',
    listName: tags.listName ?? 'All Subscribers',
    updatedAt: formatDate(c.updatedAt ?? c.createdAt),
  };
};type DraftForm = Omit<Draft, 'id' | 'updatedAt'>;
type Errors = Partial<Record<keyof DraftForm, string>>;

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Draft[] = [
  { id: '', name: 'Weekly Newsletter #48',   subject: '[Draft] Weekly roundup — week 48',      previewText: 'Your weekly digest', fromName: 'Acme News',  fromEmail: 'news@acme.com',  replyTo: '',                listName: 'Newsletter List',  updatedAt: 'Jul 15, 2025' },
  { id: '', name: 'Holiday Promo',           subject: '[Draft] Celebrate the season with us',  previewText: 'Special offer',      fromName: 'Acme Deals', fromEmail: 'deals@acme.com', replyTo: '',                listName: 'VIP Customers',    updatedAt: 'Jul 16, 2025' },
  { id: '', name: 'Q3 Product Roundup',      subject: '[Draft] Everything new in Q3',          previewText: 'Q3 highlights',      fromName: 'Acme Team',  fromEmail: 'hello@acme.com', replyTo: '',                listName: 'Active Users',     updatedAt: 'Jul 14, 2025' },
  { id: '', name: 'Referral Program Launch', subject: '[Draft] Invite a friend, earn rewards', previewText: 'Refer and earn',     fromName: 'Acme Team',  fromEmail: 'hello@acme.com', replyTo: 'support@acme.com', listName: 'All Subscribers',  updatedAt: 'Jul 12, 2025' },
];

const LISTS = ['All Subscribers','Active Users','Inactive 90d','Newsletter List','New Signups','VIP Customers','Churned Users'];
const EMPTY: DraftForm = { name:'', subject:'', previewText:'', fromName:'', fromEmail:'', replyTo:'', listName:'' };
const STEPS = ['Details','Sender','Audience'];

function validate(step: number, f: DraftForm): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.name.trim())    e.name    = 'Campaign name is required';
    if (!f.subject.trim()) e.subject = 'Subject line is required';
  }
  if (step === 1) {
    if (!f.fromName.trim())  e.fromName  = 'From name is required';
    if (!f.fromEmail.trim()) e.fromEmail = 'From email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.fromEmail)) e.fromEmail = 'Enter a valid email';
    if (f.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.replyTo)) e.replyTo = 'Enter a valid email';
  }
  if (step === 2) {
    if (!f.listName) e.listName = 'Select a contact list';
  }
  return e;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function DraftModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Draft | null;
  onSaved: (d: Draft, isEdit: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DraftForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Re-populate when editing changes
  const [lastEditing, setLastEditing] = useState<Draft | null>(null);
  if (open && editing !== lastEditing) {
    setLastEditing(editing);
    setStep(0); setErrors({});
    setForm(editing
      ? { name: editing.name, subject: editing.subject, previewText: editing.previewText,
          fromName: editing.fromName, fromEmail: editing.fromEmail,
          replyTo: editing.replyTo, listName: editing.listName }
      : EMPTY
    );
  }

  const set = useCallback((k: keyof DraftForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setStep(0); setForm(EMPTY); setErrors({}); onClose(); };

  const handleNext = () => {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`${BASE()}/api/campaigns/${editing.id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sendMode: 'draft' }),
        });
        if (res.ok) { onSaved(mapDraft(await res.json() as ApiCampaign), true); handleClose(); setSaving(false); return; }
      } else {
        const res = await fetch(`${BASE()}/api/campaigns`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sendMode: 'draft' }),
        });
        if (res.ok) { onSaved(mapDraft(await res.json() as ApiCampaign), false); handleClose(); setSaving(false); return; }
      }
    } catch { /* offline fallback below */ }
    // Offline optimistic
    const fallback: Draft = editing
      ? { ...editing, ...form, updatedAt: 'Just now' }
      : { id: String(Date.now()), ...form, updatedAt: 'Just now' };
    onSaved(fallback, Boolean(editing));
    handleClose(); setSaving(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit draft' : 'New campaign draft'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing "${editing.name}"` : 'Save a campaign to edit and send later'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map(l => <Step key={l}><StepLabel><Typography variant="caption">{l}</Typography></StepLabel></Step>)}
        </Stepper>
      </Box>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {step === 0 && (
          <Stack spacing={2.5}>
            <TextField label="Campaign name" placeholder="e.g. Weekly Newsletter #49" autoFocus
              value={form.name} onChange={e => set('name', e.target.value)}
              error={Boolean(errors.name)} helperText={errors.name ?? 'Internal — not shown to recipients'} fullWidth />
            <TextField label="Subject line" placeholder="e.g. Your weekly digest is here"
              value={form.subject} onChange={e => set('subject', e.target.value)}
              error={Boolean(errors.subject)} helperText={errors.subject ?? `${form.subject.length}/150`}
              inputProps={{ maxLength: 150 }} fullWidth />
            <TextField label="Preview text (optional)" placeholder="Inbox teaser snippet…" multiline rows={2}
              value={form.previewText} onChange={e => set('previewText', e.target.value)}
              helperText={`${form.previewText.length}/200`} inputProps={{ maxLength: 200 }} fullWidth />
          </Stack>
        )}
        {step === 1 && (
          <Stack spacing={2.5}>
            <TextField label="From name" placeholder="e.g. Acme Team"
              value={form.fromName} onChange={e => set('fromName', e.target.value)}
              error={Boolean(errors.fromName)} helperText={errors.fromName ?? 'The name recipients see'} fullWidth />
            <TextField label="From email" placeholder="e.g. hello@yourdomain.com" type="email"
              value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)}
              error={Boolean(errors.fromEmail)} helperText={errors.fromEmail ?? 'Must be a verified domain'} fullWidth />
            <TextField label="Reply-to (optional)" placeholder="e.g. support@yourdomain.com" type="email"
              value={form.replyTo} onChange={e => set('replyTo', e.target.value)}
              error={Boolean(errors.replyTo)} helperText={errors.replyTo ?? 'Leave blank to use the from email'} fullWidth />
          </Stack>
        )}
        {step === 2 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth error={Boolean(errors.listName)}>
              <InputLabel>Contact list</InputLabel>
              <Select value={form.listName} label="Contact list" onChange={e => set('listName', e.target.value)}>
                {LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
              <FormHelperText>{errors.listName ?? 'Unsubscribed contacts are excluded automatically'}</FormHelperText>
            </FormControl>
            {form.listName && (
              <Alert severity="info" sx={{ fontSize: 13 }}>
                Targeting <strong>{form.listName}</strong>. Suppressed and unsubscribed contacts will be excluded at send time.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        {step > 0 && <Button onClick={() => setStep(s => s - 1)} variant="outlined" size="small">Back</Button>}
        {step < STEPS.length - 1
          ? <Button onClick={handleNext} variant="contained" size="small">Next</Button>
          : <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
              startIcon={<DraftsIcon fontSize="small" />}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Save draft'}
            </Button>}
      </DialogActions>
    </Dialog>
  );
}

// ─── DraftsPage ───────────────────────────────────────────────────────────────

export function CampaignDraftsPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [drafts,    setDrafts]    = useState<Draft[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Draft | null>(null);
  const [toDelete,  setToDelete]  = useState<Draft | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Draft | null>(null);
  const [scheduleAt,    setScheduleAt]    = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${BASE()}/api/campaigns`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: ApiCampaign[]) => {
        if (!active) return;
        const items = data.filter(c => String(c.status || '').toLowerCase() === 'draft').map(mapDraft);
        setDrafts(items);
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setDrafts(SEED);
        setLoadError('Unable to load drafts. Showing local data.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const displayed = useMemo(() =>
    drafts.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase())
    ), [drafts, search]);

  const handleSaved = useCallback((d: Draft, isEdit: boolean) => {
    setDrafts(prev => isEdit ? prev.map(x => x.id === d.id ? d : x) : [d, ...prev]);
  }, []);

  const openSchedule = useCallback((d: Draft) => {
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    setScheduleDraft(d);
    setScheduleAt(toLocalInput(soon));
    setScheduleError(null);
  }, []);

  const handleScheduleClose = useCallback(() => {
    setScheduleDraft(null);
    setScheduleError(null);
  }, []);

  const handleScheduleSave = useCallback(async () => {
    if (!scheduleDraft) return;
    if (!scheduleAt) {
      setScheduleError('Pick a date and time');
      return;
    }
    const when = new Date(scheduleAt);
    if (Number.isNaN(when.getTime()) || when <= new Date()) {
      setScheduleError('Scheduled time must be in the future');
      return;
    }
    try {
      await fetch(BASE() + '/api/campaigns/' + scheduleDraft.id, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendMode: 'schedule', scheduledAt: scheduleAt }),
      });
    } catch { /* optimistic */ }
    setDrafts(prev => prev.filter(d => d.id !== scheduleDraft.id));
    handleScheduleClose();
  }, [scheduleDraft, scheduleAt, handleScheduleClose]);
  const handleSend = useCallback(async (d: Draft) => {
    try {
      await fetch(`${BASE()}/api/campaigns/${d.id}/send`, { method: 'POST', credentials: 'include' });
    } catch { /* optimistic */ }
    setDrafts(prev => prev.filter(x => x.id !== d.id));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await fetch(`${BASE()}/api/campaigns/${toDelete.id}`, { method: 'DELETE', credentials: 'include' }); } catch {}
    setDrafts(prev => prev.filter(d => d.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Drafts</Typography>
          <Typography variant="body2" color="text.secondary">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} — complete and send when ready.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            New draft
          </Button>
        )}
      </Box>


      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
      {loadError && <Alert severity="warning" sx={{ fontSize: 13 }}>{loadError}</Alert>}

      <TextField size="small" placeholder="Search drafts…" value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 340 }} />

      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <DraftsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No drafts found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Create a draft to work on a campaign before sending.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>New draft</Button>
          )}
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Campaign</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>List</TableCell>
                  <TableCell>Last edited</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(d => (
                  <TableRow key={d.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{d.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 240 }}>{d.subject}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{d.fromName}</Typography>
                      <Typography variant="caption" color="text.secondary">{d.fromEmail}</Typography>
                    </TableCell>
                    <TableCell><Chip label={d.listName} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{d.updatedAt}</Typography></TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit draft">
                            <IconButton size="small" onClick={() => { setEditing(d); setModalOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Schedule">
                            <IconButton size="small" onClick={() => openSchedule(d)}><ScheduleSendIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Send now">
                            <IconButton size="small" color="primary" onClick={() => handleSend(d)}>
                              <SendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setToDelete(d)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          Showing {displayed.length} of {drafts.length} drafts
        </Typography>
      )}

      <DraftModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <Dialog open={Boolean(scheduleDraft)} onClose={handleScheduleClose} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Schedule draft</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pick a send time for <strong>"{scheduleDraft?.name}"</strong>.
          </DialogContentText>
          <TextField
            label="Send date & time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: toLocalInput(new Date()) }}
            value={scheduleAt}
            onChange={e => { setScheduleAt(e.target.value); setScheduleError(null); }}
            error={Boolean(scheduleError)}
            helperText={scheduleError ?? 'The campaign will be sent automatically at this time.'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleScheduleClose} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleScheduleSave} variant="contained" size="small" startIcon={<ScheduleSendIcon fontSize="small" />}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete draft?</DialogTitle>
        <DialogContent>
          <DialogContentText><strong>"{toDelete?.name}"</strong> will be permanently deleted. This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
















