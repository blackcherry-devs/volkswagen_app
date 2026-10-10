'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  Printer,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { CameraCapture } from '@/components/CameraCapture';
import { CardInspector } from '@/components/CardInspector';
import { VerificationForm } from '@/components/VerificationForm';
import { ExcelTableViewer } from '@/components/ExcelTableViewer';
import { PrintableCardDesigner } from '@/components/PrintableCardDesigner';
import { CoordinateCalibrator } from '@/components/CoordinateCalibrator';
import { CardType, AnyCardData, SavedRecord, OrangeCardData, GreenCardData } from '@/types/card';
import {
  SAMPLE_ORANGE_DATA,
  SAMPLE_GREEN_DATA,
  generateMockCardSvg,
  simulateExtractionPipeline,
} from '@/lib/mockData';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'capture' | 'excel' | 'print' | 'calibrate'>('capture');
  const [selectedCardType, setSelectedCardType] = useState<CardType>('naranja');

  // Estados de procesamiento
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<AnyCardData | null>(null);
  const [confidences, setConfidences] = useState<Record<string, number>>({});
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Registros guardados para Excel (precargados con 2 muestras históricas)
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([
    {
      id: 'VW-REC-001',
      cardType: 'naranja',
      capturedAt: '2026-10-09T08:15:00.000Z',
      verifiedAt: '09/10/2026 08:16',
      imageUrl: generateMockCardSvg('naranja', SAMPLE_ORANGE_DATA),
      syncStatus: 'synced_excel',
      excelRowNumber: 1,
      data: SAMPLE_ORANGE_DATA,
    },
    {
      id: 'VW-REC-002',
      cardType: 'verde',
      capturedAt: '2026-10-09T09:30:00.000Z',
      verifiedAt: '09/10/2026 09:31',
      imageUrl: generateMockCardSvg('verde', SAMPLE_GREEN_DATA),
      syncStatus: 'synced_excel',
      excelRowNumber: 1,
      data: SAMPLE_GREEN_DATA,
    },
  ]);

  // Cargar automáticamente un cartón de muestra al inicio para que la pantalla esté viva de inmediato
  useEffect(() => {
    const defaultData = selectedCardType === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA;
    const defaultSvg = generateMockCardSvg(selectedCardType, defaultData);
    setCapturedImage(defaultSvg);
    setExtractedData(defaultData);
    setConfidences(
      selectedCardType === 'naranja'
        ? {
            centroCostos: 98,
            operacion: 92,
            numeroHerramienta: 96,
            maquina: 99,
            husillo: 97,
            tiempoVidaUtil: 94,
            fecha: 99,
            turno: 98,
            nombre: 91,
            motivoDesmontaje: 89,
            observaciones: 93,
          }
        : {
            centroCostos: 99,
            operacion: 94,
            numeroHerramienta: 97,
            maquina: 98,
            husillo: 96,
            tiempoVidaUtil: 95,
            observaciones: 92,
            fecha: 99,
            nombre: 92,
            turno: 98,
          }
    );
  }, [selectedCardType]);

  // Manejar imagen capturada o subida
  const handleImageSelected = async (imageUri: string, autoTriggerExtract = true) => {
    setCapturedImage(imageUri);
    if (autoTriggerExtract) {
      setIsProcessing(true);
      try {
        const result = await simulateExtractionPipeline(
          selectedCardType,
          imageUri,
          (step) => setProcessingStep(step)
        );
        setExtractedData(result.data);
        setConfidences(result.confidences as Record<string, number>);
        showNotification('¡Datos extraídos con éxito! Revisa y confirma el formulario a la derecha.');
      } catch (err) {
        console.error('Error durante la extracción:', err);
      } finally {
        setIsProcessing(false);
        setProcessingStep('');
      }
    }
  };

  // Guardar datos validados en el Excel simulado
  const handleSaveToExcel = (finalData: AnyCardData) => {
    const newRecord: SavedRecord = {
      id: `VW-REC-${String(savedRecords.length + 1).padStart(3, '0')}`,
      cardType: selectedCardType,
      capturedAt: new Date().toISOString(),
      verifiedAt: new Date().toLocaleString(),
      imageUrl: capturedImage || '',
      syncStatus: 'synced_excel',
      excelRowNumber: savedRecords.filter((r) => r.cardType === selectedCardType).length + 1,
      data: finalData,
    };

    setSavedRecords((prev) => [newRecord, ...prev]);
    showNotification(
      `Registro guardado y enviado a Excel (${selectedCardType === 'naranja' ? 'Desmontajes_Naranja' : 'Herramientas_Verde'})!`
    );
  };

  const showNotification = (msg: string) => {
    setNotification({ message: msg, type: 'success' });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleResetCurrent = () => {
    const defaultData = selectedCardType === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA;
    setExtractedData({ ...defaultData });
    setActiveFieldKey(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCardType={selectedCardType}
        setSelectedCardType={setSelectedCardType}
        savedCount={savedRecords.length}
      />

      {/* Notificación Flotante Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Informativo del Flujo de Trabajo */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white">
                Flujo Human-in-the-Loop para Volkswagen HSK 63
              </h1>
              <p className="text-xs text-slate-400">
                1. Captura o sube la foto &rarr; 2. OpenCV + Azure OCR auto-llenan el formulario &rarr; 3. Verifica o edita errores &rarr; 4. Guarda directamente en Excel.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'capture'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Captura & Verificación
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Excel ({savedRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Modal / Overlay de Procesamiento */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-lg font-bold text-white">Procesando Cartoncillo</h3>
              <p className="text-xs text-blue-300 font-mono animate-pulse">
                {processingStep || 'Iniciando pipeline de visión computacional...'}
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-3/4 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 1: CAPTURA Y VERIFICACIÓN (PANTALLA PRINCIPAL) */}
        {activeTab === 'capture' && (
          <div className="space-y-6">
            {/* Sección Superior: Cámara / Subida de Archivo */}
            <CameraCapture
              cardType={selectedCardType}
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
            />

            {/* Sección Inferior: Lado a Lado (Visor de Cartón OpenCV + Formulario Humano) */}
            {capturedImage && extractedData && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Columna Izquierda: Visor del Cartoncillo Físico con Bounding Boxes Interactivas */}
                <div className="lg:col-span-6">
                  <CardInspector
                    cardType={selectedCardType}
                    imageUrl={capturedImage}
                    activeFieldKey={activeFieldKey}
                    onSelectField={(key) => setActiveFieldKey(key)}
                    confidences={confidences}
                  />
                </div>

                {/* Columna Derecha: Formulario de Revisión y Corrección Directa */}
                <div className="lg:col-span-6">
                  <VerificationForm
                    cardType={selectedCardType}
                    initialData={extractedData}
                    confidences={confidences}
                    activeFieldKey={activeFieldKey}
                    setActiveFieldKey={setActiveFieldKey}
                    onSaveToExcel={handleSaveToExcel}
                    onReset={handleResetCurrent}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: VISOR DE TABLA EXCEL (MICROSOFT GRAPH) */}
        {activeTab === 'excel' && (
          <ExcelTableViewer savedRecords={savedRecords} />
        )}

        {/* PESTAÑA 3: PLANTILLAS IMPRIMIBLES (HSK 63) */}
        {activeTab === 'print' && (
          <PrintableCardDesigner
            cardType={selectedCardType}
            setCardType={setSelectedCardType}
          />
        )}

        {/* PESTAÑA 4: CALIBRADOR VISUAL DE COORDENADAS */}
        {activeTab === 'calibrate' && (
          <CoordinateCalibrator />
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>
          Sistema de Digitalización de Cartoncillos HSK 63 • Volkswagen de México &copy; 2026.
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Arquitectura: Next.js + OpenCV + Azure Document Intelligence + OpenAI Structured Outputs + Supabase & Microsoft Graph.
        </p>
      </footer>
    </div>
  );
}
