'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, Loader2, Plus, Save, Trash2, Users } from 'lucide-react';
import {
  INVITATION_EVENT_LABELS,
  INVITATION_LIMITS,
  INVITATION_TEMPLATES,
  invitationItemId,
  type InvitationConfig,
  type InvitationEventKind,
  type InvitationSectionKey,
} from '@dco/shared';
import type { InvitationRsvpRecord, PhotoAssetRecord, PublicWeddingDTO } from '@dco/database';
import { CardFace } from '@/components/invitation/CardFace';
import { InvitationView } from '@/components/invitation/InvitationView';
import { SAMPLE_WISHES } from '@/components/invitation/sampleInvitation';

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200';
const label = 'mb-1 block text-xs font-bold text-slate-600';

const SECTION_LABELS: Record<InvitationSectionKey, string> = {
  family: 'Gia đình & lời mời',
  countdown: 'Đếm ngược',
  events: 'Lịch trình ngày cưới',
  story: 'Chuyện tình yêu',
  album: 'Album ảnh',
  hall: 'Lối vào sảnh cưới 3D',
  rsvp: 'Xác nhận tham dự',
  wishes: 'Sổ lời chúc',
  gift: 'Hộp mừng cưới',
};

const SIDE_LABEL: Record<string, string> = { GROOM_SIDE: 'Nhà trai', BRIDE_SIDE: 'Nhà gái', FRIEND: 'Bạn bè', COLLEAGUE: 'Đồng nghiệp' };

/** ISO instant ⇄ the value of <input type="datetime-local">, read as Vietnam time */
function toLocalInput(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  return new Date(t + 7 * 3600 * 1000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return new Date().toISOString();
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5])).toISOString();
}

function Group({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
      <legend className="px-1 text-sm font-black text-slate-900">{title}</legend>
      {hint && <p className="-mt-1 mb-3 text-xs leading-relaxed text-slate-500">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className={`${input} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-amber-200 hover:bg-slate-800"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  );
}

export function InvitationEditor({ wedding, photos }: { wedding: PublicWeddingDTO; photos: PhotoAssetRecord[] }) {
  const [config, setConfig] = useState<InvitationConfig | null>(null);
  const [rsvps, setRsvps] = useState<InvitationRsvpRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<'idle' | 'ok' | 'error'>('idle');
  const [loadError, setLoadError] = useState('');
  const [guestForLink, setGuestForLink] = useState('');
  const [origin, setOrigin] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch(`/api/weddings/${wedding.slug}/invitation`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Chỉ cô dâu, chú rể hoặc chủ tiệc mới sửa được thiệp.' : 'Không tải được thiệp.');
        return r.json();
      })
      .then((d: { config: InvitationConfig; rsvps: InvitationRsvpRecord[] }) => {
        setConfig(d.config);
        setRsvps(d.rsvps);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [wedding.slug]);

  const gallery = useMemo(() => photos.filter((p) => p.type === 'PRE_WEDDING_GALLERY').sort((a, b) => a.displayOrder - b.displayOrder), [photos]);

  if (loadError) return <p className="rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-800">{loadError}</p>;
  if (!config) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thiệp…
      </p>
    );
  }

  const patch = (p: Partial<InvitationConfig>) => {
    setConfig({ ...config, ...p });
    setSaved('idle');
  };

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/weddings/${wedding.slug}/invitation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return setSaved('error');
    const d = (await res.json()) as { config: InvitationConfig };
    setConfig(d.config);
    setSaved('ok');
  }

  const inviteUrl = `${origin}/thiep/${wedding.slug}`;
  const personalUrl = guestForLink.trim() ? `${inviteUrl}?khach=${encodeURIComponent(guestForLink.trim())}` : '';
  const attending = rsvps.filter((r) => r.attending);
  const headcount = attending.reduce((n, r) => n + r.headcount, 0);

  const preview = (
    <div className="mx-auto w-[390px] max-w-full overflow-hidden rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="h-[720px] overflow-y-auto">
        <InvitationView
          slug={wedding.slug}
          groomName={wedding.groomName}
          brideName={wedding.brideName}
          weddingDate={wedding.weddingDate}
          config={config}
          photos={gallery.map((p) => ({ id: p.id, url: p.publicUrl, caption: p.caption }))}
          guestName={guestForLink.trim() || 'Anh Tuấn'}
          gift={{ enabled: wedding.hasBankConfig, bankName: null }}
          hallUrl={`/w/${wedding.slug}`}
          venueThumb={null}
          initialWishes={SAMPLE_WISHES}
          demo
          embedded
        />
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
      <div className="space-y-5">
        {/* Share */}
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-black">Gửi thiệp cho khách</h3>
            <a href={`/thiep/${wedding.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">
              <ExternalLink className="h-4 w-4" /> Mở thiệp
            </a>
          </div>
          <p className="mt-1 text-xs text-slate-300">Đường dẫn chung, gửi vào nhóm Zalo hay đăng Facebook:</p>
          <div className="mt-2 [&_input]:bg-white">{origin && <CopyField value={inviteUrl} />}</div>
          <label htmlFor="guest-link" className="mt-4 block text-xs text-slate-300">
            Link mời riêng: nhập tên khách, phong bì sẽ ghi “Kính mời” kèm tên đó
          </label>
          <input id="guest-link" value={guestForLink} onChange={(e) => setGuestForLink(e.target.value)} placeholder="Ví dụ: Cô Ba và gia đình" maxLength={60} className={`${input} mt-1.5`} />
          {personalUrl && (
            <div className="mt-2 [&_input]:bg-white">
              <CopyField value={personalUrl} />
            </div>
          )}
        </div>

        <Group title="Mẫu thiệp" hint="Đổi mẫu bất cứ lúc nào, nội dung giữ nguyên.">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {INVITATION_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ templateId: t.id })}
                aria-pressed={config.templateId === t.id}
                className={`overflow-hidden rounded-xl text-left ring-offset-2 transition ${config.templateId === t.id ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200 hover:ring-slate-400'}`}
              >
                <CardFace templateId={t.id} groom={config.groomFullName} bride={config.brideFullName} dateLine="" className="pointer-events-none" />
                <span className="block truncate bg-white px-2 py-1.5 text-[11px] font-bold text-slate-800">{t.nameVi}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Tên & lời mời">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="inv-groom">Tên chú rể trên thiệp</label>
              <input id="inv-groom" className={input} value={config.groomFullName} maxLength={INVITATION_LIMITS.name} onChange={(e) => patch({ groomFullName: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor="inv-bride">Tên cô dâu trên thiệp</label>
              <input id="inv-bride" className={input} value={config.brideFullName} maxLength={INVITATION_LIMITS.name} onChange={(e) => patch({ brideFullName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="inv-headline">Dòng tiêu đề</label>
            <input id="inv-headline" className={input} value={config.headline} maxLength={INVITATION_LIMITS.headline} onChange={(e) => patch({ headline: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="inv-message">Lời mời</label>
            <textarea id="inv-message" className={`${input} min-h-[90px]`} value={config.message} maxLength={INVITATION_LIMITS.message} onChange={(e) => patch({ message: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="inv-quote">Câu thơ / trích dẫn</label>
            <input id="inv-quote" className={input} value={config.quote} maxLength={INVITATION_LIMITS.quote} onChange={(e) => patch({ quote: e.target.value })} />
          </div>
        </Group>

        <Group title="Hai bên gia đình" hint="Để trống nếu không muốn in tên bố mẹ.">
          {(['groomFamily', 'brideFamily'] as const).map((key) => (
            <div key={key} className="grid gap-3 sm:grid-cols-3">
              <p className="text-xs font-black uppercase tracking-wide text-rose-700 sm:col-span-3">{key === 'groomFamily' ? 'Nhà trai' : 'Nhà gái'}</p>
              {(['father', 'mother', 'address'] as const).map((field) => (
                <div key={field}>
                  <label className={label} htmlFor={`${key}-${field}`}>{field === 'father' ? 'Ông' : field === 'mother' ? 'Bà' : 'Địa chỉ'}</label>
                  <input
                    id={`${key}-${field}`}
                    className={input}
                    value={config[key][field]}
                    maxLength={INVITATION_LIMITS.familyField}
                    onChange={(e) => patch({ [key]: { ...config[key], [field]: e.target.value } } as Partial<InvitationConfig>)}
                  />
                </div>
              ))}
            </div>
          ))}
        </Group>

        <Group title="Lịch trình ngày cưới" hint="Giờ tính theo giờ Việt Nam. Bỏ trống link bản đồ thì thiệp tự tìm theo địa chỉ.">
          {config.events.map((ev, i) => (
            <div key={ev.id} className="space-y-2.5 rounded-xl bg-slate-50 p-3.5">
              <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
                <select
                  aria-label="Loại sự kiện"
                  className={input}
                  value={ev.kind}
                  onChange={(e) => {
                    const kind = e.target.value as InvitationEventKind;
                    const events = [...config.events];
                    events[i] = { ...ev, kind, title: ev.title === INVITATION_EVENT_LABELS[ev.kind] ? INVITATION_EVENT_LABELS[kind] : ev.title };
                    patch({ events });
                  }}
                >
                  {Object.entries(INVITATION_EVENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  aria-label="Thời gian"
                  className={input}
                  value={toLocalInput(ev.startsAt)}
                  onChange={(e) => {
                    const events = [...config.events];
                    events[i] = { ...ev, startsAt: fromLocalInput(e.target.value) };
                    patch({ events });
                  }}
                />
                <button type="button" aria-label="Xoá sự kiện" onClick={() => patch({ events: config.events.filter((_, j) => j !== i) })} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {(
                [
                  ['title', 'Tiêu đề hiển thị', INVITATION_LIMITS.eventTitle],
                  ['venueName', 'Địa điểm (nhà hàng, tư gia…)', INVITATION_LIMITS.venueName],
                  ['address', 'Địa chỉ', INVITATION_LIMITS.address],
                  ['mapUrl', 'Link Google Maps (không bắt buộc)', INVITATION_LIMITS.url],
                  ['note', 'Ghi chú (ví dụ: đón khách từ 17:30)', INVITATION_LIMITS.note],
                ] as const
              ).map(([field, placeholder, max]) => (
                <input
                  key={field}
                  aria-label={placeholder}
                  placeholder={placeholder}
                  className={input}
                  value={ev[field]}
                  maxLength={max}
                  onChange={(e) => {
                    const events = [...config.events];
                    events[i] = { ...ev, [field]: e.target.value };
                    patch({ events });
                  }}
                />
              ))}
            </div>
          ))}
          {config.events.length < INVITATION_LIMITS.events && (
            <button
              type="button"
              onClick={() =>
                patch({
                  events: [
                    ...config.events,
                    { id: invitationItemId('ev'), kind: 'TIEC_CUOI', title: INVITATION_EVENT_LABELS.TIEC_CUOI, startsAt: config.events.at(-1)?.startsAt ?? wedding.weddingDate, venueName: '', address: '', mapUrl: '', note: '' },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-700"
            >
              <Plus className="h-4 w-4" /> Thêm sự kiện
            </button>
          )}
        </Group>

        <Group title="Chuyện tình yêu" hint="Vài cột mốc ngắn: lần đầu gặp, ngày hẹn hò, lời cầu hôn…">
          {config.story.map((s, i) => (
            <div key={s.id} className="space-y-2.5 rounded-xl bg-slate-50 p-3.5">
              <div className="grid gap-2.5 sm:grid-cols-[160px_1fr_auto]">
                <input aria-label="Thời điểm" placeholder="Mùa thu 2019" className={input} value={s.when} maxLength={INVITATION_LIMITS.storyWhen} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, when: e.target.value }; patch({ story }); }} />
                <input aria-label="Tiêu đề" placeholder="Lần đầu gặp nhau" className={input} value={s.title} maxLength={INVITATION_LIMITS.storyTitle} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, title: e.target.value }; patch({ story }); }} />
                <button type="button" aria-label="Xoá cột mốc" onClick={() => patch({ story: config.story.filter((_, j) => j !== i) })} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea aria-label="Câu chuyện" className={`${input} min-h-[70px]`} value={s.text} maxLength={INVITATION_LIMITS.storyText} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, text: e.target.value }; patch({ story }); }} />
            </div>
          ))}
          {config.story.length < INVITATION_LIMITS.story && (
            <button
              type="button"
              onClick={() => patch({ story: [...config.story, { id: invitationItemId('st'), when: '', title: '', text: '' }] })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-700"
            >
              <Plus className="h-4 w-4" /> Thêm cột mốc
            </button>
          )}
        </Group>

        <Group title="Ảnh bìa" hint="Chọn từ album ảnh cưới (tải ảnh ở tab Ảnh Cưới Triển Lãm). Không chọn thì dùng ảnh đầu tiên.">
          {gallery.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có ảnh nào. Thiệp vẫn đẹp với bìa chữ và hoạ tiết.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {gallery.map((p) => (
                <button key={p.id} type="button" aria-pressed={config.coverPhotoUrl === p.publicUrl} onClick={() => patch({ coverPhotoUrl: config.coverPhotoUrl === p.publicUrl ? '' : p.publicUrl })} className={`overflow-hidden rounded-lg ${config.coverPhotoUrl === p.publicUrl ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200'}`}>
                  <img src={p.publicUrl} alt={p.caption ?? 'Ảnh cưới'} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Group>

        <Group title="Nhạc nền">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ['SYNTH', 'Hộp nhạc nhẹ nhàng'],
                ['URL', 'Nhạc của chúng mình'],
                ['OFF', 'Không phát nhạc'],
              ] as const
            ).map(([mode, text]) => (
              <button key={mode} type="button" aria-pressed={config.music.mode === mode} onClick={() => patch({ music: { ...config.music, mode } })} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${config.music.mode === mode ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {text}
              </button>
            ))}
          </div>
          {config.music.mode === 'URL' && (
            <input aria-label="Link file nhạc" className={input} placeholder="https://…/bai-hat.mp3 (bạn cần có quyền dùng bài hát)" value={config.music.url} maxLength={INVITATION_LIMITS.url} onChange={(e) => patch({ music: { mode: 'URL', url: e.target.value } })} />
          )}
        </Group>

        <Group title="Các mục trên thiệp">
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(SECTION_LABELS) as InvitationSectionKey[]).map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-rose-700" checked={config.sections[k]} onChange={(e) => patch({ sections: { ...config.sections, [k]: e.target.checked } })} />
                {SECTION_LABELS[k]}
              </label>
            ))}
          </div>
          {config.sections.gift && !wedding.hasBankConfig && <p className="text-xs text-amber-700">Hộp mừng cưới chỉ hiện khi đã có tài khoản ngân hàng (tab Cài Đặt) và phòng ở Gói Hạnh Phúc hoặc Viên Mãn.</p>}
        </Group>

        <Group title="Thông tin thêm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="inv-deadline">Hạn xác nhận tham dự</label>
              <input id="inv-deadline" type="date" className={input} value={config.rsvpDeadline ? toLocalInput(config.rsvpDeadline).slice(0, 10) : ''} onChange={(e) => patch({ rsvpDeadline: e.target.value ? fromLocalInput(`${e.target.value}T23:59`) : '' })} />
            </div>
            <div>
              <label className={label} htmlFor="inv-dress">Trang phục gợi ý</label>
              <input id="inv-dress" className={input} value={config.dressCode} maxLength={INVITATION_LIMITS.dressCode} onChange={(e) => patch({ dressCode: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="inv-thanks">Lời cảm ơn cuối thiệp</label>
            <textarea id="inv-thanks" className={`${input} min-h-[70px]`} value={config.thankYou} maxLength={INVITATION_LIMITS.thankYou} onChange={(e) => patch({ thankYou: e.target.value })} />
          </div>
        </Group>

        {/* RSVPs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <Users className="h-4 w-4 text-rose-700" /> Khách xác nhận tham dự
            </h3>
            <p className="text-xs font-bold text-slate-600">
              <span className="tabular-nums text-emerald-700">{attending.length}</span> lượt sẽ đến · <span className="tabular-nums">{headcount}</span> người · <span className="tabular-nums">{rsvps.length - attending.length}</span> bận
            </p>
          </div>
          {rsvps.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Chưa có ai xác nhận. Khi khách bấm “Gửi xác nhận” trên thiệp, tên sẽ hiện ở đây.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 pr-3 font-bold">Khách</th>
                    <th className="py-2 pr-3 font-bold">Trả lời</th>
                    <th className="py-2 pr-3 font-bold">Số người</th>
                    <th className="py-2 pr-3 font-bold">Bên</th>
                    <th className="py-2 pr-3 font-bold">Điện thoại</th>
                    <th className="py-2 font-bold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-semibold text-slate-900">{r.guestName}</td>
                      <td className={`py-2 pr-3 font-bold ${r.attending ? 'text-emerald-700' : 'text-slate-500'}`}>{r.attending ? 'Sẽ đến' : 'Bận'}</td>
                      <td className="py-2 pr-3 tabular-nums">{r.attending ? r.headcount : '—'}</td>
                      <td className="py-2 pr-3">{SIDE_LABEL[r.side] ?? r.side}</td>
                      <td className="py-2 pr-3 tabular-nums">{r.phone ?? '—'}</td>
                      <td className="py-2">{r.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save bar */}
        <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 xl:hidden">
            <Eye className="h-4 w-4" /> {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
          </button>
          <p className="hidden text-xs text-slate-500 xl:block" role="status">
            {saved === 'ok' ? 'Đã lưu. Khách mở thiệp sẽ thấy ngay.' : saved === 'error' ? 'Chưa lưu được, thử lại nhé.' : 'Nhớ bấm Lưu thiệp sau khi sửa.'}
          </p>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved === 'ok' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} Lưu thiệp
          </button>
        </div>
        {showPreview && <div className="xl:hidden">{preview}</div>}
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-4">
          <p className="mb-2 text-center text-xs font-bold text-slate-500">Xem trước trên điện thoại</p>
          {preview}
        </div>
      </div>
    </div>
  );
}
