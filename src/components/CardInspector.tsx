'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Sparkles,
  Move,
  Crop,
  ShieldCheck,
  Check,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { CardType, CardTemplate } from '@/types/card';
import { getTemplate } from '@/lib/templates';
import {
  Point,
  CardCorners,
  DEFAULT_CORNERS_NARANJA,
  DEFAULT_CORNERS_VERDE,
  interpolatePoint,
  detectCardCorners,
  warpAndCropCard,
} from '@/lib/cornerDetection';

interface CardInspectorProps {
  cardType: CardType;
  imageUrl: string;
  activeFieldKey: string | null;
  onSelectField: (fieldKey: string) => void;
  confidences?: Record<string, number>;
  onSelectCardType?: (type: CardType) => void;
  hasOrangeImage?: boolean;
  hasGreenImage?: boolean;
  onImageTransformed?: (newImageUrl: string) => void;
  onReExtractOcr?: (imageUri: string, corners?: CardCorners) => void;
}

// Coordenadas canónicas de referencia en la plantilla HSK 63
const X_MIN = 0.031;
const X_MAX = 0.969;
const Y_MIN = 0.368;
const Y_MAX = 0.955;

export const CardInspector: React.FC<CardInspectorProps> = ({
  cardType,
  imageUrl,
  activeFieldKey,
  onSelectField,
  confidences = {},
  onSelectCardType,
  hasOrangeImage,
  hasGreenImage,
  onImageTransformed,
  onReExtractOcr,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [template, setTemplate] = useState<CardTemplate>(() => getTemplate(cardType));

  useEffect(() => {
    setTemplate(getTemplate(cardType));

    const handleUpdate = () => {
      setTemplate(getTemplate(cardType));
    };

    window.addEventListener('vw-coordinates-updated', handleUpdate);
    return () => window.removeEventListener('vw-coordinates-updated', handleUpdate);
  }, [cardType]);

  // Esquinas iniciales canónicas de los 4 marcadores fiduciales
  const CANONICAL_MARKER_CORNERS: CardCorners = {
    topLeft: { x: 0.04, y: 0.04 },
    topRight: { x: 0.96, y: 0.04 },
    bottomLeft: { x: 0.04, y: 0.96 },
    bottomRight: { x: 0.96, y: 0.96 },
  };

  const [corners, setCorners] = useState<CardCorners>(CANONICAL_MARKER_CORNERS);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [draggingCorner, setDraggingCorner] = useState<keyof CardCorners | null>(null);
  const [showCornersGuide, setShowCornersGuide] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inicializar o restablecer esquinas al cambiar de imagen o tipo de tarjeta
  useEffect(() => {
    if (!imageUrl) return;
    // Las fotos tomadas con el marco guía ya tienen los marcadores en las 4 esquinas exteriores.
    // Usamos las esquinas canónicas para evitar que el filtro de color desalinee los recuadros azules.
    setCorners(CANONICAL_MARKER_CORNERS);
  }, [imageUrl, cardType]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Re-ejecutar detección automática por color bajo demanda explícita del usuario
  const handleReDetectCorners = async () => {
    if (!imageUrl || isDetecting) return;
    setIsDetecting(true);
    try {
      const detected = await detectCardCorners(imageUrl, cardType);
      setCorners(detected);
      setStatusMessage('¡Esquinas recalibradas por color!');
      setTimeout(() => setStatusMessage(null), 2000);
    } catch {
      setStatusMessage('No se detectaron marcas. Usa los círculos verdes manuales.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Restablecer esquinas a los 4 marcadores canónicos
  const handleResetToMarkers = () => {
    setCorners(CANONICAL_MARKER_CORNERS);
    setStatusMessage('Mirillas centradas en los 4 marcadores fiduciales.');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  // Ajustar esquinas a los bordes completos
  const handleFitToEdges = () => {
    setCorners({
      topLeft: { x: 0.02, y: 0.02 },
      topRight: { x: 0.98, y: 0.02 },
      bottomLeft: { x: 0.02, y: 0.98 },
      bottomRight: { x: 0.98, y: 0.98 },
    });
    setStatusMessage('Esquinas ajustadas a los bordes.');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  // Enderezar y recortar la imagen según las 4 esquinas seleccionadas
  const handleWarpAndStraighten = async () => {
    if (!imageUrl || isWarping) return;
    setIsWarping(true);
    setStatusMessage('Enderezando y normalizando imagen...');
    try {
      const straightened = await warpAndCropCard(imageUrl, corners, 800, 1216);
      const normalizedCorners = {
        topLeft: { x: 0.04, y: 0.05 },
        topRight: { x: 0.96, y: 0.05 },
        bottomLeft: { x: 0.04, y: 0.95 },
        bottomRight: { x: 0.96, y: 0.95 },
      };
      setCorners(normalizedCorners);
      if (onImageTransformed) {
        onImageTransformed(straightened);
      }
      if (onReExtractOcr) {
        onReExtractOcr(straightened, normalizedCorners);
      }
      setStatusMessage('¡Cartón enderezado y re-extraído con éxito!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Error al enderezar:', err);
      setStatusMessage('Error al procesar la perspectiva.');
    } finally {
      setIsWarping(false);
    }
  };

  // Control interactivo de arrastre de esquinas (Touch y Mouse)
  const handlePointerDown = (cornerKey: keyof CardCorners, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingCorner(cornerKey);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingCorner || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    const clampedX = Math.max(0.005, Math.min(0.995, rawX));
    const clampedY = Math.max(0.005, Math.min(0.995, rawY));

    setCorners((prev) => ({
      ...prev,
      [draggingCorner]: { x: clampedX, y: clampedY },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingCorner) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingCorner(null);
    }
  };

  // Mapeo dinámico de cajas delimitadoras según las 4 esquinas detectadas
  const getDynamicFieldStyle = (bbox: { x: number; y: number; width: number; height: number }) => {
    const xMin = template.fiducialMarkers?.topLeft?.x ?? 0.0525;
    const xMax = template.fiducialMarkers?.topRight?.x ?? 0.9475;
    const yMin = template.fiducialMarkers?.topLeft?.y ?? 0.3774;
    const yMax = template.fiducialMarkers?.bottomLeft?.y ?? 0.9642;

    const u1 = (bbox.x - xMin) / (xMax - xMin);
    const v1 = (bbox.y - yMin) / (yMax - yMin);
    const u2 = (bbox.x + bbox.width - xMin) / (xMax - xMin);
    const v2 = (bbox.y + bbox.height - yMin) / (yMax - yMin);

    const pTL = interpolatePoint(corners, u1, v1);
    const pTR = interpolatePoint(corners, u2, v1);
    const pBR = interpolatePoint(corners, u2, v2);
    const pBL = interpolatePoint(corners, u1, v2);

    const minX = Math.min(pTL.x, pTR.x, pBR.x, pBL.x);
    const maxX = Math.max(pTL.x, pTR.x, pBR.x, pBL.x);
    const minY = Math.min(pTL.y, pTR.y, pBR.y, pBL.y);
    const maxY = Math.max(pTL.y, pTR.y, pBR.y, pBL.y);

    return {
      left: `${minX * 100}%`,
      top: `${minY * 100}%`,
      width: `${Math.max(0.02, maxX - minX) * 100}%`,
      height: `${Math.max(0.015, maxY - minY) * 100}%`,
    };
  };

  const cornerLabels: Record<keyof CardCorners, string> = {
    topLeft: 'TL',
    topRight: 'TR',
    bottomLeft: 'BL',
    bottomRight: 'BR',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full select-none">
      {/* Barra de Herramientas del Visor */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Visor OpenCV & IA
          </span>
          {onSelectCardType && (
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => onSelectCardType('naranja')}
                className={`px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 ${
                  cardType === 'naranja'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-orange-300'
                }`}
              >
                <span>Naranja</span>
                {hasOrangeImage && <span className="text-[9px]">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectCardType('verde')}
                className={`px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 ${
                  cardType === 'verde'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <span>Verde</span>
                {hasGreenImage && <span className="text-[9px]">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Botones de acción rápida: Auto-alinear, Enderezar, Zoom */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          {imageUrl && (
            <>
              <button
                onClick={handleResetToMarkers}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center space-x-1 active:scale-95"
                title="Centrar mirillas en los 4 marcadores canónicos del cartón"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Marcadores</span>
              </button>

              <button
                onClick={handleReDetectCorners}
                disabled={isDetecting}
                className="px-2 py-1 rounded bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/80 text-blue-300 text-[11px] font-semibold transition flex items-center space-x-1 active:scale-95 disabled:opacity-50"
                title="Detectar esquinas automáticamente por color"
              >
                <Sparkles className={`w-3 h-3 text-blue-400 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>Auto-Detectar</span>
              </button>

              <button
                onClick={handleWarpAndStraighten}
                disabled={isWarping}
                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/80 text-amber-300 text-[11px] font-semibold transition flex items-center space-x-1 active:scale-95 disabled:opacity-50"
                title="Enderezar y recortar perspectiva a 90°"
              >
                <Crop className="w-3 h-3 text-amber-400" />
                <span>Enderezar</span>
              </button>

              {onReExtractOcr && (
                <button
                  onClick={() => onReExtractOcr(imageUrl, corners)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-500/30 transition flex items-center space-x-1.5 active:scale-95"
                  title="Re-extraer campos con visión local usando las 4 mirillas actuales"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>Re-Extraer IA</span>
                </button>
              )}

              <button
                onClick={() => setShowCornersGuide((prev) => !prev)}
                className={`p-1.5 rounded transition text-xs ${
                  showCornersGuide
                    ? 'bg-emerald-950/70 border border-emerald-700/80 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
                title={showCornersGuide ? 'Ocultar guías de esquinas' : 'Mostrar guías de esquinas'}
              >
                <Move className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="flex items-center space-x-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
              title="Restablecer zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Notificación de Estado Flotante */}
      {statusMessage && (
        <div className="mb-2 px-3 py-1 bg-blue-900/40 border border-blue-700/60 text-blue-200 text-xs rounded-lg flex items-center space-x-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Contenedor del Cartón con Zoom y Capas de Alineación */}
      <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[380px]">
        {imageUrl ? (
          <div
            className="relative inline-block transition-transform duration-150 select-none max-w-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Contenedor base de la foto con referencia para puntero */}
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative inline-block select-none touch-none"
            >
              {/* Imagen física del cartón */}
              <img
                src={imageUrl}
                alt="Cartón Físico Escaneado"
                className="w-auto max-w-[340px] md:max-w-[400px] max-h-[640px] h-auto rounded-lg shadow-2xl pointer-events-none block"
              />

              {/* Capa SVG para Líneas de Conexión Perimetrales entre Esquinas */}
              {showCornersGuide && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                  <polygon
                    points={`
                      ${corners.topLeft.x * 100}%,${corners.topLeft.y * 100}%
                      ${corners.topRight.x * 100}%,${corners.topRight.y * 100}%
                      ${corners.bottomRight.x * 100}%,${corners.bottomRight.y * 100}%
                      ${corners.bottomLeft.x * 100}%,${corners.bottomLeft.y * 100}%
                    `}
                    fill="rgba(16, 185, 129, 0.08)"
                    stroke="rgba(52, 211, 153, 0.85)"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                  />
                </svg>
              )}

              {/* Capa de Marcadores de Esquina Interactivos (Arrastrables con dedo o mouse) */}
              {showCornersGuide && (
                <div className="absolute inset-0 z-30">
                  {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as Array<keyof CardCorners>).map(
                    (cornerKey) => {
                      const pt = corners[cornerKey];
                      const isDragging = draggingCorner === cornerKey;
                      const label = cornerLabels[cornerKey];

                      return (
                        <div
                          key={cornerKey}
                          onPointerDown={(e) => handlePointerDown(cornerKey, e)}
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 group"
                          style={{
                            left: `${pt.x * 100}%`,
                            top: `${pt.y * 100}%`,
                          }}
                          title={`Marca ${label}: arrastra para calibrar esquina del cartón`}
                        >
                          {/* Mirilla de alta precisión */}
                          <div
                            className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              isDragging
                                ? 'border-amber-400 bg-amber-400/40 scale-125 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                                : 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_10px_rgba(52,211,153,0.5)] group-hover:scale-110 group-hover:border-amber-300'
                            }`}
                          >
                            {/* Cruz interna */}
                            <div className="w-2.5 h-0.5 bg-white absolute" />
                            <div className="h-2.5 w-0.5 bg-white absolute" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>

                          {/* Etiqueta de la esquina */}
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/85 text-emerald-300 text-[9px] font-mono font-bold px-1 rounded border border-emerald-500/40 pointer-events-none">
                            {label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* Capa de Cajas Delimitadoras Interpoladas Dinámicamente según las 4 esquinas */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {Object.entries(template.fields).map(([fieldKey, bbox]) => {
                  const isActive = activeFieldKey === fieldKey;
                  const conf = confidences[fieldKey] ?? 95;
                  const dynamicStyle = getDynamicFieldStyle(bbox);

                  return (
                    <div
                      key={fieldKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectField(fieldKey);
                      }}
                      className={`absolute rounded cursor-pointer pointer-events-auto transition-all ${
                        isActive
                          ? 'border-2 border-amber-400 bg-amber-400/25 shadow-lg shadow-amber-400/50 z-25 scale-[1.01]'
                          : 'border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/15 z-10'
                      }`}
                      style={dynamicStyle}
                      title={`Campo: ${bbox.label}`}
                    >
                      {isActive && (
                        <div className="absolute -top-6 left-0 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center space-x-1 pointer-events-none">
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
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Crosshair className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Sin imagen escaneada todavía</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Usa la cámara en vivo o sube una fotografía de la Tarjeta {cardType === 'naranja' ? 'Naranja' : 'Verde'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pie con Estado y Ayuda de Alineación */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            {showCornersGuide
              ? '4 Guías activas: Arrastra cualquier mirilla para calibrar esquinas con precisión milimétrica.'
              : 'Guías ocultas para visualización limpia.'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500">
          <button
            onClick={handleFitToEdges}
            className="hover:text-slate-300 underline text-[11px]"
          >
            Ajustar al borde
          </button>
        </div>
      </div>
    </div>
  );
};
