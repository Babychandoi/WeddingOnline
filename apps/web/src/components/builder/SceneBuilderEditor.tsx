'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, RotateCw, Save, Trash2 } from 'lucide-react';
import {
  GRID_COLS,
  GRID_ROWS,
  PREFAB_CATALOG,
  STARTER_TEMPLATES,
  VENUE_REGIONS,
  VENUE_THEMES,
  getRotatedFootprint,
  validateSceneLayout,
  type PlacedPrefab,
  type PrefabType,
  type SceneLayoutDocument,
  type TemplateId,
} from '@dco/shared';

interface SceneBuilderEditorProps {
  slug: string;
  initialLayout: SceneLayoutDocument;
  onSaved?: (layout: SceneLayoutDocument) => void;
}

const PREFAB_COLORS: Record<PrefabType, string> = {
  STAGE_MAIN: 'bg-amber-400 border-amber-600 text-slate-900',
  GATE_RECEPTION: 'bg-emerald-500 border-emerald-700 text-white',
  GIFT_BOX_STAND: 'bg-rose-500 border-rose-700 text-white',
  BANQUET_TABLE_10: 'bg-pink-200 border-pink-500 text-pink-950',
  BANQUET_TABLE_8: 'bg-purple-200 border-purple-500 text-purple-950',
  PHOTO_FRAME_STAND: 'bg-sky-400 border-sky-700 text-white',
  AISLE_CARPET_4X4: 'bg-red-300/70 border-red-400 text-red-950',
  DECOR_FLOWER_PILLAR: 'bg-lime-300 border-lime-600 text-lime-950',
};

export const SceneBuilderEditor: React.FC<SceneBuilderEditorProps> = ({
  slug,
  initialLayout,
  onSaved,
}) => {
  const [layout, setLayout] = useState<SceneLayoutDocument>(initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<PrefabType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const validation = useMemo(() => validateSceneLayout(layout), [layout]);
  const selectedPrefab = layout.prefabs.find((p) => p.instanceId === selectedId) ?? null;

  const handleTemplateSwitch = (templateId: TemplateId) => {
    const tpl = STARTER_TEMPLATES[templateId];
    setLayout(structuredClone(tpl.layout));
    setSelectedId(null);
    setSaveMessage('');
  };

  const handleGridClick = (gx: number, gz: number) => {
    if (placingType) {
      const def = PREFAB_CATALOG[placingType];
      const nextTableNo =
        layout.prefabs.filter((p) => p.prefabType.startsWith('BANQUET_TABLE')).length + 1;
      const newItem: PlacedPrefab = {
        instanceId: `pf_${Date.now()}`,
        prefabType: placingType,
        gridX: Math.min(GRID_COLS - def.widthCells, Math.max(0, gx)),
        gridZ: Math.min(GRID_ROWS - def.depthCells, Math.max(0, gz)),
        rotationDeg: 0,
        meta: placingType.startsWith('BANQUET_TABLE')
          ? { tableNumber: nextTableNo, tableLabel: `Bàn ${nextTableNo}` }
          : undefined,
      };
      setLayout((prev) => ({ ...prev, prefabs: [...prev.prefabs, newItem] }));
      setSelectedId(newItem.instanceId);
      setPlacingType(null);
      return;
    }

    if (selectedPrefab) {
      const { widthCells, depthCells } = getRotatedFootprint(
        selectedPrefab.prefabType,
        selectedPrefab.rotationDeg
      );
      const clampedX = Math.min(GRID_COLS - widthCells, Math.max(0, gx));
      const clampedZ = Math.min(GRID_ROWS - depthCells, Math.max(0, gz));
      setLayout((prev) => ({
        ...prev,
        prefabs: prev.prefabs.map((p) =>
          p.instanceId === selectedPrefab.instanceId
            ? { ...p, gridX: clampedX, gridZ: clampedZ }
            : p
        ),
      }));
    }
  };

  const handleRotateSelected = () => {
    if (!selectedPrefab) return;
    const nextRot = ((selectedPrefab.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270;
    setLayout((prev) => ({
      ...prev,
      prefabs: prev.prefabs.map((p) =>
        p.instanceId === selectedPrefab.instanceId ? { ...p, rotationDeg: nextRot } : p
      ),
    }));
  };

  const handleDeleteSelected = () => {
    if (!selectedPrefab) return;
    if (
      selectedPrefab.prefabType === 'STAGE_MAIN' ||
      selectedPrefab.prefabType === 'GATE_RECEPTION'
    ) {
      return;
    }
    setLayout((prev) => ({
      ...prev,
      prefabs: prev.prefabs.filter((p) => p.instanceId !== selectedPrefab.instanceId),
    }));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!validation.valid) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/weddings/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutData: layout }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.errors && data.errors[0]) || data.error || 'Lỗi lưu');
      setSaveMessage('Đã lưu bố cục Sảnh 3D thành công!');
      onSaved?.(layout);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Lỗi lưu bố cục');
    } finally {
      setSaving(false);
    }
  };

  const cellPx = 8; // 60 * 8 = 480px crisp grid canvas

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 rounded-3xl border border-amber-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bản Đồ Sảnh Cưới Lưới Ô Vuông (0.5m / ô • 30m × 30m)
            </h3>
            <p className="text-xs text-slate-500">
              Chọn 1 vật phẩm rồi bấm lên mặt sàn để di chuyển bám lưới (Grid-Snap).
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            Không gian
            <select
              value={layout.templateId}
              onChange={(e) => handleTemplateSwitch(e.target.value as TemplateId)}
              className="min-w-0 max-w-[260px] rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              {VENUE_REGIONS.map((region) => (
                <optgroup key={region.id} label={region.nameVi}>
                  {VENUE_THEMES.filter((v) => v.region === region.id).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameVi}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        {/* Interactive 60x60 Grid Canvas */}
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div
            style={{ width: GRID_COLS * cellPx, height: GRID_ROWS * cellPx }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const gx = Math.floor((e.clientX - rect.left) / cellPx);
              const gz = Math.floor((e.clientY - rect.top) / cellPx);
              handleGridClick(gx, gz);
            }}
            className="relative mx-auto cursor-crosshair border border-slate-300 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:8px_8px]"
          >
            {layout.prefabs.map((prefab) => {
              const { widthCells, depthCells } = getRotatedFootprint(
                prefab.prefabType,
                prefab.rotationDeg
              );
              const isSelected = prefab.instanceId === selectedId;
              return (
                <button
                  key={prefab.instanceId}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlacingType(null);
                    setSelectedId(prefab.instanceId);
                  }}
                  style={{
                    left: prefab.gridX * cellPx,
                    top: prefab.gridZ * cellPx,
                    width: widthCells * cellPx,
                    height: depthCells * cellPx,
                  }}
                  className={`absolute flex items-center justify-center rounded border text-[9px] font-bold leading-tight transition ${
                    PREFAB_COLORS[prefab.prefabType]
                  } ${isSelected ? 'z-20 ring-2 ring-indigo-600 ring-offset-1' : 'z-10'}`}
                  title={PREFAB_CATALOG[prefab.prefabType].labelVi}
                >
                  <span className="truncate px-0.5">
                    {prefab.meta?.tableLabel ||
                      (prefab.prefabType === 'STAGE_MAIN'
                        ? 'SÂN KHẤU'
                        : prefab.prefabType === 'GATE_RECEPTION'
                        ? 'CỔNG'
                        : prefab.prefabType === 'GIFT_BOX_STAND'
                        ? 'QR'
                        : '')}
                  </span>
                </button>
              );
            })}

            {/* Highlight Blocked / Overlapping Cells in Red */}
            {validation.blockedCells.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  left: cell.gx * cellPx,
                  top: cell.gz * cellPx,
                  width: cellPx,
                  height: cellPx,
                }}
                className="pointer-events-none absolute z-30 bg-red-600/80"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inspector & Smart Prefab Palette */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-bold text-slate-900">Thêm Cụm Vật Phẩm Thông Minh</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                'BANQUET_TABLE_10',
                'BANQUET_TABLE_8',
                'PHOTO_FRAME_STAND',
                'GIFT_BOX_STAND',
                'AISLE_CARPET_4X4',
                'DECOR_FLOWER_PILLAR',
              ] as PrefabType[]
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setPlacingType(type);
                }}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${
                  placingType === type
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{PREFAB_CATALOG[type].labelVi}</span>
                <Plus className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {selectedPrefab && (
          <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">
              Đang chọn: {PREFAB_CATALOG[selectedPrefab.prefabType].labelVi}
            </h4>
            <p className="mt-0.5 text-xs text-slate-600">
              Vị trí ô: ({selectedPrefab.gridX}, {selectedPrefab.gridZ}) • Góc:{' '}
              {selectedPrefab.rotationDeg}°
            </p>

            {selectedPrefab.prefabType.startsWith('BANQUET_TABLE') && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tên Bàn Tiệc
                </label>
                <input
                  type="text"
                  value={selectedPrefab.meta?.tableLabel || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLayout((prev) => ({
                      ...prev,
                      prefabs: prev.prefabs.map((p) =>
                        p.instanceId === selectedPrefab.instanceId
                          ? { ...p, meta: { ...p.meta, tableLabel: val } }
                          : p
                      ),
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleRotateSelected}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100"
              >
                <RotateCw className="h-3.5 w-3.5" /> Xoay 90°
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center justify-center gap-1 rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa
              </button>
            </div>
          </div>
        )}

        {/* Real-time Walkability Validation Status */}
        <div
          className={`rounded-3xl border p-4 ${
            validation.valid
              ? 'border-emerald-200 bg-emerald-50/70'
              : 'border-rose-200 bg-rose-50/70'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            {validation.valid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-800">
                  Lối đi 2D BFS hợp lệ! Khách đi tới mọi bàn &amp; sân khấu.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-rose-800">Phát hiện lỗi bố cục ({validation.errors.length}):</span>
              </>
            )}
          </div>
          {!validation.valid && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-rose-700">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!validation.valid || saving}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu Bố Cục Sảnh 3D'}
          </button>
          {saveMessage && <p className="mt-2 text-center text-xs font-semibold text-emerald-700">{saveMessage}</p>}
        </div>
      </div>
    </div>
  );
};
