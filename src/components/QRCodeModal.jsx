import React, { useState, useRef } from 'react';
import { X, Copy, Check, Ticket, ShieldCheck, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { shortenAddress } from '../config/networks';

export function QRCodeModal({ isOpen, onClose, voucher, campaign, contractAddress }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef(null);

  if (!isOpen || !voucher) return null;

  // Verification payload inside QR code
  const qrPayload = JSON.stringify({
    voucherId: voucher.voucherId,
    campaignId: voucher.campaignId,
    customer: voucher.customer,
    contract: contractAddress,
    claimedAt: voucher.claimedAt,
    app: 'VoucherBox',
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(voucher.voucherId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTicket = () => {
    setDownloading(true);
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 400;
      canvas.height = 540;

      img.onload = () => {
        // Draw Ticket Background
        ctx.fillStyle = '#0f172a';
        ctx.roundRect(0, 0, 400, 540, 24);
        ctx.fill();

        // Draw Header Border & Glow
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.roundRect(0, 0, 400, 540, 24);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VOUCHERBOX PASS', 200, 45);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`VOUCHER ID #${voucher.voucherId}`, 200, 75);

        // Campaign Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        const campTitle = campaign ? campaign.name : `Campaign #${voucher.campaignId}`;
        ctx.fillText(campTitle.length > 32 ? campTitle.substring(0, 32) + '...' : campTitle, 200, 105);

        // Draw QR Code
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(85, 125, 230, 230, 16);
        ctx.fill();
        ctx.drawImage(img, 100, 140, 200, 200);

        // Discount text
        if (campaign) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 22px sans-serif';
          const discountStr = campaign.discountType === 0 ? `${campaign.discountValue}% OFF` : `${campaign.discountValue} BOT OFF`;
          ctx.fillText(discountStr, 200, 395);
        }

        // Details
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.fillText(`Customer: ${shortenAddress(voucher.customer)}`, 200, 435);
        ctx.fillText(`BOT Chain • Chain ID: 968`, 200, 460);
        ctx.fillText(`scan.bohr.life`, 200, 485);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `VoucherBox-${voucher.voucherId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloading(false);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Download error:', err);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Ticket className="w-3.5 h-3.5" />
          <span>Voucher Pass</span>
        </div>

        <h3 className="text-xl font-bold mb-1">
          {campaign ? campaign.name : `Campaign #${voucher.campaignId}`}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Present this QR code to the merchant to redeem your discount
        </p>

        {/* QR Code Card */}
        <div ref={qrRef} className="p-4 rounded-2xl bg-white shadow-inner flex items-center justify-center mb-5">
          <QRCodeSVG
            value={qrPayload}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Voucher ID Pill */}
        <div className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher ID</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">
              #{voucher.voucherId}
            </span>
          </div>

          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Action button to download ticket pass */}
        <button
          onClick={handleDownloadTicket}
          disabled={downloading}
          className="w-full py-2.5 px-4 mb-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>{downloading ? 'Generating Pass...' : 'Save Pass Image'}</span>
        </button>

        {/* Metadata */}
        <div className="w-full text-xs text-slate-400 space-y-1.5 text-left bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between">
            <span>Owner Wallet:</span>
            <span className="font-mono text-slate-200">{shortenAddress(voucher.customer)}</span>
          </div>
          {campaign && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="font-semibold text-emerald-400">
                {campaign.discountType === 0 ? `${campaign.discountValue}% OFF` : `${campaign.discountValue} BOT OFF`}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-semibold ${voucher.isRedeemed ? 'text-blue-400' : 'text-emerald-400'}`}>
              {voucher.isRedeemed ? 'Redeemed' : 'Ready to Redeem'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verifiable on BOT Chain</span>
        </div>
      </div>
    </div>
  );
}
