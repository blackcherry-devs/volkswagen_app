'use client';

import React, { useState, useCallback } from 'react';
import { Sliders, Copy, Check, Download, Crosshair, Code, Save, RotateCcw, Wifi } from 'lucide-react';
import { CardType, BoundingBox } from '@/types/card';
import { ORANGE_CARD_TEMPLATE, GREEN_CARD_TEMPLATE, getTemplate } from '@/lib/templates';
import { generateMockCardSvg, SAMPLE_ORANGE_DATA, SAMPLE_GREEN_DATA } from '@/lib/mockData';

const LS_KEY_NARANJA = 'calibrator_fields_naranja_v2';
const LS_KEY_VERDE   = 'calibrator_fields_verde_v2';

type FieldMap = Record<string, BoundingBox>;

function loadFromStorage(type: CardType): FieldMap | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(type === 'naranja' ? LS_KEY_NARANJA : LS_KEY_VERDE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FieldMap;
    if (typeof parsed !== 'object' || Object.keys(parsed).length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(type: CardType, fields: FieldMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    type === 'naranja' ? LS_KEY_NARANJA : LS_KEY_VERDE,
    JSON.stringify(fields)
  );
}

function getDefaultFields(type: CardType): FieldMap {
  const tmpl = type === 'naranja' ? ORANGE_CARD_TEMPLATE : GREEN_CARD_TEMPLATE;
  return { ...tmpl.fields };
}

function initFields(type: CardType): FieldMap {
  return loadFromStorage(type) ?? getDefaultFields(type);
}

export const CoordinateCalibrator: React.FC = () => {
  const [activeCardType, setActiveCardType] = useState<CardType>('naranja');
  const template = getTemplate(activeCardType);

  const [fields, setFields] = useState<FieldMap>(() => initFields('naranja'));
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('centroCostos');

  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [hasCustom, setHasCustom] = useState<boolean>(() => loadFromStorage('naranja') !== null);

  const handleSwitchType = (type: CardType) => {
    setActiveCardType(type);
    const loaded = initFields(type);
    setFields(loaded);
    setSelectedFieldKey('centroCostos');
    setHasCustom(loadFromStorage(type) !== null);
  };

  const persistFields = useCallback((type: CardType, newFields: FieldMap) => {
    saveToStorage(type, newFields);
    setHasCustom(true);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, []);

  const handleUpdateBBox = (prop: 'x' | 'y' | 'width' | 'height', value: number) => {
    setFields((prev) => {
      const updated = {
        ...prev,
        [selectedFieldKey]: {
          ...prev[selectedFieldKey],
          [prop]: parseFloat(value.toFixed(3)),
        },
      };
      persistFields(activeCardType, updated);
      return updated;
    });
  };

  const handleReset = () => {
    const defaults = getDefaultFields(activeCardType);
    setFields(defaults);
    localStorage.removeItem(activeCardType === 'naranja' ? LS_KEY_NARANJA : LS_KEY_VERDE);
    setHasCustom(false);
    setSavedFlash(false);
  };

  const selectedBBox = fields[selectedFieldKey] || Object.values(fields)[0];

  const copyJson = () => {
    const fullTemplate = { ...template, fields };
    navigator.clipboard.writeText(JSON.stringify(fullTemplate, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const fullTemplate = { ...template, fields };
    const blob = new Blob([JSON.stringify(fullTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordenadas_${activeCardType}_${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mockImage = generateMockCardSvg(
    activeCardType,
    activeCardType === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              Calibrador Visual de Coordenadas Normalizadas (0.0 a 1.0)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ajusta cada recuadro visualmente.{' '}
            <span className="font-semibold text-emerald-400">Los cambios se guardan automaticamente.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchType('naranja')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeCardType === 'naranja'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              Plantilla Naranja
            </button>
            <button
              onClick={() => handleSwitchType('verde')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeCardType === 'verde'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Plantilla Verde
            </button>
          </div>

          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 ${
              savedFlash
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : hasCustom
                ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                : 'bg-slate-800/30 border-slate-800 text-slate-600'
            }`}
          >
            {savedFlash ? (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guardado</span>
              </>
            ) : hasCustom ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                <span>Personalizado</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-slate-500" />
                <span>Por defecto</span>
              </>
            )}
          </div>

          {hasCustom && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-red-200 text-xs font-semibold rounded-lg border border-red-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetear</span>
            </button>
          )}

          <button
            onClick={copyJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
          </button>

          <button
            onClick={downloadJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar JSON</span>
          </button>
        </div>
      </div>

      {hasCustom && (
        <div className="mb-5 flex items-start gap-3 bg-blue-950/40 border border-blue-800/60 rounded-xl px-4 py-3">
          <Save className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-300 leading-relaxed">
            <span className="font-bold text-blue-200">Coordenadas personalizadas activas.</span>{' '}
            Guardadas en este navegador. Para aplicarlas en el codigo de forma permanente, usa{' '}
            <span className="font-mono text-emerald-300">Copiar JSON</span> y pega los valores en{' '}
            <span className="font-mono text-white">src/lib/templates.ts</span>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative aspect-[80/190] h-[720px] max-w-full">
            <img
              src={mockImage}
              alt="Plantilla"
              className="w-full h-full object-contain pointer-events-none rounded-lg"
            />

            <div className="absolute inset-0 pointer-events-none">
              {[
                template.fiducialMarkers.topLeft,
                template.fiducialMarkers.topRight,
                template.fiducialMarkers.bottomLeft,
                template.fiducialMarkers.bottomRight,
              ].map((m, i) => (
                <div
                  key={i}
                  className="absolute w-5 h-5 border-2 border-emerald-400 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                />
              ))}
            </div>

            <div className="absolute inset-0">
              {Object.entries(fields).map(([key, box]) => {
                const isSelected = selectedFieldKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedFieldKey(key)}
                    className={`absolute rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-purple-400 bg-purple-500/30 z-20 shadow-lg shadow-purple-500/40 ring-2 ring-purple-300'
                        : 'border border-blue-400/50 hover:border-blue-300 hover:bg-blue-500/10 z-10'
                    }`}
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                  >
                    <div
                      className={`text-[9px] font-mono px-1 rounded absolute -top-4 left-0 whitespace-nowrap ${
                        isSelected ? 'bg-purple-500 text-white font-bold' : 'bg-black/80 text-blue-300'
                      }`}
                    >
                      {box.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center">
            Haz clic en cualquier recuadro para seleccionarlo y ajusta su posicion con los deslizadores.
          </p>
        </div>

        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
              <Crosshair className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Campo Seleccionado</h3>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1">Elegir campo:</label>
              <select
                value={selectedFieldKey}
                onChange={(e) => setSelectedFieldKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
              >
                {Object.entries(fields).map(([k, b]) => (
                  <option key={k} value={k}>{b.label}</option>
                ))}
              </select>
            </div>

            {selectedBBox && (
              <div className="space-y-4">
                {(
                  [
                    { prop: 'x', label: 'Posicion X (horizontal)' },
                    { prop: 'y', label: 'Posicion Y (vertical)' },
                    { prop: 'width', label: 'Ancho (Width)' },
                    { prop: 'height', label: 'Alto (Height)' },
                  ] as const
                ).map(({ prop, label }) => (
                  <div key={prop}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{label}</span>
                      <span className="font-mono text-purple-400 font-bold">
                        {((selectedBBox[prop] ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={prop === 'x' || prop === 'y' ? '0' : '0.02'}
                      max={prop === 'height' ? '0.5' : prop === 'width' ? '0.95' : '1'}
                      step="0.005"
                      value={selectedBBox[prop]}
                      onChange={(e) => handleUpdateBBox(prop, parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-2">
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>Coordenadas exactas en JSON:</span>
            </div>
            <pre className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto">
{JSON.stringify(
  {
    [selectedFieldKey]: {
      x: selectedBBox?.x,
      y: selectedBBox?.y,
      width: selectedBBox?.width,
      height: selectedBBox?.height,
    },
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};