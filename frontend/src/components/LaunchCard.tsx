import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import ProgressBar from './ProgressBar';
import type { Launch } from '@/lib/types';

export default function LaunchCard({ launch }: { launch: Launch }) {
  const progress = (launch.raisedXlm / launch.targetMarketCap) * 100;
  const up = launch.change24h >= 0;

  return (
    <Link href={`/launches/${launch.id}`} className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {launch.imageUrl ? (
            <img src={launch.imageUrl} alt={launch.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
              {launch.symbol.slice(0, 2)}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{launch.name}</p>
            <p className="text-xs text-gray-400">${launch.symbol}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}{launch.change24h.toFixed(2)}%
        </span>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-400">Price</span>
        <span className="text-white font-medium">{launch.currentPrice.toFixed(6)} XLM</span>
      </div>

      <ProgressBar value={progress} className="mb-2" />

      <div className="flex justify-between text-xs text-gray-500">
        <span>{launch.raisedXlm.toLocaleString()} XLM raised</span>
        <span>{progress.toFixed(1)}%</span>
      </div>

      <p className="text-xs text-gray-600 mt-2 truncate">
        {launch.creator.slice(0, 6)}…{launch.creator.slice(-4)}
      </p>
    </Link>
  );
}
