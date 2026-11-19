'use client';

import React, { useState } from 'react';
import { BookHeart, Send, X } from 'lucide-react';
import type { GuestbookEntryRecord } from '@dco/database';
import type { GuestSide } from '@dco/shared';

interface GuestbookModalProps {
  slug: string;
  entries: GuestbookEntryRecord[];
  defaultName: string;
  defaultSide: GuestSide;
  onEntryAdded: (entry: GuestbookEntryRecord) => void;
  onClose: () => void;
}

export const GuestbookModal: React.FC<GuestbookModalProps> = ({
  slug,
  entries,
  defaultName,
  defaultSide,
  onEntryAdded,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/weddings/${encodeURIComponent(slug)}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: defaultName,
          side: defaultSide,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không gửi được lưu bút');
      onEntryAdded(data.entry);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi gửi lưu bút');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookHeart className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-900">Sổ Lưu Bút Trăm Năm</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <input
            type="text"
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Viết lời chúc lưu giữ vĩnh viễn cho Cô Dâu & Chú Rể..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Gửi
          </button>
        </form>
        {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {entries.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Hãy là người đầu tiên ký sổ lưu bút!
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{entry.authorName}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(entry.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
