import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../../types/auth';
import { useAuth } from './useAuth';

export function RequireAuth(props: { children: ReactNode; roles?: Role[] }) {
  const auth = useAuth();
  const loc = useLocation();

  if (auth.status === 'loading') return null;
  if (auth.status !== 'authenticated' || !auth.user || !auth.accessToken) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (props.roles && props.roles.length > 0 && !props.roles.includes(auth.user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{props.children}</>;
}

