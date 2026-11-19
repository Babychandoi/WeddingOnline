'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, X, Move } from 'lucide-react';

interface VideoPipOverlayProps {
  embedUrl: string;
  isLive: boolean;
  onClose: () => void;
}

export const VideoPipOverlay: React.FC<VideoPipOverlayProps> = ({ embedUrl, isLive, onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: 76 });
  const [dragging, setDragging] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || expanded) return;
    setPos((prev) => ({
      x: Math.max(8, Math.min(window.innerWidth - 340, prev.x + e.movementX)),
      y: Math.max(8, Math.min(window.innerHeight - 230, prev.y + e.movementY)),
    }));
  };

  return (
    <div
      style={expanded ? undefined : { left: pos.x, top: pos.y }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDragging(false)}
      className={
        expanded
          ? 'fixed inset-4 z-40 flex flex-col overflow-hidden rounded-2xl border border-amber-300 bg-slate-950 shadow-2xl'
          : 'fixed z-40 w-[330px] overflow-hidden rounded-2xl border border-amber-300 bg-slate-950 shadow-2xl sm:w-[390px]'
      }
    >
      <div
        onPointerDown={() => setDragging(true)}
        className="flex cursor-move items-center justify-between bg-slate-900 px-3 py-2 text-xs font-semibold text-white select-none"
      >
        <div className="flex items-center gap-2">
          <Move className="h-3.5 w-3.5 text-amber-400" />
          <span>{isLive ? '🔴 LIVESTREAM LỄ CƯỚI' : '🎬 VIDEO KỶ NIỆM'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 hover:bg-slate-800"
            title={expanded ? 'Thu nhỏ PiP' : 'Phóng to'}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-rose-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {embedUrl ? (
        <iframe
          src={embedUrl}
          className={expanded ? 'h-full w-full flex-1 border-0' : 'aspect-video w-full border-0'}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Wedding Stage Video"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center p-4 text-center text-xs text-slate-300">
          Cô Dâu &amp; Chú Rể chưa gắn link YouTube Live / Vimeo / Google Drive cho màn hình LED.
        </div>
      )}
    </div>
  );
};
