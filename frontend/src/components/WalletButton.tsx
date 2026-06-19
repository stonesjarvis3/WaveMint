'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { kit, getPublicKey } from '@/lib/wallet';

interface WalletCtx {
  publicKey: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({ publicKey: null, connect: () => {}, disconnect: () => {} });

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wm_pk');
    if (saved) setPublicKey(saved);
  }, []);

  const connect = async () => {
    await kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        const pk = await getPublicKey();
        setPublicKey(pk);
        localStorage.setItem('wm_pk', pk);
      },
    });
  };

  const disconnect = () => {
    setPublicKey(null);
    localStorage.removeItem('wm_pk');
  };

  return (
    <WalletContext.Provider value={{ publicKey, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export default function WalletButton() {
  const { publicKey, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition text-sm"
      >
        <Wallet size={16} />
        {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition text-sm font-medium"
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
}
