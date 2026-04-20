// src/ui/pages/modules/billing/plans/index.tsx
//
// Plans — /app/billing/plans
//
// Features:
//  - Pricing cards: Starter / Growth / Business / Enterprise
//  - Monthly / Annual toggle (annual = 2 months free)
//  - Feature comparison table
//  - Highlighted "current plan" + "recommended" badges
//  - Upgrade / downgrade / contact sales CTA
//  - Add-ons section (extra sends, extra contacts, dedicated IP)
//  - Role-aware (CLIENT_USER = read only)

import { useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, Snackbar, Stack,
  Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography,
} from '@mui/material';

import CheckIcon         from '@mui/icons-material/Check';
import CloseIcon         from '@mui/icons-material/Close';
import RemoveIcon        from '@mui/icons-material/Remove';
import RocketLaunchIcon  from '@mui/icons-material/RocketLaunch';
import UpgradeIcon       from '@mui/icons-material/Upgrade';

import { GlassCard }    from '../../../../dashboard/GlassCard';
import { useAuth }      from '../../../../../state/auth/useAuth';
import { Role }         from '../../../../../types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanId   = 'starter' | 'growth' | 'business' | 'enterprise';
type BillingCycle = 'monthly' | 'annual';

type PlanFeature = {
  category: string;
  label: string;
  starter:    string | boolean | null;
  growth:     string | boolean | null;
  business:   string | boolean | null;
  enterprise: string | boolean | null;
};

type AddOn = {
  id: string;
  label: string;
  description: string;
  price: string;
  unit: string;
};

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS: {
  id: PlanId; name: string; tagline: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  color: string;
  sends: string; contacts: string; seats: string;
  highlight?: string;
  cta: string;
}[] = [
  {
    id: 'starter', name: 'Starter', tagline: 'Perfect for small businesses getting started',
    monthlyPrice: 49, annualPrice: 39,
    color: '#6b7280',
    sends: '10K/month', contacts: '2,500', seats: '2',
    cta: 'Downgrade to Starter',
  },
  {
    id: 'growth', name: 'Growth', tagline: 'For growing teams ready to scale their campaigns',
    monthlyPrice: 149, annualPrice: 119,
    color: '#6366f1',
    sends: '100K/month', contacts: '15,000', seats: '5',
    highlight: 'Current plan',
    cta: 'Current plan',
  },
  {
    id: 'business', name: 'Business', tagline: 'Advanced tools for high-volume senders',
    monthlyPrice: 399, annualPrice: 319,
    color: '#8b5cf6',
    sends: '500K/month', contacts: '75,000', seats: '15',
    highlight: 'Recommended',
    cta: 'Upgrade to Business',
  },
  {
    id: 'enterprise', name: 'Enterprise', tagline: 'Custom volume, SLA, and dedicated support',
    monthlyPrice: null, annualPrice: null,
    color: '#0ea5e9',
    sends: 'Unlimited', contacts: 'Unlimited', seats: 'Unlimited',
    cta: 'Contact sales',
  },
];

const CURRENT_PLAN: PlanId = 'growth';

const FEATURES: PlanFeature[] = [
  // Sending
  { category:'Sending', label:'Monthly email sends',   starter:'10,000',    growth:'100,000',   business:'500,000',  enterprise:'Unlimited'   },
  { category:'Sending', label:'Sending domains',        starter:'1',         growth:'5',         business:'20',       enterprise:'Unlimited'   },
  { category:'Sending', label:'Dedicated IPs',          starter:false,       growth:false,       business:true,       enterprise:true          },
  { category:'Sending', label:'IP warming',             starter:false,       growth:true,        business:true,       enterprise:true          },
  { category:'Sending', label:'Custom DKIM/SPF',        starter:true,        growth:true,        business:true,       enterprise:true          },
  // Audience
  { category:'Audience', label:'Contacts',              starter:'2,500',     growth:'15,000',    business:'75,000',   enterprise:'Unlimited'   },
  { category:'Audience', label:'Segments',              starter:'5',         growth:'Unlimited', business:'Unlimited',enterprise:'Unlimited'   },
  { category:'Audience', label:'Suppression lists',     starter:true,        growth:true,        business:true,       enterprise:true          },
  { category:'Audience', label:'Email verification',    starter:false,       growth:true,        business:true,       enterprise:true          },
  // Campaigns
  { category:'Campaigns', label:'Campaigns',            starter:'Unlimited', growth:'Unlimited', business:'Unlimited',enterprise:'Unlimited'   },
  { category:'Campaigns', label:'A/B testing',          starter:false,       growth:true,        business:true,       enterprise:true          },
  { category:'Campaigns', label:'Scheduled sends',      starter:true,        growth:true,        business:true,       enterprise:true          },
  // Automations
  { category:'Automations', label:'Automation flows',   starter:'3',         growth:'10',        business:'Unlimited',enterprise:'Unlimited'   },
  { category:'Automations', label:'Triggers',           starter:'5',         growth:'25',        business:'Unlimited',enterprise:'Unlimited'   },
  // Integrations
  { category:'Integrations', label:'API access',        starter:true,        growth:true,        business:true,       enterprise:true          },
  { category:'Integrations', label:'Webhooks',          starter:'3',         growth:'20',        business:'Unlimited',enterprise:'Unlimited'   },
  { category:'Integrations', label:'Connected apps',    starter:'2',         growth:'10',        business:'Unlimited',enterprise:'Unlimited'   },
  { category:'Integrations', label:'Zapier & Make',     starter:false,       growth:true,        business:true,       enterprise:true          },
  // Team & Support
  { category:'Team & Support', label:'Team seats',      starter:'2',         growth:'5',         business:'15',       enterprise:'Unlimited'   },
  { category:'Team & Support', label:'Role permissions',starter:false,       growth:true,        business:true,       enterprise:true          },
  { category:'Team & Support', label:'Support level',   starter:'Email',     growth:'Priority',  business:'Phone',    enterprise:'Dedicated'   },
  { category:'Team & Support', label:'SLA',             starter:false,       growth:false,       business:'99.9%',    enterprise:'99.99%'      },
  { category:'Team & Support', label:'Custom contract', starter:false,       growth:false,       business:false,      enterprise:true          },
];

const ADD_ONS: AddOn[] = [
  { id:'extra-sends',    label:'Extra email sends',      description:'Additional sends beyond your plan limit', price:'$1.20', unit:'per 1,000'    },
  { id:'extra-contacts', label:'Extra contacts',         description:'Extend your contact limit',                price:'$15',   unit:'per 2,500'    },
  { id:'dedicated-ip',   label:'Dedicated sending IP',  description:'A dedicated IP for your sending domain',   price:'$25',   unit:'per IP/month' },
  { id:'extra-seats',    label:'Additional seats',       description:'Add more team members',                    price:'$10',   unit:'per seat/month'},
];

// ─── Feature cell ─────────────────────────────────────────────────────────────

function FeatureCell({ value, isCurrent }: { value: string | boolean | null; isCurrent: boolean }) {
  const fontWeight = isCurrent ? 700 : 400;
  if (value === true)   return <CheckIcon  sx={{ fontSize: 16, color: 'success.main' }} />;
  if (value === false)  return <RemoveIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
  if (value === null)   return <RemoveIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
  return (
    <Typography variant="caption" fontWeight={fontWeight} color={isCurrent ? 'primary.main' : 'text.primary'}>
      {value}
    </Typography>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, cycle, isCurrent, onSelect }: {
  plan: typeof PLANS[0];
  cycle: BillingCycle;
  isCurrent: boolean;
  onSelect: (p: typeof PLANS[0]) => void;
}) {
  const price    = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const isEnterprise = plan.id === 'enterprise';
  const isRecommended = plan.highlight === 'Recommended';

  return (
    <GlassCard sx={{
      p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
      outline: isCurrent ? '2px solid' : isRecommended ? '1.5px solid' : 'none',
      outlineColor: isCurrent ? 'primary.main' : plan.color,
      position: 'relative',
    }}>
      {/* Badge */}
      {(isCurrent || isRecommended) && (
        <Chip
          label={isCurrent ? 'Current plan' : 'Recommended'}
          size="small"
          sx={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            fontSize: 10, height: 20, fontWeight: 700,
            bgcolor: isCurrent ? 'primary.main' : plan.color, color: '#fff',
          }} />
      )}

      {/* Name & tagline */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: plan.color }} />
          <Typography variant="subtitle1" fontWeight={900}>{plan.name}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {plan.tagline}
        </Typography>
      </Box>

      {/* Price */}
      <Box>
        {isEnterprise ? (
          <Typography variant="h5" fontWeight={900} color={plan.color}>Custom</Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h4" fontWeight={900} color={plan.color}>${price}</Typography>
            <Typography variant="caption" color="text.disabled">/month</Typography>
          </Box>
        )}
        {!isEnterprise && cycle === 'annual' && (
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Save ${((plan.monthlyPrice! - plan.annualPrice!) * 12).toFixed(0)}/year
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Key limits */}
      {[
        { label: '📧 Sends',    value: plan.sends    },
        { label: '👥 Contacts', value: plan.contacts },
        { label: '🪑 Seats',    value: plan.seats    },
      ].map(s => (
        <Box key={s.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          <Typography variant="caption" fontWeight={700}>{s.value}</Typography>
        </Box>
      ))}

      <Box sx={{ mt: 'auto' }}>
        <Button
          fullWidth size="small" variant={isCurrent ? 'outlined' : 'contained'}
          disabled={isCurrent}
          onClick={() => onSelect(plan)}
          sx={{
            fontWeight: 700, borderRadius: 1,
            ...(isCurrent ? {} : { bgcolor: plan.color, '&:hover': { bgcolor: plan.color, filter: 'brightness(0.92)' } }),
          }}>
          {plan.cta}
        </Button>
      </Box>
    </GlassCard>
  );
}

// ─── BillingPlansPage ─────────────────────────────────────────────────────────

export function BillingPlansPage() {
  const { user }     = useAuth();
  const canEdit      = user?.role !== Role.CLIENT_USER;

  const [cycle,      setCycle]      = useState<BillingCycle>('monthly');
  const [selected,   setSelected]   = useState<typeof PLANS[0] | null>(null);
  const [snack,      setSnack]      = useState<string | null>(null);

  const handleSelect = (plan: typeof PLANS[0]) => {
    if (plan.id === 'enterprise') {
      window.open('mailto:sales@sendplatform.io?subject=Enterprise enquiry', '_blank');
      return;
    }
    setSelected(plan);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setSnack(`Plan change to ${selected.name} requested. You'll receive a confirmation email shortly.`);
    setSelected(null);
  };

  // Group features by category for the comparison table
  const categories = Array.from(new Set(FEATURES.map(f => f.category)));

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Compare plans and upgrade or downgrade your subscription.
          </Typography>
        </Stack>

        {/* Billing cycle toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={cycle === 'monthly' ? 700 : 400}>Monthly</Typography>
          <Switch
            size="small"
            checked={cycle === 'annual'}
            onChange={e => setCycle(e.target.checked ? 'annual' : 'monthly')} />
          <Typography variant="caption" fontWeight={cycle === 'annual' ? 700 : 400}>Annual</Typography>
          {cycle === 'annual' && (
            <Chip label="2 months free" size="small" color="success"
              sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
          )}
        </Box>
      </Box>

      {/* Plan cards */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' } }}>
        {PLANS.map(p => (
          <PlanCard
            key={p.id} plan={p} cycle={cycle}
            isCurrent={p.id === CURRENT_PLAN}
            onSelect={handleSelect}
          />
        ))}
      </Box>

      {/* Feature comparison table */}
      <GlassCard sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800}>Full feature comparison</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary', pl: 2.5, minWidth: 200 }}>
                  Feature
                </TableCell>
                {PLANS.map(p => (
                  <TableCell key={p.id} align="center" sx={{ fontWeight: 700, fontSize: 12, minWidth: 100 }}>
                    <Box sx={{ color: p.id === CURRENT_PLAN ? 'primary.main' : 'text.primary' }}>
                      {p.name}
                      {p.id === CURRENT_PLAN && (
                        <Typography variant="caption" color="primary" sx={{ display: 'block', fontSize: 10 }}>
                          ← You are here
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(cat => {
                const rows = FEATURES.filter(f => f.category === cat);
                return rows.map((feat, fi) => (
                  <TableRow key={feat.label}
                    sx={{ '& td': { fontSize: 12, borderBottom: 1, borderColor: 'divider' },
                      bgcolor: 'transparent',
                    }}>
                    <TableCell sx={{ pl: 2.5 }}>
                      {fi === 0 && (
                        <Typography variant="caption" fontWeight={800} color="text.disabled"
                          sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10, mb: 0.5 }}>
                          {cat}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">{feat.label}</Typography>
                    </TableCell>
                    {(['starter','growth','business','enterprise'] as PlanId[]).map(pid => (
                      <TableCell key={pid} align="center"
                        sx={{ bgcolor: pid === CURRENT_PLAN ? 'primary.50' : 'transparent' }}>
                        <FeatureCell
                          value={feat[pid]}
                          isCurrent={pid === CURRENT_PLAN} />
                      </TableCell>
                    ))}
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Add-ons */}
      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Add-ons</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
          Extend your plan with pay-as-you-go add-ons. Added to your next invoice automatically.
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' } }}>
          {ADD_ONS.map(a => (
            <Box key={a.id} sx={{
              p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5,
              display: 'flex', flexDirection: 'column', gap: 1,
            }}>
              <Typography variant="body2" fontWeight={700}>{a.label}</Typography>
              <Typography variant="caption" color="text.secondary">{a.description}</Typography>
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="subtitle1" fontWeight={900} color="primary.main">{a.price}</Typography>
                <Typography variant="caption" color="text.disabled">{a.unit}</Typography>
              </Box>
              {canEdit && (
                <Button size="small" variant="outlined" fullWidth sx={{ fontSize: 11 }}
                  onClick={() => setSnack(`${a.label} add-on request sent.`)}>
                  Add to plan
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </GlassCard>

      {/* Enterprise CTA */}
      <GlassCard sx={{
        p: 3, textAlign: 'center',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      }}>
        <RocketLaunchIcon sx={{ fontSize: 36, color: '#fff', mb: 1 }} />
        <Typography variant="h6" fontWeight={900} color="#fff">Need more than Business?</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
          Enterprise plans include unlimited sending, custom SLAs, dedicated infrastructure, and a dedicated success manager.
        </Typography>
        <Button variant="contained" size="small"
          sx={{ bgcolor: '#fff', color: '#6366f1', fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          onClick={() => window.open('mailto:sales@sendplatform.io?subject=Enterprise enquiry', '_blank')}>
          Talk to sales
        </Button>
      </GlassCard>

      {/* Upgrade/downgrade confirm dialog */}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {selected && PLANS.findIndex(p => p.id === selected.id) > PLANS.findIndex(p => p.id === CURRENT_PLAN)
            ? `Upgrade to ${selected?.name}?`
            : `Downgrade to ${selected?.name}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            {selected && PLANS.findIndex(p => p.id === selected.id) > PLANS.findIndex(p => p.id === CURRENT_PLAN) ? (
              <>You'll be upgraded to <strong>{selected?.name}</strong> immediately. A prorated charge for the remainder of this billing cycle will be added to your next invoice.</>
            ) : (
              <>You'll be downgraded to <strong>{selected?.name}</strong> at the end of your current billing cycle on <strong>Aug 1, 2025</strong>. Some features will be unavailable after the change.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelected(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" size="small"
            startIcon={<UpgradeIcon />}>
            Confirm change
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}