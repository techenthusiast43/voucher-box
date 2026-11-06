import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Store, 
  Plus, 
  BarChart3, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  Ban, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  X, 
  ExternalLink, 
  ScanLine 
} from 'lucide-react';
import { shortenAddress, getAddressExplorerUrl } from '../config/networks';

export function BusinessDashboardView({ 
  merchantCampaigns, 
  onCreateCampaign, 
  onCancelCampaign, 
  onGoToScanner,
  isLoading 
}) {
  const { isConnected, address, chainId } = useAccount();
  const { open } = useAppKit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Form State for New Campaign
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState('0'); // 0: Percentage, 1: Fixed
  const [discountValue, setDiscountValue] = useState('20');
  const [maxClaims, setMaxClaims] = useState('50');
  const [expiryDays, setExpiryDays] = useState('14'); // Default 14 days
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const now = Math.floor(Date.now() / 1000);

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalClaimed = 0;
    let totalRedeemed = 0;
    let activeCampaigns = 0;

    merchantCampaigns.forEach((c) => {
      totalClaimed += c.claimedCount;
      totalRedeemed += c.redeemedCount;
      if (!c.isCancelled && c.expiryDate > now) {
        activeCampaigns += 1;
      }
    });

    const conversionRate = totalClaimed > 0 ? Math.round((totalRedeemed / totalClaimed) * 100) : 0;

    return {
      totalCampaigns: merchantCampaigns.length,
      activeCampaigns,
      totalClaimed,
      totalRedeemed,
      conversionRate,
    };
  }, [merchantCampaigns, now]);

  const handleSubmitCampaign = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a voucher campaign name');
      return;
    }
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Discount value must be greater than 0');
      return;
    }
    if (discountType === '0' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%');
      return;
    }
    const claims = Number(maxClaims);
    if (isNaN(claims) || claims <= 0) {
      setFormError('Maximum claims must be at least 1');
      return;
    }
    const days = Number(expiryDays);
    if (isNaN(days) || days <= 0) {
      setFormError('Expiry days must be at least 1');
      return;
    }

    const expiryTimestamp = Math.floor(Date.now() / 1000) + days * 86400;

    setIsSubmitting(true);
    try {
      await onCreateCampaign(name.trim(), Number(discountType), val, claims, expiryTimestamp);
      setIsModalOpen(false);
      setName('');
      setDiscountValue('20');
      setMaxClaims('50');
      setExpiryDays('14');
    } catch (err) {
      setFormError(err.shortMessage || err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = async (campaignId) => {
    if (!confirm('Are you sure you want to cancel this campaign? Users will no longer be able to claim it.')) {
      return;
    }
    setCancellingId(campaignId);
    try {
      await onCancelCampaign(campaignId);
    } finally {
      setCancellingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-slate-700">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Merchant Dashboard</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect your business wallet to launch voucher campaigns, track claims and redemptions in real time.
        </p>
        <button
          onClick={() => open()}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          Connect Business Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Business Campaign Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Merchant Mode
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your on-chain discount promotions on BOT Chain
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToScanner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Verify & Redeem Tool</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Merchant Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Campaigns</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.activeCampaigns} <span className="text-xs text-slate-500 font-normal">/ {metrics.totalCampaigns}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Claimed</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.totalClaimed}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Redeemed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.totalRedeemed}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.conversionRate}%
          </div>
        </div>
      </div>

      {/* Campaigns Table / Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>My Campaigns</span>
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : merchantCampaigns.length === 0 ? (
          <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto my-6 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Campaigns Created Yet</h3>
            <p className="text-xs text-slate-400 mb-6">
              Create your first promotional discount voucher campaign to attract BOT Chain users!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {merchantCampaigns.map((camp) => {
              const isExpired = camp.expiryDate <= now;
              const progressPercent = Math.min(100, Math.round((camp.claimedCount / camp.maxClaims) * 100));

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded">
                        #{camp.id}
                      </span>
                      <h4 className="text-base font-bold text-white">{camp.name}</h4>
                      {camp.isCancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Cancelled
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400">
                      <div>
                        <span>Discount: </span>
                        <span className="font-semibold text-emerald-400">
                          {camp.discountType === 0 ? `${camp.discountValue}% OFF` : `${camp.discountValue} BOT OFF`}
                        </span>
                      </div>
                      <div>
                        <span>Expires: </span>
                        <span className="font-mono text-slate-300">
                          {new Date(camp.expiryDate * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span>Redeemed: </span>
                        <span className="font-semibold text-blue-400">
                          {camp.redeemedCount} / {camp.claimedCount}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={onGoToScanner}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Redeem Voucher</span>
                    </button>

                    {!camp.isCancelled && !isExpired && (
                      <button
                        onClick={() => handleCancelClick(camp.id)}
                        disabled={cancellingId === camp.id}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{cancellingId === camp.id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl glass-panel-glow text-white shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Create New Campaign</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Launch an on-chain digital discount voucher campaign on BOT Chain
            </p>

            <form onSubmit={handleSubmitCampaign} className="space-y-4">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Campaign Title / Offer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Special 25% Off"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="0">Percentage (%)</option>
                    <option value="1">Fixed BOT Units</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {discountType === '0' ? 'Percentage (e.g. 20%)' : 'Fixed Amount'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === '0' ? '100' : '100000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Max Claims & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Claims Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxClaims}
                    onChange={(e) => setMaxClaims(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offer Preview</span>
                <div className="text-white font-bold">{name || 'Your Campaign Name'}</div>
                <div className="text-emerald-400 font-extrabold text-sm">
                  {discountType === '0' ? `${discountValue || 0}% OFF` : `${discountValue || 0} BOT OFF`}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Total {maxClaims || 0} claims allowed • Expires in {expiryDays || 14} days
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Submitting to Smart Contract...' : 'Deploy Campaign on BOT Chain'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

