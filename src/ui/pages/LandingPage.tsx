import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Collapse,
  useTheme,
  Slider,
  Fab,
} from "@mui/material";
import {
  ArrowForward,
  CheckCircleOutline,
  LightModeOutlined,
  DarkModeOutlined,
  SecurityOutlined,
  AutoGraphOutlined,
  SpeedOutlined,
  CheckRounded,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  FormatQuoteOutlined,
  KeyboardArrowUpRounded,
  LanguageOutlined,
  GroupsOutlined,
  RocketLaunchOutlined,
  ShoppingBagOutlined,
  CloudOutlined,
  FavoriteBorderOutlined,
  AccountBalanceOutlined,
  NewspaperOutlined,
  BusinessCenterOutlined,
  MailOutlineOutlined,
  TrendingUpOutlined,
  VerifiedOutlined,
  ShieldOutlined,
  NotificationsNoneOutlined,
  SupportAgentOutlined,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth/useAuth";
import { useCurrency } from "../../state/currency/CurrencyContext";
import { CurrencyToggleUI } from "../components/CurrencyToggleUI";
import type { Currency } from "../../types/currency";

// ─── Google Font injection ────────────────────────────────────────────────────
const FONT_LINK = `
  @import url('https://fonts.googleapis.com/css2?family=Play:wght@400;700&family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
`;

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0);    }
`;
const shimmer = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
`;
const pulse = keyframes`
  0%,100% { opacity:.55; transform:scale(1);    }
  50%      { opacity:1;   transform:scale(1.08); }
`;
const floatY = keyframes`
  0%,100% { transform:translateY(0);   }
  50%      { transform:translateY(-9px); }
`;
const slideUp = keyframes`
  from { opacity:0; transform:translateY(16px) scale(0.9); }
  to   { opacity:1; transform:translateY(0) scale(1);      }
`;

// ─── Scroll reveal ────────────────────────────────────────────────────────────
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  sx?: any;
}

function Reveal({ children, delay = 0, sx = {} }: RevealProps) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } },
      { threshold: 0.08 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <Box
      ref={ref}
      sx={{
        opacity: vis ? 1 : 0,
        animation: vis ? `${fadeUp} 0.7s ${delay}s cubic-bezier(.22,1,.36,1) both` : "none",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// ─── Count-up stat ────────────────────────────────────────────────────────────
interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function CountUp({ end, prefix = "", suffix = "", decimals = 0, duration = 2200 }: CountUpProps) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        obs.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setDisplay((end * eased).toFixed(decimals));
          if (p < 1) requestAnimationFrame(tick);
          else setDisplay(end.toFixed(decimals));
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration, decimals]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ─── SVG Brand Icons ──────────────────────────────────────────────────────────
const BrandIcons: Record<string, React.ReactNode> = {
  Zapier: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <circle cx="20" cy="20" r="20" fill="#FF4A00" />
      <path d="M20 8L24 16H30L25 21L27 29L20 25L13 29L15 21L10 16H16L20 8Z" fill="white" />
    </svg>
  ),
  Shopify: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#96BF48" />
      <path d="M27.5 12.5C27.4 12.5 25.5 12.4 25.5 12.4C25.5 12.4 23.8 10.7 23.6 10.5C23.4 10.3 23 10.4 22.8 10.4L21.9 10.7C21.5 9.6 20.7 8.5 19.4 8.5C19.3 8.5 19.2 8.5 19.1 8.5C18.7 8 18.2 7.8 17.8 7.8C14.8 7.8 13.3 11.5 12.9 13.3L10.5 14.1C9.8 14.3 9.8 14.3 9.7 15L8 28L22.5 30.8L31 29L27.5 12.5ZM21.3 11.1L19.8 11.6C19.8 11 19.8 10 19.3 9.2C20.5 9.4 21.1 10.4 21.3 11.1ZM18.4 9.4C18.9 10.1 19.1 11.2 19.1 12L16.4 12.9C16.8 11.2 17.7 10 18.4 9.4ZM17.5 8.7C17.5 8.7 17.7 8.8 17.9 9C17.1 9.6 16.1 11 15.7 13.2L13.7 13.9C14.2 12.1 15.4 8.7 17.5 8.7Z" fill="white" />
    </svg>
  ),
  WordPress: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <circle cx="20" cy="20" r="20" fill="#21759B" />
      <path d="M20 8C13.4 8 8 13.4 8 20C8 26.6 13.4 32 20 32C26.6 32 32 26.6 32 20C32 13.4 26.6 8 20 8ZM9 20C9 18.8 9.2 17.6 9.6 16.5L14.2 29.2C11.2 27.5 9 24 9 20ZM20 31C18.9 31 17.9 30.8 16.9 30.5L20.1 21.3L23.4 30.2C22.4 30.8 21.2 31 20 31ZM21.6 14.8C22.3 14.8 22.9 14.7 22.9 14.7C23.5 14.6 23.4 13.7 22.9 13.7C22.9 13.7 21.2 13.9 20.1 13.9C19.1 13.9 17.3 13.7 17.3 13.7C16.7 13.7 16.7 14.6 17.2 14.7C17.2 14.7 17.8 14.8 18.4 14.8L20.1 19.5L17.6 27L13.3 14.8C14 14.8 14.6 14.7 14.6 14.7C15.2 14.6 15.1 13.7 14.6 13.7C14.6 13.7 12.9 13.9 11.8 13.9C11.6 13.9 11.4 13.9 11.1 13.9C12.9 11 16.3 9 20 9C22.8 9 25.3 10 27.3 11.7L27.2 11.7C26.2 11.7 25.4 12.6 25.4 13.5C25.4 14.3 25.9 15 26.4 15.7C26.8 16.3 27.3 17.1 27.3 18.2C27.3 19 27 20 26.6 21.4L25.5 25.1L21.6 14.8ZM27.3 29C30.1 27.3 32 24.3 32 20.9C32 19.3 31.6 17.9 30.9 16.7L27.3 29Z" fill="white" />
    </svg>
  ),
  Salesforce: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#009EDB" />
      <path d="M16.5 13C17.9 11.2 20 10 22.3 10C25.1 10 27.6 11.6 28.9 14C29.6 13.7 30.3 13.5 31 13.5C33.8 13.5 36 15.7 36 18.5C36 21.3 33.8 23.5 31 23.5C30.6 23.5 30.2 23.4 29.8 23.3C29 25.3 27 26.7 24.7 26.7C23.9 26.7 23.1 26.5 22.5 26.1C21.6 27.9 19.7 29 17.6 29C15.4 29 13.5 27.8 12.6 26C12.1 26.1 11.6 26.2 11 26.2C8.2 26.2 6 24 6 21.2C6 19.3 7.1 17.7 8.6 16.8C8.3 16.1 8.2 15.4 8.2 14.7C8.2 11.8 10.5 9.5 13.4 9.5C14.6 9.5 15.7 9.9 16.5 10.6V13Z" fill="white" opacity="0.9" />
    </svg>
  ),
  HubSpot: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#FF7A59" />
      <path d="M24.5 13.5V11.5C25.3 11.2 25.8 10.4 25.8 9.5C25.8 8.1 24.7 7 23.3 7C21.9 7 20.8 8.1 20.8 9.5C20.8 10.4 21.3 11.2 22.1 11.5V13.5C20.5 13.8 19.1 14.7 18.1 16L11.3 11.1C11.4 10.8 11.5 10.5 11.5 10.2C11.5 8.4 10 7 8.2 7C6.4 7 5 8.4 5 10.2C5 11.9 6.3 13.3 8 13.4V13.5C8 15.1 9.3 16.4 10.9 16.4C11.4 16.4 11.8 16.3 12.2 16.1L18.9 20.9C18.6 21.6 18.5 22.4 18.5 23.2C18.5 26.7 21.4 29.5 24.9 29.5C28.4 29.5 31.3 26.7 31.3 23.2C31.3 20 29 17.4 25.9 16.9C25.3 15.5 25 14.4 24.5 13.5Z" fill="white" />
    </svg>
  ),
  Stripe: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#635BFF" />
      <path d="M18.5 16.2C18.5 15.2 19.3 14.8 20.6 14.8C22.5 14.8 24.9 15.4 26.8 16.4V10.8C24.7 10 22.7 9.7 20.6 9.7C16 9.7 13 12.1 13 16.5C13 23.3 22.3 22.2 22.3 25.1C22.3 26.3 21.3 26.7 19.9 26.7C17.8 26.7 15.1 25.8 13 24.6V30.3C15.3 31.3 17.6 31.7 19.9 31.7C24.7 31.7 27.8 29.4 27.8 24.9C27.8 17.7 18.5 19 18.5 16.2Z" fill="white" />
    </svg>
  ),
  Slack: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#4A154B" />
      <path d="M14.5 22.5C14.5 23.9 13.4 25 12 25C10.6 25 9.5 23.9 9.5 22.5C9.5 21.1 10.6 20 12 20H14.5V22.5ZM15.8 22.5C15.8 21.1 16.9 20 18.3 20C19.7 20 20.8 21.1 20.8 22.5V28C20.8 29.4 19.7 30.5 18.3 30.5C16.9 30.5 15.8 29.4 15.8 28V22.5Z" fill="#E01E5A" />
      <path d="M18.3 14C16.9 14 15.8 12.9 15.8 11.5C15.8 10.1 16.9 9 18.3 9C19.7 9 20.8 10.1 20.8 11.5V14H18.3ZM18.3 15.3C19.7 15.3 20.8 16.4 20.8 17.8C20.8 19.2 19.7 20.3 18.3 20.3H12C10.6 20.3 9.5 19.2 9.5 17.8C9.5 16.4 10.6 15.3 12 15.3H18.3Z" fill="#36C5F0" />
      <path d="M26.5 17.8C26.5 16.4 27.6 15.3 29 15.3C30.4 15.3 31.5 16.4 31.5 17.8C31.5 19.2 30.4 20.3 29 20.3H26.5V17.8ZM25.2 17.8C25.2 19.2 24.1 20.3 22.7 20.3C21.3 20.3 20.2 19.2 20.2 17.8V12C20.2 10.6 21.3 9.5 22.7 9.5C24.1 9.5 25.2 10.6 25.2 12V17.8Z" fill="#2EB67D" />
      <path d="M22.7 26.5C24.1 26.5 25.2 27.6 25.2 29C25.2 30.4 24.1 31.5 22.7 31.5C21.3 31.5 20.2 30.4 20.2 29V26.5H22.7ZM22.7 25.2C21.3 25.2 20.2 24.1 20.2 22.7C20.2 21.3 21.3 20.2 22.7 20.2H29C30.4 20.2 31.5 21.3 31.5 22.7C31.5 24.1 30.4 25.2 29 25.2H22.7Z" fill="#ECB22E" />
    </svg>
  ),
  Webhook: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#1e40af" />
      <path d="M20 10C14.5 10 10 14.5 10 20C10 25.5 14.5 30 20 30C25.5 30 30 25.5 30 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="10" r="4" fill="#60a5fa" />
      <path d="M16 20L20 16L24 20M20 16V26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "REST API": (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#0891b2" />
      <rect x="8" y="13" width="10" height="6" rx="2" fill="white" opacity="0.9" />
      <rect x="8" y="22" width="10" height="6" rx="2" fill="white" opacity="0.6" />
      <rect x="22" y="13" width="10" height="6" rx="2" fill="white" opacity="0.6" />
      <rect x="22" y="22" width="10" height="6" rx="2" fill="white" opacity="0.9" />
      <path d="M18 16H22M18 25H22" stroke="white" strokeWidth="1.5" />
    </svg>
  ),
  WooCommerce: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#7F54B3" />
      <path d="M8 12H32C33.1 12 34 12.9 34 14V24C34 25.1 33.1 26 32 26H23L20 30L17 26H8C6.9 26 6 25.1 6 24V14C6 12.9 6.9 12 8 12Z" fill="white" opacity="0.15" />
      <path d="M11 17.5L13.5 22.5L16 17.5L18.5 22.5L21 17.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="20" r="3" stroke="white" strokeWidth="2" />
    </svg>
  ),
  Mailchimp: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#FFE01B" />
      <ellipse cx="20" cy="16" rx="9" ry="8" fill="#241C15" />
      <ellipse cx="20" cy="15" rx="7" ry="6" fill="#FFE01B" />
      <circle cx="17" cy="14" r="1.5" fill="#241C15" />
      <circle cx="23" cy="14" r="1.5" fill="#241C15" />
      <path d="M17 17.5C17 17.5 18 19 20 19C22 19 23 17.5 23 17.5" stroke="#241C15" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14 24C14 24 16 27 20 27C24 27 26 24 26 24" stroke="#241C15" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  n8n: (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <rect width="40" height="40" rx="8" fill="#EA4B71" />
      <circle cx="12" cy="20" r="4" fill="white" />
      <circle cx="28" cy="14" r="4" fill="white" />
      <circle cx="28" cy="26" r="4" fill="white" />
      <path d="M16 20H20M20 20L24 14M20 20L24 26" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Currency format ──────────────────────────────────────────────────────────
function fmt(val: number, currency: Currency) {
  if (currency === "USD") return val === 0 ? "$0" : `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `KES ${Math.round(val).toLocaleString("en-KE")}`;
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
interface DashboardPreviewProps {
  dark: boolean;
}

function DashboardPreview({ dark }: DashboardPreviewProps) {
  const bg = dark ? "#0d0f14" : "#f8faff";
  const card = dark ? "#161b27" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt = dark ? "#f0f4ff" : "#0f172a";
  const muted = dark ? "#6b7a99" : "#64748b";
  const hatch = dark ? "#1a2035" : "#f1f5f9";
  const hatchL = dark ? "#2a3550" : "#cbd5e1";
  const gridL = dark ? "rgba(255,255,255,0.05)" : "#e2e8f0";
  const blue = "#2563eb";
  const cyan = "#06b6d4";
  const bars = [18, 28, 22, 31, 16, 38, 44, 30, 36, 27, 40, 24];
  const peakIdx = bars.indexOf(Math.max(...bars));
  const yMax = 50;
  const SEGS = 13; const R = 36; const GCX = 46; const GCY = 46; const filled = 9;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const segArc = (i: number) => {
    const slot = 180 / SEGS; const s = 180 - i * slot; const e = 180 - (i + 1) * slot;
    const gap = (slot * 0.28) / 2; const ss = s - gap; const se = e + gap;
    const sx2 = GCX + R * Math.cos(toRad(ss)); const sy2 = GCY - R * Math.sin(toRad(ss));
    const ex2 = GCX + R * Math.cos(toRad(se)); const ey2 = GCY - R * Math.sin(toRad(se));
    return `M ${sx2.toFixed(1)} ${sy2.toFixed(1)} A ${R} ${R} 0 0 1 ${ex2.toFixed(1)} ${ey2.toFixed(1)}`;
  };
  const blueAt = (i: number) => { const t = i / (filled - 1); return `rgb(${Math.round(29 + t * 118)},${Math.round(78 + t * 119)},${Math.round(216 + t * 37)})`; };
  const W = 620; const H = 200; const PL = 28; const PR = 6; const PT = 8; const PB = 18;
  const chartW = W - PL - PR; const chartH = H - PT - PB; const colW = chartW / 12; const barW = Math.floor(colW * 0.6);

  return (
    <Box sx={{ bgcolor: bg, borderRadius: "16px", overflow: "hidden", border: `1px solid ${border}`, fontFamily: "'Nunito Sans', sans-serif" }}>
      <Box sx={{ bgcolor: dark ? "#111827" : "#edf0f7", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${border}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <Box key={c} sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: c }} />)}
        <Box sx={{ flex: 1, mx: 1.5, height: 18, borderRadius: 1, bgcolor: dark ? "#0d1117" : "#dde3ef", display: "flex", alignItems: "center", px: 1.5 }}>
          <Typography sx={{ fontSize: 8, color: muted, fontFamily: "monospace" }}>app.chapmail.io/dashboard</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 1.5, bgcolor: bg }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 0.5 }}>
          <Box>
            <Box sx={{ fontSize: 11, fontWeight: 800, color: txt, fontFamily: "'Nunito', sans-serif" }}>Good morning, Alex</Box>
            <Box sx={{ fontSize: 8, color: muted }}>Here's what's happening in your workspace.</Box>
          </Box>
          <Box sx={{ px: 1.2, py: 0.4, borderRadius: 1, bgcolor: blue, fontSize: 8, fontWeight: 700, color: "#fff" }}>+ New campaign</Box>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, mb: 1.5 }}>
          {[
            { label: "Emails sent", value: "128.5k", delta: "+9.1%", icon: "✉" },
            { label: "Delivery rate", value: "99.2%", delta: "+0.6%", icon: "✓" },
            { label: "Open rate", value: "28.4%", delta: "-1.2%", icon: "↗" },
            { label: "Click rate", value: "4.1%", delta: "+0.4%", icon: "⊙" },
          ].map((s, i) => (
            <Box key={i} sx={{ bgcolor: card, border: `1px solid ${border}`, borderRadius: 1.5, p: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: 0.75, bgcolor: `${blue}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: blue }}>{s.icon}</Box>
                <Box sx={{ fontSize: 7, color: muted }}>ⓘ</Box>
              </Box>
              <Box sx={{ fontSize: 7, color: muted, mb: 0.25 }}>{s.label}</Box>
              <Box sx={{ fontSize: 13, fontWeight: 800, color: txt, letterSpacing: -0.3, lineHeight: 1, fontFamily: "'Play', sans-serif" }}>{s.value}</Box>
              <Box sx={{ fontSize: 7, color: s.delta.startsWith("-") ? "#f43f5e" : "#22c55e", fontWeight: 700, mt: 0.25 }}>{s.delta}</Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1, mb: 1.5 }}>
          <Box sx={{ bgcolor: card, border: `1px solid ${border}`, borderRadius: 1.5, p: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Box sx={{ fontSize: 8, fontWeight: 700, color: txt }}>Send volume</Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Box sx={{ px: 0.8, py: 0.15, borderRadius: 99, fontSize: 7, color: muted }}>Monthly</Box>
                <Box sx={{ px: 0.8, py: 0.15, borderRadius: 99, fontSize: 7, bgcolor: dark ? "#111827" : "#1e293b", color: "#fff", display: "flex", alignItems: "center", gap: 0.3 }}>
                  <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#fff" }} />Yearly
                </Box>
              </Box>
            </Box>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
              <defs>
                <pattern id="ph" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill={hatch} /><line x1="3" y1="0" x2="3" y2="6" stroke={hatchL} strokeWidth="2.5" />
                </pattern>
                <linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={blue} /><stop offset="100%" stopColor={blue} stopOpacity="0.35" />
                </linearGradient>
                <clipPath id="pcc"><rect x={PL} y={PT - 20} width={chartW} height={chartH + 20} /></clipPath>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={PL} x2={W - PR} y1={PT + chartH - f * chartH} y2={PT + chartH - f * chartH} stroke={gridL} strokeWidth={0.8} strokeDasharray={f === 0 ? "none" : "3 2"} />)}
              <g clipPath="url(#pcc)">
                {bars.map((val, i) => {
                  const bh = Math.max((val / yMax) * chartH, 3); const bx = PL + i * colW + (colW - barW) / 2; const by = PT + chartH - bh;
                  const r = Math.min(4, barW / 2, bh / 2); const isAct = i === peakIdx;
                  const bp = `M ${bx + r} ${by} H ${bx + barW - r} Q ${bx + barW} ${by} ${bx + barW} ${by + r} V ${by + bh} H ${bx} V ${by + r} Q ${bx} ${by} ${bx + r} ${by} Z`;
                  return (
                    <g key={i}>
                      <path d={bp} fill={isAct ? "url(#pbg)" : "url(#ph)"} />
                      {isAct && (
                        <g>
                          <rect x={bx + barW / 2 - 24} y={by - 22} width={48} height={16} rx={4} fill="#1e3a8a" />
                          <text x={bx + barW / 2} y={by - 11} textAnchor="middle" style={{ fontSize: 8, fill: cyan, fontWeight: 700, fontFamily: "inherit" }}>22.4k</text>
                          <line x1={bx + barW / 2} y1={by - 6} x2={bx + barW / 2} y2={by - 2} stroke={muted} strokeWidth={0.8} />
                          <circle cx={bx + barW / 2} cy={by} r={4} fill={dark ? "#0d0f14" : "#fff"} stroke={blue} strokeWidth={1.5} />
                        </g>
                      )}
                      <text x={bx + barW / 2} y={H - 4} textAnchor="middle" style={{ fontSize: 7, fill: muted, fontFamily: "inherit" }}>
                        {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </Box>
          <Box sx={{ bgcolor: card, border: `1px solid ${border}`, borderRadius: 1.5, p: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Box sx={{ fontSize: 8, fontWeight: 700, color: txt }}>Delivery overview</Box>
              <Box sx={{ fontSize: 9, color: muted }}>···</Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <svg viewBox="0 0 92 56" style={{ width: "90%", display: "block" }}>
                {Array.from({ length: SEGS }, (_, i) => (
                  <path key={i} d={segArc(i)} fill="none" stroke={i < filled ? blueAt(i) : dark ? "rgba(255,255,255,0.07)" : "#e2e8f0"} strokeWidth={7} strokeLinecap="round" />
                ))}
                <text x={GCX} y={GCY - 4} textAnchor="middle" style={{ fontSize: 10, fontWeight: 800, fill: txt, fontFamily: "inherit" }}>99.2%</text>
                <text x={GCX} y={GCY + 6} textAnchor="middle" style={{ fontSize: 5.5, fill: muted, fontFamily: "inherit" }}>Delivery rate</text>
              </svg>
            </Box>
            <Box sx={{ borderTop: `1px solid ${border}`, pt: 0.75, mt: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                <Box sx={{ fontSize: 7, fontWeight: 700, color: txt }}>11,280</Box>
                <Box sx={{ fontSize: 7, color: muted }}>Target <Box component="span" sx={{ color: txt, fontWeight: 600 }}>20,000</Box></Box>
              </Box>
              <Box sx={{ height: 3, bgcolor: dark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ width: "56%", height: "100%", background: `linear-gradient(90deg,${blue},${cyan})`, borderRadius: 2 }} />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1 }}>
          <Box sx={{ bgcolor: card, border: `1px solid ${border}`, borderRadius: 1.5, p: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Box sx={{ fontSize: 8, fontWeight: 700, color: txt }}>Recent campaigns</Box>
              <Box sx={{ fontSize: 7, color: blue }}>All campaigns →</Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 0.5, pb: 0.5, borderBottom: `1px solid ${border}`, mb: 0.5 }}>
              {["Name", "Status", "Sent", "Open", "Click"].map((h) => <Box key={h} sx={{ fontSize: 6.5, color: muted, fontWeight: 600 }}>{h}</Box>)}
            </Box>
            {[
              { name: "Summer Launch", status: "Sent", sent: "24.5k", open: "31%", click: "4.2%", sc: "#22c55e" },
              { name: "Onboarding Flow", status: "Sending", sent: "8.1k", open: "28%", click: "3.8%", sc: "#06b6d4" },
              { name: "Re-engagement", status: "Scheduled", sent: "—", open: "—", click: "—", sc: "#f59e0b" },
            ].map((r, i) => (
              <Box key={i} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 0.5, py: 0.4, borderBottom: i < 2 ? `1px solid ${border}` : "none" }}>
                <Box sx={{ fontSize: 7, color: txt, fontWeight: 500 }}>{r.name}</Box>
                <Box sx={{ fontSize: 6.5, color: r.sc, fontWeight: 600 }}>{r.status}</Box>
                <Box sx={{ fontSize: 7, color: muted }}>{r.sent}</Box>
                <Box sx={{ fontSize: 7, color: muted }}>{r.open}</Box>
                <Box sx={{ fontSize: 7, color: muted }}>{r.click}</Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ bgcolor: card, border: `1px solid ${border}`, borderRadius: 1.5, p: 1 }}>
            <Box sx={{ fontSize: 8, fontWeight: 700, color: txt, mb: 0.75 }}>Recent activity</Box>
            {[
              { dot: blue, text: 'Campaign "Summer Launch" sent to 24.5k', time: "2 min ago" },
              { dot: "#22c55e", text: "1,240 new contacts imported", time: "18 min ago" },
              { dot: "#f97316", text: "Domain chapmail.io verified", time: "1 hr ago" },
              { dot: "#7c3aed", text: "New client Acme Corp added", time: "3 hrs ago" },
              { dot: blue, text: "A/B test on Subject Line started", time: "Yesterday" },
            ].map((a, i) => (
              <Box key={i} sx={{ display: "flex", gap: 0.75, py: 0.5, borderBottom: i < 4 ? `1px solid ${border}` : "none" }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: a.dot, flexShrink: 0, mt: 0.4 }} />
                <Box>
                  <Box sx={{ fontSize: 7, color: txt, lineHeight: 1.35 }}>{a.text}</Box>
                  <Box sx={{ fontSize: 6.5, color: muted }}>{a.time}</Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Email Cost Calculator ────────────────────────────────────────────────────
interface EmailCalculatorProps {
  dark: boolean;
  currency: Currency;
  rate: number;
  surface: string;
  bord: string;
  bordH: string;
  txt: string;
  muted: string;
  dimmer: string;
  blue: string;
  cyan: string;
  green: string;
  font: string;
}

function EmailCalculator({ dark, currency, rate, surface, bord, bordH, txt, muted, dimmer, blue, cyan, green, font }: EmailCalculatorProps) {
  const [volume, setVolume] = useState(50000);
  const monthlyUSD = (vol: number) => {
    if (vol <= 5000) return 0;
    const tiers = [{ max: 5000, price: 0 }, { max: 100000, price: 0.8 }, { max: 500000, price: 0.6 }, { max: 1000000, price: 0.45 }, { max: Infinity, price: 0.3 }];
    let cost = 0; let remaining = vol; let prev = 0;
    for (const tier of tiers) { const chunk = Math.min(remaining, tier.max - prev); if (chunk <= 0) break; cost += (chunk / 1000) * tier.price; remaining -= chunk; prev = tier.max; if (remaining <= 0) break; }
    return Math.round(cost * 100) / 100;
  };
  const costUSD = monthlyUSD(volume);
  const costDisplay = currency === "USD" ? fmt(costUSD, "USD") : fmt(costUSD * rate, "KES");
  const perEmail = volume > 0 ? costUSD / volume : 0;
  const perEmailDisplay = currency === "USD" ? `$${(perEmail * 1000).toFixed(4)}/1k` : `KES ${(perEmail * rate * 1000).toFixed(2)}/1k`;
  const isFree = costUSD === 0;
  const planName = volume <= 5000 ? "Trial (1 Month)" : volume <= 100000 ? "Growth" : volume <= 1000000 ? "Scale" : "Enterprise";
  const planColor = volume <= 5000 ? green : volume <= 100000 ? blue : volume <= 1000000 ? "#a78bfa" : "#f97316";

  return (
    <Box sx={{ bgcolor: surface, border: `1px solid ${bord}`, borderRadius: "20px", p: { xs: 3, md: 5 }, position: "relative", overflow: "hidden", "&:hover": { borderColor: bordH } }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${blue},${cyan},${green})` }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.4, borderRadius: 1, bgcolor: `${blue}12`, border: `1px solid ${blue}28`, mb: 1.5 }}>
            <TrendingUpOutlined sx={{ fontSize: 12, color: blue }} />
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 1, fontFamily: font }}>Send Rate Calculator</Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, color: txt, fontFamily: "'Play', sans-serif", letterSpacing: -0.5, lineHeight: 1.2 }}>How much will you pay?</Typography>
          <Typography sx={{ fontSize: 14, color: muted, mt: 0.75, fontFamily: font }}>Drag the slider — costs update live in {currency}.</Typography>
        </Box>
        <Box sx={{ bgcolor: `${planColor}0e`, border: `2px solid ${planColor}30`, borderRadius: "16px", px: 3.5, py: 2, textAlign: "center", minWidth: 160 }}>
          <Typography sx={{ fontSize: isFree ? 28 : 36, fontWeight: 700, color: planColor, fontFamily: "'Play', sans-serif", lineHeight: 1 }}>{isFree ? "FREE" : costDisplay}</Typography>
          {!isFree && <Typography sx={{ fontSize: 11, color: muted, mt: 0.5, fontFamily: font }}>per month</Typography>}
          <Box sx={{ mt: 1, px: 1.5, py: 0.3, bgcolor: `${planColor}18`, borderRadius: 99, display: "inline-block" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: planColor, fontFamily: font }}>{planName}</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}>
          <Typography sx={{ fontSize: 14, color: muted, fontFamily: font, fontWeight: 600 }}>Monthly send volume</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: txt, fontFamily: "'Play', sans-serif", letterSpacing: -1 }}>
            {volume >= 1000000 ? `${(volume / 1000000).toFixed(1)}M` : volume >= 1000 ? `${(volume / 1000).toFixed(0)}k` : volume.toLocaleString()}
            <Typography component="span" sx={{ fontSize: 13, color: muted, fontFamily: font, ml: 0.5 }}>emails</Typography>
          </Typography>
        </Box>
        <Slider value={volume} min={1000} max={1000000} step={1000} onChange={(_, val) => setVolume(val as number)}
          sx={{ color: planColor, "& .MuiSlider-thumb": { width: 22, height: 22, border: `3px solid ${planColor}`, bgcolor: dark ? "#0d1117" : "#fff", boxShadow: `0 0 0 6px ${planColor}22`, "&:hover": { boxShadow: `0 0 0 10px ${planColor}28` } }, "& .MuiSlider-track": { height: 6, border: "none", background: `linear-gradient(90deg,${blue},${planColor})` }, "& .MuiSlider-rail": { height: 6, bgcolor: dark ? "rgba(255,255,255,0.08)" : "#e2e8f0" } }}
        />
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
          {[5000, 50000, 100000, 500000, 1000000].map((v) => (
            <Box key={v} onClick={() => setVolume(v)} sx={{ px: 1.5, py: 0.5, borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: font, transition: "all .15s", bgcolor: volume === v ? `${blue}18` : "transparent", color: volume === v ? blue : muted, border: `1px solid ${volume === v ? `${blue}40` : bord}`, "&:hover": { borderColor: `${blue}40`, color: blue } }}>
              {v >= 1000000 ? "1M" : v >= 1000 ? `${v / 1000}k` : v}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
        {[
          { label: "Cost per 1k emails", value: isFree ? "Free" : perEmailDisplay, color: blue },
          { label: "Daily equivalent", value: isFree ? "$0" : fmt(costUSD / 30, currency === "USD" ? "USD" : "KES"), color: cyan },
          { label: "Annual estimate", value: isFree ? "$0" : fmt(costUSD * 12 * (currency === "KES" ? rate : 1), currency), color: "#a78bfa" },
          { label: "Vs. industry avg", value: "−62%", color: green },
        ].map((s) => (
          <Box key={s.label} sx={{ bgcolor: dark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)", borderRadius: "12px", p: 2, border: `1px solid ${bord}` }}>
            <Typography sx={{ fontSize: 11, color: muted, fontFamily: font, mb: 0.5 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'Play', sans-serif" }}>{s.value}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ bgcolor: dark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)", borderRadius: "12px", p: 2.5, border: `1px solid ${bord}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: dimmer, textTransform: "uppercase", letterSpacing: 1.5, mb: 2, fontFamily: font }}>Volume tiers</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4,1fr)" }, gap: 1.5 }}>
          {[
            { range: "First 5k", rate: "FREE", active: volume <= 5000, color: green },
            { range: "5k – 100k", rate: currency === "USD" ? "$0.80/1k" : `KES ${(0.8 * rate).toFixed(0)}/1k`, active: volume > 5000 && volume <= 100000, color: blue },
            { range: "100k – 1M", rate: currency === "USD" ? "$0.45/1k" : `KES ${(0.45 * rate).toFixed(0)}/1k`, active: volume > 100000, color: "#a78bfa" },
            { range: "1M+", rate: "Contact sales", active: false, color: "#f97316" },
          ].map((tier) => (
            <Box key={tier.range} sx={{ p: 1.5, borderRadius: "10px", border: `1.5px solid ${tier.active ? tier.color + "50" : bord}`, bgcolor: tier.active ? `${tier.color}08` : "transparent", transition: "all .2s" }}>
              <Typography sx={{ fontSize: 10, color: tier.active ? tier.color : dimmer, fontWeight: 700, fontFamily: font, mb: 0.3 }}>{tier.range}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tier.active ? tier.color : muted, fontFamily: "'Play', sans-serif" }}>{tier.rate}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const muiTheme = useTheme();
  const { currency, setCurrency, usdToKesRate } = useCurrency();
  const [dark, setDark] = useState(muiTheme.palette.mode === "dark");
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => { setDark(muiTheme.palette.mode === "dark"); }, [muiTheme.palette.mode]);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      // Show scroll-to-top after 500px
      setShowScrollTop(y > 500);
      // Hide nav on scroll-down, reveal on scroll-up
      // Small dead-zone of 6px avoids flicker on tiny movements
      if (Math.abs(y - lastScrollY.current) < 6) return;
      setNavVisible(y < lastScrollY.current || y < 60);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const effectiveRate = usdToKesRate;
  const price = (usd: number) => {
    if (currency === "USD") return usd === 0 ? "$0" : `$${usd}`;
    return usd === 0 ? "KES 0" : `KES ${Math.round(usd * effectiveRate).toLocaleString("en-KE")}`;
  };

  // ─── Color tokens ──────────────────────────────────────────────────────────
  const bg = dark ? "#080a0f" : "#f6f8ff";
  const surface = dark ? "#0d1117" : "#ffffff";
  const surfB = dark ? "#10141e" : "#eef1f9";
  const bord = dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)";
  const bordH = dark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.18)";
  const txt = dark ? "#edf2ff" : "#0f172a";
  const muted = dark ? "#6b7a99" : "#52637a";
  const dimmer = dark ? "#3a4460" : "#94a3b8";
  const blue = "#2563eb";
  const blueL = "#3b82f6";
  const blueDim = dark ? "rgba(37,99,235,0.14)" : "rgba(37,99,235,0.07)";
  const cyan = "#06b6d4";
  const green = "#22c55e";

  const cardSx = {
    bgcolor: surface,
    border: `1px solid ${bord}`,
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
    transition: "border-color .25s, box-shadow .3s, transform .25s",
  };

  const font = "'Nunito', 'Nunito Sans', sans-serif";
  const display = "'Play', sans-serif";

  const annualDiscount = 0.2;
  const prices = {
    starter: 0,
    growth: annual ? Math.round(29 * (1 - annualDiscount)) : 29,
    scale: annual ? Math.round(99 * (1 - annualDiscount)) : 99,
  };

  // ─── Nav links — all scroll to in-page sections ───────────────────────────
  const navLinks = [
    { label: "Features",   id: "features"   },
    { label: "Industries", id: "industries" },
    { label: "Pricing",    id: "pricing"    },
    { label: "API Docs",   id: "docs"       },
    { label: "Blogs",      id: "blogs"      },
  ];

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const CurrencyToggle = CurrencyToggleUI;

  return (
    <>
      <style>{FONT_LINK}</style>
      <Box sx={{ minHeight: "100vh", bgcolor: bg, color: txt, overflowX: "clip", fontFamily: font }}>

        {/* ── Background layers ── */}
        <Box sx={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `radial-gradient(circle, ${dark ? "rgba(255,255,255,0.032)" : "rgba(15,23,42,0.05)"} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        <Box sx={{ position: "fixed", top: "-18%", left: "-6%", width: "52vw", height: "52vw", background: `radial-gradient(circle,${blue}14 0%,transparent 65%)`, zIndex: 0, filter: "blur(85px)", pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", bottom: "8%", right: "-8%", width: "40vw", height: "40vw", background: `radial-gradient(circle,${cyan}0c 0%,transparent 65%)`, zIndex: 0, filter: "blur(90px)", pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", top: "40%", left: "40%", width: "30vw", height: "30vw", background: `radial-gradient(circle,rgba(168,85,247,0.055) 0%,transparent 65%)`, zIndex: 0, filter: "blur(70px)", pointerEvents: "none" }} />

        {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
        <Box component="header" sx={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
          backdropFilter: "blur(32px) saturate(1.8)",
          WebkitBackdropFilter: "blur(32px) saturate(1.8)",
          bgcolor: dark ? "rgba(8,10,15,0.82)" : "rgba(246,248,255,0.84)",
          borderBottom: `1px solid ${bord}`,
          transform: navVisible ? "translateY(0)" : "translateY(-110%)",
          transition: "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}>
          {/* Main bar */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, md: 5 }, py: 1.6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
              <Box component="img" src="/favicon.png" alt="ChapMail" sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "contain" }} />
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: txt, letterSpacing: -0.4, fontFamily: display }}>ChapMail</Typography>
            </Stack>

            {/* Desktop links */}
            <Stack direction="row" alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
              {navLinks.map((l) => (
                <Box key={l.label} onClick={() => scrollTo(l.id)}
                  sx={{ px: 1.6, py: 0.8, borderRadius: 1.5, fontSize: 13.5, fontWeight: 600, color: muted, cursor: "pointer", transition: "color .15s", fontFamily: font, "&:hover": { color: txt } }}>
                  {l.label}
                </Box>
              ))}
            </Stack>

            {/* Right actions */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ display: { xs: "none", sm: "block" } }}><CurrencyToggle /></Box>
              <Box onClick={() => { window.dispatchEvent(new CustomEvent("toggle-theme")); setDark(d => !d); }}
                sx={{ width: 36, height: 36, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px solid ${bord}`, color: muted, transition: "all .15s", "&:hover": { borderColor: bordH, color: txt } }}>
                {dark ? <LightModeOutlined sx={{ fontSize: 17 }} /> : <DarkModeOutlined sx={{ fontSize: 17 }} />}
              </Box>
              {user ? (
                <Button onClick={() => navigate("/app/dashboard")} variant="contained"
                  sx={{ display: { xs: "none", sm: "flex" }, bgcolor: blue, color: "#fff", fontWeight: 700, fontSize: 13, px: 2.5, py: 0.9, borderRadius: 1.5, fontFamily: font, boxShadow: `0 0 20px ${blue}40`, "&:hover": { bgcolor: blueL } }}>
                  Dashboard →
                </Button>
              ) : (
                <>
                  <Box onClick={() => navigate("/login")}
                    sx={{ display: { xs: "none", md: "block" }, px: 1.5, py: 0.75, fontSize: 13, fontWeight: 600, color: muted, cursor: "pointer", borderRadius: 1, fontFamily: font, "&:hover": { color: txt } }}>
                    Sign in
                  </Box>
                  <Button onClick={() => navigate("/register")} variant="contained"
                    sx={{ display: { xs: "none", sm: "flex" }, bgcolor: blue, color: "#fff", fontWeight: 700, fontSize: 13, px: 2.5, py: 0.9, borderRadius: 1.5, fontFamily: font, boxShadow: `0 0 20px ${blue}40`, "&:hover": { bgcolor: blueL } }}>
                    Get started free
                  </Button>
                </>
              )}
              {/* Hamburger — mobile only */}
              <Box onClick={() => setMobileMenuOpen(o => !o)}
                sx={{ display: { xs: "flex", md: "none" }, width: 38, height: 38, borderRadius: 1.5, border: `1px solid ${bord}`, alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: "5px", px: 1, transition: "border-color .15s", "&:hover": { borderColor: bordH } }}>
                {[0, 1, 2].map((bar) => (
                  <Box key={bar} sx={{
                    width: bar === 1 ? 14 : 20, height: 1.5, bgcolor: muted, borderRadius: 1,
                    transition: "all .25s cubic-bezier(.22,1,.36,1)",
                    ...(mobileMenuOpen && bar === 0 && { transform: "translateY(6.5px) rotate(45deg)", width: 20, bgcolor: txt }),
                    ...(mobileMenuOpen && bar === 1 && { opacity: 0, transform: "scaleX(0)" }),
                    ...(mobileMenuOpen && bar === 2 && { transform: "translateY(-6.5px) rotate(-45deg)", width: 20, bgcolor: txt }),
                  }} />
                ))}
              </Box>
            </Stack>
          </Box>

          {/* Mobile dropdown */}
          <Collapse in={mobileMenuOpen}>
            <Box sx={{ display: { xs: "block", md: "none" }, borderTop: `1px solid ${bord}`, px: 2.5, py: 2, bgcolor: dark ? "rgba(8,10,15,0.96)" : "rgba(246,248,255,0.97)" }}>
              <Stack spacing={0.5}>
                {navLinks.map((l, i) => (
                  <Box key={l.label} onClick={() => { scrollTo(l.id); setMobileMenuOpen(false); }}
                    sx={{ px: 2, py: 1.25, borderRadius: 1.5, fontSize: 15, fontWeight: 600, color: muted, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .12s", "&:hover": { color: txt, bgcolor: dark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)" } }}>
                    {l.label}
                    <ArrowForward sx={{ fontSize: 14, opacity: 0.4 }} />
                  </Box>
                ))}
                <Box sx={{ pt: 1.5, borderTop: `1px solid ${bord}` }}>
                  {user ? (
                    <Button onClick={() => { navigate("/app/dashboard"); setMobileMenuOpen(false); }} fullWidth variant="contained"
                      sx={{ bgcolor: blue, color: "#fff", fontWeight: 700, py: 1.2, borderRadius: 1.5, fontFamily: font }}>
                      Dashboard →
                    </Button>
                  ) : (
                    <Stack spacing={1}>
                      <Button onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} fullWidth variant="contained"
                        sx={{ bgcolor: blue, color: "#fff", fontWeight: 700, py: 1.2, borderRadius: 1.5, fontFamily: font, boxShadow: `0 4px 16px ${blue}40` }}>
                        Get started free
                      </Button>
                      <Button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} fullWidth variant="outlined"
                        sx={{ borderColor: bord, color: muted, fontWeight: 600, py: 1.1, borderRadius: 1.5, fontFamily: font }}>
                        Sign in
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </Box>

        {/* Spacer — keeps content clear of the fixed navbar */}
        <Box sx={{ height: { xs: 64, md: 68 } }} />

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, pt: { xs: 6, md: 12 }, pb: 4, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 0.7, borderRadius: 99, mb: 5, bgcolor: blueDim, border: `1px solid ${blue}45`, animation: `${fadeUp} .6s .05s both` }}>
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: cyan, boxShadow: `0 0 8px ${cyan}`, animation: `${pulse} 2s infinite` }} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cyan, letterSpacing: 0.3, fontFamily: font }}>
              v2.0 is live — Infrastructure-grade email, rebuilt from scratch
            </Typography>
          </Box>

          <Box sx={{ animation: `${fadeUp} .7s .15s both` }}>
            <Typography sx={{ fontSize: { xs: "2.8rem", sm: "4rem", md: "5.2rem" }, fontWeight: 700, letterSpacing: { xs: -1.5, md: -3 }, lineHeight: 1.04, color: txt, mb: 1, fontFamily: display }}>
              Email that hits
            </Typography>
            <Typography sx={{ fontSize: { xs: "2.8rem", sm: "4rem", md: "5.2rem" }, fontWeight: 700, letterSpacing: { xs: -1.5, md: -3 }, lineHeight: 1.04, mb: 4, fontFamily: display, background: `linear-gradient(90deg, ${blue} 0%, ${cyan} 50%, ${blueL} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: `${shimmer} 3.5s linear infinite` }}>
              the inbox. Always.
            </Typography>
          </Box>

          <Box sx={{ animation: `${fadeUp} .7s .28s both` }}>
            <Typography sx={{ fontSize: { xs: 15, md: 18 }, color: muted, fontWeight: 500, maxWidth: 640, mx: "auto", lineHeight: 1.8, mb: 6, fontFamily: font }}>
              The email infrastructure that elite teams choose — breathtaking deliverability, intelligent automation flows, and real-time analytics all under one roof.
            </Typography>
          </Box>

          <Box sx={{ animation: `${fadeUp} .7s .4s both` }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3.5 }}>
              {user ? (
                <Button onClick={() => navigate("/app/dashboard")} variant="contained" endIcon={<ArrowForward />}
                  sx={{ bgcolor: blue, color: "#fff", fontWeight: 800, fontSize: 15, px: 4, py: 1.6, borderRadius: 2, fontFamily: font, boxShadow: `0 8px 30px ${blue}50`, transition: "all .2s", "&:hover": { bgcolor: blueL, transform: "translateY(-2px)", boxShadow: `0 12px 40px ${blue}65` } }}>
                  Open Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate("/register")} variant="contained" endIcon={<ArrowForward />}
                    sx={{ bgcolor: blue, color: "#fff", fontWeight: 800, fontSize: 15, px: 4.5, py: 1.6, borderRadius: 2, fontFamily: font, boxShadow: `0 8px 30px ${blue}50`, transition: "all .2s", "&:hover": { bgcolor: blueL, transform: "translateY(-2px)", boxShadow: `0 12px 40px ${blue}65` } }}>
                    Start free — no card needed
                  </Button>
                  <Button onClick={() => navigate("/login")} variant="text"
                    sx={{ color: muted, fontWeight: 700, fontSize: 14, px: 3.5, py: 1.6, borderRadius: 2, fontFamily: font, border: `1.5px solid ${bord}`, transition: "all .2s", "&:hover": { color: txt, borderColor: bordH, bgcolor: dark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.04)" } }}>
                    Sign in →
                  </Button>
                </>
              )}
            </Stack>
            <Stack direction="row" justifyContent="center" flexWrap="wrap" sx={{ gap: 2 }}>
              {["5,000 emails free/mo", "99.9% uptime SLA", "GDPR & CAN-SPAM compliant", "No credit card"].map((t) => (
                <Stack key={t} direction="row" spacing={0.6} alignItems="center">
                  <CheckCircleOutline sx={{ fontSize: 14, color: cyan }} />
                  <Typography sx={{ fontSize: 12.5, color: dimmer, fontFamily: font, fontWeight: 500 }}>{t}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Dashboard mockup */}
          <Box sx={{ animation: `${fadeUp} .9s .5s both`, mt: 9, position: "relative" }}>
            <Box sx={{ position: "absolute", inset: -3, borderRadius: "20px", background: `linear-gradient(135deg,${blue}55,${cyan}30,transparent)`, filter: "blur(3px)", zIndex: 0 }} />
            <Box sx={{ position: "absolute", top: -16, right: { xs: 16, md: 50 }, zIndex: 10, display: "flex", alignItems: "center", gap: 0.8, bgcolor: surface, border: `1px solid ${bord}`, borderRadius: 99, px: 1.75, py: 0.7, boxShadow: `0 6px 24px rgba(0,0,0,.3)`, animation: `${fadeUp} 1s .85s both` }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: green, boxShadow: `0 0 10px ${green}`, animation: `${pulse} 2s infinite` }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: txt, fontFamily: font }}>Live · 3,841 emails/min</Typography>
            </Box>
            <Box sx={{ position: "relative", zIndex: 2, animation: `${floatY} 7s ease-in-out infinite` }}>
              <DashboardPreview dark={dark} />
            </Box>
          </Box>
        </Container>

        {/* ══ STATS BELT ══════════════════════════════════════════════════════ */}
        <Reveal>
          <Box sx={{ position: "relative", zIndex: 1, py: 9, mt: 10, borderTop: `1px solid ${bord}`, borderBottom: `1px solid ${bord}`, bgcolor: surfB }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${blue}55,${cyan}40,transparent)` }} />
            <Container maxWidth="lg">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: { xs: 4, md: 2 } }}>
                {[
                  { end: 50, prefix: "", suffix: "B+",   label: "Emails delivered monthly",  color: blue,      sub: "across all clients",    decimals: 0 },
                  { end: 99.99, prefix: "", suffix: "%", label: "Platform uptime SLA",        color: cyan,      sub: "guaranteed",            decimals: 2 },
                  { end: 0.1,  prefix: "<", suffix: "s", label: "Average send latency",       color: "#a78bfa", sub: "from API to SMTP",      decimals: 1 },
                  { end: 99,   prefix: "", suffix: "%",  label: "Inbox placement rate",       color: green,     sub: "industry avg: 85%",     decimals: 0 },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.07}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: { xs: "2.2rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1, mb: 0.5, fontFamily: display, textShadow: `0 0 30px ${s.color}45` }}>
                        <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: txt, fontWeight: 700, fontFamily: font, mb: 0.3 }}>{s.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: muted, fontFamily: font }}>{s.sub}</Typography>
                    </Box>
                  </Reveal>
                ))}
              </Box>
            </Container>
          </Box>
        </Reveal>

        {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
        <Box id="features">
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 12, md: 18 } }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 10 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Built different</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3.2rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display, mb: 2 }}>
                  Everything you need.<br />Nothing you don't.
                </Typography>
                <Typography sx={{ fontSize: 15, color: muted, maxWidth: 520, mx: "auto", lineHeight: 1.8, fontFamily: font, fontWeight: 500 }}>
                  From IP warmup to real-time analytics — ChapMail gives you the infrastructure that turns email from a cost centre into a growth engine.
                </Typography>
              </Box>
            </Reveal>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 2 }}>
              {[
                { icon: <SecurityOutlined />, title: "Domain Authority", body: "Automated IP warmup schedules, sender reputation monitoring, real-time blacklist scanning and DKIM/SPF/DMARC verification — so your reputation stays pristine from day one.", accent: blue, tag: "Deliverability", extras: ["IP warmup scheduler", "Blacklist monitoring", "DKIM/SPF/DMARC setup", "Bounce management"] },
                { icon: <AutoGraphOutlined />, title: "Visual Automation", body: "Build multi-step drip sequences, conditional branching logic, A/B test forks, and wait nodes on a drag-and-drop canvas your whole team can understand at a glance.", accent: cyan, tag: "Automation", extras: ["Drag-and-drop builder", "Conditional branches", "A/B test nodes", "Real-time flow analytics"] },
                { icon: <SpeedOutlined />, title: "Real-time Analytics", body: "Sub-second tracking of opens, clicks, geographic engagement, ISP-level delivery data, and revenue attribution — streaming live as your campaign sends.", accent: "#a78bfa", tag: "Analytics", extras: ["Live send monitoring", "Revenue attribution", "ISP-level data", "Custom dashboards"] },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.1}>
                  <Box sx={{ ...cardSx, p: 3.5, height: "100%", "&:hover": { borderColor: `${f.accent}50`, boxShadow: `0 0 40px ${f.accent}12, 0 20px 40px rgba(0,0,0,.15)`, transform: "translateY(-5px)" } }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${f.accent}80,transparent)` }} />
                    <Box sx={{ display: "inline-block", px: 1.25, py: 0.35, borderRadius: 1, bgcolor: `${f.accent}12`, border: `1px solid ${f.accent}28`, mb: 2.5 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 800, color: f.accent, textTransform: "uppercase", letterSpacing: 1, fontFamily: font }}>{f.tag}</Typography>
                    </Box>
                    <Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: `${f.accent}12`, border: `1px solid ${f.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5, color: f.accent, "& svg": { fontSize: 24 }, boxShadow: `0 0 18px ${f.accent}20` }}>
                      {f.icon}
                    </Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: txt, mb: 1.5, letterSpacing: -0.4, fontFamily: display }}>{f.title}</Typography>
                    <Typography sx={{ fontSize: 13.5, color: muted, lineHeight: 1.78, mb: 2.5, fontFamily: font }}>{f.body}</Typography>
                    <Stack spacing={0.9}>
                      {f.extras.map((e) => (
                        <Stack key={e} direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: f.accent, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12.5, color: muted, fontFamily: font, fontWeight: 500 }}>{e}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 0.6, color: f.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
                      Learn more <ArrowForward sx={{ fontSize: 14 }} />
                    </Box>
                  </Box>
                </Reveal>
              ))}
            </Box>

            {/* Reseller card */}
            <Reveal delay={0.1}>
              <Box sx={{ ...cardSx, p: { xs: 3, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 5, alignItems: "center", "&:hover": { borderColor: `${blue}35` } }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${blue}65,transparent)` }} />
                <Box>
                  <Box sx={{ display: "inline-block", px: 1.25, py: 0.35, borderRadius: 1, bgcolor: blueDim, border: `1px solid ${blue}28`, mb: 2.5 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 1, fontFamily: font }}>Reseller Platform</Typography>
                  </Box>
                  <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: txt, mb: 1.5, letterSpacing: -0.6, lineHeight: 1.15, fontFamily: display }}>White-label it.<br />Make it yours.</Typography>
                  <Typography sx={{ fontSize: 14, color: muted, lineHeight: 1.78, mb: 3, fontFamily: font }}>
                    Resell ChapMail under your own brand with full client management, quota allocation, tiered billing, and branded dashboards — all under your domain.
                  </Typography>
                  <Button variant="outlined" endIcon={<ArrowForward />}
                    sx={{ borderColor: `${blue}50`, color: blue, fontWeight: 700, fontSize: 13.5, borderRadius: 1.75, px: 2.5, fontFamily: font, "&:hover": { borderColor: blue, bgcolor: blueDim } }}>
                    Explore Reseller plan
                  </Button>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {["Custom domain & branding", "Full client isolation", "Per-client quota controls", "White-label UI & emails", "Reseller usage dashboards", "Dedicated onboarding", "Priority support SLA", "Custom billing rules"].map((f) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                      <CheckRounded sx={{ fontSize: 15, color: cyan, flexShrink: 0, mt: 0.2 }} />
                      <Typography sx={{ fontSize: 12.5, color: muted, fontFamily: font, lineHeight: 1.5 }}>{f}</Typography>
                    </Stack>
                  ))}
                </Box>
              </Box>
            </Reveal>
          </Container>
        </Box>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
        <Box id="how" sx={{ bgcolor: surfB, py: { xs: 12, md: 18 }, borderTop: `1px solid ${bord}`, borderBottom: `1px solid ${bord}` }}>
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 10 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Simple to start</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display }}>Up and running in minutes.</Typography>
              </Box>
            </Reveal>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 3, position: "relative" }}>
              <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", top: 32, left: "18%", right: "18%", height: 2, bgcolor: bord, zIndex: 0 }}>
                <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "50%", background: `linear-gradient(90deg,${blue},${cyan})`, borderRadius: 1 }} />
              </Box>
              {[
                { step: "01", title: "Connect your domain", body: "Add your sending domain, verify DNS records, and let our system auto-configure DKIM, SPF, and DMARC. Under 5 minutes.", Icon: LanguageOutlined, color: blue },
                { step: "02", title: "Import your audience", body: "Upload contacts via CSV, sync from your CRM, or use our API. Automatic deduplication, validation, and list hygiene included.", Icon: GroupsOutlined, color: cyan },
                { step: "03", title: "Send with confidence", body: "Create a campaign, pick a template, schedule or send immediately. Real-time delivery tracking starts the moment you hit send.", Icon: RocketLaunchOutlined, color: green },
              ].map((s, i) => (
                <Reveal key={s.step} delay={i * 0.12}>
                  <Box sx={{ ...cardSx, p: 3.5, zIndex: 1, textAlign: "center", "&:hover": { borderColor: `${s.color}45`, boxShadow: `0 0 30px ${s.color}10, 0 16px 32px rgba(0,0,0,.12)`, transform: "translateY(-4px)" } }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color}70,transparent)` }} />
                    <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: `${s.color}12`, border: `2px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5, boxShadow: `0 0 20px ${s.color}18`, color: s.color }}>
                      <s.Icon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", bgcolor: `${s.color}18`, border: `1px solid ${s.color}30`, mb: 1.5 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: display }}>{s.step}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: txt, mb: 1.25, fontFamily: display }}>{s.title}</Typography>
                    <Typography sx={{ fontSize: 13.5, color: muted, lineHeight: 1.75, fontFamily: font }}>{s.body}</Typography>
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        {/* ══ INDUSTRIES ══════════════════════════════════════════════════════ */}
        <Box id="industries">
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 12, md: 18 } }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 10 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Industries</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3.2rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display, mb: 2 }}>
                  Built for your industry.
                </Typography>
                <Typography sx={{ fontSize: 15, color: muted, maxWidth: 520, mx: "auto", lineHeight: 1.8, fontFamily: font, fontWeight: 500 }}>
                  Whether you send 5,000 or 5 million emails a month, ChapMail adapts to the unique demands of your sector.
                </Typography>
              </Box>
            </Reveal>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3,1fr)" }, gap: 2 }}>
              {[
                {
                  Icon: ShoppingBagOutlined, label: "E-commerce", accent: "#f97316",
                  headline: "Turn browsers into buyers",
                  desc: "Automated abandoned cart sequences, order confirmations, post-purchase upsells and loyalty reward flows — all triggered in real time.",
                  uses: ["Abandoned cart recovery", "Order & shipping alerts", "Loyalty & reward campaigns"],
                },
                {
                  Icon: CloudOutlined, label: "SaaS", accent: blue,
                  headline: "Convert trials. Retain users.",
                  desc: "Precision onboarding sequences, feature-adoption nudges, trial-expiry urgency flows and churn-prevention automations built for product-led growth.",
                  uses: ["Trial onboarding flows", "Feature announcement drips", "Churn prevention sequences"],
                },
                {
                  Icon: FavoriteBorderOutlined, label: "Healthcare", accent: "#ec4899",
                  headline: "Patient communication at scale",
                  desc: "Appointment reminders, lab result notifications and patient education content — delivered reliably and compliantly, every time.",
                  uses: ["Appointment reminders", "Patient education series", "HIPAA-aligned delivery"],
                },
                {
                  Icon: AccountBalanceOutlined, label: "Financial Services", accent: cyan,
                  headline: "Secure, compliant, on time",
                  desc: "Account statements, transaction alerts, regulatory notices and fraud warnings delivered with enterprise-grade security and full audit trails.",
                  uses: ["Transaction & fraud alerts", "Regulatory disclosures", "Statement delivery"],
                },
                {
                  Icon: NewspaperOutlined, label: "Media & Publishing", accent: "#a78bfa",
                  headline: "Grow and monetise your audience",
                  desc: "Subscriber welcome series, content digest newsletters, breaking-news alerts and re-engagement campaigns that keep readers coming back.",
                  uses: ["Weekly digest newsletters", "Breaking-news alerts", "Subscriber re-engagement"],
                },
                {
                  Icon: BusinessCenterOutlined, label: "Agencies", accent: green,
                  headline: "One platform. Unlimited clients.",
                  desc: "White-label dashboard, per-client quota controls, isolated sending pools and consolidated billing — everything an agency needs to scale.",
                  uses: ["White-label client portal", "Isolated client pools", "Consolidated reporting"],
                },
              ].map((ind, i) => (
                <Reveal key={ind.label} delay={i * 0.07}>
                  <Box sx={{ ...cardSx, p: 3, height: "100%", display: "flex", flexDirection: "column", "&:hover": { borderColor: `${ind.accent}50`, boxShadow: `0 0 36px ${ind.accent}10, 0 16px 32px rgba(0,0,0,.12)`, transform: "translateY(-4px)" } }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${ind.accent}80,transparent)` }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${ind.accent}12`, border: `1px solid ${ind.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", color: ind.accent, flexShrink: 0 }}>
                        <ind.Icon sx={{ fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: "inline-block", px: 1, py: 0.2, borderRadius: 0.75, bgcolor: `${ind.accent}10`, border: `1px solid ${ind.accent}20`, mb: 0.25 }}>
                          <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: ind.accent, textTransform: "uppercase", letterSpacing: 1, fontFamily: font }}>{ind.label}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: txt, fontFamily: display, lineHeight: 1.2 }}>{ind.headline}</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 13, color: muted, lineHeight: 1.75, fontFamily: font, mb: 2.5, flex: 1 }}>{ind.desc}</Typography>
                    <Stack spacing={0.8}>
                      {ind.uses.map((u) => (
                        <Stack key={u} direction="row" spacing={1} alignItems="center">
                          <CheckRounded sx={{ fontSize: 14, color: ind.accent, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12, color: muted, fontFamily: font, fontWeight: 500 }}>{u}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        {/* ══ EMAIL COST CALCULATOR ═══════════════════════════════════════════ */}
        <Box sx={{ bgcolor: surfB, borderTop: `1px solid ${bord}`, borderBottom: `1px solid ${bord}` }}>
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 10, md: 16 } }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 8 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Transparent Pricing</Typography>
                <Typography sx={{ fontSize: { xs: "1.8rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, fontFamily: display, mb: 2 }}>
                  Know your costs before you commit.
                </Typography>
                <Typography sx={{ fontSize: 15, color: muted, maxWidth: 500, mx: "auto", fontFamily: font, fontWeight: 500, mb: 2 }}>
                  Prices shown in{" "}
                  <Box component="span" sx={{ color: currency === "KES" ? green : blue, fontWeight: 700 }}>{currency}</Box>
                  {currency === "KES" && <Box component="span" sx={{ color: dimmer, fontSize: 12 }}> · Live rate: 1 USD = KES {effectiveRate.toFixed(2)}</Box>}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1 }}>
                  {(["USD", "KES"] as Currency[]).map((c) => (
                    <Box key={c} onClick={() => setCurrency(c)}
                      sx={{ px: 2.5, py: 0.75, borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: font, bgcolor: currency === c ? (c === "KES" ? "rgba(34,197,94,0.12)" : blueDim) : "transparent", color: currency === c ? (c === "KES" ? green : blue) : muted, border: `1.5px solid ${currency === c ? (c === "KES" ? "#22c55e50" : `${blue}50`) : bord}` }}>
                      {c === "USD" ? "$ USD" : "KES"}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Reveal>
            <Reveal delay={0.06}>
              <EmailCalculator dark={dark} currency={currency} rate={effectiveRate} surface={surface} bord={bord} bordH={bordH} txt={txt} muted={muted} dimmer={dimmer} blue={blue} cyan={cyan} green={green} font={font} />
            </Reveal>
          </Container>
        </Box>

        {/* ══ INTEGRATIONS ════════════════════════════════════════════════════ */}
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 10, md: 14 } }}>
          <Reveal>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Integrations</Typography>
              <Typography sx={{ fontSize: { xs: "1.8rem", md: "2.6rem" }, fontWeight: 700, letterSpacing: -1, color: txt, fontFamily: display }}>
                Plays well with your stack.
              </Typography>
            </Box>
          </Reveal>
          <Reveal delay={0.05}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3,1fr)", sm: "repeat(4,1fr)", md: "repeat(6,1fr)" }, gap: 2 }}>
              {[
                { name: "Zapier", color: "#ff4a00" },
                { name: "Shopify", color: "#96bf48" },
                { name: "WordPress", color: "#21759b" },
                { name: "Salesforce", color: "#009edb" },
                { name: "HubSpot", color: "#ff7a59" },
                { name: "Stripe", color: "#635bff" },
                { name: "Slack", color: "#4a154b" },
                { name: "Webhook", color: blue },
                { name: "REST API", color: cyan },
                { name: "WooCommerce", color: "#7f54b3" },
                { name: "Mailchimp", color: "#ffe01b" },
                { name: "n8n", color: "#ea4b71" },
              ].map((intg) => (
                <Box key={intg.name} sx={{ ...cardSx, p: 2.5, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, "&:hover": { borderColor: `${intg.color}50`, transform: "translateY(-3px)", boxShadow: `0 8px 24px ${intg.color}15` } }}>
                  <Box sx={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>{BrandIcons[intg.name]}</Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: muted, fontFamily: font }}>{intg.name}</Typography>
                </Box>
              ))}
            </Box>
          </Reveal>
        </Container>

        {/* ══ API DOCS ════════════════════════════════════════════════════════ */}
        <Box id="docs" sx={{ bgcolor: surfB, borderTop: `1px solid ${bord}`, borderBottom: `1px solid ${bord}` }}>
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 12, md: 18 } }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 10 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Developer First</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3.2rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display, mb: 2 }}>
                  API built for speed.<br />Docs built for humans.
                </Typography>
                <Typography sx={{ fontSize: 15, color: muted, maxWidth: 540, mx: "auto", lineHeight: 1.8, fontFamily: font, fontWeight: 500 }}>
                  Send your first email in under 60 seconds. RESTful API, official SDKs for Node, Python, PHP, and Go — plus webhooks for every event.
                </Typography>
              </Box>
            </Reveal>

            {/* Quick-start tabs + code block */}
            <Reveal delay={0.06}>
              {(() => {
                const [activeTab, setActiveTab] = React.useState(0);
                const tabs = [
                  {
                    lang: "Node.js",
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.605.065-.037.151-.023.218.016l2.256 1.338c.082.045.198.045.275 0l8.795-5.076c.082-.047.134-.141.134-.238V7.926c0-.099-.05-.191-.134-.241l-8.794-5.072c-.081-.047-.197-.047-.276 0L3.065 7.685c-.085.05-.137.143-.137.24v10.15c0 .097.052.19.137.236l2.409 1.391c1.307.654 2.108-.116 2.108-.891V8.95c0-.143.115-.255.258-.255h1.115c.14 0 .256.112.256.255v10.862c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 20.633A1.86 1.86 0 011.354 19V8.85c0-.664.354-1.279.922-1.608l8.795-5.082c.553-.315 1.287-.315 1.838 0l8.794 5.082c.57.33.924.944.924 1.608v10.15c0 .663-.354 1.278-.924 1.607l-8.794 5.076c-.28.164-.6.247-.922.247"/></svg>,
                    code: `const chapmail = require('@chapmail/node');
const client = new chapmail.Client('ck_live_••••••••');

await client.emails.send({
  from:    'hello@yourco.com',
  to:      'user@example.com',
  subject: 'Welcome aboard!',
  html:    '<h1>You\\'re in.</h1><p>Thanks for joining.</p>',
});
// { id: 'msg_01J...', status: 'queued' }`,
                  },
                  {
                    lang: "Python",
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.83l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.23l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.26-.02.21-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.37.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25c-.73 0-1.32.59-1.32 1.32s.59 1.32 1.32 1.32 1.32-.59 1.32-1.32-.59-1.32-1.32-1.32z"/></svg>,
                    code: `import chapmail

client = chapmail.Client("ck_live_••••••••")

response = client.emails.send(
    from_email="hello@yourco.com",
    to="user@example.com",
    subject="Welcome aboard!",
    html="<h1>You're in.</h1><p>Thanks for joining.</p>"
)
# {'id': 'msg_01J...', 'status': 'queued'}`,
                  },
                  {
                    lang: "cURL",
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>,
                    code: `curl -X POST https://api.chapmail.io/v1/emails \\
  -H "Authorization: Bearer ck_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from":    "hello@yourco.com",
    "to":      "user@example.com",
    "subject": "Welcome aboard!",
    "html":    "<h1>You\\'re in.</h1>"
  }'
# { "id": "msg_01J...", "status": "queued" }`,
                  },
                  {
                    lang: "PHP",
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.824-.124-1.06-.172-.235-.477-.225-.524-.225h-.523zm6.886 0h-.942l-.515 2.648h.837c.557 0 .971-.105 1.243-.314.272-.21.455-.559.549-1.049.092-.47.051-.824-.123-1.06-.174-.235-.478-.225-.525-.225h-.524zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM7.557 15.443H5.934L7.187 8.56h1.563c.65 0 1.143.115 1.48.344.336.228.523.527.558.897.035.37-.049.706-.25 1.007-.203.301-.506.541-.91.719.414.172.7.407.857.707.158.299.178.644.06 1.036-.2.667-.617 1.014-1.249 1.173h-1.739zm7.064 0h-1.619l1.253-6.883h1.563c.65 0 1.143.115 1.48.344.337.228.523.527.559.897.035.37-.05.706-.251 1.007-.203.301-.506.541-.91.719.414.172.701.407.857.707.158.299.178.644.06 1.036-.2.667-.617 1.014-1.249 1.173h-.743z"/></svg>,
                    code: `<?php
use Chapmail\\Client;

$client = new Client('ck_live_••••••••');

$response = $client->emails->send([
  'from'    => 'hello@yourco.com',
  'to'      => 'user@example.com',
  'subject' => 'Welcome aboard!',
  'html'    => '<h1>You\\'re in.</h1>',
]);
// ['id' => 'msg_01J...', 'status' => 'queued']`,
                  },
                ];

                return (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1.1fr" }, gap: 4, alignItems: "start" }}>
                    {/* Left — endpoint reference cards */}
                    {(() => {
                      const [openEp, setOpenEp] = React.useState<string | null>(null);
                      const endpoints = [
                        {
                          method: "POST", path: "/v1/emails", desc: "Send a transactional or marketing email", color: green,
                          reqBody: `{
  "from":    "hello@yourco.com",
  "to":      ["user@example.com"],
  "subject": "Welcome aboard!",
  "html":    "<h1>You're in.</h1>",
  "tags":    ["onboarding"],
  "track_opens":  true,
  "track_clicks": true
}`,
                          resBody: `{
  "id":         "msg_01JXKR9T...",
  "status":     "queued",
  "created_at": "2025-05-14T10:22:01Z"
}`,
                        },
                        {
                          method: "GET",  path: "/v1/emails/:id", desc: "Retrieve delivery status & metadata", color: blue,
                          reqBody: `// No request body — pass message ID in URL:
// GET /v1/emails/msg_01JXKR9T...`,
                          resBody: `{
  "id":           "msg_01JXKR9T...",
  "status":       "delivered",
  "to":           "user@example.com",
  "opened_at":    "2025-05-14T10:22:45Z",
  "clicked_at":   null,
  "bounce_type":  null
}`,
                        },
                        {
                          method: "POST", path: "/v1/campaigns", desc: "Create and schedule a broadcast campaign", color: cyan,
                          reqBody: `{
  "name":         "May Newsletter",
  "subject":      "What's new in May",
  "from":         "team@yourco.com",
  "list_ids":     ["lst_active_subscribers"],
  "template_id":  "tpl_newsletter_v2",
  "schedule_at":  "2025-05-20T09:00:00Z"
}`,
                          resBody: `{
  "id":         "cmp_01JY3...",
  "status":     "scheduled",
  "send_at":    "2025-05-20T09:00:00Z",
  "recipients": 24580
}`,
                        },
                        {
                          method: "GET",  path: "/v1/analytics/summary", desc: "Pull open, click, bounce aggregates", color: "#a78bfa",
                          reqBody: `// Query params:
// ?campaign_id=cmp_01JY3...
// &from=2025-05-01&to=2025-05-31`,
                          resBody: `{
  "sent":           24580,
  "delivered":      24391,
  "opened":         6972,
  "clicked":        1021,
  "bounced":        189,
  "open_rate":      0.2857,
  "click_rate":     0.0418
}`,
                        },
                        {
                          method: "POST", path: "/v1/contacts/import", desc: "Bulk import contacts with list assignment", color: "#f97316",
                          reqBody: `{
  "list_id": "lst_subscribers",
  "contacts": [
    { "email": "a@co.com", "name": "Alice" },
    { "email": "b@co.com", "name": "Bob" }
  ],
  "update_existing": true
}`,
                          resBody: `{
  "imported":   2,
  "updated":    0,
  "skipped":    0,
  "job_id":     "job_import_01JY..."
}`,
                        },
                        {
                          method: "POST", path: "/v1/webhooks", desc: "Register a URL for real-time event delivery", color: "#ec4899",
                          reqBody: `{
  "url":    "https://yourco.com/hooks/chapmail",
  "events": [
    "email.delivered",
    "email.opened",
    "email.bounced"
  ],
  "secret": "whsec_your_signing_secret"
}`,
                          resBody: `{
  "id":      "wh_01JY5...",
  "url":     "https://yourco.com/hooks/chapmail",
  "status":  "active",
  "events":  ["email.delivered","email.opened","email.bounced"]
}`,
                        },
                      ];
                      return (
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: dimmer, textTransform: "uppercase", letterSpacing: 2, mb: 3, fontFamily: font }}>Core endpoints</Typography>
                          <Stack spacing={1.5}>
                            {endpoints.map((ep) => {
                              const isOpen = openEp === ep.path;
                              return (
                                <Box key={ep.path} sx={{ ...cardSx, overflow: "visible", cursor: "pointer", "&:hover": { borderColor: `${ep.color}45` }, ...(isOpen && { borderColor: `${ep.color}55`, boxShadow: `0 0 24px ${ep.color}10` }) }}>
                                  {/* Header row */}
                                  <Box onClick={() => setOpenEp(isOpen ? null : ep.path)}
                                    sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box sx={{ px: 1.2, py: 0.3, borderRadius: 1, bgcolor: `${ep.color}15`, border: `1px solid ${ep.color}30`, flexShrink: 0, minWidth: 52, textAlign: "center" }}>
                                      <Typography sx={{ fontSize: 10, fontWeight: 900, color: ep.color, fontFamily: "monospace", letterSpacing: 0.5 }}>{ep.method}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: txt, fontFamily: "monospace", mb: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</Typography>
                                      <Typography sx={{ fontSize: 11.5, color: muted, fontFamily: font }}>{ep.desc}</Typography>
                                    </Box>
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: `${ep.color}12`, border: `1px solid ${ep.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                                      <ExpandMoreOutlined sx={{ fontSize: 14, color: ep.color }} />
                                    </Box>
                                  </Box>

                                  {/* Expandable JSON body */}
                                  <Collapse in={isOpen}>
                                    <Box sx={{ borderTop: `1px solid ${ep.color}20`, mx: 0 }}>
                                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                        {/* Request */}
                                        <Box sx={{ p: 2, borderRight: { sm: `1px solid ${ep.color}15` } }}>
                                          <Typography sx={{ fontSize: 10, fontWeight: 800, color: ep.color, textTransform: "uppercase", letterSpacing: 1.5, mb: 1.5, fontFamily: font }}>Request body</Typography>
                                          <Box sx={{ bgcolor: dark ? "#060810" : "#0f172a", borderRadius: 1.5, p: 1.5, overflow: "auto" }}>
                                            {ep.reqBody.split("\n").map((line, li) => (
                                              <Typography key={li} component="div"
                                                sx={{ fontSize: 11, lineHeight: 1.75, color: "#e2e8f0", fontFamily: "monospace", whiteSpace: "pre" }}
                                                dangerouslySetInnerHTML={{ __html: line
                                                  .replace(/(\/\/.*$)/g, '<span style="color:#475569">$1</span>')
                                                  .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#93c5fd">$1</span>:')
                                                  .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#86efac">$1</span>')
                                                  .replace(/:\s*(true|false|null)/g, ': <span style="color:#fbbf24">$1</span>')
                                                  .replace(/:\s*(\d+)/g, ': <span style="color:#f9a8d4">$1</span>')
                                                }} />
                                            ))}
                                          </Box>
                                        </Box>
                                        {/* Response */}
                                        <Box sx={{ p: 2 }}>
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                            <Typography sx={{ fontSize: 10, fontWeight: 800, color: ep.color, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: font }}>Response</Typography>
                                            <Box sx={{ px: 1, py: 0.15, borderRadius: 99, bgcolor: `${green}15`, border: `1px solid ${green}30` }}>
                                              <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: green, fontFamily: "monospace" }}>200 OK</Typography>
                                            </Box>
                                          </Box>
                                          <Box sx={{ bgcolor: dark ? "#060810" : "#0f172a", borderRadius: 1.5, p: 1.5, overflow: "auto" }}>
                                            {ep.resBody.split("\n").map((line, li) => (
                                              <Typography key={li} component="div"
                                                sx={{ fontSize: 11, lineHeight: 1.75, color: "#e2e8f0", fontFamily: "monospace", whiteSpace: "pre" }}
                                                dangerouslySetInnerHTML={{ __html: line
                                                  .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#93c5fd">$1</span>:')
                                                  .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#86efac">$1</span>')
                                                  .replace(/:\s*(true|false|null)/g, ': <span style="color:#fbbf24">$1</span>')
                                                  .replace(/:\s*(\d+\.\d+)/g, ': <span style="color:#f9a8d4">$1</span>')
                                                  .replace(/:\s*(\d+)(?=[,\n}])/g, ': <span style="color:#f9a8d4">$1</span>')
                                                }} />
                                            ))}
                                          </Box>
                                        </Box>
                                      </Box>
                                    </Box>
                                  </Collapse>
                                </Box>
                              );
                            })}
                          </Stack>

                          {/* SDKs row */}
                          <Box sx={{ mt: 4 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: dimmer, textTransform: "uppercase", letterSpacing: 2, mb: 2.5, fontFamily: font }}>Official SDKs</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                              {[
                                { name: "Node.js", color: "#68a063" },
                                { name: "Python",  color: "#3572a5" },
                                { name: "PHP",     color: "#787cb5" },
                                { name: "Go",      color: "#00add8" },
                                { name: "Ruby",    color: "#cc342d" },
                                { name: "Java",    color: "#b07219" },
                              ].map((sdk) => (
                                <Box key={sdk.name} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 0.75, borderRadius: 99, bgcolor: `${sdk.color}10`, border: `1px solid ${sdk.color}30`, cursor: "pointer", transition: "all .15s", "&:hover": { bgcolor: `${sdk.color}18`, borderColor: `${sdk.color}55` } }}>
                                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: sdk.color }} />
                                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: sdk.color, fontFamily: font }}>{sdk.name}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* Right — interactive code block */}
                    <Box>
                      {/* Language selector */}
                      <Box sx={{ display: "flex", gap: 0, mb: 0, bgcolor: dark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)", borderRadius: "12px 12px 0 0", border: `1px solid ${bord}`, borderBottom: "none", overflow: "hidden" }}>
                        {tabs.map((t, i) => (
                          <Box key={t.lang} onClick={() => setActiveTab(i)}
                            sx={{ flex: 1, py: 1.2, px: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, cursor: "pointer", transition: "all .15s", bgcolor: activeTab === i ? (dark ? "#0d1117" : "#fff") : "transparent", borderRight: i < tabs.length - 1 ? `1px solid ${bord}` : "none", borderBottom: activeTab === i ? `2px solid ${blue}` : "none" }}>
                            <Box sx={{ color: activeTab === i ? blue : muted, display: "flex", alignItems: "center" }}>{t.icon}</Box>
                            <Typography sx={{ fontSize: 11.5, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? txt : muted, fontFamily: font }}>{t.lang}</Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Code panel */}
                      <Box sx={{ bgcolor: dark ? "#080c14" : "#0f172a", borderRadius: "0 0 12px 12px", border: `1px solid ${bord}`, p: 3, position: "relative", overflow: "hidden" }}>
                        {/* Glow */}
                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${blue},${cyan})` }} />
                        {/* Line numbers + code */}
                        <Box sx={{ display: "flex", gap: 2.5, overflowX: "auto" }}>
                          <Box sx={{ flexShrink: 0 }}>
                            {tabs[activeTab].code.split("\n").map((_, li) => (
                              <Typography key={li} sx={{ fontSize: 12.5, lineHeight: 1.85, color: dark ? "#3a4460" : "#334155", fontFamily: "monospace", userSelect: "none", textAlign: "right" }}>{li + 1}</Typography>
                            ))}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            {tabs[activeTab].code.split("\n").map((line, li) => {
                              const colored = line
                                .replace(/(\/\/.*$|#.*$)/g, '<span style="color:#6b7a99">$1</span>')
                                .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color:#22c55e">$1</span>')
                                .replace(/\b(const|let|var|await|import|from|require|async|function|return|use|new)\b/g, '<span style="color:#a78bfa">$1</span>')
                                .replace(/\b(true|false|null|None|False|True)\b/g, '<span style="color:#f97316">$1</span>');
                              return (
                                <Typography key={li} component="div" sx={{ fontSize: 12.5, lineHeight: 1.85, color: "#e2e8f0", fontFamily: "monospace", whiteSpace: "pre" }}
                                  dangerouslySetInnerHTML={{ __html: colored }} />
                              );
                            })}
                          </Box>
                        </Box>

                        {/* Copy button */}
                        <Box onClick={() => navigator.clipboard?.writeText(tabs[activeTab].code)}
                          sx={{ position: "absolute", top: 16, right: 16, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", gap: 0.75, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          <Typography sx={{ fontSize: 11, color: "#94a3b8", fontFamily: font, fontWeight: 600 }}>Copy</Typography>
                        </Box>
                      </Box>

                      {/* Response time / rate limit badges */}
                      <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
                        {[
                          { icon: <SpeedOutlined sx={{ fontSize: 13 }} />, label: "Avg response < 80 ms", color: green },
                          { icon: <SecurityOutlined sx={{ fontSize: 13 }} />, label: "TLS 1.3 encrypted", color: blue },
                          { icon: <AutoGraphOutlined sx={{ fontSize: 13 }} />, label: "Rate limit: 1,000 req/s", color: "#a78bfa" },
                        ].map((b) => (
                          <Box key={b.label} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.6, borderRadius: 99, bgcolor: `${b.color}10`, border: `1px solid ${b.color}28` }}>
                            <Box sx={{ color: b.color }}>{b.icon}</Box>
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: b.color, fontFamily: font }}>{b.label}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                );
              })()}
            </Reveal>

            {/* Webhook events grid */}
            <Reveal delay={0.1}>
              <Box sx={{ mt: 10 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: dimmer, textTransform: "uppercase", letterSpacing: 2, mb: 4, fontFamily: font, textAlign: "center" }}>Webhook events</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3,1fr)", md: "repeat(6,1fr)" }, gap: 1.5 }}>
                  {[
                    { event: "email.delivered", color: green },
                    { event: "email.opened",    color: blue },
                    { event: "email.clicked",   color: cyan },
                    { event: "email.bounced",   color: "#f97316" },
                    { event: "email.complaint", color: "#ec4899" },
                    { event: "email.unsubscribed", color: "#a78bfa" },
                  ].map((ev) => (
                    <Box key={ev.event} sx={{ ...cardSx, p: 1.75, textAlign: "center", "&:hover": { borderColor: `${ev.color}45`, transform: "translateY(-2px)" } }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ev.color, mx: "auto", mb: 1, boxShadow: `0 0 8px ${ev.color}` }} />
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: muted, fontFamily: "monospace" }}>{ev.event}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Reveal>

            {/* Full docs CTA */}
            <Reveal delay={0.12}>
              <Box sx={{ mt: 8, textAlign: "center" }}>
                <Button variant="outlined" endIcon={<ArrowForward />}
                  onClick={() => window.open("https://docs.chapmail.io", "_blank")}
                  sx={{ borderColor: `${blue}50`, color: blue, fontWeight: 700, fontSize: 14, borderRadius: 2, px: 3.5, py: 1.3, fontFamily: font, "&:hover": { borderColor: blue, bgcolor: blueDim } }}>
                  Read the full API reference
                </Button>
              </Box>
            </Reveal>
          </Container>
        </Box>

        {/* ══ TESTIMONIALS ════════════════════════════════════════════════════ */}
        <Box sx={{ bgcolor: surfB, py: { xs: 12, md: 18 }, borderTop: `1px solid ${bord}` }}>
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 10 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Wall of love</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, fontFamily: display }}>Teams that swear by it.</Typography>
              </Box>
            </Reveal>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {[
                { quote: "ChapMail's deliverability is in a class of its own. Our open rates jumped 18% the first month after switching. The IP warmup tooling alone saved us weeks of manual work.", name: "Sarah K.", role: "Head of Growth", company: "TechFlow SaaS", avatar: "SK", color: blue },
                { quote: "We send 2 million emails a month and the uptime has been flawless. The reseller dashboard lets us manage 40+ client accounts from a single login — genuinely game-changing.", name: "Marcus O.", role: "CEO", company: "SendLoop Agency", avatar: "MO", color: cyan },
                { quote: "The migration was zero-drama. Real-time analytics showed us issues we didn't even know we had. Inbox placement went from 87% to 99% within the first two weeks.", name: "Priya N.", role: "Email Marketing Lead", company: "CloudBase", avatar: "PN", color: "#a78bfa" },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 0.1}>
                  <Box sx={{ ...cardSx, p: 3.5, height: "100%", display: "flex", flexDirection: "column", "&:hover": { borderColor: `${t.color}40`, transform: "translateY(-4px)" } }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${t.color}70,transparent)` }} />
                    <FormatQuoteOutlined sx={{ fontSize: 32, color: t.color, mb: 2, opacity: 0.7 }} />
                    <Typography sx={{ fontSize: 14, color: muted, lineHeight: 1.8, fontFamily: font, fontStyle: "italic", flex: 1, mb: 3 }}>"{t.quote}"</Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: `${t.color}20`, border: `2px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: t.color, fontFamily: display }}>{t.avatar}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: txt, fontFamily: font }}>{t.name}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: muted, fontFamily: font }}>{t.role} · {t.company}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        {/* ══ BLOGS ═══════════════════════════════════════════════════════════ */}
        <Box id="blogs">
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 12, md: 18 } }}>
            <Reveal>
              <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 10, flexWrap: "wrap", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>From the blog</Typography>
                  <Typography sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display }}>
                    Insights from the<br />deliverability trenches.
                  </Typography>
                </Box>
                <Button variant="outlined" endIcon={<ArrowForward />}
                  sx={{ borderColor: `${blue}50`, color: blue, fontWeight: 700, fontSize: 13, borderRadius: 2, px: 2.5, py: 1.1, fontFamily: font, flexShrink: 0, "&:hover": { borderColor: blue, bgcolor: blueDim } }}>
                  All articles
                </Button>
              </Box>
            </Reveal>

            {/* Featured post */}
            <Reveal delay={0.04}>
              <Box sx={{ ...cardSx, mb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, overflow: "hidden", "&:hover": { borderColor: `${blue}40`, boxShadow: `0 0 40px ${blue}10, 0 20px 40px rgba(0,0,0,.14)`, transform: "translateY(-4px)" } }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${blue}80,transparent)` }} />
                {/* Visual panel */}
                <Box sx={{ bgcolor: dark ? "#0d1626" : "#dbeafe", minHeight: { xs: 220, md: "auto" }, display: "flex", alignItems: "center", justifyContent: "center", p: 5, position: "relative", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", top: "20%", left: "15%", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${blue}35,transparent)`, filter: "blur(40px)" }} />
                  <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                    <MailOutlineOutlined sx={{ fontSize: 64, color: blue, opacity: 0.9 }} />
                    <Box sx={{ mt: 2, px: 2, py: 0.6, borderRadius: 99, bgcolor: `${blue}18`, border: `1px solid ${blue}40`, display: "inline-block" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: blue, fontFamily: font }}>15 min read</Typography>
                    </Box>
                  </Box>
                </Box>
                {/* Content panel */}
                <Box sx={{ p: { xs: 3, md: 5 } }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap">
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: 99, bgcolor: `${blue}10`, border: `1px solid ${blue}25` }}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: blue, fontFamily: font }}>Deliverability</Typography>
                    </Box>
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: 99, bgcolor: `${cyan}10`, border: `1px solid ${cyan}25` }}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cyan, fontFamily: font }}>Featured</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700, color: txt, fontFamily: display, lineHeight: 1.25, mb: 2, letterSpacing: -0.5 }}>
                    The definitive guide to inbox placement in 2025
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: muted, lineHeight: 1.8, mb: 3.5, fontFamily: font }}>
                    Inbox placement dropped an average of 4 points across ESPs in Q1. We analysed 2 billion sends to find out exactly why — and what you can do to stay above 98%.
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: `${blue}20`, border: `2px solid ${blue}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: blue, fontFamily: display }}>AO</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: txt, fontFamily: font }}>Alex Omondi</Typography>
                      <Typography sx={{ fontSize: 11.5, color: muted, fontFamily: font }}>Head of Deliverability · May 14, 2025</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: blue, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
                    Read the full guide <ArrowForward sx={{ fontSize: 15 }} />
                  </Box>
                </Box>
              </Box>
            </Reveal>

            {/* Secondary posts grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3,1fr)" }, gap: 2 }}>
              {[
                {
                  tag: "Automation", tagColor: cyan, readTime: "8 min",
                  title: "Drip vs. broadcast: when to use which (and how to blend both)",
                  excerpt: "Most teams default to one or the other. Here's the framework we use with our highest-performing clients to decide when each strategy wins.",
                  author: "Wanjiru K.", authorInitials: "WK", date: "May 8, 2025", color: cyan,
                  Icon: AutoGraphOutlined,
                },
                {
                  tag: "Engineering", tagColor: "#a78bfa", readTime: "6 min",
                  title: "How we achieve sub-100ms API response times at 50B sends/month",
                  excerpt: "A behind-the-scenes look at our multi-region queuing architecture, adaptive rate shaping, and the lessons learned scaling to global infrastructure.",
                  author: "Brian M.", authorInitials: "BM", date: "Apr 29, 2025", color: "#a78bfa",
                  Icon: SpeedOutlined,
                },
                {
                  tag: "Compliance", tagColor: green, readTime: "10 min",
                  title: "GDPR, CAN-SPAM, and CASL: a plain-English compliance checklist for 2025",
                  excerpt: "Regulations tightened again this year. We break down exactly what has changed, what still applies, and the five steps every sender should take today.",
                  author: "Amira S.", authorInitials: "AS", date: "Apr 17, 2025", color: green,
                  Icon: SecurityOutlined,
                },
                {
                  tag: "Analytics", tagColor: "#f97316", readTime: "7 min",
                  title: "Beyond open rates: the five engagement signals that actually predict revenue",
                  excerpt: "Open rates are gamed by Apple MPP. We walk through the alternative metrics that correlate far more strongly with conversion — and how to track them.",
                  author: "Alex Omondi", authorInitials: "AO", date: "Apr 9, 2025", color: "#f97316",
                  Icon: TrendingUpOutlined,
                },
                {
                  tag: "Growth", tagColor: "#ec4899", readTime: "5 min",
                  title: "The re-engagement campaign template that won back 22% of lapsed subscribers",
                  excerpt: "We split-tested 11 subject line strategies and 4 send-time windows across 400k lapsed users. Here's the exact playbook that outperformed everything else.",
                  author: "Wanjiru K.", authorInitials: "WK", date: "Apr 2, 2025", color: "#ec4899",
                  Icon: RocketLaunchOutlined,
                },
                {
                  tag: "Deliverability", tagColor: blue, readTime: "9 min",
                  title: "IP warmup in 2025: the updated schedule Gmail and Outlook actually respect",
                  excerpt: "The old 30-day warmup spreadsheet is obsolete. Postmaster Tools data from 120 warmups reveals the cadence that builds sender reputation fastest without triggering filters.",
                  author: "Brian M.", authorInitials: "BM", date: "Mar 26, 2025", color: blue,
                  Icon: VerifiedOutlined,
                },
              ].map((post, i) => (
                <Reveal key={post.title} delay={i * 0.06}>
                  <Box sx={{ ...cardSx, p: 3, height: "100%", display: "flex", flexDirection: "column", cursor: "pointer", "&:hover": { borderColor: `${post.color}45`, boxShadow: `0 0 30px ${post.color}10, 0 16px 32px rgba(0,0,0,.12)`, transform: "translateY(-4px)" } }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${post.color}70,transparent)` }} />
                    {/* Top row: tag + read time */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${post.color}12`, border: `1px solid ${post.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: post.color }}>
                          <post.Icon sx={{ fontSize: 16 }} />
                        </Box>
                        <Box sx={{ px: 1.1, py: 0.25, borderRadius: 99, bgcolor: `${post.tagColor}10`, border: `1px solid ${post.tagColor}25` }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: post.tagColor, fontFamily: font }}>{post.tag}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: dimmer, fontFamily: font }}>{post.readTime} read</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: txt, fontFamily: display, lineHeight: 1.3, mb: 1.5, letterSpacing: -0.3, flex: 1 }}>{post.title}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: muted, lineHeight: 1.75, fontFamily: font, mb: 3 }}>{post.excerpt}</Typography>
                    {/* Author + date */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: `${post.color}18`, border: `1.5px solid ${post.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: post.color, fontFamily: display }}>{post.authorInitials}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: txt, fontFamily: font, lineHeight: 1.2 }}>{post.author}</Typography>
                          <Typography sx={{ fontSize: 10.5, color: dimmer, fontFamily: font }}>{post.date}</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: post.color, fontSize: 12, fontWeight: 700, fontFamily: font }}>
                        Read <ArrowForward sx={{ fontSize: 13 }} />
                      </Box>
                    </Box>
                  </Box>
                </Reveal>
              ))}
            </Box>

            {/* Newsletter signup */}
            <Reveal delay={0.1}>
              <Box sx={{ mt: 6, ...cardSx, p: { xs: 3.5, md: 5 }, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 4, background: dark ? `linear-gradient(135deg,rgba(37,99,235,0.08),rgba(6,182,212,0.05))` : `linear-gradient(135deg,rgba(37,99,235,0.04),rgba(6,182,212,0.03))` }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${blue},${cyan})` }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 700, color: txt, fontFamily: display, mb: 0.75, letterSpacing: -0.5 }}>
                    Deliverability insights, weekly.
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: muted, fontFamily: font, lineHeight: 1.7 }}>
                    Join 12,000+ senders who get our Friday digest — no fluff, just tactics that move the inbox placement needle.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
                  <Box sx={{ height: 44, px: 2, borderRadius: 1.5, border: `1.5px solid ${bord}`, bgcolor: surface, display: "flex", alignItems: "center", minWidth: 240, "&:focus-within": { borderColor: blue } }}>
                    <MailOutlineOutlined sx={{ fontSize: 16, color: dimmer, mr: 1 }} />
                    <Typography component="input" placeholder="you@company.com"
                      sx={{ border: "none", outline: "none", bgcolor: "transparent", color: txt, fontSize: 13.5, fontFamily: font, width: "100%", "&::placeholder": { color: dimmer } }} />
                  </Box>
                  <Button variant="contained"
                    sx={{ bgcolor: blue, color: "#fff", fontWeight: 700, fontSize: 13.5, px: 3, height: 44, borderRadius: 1.5, fontFamily: font, whiteSpace: "nowrap", boxShadow: `0 4px 16px ${blue}40`, "&:hover": { bgcolor: blueL } }}>
                    Subscribe free
                  </Button>
                </Box>
              </Box>
            </Reveal>
          </Container>
        </Box>

        {/* ══ PRICING ═════════════════════════════════════════════════════════ */}
        <Box id="pricing" sx={{ position: "relative", zIndex: 1, py: { xs: 12, md: 18 } }}>
          <Container maxWidth="lg">
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 8 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Simple pricing</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3.2rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, lineHeight: 1.1, fontFamily: display, mb: 2 }}>
                  Pick your plan.<br />Scale without fear.
                </Typography>
                <Typography sx={{ fontSize: 15, color: muted, maxWidth: 500, mx: "auto", fontFamily: font, fontWeight: 500, mb: 2 }}>
                  Start free. No credit card required.
                  {currency === "KES" && <Box component="span" sx={{ display: "block", fontSize: 12, color: dimmer, mt: 0.5 }}>Prices in KES · Live: 1 USD = KES {effectiveRate.toFixed(2)}</Box>}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0, bgcolor: surfB, border: `1px solid ${bord}`, borderRadius: 99, p: 0.5 }}>
                    {(["USD", "KES"] as Currency[]).map((c) => (
                      <Box key={c} onClick={() => setCurrency(c)}
                        sx={{ px: 2, py: 0.65, borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: font, bgcolor: currency === c ? (c === "KES" ? "#22c55e" : blue) : "transparent", color: currency === c ? "#fff" : muted, boxShadow: currency === c ? `0 2px 12px ${c === "KES" ? "#22c55e45" : `${blue}45`}` : "none" }}>
                        {c === "USD" ? "$ USD" : "KES"}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0, bgcolor: surfB, border: `1px solid ${bord}`, borderRadius: 99, p: 0.5 }}>
                    {[{ label: "Monthly", val: false }, { label: "Annually", val: true }].map((opt) => (
                      <Box key={opt.label} onClick={() => setAnnual(opt.val)}
                        sx={{ px: 2.5, py: 0.75, borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: font, bgcolor: annual === opt.val ? blue : "transparent", color: annual === opt.val ? "#fff" : muted, boxShadow: annual === opt.val ? `0 2px 12px ${blue}45` : "none" }}>
                        {opt.label}{opt.val && <Box component="span" sx={{ ml: 0.6, fontSize: 10, fontWeight: 800, color: annual ? green : muted }}>−20%</Box>}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Reveal>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2.5, alignItems: "start" }}>
              {[
                { name: "Trial", priceUSD: prices.starter, tagline: "Experience the full power of ChapMail for 30 days.", accent: cyan, popular: false, cta: "Start 1-month trial", ctaV: "outlined", period: "/ 30 days", features: ["Full access for 30 days", "5,000 emails included", "1 sending domain", "Basic analytics dashboard", "Email support (48h SLA)", "1 user seat"] },
                { name: "Growth", priceUSD: prices.growth, tagline: "For growing teams that need serious deliverability.", accent: blue, popular: true, cta: "Start 14-day free trial", ctaV: "contained", period: "/mo", features: ["100,000 emails/month", "5 sending domains", "Advanced analytics + exports", "A/B testing (subject & content)", "5 user seats", "Priority support (4h SLA)", "Visual automation flows", "Webhook & Zapier integrations", "IP warmup scheduler"] },
                { name: "Scale", priceUSD: prices.scale, tagline: "High-volume senders, agencies, and resellers.", accent: "#a78bfa", popular: false, cta: "Start 14-day free trial", ctaV: "outlined", period: "/mo", features: ["1,000,000 emails/month", "Unlimited sending domains", "Full analytics suite + BI export", "Reseller white-label dashboard", "Unlimited user seats", "Dedicated IP(s) + warmup", "24/7 phone & Slack support", "Custom contracts & SLA", "SSO / SAML"] },
              ].map((plan, i) => {
                const displayPrice = plan.priceUSD === 0 ? (currency === "USD" ? "$0" : "KES 0") : price(plan.priceUSD);
                return (
                  <Reveal key={plan.name} delay={i * 0.08}>
                    <Box sx={{ ...cardSx, p: 3.5, ...(plan.popular && { borderColor: `${blue}55`, boxShadow: `0 0 55px ${blue}18, 0 24px 48px rgba(0,0,0,.18)`, transform: { md: "scale(1.035)" } }), "&:hover": { borderColor: `${plan.accent}55`, boxShadow: `0 0 40px ${plan.accent}14, 0 20px 40px rgba(0,0,0,.15)`, transform: plan.popular ? { md: "scale(1.04) translateY(-3px)" } : "translateY(-5px)" } }}>
                      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: plan.popular ? 3 : 2, background: `linear-gradient(90deg,transparent,${plan.accent}${plan.popular ? "cc" : "70"},transparent)` }} />
                      {plan.popular && (
                        <Box sx={{ position: "absolute", top: 18, right: 18, px: 1.5, py: 0.4, borderRadius: 99, bgcolor: `${blue}18`, border: `1px solid ${blue}50` }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 800, color: blue, fontFamily: font }}>Most popular</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "inline-block", px: 1.25, py: 0.35, borderRadius: 1, bgcolor: `${plan.accent}12`, border: `1px solid ${plan.accent}28`, mb: 2 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: plan.accent, textTransform: "uppercase", letterSpacing: 1, fontFamily: font }}>{plan.name}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.75 }}>
                        <Typography sx={{ fontSize: currency === "KES" ? 28 : 44, fontWeight: 700, color: txt, letterSpacing: -2, lineHeight: 1, fontFamily: display }}>{displayPrice}</Typography>
                        <Typography sx={{ fontSize: 13, color: muted, fontWeight: 600, fontFamily: font }}>{plan.period}</Typography>
                      </Box>
                      {annual && plan.name !== "Trial" && <Typography sx={{ fontSize: 11, color: green, fontWeight: 700, fontFamily: font, mb: 0.5 }}>Save 20% with annual billing</Typography>}
                      <Typography sx={{ fontSize: 13, color: muted, mb: 3, lineHeight: 1.65, fontFamily: font }}>{plan.tagline}</Typography>
                      <Button onClick={() => navigate(user ? "/app/dashboard" : "/register")} fullWidth variant={plan.ctaV as any}
                        sx={plan.ctaV === "contained" ? { bgcolor: blue, color: "#fff", fontWeight: 800, py: 1.35, borderRadius: 2, fontFamily: font, boxShadow: `0 6px 22px ${blue}40`, mb: 3, "&:hover": { bgcolor: blueL } } : { borderColor: `${plan.accent}55`, color: plan.accent, fontWeight: 800, py: 1.35, borderRadius: 2, fontFamily: font, mb: 3, "&:hover": { borderColor: plan.accent, bgcolor: `${plan.accent}0d` } }}>
                        {plan.cta}
                      </Button>
                      <Box sx={{ height: 1, bgcolor: bord, mb: 2.5 }} />
                      <Stack spacing={1.35}>
                        {plan.features.map((f) => (
                          <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                            <CheckRounded sx={{ fontSize: 15, color: plan.accent, flexShrink: 0, mt: 0.15 }} />
                            <Typography sx={{ fontSize: 13, color: muted, fontFamily: font, lineHeight: 1.5 }}>{f}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Reveal>
                );
              })}
            </Box>

            <Reveal delay={0.15}>
              <Box sx={{ mt: 4, ...cardSx, p: { xs: 3, md: 4.5 }, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 3, "&:hover": { borderColor: bordH } }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${dimmer}55,transparent)` }} />
                <Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: txt, mb: 0.75, fontFamily: display }}>Need more? Let's talk enterprise.</Typography>
                  <Typography sx={{ fontSize: 13.5, color: muted, fontFamily: font, lineHeight: 1.7 }}>Custom send volumes · Dedicated infrastructure · SSO/SAML · Custom contracts · White-glove migration.</Typography>
                </Box>
                <Button variant="outlined" endIcon={<ArrowForward />}
                  sx={{ borderColor: bord, color: txt, fontWeight: 700, fontSize: 13.5, borderRadius: 1.75, px: 3.5, py: 1.2, flexShrink: 0, fontFamily: font, "&:hover": { borderColor: bordH } }}>
                  Contact sales
                </Button>
              </Box>
            </Reveal>
          </Container>
        </Box>

        {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
        <Box sx={{ bgcolor: surfB, py: { xs: 12, md: 18 }, borderTop: `1px solid ${bord}`, borderBottom: `1px solid ${bord}` }}>
          <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
            <Reveal>
              <Box sx={{ textAlign: "center", mb: 8 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 2, fontFamily: font }}>Questions</Typography>
                <Typography sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 700, letterSpacing: -1.5, color: txt, fontFamily: display }}>Frequently asked.</Typography>
              </Box>
            </Reveal>
            <Stack spacing={1.5}>
              {[
                { q: 'What counts as a "sent email"?', a: 'Every email successfully handed off to our SMTP infrastructure counts as one sent email. Hard bounces are automatically suppressed from future sends to protect your sender reputation.' },
                { q: 'Can I bring my own domain and IP?', a: 'Yes. You can add custom sending domains, verify ownership via DNS, and on Scale/Enterprise plans provision dedicated IPs with our automated warmup scheduler to build sender reputation progressively.' },
                { q: 'What happens when I hit my monthly limit?', a: "You'll receive email alerts at 80% and 95% of your limit. When the limit is reached, sends are queued — they don't fail. You can purchase additional quota or upgrade your plan instantly." },
                { q: 'How does the 14-day free trial work?', a: 'Sign up for any paid plan and get full access for 14 days with no credit card required. At the end of the trial you can subscribe or downgrade to Starter without losing your data.' },
                { q: 'Do you support transactional email?', a: 'Absolutely. ChapMail handles both marketing campaigns and transactional emails (order confirmations, password resets, notifications) via the same API, with separate IP pools to protect each reputation.' },
                { q: 'Is there a white-label / reseller option?', a: 'Yes — the Scale plan and dedicated Reseller plan let you operate ChapMail under your own brand with custom domain login, your logo throughout the UI, and full client account management.' },
                { q: 'What compliance standards do you meet?', a: 'ChapMail is GDPR-compliant, CAN-SPAM compliant, and CASL-ready. We offer DPA agreements, EU data residency options, and automated unsubscribe list management on all plans.' },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.04}>
                  <Box sx={{ ...cardSx, overflow: "visible", "&:hover": { borderColor: bordH } }}>
                    <Box onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: { xs: 2.5, md: 3 }, cursor: "pointer", gap: 2 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: txt, fontFamily: font, lineHeight: 1.45 }}>{item.q}</Typography>
                      {openFaq === i
                        ? <ExpandLessOutlined sx={{ fontSize: 20, color: blue, flexShrink: 0 }} />
                        : <ExpandMoreOutlined sx={{ fontSize: 20, color: muted, flexShrink: 0 }} />}
                    </Box>
                    <Collapse in={openFaq === i}>
                      <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 3, pt: 0, borderTop: `1px solid ${bord}` }}>
                        <Typography sx={{ fontSize: 14, color: muted, lineHeight: 1.8, fontFamily: font, pt: 2 }}>{item.a}</Typography>
                      </Box>
                    </Collapse>
                  </Box>
                </Reveal>
              ))}
            </Stack>
          </Container>
        </Box>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <Reveal>
          <Box sx={{ position: "relative", zIndex: 1, py: { xs: 14, md: 22 }, overflow: "hidden", textAlign: "center" }}>
            <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60vw", height: "60vw", background: `radial-gradient(circle,${blue}14 0%,transparent 60%)`, filter: "blur(70px)", zIndex: 0 }} />
            <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: blue, textTransform: "uppercase", letterSpacing: 3.5, mb: 3, fontFamily: font }}>Ready?</Typography>
              <Typography sx={{ fontSize: { xs: "2.4rem", md: "4rem" }, fontWeight: 700, letterSpacing: -2, color: txt, lineHeight: 1.08, mb: 3, fontFamily: display }}>
                Your next campaign<br />deserves to land.
              </Typography>
              <Typography sx={{ fontSize: 17, color: muted, mb: 6, lineHeight: 1.7, fontFamily: font, fontWeight: 500, maxWidth: 500, mx: "auto" }}>
                Join 10,000+ teams who stopped gambling with deliverability. Start free, scale when ready.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center">
                {user ? (
                  <Button onClick={() => navigate("/app/dashboard")} variant="contained" endIcon={<ArrowForward />}
                    sx={{ bgcolor: blue, color: "#fff", fontWeight: 900, fontSize: 16, px: 5.5, py: 1.85, borderRadius: 2.5, fontFamily: font, boxShadow: `0 14px 40px ${blue}52`, "&:hover": { bgcolor: blueL, transform: "scale(1.03)" }, transition: "all .2s" }}>
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => navigate("/register")} variant="contained" endIcon={<ArrowForward />}
                      sx={{ bgcolor: blue, color: "#fff", fontWeight: 900, fontSize: 16, px: 5.5, py: 1.85, borderRadius: 2.5, fontFamily: font, boxShadow: `0 14px 40px ${blue}52`, "&:hover": { bgcolor: blueL, transform: "scale(1.03)" }, transition: "all .2s" }}>
                      Create free account
                    </Button>
                    <Button onClick={() => navigate("/login")} variant="text"
                      sx={{ color: muted, fontWeight: 700, fontSize: 14, px: 3.5, py: 1.85, borderRadius: 2.5, fontFamily: font, border: `1.5px solid ${bord}`, "&:hover": { color: txt, borderColor: bordH } }}>
                      Sign in →
                    </Button>
                  </>
                )}
              </Stack>
              <Typography sx={{ mt: 3.5, fontSize: 11.5, color: dimmer, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: font, fontWeight: 600 }}>
                No credit card · 5,000 emails/mo free forever · Cancel anytime
              </Typography>
            </Container>
          </Box>
        </Reveal>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <Box component="footer" sx={{ position: "relative", zIndex: 1, borderTop: `1px solid ${bord}`, bgcolor: surface, px: { xs: 3, md: 8 }, pt: 7, pb: 5 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "flex-start" }, justifyContent: "space-between", gap: 5, mb: 6 }}>

            {/* Brand column */}
            <Box sx={{ maxWidth: 260 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <Box component="img" src="/favicon.png" alt="ChapMail" sx={{ width: 34, height: 34, borderRadius: 1.5, objectFit: "contain" }} />
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: txt, fontFamily: display }}>ChapMail</Typography>
              </Stack>
              <Typography sx={{ fontSize: 13, color: muted, lineHeight: 1.75, fontFamily: font, mb: 2.5 }}>
                Infrastructure-grade email for teams that can't afford to miss.
              </Typography>
              <Stack direction="row" spacing={1.25}>
                {[
                  { key: "x",  svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { key: "li", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                  { key: "yt", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
                ].map((s) => (
                  <Box key={s.key} sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: surfB, border: `1px solid ${bord}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: muted, transition: "all .15s", "&:hover": { borderColor: bordH, color: txt } }}>{s.svg}</Box>
                ))}
              </Stack>
            </Box>

            {/* Nav links — only what exists on this page */}
            <Box sx={{ display: "flex", gap: { xs: 4, md: 8 }, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: txt, textTransform: "uppercase", letterSpacing: 1.5, mb: 2, fontFamily: font }}>On this page</Typography>
                <Stack spacing={1.25}>
                  {navLinks.map((l) => (
                    <Typography key={l.id} onClick={() => scrollTo(l.id)}
                      sx={{ fontSize: 13.5, color: muted, cursor: "pointer", fontFamily: font, fontWeight: 500, "&:hover": { color: txt }, transition: "color .15s" }}>
                      {l.label}
                    </Typography>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: txt, textTransform: "uppercase", letterSpacing: 1.5, mb: 2, fontFamily: font }}>Account</Typography>
                <Stack spacing={1.25}>
                  <Typography onClick={() => navigate("/register")} sx={{ fontSize: 13.5, color: muted, cursor: "pointer", fontFamily: font, fontWeight: 500, "&:hover": { color: txt }, transition: "color .15s" }}>Get started free</Typography>
                  <Typography onClick={() => navigate("/login")} sx={{ fontSize: 13.5, color: muted, cursor: "pointer", fontFamily: font, fontWeight: 500, "&:hover": { color: txt }, transition: "color .15s" }}>Sign in</Typography>
                  {user && <Typography onClick={() => navigate("/app/dashboard")} sx={{ fontSize: 13.5, color: blue, cursor: "pointer", fontFamily: font, fontWeight: 600, "&:hover": { color: blueL }, transition: "color .15s" }}>Dashboard</Typography>}
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: txt, textTransform: "uppercase", letterSpacing: 1.5, mb: 2, fontFamily: font }}>Legal</Typography>
                <Stack spacing={1.25}>
                  <Typography onClick={() => navigate("/privacy")} sx={{ fontSize: 13.5, color: muted, cursor: "pointer", fontFamily: font, fontWeight: 500, "&:hover": { color: txt }, transition: "color .15s" }}>Privacy Policy</Typography>
                  <Typography onClick={() => navigate("/terms")} sx={{ fontSize: 13.5, color: muted, cursor: "pointer", fontFamily: font, fontWeight: 500, "&:hover": { color: txt }, transition: "color .15s" }}>Terms of Service</Typography>
                </Stack>
              </Box>
            </Box>
          </Box>

          {/* Bottom bar */}
          <Box sx={{ borderTop: `1px solid ${bord}`, pt: 3.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography sx={{ fontSize: 12, color: dimmer, fontFamily: font }}>
              © {new Date().getFullYear()} ChapMail. All rights reserved.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: 99, bgcolor: `${green}12`, border: `1px solid ${green}30` }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: green, animation: `${pulse} 2.5s infinite` }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: green, fontFamily: font }}>All systems operational</Typography>
            </Box>
          </Box>
        </Box>

        {/* ══ SCROLL TO TOP ════════════════════════════════════════════════════ */}
        <Fab onClick={scrollToTop}
          size="medium"
          aria-label="Scroll to top"
          sx={{
            position: "fixed", bottom: 32, right: 32, zIndex: 300,
            bgcolor: blue, color: "#fff",
            opacity: showScrollTop ? 1 : 0,
            transform: showScrollTop ? "translateY(0) scale(1)" : "translateY(16px) scale(0.8)",
            transition: "all .3s cubic-bezier(.22,1,.36,1)",
            pointerEvents: showScrollTop ? "auto" : "none",
            boxShadow: `0 8px 24px ${blue}50`,
            "&:hover": { bgcolor: blueL, transform: "translateY(-2px) scale(1.05)", boxShadow: `0 12px 32px ${blue}65` },
          }}>
          <KeyboardArrowUpRounded sx={{ fontSize: 24 }} />
        </Fab>

      </Box>
    </>
  );
}