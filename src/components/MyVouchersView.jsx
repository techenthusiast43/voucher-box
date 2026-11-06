import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Ticket, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Store, 
  Sparkles, 
  Ban 
} from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
import { shortenAddress, getAddressExplorerUrl } from '../config/networks';

export function MyVouchersView({ userVouchers, campaigns, isLoading, contractAddress }) {
  const { isConnected, address, chainId } = useAccount();
  const { open } = useAppKit();
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, redeemed, expired

  const now = Math.floor(Date.now() / 1000);

  // Map campaign lookup
  const campaignsMap = useMemo(() => {
    const map = new Map();
    campaigns.forEach((c) => map.set(c.id, c));
    return map;
  }, [campaigns]);

  // Enriched voucher list with status
  const enrichedVouchers = useMemo(() => {
    return userVouchers.map((v) => {
      const camp = campaignsMap.get(v.campaignId);
      let status = 'active'; // active, redeemed, expired, cancelled

      if (v.isRedeemed) {
        status = 'redeemed';
      } else if (camp?.isCancelled) {
        status = 'cancelled';
      } else if (camp && camp.expiryDate <= now) {
        status = 'expired';
      }

      return {
        ...v,
        campaign: camp,
        status,
      };
    });
  }, [userVouchers, campaignsMap, now]);

  const filteredVouchers = useMemo(() => {
    if (statusFilter === 'all') return enrichedVouchers;
    return enrichedVouchers.filter((v) => v.status === statusFilter);
  }, [enrichedVouchers, statusFilter]);

  const handleOpenQR = (voucher, campaign) => {
    setSelectedVoucher(voucher);
    setSelectedCampaign(campaign);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'redeemed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Redeemed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-slate-700">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect your Web3 wallet to access your claimed discount vouchers and QR passes.
        </p>
        <button
          onClick={() => open()}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          Connect Wallet Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>My Claimed Vouchers</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
              {enrichedVouchers.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Display your active QR codes to merchants at checkout to claim your discounts
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'redeemed', label: 'Redeemed' },
            { id: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vouchers */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto my-8 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Vouchers Found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {enrichedVouchers.length === 0
              ? "You haven't claimed any vouchers yet. Explore available campaigns and claim your first discount!"
              : `No vouchers currently match the "${statusFilter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const camp = voucher.campaign;
            return (
              <div
                key={voucher.voucherId}
                className="ticket-card p-6 flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300 shadow-xl"
              >
                {/* Left and Right Ticket Cutout Perforations */}
                <div className="ticket-cutout-left" />
                <div className="ticket-cutout-right" />

                <div>
                  {/* Top: Voucher ID & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      ID #{voucher.voucherId}
                    </span>
                    {getStatusBadge(voucher.status)}
                  </div>

                  {/* Campaign Name */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {camp ? camp.name : `Campaign #${voucher.campaignId}`}
                  </h3>

                  {/* Discount Value Highlight */}
                  {camp && (
                    <div className="text-2xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text mb-4">
                      {camp.discountType === 0 ? `${camp.discountValue}% OFF` : `${camp.discountValue} BOT OFF`}
                    </div>
                  )}

                  {/* Merchant Address */}
                  {camp && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
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
                  )}
                </div>

                {/* Perforated separator */}
                <div className="ticket-dashed-line my-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      <span>Claimed: </span>
                      <span className="font-mono text-slate-300">
                        {new Date(voucher.claimedAt * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    {/* QR Code Action Button */}
                    <button
                      onClick={() => handleOpenQR(voucher, camp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Show QR Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        voucher={selectedVoucher}
        campaign={selectedCampaign}
        contractAddress={contractAddress}
      />
    </div>
  );
}

