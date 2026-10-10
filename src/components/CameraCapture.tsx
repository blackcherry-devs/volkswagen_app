'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Iniciar cámara con navigator.mediaDevices.getUserMedia()
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn('Cámara no disponible directamente o permiso denegado:', err);
      setCameraError(
        'No se pudo acceder a la cámara en vivo (requiere HTTPS o permiso concedido). Puedes subir una imagen o probar con los cartones de muestra.'
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${themeBadge} animate-ping`} />
            <h2 className="text-lg font-bold text-white">
              Captura de {isOrange ? 'Cartón Naranja (Desmontaje)' : 'Cartón Verde (Seguimiento)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Toma una foto en tiempo real, sube un archivo o carga una muestra para validar el flujo.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {streamActive ? (
            <>
              <button
                onClick={toggleCameraFacing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
                title="Cambiar entre cámara trasera y frontal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Voltear Cámara</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/40 text-red-300 text-xs rounded-lg border border-red-500/40 transition"
              >
                Cerrar Cámara
              </button>
            </>
          ) : (
            <button
              onClick={startCamera}
              className={`flex items-center space-x-2 px-4 py-2 ${
                isOrange ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white text-xs font-bold rounded-xl shadow-lg transition`}
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Cámara en Vivo</span>
            </button>
          )}
        </div>
      </div>

      {/* Visor de Cámara / Área de Captura */}
      <div
        className={`relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border-2 ${themeBorder} ${themeGlow} flex items-center justify-center`}
      >
        {streamActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guía Visual de Encuadre para el Operario */}
            <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-4 bg-black/10">
              {/* 4 Esquinas de Enfoque */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr" />
              </div>
              <div className="text-center bg-black/70 backdrop-blur text-white text-xs py-1.5 px-4 rounded-full self-center border border-white/20">
                Alinee los 4 marcadores de las esquinas del cartón dentro del recuadro
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br" />
              </div>
            </div>

            {/* Botón Flotante para Disparar Foto */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={takeSnapshot}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full bg-white border-4 border-amber-400 hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400 group-hover:bg-amber-500 transition" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 flex flex-col items-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">
              Cámara inactiva o lista para cargar
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Usa la cámara del dispositivo, sube una foto desde tu galería o carga una tarjeta de prueba ya rellenada con manuscrito.
            </p>

            {cameraError && (
              <div className="mb-4 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-left text-amber-200 text-[11px] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={startCamera}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Encender Cámara</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto del Cartón</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de Muestra Rápida para Pruebas Inmediatas */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Prueba rápida con cartón sintético de alta fidelidad:</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleLoadSample('naranja')}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 border border-orange-800/60 rounded-lg text-xs font-bold transition"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Muestra Naranja (Desmontaje)</span>
          </button>

          <button
            onClick={() => handleLoadSample('verde')}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-bold transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Muestra Verde (Seguimiento)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
