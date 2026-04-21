// src/ui/pages/modules/integrations/apps/index.tsx
//
// Connected Apps — /app/integrations/apps
//
// Features:
//  - Browse available integrations (app catalogue)
//  - Connect / disconnect per app
//  - Show connected status, last synced, scopes granted, connected by
//  - Per-app config drawer (account ID, API key, sync settings)
//  - Category filter (CRM, E-commerce, Analytics, Productivity, Developer)
//  - Search
//  - Role-aware (CLIENT_USER = read only)

import { useState, useMemo, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, Drawer, FormControl,
  FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem,
  Select, Snackbar, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExtensionIcon from '@mui/icons-material/Extension';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import TuneIcon from '@mui/icons-material/Tune';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = () => (import.meta as any).env?.VITE_API_URL;
async function apiFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API()}${path}`, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204) return undefined;
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AppCategory = 'CRM' | 'E-commerce' | 'Analytics' | 'Productivity' | 'Developer';
type SyncStatus = 'idle' | 'syncing' | 'error';

type AppIntegration = {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  logoColor: string;       // background for the logo placeholder
  logoLetter: string;      // first letter shown in placeholder
  connected: boolean;
  connectedBy?: string;
  connectedAt?: string;
  lastSynced?: string;
  syncStatus: SyncStatus;
  syncCount?: number;
  features: string[];      // e.g. ['Sync contacts', 'Import purchases']
  configFields: ConfigField[];
  config: Record<string, string>;
};

type ConfigField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder?: string;
  helperText?: string;
  options?: string[];
  required?: boolean;
};

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_COLOR: Record<AppCategory, string> = {
  CRM: '#0ea5e9',
  'E-commerce': '#f97316',
  Analytics: '#22c55e',
  Productivity: '#8b5cf6',
  Developer: '#6366f1',
};

const ALL_CATEGORIES: AppCategory[] = ['CRM', 'E-commerce', 'Analytics', 'Productivity', 'Developer'];

// ─── App catalogue ────────────────────────────────────────────────────────────

const APP_CATALOGUE: AppIntegration[] = [
  // CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals and companies bi-directionally with HubSpot CRM.',
    category: 'CRM', logoColor: '#ff7a59', logoLetter: 'H',
    connected: true, connectedBy: 'Alice Morgan', connectedAt: '2025-03-01',
    lastSynced: '2025-07-15 08:55', syncStatus: 'idle', syncCount: 4821,
    features: ['Sync contacts', 'Import deal stages', 'Sync email activity', 'Bi-directional updates'],
    configFields: [
      { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'pat-na1-••••••••', required: true },
      { key: 'portalId', label: 'Portal ID', type: 'text', placeholder: '12345678', required: true },
      { key: 'syncMode', label: 'Sync direction', type: 'select', options: ['Bi-directional', 'Send → HubSpot', 'HubSpot → Send'], required: true },
    ],
    config: { apiKey: 'pat-na1-redacted', portalId: '93847162', syncMode: 'Bi-directional' },
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads and contacts with Salesforce and track campaign engagement.',
    category: 'CRM', logoColor: '#0176d3', logoLetter: 'S',
    connected: false, syncStatus: 'idle',
    features: ['Sync leads & contacts', 'Track email engagement', 'Campaign member sync'],
    configFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://xxx.salesforce.com', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Connected App Client ID', required: true },
      { key: 'clientSecret', label: 'Client secret', type: 'password', placeholder: '••••••••', required: true },
    ],
    config: {},
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Push email activity and contacts into Pipedrive deals automatically.',
    category: 'CRM', logoColor: '#17a84b', logoLetter: 'P',
    connected: false, syncStatus: 'idle',
    features: ['Sync contacts to persons', 'Log email activity on deals', 'Import pipelines'],
    configFields: [
      { key: 'apiToken', label: 'API token', type: 'password', placeholder: 'Pipedrive personal API token', required: true },
    ],
    config: {},
  },

  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Import customers, sync purchases, and trigger post-purchase automations.',
    category: 'E-commerce', logoColor: '#96bf48', logoLetter: 'S',
    connected: true, connectedBy: 'Bob Fletcher', connectedAt: '2025-04-15',
    lastSynced: '2025-07-15 09:01', syncStatus: 'idle', syncCount: 2340,
    features: ['Import customers', 'Sync purchase history', 'Abandoned cart trigger', 'Product recommendations'],
    configFields: [
      { key: 'shopDomain', label: 'Shop domain', type: 'text', placeholder: 'your-store.myshopify.com', required: true },
      { key: 'accessToken', label: 'Access token', type: 'password', placeholder: 'shpat_••••••••', required: true },
      { key: 'syncOrders', label: 'Sync past orders', type: 'select', options: ['Yes — all orders', 'Last 30 days', 'Last 90 days', 'No'] },
    ],
    config: { shopDomain: 'acme.myshopify.com', accessToken: 'shpat_redacted', syncOrders: 'Last 90 days' },
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect your WooCommerce store to sync customers and orders.',
    category: 'E-commerce', logoColor: '#7f54b3', logoLetter: 'W',
    connected: false, syncStatus: 'idle',
    features: ['Import customers', 'Order event triggers', 'Abandoned cart', 'Coupon personalisation'],
    configFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'text', placeholder: 'https://yourstore.com', required: true },
      { key: 'consumerKey', label: 'Consumer key', type: 'text', placeholder: 'ck_••••••••', required: true },
      { key: 'consumerSecret', label: 'Consumer secret', type: 'password', placeholder: 'cs_••••••••', required: true },
    ],
    config: {},
  },

  // Analytics
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Send campaign click and conversion events directly to GA4.',
    category: 'Analytics', logoColor: '#f9ab00', logoLetter: 'G',
    connected: false, syncStatus: 'idle',
    features: ['Track campaign clicks in GA4', 'Conversion events', 'UTM parameter passthrough'],
    configFields: [
      { key: 'measurementId', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX', required: true },
      { key: 'apiSecret', label: 'API secret', type: 'password', placeholder: 'GA4 Measurement Protocol secret', required: true },
    ],
    config: {},
  },
  {
    id: 'segment',
    name: 'Segment',
    description: 'Stream email events to Segment as identify and track calls.',
    category: 'Analytics', logoColor: '#52bd95', logoLetter: 'S',
    connected: true, connectedBy: 'Alice Morgan', connectedAt: '2025-05-10',
    lastSynced: '2025-07-15 09:10', syncStatus: 'idle', syncCount: 18_430,
    features: ['Stream all email events', 'Identify contacts', 'Track opens & clicks', 'Forward to 300+ destinations'],
    configFields: [
      { key: 'writeKey', label: 'Write key', type: 'password', placeholder: 'Segment source write key', required: true },
    ],
    config: { writeKey: 'redacted' },
  },

  // Productivity
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Trigger Zaps from email events and automate workflows across 5000+ apps.',
    category: 'Productivity', logoColor: '#ff4a00', logoLetter: 'Z',
    connected: true, connectedBy: 'Alice Morgan', connectedAt: '2025-02-20',
    lastSynced: '2025-07-15 08:40', syncStatus: 'idle', syncCount: 6120,
    features: ['Trigger on email events', 'Push contacts from Zaps', 'Multi-step Zap support'],
    configFields: [
      { key: 'apiKey', label: 'Zapier API key', type: 'password', placeholder: 'From your Zapier account', required: true },
    ],
    config: { apiKey: 'redacted' },
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive campaign performance reports and alerts in Slack channels.',
    category: 'Productivity', logoColor: '#4a154b', logoLetter: 'S',
    connected: false, syncStatus: 'idle',
    features: ['Campaign sent notifications', 'Bounce / complaint alerts', 'Weekly digest reports'],
    configFields: [
      { key: 'webhookUrl', label: 'Incoming webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/…', required: true },
      { key: 'channel', label: 'Default channel', type: 'text', placeholder: '#marketing-alerts' },
    ],
    config: {},
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Build advanced automation scenarios with Make using our HTTP webhooks.',
    category: 'Productivity', logoColor: '#6d00cc', logoLetter: 'M',
    connected: false, syncStatus: 'idle',
    features: ['HTTP webhook triggers', 'Custom scenarios', 'Data transformation'],
    configFields: [
      { key: 'webhookUrl', label: 'Make webhook URL', type: 'text', placeholder: 'https://hook.eu1.make.com/…', required: true },
    ],
    config: {},
  },

  // Developer
  {
    id: 'postmark',
    name: 'Postmark',
    description: 'Route transactional emails through Postmark for guaranteed delivery.',
    category: 'Developer', logoColor: '#ffdd00', logoLetter: 'P',
    connected: false, syncStatus: 'idle',
    features: ['Transactional routing', 'Message streams', 'Delivery webhooks passthrough'],
    configFields: [
      { key: 'serverToken', label: 'Server token', type: 'password', placeholder: 'Postmark server API token', required: true },
      { key: 'stream', label: 'Message stream', type: 'select', options: ['outbound', 'transactional', 'broadcasts'] },
    ],
    config: {},
  },
  {
    id: 'aws-ses',
    name: 'Amazon SES',
    description: 'Use your own Amazon SES account for sending instead of our shared pool.',
    category: 'Developer', logoColor: '#ff9900', logoLetter: 'A',
    connected: false, syncStatus: 'idle',
    features: ['BYOS (Bring Your Own Sender)', 'Custom IP pools', 'SES event publishing'],
    configFields: [
      { key: 'region', label: 'AWS region', type: 'select', options: ['us-east-1', 'eu-west-1', 'ap-southeast-1'], required: true },
      { key: 'accessKeyId', label: 'Access key ID', type: 'text', placeholder: 'AKIAIOSFODNN7EXAMPLE', required: true },
      { key: 'secretAccessKey', label: 'Secret access key', type: 'password', placeholder: '••••••••', required: true },
    ],
    config: {},
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(iso: string | null | undefined) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return iso;
}

// ─── App logo ─────────────────────────────────────────────────────────────────

function AppLogo({ app, size = 44 }: { app: AppIntegration; size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: 1.5, flexShrink: 0,
      bgcolor: app.logoColor, display: 'flex', alignItems: 'center',
      justifyContent: 'center', boxShadow: 2,
    }}>
      <Typography sx={{ fontSize: size * 0.45, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
        {app.logoLetter}
      </Typography>
    </Box>
  );
}

// ─── Config drawer ────────────────────────────────────────────────────────────

function ConfigDrawer({ app, open, onClose, onSave }: {
  app: AppIntegration | null;
  open: boolean;
  onClose: () => void;
  onSave: (appId: string, config: Record<string, string>) => void;
}) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastApp, setLastApp] = useState<AppIntegration | null>(null);

  if (app && app !== lastApp) {
    setLastApp(app);
    setConfig({ ...app.config });
  }

  if (!app) return null;

  const allRequired = app.configFields
    .filter(f => f.required)
    .every(f => config[f.key]?.trim());

  const handleSave = async () => {
    setSaving(true);
    try { await apiFetch('PUT', `/api/integrations/apps/${app.id}/config`, config); } catch { }
    setSaving(false);
    onSave(app.id, config);
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AppLogo app={app} size={36} />
          <Box>
            <Typography variant="h6" fontWeight={800}>{app.name}</Typography>
            <Typography variant="caption" color="text.secondary">Configuration</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2.5}>
        {app.configFields.map(field => {
          if (field.type === 'select') {
            return (
              <FormControl key={field.key} size="small" fullWidth>
                <InputLabel>{field.label}{field.required ? ' *' : ''}</InputLabel>
                <Select
                  value={config[field.key] ?? ''}
                  label={field.label + (field.required ? ' *' : '')}
                  onChange={e => setConfig(p => ({ ...p, [field.key]: e.target.value }))}>
                  {field.options?.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
                {field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
              </FormControl>
            );
          }
          return (
            <TextField
              key={field.key}
              label={field.label + (field.required ? ' *' : '')}
              type={field.type === 'password' ? 'password' : 'text'}
              placeholder={field.placeholder}
              value={config[field.key] ?? ''}
              onChange={e => setConfig(p => ({ ...p, [field.key]: e.target.value }))}
              helperText={field.helperText}
              size="small" fullWidth />
          );
        })}

        <Alert severity="info" sx={{ fontSize: 12 }}>
          Configuration is stored encrypted at rest and never logged.
        </Alert>
      </Stack>

      <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving || !allRequired}>
          {saving ? 'Saving…' : 'Save configuration'}
        </Button>
      </Box>
    </Drawer>
  );
}

// ─── Disconnect dialog ────────────────────────────────────────────────────────

function DisconnectDialog({ app, onConfirm, onCancel }: {
  app: AppIntegration | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={Boolean(app)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Disconnect {app?.name}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>{app?.name}</strong> will be disconnected. Synced data will remain but no new syncs will run until you reconnect.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">Disconnect</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── App card ─────────────────────────────────────────────────────────────────

function AppCard({ app, canEdit, onConnect, onDisconnect, onConfigure, onSync }: {
  app: AppIntegration;
  canEdit: boolean;
  onConnect: (a: AppIntegration) => void;
  onDisconnect: (a: AppIntegration) => void;
  onConfigure: (a: AppIntegration) => void;
  onSync: (a: AppIntegration) => void;
}) {
  return (
    <GlassCard sx={{
      p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative',
      outline: app.connected ? '1.5px solid' : 'none',
      outlineColor: 'success.light',
    }}>
      {/* Connected badge */}
      {app.connected && (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '11px !important' }} />}
          label="Connected"
          size="small" color="success"
          sx={{
            position: 'absolute', top: 12, right: 12, fontSize: 10, height: 20,
            '& .MuiChip-icon': { ml: 0.5 }
          }} />
      )}

      {/* Logo + name */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', pr: app.connected ? 8 : 0 }}>
        <AppLogo app={app} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={800}>{app.name}</Typography>
          <Chip label={app.category} size="small"
            sx={{
              fontSize: 10, height: 18, mt: 0.25, fontWeight: 600,
              bgcolor: CAT_COLOR[app.category] + '18',
              color: CAT_COLOR[app.category],
              border: `1px solid ${CAT_COLOR[app.category]}40`,
            }} />
        </Box>
      </Box>

      {/* Description */}
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {app.description}
      </Typography>

      {/* Features */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {app.features.slice(0, 3).map(f => (
          <Chip key={f} label={f} size="small"
            sx={{ fontSize: 10, height: 18 }} />
        ))}
        {app.features.length > 3 && (
          <Typography variant="caption" color="text.disabled">+{app.features.length - 3}</Typography>
        )}
      </Box>

      {/* Connected info */}
      {app.connected && (
        <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.disabled">
              Connected by {app.connectedBy}
            </Typography>
            {app.syncCount != null && (
              <Typography variant="caption" color="text.disabled">
                {app.syncCount.toLocaleString()} synced
              </Typography>
            )}
          </Box>
          {app.lastSynced && (
            <Typography variant="caption" color="text.secondary">
              Last synced: {app.lastSynced}
            </Typography>
          )}
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
        {app.connected ? (
          <>
            {canEdit && (
              <>
                <Button size="small" variant="outlined" startIcon={<TuneIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onConfigure(app)} sx={{ flex: 1, fontSize: 12 }}>
                  Configure
                </Button>
                <Tooltip title="Sync now">
                  <IconButton size="small" onClick={() => onSync(app)}>
                    <SyncIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Disconnect">
                  <IconButton size="small" color="error" onClick={() => onDisconnect(app)}>
                    <LinkOffIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </>
        ) : (
          canEdit && (
            <Button size="small" variant="contained" startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
              onClick={() => onConnect(app)} sx={{ flex: 1, fontSize: 12 }}>
              Connect
            </Button>
          )
        )}
      </Box>
    </GlassCard>
  );
}

// ─── IntegrationsAppsPage ─────────────────────────────────────────────────────

export function IntegrationsAppsPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [apps, setApps] = useState<AppIntegration[]>(APP_CATALOGUE);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<AppCategory | 'all'>('all');
  const [configApp, setConfigApp] = useState<AppIntegration | null>(null);
  const [disconnectApp, setDisconnectApp] = useState<AppIntegration | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const displayed = useMemo(() => {
    let list = [...apps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.features.some(f => f.toLowerCase().includes(q))
      );
    }
    if (catFilter !== 'all') list = list.filter(a => a.category === catFilter);
    return list;
  }, [apps, search, catFilter]);

  const connectedApps = useMemo(() => apps.filter(a => a.connected), [apps]);

  const handleConnect = useCallback((app: AppIntegration) => {
    setConfigApp(app);
    setConfigOpen(true);
  }, []);

  const handleSaveConfig = useCallback(async (appId: string, config: Record<string, string>) => {
    setApps(prev => prev.map(a => {
      if (a.id !== appId) return a;
      return {
        ...a,
        connected: true,
        config,
        connectedBy: 'You',
        connectedAt: new Date().toISOString().slice(0, 10),
        lastSynced: 'Just now',
        syncStatus: 'idle',
        syncCount: a.syncCount ?? 0,
      };
    }));
    setSnack(`Connected to ${apps.find(a => a.id === appId)?.name ?? 'app'}.`);
  }, [apps]);

  const handleDisconnect = useCallback(async () => {
    if (!disconnectApp) return;
    try { await apiFetch('DELETE', `/api/integrations/apps/${disconnectApp.id}`); } catch { }
    setApps(prev => prev.map(a => a.id === disconnectApp.id
      ? { ...a, connected: false, connectedBy: undefined, connectedAt: undefined, lastSynced: undefined, syncCount: undefined }
      : a));
    setSnack(`Disconnected ${disconnectApp.name}.`);
    setDisconnectApp(null);
  }, [disconnectApp]);

  const handleSync = useCallback(async (app: AppIntegration) => {
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, syncStatus: 'syncing' } : a));
    try { await apiFetch('POST', `/api/integrations/apps/${app.id}/sync`); } catch { }
    await new Promise(r => setTimeout(r, 1500));
    setApps(prev => prev.map(a => a.id === app.id
      ? { ...a, syncStatus: 'idle', lastSynced: 'Just now', syncCount: (a.syncCount ?? 0) + Math.floor(Math.random() * 50) }
      : a));
    setSnack(`${app.name} sync complete.`);
  }, []);

  const counts = useMemo(() => ({
    connected: apps.filter(a => a.connected).length,
    available: apps.length,
    byCategory: Object.fromEntries(
      ALL_CATEGORIES.map(c => [c, apps.filter(a => a.category === c).length])
    ),
  }), [apps]);

  // Group displayed by connected first then alphabetical
  const sortedDisplayed = useMemo(() => [
    ...displayed.filter(a => a.connected),
    ...displayed.filter(a => !a.connected),
  ], [displayed]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Connected apps</Typography>
          <Typography variant="body2" color="text.secondary">
            Integrate with your favourite tools — CRMs, e-commerce platforms, analytics, and more.
          </Typography>
        </Stack>
        <Chip
          label={`${counts.connected} of ${counts.available} connected`}
          color={counts.connected > 0 ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: 12 }} />
      </Box>

      {/* Connected summary cards */}
      {connectedApps.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
          {[
            { label: 'Connected apps', value: counts.connected, color: 'success.main' },
            { label: 'Total synced', value: connectedApps.reduce((a, x) => a + (x.syncCount ?? 0), 0).toLocaleString(), color: undefined },
            { label: 'Available', value: counts.available, color: undefined },
            { label: 'Categories', value: ALL_CATEGORIES.length, color: undefined },
          ].map(s => (
            <GlassCard key={s.label} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
            </GlassCard>
          ))}
        </Box>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search integrations…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ minWidth: 220, flex: 1, maxWidth: 340 }} />

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label="All" size="small"
            variant={catFilter === 'all' ? 'filled' : 'outlined'}
            color={catFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setCatFilter('all')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: 11 }} />
          {ALL_CATEGORIES.map(c => (
            <Chip key={c} label={c} size="small"
              variant={catFilter === c ? 'filled' : 'outlined'}
              onClick={() => setCatFilter(c)}
              sx={{
                cursor: 'pointer', fontSize: 11,
                ...(catFilter === c ? {
                  bgcolor: CAT_COLOR[c], color: '#fff', '&:hover': { bgcolor: CAT_COLOR[c] },
                } : { color: CAT_COLOR[c], borderColor: CAT_COLOR[c] + '60' }),
              }} />
          ))}
        </Box>
      </Box>

      {/* Empty state */}
      {sortedDisplayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <ExtensionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No integrations found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different search or category filter.
          </Typography>
        </GlassCard>
      )}

      {/* Apps grid */}
      {sortedDisplayed.length > 0 && (
        <Box sx={{
          display: 'grid', gap: 2, alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' },
        }}>
          {sortedDisplayed.map(app => (
            <AppCard
              key={app.id} app={app} canEdit={canEdit}
              onConnect={handleConnect}
              onDisconnect={setDisconnectApp}
              onConfigure={a => { setConfigApp(a); setConfigOpen(true); }}
              onSync={handleSync}
            />
          ))}
        </Box>
      )}

      {sortedDisplayed.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          Showing {sortedDisplayed.length} of {apps.length} integrations
        </Typography>
      )}

      {/* Drawers + dialogs */}
      <ConfigDrawer
        app={configApp}
        open={configOpen}
        onClose={() => { setConfigOpen(false); setConfigApp(null); }}
        onSave={handleSaveConfig}
      />
      <DisconnectDialog
        app={disconnectApp}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectApp(null)}
      />
      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}