import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Navbar } from './components/Navbar';
import { ExploreView } from './components/ExploreView';
import { MyVouchersView } from './components/MyVouchersView';
import { BusinessDashboardView } from './components/BusinessDashboardView';
import { VoucherScannerView } from './components/VoucherScannerView';
import { TransactionModal } from './components/TransactionModal';
import { ContractSettingsModal } from './components/ContractSettingsModal';
import { useVoucherBox } from './hooks/useVoucherBox';
import confetti from 'canvas-confetti';
import { Sparkles, Ticket, ShieldCheck, AlertCircle, ExternalLink, Settings } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txTitle, setTxTitle] = useState('');

  const { address, chainId } = useAccount();

  const {
    contractAddress,
    campaigns,
    userVouchers,
    merchantCampaigns,
    isLoadingCampaigns,
    isLoadingUserVouchers,
    isLoadingMerchantCampaigns,
    createCampaign,
    claimVoucher,
    redeemVoucher,
    cancelCampaign,
    refetchAll,
    txHash,
    isTxPending,
    isTxConfirming,
    isTxSuccess,
    writeError,
    confirmError,
  } = useVoucherBox();

  // Watch transaction states to trigger modal
  useEffect(() => {
    if (isTxPending || isTxConfirming || isTxSuccess || writeError || confirmError) {
      setIsTxModalOpen(true);
    }
    if (isTxSuccess) {
      refetchAll();
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  }, [isTxPending, isTxConfirming, isTxSuccess, writeError, confirmError]);

  const handleClaim = async (campaignId) => {
    setTxTitle('Voucher Claimed Successfully!');
    await claimVoucher(campaignId);
  };

  const handleCreateCampaign = async (name, discountType, discountValue, maxClaims, expiryTimestamp) => {
    setTxTitle('New Voucher Campaign Created on BOT Chain!');
    await createCampaign(name, discountType, discountValue, maxClaims, expiryTimestamp);
  };

  const handleRedeem = async (voucherId) => {
    setTxTitle(`Voucher #${voucherId} Successfully Redeemed!`);
    await redeemVoucher(voucherId);
  };

  const handleCancelCampaign = async (campaignId) => {
    setTxTitle(`Campaign #${campaignId} Cancelled Successfully`);
    await cancelCampaign(campaignId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Missing Contract Address Alert */}
        {!contractAddress && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold block">Smart Contract Not Configured</span>
                <span className="text-amber-300/80">
                  Deploy the contract to BOT Chain Testnet using <code className="bg-amber-950/60 px-1.5 py-0.5 rounded font-mono">npm run deploy:testnet</code> or set your contract address.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
            >
              Set Contract Address
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'explore' && (
          <ExploreView
            campaigns={campaigns}
            userVouchers={userVouchers}
            isLoading={isLoadingCampaigns}
            onClaim={handleClaim}
            onGoToDashboard={() => setActiveTab('business')}
            contractAddress={contractAddress}
          />
        )}

        {activeTab === 'my-vouchers' && (
          <MyVouchersView
            userVouchers={userVouchers}
            campaigns={campaigns}
            isLoading={isLoadingUserVouchers}
            contractAddress={contractAddress}
          />
        )}

        {activeTab === 'business' && (
          <BusinessDashboardView
            merchantCampaigns={merchantCampaigns}
            onCreateCampaign={handleCreateCampaign}
            onCancelCampaign={handleCancelCampaign}
            onGoToScanner={() => setActiveTab('scanner')}
            isLoading={isLoadingMerchantCampaigns}
          />
        )}

        {activeTab === 'scanner' && (
          <VoucherScannerView
            onRedeem={handleRedeem}
            isLoadingAction={isTxPending || isTxConfirming}
          />
        )}
      </main>

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        isPending={isTxPending}
        isConfirming={isTxConfirming}
        isSuccess={isTxSuccess}
        error={writeError || confirmError}
        txHash={txHash}
        chainId={chainId}
        title={txTitle}
      />

      {/* Contract Settings Modal */}
      <ContractSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={refetchAll}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-16 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">VoucherBox</span>
            <span>– Decentralized Digital Discount Protocol</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>BOT Chain Testnet (ID: 968)</span>
            <span>•</span>
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <span>BOTScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-colors"
            >
              Network Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;

