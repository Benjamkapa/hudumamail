import React from 'react';
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../state/auth/useAuth';
import { http } from '../../lib/api/http';

type Domain = {
  id: string;
  domainName: string;
  verified: boolean;
  provider: 'MAILGUN' | 'SENDGRID' | 'SES';
  createdAt?: string;
};

async function listDomains(accessToken: string) {
  const { data } = await http.get<Domain[]>('/domains', { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

async function addDomain(accessToken: string, payload: { domainName: string; provider?: Domain['provider'] }) {
  const { data } = await http.post('/domains', payload, { headers: { Authorization: `Bearer ${accessToken}` } });
  return data as unknown;
}

export function DomainsPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const accessToken = auth.accessToken!;

  const [open, setOpen] = React.useState(false);
  const [domainName, setDomainName] = React.useState('');
  const [provider, setProvider] = React.useState<Domain['provider']>('MAILGUN');

  const domainsQuery = useQuery({
    queryKey: ['domains'],
    queryFn: () => listDomains(accessToken),
  });

  const addMutation = useMutation({
    mutationFn: () => addDomain(accessToken, { domainName, provider }),
    onSuccess: async () => {
      setOpen(false);
      setDomainName('');
      await qc.invalidateQueries({ queryKey: ['domains'] });
    },
  });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Stack spacing={0.2}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Domains
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage sender domains for your tenant.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add domain
        </Button>
      </Stack>

      {domainsQuery.isError && <Alert severity="error">Failed to load domains.</Alert>}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          {(domainsQuery.data ?? []).map((d) => (
            <Stack
              key={d.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              sx={{ p: 1.25, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 700 }}>{d.domainName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Provider: {d.provider}
                </Typography>
              </Stack>
              <Chip
                label={d.verified ? 'Verified' : 'Not verified'}
                color={d.verified ? 'success' : 'default'}
                variant={d.verified ? 'filled' : 'outlined'}
              />
            </Stack>
          ))}
          {domainsQuery.isLoading && <Typography color="text.secondary">Loading…</Typography>}
          {!domainsQuery.isLoading && (domainsQuery.data?.length ?? 0) === 0 && (
            <Typography color="text.secondary">No domains yet.</Typography>
          )}
        </Stack>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add domain</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Domain name" value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="example.com" />
            <TextField select label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as Domain['provider'])}>
              <MenuItem value="MAILGUN">Mailgun</MenuItem>
              <MenuItem value="SENDGRID">SendGrid</MenuItem>
              <MenuItem value="SES">AWS SES</MenuItem>
            </TextField>
            {addMutation.isError && <Alert severity="error">Could not add domain.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => addMutation.mutate()} disabled={!domainName || addMutation.isPending}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

