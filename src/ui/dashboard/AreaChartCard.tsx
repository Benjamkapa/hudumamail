import { Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';

import { GlassCard } from './GlassCard';

export function AreaChartCard(props: {
  title: string;
  subtitle?: string;
  xLabels: string[];
  seriesLabel: string;
  seriesData: number[];
}) {
  const t = useTheme();

  return (
    <GlassCard sx={{ p: 2.2, height: '100%' }}>
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack spacing={0.2}>
          <Typography sx={{ fontWeight: 800 }}>{props.title}</Typography>
          {props.subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {props.subtitle}
            </Typography>
          ) : null}
        </Stack>

        <LineChart
          height={260}
          xAxis={[
            {
              data: props.xLabels,
              scaleType: 'point',
              tickLabelStyle: { fill: alpha('#e8efff', 0.55), fontSize: 11 },
            },
          ]}
          series={[
            {
              data: props.seriesData,
              label: props.seriesLabel,
              color: t.palette.primary.main,
              area: true,
              showMark: false,
            },
          ]}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiChartsGrid-line': { stroke: alpha('#bcd2ff', 0.10) },
            '& .MuiChartsAxis-line': { stroke: alpha('#bcd2ff', 0.16) },
            '& .MuiChartsAxis-tick': { stroke: alpha('#bcd2ff', 0.16) },
            '& .MuiChartsLegend-label': { fill: alpha('#e8efff', 0.8) },
          }}
        />
      </Stack>
    </GlassCard>
  );
}

