'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import BondingCurveChart from '@/components/BondingCurveChart';
import ProgressBar from '@/components/ProgressBar';
import { useWallet } from '@/components/WalletButton';
import { getLaunch, getTrades, getQuote } from '@/lib/api';
import { buyTokens, sellTokens } from '@/lib/wallet';
import type { Launch, Trade } from '@/lib/types';

export default function LaunchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { publicKey, connect } = useWallet();
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [xlmIn, setXlmIn] = useState('');
  const [tokenIn, setTokenIn] = useState('');
  const [buyQuote, setBuyQuote] = useState<number | null>(null);
  const [sellQuote, setSellQuote] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getLaunch(id).then(setLaunch).catch(() => toast.error('Failed to load launch'));
    getTrades(id).then(setTrades).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || !xlmIn || isNaN(+xlmIn)) { setBuyQuote(null); return; }
    getQuote(id, 'buy', +xlmIn).then((q) => setBuyQuote(q.output)).catch(() => {});
  }, [xlmIn, id]);

  useEffect(() => {
    if (!id || !tokenIn || isNaN(+tokenIn)) { setSellQuote(null); return; }
    getQuote(id, 'sell', +tokenIn).then((q) => setSellQuote(q.output)).catch(() => {});
  }, [tokenIn, id]);

  const handleBuy = async () => {
    if (!publicKey) return connect();
    if (!launch || !xlmIn) return;
    setBusy(true);
    try {
      await buyTokens(publicKey, launch.id, +xlmIn);
      toast.success('Buy submitted!');
      getLaunch(id).then(setLaunch);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Buy failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSell = async () => {
    if (!publicKey) return connect();
    if (!launch || !tokenIn) return;
    setBusy(true);
    try {
      await sellTokens(publicKey, launch.id, +tokenIn);
      toast.success('Sell submitted!');
      getLaunch(id).then(setLaunch);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Sell failed');
    } finally {
      setBusy(false);
    }
  };

  if (!launch) return <div className="text-center py-24 text-gray-500">Loading…</div>;

  const progress = (launch.raisedXlm / launch.targetMarketCap) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: info + chart */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          {launch.imageUrl ? (
            <img src={launch.imageUrl} alt={launch.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-xl font-bold">
              {launch.symbol.slice(0, 2)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{launch.name} <span className="text-gray-400 font-normal text-base">${launch.symbol}</span></h1>
            <p className="text-sm text-gray-400">{launch.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Price', value: `${launch.currentPrice.toFixed(6)} XLM` },
            { label: 'Market Cap', value: `${launch.marketCap.toLocaleString()} XLM` },
            { label: 'Holders', value: launch.holders.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-semibold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Bonding Curve</h2>
          <BondingCurveChart state={{
            tokensSold: launch.tokensSold,
            totalSupply: launch.totalSupply,
            currentPrice: launch.currentPrice,
            raisedXlm: launch.raisedXlm,
            targetMarketCap: launch.targetMarketCap,
          }} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress to Migration</span>
            <span className="text-white">{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar value={progress} />
          <p className="text-xs text-gray-500 mt-2">{launch.raisedXlm.toLocaleString()} / {launch.targetMarketCap.toLocaleString()} XLM</p>
        </div>

        {/* Trades */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Transactions</h2>
          {trades.length === 0 ? (
            <p className="text-xs text-gray-500">No trades yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left pb-2">Type</th>
                  <th className="text-right pb-2">XLM</th>
                  <th className="text-right pb-2">Tokens</th>
                  <th className="text-right pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50">
                    <td className={`py-1.5 ${t.type === 'buy' ? 'text-emerald-400' : 'text-red-400'} capitalize`}>{t.type}</td>
                    <td className="text-right text-gray-300">{t.xlmAmount.toFixed(2)}</td>
                    <td className="text-right text-gray-300">{t.tokenAmount.toLocaleString()}</td>
                    <td className="text-right text-gray-500">{new Date(t.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: buy/sell */}
      <div className="space-y-4">
        {/* Buy */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 text-emerald-400">Buy ${launch.symbol}</h2>
          <label className="text-xs text-gray-400">XLM Amount</label>
          <input
            type="number"
            min="0"
            value={xlmIn}
            onChange={(e) => setXlmIn(e.target.value)}
            placeholder="0"
            className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
          {buyQuote !== null && (
            <p className="text-xs text-gray-400 mt-1">≈ {buyQuote.toLocaleString()} {launch.symbol}</p>
          )}
          <button
            onClick={handleBuy}
            disabled={busy}
            className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition"
          >
            {busy ? 'Submitting…' : publicKey ? 'Buy' : 'Connect Wallet'}
          </button>
        </div>

        {/* Sell */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 text-red-400">Sell ${launch.symbol}</h2>
          <label className="text-xs text-gray-400">Token Amount</label>
          <input
            type="number"
            min="0"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            placeholder="0"
            className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
          {sellQuote !== null && (
            <p className="text-xs text-gray-400 mt-1">≈ {sellQuote.toFixed(2)} XLM</p>
          )}
          <button
            onClick={handleSell}
            disabled={busy}
            className="w-full mt-3 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition"
          >
            {busy ? 'Submitting…' : publicKey ? 'Sell' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}
