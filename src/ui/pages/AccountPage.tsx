import {
  Box,
  Stack,
  Typography,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material';

import { useAuth } from '../../state/auth/useAuth';
import { Role } from '../../types/auth';
import { GlassCard } from '../dashboard/GlassCard';

const roleColor: Record<Role, string> = {
  SUPER_ADMIN: '#7c3aed',
  CLIENT_ADMIN: '#0284c7',
  CLIENT_USER: '#16a34a',
};

export function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Typography variant="h4" component="h1" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
        Account
      </Typography>

      <GlassCard>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                fontSize: 32, 
                fontWeight: 700,
                bgcolor: roleColor[user.role]
              }}
            >
              {user.name[0]?.toUpperCase()}
            </Avatar>
            <Stack spacing={1} flex={1}>
              <Typography variant="h5" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>
              <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: 20, mx: 0.5 }} />}>
                <Chip label={user.role} size="small" sx={{ 
                  bgcolor: roleColor[user.role], 
                  color: 'white', 
                  fontWeight: 600,
                  height: 24,
                  fontSize: 12
                }} />
                <Chip label={user.tenantName || 'No tenant'} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Workspace
          </Typography>
          <Typography color="text.secondary">
            Tenant: <strong>{user.tenantName || 'N/A'}</strong>
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Member since: <strong>{new Date(user.createdAt || '').toLocaleDateString()}</strong>
          </Typography>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Permissions
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'text.secondary' }}>
            <li>View campaigns and analytics</li>
            <li>Manage contacts and templates</li>
            <li>{user.role === 'SUPER_ADMIN' ? 'Platform administration' : 'Workspace administration'}</li>
          </ul>
        </CardContent>
      </GlassCard>
    </Stack>
  );
}


