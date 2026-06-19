'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import LaunchCard from '@/components/LaunchCard';
import { getLaunches } from '@/lib/api';
import type { Launch } from '@/lib/types';
import clsx from 'clsx';

const TABS = ['all', 'trending', 'new', 'migrated'] as const;
type Tab = typeof TABS[number];

export default function LaunchesPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLaunches(tab, search).then(setLaunches).finally(() => setLoading(false));
  }, [tab, search]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Explore Launches</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition',
                tab === t ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tokens…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : launches.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No launches found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {launches.map((l) => <LaunchCard key={l.id} launch={l} />)}
        </div>
      )}
    </div>
  );
}
