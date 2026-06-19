'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { BondingCurveState } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const POINTS = 50;

function bondingPrice(sold: number, total: number, targetMcap: number): number {
  // linear bonding: price = (targetMcap / totalSupply) * (sold / totalSupply)
  return (targetMcap / total) * (sold / total);
}

export default function BondingCurveChart({ state }: { state: BondingCurveState }) {
  const { tokensSold, totalSupply, targetMarketCap } = state;

  const labels: string[] = [];
  const prices: number[] = [];

  for (let i = 0; i <= POINTS; i++) {
    const sold = (i / POINTS) * totalSupply;
    labels.push((sold / 1e6).toFixed(0) + 'M');
    prices.push(bondingPrice(sold, totalSupply, targetMarketCap));
  }

  const currentX = (tokensSold / totalSupply) * POINTS;

  const data = {
    labels,
    datasets: [
      {
        label: 'Price (XLM)',
        data: prices,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y.toFixed(6)} XLM` } },
    },
    scales: {
      x: { ticks: { color: '#6b7280', maxTicksLimit: 6 }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
    },
    annotation: {
      annotations: {
        current: {
          type: 'line' as const,
          xMin: currentX,
          xMax: currentX,
          borderColor: '#22d3ee',
          borderWidth: 2,
          label: { display: true, content: 'Current', color: '#22d3ee' },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
