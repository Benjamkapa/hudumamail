// src/ui/pages/modules/content/templates/index.tsx
//
// Templates page — Content module
//  - Thumbnail preview cards + table view
//  - Name, subject, category/tag grouping, usage count, last edited
//  - Create / Edit / Duplicate / Delete
//  - Filter by category, search, sort
//  - "Use in campaign" action
//  - Role-aware (CLIENT_USER = read only)

import { useState, useMemo, useCallback } from 'react';
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
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
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
  Drawer,
  Avatar,
  Badge,
} from '@mui/material';

import AddIcon           from '@mui/icons-material/Add';
import ArticleIcon       from '@mui/icons-material/Article';
import CloseIcon         from '@mui/icons-material/Close';
import CodeIcon          from '@mui/icons-material/Code';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import LabelIcon         from '@mui/icons-material/Label';
import MoreVertIcon      from '@mui/icons-material/MoreVert';
import SearchIcon        from '@mui/icons-material/Search';
import SendIcon          from '@mui/icons-material/Send';
import ViewListIcon      from '@mui/icons-material/ViewList';
import ViewModuleIcon    from '@mui/icons-material/ViewModule';
import BarChartIcon      from '@mui/icons-material/BarChart';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';
import { useNavigate }   from 'react-router-dom';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';

// ─── API ──────────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateCategory = 'Promotional' | 'Transactional' | 'Newsletter' | 'Onboarding' | 'Re-engagement' | 'Announcement';
type SortField        = 'name' | 'category' | 'usageCount' | 'updatedAt' | 'createdAt';
type SortDir          = 'asc' | 'desc';
type ViewMode         = 'grid' | 'table';

type Template = {
  id: string;
  name: string;
  subject: string;
  category: TemplateCategory;
  tags: string[];
  previewBg: string;        // CSS gradient used as thumbnail background
  previewAccent: string;    // accent colour shown in preview
  htmlSnippet: string;      // first ~120 chars of HTML for preview hint
  usageCount: number;       // how many campaigns reference this template
  createdAt: string;
  updatedAt: string;
};

type TemplateForm = {
  name: string;
  subject: string;
  category: TemplateCategory;
  tags: string;             // comma-separated
};

type FormErrors = Partial<Record<keyof TemplateForm, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: TemplateCategory[] = [
  'Promotional','Transactional','Newsletter','Onboarding','Re-engagement','Announcement',
];

const CATEGORY_COLOR: Record<TemplateCategory, string> = {
  Promotional:    '#6366f1',
  Transactional:  '#0ea5e9',
  Newsletter:     '#8b5cf6',
  Onboarding:     '#22c55e',
  'Re-engagement':'#f97316',
  Announcement:   '#ec4899',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't_01', name: 'Summer Sale Hero',
    subject: '☀️ Up to 50% off — this weekend only',
    category: 'Promotional', tags: ['sale','seasonal','hero'],
    previewBg: 'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)',
    previewAccent: '#f97316',
    htmlSnippet: '<table width="600"><tr><td style="background:#f97316;padding:40px;text-align:center"><h1 style="color:#fff">Summer Sale</h1>',
    usageCount: 14, createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-07-01T12:00:00Z',
  },
  {
    id: 't_02', name: 'Welcome Email',
    subject: "Welcome! Here's how to get started",
    category: 'Onboarding', tags: ['welcome','new-user','onboarding'],
    previewBg: 'linear-gradient(135deg,#a7f3d0 0%,#6ee7b7 100%)',
    previewAccent: '#22c55e',
    htmlSnippet: '<table width="600"><tr><td style="background:#22c55e;padding:32px"><h1 style="color:#fff">Welcome aboard!</h1>',
    usageCount: 31, createdAt: '2024-11-05T08:00:00Z', updatedAt: '2025-06-20T10:00:00Z',
  },
  {
    id: 't_03', name: 'Monthly Newsletter',
    subject: 'Your monthly digest — {{month}} edition',
    category: 'Newsletter', tags: ['newsletter','monthly','digest'],
    previewBg: 'linear-gradient(135deg,#ddd6fe 0%,#a78bfa 100%)',
    previewAccent: '#8b5cf6',
    htmlSnippet: '<table width="600"><tr><td style="background:#fff;border-top:4px solid #8b5cf6;padding:32px">',
    usageCount: 8, createdAt: '2025-02-14T10:00:00Z', updatedAt: '2025-07-10T08:00:00Z',
  },
  {
    id: 't_04', name: 'Password Reset',
    subject: 'Reset your password',
    category: 'Transactional', tags: ['transactional','password','security'],
    previewBg: 'linear-gradient(135deg,#bae6fd 0%,#38bdf8 100%)',
    previewAccent: '#0ea5e9',
    htmlSnippet: '<table width="600"><tr><td style="background:#f8fafc;padding:40px;text-align:center"><img src="logo.png">',
    usageCount: 0, createdAt: '2025-03-01T09:00:00Z', updatedAt: '2025-03-01T09:00:00Z',
  },
  {
    id: 't_05', name: 'Win-back Campaign',
    subject: "We miss you — here's 20% off",
    category: 'Re-engagement', tags: ['winback','discount','churned'],
    previewBg: 'linear-gradient(135deg,#fed7aa 0%,#fb923c 100%)',
    previewAccent: '#f97316',
    htmlSnippet: '<table width="600"><tr><td style="background:#fff7ed;padding:40px"><h2 style="color:#ea580c">',
    usageCount: 6, createdAt: '2025-04-08T11:00:00Z', updatedAt: '2025-07-05T09:00:00Z',
  },
  {
    id: 't_06', name: 'Product Launch',
    subject: '🚀 Introducing {{product_name}}',
    category: 'Announcement', tags: ['launch','product','announcement'],
    previewBg: 'linear-gradient(135deg,#fbcfe8 0%,#f472b6 100%)',
    previewAccent: '#ec4899',
    htmlSnippet: '<table width="600"><tr><td style="background:linear-gradient(#ec4899,#db2777);padding:48px;text-align:center">',
    usageCount: 3, createdAt: '2025-05-22T14:00:00Z', updatedAt: '2025-07-08T16:00:00Z',
  },
  {
    id: 't_07', name: 'Order Confirmation',
    subject: 'Your order #{{order_id}} is confirmed',
    category: 'Transactional', tags: ['transactional','order','receipt'],
    previewBg: 'linear-gradient(135deg,#cffafe 0%,#67e8f9 100%)',
    previewAccent: '#06b6d4',
    htmlSnippet: '<table width="600"><tr><td style="background:#fff;border-top:4px solid #06b6d4;padding:32px">',
    usageCount: 22, createdAt: '2025-01-28T08:00:00Z', updatedAt: '2025-06-15T11:00:00Z',
  },
  {
    id: 't_08', name: 'Black Friday Blast',
    subject: '⚡ Black Friday — 60% off everything',
    category: 'Promotional', tags: ['sale','black-friday','urgent'],
    previewBg: 'linear-gradient(135deg,#1e1b4b 0%,#4f46e5 100%)',
    previewAccent: '#6366f1',
    htmlSnippet: '<table width="600"><tr><td style="background:#0f0f23;padding:40px;text-align:center"><h1 style="color:#facc15">BLACK FRIDAY</h1>',
    usageCount: 9, createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-07-12T10:00:00Z',
  },
];

const EMPTY_FORM: TemplateForm = {
  name: '', subject: '', category: 'Promotional', tags: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function validateForm(form: TemplateForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim())    errors.name    = 'Template name is required';
  if (!form.subject.trim()) errors.subject = 'Subject line is required';
  return errors;
}

// ─── Category chip ────────────────────────────────────────────────────────────

function CategoryChip({ category, size = 'small' }: { category: TemplateCategory; size?: 'small' | 'medium' }) {
  return (
    <Chip
      label={category}
      size={size}
      sx={{
        fontSize: 10, height: 20, fontWeight: 600,
        bgcolor: CATEGORY_COLOR[category] + '18',
        color:   CATEGORY_COLOR[category],
        border:  `1px solid ${CATEGORY_COLOR[category]}40`,
      }}
    />
  );
}

// ─── Template thumbnail ───────────────────────────────────────────────────────

function TemplateThumbnail({ template, height = 120 }: { template: Template; height?: number }) {
  return (
    <Box sx={{
      height, borderRadius: 1.5, overflow: 'hidden', position: 'relative',
      background: template.previewBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* Simulated email layout */}
      <Box sx={{
        width: '80%', bgcolor: 'rgba(255,255,255,0.92)', borderRadius: 1,
        p: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {/* Header bar */}
        <Box sx={{ height: 8, borderRadius: 0.5, bgcolor: template.previewAccent, mb: 1, width: '60%' }} />
        {/* Text lines */}
        {[1, 0.8, 0.9, 0.6].map((w, i) => (
          <Box key={i} sx={{
            height: 4, borderRadius: 0.5, mb: 0.5,
            bgcolor: i === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.1)',
            width: `${w * 100}%`,
          }} />
        ))}
        {/* CTA button */}
        <Box sx={{
          height: 12, borderRadius: 0.5, mt: 1, width: '50%',
          bgcolor: template.previewAccent, mx: 'auto',
        }} />
      </Box>

      {/* Usage badge */}
      {template.usageCount > 0 && (
        <Chip
          icon={<SendIcon sx={{ fontSize: '10px !important' }} />}
          label={template.usageCount}
          size="small"
          sx={{
            position: 'absolute', top: 8, right: 8,
            fontSize: 10, height: 18, fontWeight: 700,
            bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
            '& .MuiChip-icon': { color: '#fff', ml: 0.5 },
          }}
        />
      )}
    </Box>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

type ActionProps = {
  template: Template;
  canEdit: boolean;
  onEdit:      (t: Template) => void;
  onDuplicate: (t: Template) => void;
  onDelete:    (t: Template) => void;
  onOpenEditor:(t: Template) => void;
};

function TemplateActions({ template, canEdit, onEdit, onDuplicate, onDelete, onOpenEditor }: ActionProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 185, boxShadow: 4 } }}>
        {canEdit && (
          <MenuItem dense onClick={() => { onOpenEditor(template); setAnchor(null); }}>
            <CodeIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Open in HTML editor
          </MenuItem>
        )}
        {canEdit && (
          <MenuItem dense onClick={() => { onEdit(template); setAnchor(null); }}>
            <EditIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Edit details
          </MenuItem>
        )}
        {canEdit && (
          <MenuItem dense onClick={() => { onDuplicate(template); setAnchor(null); }}>
            <ContentCopyIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Duplicate
          </MenuItem>
        )}
        {canEdit && (
          <>
            <Divider />
            <MenuItem dense sx={{ color: 'error.main' }}
              onClick={() => { onDelete(template); setAnchor(null); }}>
              <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

// ─── Template card (grid view) ────────────────────────────────────────────────

function TemplateCard(props: ActionProps) {
  const { template } = props;
  return (
    <GlassCard sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden',
      '&:hover .tmpl-overlay': { opacity: 1 } }}>
      {/* Thumbnail */}
      <Box sx={{ position: 'relative' }}>
        <TemplateThumbnail template={template} height={130} />
        {/* Hover overlay */}
        <Box className="tmpl-overlay" sx={{
          position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          opacity: 0, transition: 'opacity 0.18s',
          borderRadius: 1.5,
        }}>
          {props.canEdit && (
            <Button size="small" variant="contained" sx={{ fontSize: 11 }}
              startIcon={<CodeIcon sx={{ fontSize: 14 }} />}
              onClick={() => props.onOpenEditor(template)}>
              Edit HTML
            </Button>
          )}
        </Box>
      </Box>

      {/* Details */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{template.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {template.subject}
            </Typography>
          </Box>
          <TemplateActions {...props} />
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <CategoryChip category={template.category} />
          {template.tags.slice(0, 2).map(t => (
            <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 18 }} />
          ))}
        </Box>

        <Box sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BarChartIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              Used in {template.usageCount} {template.usageCount === 1 ? 'campaign' : 'campaigns'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled">
            {fmtDate(template.updatedAt)}
          </Typography>
        </Box>
      </Box>
    </GlassCard>
  );
}

// ─── Create / Edit drawer ─────────────────────────────────────────────────────

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  editing: Template | null;
  onSaved: (t: Template, isEdit: boolean) => void;
};

function TemplateDrawer({ open, onClose, editing, onSaved }: DrawerProps) {
  const [form,   setForm]   = useState<TemplateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [lastEditing, setLastEditing] = useState<Template | null>(null);
  if (open && editing !== lastEditing) {
    setLastEditing(editing);
    setErrors({});
    setForm(editing ? {
      name:     editing.name,
      subject:  editing.subject,
      category: editing.category,
      tags:     editing.tags.join(', '),
    } : EMPTY_FORM);
  }

  const set = useCallback((field: keyof TemplateForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    const payload = {
      name:     form.name.trim(),
      subject:  form.subject.trim(),
      category: form.category,
      tags:     form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    const now = new Date().toISOString();

    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/templates/${editing.id}`, payload) as Template;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/templates', payload) as Template;
        onSaved(created, false);
      }
      onClose();
    } catch {
      const GRADIENTS = [
        'linear-gradient(135deg,#c7d2fe 0%,#818cf8 100%)',
        'linear-gradient(135deg,#bbf7d0 0%,#4ade80 100%)',
        'linear-gradient(135deg,#fde68a 0%,#fbbf24 100%)',
      ];
      if (editing) {
        onSaved({ ...editing, ...payload, updatedAt: now }, true);
      } else {
        onSaved({
          id: `t_${Date.now()}`,
          previewBg: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
          previewAccent: CATEGORY_COLOR[form.category],
          htmlSnippet: `<table width="600"><tr><td style="padding:32px"><h1>${form.name}</h1>`,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
          ...payload,
        }, false);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {editing ? 'Edit template' : 'New template'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {editing ? `Editing "${editing.name}"` : 'Fill in the details to create a template'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2.5}>
        <TextField
          label="Template name" placeholder="e.g. Summer Sale Hero"
          value={form.name} onChange={e => set('name', e.target.value)}
          error={Boolean(errors.name)} helperText={errors.name ?? 'Internal name — not visible to recipients'}
          size="small" fullWidth autoFocus />

        <TextField
          label="Default subject line" placeholder="e.g. ☀️ Up to 50% off this weekend"
          value={form.subject} onChange={e => set('subject', e.target.value)}
          error={Boolean(errors.subject)}
          helperText={errors.subject ?? 'Can be overridden when used in a campaign'}
          size="small" fullWidth />

        <FormControl size="small" fullWidth>
          <InputLabel>Category</InputLabel>
          <Select value={form.category} label="Category"
            onChange={e => set('category', e.target.value as TemplateCategory)}>
            {CATEGORIES.map(c => (
              <MenuItem key={c} value={c}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CATEGORY_COLOR[c] }} />
                  {c}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Tags (comma-separated)" placeholder="e.g. sale, seasonal, hero"
          value={form.tags} onChange={e => set('tags', e.target.value)}
          helperText="Helps with filtering and organisation"
          size="small" fullWidth />

        {!editing && (
          <Alert severity="info" sx={{ fontSize: 12 }}>
            After saving, open the template in the HTML editor to add your content.
          </Alert>
        )}
      </Stack>

      <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
        </Button>
      </Box>
    </Drawer>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ template, onConfirm, onCancel }: {
  template: Template | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={Boolean(template)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Delete template?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>"{template?.name}"</strong> will be permanently deleted.
          {(template?.usageCount ?? 0) > 0 && (
            <Box component="span" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
              ⚠️ This template is used in {template?.usageCount} campaign(s). Those campaigns will not be affected, but the template link will be removed.
            </Box>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── TemplatesPage ────────────────────────────────────────────────────────────

export function TemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [templates,    setTemplates]    = useState<Template[]>(INITIAL_TEMPLATES);
  const [viewMode,     setViewMode]     = useState<ViewMode>('grid');
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState<TemplateCategory | 'all'>('all');
  const [sortField,    setSortField]    = useState<SortField>('updatedAt');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editing,      setEditing]      = useState<Template | null>(null);
  const [toDelete,     setToDelete]     = useState<Template | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => sortField === field && prev === 'desc' ? 'asc' : 'desc');
    setSortField(field);
  }, [sortField]);

  // Group by category for the grouped grid view
  const displayed = useMemo(() => {
    let list = [...templates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (catFilter !== 'all') list = list.filter(t => t.category === catFilter);
    list.sort((a, b) => {
      const av = a[sortField] as string | number ?? 0;
      const bv = b[sortField] as string | number ?? 0;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [templates, search, catFilter, sortField, sortDir]);

  // When showing all categories in grid mode, group by category
  const groupedDisplay = useMemo(() => {
    if (catFilter !== 'all' || viewMode !== 'grid') return null;
    const groups: Record<string, Template[]> = {};
    for (const t of displayed) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return Object.entries(groups);
  }, [displayed, catFilter, viewMode]);

  const handleSaved = useCallback((t: Template, isEdit: boolean) => {
    setTemplates(prev => isEdit ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]);
  }, []);

  const handleDuplicate = useCallback(async (t: Template) => {
    try {
      const duped = await apiFetch('POST', `/api/templates/${t.id}/duplicate`) as Template;
      setTemplates(prev => [duped, ...prev]);
    } catch {
      const now = new Date().toISOString();
      setTemplates(prev => [{
        ...t,
        id:        `t_${Date.now()}`,
        name:      `${t.name} (copy)`,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      }, ...prev]);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/templates/${toDelete.id}`); } catch {}
    setTemplates(prev => prev.filter(x => x.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  const handleOpenEditor = useCallback((t: Template) => {
    navigate(`/app/templates/html?id=${t.id}`);
  }, [navigate]);

  const counts = useMemo(() => ({
    total:     templates.length,
    byCategory: Object.fromEntries(
      CATEGORIES.map(c => [c, templates.filter(t => t.category === c).length])
    ),
  }), [templates]);

  const actionProps = (t: Template): ActionProps => ({
    template: t, canEdit,
    onEdit:       () => { setEditing(t); setDrawerOpen(true); },
    onDuplicate:  handleDuplicate,
    onDelete:     setToDelete,
    onOpenEditor: handleOpenEditor,
  });

  const renderGrid = (items: Template[]) => (
    <Box sx={{ display: 'grid', gap: 2, alignItems: 'start',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' } }}>
      {items.map(t => <TemplateCard key={t.id} {...actionProps(t)} />)}
    </Box>
  );

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            HTML email templates and designs for your campaigns.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />}
            sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setDrawerOpen(true); }}>
            New template
          </Button>
        )}
      </Box>

      {/* Summary chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`Total: ${counts.total}`} size="small" variant="filled"
          sx={{ fontWeight: 600, fontSize: 12 }} />
        {CATEGORIES.filter(c => (counts.byCategory[c] ?? 0) > 0).map(c => (
          <Chip key={c} label={`${c}: ${counts.byCategory[c]}`} size="small" variant="outlined"
            sx={{
              fontSize: 12, fontWeight: 600,
              color: CATEGORY_COLOR[c],
              borderColor: CATEGORY_COLOR[c] + '60',
            }} />
        ))}
      </Stack>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search templates…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment:
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment> }}
          sx={{ minWidth: 220, flex: 1, maxWidth: 340 }} />

        {/* Category filter */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label="All" size="small"
            variant={catFilter === 'all' ? 'filled' : 'outlined'}
            color={catFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setCatFilter('all')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: 11 }} />
          {CATEGORIES.map(c => (
            <Chip key={c} label={c} size="small"
              variant={catFilter === c ? 'filled' : 'outlined'}
              onClick={() => setCatFilter(c)}
              sx={{
                cursor: 'pointer', fontSize: 11,
                ...(catFilter === c ? {
                  bgcolor: CATEGORY_COLOR[c],
                  color: '#fff',
                  '&:hover': { bgcolor: CATEGORY_COLOR[c] },
                } : {
                  color: CATEGORY_COLOR[c],
                  borderColor: CATEGORY_COLOR[c] + '60',
                }),
              }} />
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        <TextField select size="small" value={`${sortField}_${sortDir}`}
          onChange={e => {
            const [f, d] = e.target.value.split('_') as [SortField, SortDir];
            setSortField(f); setSortDir(d);
          }}
          sx={{ minWidth: 175 }} SelectProps={{ native: true }}>
          <option value="updatedAt_desc">Recently updated</option>
          <option value="createdAt_desc">Newest first</option>
          <option value="createdAt_asc">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="usageCount_desc">Most used</option>
        </TextField>

        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
          <ToggleButton value="grid">
            <Tooltip title="Grid view"><ViewModuleIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="table">
            <Tooltip title="Table view"><ViewListIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Empty state */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No templates found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search || catFilter !== 'all'
              ? 'Try adjusting your search or category filter.'
              : 'Create your first template to get started.'}
          </Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setEditing(null); setDrawerOpen(true); }}>
              New template
            </Button>
          )}
        </GlassCard>
      )}

      {/* GRID VIEW — grouped by category when showing all */}
      {viewMode === 'grid' && displayed.length > 0 && (
        groupedDisplay ? (
          <Stack spacing={3}>
            {groupedDisplay.map(([cat, items]) => (
              <Box key={cat}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%',
                    bgcolor: CATEGORY_COLOR[cat as TemplateCategory] }} />
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
                    {cat}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">({items.length})</Typography>
                </Box>
                {renderGrid(items)}
              </Box>
            ))}
          </Stack>
        ) : renderGrid(displayed)
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ pl: 2 }}>Preview</TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}>Template</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'category'} direction={sortField === 'category' ? sortDir : 'asc'}
                      onClick={() => handleSort('category')}>Category</TableSortLabel>
                  </TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'usageCount'} direction={sortField === 'usageCount' ? sortDir : 'asc'}
                      onClick={() => handleSort('usageCount')}>Used in</TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'updatedAt'} direction={sortField === 'updatedAt' ? sortDir : 'asc'}
                      onClick={() => handleSort('updatedAt')}>Last edited</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(t => (
                  <TableRow key={t.id} hover
                    sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ pl: 2, py: 1 }}>
                      <TemplateThumbnail template={t} height={52} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{t.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 220 }}>
                        {t.subject}
                      </Typography>
                    </TableCell>
                    <TableCell><CategoryChip category={t.category} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {t.tags.slice(0, 3).map(tag => (
                          <Chip key={tag} label={tag} size="small" sx={{ fontSize: 10, height: 18 }} />
                        ))}
                        {t.tags.length > 3 && (
                          <Typography variant="caption" color="text.disabled">+{t.tags.length - 3}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500} color={t.usageCount > 0 ? 'text.primary' : 'text.disabled'}>
                        {t.usageCount > 0 ? `${t.usageCount} campaign${t.usageCount > 1 ? 's' : ''}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">{fmtDate(t.updatedAt)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0.5 }}>
                      <TemplateActions {...actionProps(t)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          Showing {displayed.length} of {templates.length} templates
        </Typography>
      )}

      <TemplateDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
      <DeleteDialog
        template={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  );
}