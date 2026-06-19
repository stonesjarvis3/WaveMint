'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import LaunchCard from '@/components/LaunchCard';
import { getLaunches, getStats } from '@/lib/api';
import type { Launch, Stats } from '@/lib/types';

export default function HomePage() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getLaunches('trending').then(setLaunches).catch(() => {});
    getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Launch Your Token on Stellar
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
          Built-in bonding curve pricing, automatic liquidity generation, and seamless DEX migration.
        </p>
        <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold text-white transition">
          <Rocket size={18} /> Start a Launch
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Launches', value: stats.totalLaunches.toLocaleString() },
            { label: 'Total Volume', value: `${(stats.totalVolume / 1e6).toFixed(1)}M XLM` },
            { label: 'Migrated', value: stats.totalMigrated.toLocaleString() },
            { label: 'Holders', value: stats.totalHolders.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Featured launches */}
      <h2 className="text-xl font-semibold mb-4">Trending Launches</h2>
      {launches.length === 0 ? (
        <p className="text-gray-500 text-sm">No launches yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {launches.slice(0, 6).map((l) => <LaunchCard key={l.id} launch={l} />)}
        </div>
      )}

      <div className="text-center mt-8">
        <Link href="/launches" className="text-purple-400 hover:text-purple-300 text-sm transition">
          View all launches →
        </Link>
      </div>
    </div>
  );
}
