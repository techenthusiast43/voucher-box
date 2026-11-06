import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  ScanLine, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Ban, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Ticket, 
  Store, 
  User 
} from 'lucide-react';
import { getActiveContractAddress, CONTRACT_ABI } from '../config/contract';
import { shortenAddress, getAddressExplorerUrl } from '../config/networks';

export function VoucherScannerView({ onRedeem, isLoadingAction }) {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const contractAddress = getActiveContractAddress();

  const [inputVal, setInputVal] = useState('');
  const [activeVoucherId, setActiveVoucherId] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [scanError, setScanError] = useState('');

  // Read single voucher and campaign from smart contract
  const {
    data: voucherData,
    isLoading: isVerifying,
    error: readError,
    refetch,
  } = useReadContract({
    address: contractAddress || undefined,
    abi: CONTRACT_ABI,
    functionName: 'getVoucher',
    args: activeVoucherId ? [BigInt(activeVoucherId)] : undefined,
    query: {
      enabled: Boolean(contractAddress && activeVoucherId),
    },
  });

  const now = Math.floor(Date.now() / 1000);

  const handleVerify = (e) => {
    e?.preventDefault();
    setScanError('');

    let parsedId = inputVal.trim();
    if (!parsedId) {
      setScanError('Please enter a Voucher ID');
      return;
    }

    // Handle scanned QR JSON string
    if (parsedId.startsWith('{')) {
      try {
        const json = JSON.parse(parsedId);
        if (json.voucherId) {
          parsedId = String(json.voucherId);
        }
      } catch (err) {
        // Not JSON, continue with raw string
      }
    }

    const num = Number(parsedId);
    if (isNaN(num) || num <= 0) {
      setScanError('Invalid Voucher ID format. Must be a positive integer.');
      return;
    }

    setActiveVoucherId(num);
  };

  // Format voucher & campaign result
  let voucher = null;
  let campaign = null;
  let status = 'valid'; // valid, redeemed, expired, cancelled
  let isOwner = false;

  if (voucherData && Array.isArray(voucherData) && voucherData.length === 2) {
    const rawV = voucherData[0];
    const rawC = voucherData[1];

    voucher = {
      voucherId: Number(rawV.voucherId),
      campaignId: Number(rawV.campaignId),
      customer: rawV.customer,
      claimedAt: Number(rawV.claimedAt),
      redeemedAt: Number(rawV.redeemedAt),
      isRedeemed: Boolean(rawV.isRedeemed),
    };

    campaign = {
      id: Number(rawC.id),
      owner: rawC.owner,
      name: rawC.name,
      discountType: Number(rawC.discountType),
      discountValue: Number(rawC.discountValue),
      expiryDate: Number(rawC.expiryDate),
      isCancelled: Boolean(rawC.isCancelled),
    };

    if (voucher.isRedeemed) {
      status = 'redeemed';
    } else if (campaign.isCancelled) {
      status = 'cancelled';
    } else if (campaign.expiryDate <= now) {
      status = 'expired';
    } else {
      status = 'valid';
    }

    if (address && campaign.owner.toLowerCase() === address.toLowerCase()) {
      isOwner = true;
    }
  }

  const handleRedeemClick = async () => {
    if (!isConnected) {
      open();
      return;
    }
    if (!activeVoucherId) return;

    setRedeeming(true);
    try {
      await onRedeem(activeVoucherId);
      refetch();
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <ScanLine className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Voucher Verification & Redemption
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Verify digital voucher authenticity directly on BOT Chain and execute authorized redemptions
        </p>
      </div>

      {/* Input / Scanner Card */}
      <div className="p-6 rounded-2xl glass-panel-glow border border-slate-700 shadow-xl space-y-4">
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Enter Voucher ID or QR Payload
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 1 or paste scanned QR code text"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20"
            >
              <Search className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Verify'}</span>
            </button>
          </div>

          {scanError && (
            <p className="text-xs text-rose-400">{scanError}</p>
          )}
        </form>
      </div>

      {/* Verification Results Card */}
      {isVerifying && (
        <div className="p-10 rounded-2xl glass-panel text-center text-slate-400 animate-pulse border border-slate-800">
          Querying BOT Chain smart contract for Voucher #{activeVoucherId}...
        </div>
      )}

      {readError && activeVoucherId && !isVerifying && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 text-rose-400" />
          <div className="text-xs">
            <span className="font-bold block">Voucher Not Found</span>
            <span>Voucher #{activeVoucherId} does not exist on this contract or hasn't been claimed yet.</span>
          </div>
        </div>
      )}

      {voucher && campaign && !isVerifying && (
        <div className="rounded-2xl glass-panel-glow border border-slate-700/80 p-6 space-y-6 shadow-2xl">
          {/* Top Status Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-400 block">
                Voucher Verification Result
              </span>
              <h3 className="text-xl font-black text-white">ID #{voucher.voucherId}</h3>
            </div>

            {status === 'valid' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>VALID & REDEEMABLE</span>
              </div>
            )}
            {status === 'redeemed' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ALREADY REDEEMED</span>
              </div>
            )}
            {status === 'expired' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>EXPIRED</span>
              </div>
            )}
            {status === 'cancelled' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                <Ban className="w-4 h-4" />
                <span>CAMPAIGN CANCELLED</span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Campaign</span>
              <span className="text-white font-bold text-sm">{campaign.name}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Discount Offer</span>
              <span className="text-emerald-400 font-extrabold text-sm">
                {campaign.discountType === 0 ? `${campaign.discountValue}% OFF` : `${campaign.discountValue} BOT OFF`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Customer Wallet</span>
              <a
                href={getAddressExplorerUrl(voucher.customer, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1"
              >
                <span>{shortenAddress(voucher.customer)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Campaign Owner</span>
              <a
                href={getAddressExplorerUrl(campaign.owner, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1"
              >
                <span>{shortenAddress(campaign.owner)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Claimed Date</span>
              <span className="font-mono text-slate-200">
                {new Date(voucher.claimedAt * 1000).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Campaign Expiry</span>
              <span className="font-mono text-slate-200">
                {new Date(campaign.expiryDate * 1000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Authorization Check & Action */}
          <div className="pt-2">
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="w-full py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Connect Merchant Wallet to Redeem</span>
              </button>
            ) : !isOwner ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                  <strong>Unauthorized Wallet:</strong> Only the campaign owner (<span className="font-mono">{shortenAddress(campaign.owner)}</span>) can redeem this voucher.
                </span>
              </div>
            ) : status === 'valid' ? (
              <button
                onClick={handleRedeemClick}
                disabled={redeeming || isLoadingAction}
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{redeeming ? 'Redeeming on BOT Chain...' : 'Redeem Voucher Now'}</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-800 text-slate-400 text-xs text-center">
                This voucher cannot be redeemed because it is {status}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

