'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/components/WalletButton';
import { getLaunches } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import type { Launch } from '@/lib/types';

export default function DashboardPage() {
  const { publicKey, connect } = useWallet();
  const [launches, setLaunches] = useState<Launch[]>([]);

  useEffect(() => {
    if (!publicKey) return;
    getLaunches().then((all) => setLaunches(all.filter((l) => l.creator === publicKey)));
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 mb-4">Connect your wallet to view your dashboard.</p>
        <button onClick={connect} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition">
          Connect Wallet
        </button>
      </div>
    );
  }

  const portfolioValue = launches.reduce((sum, l) => sum + l.raisedXlm, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <Link href="/create" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-semibold text-white transition">
          + New Launch
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Launches</p>
          <p className="text-2xl font-bold text-white mt-1">{launches.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">Portfolio Value (XLM raised)</p>
          <p className="text-2xl font-bold text-white mt-1">{portfolioValue.toLocaleString()}</p>
        </div>
      </div>

      {launches.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No launches yet.</p>
          <Link href="/create" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">Create your first token →</Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-3">Token</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Raised</th>
                <th className="text-right px-4 py-3">Holders</th>
                <th className="text-right px-4 py-3">Progress</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {launches.map((l) => (
                <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3">
                    <Link href={`/launches/${l.id}`} className="font-medium text-white hover:text-purple-400 transition">
                      {l.name} <span className="text-gray-500 text-xs">${l.symbol}</span>
                    </Link>
                  </td>
                  <td className="text-right px-4 py-3 text-gray-300">{l.currentPrice.toFixed(6)}</td>
                  <td className="text-right px-4 py-3 text-gray-300">{l.raisedXlm.toLocaleString()}</td>
                  <td className="text-right px-4 py-3 text-gray-300">{l.holders}</td>
                  <td className="px-4 py-3 w-32">
                    <ProgressBar value={(l.raisedXlm / l.targetMarketCap) * 100} />
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.migrated ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {l.migrated ? 'Migrated' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
