// src/ui/pages/modules/campaigns/all/index.tsx
//
// Drop-in replacement that:
//  - Removes the `createCampaign` import (direct fetch instead, same as other campaign pages)
//  - Adds Edit campaign support via the same wizard
//  - Wires DELETE, PATCH (pause/resume/duplicate) to real API with offline fallback
//  - Keeps the full table + grid view, sort, filter, search from the original
//  - Stays consistent with AppShell route /app/campaigns (exact)

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import AddIcon           from '@mui/icons-material/Add';
import BarChartIcon      from '@mui/icons-material/BarChart';
import CloseIcon         from '@mui/icons-material/Close';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import MoreVertIcon      from '@mui/icons-material/MoreVert';
import PauseCircleIcon   from '@mui/icons-material/PauseCircle';
import PlayCircleIcon    from '@mui/icons-material/PlayCircle';
import ScheduleSendIcon  from '@mui/icons-material/ScheduleSend';
import SearchIcon        from '@mui/icons-material/Search';
import SendIcon          from '@mui/icons-material/Send';
import ViewListIcon      from '@mui/icons-material/ViewList';
import ViewModuleIcon    from '@mui/icons-material/ViewModule';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';


const API = () => (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

async function apiFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API()}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204) return undefined;
  return res.json();
}

type CampaignStatus = 'sent' | 'sending' | 'scheduled' | 'draft' | 'paused';
type SortField      = 'name' | 'sent' | 'openRate' | 'clickRate' | 'createdAt';
type SortDir        = 'asc' | 'desc';
type ViewMode       = 'table' | 'grid';

type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  listName: string;
  sent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
};


type ApiCampaign = {
  id: string;
  name: string;
  status: string;
  subject: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  sentCount?: number;
  audienceTags?: any;
  sender?: {
    fromName?: string | null;
    fromEmail?: string | null;
    replyTo?: string | null;
  } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
};

const toLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mapStatus = (status: string): CampaignStatus => {
  const v = String(status || '').toLowerCase();
  if (v === 'draft') return 'draft';
  if (v === 'scheduled') return 'scheduled';
  if (v === 'sending') return 'sending';
  if (v === 'sent') return 'sent';
  if (v === 'paused' || v === 'cancelled' || v === 'failed') return 'paused';
  return 'draft';
};

const mapCampaign = (c: ApiCampaign): Campaign => {
  const tags = (c.audienceTags ?? {}) as any;
  return {
    id: c.id,
    name: c.name,
    status: mapStatus(c.status),
    subject: c.subject,
    previewText: tags.previewText ?? '',
    fromName: c.sender?.fromName ?? '',
    fromEmail: c.sender?.fromEmail ?? '',
    replyTo: c.sender?.replyTo ?? '',
    listName: tags.listName ?? 'All Subscribers',
    sent: c.sentCount ?? 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    scheduledAt: c.scheduledAt ?? undefined,
    sentAt: c.sentAt ?? undefined,
    createdAt: c.createdAt,
  };
};

type CampaignForm = {
  name: string;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  listName: string;
  sendMode: 'now' | 'schedule' | 'draft';
  scheduledAt: string;
};

type FormErrors = Partial<Record<keyof CampaignForm, string>>;

const EMPTY_FORM: CampaignForm = {
  name: '', subject: '', previewText: '',
  fromName: '', fromEmail: '', replyTo: '',
  listName: '', sendMode: 'draft', scheduledAt: '',
};

const CONTACT_LISTS = [
  'All Subscribers', 'Active Users', 'Inactive 90d',
  'Newsletter List', 'New Signups', 'VIP Customers', 'Churned Users',
];

const WIZARD_STEPS = ['Details', 'Sender', 'Audience', 'Schedule'];

function validateStep(step: number, form: CampaignForm): FormErrors {
  const errors: FormErrors = {};
  if (step === 0) {
    if (!form.name.trim())    errors.name    = 'Campaign name is required';
    if (!form.subject.trim()) errors.subject = 'Subject line is required';
  }
  if (step === 1) {
    if (!form.fromName.trim())  errors.fromName  = 'From name is required';
    if (!form.fromEmail.trim()) errors.fromEmail = 'From email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fromEmail)) errors.fromEmail = 'Enter a valid email';
    if (form.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.replyTo)) errors.replyTo = 'Enter a valid email';
  }
  if (step === 2) {
    if (!form.listName) errors.listName = 'Select a contact list';
  }
  if (step === 3) {
    if (form.sendMode === 'schedule') {
      if (!form.scheduledAt) errors.scheduledAt = 'Pick a date and time';
      else if (new Date(form.scheduledAt) <= new Date()) errors.scheduledAt = 'Scheduled time must be in the future';
    }
  }
  return errors;
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: 'success'|'info'|'warning'|'default'|'error' }> = {
  sent:      { label: 'Sent',      color: 'success' },
  sending:   { label: 'Sending',   color: 'info'    },
  scheduled: { label: 'Scheduled', color: 'warning' },
  draft:     { label: 'Draft',     color: 'default' },
  paused:    { label: 'Paused',    color: 'error'   },
};

const ALL_STATUSES: CampaignStatus[] = ['sent', 'sending', 'scheduled', 'draft', 'paused'];

// â”€â”€â”€ Seed data  â”€â”€â”€â”€

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: '',  name: 'Summer Sale Blast',        status: 'sent',      subject: 'Summer deals â€” up to 50% off',          previewText: "Don't miss out on our biggest sale", fromName: 'Acme Team',   fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'All Subscribers',  sent: 4210,  openRate: 34.2, clickRate: 8.1,  bounceRate: 0.6, sentAt: 'Jul 12, 2025', createdAt: '2025-07-10' },
  { id: '',  name: 'Product Update v2.4',       status: 'sent',      subject: 'New features you asked for are here',      previewText: 'Version 2.4 is live with 12 updates', fromName: 'Acme Team',  fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'Active Users',     sent: 3870,  openRate: 29.7, clickRate: 6.4,  bounceRate: 0.9, sentAt: 'Jul 8, 2025',  createdAt: '2025-07-06' },
  { id: '',  name: 'Re-engagement Flow',        status: 'sending',   subject: "We miss you here's a special offer",    previewText: 'Come back and save 20%',              fromName: 'Acme Team',   fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'Inactive 90d',     sent: 1540,  openRate: 22.1, clickRate: 4.9,  bounceRate: 1.1, createdAt: '2025-07-14' },
  { id: '',  name: 'Weekly Newsletter #48',     status: 'draft',     subject: '[Draft] Weekly roundup week 48',        previewText: 'Your weekly digest is ready',         fromName: 'Acme News',   fromEmail: 'news@acme.com',   replyTo: 'news@acme.com',   listName: 'Newsletter List',  sent: 0,     openRate: 0,    clickRate: 0,    bounceRate: 0,   createdAt: '2025-07-15' },
  { id: '',  name: 'Onboarding Series #1',      status: 'sent',      subject: "Welcome! Here's how to get started",      previewText: 'Your account is ready',               fromName: 'Acme Team',   fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'New Signups',      sent: 2980,  openRate: 41.3, clickRate: 12.6, bounceRate: 0.3, sentAt: 'Jul 3, 2025',  createdAt: '2025-07-01' },
  { id: '',  name: 'Black Friday Teaser',       status: 'scheduled', subject: 'Black Friday is coming get ready',   previewText: 'Exclusive early access for you',      fromName: 'Acme Deals',  fromEmail: 'deals@acme.com',  replyTo: 'deals@acme.com',  listName: 'All Subscribers',  sent: 0,     openRate: 0,    clickRate: 0,    bounceRate: 0,   scheduledAt: 'Nov 1, 2025',  createdAt: '2025-07-13' },
  { id: '',  name: 'Winback Campaign Q3',       status: 'paused',    subject: 'Come back — we have something for you',   previewText: 'Missed you lately',                   fromName: 'Acme Team',   fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'Churned Users',    sent: 890,   openRate: 18.4, clickRate: 3.2,  bounceRate: 2.4, createdAt: '2025-06-28' },
  { id: '',  name: 'Feature Announcement',      status: 'sent',      subject: 'Introducing AI-powered email suggestions',previewText: 'The future of email is here',         fromName: 'Acme Team',   fromEmail: 'hello@acme.com',  replyTo: 'hello@acme.com',  listName: 'All Subscribers',  sent: 5120,  openRate: 38.6, clickRate: 10.2, bounceRate: 0.4, sentAt: 'Jun 20, 2025', createdAt: '2025-06-18' },
];

// â”€â”€â”€ Helpers  â”€â”€â”€â”€â”€â”€

function StatusChip({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined"
      sx={{ fontSize: 11, height: 22, fontWeight: 500 }} />
  );
}

function RateBar({ value, color = 'primary' }: { value: number; color?: 'primary'|'success'|'error' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
      <LinearProgress variant="determinate" value={Math.min(value, 100)} color={color}
        sx={{ flex: 1, height: 4, borderRadius: 1 }} />
      <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', fontWeight: 500 }}>
        {value > 0 ? `${value}%` : 'â€”'}
      </Typography>
    </Box>
  );
}

// â”€â”€â”€ Campaign action menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ActionProps = {
  campaign: Campaign;
  userRole?: Role;
  onEdit:        (c: Campaign) => void;
  onDuplicate:   (c: Campaign) => void;
  onSchedule:    (c: Campaign) => void;
  onPauseResume: (c: Campaign) => void;
  onDelete:      (c: Campaign) => void;
  onViewReport:  (c: Campaign) => void;
};

function CampaignActions({
  campaign, userRole, onEdit, onDuplicate,
  onSchedule, onPauseResume, onDelete, onViewReport,
}: ActionProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const canEdit = userRole !== Role.CLIENT_USER;

  return (
    <>
      <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 188, boxShadow: 4 } }}>

        {/* View report â€” sent / sending / paused */}
        {['sent', 'sending', 'paused'].includes(campaign.status) && (
          <MenuItem dense onClick={() => { onViewReport(campaign); setAnchor(null); }}>
            <BarChartIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> View report
          </MenuItem>
        )}

        {/* Edit â€” any status if canEdit */}
        {canEdit && (
          <MenuItem dense onClick={() => { onEdit(campaign); setAnchor(null); }}>
            <EditIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Edit campaign
          </MenuItem>
        )}

        {/* Duplicate */}
        {canEdit && (
          <MenuItem dense onClick={() => { onDuplicate(campaign); setAnchor(null); }}>
            <ContentCopyIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Duplicate
          </MenuItem>
        )}

        {/* Schedule â€” drafts only */}
        {canEdit && campaign.status === 'draft' && (
          <MenuItem dense onClick={() => { onSchedule(campaign); setAnchor(null); }}>
            <ScheduleSendIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Schedule
          </MenuItem>
        )}

        {/* Pause / Resume â€” sending or paused */}
        {canEdit && ['sending', 'paused'].includes(campaign.status) && (
          <MenuItem dense onClick={() => { onPauseResume(campaign); setAnchor(null); }}>
            {campaign.status === 'sending'
              ? <><PauseCircleIcon sx={{ fontSize: 16, mr: 1.5, color: 'warning.main' }} /> Pause sending</>
              : <><PlayCircleIcon  sx={{ fontSize: 16, mr: 1.5, color: 'success.main' }} /> Resume sending</>}
          </MenuItem>
        )}

        {/* Delete â€” not while actively sending */}
        {canEdit && campaign.status !== 'sending' && (
          <>
            <Divider />
            <MenuItem dense sx={{ color: 'error.main' }}
              onClick={() => { onDelete(campaign); setAnchor(null); }}>
              <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

// â”€â”€â”€ Campaign card (grid view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CampaignCard(props: ActionProps) {
  const { campaign } = props;
  return (
    <GlassCard sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>{campaign.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {campaign.subject}
          </Typography>
        </Box>
        <CampaignActions {...props} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <StatusChip status={campaign.status} />
        <Typography variant="caption" color="text.disabled" noWrap>{campaign.listName}</Typography>
      </Box>

      {campaign.sent > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {[
            { label: 'Sent',       value: campaign.sent.toLocaleString(),  color: undefined },
            { label: 'Open rate',  value: `${campaign.openRate}%`,         color: campaign.openRate  >= 25 ? 'success.main' : 'text.primary' },
            { label: 'Click rate', value: `${campaign.clickRate}%`,        color: undefined },
            { label: 'Bounce',     value: `${campaign.bounceRate}%`,       color: campaign.bounceRate >= 2  ? 'error.main'   : 'text.secondary' },
          ].map(s => (
            <Box key={s.label}>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.2 }}>
                {s.label}
              </Typography>
              <Typography variant="body2" fontWeight={700} color={s.color}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.disabled" fontStyle="italic">
          {campaign.status === 'scheduled'
            ? `Scheduled for ${formatDate(campaign.scheduledAt) || '—'}`
            : 'No send data yet'}
        </Typography>
      )}

      <Box sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled">
          {formatDate(campaign.sentAt ?? campaign.scheduledAt ?? campaign.createdAt) || '—'}
        </Typography>
      </Box>
    </GlassCard>
  );
}

type CampaignModalProps = {
  open: boolean;
  onClose: () => void;
  editing: Campaign | null;
  onSaved: (c: Campaign, isEdit: boolean) => void;
};

function CampaignModal({ open, onClose, editing, onSaved }: CampaignModalProps) {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState<CampaignForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Re-populate whenever editing changes (or modal opens for create)
  const [lastEditing, setLastEditing] = useState<Campaign | null>(null);
  if (open && editing !== lastEditing) {
    setLastEditing(editing);
    setStep(0);
    setErrors({});
    if (editing) {
      setForm({
        name:        editing.name,
        subject:     editing.subject,
        previewText: editing.previewText,
        fromName:    editing.fromName,
        fromEmail:   editing.fromEmail,
        replyTo:     editing.replyTo,
        listName:    editing.listName,
        sendMode:    editing.status === 'scheduled' ? 'schedule'
                   : editing.status === 'draft'     ? 'draft'
                   : 'draft',
        scheduledAt: toLocalInput(editing.scheduledAt),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  const set = useCallback((field: keyof CampaignForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleClose = () => {
    setStep(0); setForm(EMPTY_FORM); setErrors({});
    onClose();
  };

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSave = async () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    const status: CampaignStatus =
      form.sendMode === 'now'      ? 'sending'   :
      form.sendMode === 'schedule' ? 'scheduled' :
                                      'draft';

    const payload = {
      name:        form.name,
      subject:     form.subject,
      previewText: form.previewText,
      fromName:    form.fromName,
      fromEmail:   form.fromEmail,
      replyTo:     form.replyTo || form.fromEmail,
      listName:    form.listName,
      sendMode:    form.sendMode,
      scheduledAt: form.sendMode === 'schedule' ? new Date(form.scheduledAt).toISOString() : undefined,
    };

    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/campaigns/${editing.id}`, payload) as ApiCampaign;
        onSaved(mapCampaign(updated), true);
      } else {
        const created = await apiFetch('POST', '/api/campaigns', payload) as ApiCampaign;
        onSaved(mapCampaign(created), false);
      }
      handleClose();
    } catch {
      // Offline optimistic fallback
      if (editing) {
        onSaved({
          ...editing,
          name: form.name,
          subject: form.subject,
          previewText: form.previewText,
          fromName: form.fromName,
          fromEmail: form.fromEmail,
          replyTo: form.replyTo || form.fromEmail,
          listName: form.listName,
          status,
          scheduledAt: form.sendMode === 'schedule' ? form.scheduledAt : undefined,
        }, true);
      } else {
        onSaved({
          id:        String(Date.now()),
          sent:      0, openRate: 0, clickRate: 0, bounceRate: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          name: form.name,
          subject: form.subject,
          previewText: form.previewText,
          fromName: form.fromName,
          fromEmail: form.fromEmail,
          replyTo: form.replyTo || form.fromEmail,
          listName: form.listName,
          status,
          scheduledAt: form.sendMode === 'schedule' ? form.scheduledAt : undefined,
        }, false);
      }
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === WIZARD_STEPS.length - 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}>

      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {editing ? 'Edit campaign' : 'New campaign'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {editing
                ? `Editing "${editing.name}"`
                : 'Fill in the details to create your campaign'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={step} alternativeLabel>
          {WIZARD_STEPS.map(label => (
            <Step key={label}>
              <StepLabel><Typography variant="caption">{label}</Typography></StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      <Divider />

      <DialogContent sx={{ pt: 3 }}>

        {/* Step 0 â€” Campaign details */}
        {step === 0 && (
          <Stack spacing={2.5}>
            <TextField
              label="Campaign name" placeholder="e.g. Summer Sale Blast" autoFocus
              value={form.name} onChange={e => set('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name ?? 'Internal name â€” not visible to recipients'}
              fullWidth />
            <TextField
              label="Subject line" placeholder="e.g. â˜€ï¸ Summer deals â€” up to 50% off"
              value={form.subject} onChange={e => set('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ?? `${form.subject.length}/150 characters`}
              inputProps={{ maxLength: 150 }} fullWidth />
            <TextField
              label="Preview text (optional)"
              placeholder="Short teaser shown in inbox previewsâ€¦"
              value={form.previewText} onChange={e => set('previewText', e.target.value)}
              helperText={`${form.previewText.length}/200 characters`}
              inputProps={{ maxLength: 200 }} fullWidth multiline rows={2} />
          </Stack>
        )}

        {/* Step 1 â€” Sender info */}
        {step === 1 && (
          <Stack spacing={2.5}>
            <TextField
              label="From name" placeholder="e.g. Acme Team"
              value={form.fromName} onChange={e => set('fromName', e.target.value)}
              error={Boolean(errors.fromName)}
              helperText={errors.fromName ?? 'The name recipients see in their inbox'}
              fullWidth />
            <TextField
              label="From email" placeholder="e.g. hello@yourdomain.com" type="email"
              value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)}
              error={Boolean(errors.fromEmail)}
              helperText={errors.fromEmail ?? 'Must be a verified sending domain'}
              fullWidth />
            <TextField
              label="Reply-to email (optional)" placeholder="e.g. support@yourdomain.com" type="email"
              value={form.replyTo} onChange={e => set('replyTo', e.target.value)}
              error={Boolean(errors.replyTo)}
              helperText={errors.replyTo ?? 'Leave blank to use the from email'}
              fullWidth />
          </Stack>
        )}

        {/* Step 2 â€” Audience */}
        {step === 2 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth error={Boolean(errors.listName)}>
              <InputLabel>Contact list</InputLabel>
              <Select value={form.listName} label="Contact list"
                onChange={e => set('listName', e.target.value)}>
                {CONTACT_LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
              <FormHelperText>
                {errors.listName ?? 'Select the audience for this campaign'}
              </FormHelperText>
            </FormControl>
            {form.listName && (
              <Alert severity="info" sx={{ fontSize: 13 }}>
                Sending to <strong>{form.listName}</strong>. Unsubscribed and suppressed contacts are excluded automatically.
              </Alert>
            )}
          </Stack>
        )}

        {/* Step 3 â€” Schedule / send mode */}
        {step === 3 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Send mode</InputLabel>
              <Select value={form.sendMode} label="Send mode"
                onChange={e => set('sendMode', e.target.value as CampaignForm['sendMode'])}>
                <MenuItem value="draft">Save as draft</MenuItem>
                <MenuItem value="schedule">Schedule for later</MenuItem>
                <MenuItem value="now">Send immediately</MenuItem>
              </Select>
              <FormHelperText>
                {form.sendMode === 'draft'
                  ? 'Saved but not sent until you manually trigger it.'
                  : form.sendMode === 'schedule'
                  ? 'Automatically sent at the date and time you pick.'
                  : 'Queued immediately after saving.'}
              </FormHelperText>
            </FormControl>

            {form.sendMode === 'schedule' && (
              <TextField
                label="Scheduled date & time" type="datetime-local"
                value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)}
                error={Boolean(errors.scheduledAt)}
                helperText={errors.scheduledAt ?? 'Campaign will be sent automatically at this time'}
                fullWidth InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 16) }} />
            )}

            {form.sendMode === 'now' && (
              <Alert severity="warning" sx={{ fontSize: 13 }}>
                The campaign will be queued immediately after saving. Double-check your subject line, sender details, and audience before proceeding.
              </Alert>
            )}

            {/* Summary */}
            <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                Summary
              </Typography>
              {[
                { label: 'Name',      value: form.name },
                { label: 'Subject',   value: form.subject },
                { label: 'From',      value: form.fromName ? `${form.fromName} <${form.fromEmail}>` : 'â€”' },
                { label: 'Audience',  value: form.listName || 'â€”' },
                { label: 'Send mode', value:
                    form.sendMode === 'draft'    ? 'Save as draft' :
                    form.sendMode === 'schedule' ? 'Scheduled — ' + (formatDate(form.scheduledAt) || 'not set') :
                                                   'Send immediately' },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 72 }}>
                    {row.label}
                  </Typography>
                  <Typography variant="caption" fontWeight={500} noWrap sx={{ flex: 1 }}>
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>
          Cancel
        </Button>
        {step > 0 && (
          <Button onClick={handleBack} variant="outlined" size="small">Back</Button>
        )}
        {!isLastStep ? (
          <Button onClick={handleNext} variant="contained" size="small">Next</Button>
        ) : (
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
            startIcon={<SendIcon fontSize="small" />}>
            {saving ? 'Saving...' :
              form.sendMode === 'now'      ? 'Save & send' :
              form.sendMode === 'schedule' ? (editing ? 'Update schedule' : 'Schedule campaign') :
                                             (editing ? 'Save changes' : 'Save as draft')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
  

function DeleteDialog({
  campaign, onConfirm, onCancel,
}: { campaign: Campaign | null; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog open={Boolean(campaign)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Delete campaign?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>"{campaign?.name}"</strong> will be permanently deleted. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export function AllCampaignsPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [campaigns,    setCampaigns]    = useState<Campaign[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [viewMode,     setViewMode]     = useState<ViewMode>('table');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [sortField,    setSortField]    = useState<SortField>('createdAt');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Campaign | null>(null);
  const [toDelete,     setToDelete]     = useState<Campaign | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch('GET', '/api/campaigns')
      .then((data: ApiCampaign[]) => {
        if (!active) return;
        setCampaigns(data.map(mapCampaign));
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setCampaigns(INITIAL_CAMPAIGNS);
        setLoadError('Unable to load campaigns. Showing local data.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // â”€â”€ Sort handler â”€â”€
  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => sortField === field && prev === 'desc' ? 'asc' : 'desc');
    setSortField(field);
  }, [sortField]);

  // â”€â”€ Filtered + sorted list â”€â”€
  const displayed = useMemo(() => {
    let list = [...campaigns];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    list.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [campaigns, search, statusFilter, sortField, sortDir]);

  // â”€â”€ Modal saved callback â”€â”€
  const handleSaved = useCallback((c: Campaign, isEdit: boolean) => {
    setCampaigns(prev =>
      isEdit ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]
    );
  }, []);

  // â”€â”€ Duplicate â”€â”€
  const handleDuplicate = useCallback(async (c: Campaign) => {
    try {
      const duped = await apiFetch('POST', `/api/campaigns/${c.id}/duplicate`) as ApiCampaign;
      setCampaigns(prev => [mapCampaign(duped), ...prev]);
    } catch {
      // Offline fallback
      const copy: Campaign = {
        ...c,
        id:        String(Date.now()),
        name:      `${c.name} (copy)`,
        status:    'draft',
        sent:      0, openRate: 0, clickRate: 0, bounceRate: 0,
        sentAt:    undefined, scheduledAt: undefined,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setCampaigns(prev => [copy, ...prev]);
    }
  }, []);

  // â”€â”€ Pause / Resume â”€â”€
  const handlePauseResume = useCallback(async (c: Campaign) => {
    const next: CampaignStatus = c.status === 'sending' ? 'paused' : 'sending';
    try { await apiFetch('PATCH', `/api/campaigns/${c.id}`, { status: next }); } catch {}
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
  }, []);

  // â”€â”€ Delete â”€â”€
  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/campaigns/${toDelete.id}`); } catch {}
    setCampaigns(prev => prev.filter(x => x.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  // â”€â”€ Action props builder â”€â”€
  const actionProps = (c: Campaign): ActionProps => ({
    campaign:      c,
    userRole:      user?.role,
    onEdit:        () => { setEditing(c); setModalOpen(true); },
    onDuplicate:   handleDuplicate,
    onSchedule:    () => { setEditing(c); setModalOpen(true); }, // opens modal pre-filled
    onPauseResume: handlePauseResume,
    onDelete:      setToDelete,
    onViewReport:  () => { /* navigate to analytics */ },
  });

  // â”€â”€ Summary counts â”€â”€
  const counts = useMemo(() => ({
    total:     campaigns.length,
    sent:      campaigns.filter(c => c.status === 'sent').length,
    sending:   campaigns.filter(c => c.status === 'sending').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    draft:     campaigns.filter(c => c.status === 'draft').length,
  }), [campaigns]);

  return (
    <Stack spacing={2.5}>

      {/* â”€â”€ Header â”€â”€ */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>All campaigns</Typography>
          <Typography variant="body2" color="text.secondary">
            View, manage and analyse every campaign in one place.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            New campaign
          </Button>
        )}
      </Box>


      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
      {loadError && <Alert severity="warning" sx={{ fontSize: 13 }}>{loadError}</Alert>}

      {/* â”€â”€ Summary chips â”€â”€ */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {[
          { label: 'Total',     value: counts.total,     color: 'default'  },
          { label: 'Sent',      value: counts.sent,      color: 'success'  },
          { label: 'Sending',   value: counts.sending,   color: 'info'     },
          { label: 'Scheduled', value: counts.scheduled, color: 'warning'  },
          { label: 'Drafts',    value: counts.draft,     color: 'default'  },
        ].map(s => (
          <Chip key={s.label} label={`${s.label}: ${s.value}`} color={s.color as any}
            variant={s.label === 'Total' ? 'filled' : 'outlined'} size="small"
            sx={{ fontWeight: 600, fontSize: 12 }} />
        ))}
      </Stack>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search campaigns" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment:
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment> }}
          sx={{ minWidth: 220, flex: 1, maxWidth: 340 }} />

        {/* Status filter chips */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label="All" size="small"
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            color={statusFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('all')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: 11 }} />
          {ALL_STATUSES.map(s => (
            <Chip key={s} label={STATUS_CONFIG[s].label} size="small"
              variant={statusFilter === s ? 'filled' : 'outlined'}
              color={statusFilter === s ? STATUS_CONFIG[s].color : 'default'}
              onClick={() => setStatusFilter(s)}
              sx={{ cursor: 'pointer', fontSize: 11 }} />
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Sort dropdown */}
        <TextField select size="small" value={`${sortField}_${sortDir}`}
          onChange={e => {
            const [f, d] = e.target.value.split('_') as [SortField, SortDir];
            setSortField(f); setSortDir(d);
          }}
          sx={{ minWidth: 165 }} SelectProps={{ native: true }}>
          <option value="createdAt_desc">Newest first</option>
          <option value="createdAt_asc">Oldest first</option>
          <option value="sent_desc">Most sent</option>
          <option value="openRate_desc">Best open rate</option>
          <option value="clickRate_desc">Best click rate</option>
        </TextField>

        {/* View mode toggle */}
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
          <ToggleButton value="table">
            <Tooltip title="Table view"><ViewListIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="grid">
            <Tooltip title="Grid view"><ViewModuleIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* â”€â”€ Empty state â”€â”€ */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <SendIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No campaigns found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first campaign to get started.'}
          </Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>
              New campaign
            </Button>
          )}
        </GlassCard>
      )}

      {/* â”€â”€ TABLE VIEW â”€â”€ */}
      {viewMode === 'table' && displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <TableCell>
                    <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}>Campaign</TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>List</TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'sent'} direction={sortField === 'sent' ? sortDir : 'asc'}
                      onClick={() => handleSort('sent')}>Sent</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 130 }}>
                    <TableSortLabel active={sortField === 'openRate'} direction={sortField === 'openRate' ? sortDir : 'asc'}
                      onClick={() => handleSort('openRate')}>Open rate</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 130 }}>
                    <TableSortLabel active={sortField === 'clickRate'} direction={sortField === 'clickRate' ? sortDir : 'asc'}
                      onClick={() => handleSort('clickRate')}>Click rate</TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Bounce</TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'createdAt'} direction={sortField === 'createdAt' ? sortDir : 'asc'}
                      onClick={() => handleSort('createdAt')}>Date</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(c => (
                  <TableRow key={c.id} hover
                    sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{c.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                        {c.subject}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={c.status} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>{c.listName}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {c.sent > 0 ? c.sent.toLocaleString() : 'â€”'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {c.openRate > 0
                        ? <RateBar value={c.openRate} color={c.openRate >= 25 ? 'success' : 'primary'} />
                        : <Typography variant="body2" color="text.disabled">â€”</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {c.clickRate > 0
                        ? <RateBar value={c.clickRate} />
                        : <Typography variant="body2" color="text.disabled">â€”</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {c.bounceRate > 0
                        ? <Typography variant="body2"
                            color={c.bounceRate >= 2 ? 'error.main' : 'text.secondary'}
                            fontWeight={c.bounceRate >= 2 ? 700 : 400}>
                            {c.bounceRate}%
                          </Typography>
                        : <Typography variant="body2" color="text.disabled">â€”</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 12 }}>
                      {formatDate(c.sentAt ?? c.scheduledAt ?? c.createdAt) || '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0.5 }}>
                      <CampaignActions {...actionProps(c)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {/* â”€â”€ GRID VIEW â”€â”€ */}
      {viewMode === 'grid' && displayed.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' } }}>
          {displayed.map(c => <CampaignCard key={c.id} {...actionProps(c)} />)}
        </Box>
      )}

      {displayed.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          Showing {displayed.length} of {campaigns.length} campaigns
        </Typography>
      )}

      {/* â”€â”€ Modals â”€â”€ */}
      <CampaignModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
      <DeleteDialog
        campaign={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  );
}























