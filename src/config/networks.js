import { defineChain } from 'viem';

// BOT Chain Testnet definition
export const botchainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
    public: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: { name: 'BOTScan', url: 'https://scan.bohr.life' },
  },
  testnet: true,
});

// BOT Chain Mainnet definition
export const botchainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
    public: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: { name: 'BOTScan', url: 'https://scan.botchain.ai' },
  },
  testnet: false,
});

export const SUPPORTED_CHAINS = [botchainTestnet, botchainMainnet];
export const DEFAULT_CHAIN = botchainTestnet;

/**
 * Returns block explorer URL for a given transaction hash
 */
export function getTxExplorerUrl(txHash, chainId = 968) {
  if (!txHash) return '#';
  const baseUrl = Number(chainId) === 677 
    ? 'https://scan.botchain.ai' 
    : 'https://scan.bohr.life';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Returns block explorer URL for a given address
 */
export function getAddressExplorerUrl(address, chainId = 968) {
  if (!address) return '#';
  const baseUrl = Number(chainId) === 677 
    ? 'https://scan.botchain.ai' 
    : 'https://scan.bohr.life';
  return `${baseUrl}/address/${address}`;
}

/**
 * Format address for display
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

