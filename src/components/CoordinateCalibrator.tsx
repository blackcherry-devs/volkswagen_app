'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Sliders,
  Copy,
  Check,
  Download,
  Crosshair,
  Code,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { CardType, BoundingBox } from '@/types/card';
import {
  ORANGE_CARD_TEMPLATE,
  GREEN_CARD_TEMPLATE,
  getTemplate,
  saveTemplateToStorage,
  resetTemplateStorage,
  LS_KEY_NARANJA_TEMPLATE,
  LS_KEY_VERDE_TEMPLATE,
} from '@/lib/templates';
import { generateMockCardSvg, SAMPLE_ORANGE_DATA, SAMPLE_GREEN_DATA } from '@/lib/mockData';

type FieldMap = Record<string, BoundingBox>;
type MarkersMap = {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
};

const MARKER_LABELS: Record<keyof MarkersMap, string> = {
  topLeft: 'Marcador Superior Izquierdo (Top-Left)',
  topRight: 'Marcador Superior Derecho (Top-Right)',
  bottomLeft: 'Marcador Inferior Izquierdo (Bottom-Left)',
  bottomRight: 'Marcador Inferior Derecho (Bottom-Right)',
};

export const CoordinateCalibrator: React.FC = () => {
  const [activeCardType, setActiveCardType] = useState<CardType>('naranja');

  // Cargar estado inicial desde getTemplate (que ya lee localStorage si existe)
  const [currentTemplate, setCurrentTemplate] = useState(() => getTemplate('naranja'));
  const [fields, setFields] = useState<FieldMap>(() => ({ ...currentTemplate.fields }));
  const [markers, setMarkers] = useState<MarkersMap>(() => ({ ...currentTemplate.fiducialMarkers }));

  // Selección actual: puede ser un campo o un marcador
  const [selectionType, setSelectionType] = useState<'field' | 'marker'>('marker');
  const [selectedKey, setSelectedKey] = useState<string>('topLeft');

  const [copied, setCopied] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [hasCustom, setHasCustom] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(LS_KEY_NARANJA_TEMPLATE);
  });

  // Cambiar entre tarjeta naranja y verde
  const handleSwitchType = (type: CardType) => {
    setActiveCardType(type);
    const tmpl = getTemplate(type);
    setCurrentTemplate(tmpl);
    setFields({ ...tmpl.fields });
    setMarkers({ ...tmpl.fiducialMarkers });
    setSelectionType('marker');
    setSelectedKey('topLeft');
    if (typeof window !== 'undefined') {
      const key = type === 'naranja' ? LS_KEY_NARANJA_TEMPLATE : LS_KEY_VERDE_TEMPLATE;
      setHasCustom(!!localStorage.getItem(key));
    }
  };

  // Actualizar un valor de campo de texto / casilla
  const handleUpdateField = (prop: 'x' | 'y' | 'width' | 'height', value: number) => {
    setFields((prev) => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey],
        [prop]: parseFloat(value.toFixed(4)),
      },
    }));
  };

  // Actualizar un valor de marcador de esquina
  const handleUpdateMarker = (axis: 'x' | 'y', value: number) => {
    setMarkers((prev) => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey as keyof MarkersMap],
        [axis]: parseFloat(value.toFixed(4)),
      },
    }));
  };

  // Ajuste fino milimétrico (D-Pad Nudge)
  const handleNudge = (dx: number, dy: number) => {
    if (selectionType === 'marker') {
      const current = markers[selectedKey as keyof MarkersMap];
      if (!current) return;
      handleUpdateMarker('x', Math.max(0, Math.min(1, current.x + dx)));
      handleUpdateMarker('y', Math.max(0, Math.min(1, current.y + dy)));
    } else {
      const current = fields[selectedKey];
      if (!current) return;
      handleUpdateField('x', Math.max(0, Math.min(0.95, current.x + dx)));
      handleUpdateField('y', Math.max(0, Math.min(0.95, current.y + dy)));
    }
  };

  const handleResizeNudge = (dw: number, dh: number) => {
    if (selectionType === 'field') {
      const current = fields[selectedKey];
      if (!current) return;
      if (dw !== 0) handleUpdateField('width', Math.max(0.02, Math.min(0.98, current.width + dw)));
      if (dh !== 0) handleUpdateField('height', Math.max(0.01, Math.min(0.5, current.height + dh)));
    }
  };

  // GUARDAR Y APLICAR CAMBIOS A TODA LA APP
  const handleSaveAndApply = () => {
    saveTemplateToStorage(activeCardType, {
      fields,
      fiducialMarkers: markers,
    });
    setHasCustom(true);
    setSaveSuccessMessage('¡Coordenadas guardadas y aplicadas a toda la app! El Visor y la Cámara ya usan estas posiciones.');
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  // RESTABLECER A VALORES OFICIALES DE FÁBRICA
  const handleReset = () => {
    resetTemplateStorage(activeCardType);
    const defaultTmpl = activeCardType === 'naranja' ? ORANGE_CARD_TEMPLATE : GREEN_CARD_TEMPLATE;
    setCurrentTemplate(defaultTmpl);
    setFields({ ...defaultTmpl.fields });
    setMarkers({ ...defaultTmpl.fiducialMarkers });
    setHasCustom(false);
    setSaveSuccessMessage('Plantilla restablecida a los valores oficiales de fábrica.');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const copyJson = () => {
    const fullTemplate = {
      ...currentTemplate,
      fiducialMarkers: markers,
      fields,
    };
    navigator.clipboard.writeText(JSON.stringify(fullTemplate, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const fullTemplate = {
      ...currentTemplate,
      fiducialMarkers: markers,
      fields,
    };
    const blob = new Blob([JSON.stringify(fullTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordenadas_${activeCardType}_calibradas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mockImage = generateMockCardSvg(
    activeCardType,
    activeCardType === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA
  );

  const selectedField = selectionType === 'field' ? fields[selectedKey] : null;
  const selectedMarker = selectionType === 'marker' ? markers[selectedKey as keyof MarkersMap] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Calibrador Visual de Coordenadas y Marcadores
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Alinea los 4 marcadores de esquina y cada campo.{' '}
            <span className="text-emerald-400 font-semibold">
              Usa el botón "Guardar y Aplicar" para activar los cambios en toda la app.
            </span>
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Naranja / Verde */}
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

          {/* BOTÓN PRINCIPAL: GUARDAR Y APLICAR */}
          <button
            onClick={handleSaveAndApply}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/40 active:scale-95 transition"
            title="Guardar las coordenadas en este dispositivo y aplicarlas al Visor y a la Cámara"
          >
            <Save className="w-4 h-4" />
            <span>Guardar y Aplicar a la App</span>
          </button>

          {hasCustom && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-lg border border-red-800 transition"
              title="Restablecer coordenadas oficiales de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          )}

          <button
            onClick={copyJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            title="Copiar JSON para pegar en templates.ts"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
          </button>

          <button
            onClick={downloadJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition"
            title="Descargar archivo JSON"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Banner de Confirmación al Guardar */}
      {saveSuccessMessage && (
        <div className="mb-4 bg-emerald-950/70 border border-emerald-600/80 rounded-xl p-3 flex items-center space-x-2.5 text-emerald-200 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Cuadrícula Principal: Vista previa interactiva (Izquierda) + Panel de Ajuste (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Vista Previa con el Cartón */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden select-none">
          <div className="relative aspect-[80/190] h-[700px] max-w-full">
            {/* Imagen SVG del cartón */}
            <img
              src={mockImage}
              alt="Cartón Físico"
              className="w-full h-full object-contain pointer-events-none rounded-lg shadow-2xl"
            />

            {/* Capa de Marcadores de Esquina (Verdes ajustables) */}
            <div className="absolute inset-0">
              {(
                [
                  { key: 'topLeft', marker: markers.topLeft, label: 'TL' },
                  { key: 'topRight', marker: markers.topRight, label: 'TR' },
                  { key: 'bottomLeft', marker: markers.bottomLeft, label: 'BL' },
                  { key: 'bottomRight', marker: markers.bottomRight, label: 'BR' },
                ] as const
              ).map(({ key, marker, label }) => {
                const isSelected = selectionType === 'marker' && selectedKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setSelectionType('marker');
                      setSelectedKey(key);
                    }}
                    className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all rounded ${
                      isSelected
                        ? 'border-2 border-emerald-300 bg-emerald-400/30 z-30 ring-4 ring-emerald-400/50 shadow-xl scale-125'
                        : 'border-2 border-emerald-400 hover:border-emerald-300 hover:bg-emerald-400/20 z-20'
                    }`}
                    style={{
                      left: `${marker.x * 100}%`,
                      top: `${marker.y * 100}%`,
                    }}
                    title={`Clic para calibrar: ${MARKER_LABELS[key]}`}
                  >
                    {/* Punto central del marcador */}
                    <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full absolute inset-0 m-auto" />
                    <span className="absolute -top-4 -left-1 text-[9px] font-black font-mono text-emerald-200 bg-black/90 px-1 rounded shadow">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Capa de Campos de Datos (Cajas Azules ajustables) */}
            <div className="absolute inset-0">
              {Object.entries(fields).map(([key, box]) => {
                const isSelected = selectionType === 'field' && selectedKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setSelectionType('field');
                      setSelectedKey(key);
                    }}
                    className={`absolute rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-purple-400 bg-purple-500/30 z-30 shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 scale-[1.01]'
                        : 'border border-blue-400/50 hover:border-blue-300 hover:bg-blue-500/10 z-10'
                    }`}
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                    title={`Clic para calibrar: ${box.label}`}
                  >
                    <div
                      className={`text-[8px] font-mono px-1 rounded absolute -top-4 left-0 whitespace-nowrap ${
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
            💡 Haz clic en los <span className="text-emerald-400 font-bold">cuadros verdes</span> para calibrar los marcadores, o en las <span className="text-blue-400 font-bold">cajas azules</span> para calibrar los campos de texto.
          </p>
        </div>

        {/* Columna Derecha: Panel de Controles y Sliders */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
              <Crosshair className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Controles de Calibración</h3>
            </div>

            {/* Selector de Elemento */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">
                  Seleccionar elemento a calibrar:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => {
                      setSelectionType('marker');
                      setSelectedKey('topLeft');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      selectionType === 'marker'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Marcadores (4 Esquinas)
                  </button>
                  <button
                    onClick={() => {
                      setSelectionType('field');
                      setSelectedKey(Object.keys(fields)[0] || 'centroCostos');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      selectionType === 'field'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Campos de Datos
                  </button>
                </div>

                {/* Dropdown dinámico según categoría */}
                {selectionType === 'marker' ? (
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-600/60 text-emerald-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none font-bold"
                  >
                    {Object.entries(MARKER_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-600/60 text-purple-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none font-bold"
                  >
                    {Object.entries(fields).map(([k, b]) => (
                      <option key={k} value={k}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* SLIDERS PARA MARCADOR FIDUCIAL */}
            {selectionType === 'marker' && selectedMarker && (
              <div className="space-y-4 bg-slate-900/70 p-4 rounded-xl border border-emerald-900/40">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ajuste de Marcador de Esquina</span>
                </div>

                {/* Eje X */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Posición X (Horizontal):</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(selectedMarker.x * 100).toFixed(2)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={selectedMarker.x}
                    onChange={(e) => handleUpdateMarker('x', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Eje Y */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Posición Y (Vertical):</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(selectedMarker.y * 100).toFixed(2)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={selectedMarker.y}
                    onChange={(e) => handleUpdateMarker('y', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* SLIDERS PARA CAMPO DE TEXTO */}
            {selectionType === 'field' && selectedField && (
              <div className="space-y-4 bg-slate-900/70 p-4 rounded-xl border border-purple-900/40">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 pb-2 border-b border-slate-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ajuste de Recuadro de Campo</span>
                </div>

                {(
                  [
                    { prop: 'x', label: 'Posición X (horizontal)', min: 0, max: 0.95 },
                    { prop: 'y', label: 'Posición Y (vertical)', min: 0, max: 0.95 },
                    { prop: 'width', label: 'Ancho (Width)', min: 0.05, max: 0.95 },
                    { prop: 'height', label: 'Alto (Height)', min: 0.015, max: 0.35 },
                  ] as const
                ).map(({ prop, label, min, max }) => (
                  <div key={prop}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{label}</span>
                      <span className="font-mono text-purple-400 font-bold">
                        {((selectedField[prop] ?? 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step="0.002"
                      value={selectedField[prop]}
                      onChange={(e) => handleUpdateField(prop, parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* CONTROL PAD DE AJUSTE RÁPIDO MILIMÉTRICO (D-PAD) */}
            <div className="mt-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block mb-2">
                Ajuste Milimétrico con Flechas (1 toque = 0.3%):
              </span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* D-Pad de Posición */}
                <div className="grid grid-cols-3 gap-1 w-28">
                  <div />
                  <button
                    type="button"
                    onClick={() => handleNudge(0, -0.003)}
                    className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition border border-slate-700"
                    title="Subir 1 mm"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => handleNudge(-0.003, 0)}
                    className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition border border-slate-700"
                    title="Mover a la izquierda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center justify-center text-[10px] font-mono text-slate-500">
                    MOVE
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNudge(0.003, 0)}
                    className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition border border-slate-700"
                    title="Mover a la derecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => handleNudge(0, 0.003)}
                    className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition border border-slate-700"
                    title="Bajar 1 mm"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <div />
                </div>

                {/* Botones de Tamaño (Solo para campos de datos) */}
                {selectionType === 'field' && (
                  <div className="flex flex-col space-y-1.5 flex-1 min-w-[130px]">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400">Ancho:</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => handleResizeNudge(-0.005, 0)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95"
                          title="Reducir ancho"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeNudge(0.005, 0)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95"
                          title="Aumentar ancho"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400">Alto:</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => handleResizeNudge(0, -0.003)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95"
                          title="Reducir alto"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeNudge(0, 0.003)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95"
                          title="Aumentar alto"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón Grande de Guardar al pie de los controles */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleSaveAndApply}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950/60 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar y Aplicar Cambios</span>
            </button>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>Coordenadas actuales en JSON:</span>
            </div>
            <pre className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-28">
              {selectionType === 'marker'
                ? JSON.stringify({ [selectedKey]: selectedMarker }, null, 2)
                : JSON.stringify({ [selectedKey]: selectedField }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};