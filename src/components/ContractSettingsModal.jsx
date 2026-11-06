import React, { useState } from 'react';
import { X, Check, Copy, Settings, ShieldAlert, Globe } from 'lucide-react';
import { getActiveContractAddress, setCustomContractAddress } from '../config/contract';

export function ContractSettingsModal({ isOpen, onClose, onUpdated }) {
  const [addressInput, setAddressInput] = useState(getActiveContractAddress() || '');
  const [copiedField, setCopiedField] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = addressInput.trim();
    if (trimmed && (!trimmed.startsWith('0x') || trimmed.length !== 42)) {
      setStatusMsg('Invalid EVM contract address format (must start with 0x and be 42 chars)');
      return;
    }
    setCustomContractAddress(trimmed);
    setStatusMsg('Contract address saved!');
    setTimeout(() => {
      setStatusMsg('');
      onUpdated?.();
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setCustomContractAddress('');
    setAddressInput(getActiveContractAddress() || '');
    setStatusMsg('Reset to default deployed address');
    setTimeout(() => {
      setStatusMsg('');
      onUpdated?.();
    }, 800);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel-glow text-white shadow-2xl border border-slate-700/80 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Contract & BOT Chain Network</h3>
            <p className="text-xs text-slate-400">Configure contract address and verify network parameters</p>
          </div>
        </div>

        {/* Contract Address Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            VoucherBox Contract Address
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="0x..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          {statusMsg && (
            <p className="mt-1.5 text-xs text-emerald-400">{statusMsg}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Save Address
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            >
              Reset Default
            </button>
          </div>
        </div>

        {/* Network Details Reference */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>BOT Chain Testnet Configuration</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block mb-0.5">Chain ID</span>
              <span className="font-mono font-semibold text-white">968 (0x3c8)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block mb-0.5">Currency Symbol</span>
              <span className="font-mono font-semibold text-white">BOT</span>
            </div>
            <div className="col-span-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">RPC Endpoint</span>
                <span className="font-mono text-[11px] text-white">https://rpc.bohr.life</span>
              </div>
              <button
                onClick={() => copyToClipboard('https://rpc.bohr.life', 'rpc')}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                {copiedField === 'rpc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="col-span-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">Block Explorer</span>
                <span className="font-mono text-[11px] text-white">https://scan.bohr.life/</span>
              </div>
              <button
                onClick={() => copyToClipboard('https://scan.bohr.life/', 'explorer')}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                {copiedField === 'explorer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Make sure your wallet is connected to BOT Chain Testnet (Chain ID 968) before performing transactions.</span>
        </div>
      </div>
    </div>
  );
}

