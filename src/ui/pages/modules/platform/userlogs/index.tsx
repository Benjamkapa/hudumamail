import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { http } from '../../../../../lib/api/http';
import { useAuth } from '../../../../../state/auth/useAuth';

type UserLog = {
  logId: string;
  logName: string;
  deviceIp: string;
  logDetails: string;
  userId: string;
  logStatus: number;
  createdon: string;
  actionUrl?: string | null;
};

async function listUserLogs(accessToken: string) {
  const { data } = await http.get<any[]>('/userlogs', { headers: { Authorization: `Bearer ${accessToken}` } });
  return Array.isArray(data) ? data : [];
}

export function UserLogsPage() {
  const auth = useAuth();
  const accessToken = auth.accessToken!;

  const q = useQuery({
    queryKey: ['userlogs'],
    queryFn: () => listUserLogs(accessToken),
  });

  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          User logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit trail for key actions.
        </Typography>
      </Stack>

      {q.isError && <Alert severity="error">Failed to load logs.</Alert>}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          {(q.data ?? []).map((l) => (
            <Stack
              key={l.logId}
              spacing={0.25}
              sx={{ p: 1.25, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Typography sx={{ fontWeight: 700 }}>{l.logName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(l.createdon).toLocaleString()} • {l.deviceIp}
              </Typography>
              <Typography variant="body2">{l.logDetails}</Typography>
            </Stack>
          ))}
          {q.isLoading && <Typography color="text.secondary">Loading…</Typography>}
          {!q.isLoading && (q.data?.length ?? 0) === 0 && <Typography color="text.secondary">No logs yet.</Typography>}
        </Stack>
      </Paper>
    </Stack>
  );
}

