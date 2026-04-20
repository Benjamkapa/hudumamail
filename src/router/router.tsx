import * as reactRouterDom from 'react-router-dom';

import { AppShell } from '../ui/layout/AppShell';
import { RequireAuth } from '../state/auth/RequireAuth';
import { AccessDeniedPage } from '../ui/pages/AccessDeniedPage';
import { NotFoundPage } from '../ui/pages/NotFoundPage';
import { LoginPage } from '../ui/pages/LoginPage';
import { RegisterPage } from '../ui/pages/RegisterPage';
import { ForgotPasswordPage } from '../ui/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../ui/pages/ResetPasswordPage';
// import { GoogleCallbackPage } from '../ui/pages/GoogleCallbackPage';
import { DashboardPage } from '../ui/pages/modules/dashboard/index';

import { AllCampaignsPage } from '../ui/pages/modules/campaigns/all/index';
import { CampaignDraftsPage } from '../ui/pages/modules/campaigns/drafts/index';
import { CampaignsScheduledPage } from '../ui/pages/modules/campaigns/scheduled/index';
import { CampaignsAbTestsPage } from '../ui/pages/modules/campaigns/ab-tests/index';
import { CampaignAnalyticsPage } from '../ui/pages/modules/campaigns/analytics/index';

import { AutomationFlowsPage } from '../ui/pages/modules/automations/flows/index';
import { AutomationTriggersPage } from '../ui/pages/modules/automations/triggers/index';
import { AutomationReportsPage } from '../ui/pages/modules/automations/reports/index';

import { ContactsPage } from '../ui/pages/modules/audience/contacts/index';
import { SegmentsPage } from '../ui/pages/modules/audience/segments/index';
import { AudienceSuppressionPage } from '../ui/pages/modules/audience/suppression/index';
import { AudienceVerificationPage } from '../ui/pages/modules/audience/verification/index';

import { TemplatesPage } from '../ui/pages/modules/contents/templates/index';
import { HtmlEditorPage } from '../ui/pages/modules/contents/html-editor/index';
import { MediaLibraryPage } from '../ui/pages/modules/contents/media-library/index';

import { SendingDomainsPage } from '../ui/pages/modules/sending/domains/index';
import { SendingWarmingPage } from '../ui/pages/modules/sending/warming/index';
import { SendingReputationPage } from '../ui/pages/modules/sending/reputation/index';
import { SendingWebhooksPage } from '../ui/pages/modules/sending/webhooks/index';

import { IntegrationsApiKeysPage } from '../ui/pages/modules/integrations/api-keys/index';
import { IntegrationsAppsPage } from '../ui/pages/modules/integrations/apps/index';

import { BillingUsagePage } from '../ui/pages/modules/billing/usage/index';
import { BillingInvoicesPage } from '../ui/pages/modules/billing/invoices/index';
import { BillingPlansPage } from '../ui/pages/modules/billing/plans/index';

import { ResellerClientsPage } from '../ui/pages/modules/reseller/clients/index';
import { ResellerUsersPage } from '../ui/pages/modules/reseller/users/index';
import { ResellerUsagePage } from '../ui/pages/modules/reseller/usage/index';
import { ResellerQuotasPage } from '../ui/pages/modules/reseller/quotas/index';

import { AllClientsPage } from '../ui/pages/modules/platform-admin/clients/index';
import { AllUsersPage } from '../ui/pages/modules/platform-admin/users/index';

import { AccountPage } from '../ui/pages/modules/settings/account/index';
import { SettingsTeamPage } from '../ui/pages/modules/settings/team/index';
import { SettingsNotificationsPage } from '../ui/pages/modules/settings/notifications/index';
import { SettingsSecurityPage } from '../ui/pages/modules/settings/security/index';

import { Role, type Role as RoleType } from '../types/auth';


import { lazy } from 'react';

const GlobalDomainsPage = lazy(() => import('../ui/pages/modules/platform-admin/domains'));
const InfraPage         = lazy(() => import('../ui/pages/modules/platform-admin/infrastructure'));
const HealthPage        = lazy(() => import('../ui/pages/modules/platform-admin/health'));

const AuditLogsPage     = lazy(() => import('../ui/pages/modules/platform-admin/logs'));

const ConfigPage        = lazy(() => import('../ui/pages/modules/platform-admin/config'));
const CompliancePage    = lazy(() => import('../ui/pages/modules/platform-admin/compliance'));

import { LandingPage } from '../ui/pages/LandingPage';
import { ApiDocsPage } from '../ui/pages/ApiDocsPage';

export const router = reactRouterDom.createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/docs', element: <ApiDocsPage /> },
  // { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  { path: '/403', element: <AccessDeniedPage /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: '', element: <reactRouterDom.Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      { path: 'campaigns', element: <AllCampaignsPage /> },
      { path: 'campaigns/drafts', element: <CampaignDraftsPage /> },
      { path: 'campaigns/scheduled', element: <CampaignsScheduledPage /> },
      { path: 'campaigns/ab-tests', element: <CampaignsAbTestsPage /> },
      { path: 'analytics', element: <CampaignAnalyticsPage /> },

      { path: 'automations/flows', element: <AutomationFlowsPage /> },
      { path: 'automations/triggers', element: <AutomationTriggersPage /> },
      { path: 'automations/reports', element: <AutomationReportsPage /> },

      { path: 'contacts', element: <ContactsPage /> },
      { path: 'segments', element: <SegmentsPage /> },
      { path: 'audience/suppression', element: <AudienceSuppressionPage /> },
      { path: 'audience/verification', element: <AudienceVerificationPage /> },

      { path: 'templates', element: <TemplatesPage /> },
      { path: 'templates/html', element: <HtmlEditorPage /> },
      { path: 'media', element: <MediaLibraryPage /> },

      {
        path: 'sending/domains',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <SendingDomainsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'sending/warming',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <SendingWarmingPage />
          </RequireAuth>
        ),
      },
      {
        path: 'sending/reputation',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <SendingReputationPage />
          </RequireAuth>
        ),
      },
      {
        path: 'sending/webhooks',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <SendingWebhooksPage />
          </RequireAuth>
        ),
      },

      {
        path: 'integrations/api-keys',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <IntegrationsApiKeysPage />
          </RequireAuth>
        ),
      },
      {
        path: 'integrations/apps',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <IntegrationsAppsPage />
          </RequireAuth>
        ),
      },

      {
        path: 'billing/usage',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <BillingUsagePage />
          </RequireAuth>
        ),
      },
      {
        path: 'billing/invoices',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <BillingInvoicesPage />
          </RequireAuth>
        ),
      },
      {
        path: 'billing/plans',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <BillingPlansPage />
          </RequireAuth>
        ),
      },

      {
        path: 'reseller/clients',
        element: (
          <RequireAuth roles={[Role.CLIENT_ADMIN] as RoleType[]}>
            <ResellerClientsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'reseller/users',
        element: (
          <RequireAuth roles={[Role.CLIENT_ADMIN] as RoleType[]}>
            <ResellerUsersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'reseller/usage',
        element: (
          <RequireAuth roles={[Role.CLIENT_ADMIN] as RoleType[]}>
            <ResellerUsagePage />
          </RequireAuth>
        ),
      },
      {
        path: 'reseller/quotas',
        element: (
          <RequireAuth roles={[Role.CLIENT_ADMIN] as RoleType[]}>
            <ResellerQuotasPage />
          </RequireAuth>
        ),
      },

      {
        path: 'admin/clients',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <AllClientsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <AllUsersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/domains',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <GlobalDomainsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/infrastructure',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <InfraPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/health',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <HealthPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/logs',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <AuditLogsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/config',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <ConfigPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/compliance',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN] as RoleType[]}>
            <CompliancePage />
          </RequireAuth>
        ),
      },

      {
        path: 'settings/account',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: 'settings/team',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN] as RoleType[]}>
            <SettingsTeamPage />
          </RequireAuth>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] as RoleType[]}>
            <SettingsNotificationsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'security/change-password',
        element: (
          <RequireAuth roles={[Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] as RoleType[]}>
            <SettingsSecurityPage />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
