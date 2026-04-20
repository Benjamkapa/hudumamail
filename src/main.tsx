import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { router } from './router/router';
import { bulkeTheme } from './theme/theme';
import { AuthProvider } from './state/auth/AuthProvider';
import { CurrencyProvider } from './state/currency/CurrencyContext';

import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={bulkeTheme}>
        <CssBaseline />
        <CurrencyProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </CurrencyProvider>

      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);


