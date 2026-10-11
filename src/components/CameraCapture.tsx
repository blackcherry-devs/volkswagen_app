'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, AlertCircle, CheckCircle2, Smartphone, Video, X } from 'lucide-react';
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
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [guideSize, setGuideSize] = useState<'normal' | 'compact' | 'wide'>('normal');

  const guideWidthClass =
    guideSize === 'compact'
      ? 'w-[68vw] max-w-[270px]'
      : guideSize === 'wide'
      ? 'w-[86vw] max-w-[340px]'
      : 'w-[76vw] max-w-[305px]';

  // Callback ref memorizado para enlazar el stream sin resetear la reproducción al cambiar guías
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

      // En móviles sobre HTTP (no seguro), los navegadores restringen mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Los navegadores móviles requieren HTTPS para transmitir video en vivo WebRTC. Abriendo la cámara de tu celular...'
        );
        // Abrir automáticamente la cámara nativa del teléfono móvil
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

  // Capturar frame actual del video a Canvas
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
          {/* Video en vivo a pantalla completa real */}
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
          <div className="relative z-30 pt-12 sm:pt-6 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleCameraFacing}
                className="flex items-center space-x-1.5 px-3 py-2 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/20 active:scale-95 transition shadow-2xl"
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
                className="px-3 py-2 bg-black/70 hover:bg-black/90 backdrop-blur-md text-amber-300 text-[11px] font-semibold rounded-full border border-amber-400/30 active:scale-95 transition shadow-2xl flex items-center space-x-1"
                title="Ajustar tamaño del recuadro"
              >
                <span className="text-slate-300">Guía:</span>
                <span className="font-bold text-amber-400 capitalize">
                  {guideSize === 'normal' ? 'Normal' : guideSize === 'wide' ? 'Amplia' : 'Compacta'}
                </span>
              </button>
            </div>

            <div className="hidden xs:flex px-3 py-1.5 bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40 rounded-full text-[11px] font-bold shadow-2xl items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Encuadre VW HSK 63</span>
            </div>

            <button
              onClick={stopCamera}
              className="p-2.5 bg-red-600/90 hover:bg-red-600 backdrop-blur-md text-white rounded-full border border-red-400/40 active:scale-95 transition shadow-2xl"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centro: Marco Guía para el Cartón (Centrado absoluto) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className={`relative ${guideWidthClass} aspect-[1/1.52] flex flex-col justify-between transition-all duration-200`}
            >
              {/* Recuadro punteado con esquinas amarillas */}
              <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(245,158,11,0.25)]" />

              {/* 4 Esquinas Amarillas de Enfoque */}
              <div className="relative flex justify-between z-10 -m-1">
                <div className="w-10 h-10 border-t-4 border-l-4 border-amber-400 rounded-tl-xl shadow-lg" />
                <div className="w-10 h-10 border-t-4 border-r-4 border-amber-400 rounded-tr-xl shadow-lg" />
              </div>

              {/* Marcadores de esquinas interiores */}
              <div className="relative flex justify-between px-2 pt-3 opacity-60">
                <div className="w-5 h-5 border-2 border-dotted border-amber-300 rounded" />
                <div className="w-5 h-5 border-2 border-dotted border-amber-300 rounded" />
              </div>

              <div className="relative flex justify-between px-2 pb-3 opacity-60">
                <div className="w-5 h-5 border-2 border-dotted border-amber-300 rounded" />
                <div className="w-5 h-5 border-2 border-dotted border-amber-300 rounded" />
              </div>

              {/* Esquinas Inferiores */}
              <div className="relative flex justify-between z-10 -m-1">
                <div className="w-10 h-10 border-b-4 border-l-4 border-amber-400 rounded-bl-xl shadow-lg" />
                <div className="w-10 h-10 border-b-4 border-r-4 border-amber-400 rounded-br-xl shadow-lg" />
              </div>
            </div>
          </div>

          {/* Barra Inferior Flotante con Disparador Ergonómico */}
          <div className="relative z-30 pb-10 sm:pb-6 px-4 flex flex-col items-center justify-center space-y-3">
            <div className="text-center bg-black/75 backdrop-blur-md text-amber-200 text-xs py-1.5 px-4 rounded-full border border-amber-400/30 shadow-2xl">
              Alinea las 4 marcas del cartón dentro del recuadro
            </div>

            <button
              onClick={takeSnapshot}
              disabled={isProcessing}
              className="relative p-1.5 rounded-full border-4 border-white/95 bg-white/20 backdrop-blur-sm shadow-2xl active:scale-90 transition-all hover:scale-105"
              title="Tomar foto del cartón"
            >
              <div
                className={`w-18 h-18 rounded-full ${
                  isOrange
                    ? 'bg-gradient-to-tr from-orange-600 to-amber-500 hover:from-orange-500'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500'
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
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/80 transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Galería / Archivo</span>
              </button>

              {/* Inputs ocultos */}
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
        </div>

        {/* Botones de Muestra Rápida para Pruebas Inmediatas */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs">Prueba rápida con cartón sintético de muestra:</span>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              onClick={() => handleLoadSample('naranja')}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 border border-orange-800/60 rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="truncate">Muestra Naranja</span>
            </button>

            <button
              onClick={() => handleLoadSample('verde')}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="truncate">Muestra Verde</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
