import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';
import { botchainTestnet, botchainMainnet } from './networks';

// Get projectId from environment or use public fallback
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

export const networks = [botchainTestnet, botchainMainnet];

// Set up Wagmi Adapter with dedicated RPC transports for direct on-chain querying
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [botchainTestnet.id]: http('https://rpc.bohr.life'),
    [botchainMainnet.id]: http('https://rpc.botchain.ai'),
  },
});

export const metadata = {
  name: 'VoucherBox',
  description: 'Digital Discount Voucher Campaigns on BOT Chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://voucherbox.io',
  icons: ['https://scan.bohr.life/images/logo.png'],
};

// Initialize AppKit
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: botchainTestnet,
  metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '12px',
  },
});

export const config = wagmiAdapter.wagmiConfig;
