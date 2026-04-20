// src/ui/pages/modules/content/media-library/index.tsx
//
// Media Library — Content module
//
// Asset types: Images (JPG, PNG, GIF, WebP), PDFs, SVGs, Videos
// Features:
//  - Drag-and-drop upload zone + click-to-browse
//  - Grid + list view
//  - Filter by type, search by name
//  - Copy URL to clipboard
//  - Delete (single + bulk)
//  - File size, dimensions (images), duration (video) metadata
//  - Preview modal (image/SVG/video inline; PDF in iframe)
//  - Role-aware (CLIENT_USER = read-only, no upload/delete)

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Snackbar,
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
} from '@mui/material';

import AddIcon           from '@mui/icons-material/Add';
import CheckIcon         from '@mui/icons-material/Check';
import CloseIcon         from '@mui/icons-material/Close';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionIcon   from '@mui/icons-material/Description';
import FileDownloadIcon  from '@mui/icons-material/FileDownload';
import FilterListIcon    from '@mui/icons-material/FilterList';
import ImageIcon         from '@mui/icons-material/Image';
import MoreVertIcon      from '@mui/icons-material/MoreVert';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon  from '@mui/icons-material/PictureAsPdf';
import SearchIcon        from '@mui/icons-material/Search';
import SmartDisplayIcon  from '@mui/icons-material/SmartDisplay';
import UploadFileIcon    from '@mui/icons-material/UploadFile';
import ViewListIcon      from '@mui/icons-material/ViewList';
import ViewModuleIcon    from '@mui/icons-material/ViewModule';

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

type AssetType  = 'image' | 'pdf' | 'svg' | 'video';
type SortField  = 'name' | 'size' | 'type' | 'uploadedAt';
type SortDir    = 'asc' | 'desc';
type ViewMode   = 'grid' | 'list';

type Asset = {
  id: string;
  name: string;
  type: AssetType;
  mimeType: string;
  url: string;           // CDN / storage URL
  thumbUrl?: string;     // thumbnail (images/video)
  size: number;          // bytes
  width?: number;        // px (images/SVG)
  height?: number;       // px (images/SVG)
  duration?: number;     // seconds (video)
  uploadedAt: string;
  uploadedBy: string;
};

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AssetType, {
  label: string;
  color: string;
  icon: React.ReactNode;
  accept: string;
}> = {
  image: { label: 'Image', color: '#6366f1', icon: <ImageIcon />,        accept: '.jpg,.jpeg,.png,.gif,.webp' },
  pdf:   { label: 'PDF',   color: '#ef4444', icon: <PictureAsPdfIcon />, accept: '.pdf' },
  svg:   { label: 'SVG',   color: '#f59e0b', icon: <DescriptionIcon />,  accept: '.svg' },
  video: { label: 'Video', color: '#8b5cf6', icon: <SmartDisplayIcon />, accept: '.mp4,.webm,.mov' },
};

const ALL_TYPES: AssetType[] = ['image', 'pdf', 'svg', 'video'];
const ACCEPT_ALL = ALL_TYPES.map(t => TYPE_CONFIG[t].accept).join(',');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function guessType(name: string): AssetType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
  if (ext === 'pdf')                                    return 'pdf';
  if (ext === 'svg')                                    return 'svg';
  return 'video';
}

// ─── Seed assets ──────────────────────────────────────────────────────────────

const PLACEHOLDER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#0ea5e9'];

// We generate placeholder gradient thumbnails since we don't have real files
function placeholderThumb(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const c1 = PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
  const c2 = PLACEHOLDER_COLORS[Math.abs(h + 3) % PLACEHOLDER_COLORS.length];
  return `linear-gradient(135deg,${c1},${c2})`;
}

const INITIAL_ASSETS: Asset[] = [
  { id:'m_01', name:'hero-summer-sale.jpg', type:'image', mimeType:'image/jpeg', url:'https://example.com/media/hero-summer-sale.jpg', thumbUrl: undefined, size:284_201, width:1200, height:630, uploadedAt:'2025-07-01T09:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_02', name:'logo-dark.png',        type:'image', mimeType:'image/png',  url:'https://example.com/media/logo-dark.png',         thumbUrl: undefined, size:18_432, width:400, height:120,  uploadedAt:'2025-06-10T11:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_03', name:'product-showcase.gif', type:'image', mimeType:'image/gif',  url:'https://example.com/media/product-showcase.gif',  thumbUrl: undefined, size:1_420_800, width:600, height:400, uploadedAt:'2025-07-05T14:00:00Z', uploadedBy:'Bob Fletcher' },
  { id:'m_04', name:'banner-webp.webp',     type:'image', mimeType:'image/webp', url:'https://example.com/media/banner-webp.webp',      thumbUrl: undefined, size:62_340, width:1200, height:400, uploadedAt:'2025-07-08T10:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_05', name:'terms-of-service.pdf', type:'pdf',   mimeType:'application/pdf', url:'https://example.com/media/terms-of-service.pdf', size:348_120, uploadedAt:'2025-04-01T09:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_06', name:'product-brochure.pdf', type:'pdf',   mimeType:'application/pdf', url:'https://example.com/media/product-brochure.pdf', size:1_204_800, uploadedAt:'2025-05-15T11:00:00Z', uploadedBy:'Kate Russo' },
  { id:'m_07', name:'icon-set.svg',         type:'svg',   mimeType:'image/svg+xml', url:'https://example.com/media/icon-set.svg', size:8_192, width:24, height:24, uploadedAt:'2025-06-20T12:00:00Z', uploadedBy:'Bob Fletcher' },
  { id:'m_08', name:'logo-mark.svg',        type:'svg',   mimeType:'image/svg+xml', url:'https://example.com/media/logo-mark.svg', size:4_096, width:64, height:64, uploadedAt:'2025-06-20T12:05:00Z', uploadedBy:'Bob Fletcher' },
  { id:'m_09', name:'product-demo.mp4',     type:'video', mimeType:'video/mp4', url:'https://example.com/media/product-demo.mp4', size:18_432_000, duration:94,  uploadedAt:'2025-07-10T15:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_10', name:'explainer.webm',       type:'video', mimeType:'video/webm', url:'https://example.com/media/explainer.webm', size:9_216_000, duration:62, uploadedAt:'2025-07-11T09:00:00Z', uploadedBy:'Henry Silva' },
  { id:'m_11', name:'cta-banner.png',       type:'image', mimeType:'image/png', url:'https://example.com/media/cta-banner.png', thumbUrl: undefined, size:94_320, width:600, height:200, uploadedAt:'2025-07-12T13:00:00Z', uploadedBy:'Alice Morgan' },
  { id:'m_12', name:'avatar-placeholder.png', type:'image', mimeType:'image/png', url:'https://example.com/media/avatar-placeholder.png', size:12_288, width:200, height:200, uploadedAt:'2025-03-10T08:00:00Z', uploadedBy:'Iris Tanaka' },
];

// ─── Asset thumbnail ──────────────────────────────────────────────────────────

function AssetThumb({ asset, size = 80 }: { asset: Asset; size?: number }) {
  const bg = placeholderThumb(asset.id);
  const icon = TYPE_CONFIG[asset.type].icon;

  return (
    <Box sx={{
      width: size, height: size, borderRadius: 1.5,
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{ color: 'rgba(255,255,255,0.85)', '& svg': { fontSize: size * 0.35 } }}>
        {icon}
      </Box>
      {asset.type === 'video' && asset.duration && (
        <Box sx={{
          position: 'absolute', bottom: 4, right: 4,
          bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 0.5,
          px: 0.5, py: 0.1,
        }}>
          <Typography variant="caption" sx={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>
            {fmtDuration(asset.duration)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

type ActionProps = {
  asset: Asset;
  canEdit: boolean;
  onDelete:  (a: Asset) => void;
  onPreview: (a: Asset) => void;
  onCopy:    (a: Asset) => void;
};

function AssetActions({ asset, canEdit, onDelete, onPreview, onCopy }: ActionProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 175, boxShadow: 4 } }}>
        <MenuItem dense onClick={() => { onPreview(asset); setAnchor(null); }}>
          <OpenInNewIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Preview
        </MenuItem>
        <MenuItem dense onClick={() => { onCopy(asset); setAnchor(null); }}>
          <ContentCopyIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Copy URL
        </MenuItem>
        <MenuItem dense component="a" href={asset.url} download target="_blank">
          <FileDownloadIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Download
        </MenuItem>
        {canEdit && (
          <>
            <Divider />
            <MenuItem dense sx={{ color: 'error.main' }}
              onClick={() => { onDelete(asset); setAnchor(null); }}>
              <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

// ─── Preview dialog ───────────────────────────────────────────────────────────

function PreviewDialog({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  if (!asset) return null;
  const bg = placeholderThumb(asset.id);

  return (
    <Dialog open={Boolean(asset)} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>{asset.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {asset.mimeType} · {fmtSize(asset.size)}
            {asset.width && ` · ${asset.width}×${asset.height}px`}
            {asset.duration && ` · ${fmtDuration(asset.duration)}`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: '#0f172a', minHeight: 320,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(asset.type === 'image' || asset.type === 'svg') && (
          // Placeholder gradient since we don't have real files in this demo
          <Box sx={{
            width: '100%', minHeight: 320, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <ImageIcon sx={{ fontSize: 64, mb: 1, opacity: 0.6 }} />
              <Typography variant="body2">Image preview — {asset.name}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {asset.width}×{asset.height}px · {fmtSize(asset.size)}
              </Typography>
            </Box>
          </Box>
        )}
        {asset.type === 'pdf' && (
          <Box sx={{
            width: '100%', minHeight: 420, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <PictureAsPdfIcon sx={{ fontSize: 64, mb: 1, opacity: 0.6 }} />
              <Typography variant="body2">{asset.name}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">{fmtSize(asset.size)}</Typography>
            </Box>
          </Box>
        )}
        {asset.type === 'video' && (
          <Box sx={{
            width: '100%', minHeight: 360, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <SmartDisplayIcon sx={{ fontSize: 64, mb: 1, opacity: 0.6 }} />
              <Typography variant="body2">{asset.name}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {fmtDuration(asset.duration ?? 0)} · {fmtSize(asset.size)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />}
          onClick={() => { navigator.clipboard.writeText(asset.url); }}>
          Copy URL
        </Button>
        <Button size="small" variant="outlined" component="a" href={asset.url} download target="_blank"
          startIcon={<FileDownloadIcon />}>
          Download
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="contained" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ assets, onConfirm, onCancel }: {
  assets: Asset[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={assets.length > 0} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>
        Delete {assets.length > 1 ? `${assets.length} assets` : 'asset'}?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {assets.length === 1
            ? <><strong>{assets[0]?.name}</strong> will be permanently deleted.</>
            : <><strong>{assets.length} assets</strong> will be permanently deleted.</>
          }{' '}Any templates or campaigns using these URLs may break.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

type UploadingFile = { name: string; progress: number; done: boolean; error?: boolean };

function UploadZone({ canEdit, onUploaded }: {
  canEdit: boolean;
  onUploaded: (asset: Asset) => void;
}) {
  const [dragging,    setDragging]    = useState(false);
  const [uploading,   setUploading]   = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    if (!canEdit || !files.length) return;
    const queue: UploadingFile[] = files.map(f => ({ name: f.name, progress: 0, done: false }));
    setUploading(queue);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Simulate upload progress
      for (let p = 0; p <= 100; p += 25) {
        await new Promise(r => setTimeout(r, 80));
        setUploading(prev => prev.map((u, idx) => idx === i ? { ...u, progress: p } : u));
      }
      const now = new Date().toISOString();
      const fakeAsset: Asset = {
        id:         `m_${Date.now()}_${i}`,
        name:       file.name,
        type:       guessType(file.name),
        mimeType:   file.type,
        url:        URL.createObjectURL(file),
        size:       file.size,
        uploadedAt: now,
        uploadedBy: 'You',
      };
      setUploading(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 100, done: true } : u));
      onUploaded(fakeAsset);
    }
    setTimeout(() => setUploading([]), 1200);
  }, [canEdit, onUploaded]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  if (!canEdit) return null;

  return (
    <Box>
      <Box
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
          bgcolor: dragging ? 'primary.50' : 'action.hover',
          transition: 'all 0.15s',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
        }}>
        <UploadFileIcon sx={{ fontSize: 36, color: dragging ? 'primary.main' : 'text.disabled', mb: 1 }} />
        <Typography variant="body2" fontWeight={600}>
          {dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Images (JPG, PNG, GIF, WebP), PDFs, SVGs, Videos (MP4, WebM) · Max 50 MB per file
        </Typography>
        <input ref={inputRef} type="file" accept={ACCEPT_ALL} multiple hidden
          onChange={e => processFiles(Array.from(e.target.files ?? []))} />
      </Box>

      {uploading.length > 0 && (
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          {uploading.map((u, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" noWrap sx={{ flex: 1, maxWidth: 200 }}>{u.name}</Typography>
              <LinearProgress variant="determinate" value={u.progress}
                sx={{ flex: 1, height: 4, borderRadius: 1 }} />
              {u.done && <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ─── MediaLibraryPage ─────────────────────────────────────────────────────────

export function MediaLibraryPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [assets,      setAssets]      = useState<Asset[]>(INITIAL_ASSETS);
  const [viewMode,    setViewMode]    = useState<ViewMode>('grid');
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState<AssetType | 'all'>('all');
  const [sortField,   setSortField]   = useState<SortField>('uploadedAt');
  const [sortDir,     setSortDir]     = useState<SortDir>('desc');
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [toDelete,    setToDelete]    = useState<Asset[]>([]);
  const [previewing,  setPreviewing]  = useState<Asset | null>(null);
  const [snack,       setSnack]       = useState<string | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => sortField === field && prev === 'desc' ? 'asc' : 'desc');
    setSortField(field);
  }, [sortField]);

  const displayed = useMemo(() => {
    let list = [...assets];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') list = list.filter(a => a.type === typeFilter);
    list.sort((a, b) => {
      const av = sortField === 'size' ? a.size : (a[sortField] as string) ?? '';
      const bv = sortField === 'size' ? b.size : (b[sortField] as string) ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [assets, search, typeFilter, sortField, sortDir]);

  const allSelected   = displayed.length > 0 && displayed.every(a => selected.has(a.id));
  const someSelected  = displayed.some(a => selected.has(a.id)) && !allSelected;
  const selectedCount = displayed.filter(a => selected.has(a.id)).length;

  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); displayed.forEach(a => s.delete(a.id)); return s; });
    else             setSelected(prev => { const s = new Set(prev); displayed.forEach(a => s.add(a.id));    return s; });
  };
  const toggleOne = (id: string) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const handleUploaded = useCallback((asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
  }, []);

  const handleDelete = useCallback(async () => {
    for (const a of toDelete) {
      try { await apiFetch('DELETE', `/api/media/${a.id}`); } catch {}
    }
    const ids = new Set(toDelete.map(a => a.id));
    setAssets(prev => prev.filter(a => !ids.has(a.id)));
    setSelected(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
    setToDelete([]);
  }, [toDelete]);

  const handleCopyUrl = useCallback((asset: Asset) => {
    navigator.clipboard.writeText(asset.url).then(() => {
      setSnack(`Copied URL for "${asset.name}"`);
    });
  }, []);

  const counts = useMemo(() => ({
    total:  assets.length,
    image:  assets.filter(a => a.type === 'image').length,
    pdf:    assets.filter(a => a.type === 'pdf').length,
    svg:    assets.filter(a => a.type === 'svg').length,
    video:  assets.filter(a => a.type === 'video').length,
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
  }), [assets]);

  const actionProps = (a: Asset): ActionProps => ({
    asset: a, canEdit,
    onDelete:  (x) => setToDelete([x]),
    onPreview: setPreviewing,
    onCopy:    handleCopyUrl,
  });

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Media library</Typography>
          <Typography variant="body2" color="text.secondary">
            Centralised assets for templates and campaigns. {fmtSize(counts.totalSize)} used.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />}
            sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => document.getElementById('media-file-input')?.click()}>
            Upload
          </Button>
        )}
      </Box>

      {/* Upload zone */}
      <UploadZone canEdit={canEdit} onUploaded={handleUploaded} />

      {/* Summary chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`Total: ${counts.total}`} size="small" variant="filled"
          sx={{ fontWeight: 600, fontSize: 12 }} />
        {ALL_TYPES.map(t => counts[t] > 0 && (
          <Chip key={t} label={`${TYPE_CONFIG[t].label}: ${counts[t]}`} size="small" variant="outlined"
            sx={{ fontSize: 12, fontWeight: 600,
              color: TYPE_CONFIG[t].color,
              borderColor: TYPE_CONFIG[t].color + '60' }} />
        ))}
      </Stack>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by filename…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment:
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment> }}
          sx={{ minWidth: 220, flex: 1, maxWidth: 340 }} />

        {/* Type filter */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label="All" size="small"
            variant={typeFilter === 'all' ? 'filled' : 'outlined'}
            color={typeFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setTypeFilter('all')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: 11 }} />
          {ALL_TYPES.map(t => (
            <Chip key={t} label={TYPE_CONFIG[t].label} size="small"
              variant={typeFilter === t ? 'filled' : 'outlined'}
              onClick={() => setTypeFilter(t)}
              sx={{
                cursor: 'pointer', fontSize: 11,
                ...(typeFilter === t ? {
                  bgcolor: TYPE_CONFIG[t].color,
                  color: '#fff',
                  '&:hover': { bgcolor: TYPE_CONFIG[t].color },
                } : {
                  color: TYPE_CONFIG[t].color,
                  borderColor: TYPE_CONFIG[t].color + '60',
                }),
              }} />
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Bulk actions */}
        {selectedCount > 0 && canEdit && (
          <>
            <Typography variant="caption" color="primary.main" fontWeight={700}>
              {selectedCount} selected
            </Typography>
            <Button size="small" variant="outlined" color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setToDelete(assets.filter(a => selected.has(a.id)))}>
              Delete selected
            </Button>
          </>
        )}

        {/* Sort */}
        <TextField select size="small" value={`${sortField}_${sortDir}`}
          onChange={e => {
            const [f, d] = e.target.value.split('_') as [SortField, SortDir];
            setSortField(f); setSortDir(d);
          }}
          sx={{ minWidth: 175 }} SelectProps={{ native: true }}>
          <option value="uploadedAt_desc">Newest first</option>
          <option value="uploadedAt_asc">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="size_desc">Largest first</option>
          <option value="size_asc">Smallest first</option>
          <option value="type_asc">Type</option>
        </TextField>

        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
          <ToggleButton value="grid">
            <Tooltip title="Grid view"><ViewModuleIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="list">
            <Tooltip title="List view"><ViewListIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Empty state */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No assets found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search || typeFilter !== 'all'
              ? 'Try adjusting your search or type filter.'
              : 'Upload your first file to get started.'}
          </Typography>
        </GlassCard>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && displayed.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, alignItems: 'start',
          gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)', lg: 'repeat(5,1fr)', xl: 'repeat(6,1fr)' } }}>
          {displayed.map(a => (
            <GlassCard key={a.id}
              onClick={() => setPreviewing(a)}
              sx={{ cursor: 'pointer', overflow: 'hidden',
                outline: selected.has(a.id) ? '2px solid' : 'none',
                outlineColor: 'primary.main',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                transition: 'all 0.15s',
              }}>
              <Box sx={{ position: 'relative' }}>
                <AssetThumb asset={a} size={120} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 1.5,
                  background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55))'
                }} />
                {canEdit && (
                  <Checkbox size="small"
                    checked={selected.has(a.id)}
                    onClick={e => { e.stopPropagation(); toggleOne(a.id); }}
                    sx={{ position: 'absolute', top: 2, left: 2,
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-checked': { color: '#fff' },
                      p: 0.5,
                    }} />
                )}
                <Chip label={TYPE_CONFIG[a.type].label} size="small"
                  sx={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: 9, height: 16, fontWeight: 700,
                    bgcolor: TYPE_CONFIG[a.type].color + 'cc',
                    color: '#fff',
                  }} />
              </Box>
              <Box sx={{ p: 1.5 }}>
                <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block' }}>
                  {a.name}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                  {fmtSize(a.size)}
                  {a.width && ` · ${a.width}×${a.height}`}
                  {a.duration && ` · ${fmtDuration(a.duration)}`}
                </Typography>
              </Box>
            </GlassCard>
          ))}
        </Box>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  {canEdit && (
                    <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                      <Checkbox size="small" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                    </TableCell>
                  )}
                  <TableCell sx={{ pl: 2 }}>Preview</TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}>Name</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortDir : 'asc'}
                      onClick={() => handleSort('type')}>Type</TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Dimensions</TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'size'} direction={sortField === 'size' ? sortDir : 'asc'}
                      onClick={() => handleSort('size')}>Size</TableSortLabel>
                  </TableCell>
                  <TableCell>Uploaded by</TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortField === 'uploadedAt'} direction={sortField === 'uploadedAt' ? sortDir : 'asc'}
                      onClick={() => handleSort('uploadedAt')}>Uploaded</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(a => (
                  <TableRow key={a.id} hover selected={selected.has(a.id)}
                    sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}
                    onClick={() => setPreviewing(a)}>
                    {canEdit && (
                      <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                        <Checkbox size="small" checked={selected.has(a.id)}
                          onChange={() => toggleOne(a.id)} onClick={e => e.stopPropagation()} />
                      </TableCell>
                    )}
                    <TableCell sx={{ pl: 2, py: 1 }}>
                      <AssetThumb asset={a} size={44} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{a.name}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                        {a.mimeType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={TYPE_CONFIG[a.type].label} size="small"
                        sx={{ fontSize: 10, height: 18, fontWeight: 600,
                          bgcolor: TYPE_CONFIG[a.type].color + '18',
                          color: TYPE_CONFIG[a.type].color,
                          border: `1px solid ${TYPE_CONFIG[a.type].color}40`,
                        }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {a.width ? `${a.width}×${a.height}px` : a.duration ? fmtDuration(a.duration) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>{fmtSize(a.size)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{a.uploadedBy}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">{fmtDate(a.uploadedAt)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0.5 }}>
                      <AssetActions {...actionProps(a)} />
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
          Showing {displayed.length} of {assets.length} assets
        </Typography>
      )}

      <PreviewDialog asset={previewing} onClose={() => setPreviewing(null)} />
      <DeleteDialog
        assets={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete([])}
      />
      <Snackbar
        open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}