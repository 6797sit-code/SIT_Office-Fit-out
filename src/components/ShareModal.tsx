import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, QrCode, X, Globe, Smartphone, ShieldCheck } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl = 'https://ais-pre-rdzsunzm6xauiut6uhl22m-573940496354.asia-northeast1.run.app',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleNativeShare = () => {
    if (hasNativeShare) {
      navigator.share({
        title: '翔生資訊辦公室裝潢與設備工程進度系統',
        text: '請查閱翔生資訊10F辦公室裝潢14大工種施工時程與設備採購最新進度',
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Google Chart QR Code URL for quick mobile scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF6F4] flex items-center justify-center text-[#2A9D8F]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">分享專案進度給團隊與廠商</h3>
              <p className="text-[11px] text-slate-500">獨立公開網頁 • 無需登入 AI Studio 編輯器</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Highlight description */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>這是純展示與協作的「正式獨立網頁」</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              對方開啟後為<strong>完整乾淨的全螢幕儀表板</strong>（含日曆、甘特圖、14大工種進度、採購清單與待辦），<strong>完全不會出現 AI Studio 編輯器、程式碼或對話提示視窗</strong>。
            </p>
          </div>

          {/* URL Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>公開分享網址 (Shared App URL)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full font-medium">免登入直接開</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-hidden focus:border-[#2A9D8F]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#264653] hover:bg-[#1D353F] text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製！' : '複製'}</span>
              </button>
            </div>
          </div>

          {/* QR Code and Actions */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center gap-4">
            <div className="w-24 h-24 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="手機掃描 QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#264653]" />
                <span>手機現場掃碼立即查閱</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                施工現場師傅、設計師或主管可用 LINE / 相機掃描左側 QR Code，立即在手機上查閱當日進度與設備清單。
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>在新視窗開啟預覽</span>
            </button>
            <button
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{hasNativeShare ? '系統分享 (LINE/郵件)' : '複製網址分享'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
