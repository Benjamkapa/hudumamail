// src/ui/pages/modules/campaigns/scheduled/index.tsx
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
import EditIcon          from '@mui/icons-material/Edit';
import ScheduleSendIcon  from '@mui/icons-material/ScheduleSend';
import SearchIcon        from '@mui/icons-material/Search';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';

const BASE = () => (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

type Scheduled = {
  id: string; name: string; subject: string; previewText: string;
  fromName: string; fromEmail: string; replyTo: string;
  listName: string; scheduledAt: string; estimatedRecipients: number;
};


type ApiCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledAt?: string | null;
  createdAt: string;
  totalCount?: number;
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

const mapScheduled = (c: ApiCampaign): Scheduled => {
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
    scheduledAt: c.scheduledAt ?? '',
    estimatedRecipients: c.totalCount ?? 0,
  };
};type SchedForm = {
  name: string; subject: string; previewText: string;
  fromName: string; fromEmail: string; replyTo: string;
  listName: string; scheduledAt: string;
};

type Errors = Partial<Record<keyof SchedForm, string>>;

const SEED: Scheduled[] = [
  { id: '', name: 'Black Friday Teaser',     subject: '🛒 Black Friday is coming — get ready',  previewText: 'Early access for you',   fromName: 'Acme Deals', fromEmail: 'deals@acme.com', replyTo: '',               listName: 'All Subscribers', scheduledAt: '2025-11-01T09:00', estimatedRecipients: 12400 },
  { id: '', name: 'Cyber Monday Flash Sale', subject: '⚡ 24-hour flash sale starts NOW',        previewText: 'Shop before it sells out',fromName: 'Acme Deals', fromEmail: 'deals@acme.com', replyTo: '',               listName: 'VIP Customers',   scheduledAt: '2025-12-02T08:00', estimatedRecipients: 3200  },
  { id: '', name: 'Year-End Review',         subject: 'A look back at an incredible year',      previewText: 'Your year in review',    fromName: 'Acme News',  fromEmail: 'news@acme.com',  replyTo: '',               listName: 'Newsletter List', scheduledAt: '2025-12-28T10:00', estimatedRecipients: 8700  },
];

const LISTS = ['All Subscribers','Active Users','Inactive 90d','Newsletter List','New Signups','VIP Customers','Churned Users'];
const EMPTY: SchedForm = { name:'', subject:'', previewText:'', fromName:'', fromEmail:'', replyTo:'', listName:'', scheduledAt:'' };
const STEPS = ['Details','Sender','Audience','Schedule'];

function validate(step: number, f: SchedForm): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.name.trim())    e.name    = 'Required';
    if (!f.subject.trim()) e.subject = 'Required';
  }
  if (step === 1) {
    if (!f.fromName.trim())  e.fromName  = 'Required';
    if (!f.fromEmail.trim()) e.fromEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.fromEmail)) e.fromEmail = 'Enter a valid email';
  }
  if (step === 2) {
    if (!f.listName) e.listName = 'Select a list';
  }
  if (step === 3) {
    if (!f.scheduledAt)                             e.scheduledAt = 'Pick a date and time';
    else if (new Date(f.scheduledAt) <= new Date()) e.scheduledAt = 'Must be in the future';
  }
  return e;
}


function SchedModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Scheduled | null;
  onSaved: (s: Scheduled, isEdit: boolean) => void;
}) {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState<SchedForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Scheduled | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setStep(0); setErrors({});
    setForm(editing
      ? { name: editing.name, subject: editing.subject, previewText: editing.previewText,
          fromName: editing.fromName, fromEmail: editing.fromEmail, replyTo: editing.replyTo,
          listName: editing.listName, scheduledAt: toLocalInput(editing.scheduledAt) }
      : EMPTY);
  }

  const set = useCallback((k: keyof SchedForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setStep(0); setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`${BASE()}/api/campaigns/${editing.id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sendMode: 'schedule' }),
        });
        if (res.ok) { onSaved(mapScheduled(await res.json() as ApiCampaign), true); handleClose(); setSaving(false); return; }
      } else {
        const res = await fetch(`${BASE()}/api/campaigns`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sendMode: 'schedule' }),
        });
        if (res.ok) { onSaved(mapScheduled(await res.json() as ApiCampaign), false); handleClose(); setSaving(false); return; }
      }
    } catch {}
    const fallback: Scheduled = editing
      ? { ...editing, ...form }
      : { id: String(Date.now()), ...form, estimatedRecipients: 0 };
    onSaved(fallback, Boolean(editing));
    handleClose(); setSaving(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit scheduled campaign' : 'Schedule a campaign'}</Typography>
            <Typography variant="caption" color="text.secondary">Set up your campaign to send at the perfect time</Typography>
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
            <TextField label="Campaign name" autoFocus value={form.name} onChange={e => set('name', e.target.value)}
              error={Boolean(errors.name)} helperText={errors.name} fullWidth />
            <TextField label="Subject line" value={form.subject} onChange={e => set('subject', e.target.value)}
              error={Boolean(errors.subject)} helperText={errors.subject ?? `${form.subject.length}/150`}
              inputProps={{ maxLength: 150 }} fullWidth />
            <TextField label="Preview text (optional)" multiline rows={2} value={form.previewText}
              onChange={e => set('previewText', e.target.value)} fullWidth />
          </Stack>
        )}
        {step === 1 && (
          <Stack spacing={2.5}>
            <TextField label="From name" value={form.fromName} onChange={e => set('fromName', e.target.value)}
              error={Boolean(errors.fromName)} helperText={errors.fromName} fullWidth />
            <TextField label="From email" type="email" value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)}
              error={Boolean(errors.fromEmail)} helperText={errors.fromEmail} fullWidth />
            <TextField label="Reply-to (optional)" type="email" value={form.replyTo} onChange={e => set('replyTo', e.target.value)}
              helperText="Leave blank to use the from email" fullWidth />
          </Stack>
        )}
        {step === 2 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth error={Boolean(errors.listName)}>
              <InputLabel>Contact list</InputLabel>
              <Select value={form.listName} label="Contact list" onChange={e => set('listName', e.target.value)}>
                {LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
              <FormHelperText>{errors.listName ?? 'Select the audience for this campaign'}</FormHelperText>
            </FormControl>
          </Stack>
        )}
        {step === 3 && (
          <Stack spacing={2.5}>
            <TextField label="Send date & time" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }}
              inputProps={{ min: toLocalInput(new Date()) }}
              value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)}
              error={Boolean(errors.scheduledAt)} helperText={errors.scheduledAt ?? 'Campaign will be sent automatically at this time'} />
            {/* Summary */}
            <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Summary</Typography>
              {[
                { label: 'Name',      value: form.name },
                { label: 'Subject',   value: form.subject },
                { label: 'From',      value: form.fromName ? `${form.fromName} <${form.fromEmail}>` : '—' },
                { label: 'Audience',  value: form.listName || '—' },
                { label: 'Sends at',  value: form.scheduledAt ? formatDate(form.scheduledAt) : 'Not set' },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 64 }}>{row.label}</Typography>
                  <Typography variant="caption" fontWeight={500} noWrap sx={{ flex: 1 }}>{row.value}</Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        {step > 0 && <Button onClick={() => setStep(s => s - 1)} variant="outlined" size="small">Back</Button>}
        {step < STEPS.length - 1
          ? <Button onClick={() => {
              const errs = validate(step, form);
              if (Object.keys(errs).length) { setErrors(errs); return; }
              setStep(s => s + 1);
            }} variant="contained" size="small">Next</Button>
          : <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
              startIcon={<ScheduleSendIcon fontSize="small" />}>
              {saving ? 'Saving…' : editing ? 'Update schedule' : 'Schedule campaign'}
            </Button>}
      </DialogActions>
    </Dialog>
  );
}

export function CampaignsScheduledPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [items,     setItems]     = useState<Scheduled[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Scheduled | null>(null);
  const [toDelete,  setToDelete]  = useState<Scheduled | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(BASE() + '/api/campaigns', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: ApiCampaign[]) => {
        if (!active) return;
        const scheduled = data.filter(c => String(c.status || '').toLowerCase() === 'scheduled').map(mapScheduled);
        setItems(scheduled);
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setItems(SEED);
        setLoadError('Unable to load scheduled campaigns. Showing local data.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const displayed = useMemo(() =>
    items.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const handleSaved = useCallback((s: Scheduled, isEdit: boolean) => {
    setItems(prev => isEdit ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await fetch(`${BASE()}/api/campaigns/${toDelete.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendMode: 'draft' }) }); } catch {}
    setItems(prev => prev.filter(s => s.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Scheduled</Typography>
          <Typography variant="body2" color="text.secondary">Campaigns queued to send automatically at a future time.</Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            Schedule campaign
          </Button>
        )}
      </Box>

      {items.length > 0 && (
        <Alert severity="info" sx={{ fontSize: 13 }}>
          {items.length} campaign{items.length > 1 ? 's are' : ' is'} scheduled to send automatically.
        </Alert>
      )}


      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
      {loadError && <Alert severity="warning" sx={{ fontSize: 13 }}>{loadError}</Alert>}

      <TextField size="small" placeholder="Search scheduled…" value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 340 }} />

      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <ScheduleSendIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No scheduled campaigns</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Schedule a campaign to send it at the perfect time.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>Schedule campaign</Button>
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
                  <TableCell>List</TableCell>
                  <TableCell align="right">Est. recipients</TableCell>
                  <TableCell>Scheduled for</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(s => (
                  <TableRow key={s.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{s.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block' }}>{s.subject}</Typography>
                    </TableCell>
                    <TableCell><Chip label={s.listName} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell align="right">{s.estimatedRecipients > 0 ? s.estimatedRecipients.toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <Chip label={formatDate(s.scheduledAt)} color="warning" size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit schedule">
                            <IconButton size="small" onClick={() => { setEditing(s); setModalOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Unschedule (move to drafts)">
                            <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
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

      <SchedModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Unschedule campaign?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> will be unscheduled and moved back to drafts.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="warning" size="small">Unschedule</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}














