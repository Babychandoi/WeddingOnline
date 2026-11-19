'use client';

import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

interface CopyLinkButtonProps {
  url: string;
  label?: string;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({
  url,
  label = 'Sao chép Link Thiệp Mời',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/w/${url.split('/w/').pop()}` : url;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" /> Đã chép liên kết gửi Zalo / Messenger!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
};
