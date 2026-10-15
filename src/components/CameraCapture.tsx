'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, AlertCircle, CheckCircle2, Smartphone, Video, X, Check } from 'lucide-react';
import { CardType } from '@/types/card';

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
  const guideRef = useRef<HTMLDivElement | null>(null);
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

  // Loop de detección visual en tiempo real de los 4 marcadores (muestreo a ~8 FPS)
  useEffect(() => {
    if (!streamActive) {
      setIsAligned(false);
      return;
    }

    let isMounted = true;
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 24;
    sampleCanvas.height = 24;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

    const intervalId = setInterval(() => {
      if (!isMounted) return;
      const video = videoRef.current;
      const guideEl = guideRef.current;
      if (!video || !guideEl || !sampleCtx || video.readyState < 2) return;

      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      if (!vWidth || !vHeight) return;

      const guideRect = guideEl.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();
      if (!guideRect.width || !videoRect.width) return;

      const videoRatio = vWidth / vHeight;
      const elemRatio = videoRect.width / videoRect.height;

      let renderedWidth = videoRect.width;
      let renderedHeight = videoRect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (elemRatio > videoRatio) {
        renderedWidth = videoRect.width;
        renderedHeight = videoRect.width / videoRatio;
        offsetY = (videoRect.height - renderedHeight) / 2;
      } else {
        renderedWidth = videoRect.height * videoRatio;
        renderedHeight = videoRect.height;
        offsetX = (videoRect.width - renderedWidth) / 2;
      }

      const scaleX = vWidth / renderedWidth;
      const scaleY = vHeight / renderedHeight;

      // 4 esquinas del cuadro guía en coordenadas del video
      const corners = [
        { x: guideRect.left + 16, y: guideRect.top + 16 }, // Top-Left
        { x: guideRect.right - 16, y: guideRect.top + 16 }, // Top-Right
        { x: guideRect.left + 16, y: guideRect.bottom - 16 }, // Bottom-Left
        { x: guideRect.right - 16, y: guideRect.bottom - 16 }, // Bottom-Right
      ];

      const boxSize = Math.max(16, Math.round(28 * scaleX));
      let detectedCount = 0;

      for (const pt of corners) {
        const vx = (pt.x - videoRect.left - offsetX) * scaleX;
        const vy = (pt.y - videoRect.top - offsetY) * scaleY;

        const sx = Math.max(0, Math.min(vWidth - boxSize, Math.round(vx - boxSize / 2)));
        const sy = Math.max(0, Math.min(vHeight - boxSize, Math.round(vy - boxSize / 2)));

        sampleCtx.drawImage(video, sx, sy, boxSize, boxSize, 0, 0, 24, 24);
        const imgData = sampleCtx.getImageData(0, 0, 24, 24);
        const data = imgData.data;

        let darkPixels = 0;
        let cardPixels = 0;
        const total = 24 * 24;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum < 75 || (r < 80 && g < 80 && b < 80)) {
            darkPixels++;
          }
          if (cardType === "naranja") {
            if (r > 110 && g > 45 && r > b * 1.3) cardPixels++;
          } else {
            if (g > 75 && g > b && g > r * 0.95) cardPixels++;
          }
        }

        const darkRatio = darkPixels / total;
        const cardRatio = cardPixels / total;
        if ((darkRatio >= 0.05 && darkRatio <= 0.75) || (darkRatio >= 0.03 && cardRatio >= 0.15)) {
          detectedCount++;
        }
      }

      const allAligned = detectedCount === 4;
      setIsAligned((prev) => (prev !== allAligned ? allAligned : prev));
    }, 130);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [streamActive, cardType]);

  // Capturar frame actual del video a Canvas proyectando exactamente lo que está dentro del marco guía
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;
    const guideEl = guideRef.current;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (guideEl) {
      const guideRect = guideEl.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      const videoRatio = vWidth / vHeight;
      const elemRatio = videoRect.width / videoRect.height;

      let renderedWidth = videoRect.width;
      let renderedHeight = videoRect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (elemRatio > videoRatio) {
        renderedWidth = videoRect.width;
        renderedHeight = videoRect.width / videoRatio;
        offsetY = (videoRect.height - renderedHeight) / 2;
      } else {
        renderedWidth = videoRect.height * videoRatio;
        renderedHeight = videoRect.height;
        offsetX = (videoRect.width - renderedWidth) / 2;
      }

      const scaleX = vWidth / renderedWidth;
      const scaleY = vHeight / renderedHeight;

      const guideX = guideRect.left - videoRect.left - offsetX;
      const guideY = guideRect.top - videoRect.top - offsetY;

      // Margen mínimo del 1% para asegurar que los bordes del cartón queden completos sin recortar marcas
      const margin = 0.01;
      const mX = guideRect.width * margin;
      const mY = guideRect.height * margin;

      const cropX = Math.max(0, Math.round((guideX - mX) * scaleX));
      const cropY = Math.max(0, Math.round((guideY - mY) * scaleY));
      const cropW = Math.min(vWidth - cropX, Math.round((guideRect.width + mX * 2) * scaleX));
      const cropH = Math.min(vHeight - cropY, Math.round((guideRect.height + mY * 2) * scaleY));

      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    } else {
      canvas.width = vWidth;
      canvas.height = vHeight;
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
              <span>{isAligned ? '¡Encuadre Correcto! Listo para disparar' : 'Buscando 4 Marcadores...'}</span>
            </div>

            <button
              onClick={stopCamera}
              className="p-2.5 bg-red-600/90 hover:bg-red-600 backdrop-blur-md text-white rounded-full border border-red-400/40 active:scale-95 transition shadow-2xl"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centro: Marco Guía para el Cartón (Centrado absoluto con proyección 1:1) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              ref={guideRef}
              className={`relative ${guideWidthClass} aspect-[1/1.5] flex flex-col justify-between transition-all duration-200`}
            >
              {/* Recuadro punteado con esquinas de alta precisión (Amarillo ➔ Verde) */}
              <div
                className={`absolute inset-0 border-2 border-dashed rounded-2xl pointer-events-none transition-all duration-300 ${
                  isAligned
                    ? "border-emerald-400/90 bg-emerald-500/10 shadow-[0_0_35px_rgba(52,211,153,0.45)]"
                    : "border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.35)]"
                }`}
              />

              {/* 4 Esquinas de Enfoque con Mirillas (Amarillo ➔ Verde) */}
              <div className="relative flex justify-between z-10 -m-1">
                <div
                  className={`relative w-12 h-12 border-t-4 border-l-4 rounded-tl-xl shadow-lg flex items-start justify-start p-1 transition-colors duration-300 ${
                    isAligned ? "border-emerald-400 bg-emerald-500/20" : "border-amber-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors duration-300 ${
                      isAligned ? "border-emerald-300 bg-emerald-400/40" : "border-amber-300 bg-amber-400/40"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isAligned ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  </div>
                </div>
                <div
                  className={`relative w-12 h-12 border-t-4 border-r-4 rounded-tr-xl shadow-lg flex items-start justify-end p-1 transition-colors duration-300 ${
                    isAligned ? "border-emerald-400 bg-emerald-500/20" : "border-amber-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors duration-300 ${
                      isAligned ? "border-emerald-300 bg-emerald-400/40" : "border-amber-300 bg-amber-400/40"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isAligned ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  </div>
                </div>
              </div>

              {/* Indicador central de alineación */}
              <div className="flex flex-col items-center justify-center space-y-1 opacity-70">
                <div className={`w-10 h-0.5 ${isAligned ? "bg-emerald-400/60" : "bg-amber-400/50"}`} />
                <span
                  className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded transition-colors duration-300 ${
                    isAligned ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40" : "text-amber-300 bg-black/60"
                  }`}
                >
                  ZONA DE DATOS HSK 63
                </span>
                <div className={`w-10 h-0.5 ${isAligned ? "bg-emerald-400/60" : "bg-amber-400/50"}`} />
              </div>

              {/* Esquinas Inferiores con Mirillas */}
              <div className="relative flex justify-between z-10 -m-1">
                <div
                  className={`relative w-12 h-12 border-b-4 border-l-4 rounded-bl-xl shadow-lg flex items-end justify-start p-1 transition-colors duration-300 ${
                    isAligned ? "border-emerald-400 bg-emerald-500/20" : "border-amber-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors duration-300 ${
                      isAligned ? "border-emerald-300 bg-emerald-400/40" : "border-amber-300 bg-amber-400/40"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isAligned ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  </div>
                </div>
                <div
                  className={`relative w-12 h-12 border-b-4 border-r-4 rounded-br-xl shadow-lg flex items-end justify-end p-1 transition-colors duration-300 ${
                    isAligned ? "border-emerald-400 bg-emerald-500/20" : "border-amber-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors duration-300 ${
                      isAligned ? "border-emerald-300 bg-emerald-400/40" : "border-amber-300 bg-amber-400/40"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isAligned ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  </div>
                </div>
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
                ? '¡Encuadre Correcto! Listo para disparar'
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

            {/* Inputs ocultos necesarios para la cámara nativa del celular o explorador de archivos */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Información de Captura Real */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs">
              Modo Real: Toma foto con la cámara o selecciona una imagen de tu galería para procesarla con Ollama LLaVA.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
