import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Card, CardContent, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

import { getStats } from '../services/api';

interface InteractionsPerDay { date: string; count: number }
interface TopPerson { person_id: string; name: string; count: number }

export default function Stats() {
  const [perDay, setPerDay] = useState<InteractionsPerDay[]>([]);
  const [top, setTop] = useState<TopPerson[]>([]);
  const [filter, setFilter] = useState<'all' | 'year' | 'month'>('all');
  const [period, setPeriod] = useState<string>('');
  const [message, setMessage] = useState('');
  const [topN, setTopN] = useState<number>(10);
  const [vh, setVh] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [contentWidth, setContentWidth] = useState<number>(800);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setContentWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await getStats({ filter, period });
        setPerDay(s.perDay || []);
        setTop(s.top || []);
      } catch {
        setMessage('Failed to load stats.');
      }
    })();
  }, [filter, period]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Statistics</Typography>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="year">By year</MenuItem>
            <MenuItem value="month">By month</MenuItem>
          </Select>
          {(filter === 'year' || filter === 'month') && (
            <TextField placeholder={filter === 'year' ? 'YYYY' : 'YYYY-MM'} value={period} onChange={(e) => setPeriod(e.target.value)} />
          )}
          <Select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
            <MenuItem value={5}>Top 5</MenuItem>
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </Stack>
      </Box>

      {/* Charts area: stacked vertically; width adapts to content and spacing increased */}
      <Box ref={contentRef} sx={{ width: '100%', maxWidth: 'none', mx: 'auto' }}>
        <Stack direction="column" spacing={4} sx={{ height: '90vh' }}>
          <Card sx={{ flex: 1, display: 'flex' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Interactions per day</Typography>
            {(() => {
              // Build full time series from earliest date to today including zeros
              const map = new Map<string, number>(perDay.map((d) => [d.date, d.count]));
              const today = new Date();
              const format = (dt: Date) => dt.toISOString().slice(0, 10);
              const parse = (s: string) => new Date(`${s}T00:00:00`);
              const start = perDay.length ? perDay.map((d) => parse(d.date)).reduce((a, b) => (a < b ? a : b)) : today;
              const dates: Date[] = [];
              const values: number[] = [];
              for (let d = new Date(start); d <= today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
                dates.push(new Date(d));
                const key = format(d);
                values.push(map.get(key) ?? 0);
              }
              return (
                <LineChart
                  height={Math.max(320, Math.floor(vh * 0.42))}
                  width={Math.max(360, contentWidth - 32)}
                  margin={{ top: 8, right: 16, bottom: 140, left: 56 }}
                  xAxis={[{
                    scaleType: 'time',
                    data: dates,
                    valueFormatter: (val: number | Date) => {
                      const dt = typeof val === 'number' ? new Date(val) : val;
                      return dt.toISOString().slice(0, 10);
                    },
                    tickLabelStyle: { angle: -30, textAnchor: 'end' },
                  }]}
                  series={[{ data: values, label: 'Interactions' }]}
                  slotProps={{ legend: { hidden: true } }}
                />
              );
            })()}
          </CardContent>
          </Card>
          <Card sx={{ flex: 1, display: 'flex' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Top 10 people</Typography>
            <BarChart
              height={Math.max(340, Math.floor(vh * 0.45))}
              width={Math.max(360, contentWidth - 48)}
              margin={{ top: 8, right: 24, bottom: 110, left: 160 }}
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: top.slice(0, topN).map((t) => t.name) }]}
              xAxis={[{
                scaleType: 'linear',
                min: 0,
                tickNumber: 8,
                label: 'Interactions',
                tickLabelStyle: { angle: 0 },
                valueFormatter: (v: number) => `${Math.round(v)}`,
              }]}
              series={[{ data: top.slice(0, topN).map((t) => t.count), label: `Top ${topN}` }]}
              slotProps={{ legend: { hidden: true } }}
              grid={{ vertical: true }}
            />
          </CardContent>
          </Card>
        </Stack>
      </Box>

      {message && <Alert sx={{ mt: 2 }} severity="info">{message}</Alert>}
    </Box>
  );
}
