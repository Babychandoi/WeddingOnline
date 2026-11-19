'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import type {
  BouquetCatchRecord,
  GiftLedgerRecord,
  GuestbookEntryRecord,
  PhotoAssetRecord,
  PublicWeddingDTO,
} from '@dco/database';

interface PrintableKeepsakeProps {
  wedding: PublicWeddingDTO;
  photos: PhotoAssetRecord[];
  guestbook: GuestbookEntryRecord[];
  bouquetCatches: BouquetCatchRecord[];
  privateLedger: GiftLedgerRecord[] | null;
}

export const PrintableKeepsake: React.FC<PrintableKeepsakeProps> = ({
  wedding,
  photos,
  guestbook,
  bouquetCatches,
  privateLedger,
}) => {
  const [includeLedger, setIncludeLedger] = useState(Boolean(privateLedger && privateLedger.length > 0));
  const totalVnd = (privateLedger || []).reduce((s, r) => s + r.amountVnd, 0);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      {/* Screen-only toolbar */}
      <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm print:hidden">
        <Link
          href={`/dashboard/${wedding.slug}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Quản trị
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {privateLedger && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeLedger}
                onChange={(e) => setIncludeLedger(e.target.checked)}
              />
              In kèm trang Sổ Mừng Cưới (Riêng tư)
            </label>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500"
          >
            <Printer className="h-4 w-4" /> Xuất / In Sổ Kỷ Niệm PDF
          </button>
        </div>
      </div>

      {/* Printable A4 Keepsake Book */}
      <article className="mx-auto max-w-4xl space-y-10 bg-white p-10 shadow-xl print:max-w-none print:p-6 print:shadow-none">
        {/* Cover */}
        <section className="border-4 border-double border-amber-400 p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-600">
            SỔ KỶ NIỆM HÔN LỄ TRỰC TUYẾN
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-slate-900">{wedding.title}</h1>
          <p className="mt-2 text-lg font-semibold text-amber-700">
            {wedding.groomName} &amp; {wedding.brideName}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Ngày thành hôn: {new Date(wedding.weddingDate).toLocaleDateString('vi-VN')}
          </p>
        </section>

        {/* Gallery & Photobooth */}
        {photos.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="mb-4 border-b border-amber-200 pb-2 font-serif text-xl font-bold text-rose-800">
              Khoảnh Khắc &amp; Photobooth Kỷ Niệm ({photos.length} ảnh)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((p) => (
                <div key={p.id} className="break-inside-avoid rounded-xl border border-amber-100 p-2">
                  <img
                    src={p.publicUrl}
                    alt={p.caption || 'Ảnh kỷ niệm'}
                    className="h-52 w-full rounded-lg object-cover"
                  />
                  {p.caption && <p className="mt-1.5 text-xs text-slate-700">{p.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guestbook Wishes */}
        <section>
          <h2 className="mb-4 border-b border-amber-200 pb-2 font-serif text-xl font-bold text-rose-800">
            Sổ Lưu Bút Trăm Năm ({guestbook.length} lời chúc)
          </h2>
          {guestbook.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có lời chúc lưu bút.</p>
          ) : (
            <div className="space-y-3">
              {guestbook.map((g) => (
                <div key={g.id} className="break-inside-avoid rounded-xl border border-amber-100 bg-amber-50/30 p-3.5">
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>{g.authorName}</span>
                    <span className="font-normal text-slate-500">
                      {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{g.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bouquet Hall of Fame */}
        {bouquetCatches.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="mb-3 border-b border-amber-200 pb-2 font-serif text-xl font-bold text-rose-800">
              Kỷ Lục Bắt Hoa Cưới
            </h2>
            <ul className="space-y-1 text-sm">
              {bouquetCatches.map((b) => (
                <li key={b.id}>
                  💐 <strong>{b.winnerName}</strong> ({new Date(b.caughtAt).toLocaleString('vi-VN')})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Optional Private Gift Ledger */}
        {includeLedger && privateLedger && (
          <section className="break-before-page">
            <h2 className="mb-2 border-b border-rose-200 pb-2 font-serif text-xl font-bold text-rose-800">
              Bảng Tổng Hợp Sổ Mừng Cưới Riêng Tư
            </h2>
            <p className="mb-4 text-sm text-slate-700">
              Tổng cộng: <strong>{totalVnd.toLocaleString('vi-VN')} VNĐ</strong> ({privateLedger.length}{' '}
              giao dịch)
            </p>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="py-2">Khách Mời</th>
                  <th className="py-2">Số Tiền</th>
                  <th className="py-2">Lời Chúc</th>
                  <th className="py-2">Mã GD</th>
                </tr>
              </thead>
              <tbody>
                {privateLedger.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-2 font-bold">{item.guestName}</td>
                    <td className="py-2 font-bold">{item.amountVnd.toLocaleString('vi-VN')}đ</td>
                    <td className="py-2">{item.wishMessage}</td>
                    <td className="py-2">{item.providerTxId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </article>
    </div>
  );
};
