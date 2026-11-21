'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ChevronLeft, Gift, Lock, MessageCircleHeart, Minus, Send, ShieldOff, Sparkles } from 'lucide-react';
import { HALL_CHAT_MAX_LENGTH, PRIVATE_MESSAGE_MAX_LENGTH, getFireworkPack, type HallChatMessage, type PrivateMessage } from '@dco/shared';

export interface DmThread {
  userId: string;
  name: string;
  messages: PrivateMessage[];
  unread: number;
  lastTs: number;
}

export const SIDE_LABELS: Record<string, string> = {
  GROOM_SIDE: 'Nhà trai',
  BRIDE_SIDE: 'Nhà gái',
  FRIEND: 'Bạn bè',
  COLLEAGUE: 'Đồng nghiệp',
};

export const ROLE_LABELS: Record<string, string> = {
  BRIDE: 'Cô dâu',
  GROOM: 'Chú rể',
  MC: 'MC',
  OWNER: 'Chủ tiệc',
};

const SIDE_INK: Record<string, string> = {
  GROOM_SIDE: 'text-sky-800',
  BRIDE_SIDE: 'text-rose-700',
  FRIEND: 'text-amber-800',
  COLLEAGUE: 'text-emerald-800',
};

const QUICK_WISHES = ['Chúc mừng hạnh phúc! 🎉', 'Trăm năm hạnh phúc 💕', 'Sớm có tin vui nhé 👶', '1-2-3 Dzô! 🥂'];

const hhmm = (ts: number) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Keeps a list pinned to its newest line unless the reader has scrolled up */
function useStickToBottom(dep: unknown) {
  const ref = useRef<HTMLOListElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [missed, setMissed] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
    else setMissed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAtBottom(bottom);
    if (bottom) setMissed(false);
  };
  const jump = () => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setMissed(false);
  };
  return { ref, onScroll, missed, jump };
}

function ChatLine({ m, mine }: { m: HallChatMessage; mine: boolean }) {
  if (m.kind === 'gift') {
    return (
      <li className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 px-3 py-2">
        <p className="text-[12.5px] font-bold text-rose-800">
          <Gift className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden="true" />
          {m.name} đã gửi quà mừng cưới
        </p>
        {m.text && <p className="mt-0.5 text-[13px] italic leading-snug text-slate-700">“{m.text}”</p>}
      </li>
    );
  }
  if (m.kind === 'fireworks') {
    const pack = m.packId ? getFireworkPack(m.packId) : undefined;
    return (
      <li className="rounded-xl border border-amber-300/70 bg-gradient-to-br from-[#2a1638] to-[#4a1f3a] px-3 py-2 text-amber-50">
        <p className="text-[12.5px] font-bold text-amber-200">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden="true" />
          {m.name} bắn {pack?.label.toLowerCase() ?? 'pháo hoa'} chúc mừng cô dâu chú rể
        </p>
        {m.text && <p className="mt-0.5 text-[13px] italic leading-snug text-amber-50/90">“{m.text}”</p>}
      </li>
    );
  }
  if (m.kind === 'system') {
    return <li className="px-2 text-center text-[11.5px] text-slate-500">{m.text}</li>;
  }
  const role = m.role ? ROLE_LABELS[m.role] : undefined;
  return (
    <li className={`group rounded-xl px-2.5 py-1.5 ${mine ? 'bg-rose-50/80' : ''}`}>
      <p className="text-[13px] leading-snug text-slate-800 [overflow-wrap:anywhere]">
        <span className={`font-bold ${SIDE_INK[m.side ?? ''] ?? 'text-slate-900'}`}>{m.name}</span>
        {role && <span className="ml-1 rounded bg-rose-600 px-1 py-px align-[1px] text-[9.5px] font-bold uppercase tracking-wide text-white">{role}</span>}
        <span className="ml-1.5 text-[10.5px] tabular-nums text-slate-400">{hhmm(m.ts)}</span>
        <br />
        {m.text}
      </p>
    </li>
  );
}

export function HallChatPanel(props: {
  myUserId: string;
  isPlaza: boolean;
  muted: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: 'chat' | 'dm';
  onTabChange: (tab: 'chat' | 'dm') => void;
  messages: HallChatMessage[];
  chatUnread: number;
  threads: DmThread[];
  dmPeer: string | null;
  onDmPeerChange: (userId: string | null) => void;
  onlineUserIds: Set<string>;
  blocked: Set<string>;
  onToggleBlock: (userId: string) => void;
  onSendChat: (text: string) => void;
  onSendDm: (userId: string, name: string, text: string) => void;
  canGift: boolean;
  onGift: () => void;
  onFireworks: () => void;
  /** Phones open the panel from the hall's bottom nav bar, so the floating button is desktop-only */
  hideTriggerOnMobile?: boolean;
}) {
  const { open, tab, messages, threads, dmPeer } = props;
  const dmUnread = threads.reduce((n, t) => n + t.unread, 0);
  const totalUnread = props.chatUnread + dmUnread;
  const [draft, setDraft] = useState('');
  const [dmDraft, setDmDraft] = useState('');
  const peer = dmPeer ? threads.find((t) => t.userId === dmPeer) : undefined;
  const chatList = useStickToBottom(messages.length);
  const dmList = useStickToBottom(`${dmPeer}:${peer?.messages.length ?? 0}`);
  const dmInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && tab === 'dm' && dmPeer) dmInput.current?.focus({ preventScroll: true });
  }, [open, tab, dmPeer]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => props.onOpenChange(true)}
        className={`pointer-events-auto relative min-h-[44px] items-center gap-2 rounded-full ${props.hideTriggerOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} bg-white/95 px-4 text-[13px] font-bold text-rose-900 shadow-lg ring-1 ring-amber-200/70 backdrop-blur transition hover:bg-white`}
        aria-label={totalUnread ? `Mở khung chat, ${totalUnread} tin mới` : 'Mở khung chat'}
      >
        <MessageCircleHeart className="h-[18px] w-[18px] text-rose-600" aria-hidden="true" />
        Chúc mừng
        {totalUnread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold tabular-nums text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  const sendChat = (text: string) => {
    const t = text.trim();
    if (!t) return;
    props.onSendChat(t);
    setDraft('');
  };

  const sendDm = () => {
    const t = dmDraft.trim();
    if (!t || !peer) return;
    props.onSendDm(peer.userId, peer.name, t);
    setDmDraft('');
  };

  const tabBtn = (id: 'chat' | 'dm', label: string, count: number) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => props.onTabChange(id)}
      className={`relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold transition ${
        tab === id ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-900 hover:bg-rose-50'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] tabular-nums ${tab === id ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );

  return (
    <section
      aria-label="Khung chat sảnh cưới"
      className="pointer-events-auto flex h-[min(58vh,540px)] w-[calc(100vw-1rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-amber-200/70 bg-[#fffdf8]/95 shadow-2xl backdrop-blur-md"
    >
      <header className="flex items-center gap-1 border-b border-amber-100 px-2 py-1.5">
        <div role="tablist" aria-label="Loại tin nhắn" className="flex flex-1 gap-1">
          {tabBtn('chat', 'Chúc mừng', props.chatUnread)}
          {tabBtn('dm', 'Tin riêng', dmUnread)}
        </div>
        <button type="button" onClick={() => props.onOpenChange(false)} aria-label="Thu gọn khung chat" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <Minus className="h-4 w-4" />
        </button>
      </header>

      {tab === 'chat' ? (
        <>
          <div className="relative min-h-0 flex-1">
            <ol ref={chatList.ref} onScroll={chatList.onScroll} aria-live="polite" className="h-full space-y-1 overflow-y-auto px-2 py-2 [scrollbar-width:thin]">
              {messages.length === 0 && (
                <li className="px-4 py-8 text-center text-[13px] leading-relaxed text-slate-500">
                  Chưa có lời chúc nào. Hãy là người đầu tiên chúc mừng cô dâu chú rể!
                </li>
              )}
              {messages.map((m) => (
                <ChatLine key={m.id} m={m} mine={m.userId === props.myUserId} />
              ))}
            </ol>
            {chatList.missed && (
              <button type="button" onClick={chatList.jump} className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11.5px] font-bold text-white shadow">
                <ArrowDown className="h-3 w-3" /> Tin mới
              </button>
            )}
          </div>

          <div className="border-t border-amber-100 bg-white/70 p-2">
            {!draft && !props.muted && (
              <div className="mb-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                {QUICK_WISHES.map((w) => (
                  <button key={w} type="button" onClick={() => sendChat(w)} className="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-50">
                    {w}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat(draft);
              }}
              className="flex gap-1.5"
            >
              <label htmlFor="hall-chat-input" className="sr-only">
                Lời chúc
              </label>
              <input
                id="hall-chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={HALL_CHAT_MAX_LENGTH}
                disabled={props.muted}
                autoComplete="off"
                placeholder={props.muted ? 'Bạn đang bị tắt tiếng' : 'Gửi lời chúc tới cô dâu chú rể…'}
                className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50"
              />
              <button type="submit" disabled={props.muted || !draft.trim()} aria-label="Gửi" className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-rose-600 text-white transition hover:bg-rose-500 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {props.canGift ? (
                <button type="button" onClick={props.onGift} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-[12.5px] font-bold text-rose-800 ring-1 ring-rose-200 transition hover:bg-rose-100">
                  <Gift className="h-4 w-4" /> Mừng cưới
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={props.onFireworks}
                className={`${props.canGift ? '' : 'col-span-2 '}inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3a1b4a] to-[#7a2350] text-[12.5px] font-bold text-amber-100 shadow-sm transition hover:brightness-110`}
              >
                <Sparkles className="h-4 w-4 text-amber-300" /> Bắn pháo hoa
              </button>
            </div>
          </div>
        </>
      ) : props.isPlaza ? (
        <p className="m-auto max-w-[28ch] px-4 text-center text-[13px] leading-relaxed text-slate-600">
          Quảng trường công cộng không có tin nhắn riêng. Tính năng này có trong sảnh cưới của từng cặp đôi.
        </p>
      ) : peer ? (
        <>
          <div className="flex items-center gap-2 border-b border-amber-100 px-2 py-1.5">
            <button type="button" onClick={() => props.onDmPeerChange(null)} aria-label="Quay lại danh sách" className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-slate-900">{peer.name}</p>
              <p className="text-[11px] text-slate-500">{props.onlineUserIds.has(peer.userId) ? 'Đang ở trong sảnh' : 'Không thấy trong sảnh này'}</p>
            </div>
            <button
              type="button"
              onClick={() => props.onToggleBlock(peer.userId)}
              className={`inline-flex min-h-[32px] items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold transition ${props.blocked.has(peer.userId) ? 'bg-slate-800 text-white' : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              <ShieldOff className="h-3.5 w-3.5" /> {props.blocked.has(peer.userId) ? 'Bỏ chặn' : 'Chặn'}
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ol ref={dmList.ref} onScroll={dmList.onScroll} aria-live="polite" className="h-full space-y-1.5 overflow-y-auto px-2.5 py-2 [scrollbar-width:thin]">
              <li className="mx-auto flex max-w-[30ch] items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] leading-snug text-amber-900">
                <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Chỉ hai bạn thấy cuộc trò chuyện này. Tin nhắn không được lưu lại, kể cả chủ tiệc cũng không đọc được.
              </li>
              {peer.messages.map((m) => {
                const mine = m.fromUserId === props.myUserId;
                return (
                  <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <p
                      className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[13.5px] leading-snug [overflow-wrap:anywhere] ${
                        mine ? 'rounded-br-md bg-rose-600 text-white' : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200'
                      }`}
                    >
                      {m.text}
                      <span className={`ml-2 align-[-1px] text-[10px] tabular-nums ${mine ? 'text-rose-100' : 'text-slate-400'}`}>{hhmm(m.ts)}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
            {dmList.missed && (
              <button type="button" onClick={dmList.jump} className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11.5px] font-bold text-white shadow">
                <ArrowDown className="h-3 w-3" /> Tin mới
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendDm();
            }}
            className="flex gap-1.5 border-t border-amber-100 bg-white/70 p-2"
          >
            <label htmlFor="hall-dm-input" className="sr-only">
              Tin nhắn riêng cho {peer.name}
            </label>
            <input
              ref={dmInput}
              id="hall-dm-input"
              value={dmDraft}
              onChange={(e) => setDmDraft(e.target.value)}
              maxLength={PRIVATE_MESSAGE_MAX_LENGTH}
              disabled={props.muted || props.blocked.has(peer.userId)}
              autoComplete="off"
              placeholder={props.blocked.has(peer.userId) ? 'Bạn đã chặn người này' : `Nhắn riêng cho ${peer.name}…`}
              className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50"
            />
            <button type="submit" disabled={!dmDraft.trim() || props.blocked.has(peer.userId)} aria-label="Gửi tin riêng" className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-rose-600 text-white transition hover:bg-rose-500 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Lock className="mx-auto h-6 w-6 text-rose-400" aria-hidden="true" />
              <p className="mt-2 text-[13.5px] font-semibold text-slate-800">Nhắn riêng với một người</p>
              <p className="mx-auto mt-1 max-w-[30ch] text-[12.5px] leading-relaxed text-slate-500">
                Bấm vào nhân vật của người đó trong sảnh rồi chọn “Nhắn tin riêng”. Chỉ hai người thấy tin nhắn.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-amber-100/70">
              {threads.map((t) => {
                const last = t.messages[t.messages.length - 1];
                return (
                  <li key={t.userId}>
                    <button type="button" onClick={() => props.onDmPeerChange(t.userId)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-rose-50/70">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-200 to-amber-100 text-[14px] font-bold text-rose-800">
                        {t.name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-bold text-slate-900">{t.name}</span>
                          {props.onlineUserIds.has(t.userId) && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="đang trong sảnh" />}
                        </span>
                        <span className={`block truncate text-[12.5px] ${t.unread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                          {last ? `${last.fromUserId === props.myUserId ? 'Bạn: ' : ''}${last.text}` : 'Bắt đầu trò chuyện'}
                        </span>
                      </span>
                      {t.unread > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold tabular-nums text-white">{t.unread}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
