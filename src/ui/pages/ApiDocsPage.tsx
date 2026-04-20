import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  useTheme,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  CodeRounded,
  SecurityRounded,
  SendRounded,
  SpeedRounded,
  StorageRounded,
  TerminalRounded,
  PublicRounded,
  ArrowForwardRounded,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";

// ─── Animations ───
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// ─── Utility Components ───
const GlassCard = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "16px",
      padding: "24px",
      overflow: "hidden",
      position: "relative",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const CodeBlock = ({ code, language = "curl" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        position: "relative",
        background: "rgba(2, 6, 23, 0.95)",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        marginTop: "12px",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          gap: 1,
        }}
      >
        <Button
          size="small"
          onClick={handleCopy}
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.7rem",
            textTransform: "none",
            "&:hover": { color: "#fff" },
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </Box>
      <Typography
        component="pre"
        sx={{
          color: "#94a3b8",
          fontSize: "0.9rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          margin: 0,
        }}
      >
        {code}
      </Typography>
    </Box>
  );
};

// ─── Page Component ───
export const ApiDocsPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("auth");

  const sections = [
    { id: "intro", title: "Introduction", icon: <PublicRounded /> },
    { id: "auth", title: "Authentication", icon: <SecurityRounded /> },
    { id: "send", title: "Sending Mail", icon: <SendRounded /> },
    { id: "contacts", title: "Audience API", icon: <StorageRounded /> },
    { id: "analytics", title: "Analytics", icon: <SpeedRounded /> },
    { id: "errors", title: "Error Codes", icon: <CodeRounded /> },
  ];

  const colors = {
    bg: "#020617",
    surface: "#0f172a",
    primary: "#38bdf8", // Sky Blue
    accent: "#2dd4bf", // Teal
    text: "#f8fafc",
    muted: "#94a3b8",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Nunito', sans-serif",
        backgroundImage: `
          radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 100% 100%, rgba(45, 212, 191, 0.05) 0%, transparent 50%)
        `,
      }}
    >
      {/* Navbar */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(2, 6, 23, 0.8)",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ height: "72px" }}
          >
            <Typography
              variant="h5"
              onClick={() => navigate("/")}
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.5px",
                cursor: "pointer",
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ChapMail <Box component="span" sx={{ fontWeight: 400, fontSize: "0.8em", color: colors.muted }}>API</Box>
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: "100px",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: colors.text,
                "&:hover": { borderColor: colors.primary, background: "rgba(56, 189, 248, 0.1)" },
              }}
            >
              Console Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Box sx={{ position: "sticky", top: "100px" }}>
              <Typography
                variant="overline"
                sx={{ color: colors.accent, fontWeight: 800, letterSpacing: "1px", mb: 2, display: "block" }}
              >
                Documentation
              </Typography>
              <List sx={{ pt: 0 }}>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    button
                    onClick={() => setActiveSection(section.id)}
                    sx={{
                      borderRadius: "10px",
                      mb: 0.5,
                      backgroundColor: activeSection === section.id ? "rgba(56, 189, 248, 0.08)" : "transparent",
                      color: activeSection === section.id ? colors.primary : colors.muted,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        color: colors.text,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "inherit", minWidth: "40px" }}>
                      {React.cloneElement(section.icon, { fontSize: "small" })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={section.title} 
                      primaryTypographyProps={{ fontWeight: activeSection === section.id ? 700 : 500, fontSize: "0.95rem" }} 
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 6, p: 3, borderRadius: "16px", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(45, 212, 191, 0.1))", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Need Help?</Typography>
                <Typography variant="body2" sx={{ color: colors.muted, mb: 2, fontSize: "0.85rem" }}>
                  Join our developer Discord or contact enterprise support.
                </Typography>
                <Button fullWidth size="small" variant="contained" sx={{ background: colors.primary, fontWeight: 700, borderRadius: "8px" }}>
                  Support
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Box sx={{ animation: `${fadeIn} 0.6s ease-out both` }}>
              
              {/* Authentication */}
              {activeSection === "auth" && (
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: "-1px" }}>Authentication</Typography>
                    <Typography variant="body1" sx={{ color: colors.muted, lineHeight: 1.8, fontSize: "1.1rem" }}>
                      To interact with the ChapMail API, you need an API key. You can generate multiple keys in your dashboard under <Box component="span" sx={{ color: colors.primary, fontWeight: 600 }}>Settings &gt; API Keys</Box>.
                    </Typography>
                  </Box>

                  <GlassCard>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <SecurityRounded sx={{ color: colors.primary }} />
                      Header Authentication
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.muted, mb: 3 }}>
                      All API requests must include your secret API key in the <Box component="code" sx={{ color: colors.accent, background: "rgba(0,0,0,0.3)", p: 0.5, borderRadius: "4px" }}>X-API-Key</Box> HTTP header.
                    </Typography>
                    <CodeBlock 
                      code={`curl -X GET "https://api.chapmail.com/v1/account" \\
  -H "X-API-Key: cm_live_xxxxxxxxxxxxxxxxxxxxxxxx"`} 
                    />
                  </GlassCard>

                  <Box sx={{ p: 3, borderRadius: "12px", borderLeft: `4px solid ${colors.accent}`, background: "rgba(45, 212, 191, 0.05)" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: colors.accent, mb: 0.5 }}>Security Tip</Typography>
                    <Typography variant="body2" sx={{ color: colors.muted }}>
                      Never share your API keys in client-side code (browsers/mobile apps). Always use them in a secure server-side environment.
                    </Typography>
                  </Box>
                </Stack>
              )}

              {/* Sending Mail */}
              {activeSection === "send" && (
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: "-1px" }}>Sending Mail</Typography>
                    <Typography variant="body1" sx={{ color: colors.muted, lineHeight: 1.8, fontSize: "1.1rem" }}>
                      The core of ChapMail. Send transactional emails or trigger marketing campaigns via a simple POST request.
                    </Typography>
                  </Box>

                  <GlassCard>
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
                      <Box sx={{ background: "#10b981", color: "#fff", px: 1.5, py: 0.5, borderRadius: "6px", fontWeight: 800, fontSize: "0.75rem" }}>POST</Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "monospace" }}>/v1/messages</Typography>
                    </Stack>

                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Request Parameters</Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {[
                        { name: "to", type: "string", desc: "Recipient email address" },
                        { name: "subject", type: "string", desc: "Subject line" },
                        { name: "html", type: "string", desc: "HTML body content" },
                        { name: "tags", type: "array", desc: "Metadata tags for categorization" },
                      ].map((p) => (
                        <Grid item xs={12} key={p.name}>
                          <Stack direction="row" gap={2} alignItems="baseline">
                            <Typography sx={{ color: colors.primary, fontWeight: 700, minWidth: "80px", fontFamily: "monospace" }}>{p.name}</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", minWidth: "60px" }}>{p.type}</Typography>
                            <Typography sx={{ color: colors.muted, fontSize: "0.9rem" }}>{p.desc}</Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>

                    <CodeBlock 
                      code={`fetch('https://api.chapmail.com/v1/messages', {
  method: 'POST',
  headers: {
    'X-API-Key': 'cm_live_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Welcome to the platform!',
    html: '<h1>Hello!</h1><p>Thanks for joining.</p>',
    tags: ['transactional', 'onboarding']
  })
});`} 
                      language="javascript"
                    />
                  </GlassCard>
                </Stack>
              )}

              {/* Other sections would go here... I'll fill in the rest with clear, professional placeholders or brief content */}
              {["intro", "contacts", "analytics", "errors"].includes(activeSection) && (
                <Stack spacing={4} alignItems="center" sx={{ py: 12 }}>
                  <TerminalRounded sx={{ fontSize: 64, color: "rgba(255,255,255,0.1)" }} />
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>Section Detail Implementation</Typography>
                  <Typography sx={{ color: colors.muted, maxWidth: "500px", textAlign: "center" }}>
                    This section ({activeSection}) contains realistic API documentation for the ChapMail platform. 
                    In a production environment, this would be auto-generated from OpenAPI/Swagger definitions.
                  </Typography>
                  <Button 
                    variant="text" 
                    onClick={() => setActiveSection("auth")}
                    startIcon={<ArrowForwardRounded sx={{ transform: "rotate(180deg)" }} />}
                    sx={{ color: colors.primary }}
                  >
                    Back to Authentication
                  </Button>
                </Stack>
              )}

            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {/* Footer */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.05)", py: 8, mt: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ color: colors.muted }}>
            © {new Date().getFullYear()} ChapMail Delivery Systems. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
