'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Zap,
  AlertTriangle,
  ScanLine,
  RefreshCw,
  Sliders,
  Printer,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { CameraCapture } from '@/components/CameraCapture';
import { CardInspector } from '@/components/CardInspector';
import { VerificationForm } from '@/components/VerificationForm';
import { ExcelTableViewer } from '@/components/ExcelTableViewer';
import { PrintableCardDesigner } from '@/components/PrintableCardDesigner';
import { CoordinateCalibrator } from '@/components/CoordinateCalibrator';
import {
  CardType,
  SavedRecord,
  OrangeCardData,
  GreenCardData,
  UnifiedRupturaData,
  SHARED_FIELD_KEYS,
} from '@/types/card';
import {
  SAMPLE_ORANGE_DATA,
  SAMPLE_GREEN_DATA,
  SAMPLE_UNIFIED_DATA,
  generateMockCardSvg,
} from '@/lib/mockData';
import { compareSharedFields } from '@/lib/validation';
import { checkOllamaStatus, runOcrRecognition, OllamaStatus } from '@/lib/ocrService';
import { Terminal, Cpu, HelpCircle, X } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'capture' | 'excel' | 'print' | 'calibrate'>('capture');
  const [selectedCardType, setSelectedCardType] = useState<CardType>('naranja');

  // Estado de Ollama GLM-OCR
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isCheckingOllama, setIsCheckingOllama] = useState<boolean>(false);
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);

  // Estados de escaneo dual (ambas tarjetas)
  const [orangeScan, setOrangeScan] = useState<{
    imageUrl: string;
    data: OrangeCardData;
    confidences: Record<string, number>;
  } | null>(null);

  const [greenScan, setGreenScan] = useState<{
    imageUrl: string;
    data: GreenCardData;
    confidences: Record<string, number>;
  } | null>(null);

  // Formulario único
  const [formData, setFormData] = useState<UnifiedRupturaData>(SAMPLE_UNIFIED_DATA);
  const [sharedMismatches, setSharedMismatches] = useState<Record<string, boolean>>({});

  // Estados de procesamiento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Registros guardados en Excel (RUPTURAS TOTAL)
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([
    {
      id: 'VW-RUP-001',
      capturedAt: '2026-10-09T08:15:00.000Z',
      verifiedAt: '09/10/2026 08:16',
      naranjaImageUrl: generateMockCardSvg('naranja', SAMPLE_ORANGE_DATA),
      verdeImageUrl: generateMockCardSvg('verde', SAMPLE_GREEN_DATA),
      syncStatus: 'synced_excel',
      excelRowNumber: 1,
      data: SAMPLE_UNIFIED_DATA,
    },
  ]);

  // Cargar cartones de muestra iniciales para que el usuario pueda interactuar de inmediato
  useEffect(() => {
    const initialOrangeSvg = generateMockCardSvg('naranja', SAMPLE_ORANGE_DATA);
    const initialGreenSvg = generateMockCardSvg('verde', SAMPLE_GREEN_DATA);

    setOrangeScan({
      imageUrl: initialOrangeSvg,
      data: SAMPLE_ORANGE_DATA,
      confidences: {
        centroCostos: 98,
        operacion: 92,
        numeroHerramienta: 96,
        maquina: 99,
        husillo: 97,
        tiempoVidaUtil: 94,
        fecha: 99,
        turno: 98,
        nombre: 91,
        motivoDesmontaje: 99,
        observaciones: 93,
      },
    });

    setGreenScan({
      imageUrl: initialGreenSvg,
      data: SAMPLE_GREEN_DATA,
      confidences: {
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
      },
    });

    setFormData(SAMPLE_UNIFIED_DATA);
    setSharedMismatches({});

    // Comprobar estado de Ollama GLM-OCR al iniciar
    refreshOllamaStatus();
  }, []);

  const refreshOllamaStatus = async () => {
    setIsCheckingOllama(true);
    try {
      const status = await checkOllamaStatus();
      setOllamaStatus(status);
    } catch (err) {
      console.error('Error al comprobar Ollama:', err);
    } finally {
      setIsCheckingOllama(false);
    }
  };

  // Función para procesar y cotejar cuando una tarjeta es escaneada o subida con Ollama GLM-OCR
  const handleImageSelected = async (imageUri: string, autoTriggerExtract = true) => {
    if (autoTriggerExtract) {
      setIsProcessing(true);
      try {
        const { result, isRealOllama, statusMessage } = await runOcrRecognition(
          selectedCardType,
          imageUri,
          {
            onProgress: (step) => setProcessingStep(step),
          }
        );

        if (isRealOllama) {
          showNotification(
            '¡Reconocimiento completado con Ollama GLM-OCR local!',
            'success'
          );
        } else if (statusMessage) {
          showNotification(statusMessage, 'info');
        }

        if (selectedCardType === 'naranja') {
          const orangeExtracted = result.data as OrangeCardData;
          setOrangeScan({
            imageUrl: imageUri,
            data: orangeExtracted,
            confidences: result.confidences as Record<string, number>,
          });

          // Actualizar campos únicos de la tarjeta naranja
          setFormData((prev) => ({
            ...prev,
            fechaDesmontaje: orangeExtracted.fecha || prev.fechaDesmontaje,
            turnoDesmontaje: orangeExtracted.turno || prev.turnoDesmontaje,
            nombreOperadorDesmontaje: orangeExtracted.nombre || prev.nombreOperadorDesmontaje,
            tiempoVidaUtilDesmontaje: orangeExtracted.tiempoVidaUtil || prev.tiempoVidaUtilDesmontaje,
            motivoDesmontaje: orangeExtracted.motivoDesmontaje || prev.motivoDesmontaje,
            observacionesDesmontaje: orangeExtracted.observaciones || prev.observacionesDesmontaje,
          }));

          // Cotejar campos compartidos si la tarjeta verde ya fue escaneada
          if (greenScan) {
            runCrossValidation(orangeExtracted, greenScan.data);
          } else {
            showNotification(
              'Tarjeta Naranja procesada. Escanea ahora la Tarjeta Verde para cotejar los 5 campos compartidos.',
              'info'
            );
          }
        } else {
          // Tarjeta Verde
          const greenExtracted = result.data as GreenCardData;
          setGreenScan({
            imageUrl: imageUri,
            data: greenExtracted,
            confidences: result.confidences as Record<string, number>,
          });

          // Actualizar campos únicos de la tarjeta verde
          setFormData((prev) => ({
            ...prev,
            fechaInicial: greenExtracted.fecha || prev.fechaInicial,
            turnoInicial: greenExtracted.turno || prev.turnoInicial,
            nombreOperadorInicial: greenExtracted.nombre || prev.nombreOperadorInicial,
            tiempoVidaUtilInicial: greenExtracted.tiempoVidaUtil || prev.tiempoVidaUtilInicial,
            observacionesInicial: greenExtracted.observaciones || prev.observacionesInicial,
          }));

          // Cotejar campos compartidos si la tarjeta naranja ya fue escaneada
          if (orangeScan) {
            runCrossValidation(orangeScan.data, greenExtracted);
          } else {
            showNotification(
              'Tarjeta Verde procesada. Escanea ahora la Tarjeta Naranja para cotejar los 5 campos compartidos.',
              'info'
            );
          }
        }
      } catch (err) {
        console.error('Error durante la extracción:', err);
        showNotification('Error al procesar la imagen con OCR.', 'error');
      } finally {
        setIsProcessing(false);
        setProcessingStep('');
      }
    }
  };

  // Lógica principal de comparación cruzada de los 5 campos repetidos
  const runCrossValidation = (orangeData: OrangeCardData, greenData: GreenCardData) => {
    const { mismatches, matchedValues } = compareSharedFields(
      orangeData as any,
      greenData as any
    );

    setSharedMismatches(mismatches);

    // Actualizar campos en el formulario: si coinciden, se capturan; si no coinciden, NO se capturan (quedan vacíos)
    setFormData((prev) => {
      const updated = { ...prev };
      SHARED_FIELD_KEYS.forEach((key) => {
        if (mismatches[key]) {
          // REGLA: si no coinciden, NO captures esa información
          updated[key] = '';
        } else if (matchedValues[key]) {
          updated[key] = matchedValues[key];
        }
      });
      return updated;
    });

    const mismatchCount = Object.values(mismatches).filter(Boolean).length;
    if (mismatchCount > 0) {
      showNotification(
        `Se detectaron ${mismatchCount} campo(s) con discrepancia entre ambas tarjetas. Verifica y corrígelos en rojo.`,
        'error'
      );
    } else {
      showNotification(
        '¡Ambas tarjetas cotejadas con éxito! Los 5 campos compartidos coinciden.',
        'success'
      );
    }
  };

  // Botón para simular intencionalmente una discrepancia para pruebas del usuario
  const handleSimulateMismatchTest = () => {
    if (!orangeScan || !greenScan) return;

    // Crear discrepancia en Husillo y Centro de Costos
    const modifiedGreen: GreenCardData = {
      ...greenScan.data,
      centroCostos: '4999', // Discrepancia con 4120
      husillo: '4',         // Discrepancia con 2
    };

    setGreenScan({
      ...greenScan,
      data: modifiedGreen,
      imageUrl: generateMockCardSvg('verde', modifiedGreen),
    });

    runCrossValidation(orangeScan.data, modifiedGreen);
  };

  // Botón para restaurar coincidencia 100%
  const handleRestoreMatch = () => {
    const orangeSvg = generateMockCardSvg('naranja', SAMPLE_ORANGE_DATA);
    const greenSvg = generateMockCardSvg('verde', SAMPLE_GREEN_DATA);

    setOrangeScan({
      imageUrl: orangeSvg,
      data: SAMPLE_ORANGE_DATA,
      confidences: { centroCostos: 98, operacion: 92, numeroHerramienta: 96, maquina: 99, husillo: 97 },
    });

    setGreenScan({
      imageUrl: greenSvg,
      data: SAMPLE_GREEN_DATA,
      confidences: { centroCostos: 99, operacion: 94, numeroHerramienta: 97, maquina: 98, husillo: 96 },
    });

    setFormData(SAMPLE_UNIFIED_DATA);
    setSharedMismatches({});
    showNotification('Valores restaurados a coincidencia completa (100% cotejados).', 'success');
  };

  // Guardar datos validados en el libro Excel (Hoja RUPTURAS TOTAL)
  const handleSaveToExcel = (finalData: UnifiedRupturaData) => {
    const newRecord: SavedRecord = {
      id: `VW-RUP-${String(savedRecords.length + 1).padStart(3, '0')}`,
      capturedAt: new Date().toISOString(),
      verifiedAt: new Date().toLocaleString(),
      naranjaImageUrl: orangeScan?.imageUrl,
      verdeImageUrl: greenScan?.imageUrl,
      syncStatus: 'synced_excel',
      excelRowNumber: savedRecords.length + 1,
      data: finalData,
    };

    setSavedRecords((prev) => [newRecord, ...prev]);
    showNotification(
      '¡Registro guardado exitosamente en la hoja RUPTURAS TOTAL de Excel!',
      'success'
    );
  };

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null), 5000;
    }, 5000);
  };

  const handleResetCurrent = () => {
    handleRestoreMatch();
    setActiveFieldKey(null);
  };

  // Imagen activa a mostrar en el CardInspector según la tarjeta seleccionada
  const activeInspectorImage =
    selectedCardType === 'naranja'
      ? orangeScan?.imageUrl || generateMockCardSvg('naranja', SAMPLE_ORANGE_DATA)
      : greenScan?.imageUrl || generateMockCardSvg('verde', SAMPLE_GREEN_DATA);

  const activeConfidences =
    selectedCardType === 'naranja'
      ? orangeScan?.confidences || {}
      : greenScan?.confidences || {};

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
        <div
          className={`fixed top-20 right-4 z-50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce border ${
            notification.type === 'error'
              ? 'bg-red-600 border-red-400'
              : notification.type === 'info'
              ? 'bg-blue-600 border-blue-400'
              : 'bg-emerald-600 border-emerald-400'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-3 sm:space-y-6">
        {/* Banner Informativo del Flujo Dual RUPTURAS TOTAL */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                <span>Flujo Dual HSK 63 — Hoja RUPTURAS TOTAL</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  2 Cartones Requeridos
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Cotejo automático de los 5 campos compartidos (CC, Operación, No. Herramienta, Máquina y Husillo). Si no coinciden, se marcan en rojo para corrección obligatoria.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Estado e indicador interactivo de Ollama GLM-OCR */}
            <button
              onClick={() => setShowOllamaModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border shadow-sm ${
                ollamaStatus?.online && ollamaStatus?.modelAvailable
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/60'
                  : ollamaStatus?.online
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/80 hover:bg-amber-900/60'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
              title="Clic para ver configuración y estado de Ollama GLM-OCR"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>
                {ollamaStatus?.online && ollamaStatus?.modelAvailable
                  ? 'Ollama GLM-OCR: Conectado'
                  : ollamaStatus?.online
                  ? 'Ollama: Falta modelo glm-ocr'
                  : 'Ollama: Local'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus?.online && ollamaStatus?.modelAvailable
                    ? 'bg-emerald-400 animate-pulse'
                    : ollamaStatus?.online
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
            </button>

            {/* Botón para probar discrepancia / desajuste */}
            <button
              onClick={handleSimulateMismatchTest}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-800/80 transition flex items-center space-x-1.5"
              title="Simular discrepancia en Husillo y CC para verificar alerta roja"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Simular Discrepancia</span>
            </button>

            {/* Botón para restaurar coincidencia */}
            <button
              onClick={handleRestoreMatch}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center space-x-1.5"
              title="Restaurar a coincidencia 100%"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Restaurar Coincidencia</span>
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
              <span>RUPTURAS TOTAL ({savedRecords.length})</span>
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
              <h3 className="text-lg font-bold text-white">
                Procesando Tarjeta {selectedCardType === 'naranja' ? 'Naranja (Desmontaje)' : 'Verde (Inicial)'}
              </h3>
              <p className="text-xs text-blue-300 font-mono animate-pulse">
                {processingStep || 'Iniciando pipeline de visión computacional...'}
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-3/4 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 1: CAPTURA Y FORMULARIO ÚNICO */}
        {activeTab === 'capture' && (
          <div className="space-y-6">
            {/* Selector de Tarjeta a Escanear Actual */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ScanLine className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">
                  Tarjeta seleccionada para escanear en la cámara:
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedCardType('naranja')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    selectedCardType === 'naranja'
                      ? 'bg-orange-500 text-white shadow ring-2 ring-orange-400/50'
                      : 'bg-slate-800 text-slate-300 hover:text-orange-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>Tarjeta Naranja (Desmontaje)</span>
                  {orangeScan && <span className="text-[10px] bg-black/40 px-1 rounded">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCardType('verde')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    selectedCardType === 'verde'
                      ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/50'
                      : 'bg-slate-800 text-slate-300 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Tarjeta Verde (Inicial)</span>
                  {greenScan && <span className="text-[10px] bg-black/40 px-1 rounded">✓</span>}
                </button>
              </div>
            </div>

            {/* Componente de Captura de Cámara */}
            <CameraCapture
              cardType={selectedCardType}
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
            />

            {/* Lado a Lado: Visor OpenCV + Formulario Único */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Columna Izquierda: Visor del Cartón con Switcher Naranja/Verde */}
              <div className="lg:col-span-5">
                <CardInspector
                  cardType={selectedCardType}
                  imageUrl={activeInspectorImage}
                  activeFieldKey={activeFieldKey}
                  onSelectField={(key) => setActiveFieldKey(key)}
                  confidences={activeConfidences}
                  onSelectCardType={(t) => setSelectedCardType(t)}
                  hasOrangeImage={Boolean(orangeScan)}
                  hasGreenImage={Boolean(greenScan)}
                />
              </div>

              {/* Columna Derecha: Formulario Único con Cotejo de 5 Campos y Sindicación de Colores */}
              <div className="lg:col-span-7">
                <VerificationForm
                  formData={formData}
                  setFormData={setFormData}
                  confidences={activeConfidences}
                  activeFieldKey={activeFieldKey}
                  setActiveFieldKey={setActiveFieldKey}
                  onSaveToExcel={handleSaveToExcel}
                  onReset={handleResetCurrent}
                  hasOrangeScanned={Boolean(orangeScan)}
                  hasGreenScanned={Boolean(greenScan)}
                  orangeRawData={orangeScan?.data}
                  greenRawData={greenScan?.data}
                  sharedMismatches={sharedMismatches}
                  onSwitchScanCard={(card) => setSelectedCardType(card)}
                />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: VISOR DE TABLA EXCEL (RUPTURAS TOTAL) */}
        {activeTab === 'excel' && (
          <ExcelTableViewer savedRecords={savedRecords} />
        )}

        {/* PESTAÑA 3: PLANTILLAS IMPRIMIBLES */}
        {activeTab === 'print' && (
          <PrintableCardDesigner
            cardType={selectedCardType}
            setCardType={setSelectedCardType}
          />
        )}

        {/* PESTAÑA 4: CALIBRADOR VISUAL */}
        {activeTab === 'calibrate' && (
          <CoordinateCalibrator />
        )}

        {/* MODAL DE CONFIGURACIÓN Y ESTADO DE OLLAMA GLM-OCR */}
        {showOllamaModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
              <button
                onClick={() => setShowOllamaModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configuración de Ollama (GLM-OCR)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reconocimiento de texto impreso y manuscrito 100% en local sin enviar datos a la nube
                  </p>
                </div>
              </div>

              {/* Tarjeta de Estado Actual */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Servidor Ollama Local:</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                      ollamaStatus?.online
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    <span>{ollamaStatus?.online ? 'En Línea (127.0.0.1:11434)' : 'No Detectado'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Modelo GLM-OCR:</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      ollamaStatus?.modelAvailable
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {ollamaStatus?.modelAvailable ? 'Instalado ✓' : 'Falta descargar'}
                  </span>
                </div>

                {ollamaStatus?.models && ollamaStatus.models.length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-400">
                    <span>Modelos detectados en tu máquina: </span>
                    <span className="font-mono text-slate-300">{ollamaStatus.models.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Guía Rápida de Instalación en Mac */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pasos para Activar GLM-OCR en tu Terminal:</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-black/60 rounded-lg border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-sans mb-1">
                      1. Instalar Ollama (si no lo tienes instalado):
                    </p>
                    <code className="text-emerald-400 selection:bg-emerald-800">
                      curl -fsSL https://ollama.com/install.sh | sh
                    </code>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      O descarga la app desde: <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="text-blue-400 underline">ollama.com/download</a>
                    </p>
                  </div>

                  <div className="p-2.5 bg-black/60 rounded-lg border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-sans mb-1">
                      2. Descargar y ejecutar el modelo GLM-OCR (0.9B params, ~2.2 GB):
                    </p>
                    <code className="text-amber-300 selection:bg-amber-800">
                      ollama run glm-ocr
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={refreshOllamaStatus}
                  disabled={isCheckingOllama}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOllama ? 'animate-spin' : ''}`} />
                  <span>{isCheckingOllama ? 'Comprobando...' : 'Reintentar Conexión'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOllamaModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>
          Sistema de Digitalización de Cartoncillos HSK 63 • Volkswagen de México &copy; 2026.
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Hoja RUPTURAS TOTAL • Verificación cruzada OpenCV + Microsoft Graph API.
        </p>
      </footer>
    </div>
  );
}
