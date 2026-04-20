import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchIcon from '@mui/icons-material/Search';

import { createUser, listUsers } from '../../../../../lib/api/usersApi';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';
import { GlassCard } from '../../../../dashboard/GlassCard';

type InviteRole = 'CLIENT_USER' | 'CLIENT_ADMIN';

export function SettingsTeamPage() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const canInvite = user?.role === Role.CLIENT_ADMIN || user?.role === Role.SUPER_ADMIN;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('CLIENT_USER');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const inviteMutation = useMutation({
    mutationFn: () => createUser(accessToken ?? '', { name: inviteName, email: inviteEmail, role: inviteRole }),
    onSuccess: async (result) => {
      setTempPassword(result.tempPassword ?? null);
      setOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('CLIENT_USER');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const users = usersQuery.data ?? [];

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((member) => (
      !q ||
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const totals = useMemo(() => ({
    active: users.filter((member) => member.status === 'ACTIVE').length,
    pending: users.filter((member) => member.status !== 'ACTIVE').length,
    admins: users.filter((member) => member.role !== 'CLIENT_USER').length,
  }), [users]);

  if (!canInvite) {
    return (
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Team</Typography>
        <GlassCard sx={{ p: 3 }}>
          <Typography color="text.secondary">You do not have permission to manage team members in this workspace.</Typography>
        </GlassCard>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Team</Typography>
          <Typography variant="body2" color="text.secondary">
            Invite teammates, review access levels, and keep your workspace roster current.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<GroupAddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }} onClick={() => setOpen(true)}>
          Invite teammate
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Active members', value: totals.active, color: 'success.main' },
          { label: 'Pending invites', value: totals.pending, color: totals.pending > 0 ? 'warning.main' : 'text.primary' },
          { label: 'Admins', value: totals.admins, color: 'text.primary' },
        ].map((card) => (
          <GlassCard key={card.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{card.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={card.color} sx={{ mt: 0.5 }}>{card.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      {tempPassword && (
        <Alert severity="success" onClose={() => setTempPassword(null)}>
          Temporary password: <strong>{tempPassword}</strong>
        </Alert>
      )}

      {usersQuery.isError && (
        <Alert severity="error">Failed to load team members.</Alert>
      )}

      <TextField
        size="small"
        placeholder="Search by name, email or role..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ maxWidth: 360 }}
      />

      <GlassCard sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell sx={{ pl: 2.5 }}>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Created</TableCell>
                <TableCell align="right">Last login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map((member) => (
                <TableRow key={member.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell sx={{ pl: 2.5 }}>
                    <Typography variant="body2" fontWeight={700}>{member.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={member.role.replace('_', ' ')} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={member.status.toLowerCase()} size="small" color={member.status === 'ACTIVE' ? 'success' : 'warning'} variant="outlined" sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : 'Never'}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {usersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography color="text.secondary" align="center">Loading team members...</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!usersQuery.isLoading && displayed.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography color="text.secondary" align="center">No team members match this search.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={800}>Invite teammate</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full name" value={inviteName} onChange={(event) => setInviteName(event.target.value)} fullWidth />
            <TextField label="Email address" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} fullWidth />
            <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as InviteRole)} fullWidth>
              <MenuItem value="CLIENT_USER">Client user</MenuItem>
              {user?.role === Role.SUPER_ADMIN && <MenuItem value="CLIENT_ADMIN">Client admin</MenuItem>}
            </Select>
            {inviteMutation.isError && <Alert severity="error">Invite failed. Please check the details and try again.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteName || !inviteEmail || inviteMutation.isPending}
          >
            {inviteMutation.isPending ? 'Inviting...' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(tempPassword)} autoHideDuration={5000} onClose={() => setTempPassword(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setTempPassword(null)}>Invite created successfully.</Alert>
      </Snackbar>
    </Stack>
  );
}
