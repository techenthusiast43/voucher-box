import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, X } from 'lucide-react';
import { getTxExplorerUrl } from '../config/networks';

export function TransactionModal({ isOpen, onClose, isPending, isConfirming, isSuccess, error, txHash, chainId, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel-glow text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          {(isPending || isConfirming) && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {isSuccess && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          {error && !isSuccess && (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <AlertCircle className="w-9 h-9" />
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold mb-2">
            {isPending && "Confirm in Wallet"}
            {isConfirming && "Confirming on BOT Chain..."}
            {isSuccess && "Transaction Successful!"}
            {error && !isSuccess && "Transaction Failed"}
          </h3>

          <p className="text-sm text-slate-300 mb-6">
            {isPending && "Please sign the transaction in your connected wallet."}
            {isConfirming && "Waiting for block confirmation on BOT Chain..."}
            {isSuccess && (title || "Your transaction has been processed on-chain.")}
            {error && !isSuccess && (error.shortMessage || error.message || "An error occurred during transaction execution.")}
          </p>

          {/* Tx Hash Link */}
          {txHash && (
            <a
              href={getTxExplorerUrl(txHash, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 text-xs font-mono transition-colors border border-slate-700"
            >
              <span>View on BOT Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {isSuccess ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

