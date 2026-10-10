'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CardType, CardTemplate } from '@/types/card';
import { getTemplate } from '@/lib/templates';

interface CardInspectorProps {
  cardType: CardType;
  imageUrl: string;
  activeFieldKey: string | null;
  onSelectField: (fieldKey: string) => void;
  confidences?: Record<string, number>;
}

export const CardInspector: React.FC<CardInspectorProps> = ({
  cardType,
  imageUrl,
  activeFieldKey,
  onSelectField,
  confidences = {},
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const template: CardTemplate = getTemplate(cardType);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Barra de Herramientas del Visor */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Visor de Imagen & Regiones (OpenCV)
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            Plantilla: {template.id}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reducir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contenedor del Cartón con Zoom y Capa de Bounding Boxes */}
      <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[360px]">
        <div
          className="relative inline-block transition-transform duration-200 select-none max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Imagen física del cartón */}
          <img
            src={imageUrl}
            alt="Cartón Físico Escaneado"
            className="w-auto max-w-[340px] md:max-w-[380px] max-h-[640px] h-auto rounded-lg shadow-2xl pointer-events-none block"
          />

          {/* Capa de Marcadores de Esquina Detectados por OpenCV */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Left */}
            <div
              className="absolute w-6 h-6 border-2 border-emerald-400 rounded-sm -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${template.fiducialMarkers.topLeft.x * 100}%`,
                top: `${template.fiducialMarkers.topLeft.y * 100}%`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute inset-0 m-auto" />
            </div>

            {/* Top Right */}
            <div
              className="absolute w-6 h-6 border-2 border-emerald-400 rounded-sm -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${template.fiducialMarkers.topRight.x * 100}%`,
                top: `${template.fiducialMarkers.topRight.y * 100}%`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute inset-0 m-auto" />
            </div>

            {/* Bottom Left */}
            <div
              className="absolute w-6 h-6 border-2 border-emerald-400 rounded-sm -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${template.fiducialMarkers.bottomLeft.x * 100}%`,
                top: `${template.fiducialMarkers.bottomLeft.y * 100}%`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute inset-0 m-auto" />
            </div>

            {/* Bottom Right */}
            <div
              className="absolute w-6 h-6 border-2 border-emerald-400 rounded-sm -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${template.fiducialMarkers.bottomRight.x * 100}%`,
                top: `${template.fiducialMarkers.bottomRight.y * 100}%`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute inset-0 m-auto" />
            </div>
          </div>

          {/* Capa de Cajas Delimitadoras (ROIs) */}
          <div className="absolute inset-0">
            {Object.entries(template.fields).map(([fieldKey, bbox]) => {
              const isActive = activeFieldKey === fieldKey;
              const conf = confidences[fieldKey] ?? 95;

              return (
                <div
                  key={fieldKey}
                  onClick={() => onSelectField(fieldKey)}
                  className={`absolute rounded cursor-pointer transition-all ${
                    isActive
                      ? 'border-2 border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/40 z-20 scale-[1.01]'
                      : 'border border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/10 z-10'
                  }`}
                  style={{
                    left: `${bbox.x * 100}%`,
                    top: `${bbox.y * 100}%`,
                    width: `${bbox.width * 100}%`,
                    height: `${bbox.height * 100}%`,
                  }}
                  title={`Clic para editar campo: ${bbox.label}`}
                >
                  {/* Etiqueta flotante cuando está seleccionado o hover */}
                  {isActive && (
                    <div className="absolute -top-6 left-0 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center space-x-1">
                      <span>{bbox.label}</span>
                      <span className="font-mono opacity-80">({conf}% conf.)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pie con Estado de Reconocimiento */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>4 Marcadores Fiduciales detectados correctamente</span>
        </div>
        <div className="text-slate-500 italic">
          Haz clic en cualquier caja del cartón para saltar a ese campo en el formulario
        </div>
      </div>
    </div>
  );
};
