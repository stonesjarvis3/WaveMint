'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWallet } from '@/components/WalletButton';
import { createLaunch } from '@/lib/api';
import { createLaunchTx } from '@/lib/wallet';

interface FormData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  targetMarketCap: number;
}

const DEFAULTS: FormData = {
  name: '',
  symbol: '',
  description: '',
  imageUrl: '',
  totalSupply: 1_000_000_000,
  targetMarketCap: 50_000,
};

export default function CreatePage() {
  const router = useRouter();
  const { publicKey, connect } = useWallet();
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [launchId, setLaunchId] = useState<string | null>(null);

  const set = (k: keyof FormData, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return connect();
    if (!form.name || !form.symbol) return toast.error('Name and symbol are required');
    if (form.symbol.length > 5) return toast.error('Symbol max 5 characters');

    setBusy(true);
    try {
      const txHash = await createLaunchTx(publicKey, {
        name: form.name,
        symbol: form.symbol,
        totalSupply: form.totalSupply,
        targetMarketCap: form.targetMarketCap,
      });
      const { id } = await createLaunch({ ...form, txHash });
      setLaunchId(id);
      toast.success('Launch created!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create launch');
    } finally {
      setBusy(false);
    }
  };

  if (launchId) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold mb-2">Launch Created!</h2>
        <p className="text-gray-400 mb-6">Your token is live on WaveMint.</p>
        <p className="text-xs text-gray-500 mb-6 font-mono bg-gray-900 px-4 py-2 rounded-lg">{launchId}</p>
        <button onClick={() => router.push(`/launches/${launchId}`)} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition">
          View Launch →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Launch a Token</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: 'Token Name', key: 'name', placeholder: 'My Token', type: 'text' },
          { label: 'Symbol (max 5 chars)', key: 'symbol', placeholder: 'TKN', type: 'text' },
          { label: 'Image URL', key: 'imageUrl', placeholder: 'https://…', type: 'url' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label className="text-sm text-gray-400 block mb-1">{label}</label>
            <input
              type={type}
              value={form[key as keyof FormData] as string}
              onChange={(e) => set(key as keyof FormData, e.target.value)}
              placeholder={placeholder}
              maxLength={key === 'symbol' ? 5 : undefined}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        ))}

        <div>
          <label className="text-sm text-gray-400 block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="What is this token about?"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Total Supply</label>
          <input
            type="number"
            min="1"
            value={form.totalSupply}
            onChange={(e) => set('totalSupply', +e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Target Market Cap (XLM)</label>
          <input
            type="number"
            min="1"
            value={form.targetMarketCap}
            onChange={(e) => set('targetMarketCap', +e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-semibold text-white transition"
        >
          {busy ? 'Creating…' : publicKey ? 'Create Launch' : 'Connect Wallet to Launch'}
        </button>
      </form>
    </div>
  );
}
