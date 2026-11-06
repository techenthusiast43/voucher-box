import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Ticket, 
  PlusCircle, 
  Store 
} from 'lucide-react';
import { shortenAddress, getAddressExplorerUrl } from '../config/networks';

export function ExploreView({ 
  campaigns, 
  userVouchers, 
  isLoading, 
  onClaim, 
  onGoToDashboard, 
  contractAddress 
}) {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, percentage, fixed, available
  const [claimingId, setClaimingId] = useState(null);

  // Set of campaignIds already claimed by current connected user
  const claimedCampaignIds = useMemo(() => {
    return new Set(userVouchers.map(v => v.campaignId));
  }, [userVouchers]);

  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Exclude cancelled campaigns from primary explore view
      if (c.isCancelled) return false;

      // Search match
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.owner.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Filter category
      if (filterType === 'percentage') return c.discountType === 0;
      if (filterType === 'fixed') return c.discountType === 1;
      if (filterType === 'available') {
        const isExpired = c.expiryDate <= now;
        const isSoldOut = c.claimedCount >= c.maxClaims;
        const alreadyClaimed = claimedCampaignIds.has(c.id);
        return !isExpired && !isSoldOut && !alreadyClaimed;
      }
      return true;
    });
  }, [campaigns, searchQuery, filterType, claimedCampaignIds, now]);

  const handleClaimClick = async (campaign) => {
    if (!isConnected) {
      open();
      return;
    }
    setClaimingId(campaign.id);
    try {
      await onClaim(campaign.id);
    } finally {
      setClaimingId(null);
    }
  };

  const formatExpiry = (timestamp) => {
    const diff = timestamp - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m left`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Decentralized Voucher Exchange</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            Claim Verified Digital Discounts on <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">BOT Chain</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
            Browse exclusive offers from verified businesses, claim vouchers directly to your EVM wallet, and redeem them instantly via on-chain smart contracts.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const element = document.getElementById('explore-grid');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Browse Active Vouchers
            </button>
            <button
              onClick={onGoToDashboard}
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Launch a Business Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div id="explore-grid" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaign name or merchant address..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Campaigns' },
            { id: 'available', label: 'Claimable Now' },
            { id: 'percentage', label: '% Percentage' },
            { id: 'fixed', label: 'Fixed BOT' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Campaign Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto my-12 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Active Campaigns</h3>
          <p className="text-sm text-slate-400 mb-6">
            {campaigns.length === 0
              ? "There are currently no voucher campaigns published on the smart contract. Be the first merchant to create one!"
              : "No campaigns matched your current search or filter criteria."}
          </p>
          <button
            onClick={onGoToDashboard}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const isExpired = camp.expiryDate <= now;
            const isSoldOut = camp.claimedCount >= camp.maxClaims;
            const alreadyClaimed = claimedCampaignIds.has(camp.id);
            const progressPercent = Math.min(100, Math.round((camp.claimedCount / camp.maxClaims) * 100));

            return (
              <div
                key={camp.id}
                className="group relative rounded-2xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Discount Badge & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm tracking-tight">
                      {camp.discountType === 0 ? `${camp.discountValue}% DISCOUNT` : `${camp.discountValue} BOT OFF`}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={isExpired ? 'text-rose-400 font-bold' : ''}>
                        {formatExpiry(camp.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Title */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {camp.name}
                  </h3>

                  {/* Merchant info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    <span>Merchant:</span>
                    <a
                      href={getAddressExplorerUrl(camp.owner, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <span>{shortenAddress(camp.owner)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Claims Progress */}
                  <div className="mb-6 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Claimed</span>
                      </span>
                      <span className="font-semibold text-slate-200">
                        {camp.claimedCount} / {camp.maxClaims} ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div>
                  {alreadyClaimed ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Already Claimed</span>
                    </div>
                  ) : isSoldOut ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-semibold text-center border border-slate-700/50">
                      Max Claims Reached
                    </div>
                  ) : isExpired ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-rose-950/20 text-rose-400 text-xs font-semibold text-center border border-rose-900/30">
                      Campaign Expired
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimClick(camp)}
                      disabled={claimingId === camp.id}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{claimingId === camp.id ? 'Claiming...' : 'Claim Voucher'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

