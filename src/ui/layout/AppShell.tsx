// src/ui/layout/AppShell.tsx
// KEY FIX: isActive() uses exact match OR "path + /" prefix.
// This prevents /app/campaigns from matching /app/campaigns/drafts.

import { useState, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Collapse, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Typography, Tooltip, useTheme, useMediaQuery,
} from "@mui/material";

import ChevronLeftIcon         from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon        from "@mui/icons-material/ChevronRight";
import MenuIcon                from "@mui/icons-material/Menu";
import MenuOpenIcon            from "@mui/icons-material/MenuOpen";
import ExpandLessIcon          from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon          from "@mui/icons-material/ExpandMore";
import LogoutIcon              from "@mui/icons-material/Logout";
import DashboardIcon           from "@mui/icons-material/Dashboard";
import LightModeOutlined       from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined        from "@mui/icons-material/DarkModeOutlined";

import CampaignIcon            from "@mui/icons-material/Campaign";
import SendIcon                from "@mui/icons-material/Send";
import DraftsIcon              from "@mui/icons-material/Drafts";
import ScheduleSendIcon        from "@mui/icons-material/ScheduleSend";
import ScienceIcon             from "@mui/icons-material/Science";
import BarChartIcon            from "@mui/icons-material/BarChart";

import AutoAwesomeIcon         from "@mui/icons-material/AutoAwesome";
import AccountTreeIcon         from "@mui/icons-material/AccountTree";
import BoltIcon                from "@mui/icons-material/Bolt";

import GroupsIcon              from "@mui/icons-material/Groups";
import PeopleIcon              from "@mui/icons-material/People";
import FilterListIcon          from "@mui/icons-material/FilterList";
import BlockIcon               from "@mui/icons-material/Block";
import FactCheckIcon           from "@mui/icons-material/FactCheck";

import ArticleIcon             from "@mui/icons-material/Article";
import EmailIcon               from "@mui/icons-material/Email";
import ImageIcon               from "@mui/icons-material/Image";
import CodeIcon                from "@mui/icons-material/Code";

import RouterIcon              from "@mui/icons-material/Router";
import DomainIcon              from "@mui/icons-material/Language";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import VerifiedIcon            from "@mui/icons-material/Verified";
import WebhookIcon             from "@mui/icons-material/Webhook";

import ExtensionIcon           from "@mui/icons-material/Extension";
import VpnKeyIcon              from "@mui/icons-material/VpnKey";
import SyncAltIcon             from "@mui/icons-material/SyncAlt";

import CreditCardIcon          from "@mui/icons-material/CreditCard";
import ReceiptIcon             from "@mui/icons-material/Receipt";
import DataUsageIcon           from "@mui/icons-material/DataUsage";

import StorefrontIcon          from "@mui/icons-material/Storefront";
import BusinessIcon            from "@mui/icons-material/Business";
import PeopleAltIcon           from "@mui/icons-material/PeopleAlt";
import TuneIcon                from "@mui/icons-material/Tune";

import AdminPanelSettingsIcon  from "@mui/icons-material/AdminPanelSettings";
import MonitorHeartIcon        from "@mui/icons-material/MonitorHeart";
import HistoryIcon             from "@mui/icons-material/History";
import StorageIcon             from "@mui/icons-material/Storage";
import PolicyIcon              from "@mui/icons-material/Policy";

import ManageAccountsIcon      from "@mui/icons-material/ManageAccounts";
import SettingsIcon            from "@mui/icons-material/Settings";
import SecurityIcon            from "@mui/icons-material/Security";
import NotificationsIcon       from "@mui/icons-material/Notifications";
import FormatSizeIcon          from "@mui/icons-material/FormatSize";
import AttachMoneyIcon         from "@mui/icons-material/AttachMoney";

import { useAuth }   from "../../state/auth/useAuth";
import type { AuthUser } from "../../types/auth";
import { Role }      from "../../types/auth";

import { useThemeMode } from "../../state/theme/ThemeContext";

const DRAWER_FULL = 268;
const DRAWER_MINI = 64;

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: Role[];
  badge?: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
  items: NavItem[];
};

function isActive(itemPath: string, currentPath: string): boolean {
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

function groupContainsActive(group: NavGroup, currentPath: string): boolean {
  return group.items.some((item) => isActive(item.to, currentPath));
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "campaigns", label: "Campaigns", icon: <CampaignIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER],
    items: [
      { label: "All Campaigns", to: "/app/campaigns",           icon: <SendIcon />,         roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
      { label: "Drafts",        to: "/app/campaigns/drafts",    icon: <DraftsIcon />,       roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Scheduled",     to: "/app/campaigns/scheduled", icon: <ScheduleSendIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
      { label: "A/B Tests",     to: "/app/campaigns/ab-tests",  icon: <ScienceIcon />,      roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN], badge: "Beta" },
      { label: "Analytics",     to: "/app/analytics",           icon: <BarChartIcon />,     roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
    ],
  },
  {
    id: "automations", label: "Automations", icon: <AutoAwesomeIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER],
    items: [
      { label: "Flows",    to: "/app/automations/flows",    icon: <AccountTreeIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Triggers", to: "/app/automations/triggers", icon: <BoltIcon />,        roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Reports",  to: "/app/automations/reports",  icon: <BarChartIcon />,    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
    ],
  },
  {
    id: "audience", label: "Audience", icon: <GroupsIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER],
    items: [
      { label: "Contacts",           to: "/app/contacts",              icon: <PeopleIcon />,     roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
      { label: "Segments",           to: "/app/segments",              icon: <FilterListIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Suppression Lists",  to: "/app/audience/suppression",  icon: <BlockIcon />,      roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Email Verification", to: "/app/audience/verification", icon: <FactCheckIcon />,  roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN], badge: "New" },
    ],
  },
  {
    id: "content", label: "Content", icon: <ArticleIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER],
    items: [
      { label: "Templates",     to: "/app/templates",      icon: <EmailIcon />,  roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
      { label: "HTML Editor",   to: "/app/templates/html", icon: <CodeIcon />,   roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Media Library", to: "/app/media",          icon: <ImageIcon />,  roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
    ],
  },
  {
    id: "sending", label: "Sending", icon: <RouterIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],
    items: [
      { label: "Sending Domains",   to: "/app/sending/domains",    icon: <DomainIcon />,              roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "IP Warming",        to: "/app/sending/warming",    icon: <LocalFireDepartmentIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Sender Reputation", to: "/app/sending/reputation", icon: <VerifiedIcon />,            roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Webhooks",          to: "/app/sending/webhooks",   icon: <WebhookIcon />,             roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
    ],
  },
  {
    id: "integrations", label: "Integrations", icon: <ExtensionIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],
    items: [
      { label: "API Keys",       to: "/app/integrations/api-keys", icon: <VpnKeyIcon />,  roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Connected Apps", to: "/app/integrations/apps",     icon: <SyncAltIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
    ],
  },
  {
    id: "billing", label: "Billing", icon: <CreditCardIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],
    items: [
      { label: "Usage & Quotas", to: "/app/billing/usage",    icon: <DataUsageIcon />,  roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Invoices",       to: "/app/billing/invoices", icon: <ReceiptIcon />,    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Plans",          to: "/app/billing/plans",    icon: <CreditCardIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
    ],
  },
  {
    id: "reseller", label: "Reseller", icon: <StorefrontIcon />,
    roles: [Role.CLIENT_ADMIN],
    items: [
      { label: "My Clients",       to: "/app/reseller/clients", icon: <BusinessIcon />,  roles: [Role.CLIENT_ADMIN] },
      { label: "Client Users",     to: "/app/reseller/users",   icon: <PeopleAltIcon />, roles: [Role.CLIENT_ADMIN] },
      { label: "Usage Overview",   to: "/app/reseller/usage",   icon: <DataUsageIcon />, roles: [Role.CLIENT_ADMIN] },
      { label: "Quota Allocation", to: "/app/reseller/quotas",  icon: <TuneIcon />,      roles: [Role.CLIENT_ADMIN] },
    ],
  },
  {
    id: "platform", label: "Platform Admin", icon: <AdminPanelSettingsIcon />,
    roles: [Role.SUPER_ADMIN],
    items: [
      { label: "All Clients",     to: "/app/admin/clients",        icon: <BusinessIcon />,     roles: [Role.SUPER_ADMIN] },
      { label: "All Users",       to: "/app/admin/users",          icon: <PeopleAltIcon />,    roles: [Role.SUPER_ADMIN] },
      { label: "Global Domains",  to: "/app/admin/domains",        icon: <DomainIcon />,       roles: [Role.SUPER_ADMIN] },
      { label: "Infrastructure",  to: "/app/admin/infrastructure", icon: <StorageIcon />,      roles: [Role.SUPER_ADMIN] },
      { label: "System Health",   to: "/app/admin/health",         icon: <MonitorHeartIcon />, roles: [Role.SUPER_ADMIN] },
      { label: "Audit Logs",      to: "/app/admin/logs",           icon: <HistoryIcon />,      roles: [Role.SUPER_ADMIN] },
      { label: "Platform Config", to: "/app/admin/config",         icon: <TuneIcon />,         roles: [Role.SUPER_ADMIN] },
      { label: "Compliance",      to: "/app/admin/compliance",     icon: <PolicyIcon />,       roles: [Role.SUPER_ADMIN] },
    ],
  },
  {
    id: "settings", label: "Settings", icon: <ManageAccountsIcon />,
    roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER],
    items: [
      { label: "Account",       to: "/app/settings/account",         icon: <SettingsIcon />,      roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Team Members",  to: "/app/settings/team",            icon: <PeopleAltIcon />,     roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN] },
      { label: "Notifications", to: "/app/settings/notifications",   icon: <NotificationsIcon />, roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
      { label: "Security",      to: "/app/security/change-password", icon: <SecurityIcon />,      roles: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.CLIENT_USER] },
    ],
  },
];

function hasRole(roles: Role[] | undefined, userRole: Role | undefined): boolean {
  if (!roles || !userRole) return true;
  return roles.includes(userRole);
}

function filterGroups(groups: NavGroup[], userRole: Role | undefined): NavGroup[] {
  return groups
    .filter((g) => hasRole(g.roles, userRole))
    .map((g) => ({ ...g, items: g.items.filter((item) => hasRole(item.roles, userRole)) }))
    .filter((g) => g.items.length > 0);
}

const roleBadgeColor: Record<Role, string> = {
  [Role.SUPER_ADMIN]:  "#7c3aed",
  [Role.CLIENT_ADMIN]: "#0284c7",
  [Role.CLIENT_USER]:  "#16a34a",
};
const roleLabel: Record<Role, string> = {
  [Role.SUPER_ADMIN]:  "Super Admin",
  [Role.CLIENT_ADMIN]: "Reseller Admin",
  [Role.CLIENT_USER]:  "User",
};

function NavBadge({ label }: { label: string }) {
  const color = label === "New" ? "#16a34a" : "#7c3aed";
  return (
    <Box component="span" sx={{
      ml: 0.75, px: 0.6, py: 0.1, borderRadius: "4px", fontSize: 9,
      fontWeight: 700, lineHeight: "14px", letterSpacing: "0.05em",
      textTransform: "uppercase", color: "#fff", bgcolor: color, flexShrink: 0,
    }}>
      {label}
    </Box>
  );
}



function ThemeToggle({ mini }: { mini: boolean }) {
  const theme = useTheme();
  const { toggleMode } = useThemeMode();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`} placement={mini ? "right" : "top"}>
      <IconButton size="small" onClick={toggleMode}>
        {isDark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

type SidebarContentProps = {
  groups: NavGroup[];
  currentPath: string;
  mini: boolean;
  hidePanelToggle?: boolean;
  onNavigate: (to: string) => void;
  onToggle: () => void;
  onLogout: () => void;
  user: AuthUser | null;
};

function SidebarContent({
  groups, currentPath, mini, hidePanelToggle = false,
  onNavigate, onToggle, onLogout, user,
}: SidebarContentProps) {
  const initialOpen = groups.find((g) => groupContainsActive(g, currentPath))?.id ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(initialOpen);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroup((prev) => (prev === id ? null : id));
  }, []);

  const dashboardActive = currentPath === "/app/dashboard";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <Box sx={{
        display: "flex", alignItems: "center",
        justifyContent: mini ? "center" : "space-between",
        px: mini ? 0 : 2, minHeight: 64,
        borderBottom: 1, borderColor: "divider", flexShrink: 0,
      }}>
        {!mini && (
          <Box sx={{ overflow: "hidden", flex: 1, ml: 1, mt: 0.5 }}>
            <Box component="img" src="/sidelogo.png" alt="Logo" sx={{ height: 40 }} />
          </Box>
        )}
        {!hidePanelToggle && (
          <Tooltip title={mini ? "Expand sidebar" : "Collapse sidebar"} placement="right">
            <IconButton onClick={onToggle} size="small">
              {mini ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Dashboard */}
      <Box sx={{ px: 1, pt: 1 }}>
        {mini ? (
          <Tooltip title="Dashboard" placement="right">
            <ListItemButton selected={dashboardActive} onClick={() => onNavigate("/app/dashboard")}
              sx={{
                borderRadius: .5, minHeight: 40, px: 1, justifyContent: "center",
                "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", "& .MuiListItemIcon-root": { color: "primary.contrastText" }, "&:hover": { bgcolor: "primary.dark" } },
              }}>
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", "& svg": { fontSize: 20 } }}>
                <DashboardIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton selected={dashboardActive} onClick={() => onNavigate("/app/dashboard")}
            sx={{
              borderRadius: .5, minHeight: 40, px: 2,
              "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", "& .MuiListItemIcon-root": { color: "primary.contrastText" }, "&:hover": { bgcolor: "primary.dark" } },
            }}>
            <ListItemIcon sx={{ minWidth: 36, justifyContent: "center", "& svg": { fontSize: 20 } }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: 13.5, fontWeight: dashboardActive ? 600 : 400 }} />
          </ListItemButton>
        )}
      </Box>

      {/* Nav groups */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 0.5 }}>
        <List disablePadding>
          {groups.map((group) => {
            const isOpen         = openGroup === group.id;
            const groupHasActive = groupContainsActive(group, currentPath);

            if (mini) {
              return (
                <Box key={group.id}>
                  <Divider sx={{ mx: 1.5, my: 0.5 }} />
                  {group.items.map((item) => {
                    const active = isActive(item.to, currentPath);
                    return (
                      <Tooltip key={item.to} title={item.label} placement="right">
                        <ListItemButton selected={active} onClick={() => onNavigate(item.to)}
                          sx={{
                            mx: 1, my: 0.25, borderRadius: .5, minHeight: 38, px: 1, justifyContent: "center",
                            "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", "& .MuiListItemIcon-root": { color: "primary.contrastText" }, "&:hover": { bgcolor: "primary.dark" } },
                          }}>
                          <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", "& svg": { fontSize: 19 } }}>
                            {item.icon}
                          </ListItemIcon>
                        </ListItemButton>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            }

            return (
              <Box key={group.id}>
                <ListItemButton onClick={() => toggleGroup(group.id)}
                  sx={{
                    mx: 1, my: 0.2, borderRadius: .5, minHeight: 38, px: 2,
                    bgcolor: groupHasActive && !isOpen ? "action.selected" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}>
                  <ListItemIcon sx={{
                    minWidth: 34, justifyContent: "center", "& svg": { fontSize: 19 },
                    color: groupHasActive ? "primary.main" : "text.secondary",
                  }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText primary={group.label} primaryTypographyProps={{
                    fontSize: 13, fontWeight: groupHasActive ? 600 : 500,
                    color: groupHasActive ? "primary.main" : "text.primary",
                  }} />
                  {isOpen
                    ? <ExpandLessIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                    : <ExpandMoreIcon sx={{ fontSize: 17, color: "text.secondary" }} />}
                </ListItemButton>

                <Collapse in={isOpen} timeout={180} unmountOnExit>
                  <List disablePadding>
                    {group.items.map((item) => {
                      const active = isActive(item.to, currentPath);
                      return (
                        <ListItemButton key={item.to} selected={active} onClick={() => onNavigate(item.to)}
                          sx={{
                            mx: 1, my: 0.1, borderRadius: .5, minHeight: 34, pl: 4.5, pr: 1.5,
                            "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", "& .MuiListItemIcon-root": { color: "primary.contrastText" }, "&:hover": { bgcolor: "primary.dark" } },
                          }}>
                          <ListItemIcon sx={{ minWidth: 28, justifyContent: "center", "& svg": { fontSize: 16 } }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Box component="span" sx={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>
                                  {item.label}
                                </Box>
                                {item.badge && <NavBadge label={item.badge} />}
                              </Box>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{
        display: "flex", flexDirection: mini ? "column" : "row", alignItems: "center",
        gap: 1, p: mini ? 1 : 1.5, flexShrink: 0,
      }}>
        {!mini && user && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Typography variant="body2" noWrap sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user.name}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ fontSize: 10, color: roleBadgeColor[user.role], fontWeight: 700, letterSpacing: "0.04em" }}>
                {roleLabel[user.role]}
              </Typography>
              {(user as any).tenantName && (
                <>
                  <Typography variant="caption" sx={{ fontSize: 10, color: "text.disabled" }}>·</Typography>
                  <Typography variant="caption" noWrap sx={{ fontSize: 10, color: "text.secondary", maxWidth: 120 }}>{(user as any).tenantName}</Typography>
                </>
              )}
            </Box>
          </Box>
        )}

        <ThemeToggle mini={mini} />
        <Tooltip title="Logout" placement={mini ? "right" : "top"}>
          <IconButton size="small" onClick={onLogout}><LogoutIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const theme            = useTheme();
  const isMobile         = useMediaQuery(theme.breakpoints.down("md"));

  const [mini,       setMini]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDesktopToggle = useCallback(() => setMini((p) => !p), []);
  const handleMobileClose   = useCallback(() => setMobileOpen(false), []);
  const handleMobileOpen    = useCallback(() => setMobileOpen(true), []);

  const handleNavigate = useCallback((to: string) => {
    navigate(to);
    if (isMobile) setMobileOpen(false);
  }, [navigate, isMobile]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const filteredGroups = filterGroups(NAV_GROUPS, user?.role);
  const sharedProps = {
    groups: filteredGroups,
    currentPath: location.pathname,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
    user,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <Box sx={{
          width: mini ? DRAWER_MINI : DRAWER_FULL, flexShrink: 0,
          height: "100vh", position: "sticky", top: 0,
          bgcolor: "background.paper", borderRight: 1, borderColor: "divider", overflow: "hidden",
          transition: theme.transitions.create("width", { easing: theme.transitions.easing.easeInOut, duration: 250 }),
        }}>
          <SidebarContent {...sharedProps} mini={mini} onToggle={handleDesktopToggle} />
        </Box>
      )}

      {/* ── Mobile sidebar ── */}
      {isMobile && (
        <>
          {/* FAB slides with the drawer so it never overlaps */}
          <Box sx={{
            position: "fixed",
            top: 12,
            left: mobileOpen ? DRAWER_FULL + 8 : 12,
            zIndex: theme.zIndex.drawer + 2,
            transition: theme.transitions.create("left", {
              easing: theme.transitions.easing.easeInOut,
              duration: 250,
            }),
          }}>
            <Tooltip title={mobileOpen ? "Close menu" : "Open menu"} placement="right">
              <IconButton
                onClick={mobileOpen ? handleMobileClose : handleMobileOpen}
                sx={{ bgcolor: "background.paper", boxShadow: 3, "&:hover": { bgcolor: "action.hover" } }}>
                {mobileOpen ? <MenuOpenIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={handleMobileClose}
            ModalProps={{ keepMounted: true }}
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_FULL, boxSizing: "border-box", borderRight: 1, borderColor: "divider" } }}>
            {/* hidePanelToggle — the FAB is the sole open/close control on mobile */}
            <SidebarContent {...sharedProps} mini={false} onToggle={handleMobileClose} hidePanelToggle />
          </Drawer>
        </>
      )}

      {/* ── Main content ── */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, pt: { xs: 7, md: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}

