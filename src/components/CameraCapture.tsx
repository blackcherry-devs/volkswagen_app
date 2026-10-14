'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, AlertCircle, CheckCircle2, Smartphone, Video, X, Check } from 'lucide-react';
import { CardType } from '@/types/card';
import { generateMockCardSvg, SAMPLE_ORANGE_DATA, SAMPLE_GREEN_DATA } from '@/lib/mockData';

interface CameraCaptureProps {
  cardType: CardType;
  onImageSelected: (imageDataUrl: string, autoTriggerExtract?: boolean) => void;
  isProcessing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  cardType,
  onImageSelected,
  isProcessing,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const guideBoxRef = useRef<HTMLDivElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [guideSize, setGuideSize] = useState<'normal' | 'compact' | 'wide'>('normal');
  const [isAligned, setIsAligned] = useState<boolean>(false);

  const guideWidthClass =
    guideSize === 'compact'
      ? 'w-[70vw] max-w-[260px]'
      : guideSize === 'wide'
      ? 'w-[88vw] max-w-[340px]'
      : 'w-[78vw] max-w-[295px]';

  // Callback ref memorizado para enlazar el stream sin resetear la reproducción
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch((playErr) => console.warn('Autoplay error:', playErr));
    }
  }, []);

  // Iniciar cámara con navigator.mediaDevices.getUserMedia()
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof window === 'undefined') return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Los navegadores móviles requieren HTTPS para transmitir video en vivo WebRTC. Abriendo la cámara de tu celular...'
        );
        nativeCameraInputRef.current?.click();
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setStreamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Autoplay error:', playErr);
        }
      }
    } catch (err: any) {
      console.warn('Cámara no disponible directamente o permiso denegado:', err);
      setCameraError(
        'No se pudo acceder al visor en vivo. Puedes usar "Tomar Foto (Cámara Móvil)" para disparar la cámara directamente.'
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setIsAligned(false);
  };

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (streamActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraFacing]);

  // Loop ligero en tiempo real: detecta si las 4 esquinas del cartón presentan contraste/marcadores
  useEffect(() => {
    if (!streamActive) {
      setIsAligned(false);
      return;
    }

    let animationFrameId: number;
    let lastCheck = 0;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 80;
    sampleCanvas.height = 80;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const checkAlignment = (time: number) => {
      if (time - lastCheck > 180 && videoRef.current && guideBoxRef.current && sampleCtx) {
        lastCheck = time;
        try {
          const video = videoRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const videoRect = video.getBoundingClientRect();
            const guideRect = guideBoxRef.current.getBoundingClientRect();

            if (videoRect.width > 0 && videoRect.height > 0) {
              const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight);
              const renderedW = video.videoWidth * scale;
              const renderedH = video.videoHeight * scale;
              const offX = (renderedW - videoRect.width) / 2;
              const offY = (renderedH - videoRect.height) / 2;

              // Analizar 4 puntos de esquina (los 4 cuadros guía)
              const corners = [
                { x: guideRect.left + 22, y: guideRect.top + 22 },
                { x: guideRect.right - 22, y: guideRect.top + 22 },
                { x: guideRect.left + 22, y: guideRect.bottom - 22 },
                { x: guideRect.right - 22, y: guideRect.bottom - 22 },
              ];

              let detectedCount = 0;
              for (const c of corners) {
                const sx = (c.x - videoRect.left + offX) / scale;
                const sy = (c.y - videoRect.top + offY) / scale;

                if (sx >= 15 && sy >= 15 && sx < video.videoWidth - 15 && sy < video.videoHeight - 15) {
                  sampleCtx.drawImage(video, sx - 15, sy - 15, 30, 30, 0, 0, 30, 30);
                  const imgData = sampleCtx.getImageData(0, 0, 30, 30);
                  const data = imgData.data;

                  let hasDark = false;
                  let hasLight = false;
                  for (let i = 0; i < data.length; i += 4) {
                    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    if (lum < 80) hasDark = true;
                    if (lum > 130) hasLight = true;
                    if (hasDark && hasLight) break;
                  }
                  if (hasDark && hasLight) {
                    detectedCount++;
                  }
                }
              }

              // Si al menos 3 de las 4 esquinas tienen patrón de alto contraste, dar encuadre válido
              setIsAligned(detectedCount >= 3);
            }
          }
        } catch {
          // Ignorar errores de context
        }
      }
      animationFrameId = requestAnimationFrame(checkAlignment);
    };

    animationFrameId = requestAnimationFrame(checkAlignment);
    return () => cancelAnimationFrame(animationFrameId);
  }, [streamActive]);

  // Capturar frame actual del video RECORTADO exactamente a los 4 cuadros guía
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const videoWidth = video.videoWidth || 1920;
    const videoHeight = video.videoHeight || 1080;
    const videoRect = video.getBoundingClientRect();
    const guideRect = guideBoxRef.current?.getBoundingClientRect();

    const canvas = document.createElement('canvas');

    if (guideRect && videoRect.width > 0 && videoRect.height > 0) {
      // Compensar la escala y desplazamiento de object-fit: cover
      const scale = Math.max(videoRect.width / videoWidth, videoRect.height / videoHeight);
      const renderedWidth = videoWidth * scale;
      const renderedHeight = videoHeight * scale;

      const offsetX = (renderedWidth - videoRect.width) / 2;
      const offsetY = (renderedHeight - videoRect.height) / 2;

      // Coordenadas exactas en el espacio original del sensor de la cámara
      const sourceX = Math.max(0, (guideRect.left - videoRect.left + offsetX) / scale);
      const sourceY = Math.max(0, (guideRect.top - videoRect.top + offsetY) / scale);
      const sourceWidth = Math.min(videoWidth - sourceX, guideRect.width / scale);
      const sourceHeight = Math.min(videoHeight - sourceY, guideRect.height / scale);

      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } else {
      // Fallback
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    onImageSelected(dataUrl, true);
  };

  // Manejar archivo subido desde el explorador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      stopCamera();
      onImageSelected(dataUrl, true);
    };
    reader.readAsDataURL(file);
  };

  // Cargar cartón sintético de prueba
  const handleLoadSample = (sampleType: CardType) => {
    const data = sampleType === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA;
    const sampleSvg = generateMockCardSvg(sampleType, data);
    stopCamera();
    onImageSelected(sampleSvg, true);
  };

  const isOrange = cardType === 'naranja';
  const themeBorder = isOrange ? 'border-orange-500' : 'border-emerald-500';
  const themeGlow = isOrange ? 'shadow-orange-500/20' : 'shadow-emerald-500/20';
  const themeBadge = isOrange ? 'bg-orange-500' : 'bg-emerald-600';

  return (
    <>
      {/* 1. VISOR EN PANTALLA COMPLETA INMERSIVA CUANDO streamActive ES TRUE */}
      {streamActive && (
        <div className="fixed inset-0 z-[99999] bg-black w-screen h-[100dvh] flex flex-col justify-between overflow-hidden select-none">
          {/* Video en vivo a pantalla completa */}
          <video
            ref={attachVideo}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Barra Superior Flotante */}
          <div className="relative z-30 pt-10 sm:pt-6 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleCameraFacing}
                className="flex items-center space-x-1.5 px-3 py-2 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/20 active:scale-95 transition shadow-2xl"
                title="Cambiar entre cámara trasera y frontal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Voltear</span>
              </button>

              <button
                onClick={() =>
                  setGuideSize((prev) =>
                    prev === 'normal' ? 'wide' : prev === 'wide' ? 'compact' : 'normal'
                  )
                }
                className="px-3 py-2 bg-black/75 hover:bg-black/90 backdrop-blur-md text-amber-300 text-[11px] font-semibold rounded-full border border-amber-400/30 active:scale-95 transition shadow-2xl flex items-center space-x-1"
                title="Ajustar tamaño del recuadro"
              >
                <span className="text-slate-300">Tamaño:</span>
                <span className="font-bold text-amber-400 capitalize">
                  {guideSize === 'normal' ? 'Normal' : guideSize === 'wide' ? 'Amplia' : 'Compacta'}
                </span>
              </button>
            </div>

            {/* Píldora de Estado de Alineación (Amarillo ➔ Verde) */}
            <div
              className={`px-3 py-1.5 backdrop-blur-md rounded-full text-[11px] font-bold shadow-2xl flex items-center space-x-2 border transition-all duration-300 ${
                isAligned
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse'
                  : 'bg-black/80 text-amber-300 border-amber-400/40'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAligned ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>{isAligned ? '✓ ¡4 Marcadores Alineados!' : 'Buscando 4 Marcadores...'}</span>
            </div>

            <button
              onClick={stopCamera}
              className="p-2.5 bg-red-600/90 hover:bg-red-600 backdrop-blur-md text-white rounded-full border border-red-400/40 active:scale-95 transition shadow-2xl"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centro: Marco Guía para el Cartón (Centrado en el área visible entre barra superior e inferior) */}
          <div className="absolute inset-x-0 top-16 bottom-28 flex items-center justify-center pointer-events-none z-20">
            <div
              ref={guideBoxRef}
              className={`relative ${guideWidthClass} aspect-[1/1.52] flex flex-col justify-between transition-all duration-200`}
            >
              {/* Marco perimetral punteado */}
              <div
                className={`absolute inset-0 border-2 border-dashed rounded-2xl pointer-events-none transition-all duration-300 ${
                  isAligned
                    ? 'border-emerald-400/90 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                    : 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                }`}
              />

              {/* 1. CUADRO GUÍA: ESQUINA SUPERIOR IZQUIERDA (Top-Left) */}
              <div
                className={`absolute top-1 left-1 w-11 h-11 border-2 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isAligned
                    ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110'
                    : 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                }`}
              >
                {/* Cuadro concéntrico central que simula el marcador físico */}
                <div
                  className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                    isAligned ? 'border-emerald-300 bg-emerald-400/20' : 'border-amber-300 bg-amber-400/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-xs ${isAligned ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                </div>
                <span
                  className={`absolute -top-3.5 left-0 px-1 py-0.2 text-[9px] font-black font-mono rounded shadow ${
                    isAligned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-black/90 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  1
                </span>
              </div>

              {/* 2. CUADRO GUÍA: ESQUINA SUPERIOR DERECHA (Top-Right) */}
              <div
                className={`absolute top-1 right-1 w-11 h-11 border-2 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isAligned
                    ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110'
                    : 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                    isAligned ? 'border-emerald-300 bg-emerald-400/20' : 'border-amber-300 bg-amber-400/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-xs ${isAligned ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                </div>
                <span
                  className={`absolute -top-3.5 right-0 px-1 py-0.2 text-[9px] font-black font-mono rounded shadow ${
                    isAligned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-black/90 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  2
                </span>
              </div>

              {/* 3. CUADRO GUÍA: ESQUINA INFERIOR IZQUIERDA (Bottom-Left) */}
              <div
                className={`absolute bottom-1 left-1 w-11 h-11 border-2 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isAligned
                    ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110'
                    : 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                    isAligned ? 'border-emerald-300 bg-emerald-400/20' : 'border-amber-300 bg-amber-400/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-xs ${isAligned ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                </div>
                <span
                  className={`absolute -bottom-3.5 left-0 px-1 py-0.2 text-[9px] font-black font-mono rounded shadow ${
                    isAligned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-black/90 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  3
                </span>
              </div>

              {/* 4. CUADRO GUÍA: ESQUINA INFERIOR DERECHA (Bottom-Right) */}
              <div
                className={`absolute bottom-1 right-1 w-11 h-11 border-2 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isAligned
                    ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110'
                    : 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                    isAligned ? 'border-emerald-300 bg-emerald-400/20' : 'border-amber-300 bg-amber-400/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-xs ${isAligned ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                </div>
                <span
                  className={`absolute -bottom-3.5 right-0 px-1 py-0.2 text-[9px] font-black font-mono rounded shadow ${
                    isAligned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-black/90 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  4
                </span>
              </div>
            </div>
          </div>

          {/* Barra Inferior con Disparador Ergonómico */}
          <div className="relative z-30 pb-8 sm:pb-6 px-4 flex flex-col items-center justify-center space-y-3">
            <div
              className={`text-center backdrop-blur-md text-xs py-1.5 px-4 rounded-full border shadow-2xl transition-all duration-300 ${
                isAligned
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-400/80 font-bold'
                  : 'bg-black/80 text-amber-200 border-amber-400/40 font-medium'
              }`}
            >
              {isAligned
                ? '✓ ¡4 Marcadores Dentro! Listo para disparar'
                : 'Mete los 4 cuadros negros del cartón dentro de las 4 esquinas 1, 2, 3 y 4'}
            </div>

            <button
              onClick={takeSnapshot}
              disabled={isProcessing}
              className={`relative p-2 rounded-full border-4 backdrop-blur-sm shadow-2xl active:scale-90 transition-all hover:scale-105 ${
                isAligned
                  ? 'border-emerald-400/90 bg-emerald-500/30 shadow-[0_0_30px_rgba(52,211,153,0.6)] ring-4 ring-emerald-400/40'
                  : 'border-white/95 bg-white/20'
              }`}
              title="Tomar foto del cartón"
            >
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full ${
                  isAligned
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                    : isOrange
                    ? 'bg-gradient-to-tr from-orange-600 to-amber-500'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                } flex items-center justify-center shadow-2xl transition-transform`}
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. TARJETA ESTÁNDAR DENTRO DE LA PÁGINA (ESTADO NORMAL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${themeBadge} animate-ping`} />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Captura de {isOrange ? 'Cartón Naranja (Desmontaje)' : 'Cartón Verde (Seguimiento)'}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Toma una foto con tu celular, abre el visor interactivo o sube un archivo.
            </p>
          </div>
        </div>

        {/* Área de Selección de Captura */}
        <div
          className={`relative w-full h-[54vh] min-h-[380px] max-h-[520px] sm:h-auto sm:aspect-[16/10] sm:min-h-[420px] bg-slate-950 rounded-2xl overflow-hidden border-2 ${themeBorder} ${themeGlow} flex items-center justify-center`}
        >
          <div className="text-center p-4 sm:p-6 flex flex-col items-center justify-center max-w-md w-full h-full">
            <div className="relative mb-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-300 shadow-xl">
                <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <h3 className="text-white font-bold text-sm sm:text-base mb-1">
              Captura de Cartoncillo Físico
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs sm:max-w-sm">
              Toma una foto nítida con tu celular o activa el visor interactivo para encuadrar el cartón.
            </p>

            {cameraError && (
              <div className="mb-4 p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl text-left text-amber-200 text-xs flex items-start space-x-2.5 w-full">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-300 text-[11px]">Aviso de cámara:</p>
                  <p className="text-[11px] leading-relaxed">{cameraError}</p>
                </div>
              </div>
            )}

            {/* Opciones de captura grandes para tocar con los dedos en móvil */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
              {/* Opción 1: Cámara móvil nativa */}
              <button
                onClick={() => nativeCameraInputRef.current?.click()}
                className={`flex items-center justify-center space-x-2 px-5 py-3 ${
                  isOrange ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white text-xs sm:text-sm font-bold rounded-xl shadow-xl transition active:scale-95`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Tomar Foto (Cámara Móvil)</span>
              </button>

              {/* Opción 2: Visor WebRTC en vivo */}
              <button
                onClick={startCamera}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition active:scale-95"
              >
                <Video className="w-4 h-4 text-blue-400" />
                <span>Visor en Vivo con Guía</span>
              </button>

              {/* Opción 3: Subir de galería */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Subir Foto</span>
              </button>
            </div>

            {/* Inputs ocultos */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Opción de Muestra Sintética */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-500">
              <span>¿No tienes cámara a mano?</span>
              <button
                onClick={() => handleLoadSample(cardType)}
                className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Muestra Sintética</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
