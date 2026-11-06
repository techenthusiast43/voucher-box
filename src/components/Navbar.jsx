import React from 'react';
import { useAccount, useSwitchChain, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Ticket, 
  Compass, 
  Wallet, 
  Store, 
  QrCode, 
  AlertTriangle, 
  Settings, 
  ChevronDown, 
  ExternalLink 
} from 'lucide-react';
import { shortenAddress, getAddressExplorerUrl } from '../config/networks';
import { getActiveContractAddress } from '../config/contract';

export function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const { switchChain } = useSwitchChain();
  const contractAddress = getActiveContractAddress();

  const isBotChain = chainId === 968 || chainId === 677;

  const { data: balanceData } = useBalance({
    address: address,
    query: {
      enabled: Boolean(address && isBotChain),
    },
  });

  const navItems = [
    { id: 'explore', label: 'Explore Vouchers', icon: Compass },
    { id: 'my-vouchers', label: 'My Vouchers', icon: Ticket },
    { id: 'business', label: 'Business Dashboard', icon: Store },
    { id: 'scanner', label: 'Verify & Redeem', icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div 
              onClick={() => setActiveTab('explore')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Ticket className="w-6 h-6 text-slate-950 transform -rotate-12" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    VoucherBox
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    BOT Chain
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Digital Discount Protocol</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contract Status Pill */}
            <button
              onClick={onOpenSettings}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
              title="Click to view or edit contract address"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-mono text-slate-400">Contract:</span>
              <span className="font-mono text-[11px] text-emerald-400 font-medium">
                {contractAddress ? shortenAddress(contractAddress) : 'Set Address'}
              </span>
            </button>

            {/* Network Detection & Switch Button */}
            {isConnected && !isBotChain && (
              <button
                onClick={() => switchChain?.({ chainId: 968 })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all animate-pulse"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Switch to BOT Chain</span>
              </button>
            )}

            {/* Active Network Pill */}
            {isConnected && isBotChain && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-slate-300 font-medium">
                  {chainId === 968 ? 'BOT Testnet' : 'BOT Mainnet'}
                </span>
                {balanceData && (
                  <span className="font-mono text-slate-400 border-l border-slate-700 pl-2">
                    {parseFloat(balanceData.formatted).toFixed(3)} {balanceData.symbol}
                  </span>
                )}
              </div>
            )}

            {/* Wallet Connect / Account Button */}
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <button
                onClick={() => open()}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-medium text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-[10px] font-bold">
                  B
                </div>
                <span className="font-mono">{shortenAddress(address)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2.5 gap-2 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

