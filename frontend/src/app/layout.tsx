import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '@/components/WalletButton';
import WalletButton from '@/components/WalletButton';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WaveMint — Stellar Token Launchpad',
  description: 'Create and launch Stellar-native tokens with built-in price discovery and liquidity generation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <WalletProvider>
          <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              WaveMint
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/launches" className="text-sm text-gray-400 hover:text-white transition">Explore</Link>
              <Link href="/create" className="text-sm text-gray-400 hover:text-white transition">Launch</Link>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
              <WalletButton />
            </div>
          </nav>
          <main>{children}</main>
        </WalletProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', color: '#f9fafb', border: '1px solid #374151' } }} />
      </body>
    </html>
  );
}
