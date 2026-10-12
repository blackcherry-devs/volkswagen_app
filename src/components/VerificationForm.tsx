'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  User,
  Wrench,
  Cpu,
  Hash,
  Clock,
  Layers,
  ChevronDown,
  FileText,
  ShieldCheck,
  AlertCircle,
  ScanLine,
} from 'lucide-react';
import {
  CardType,
  UnifiedRupturaData,
  OrangeCardData,
  GreenCardData,
  MOTIVOS_DESMONTAJE,
  SharedFieldKey,
  SHARED_FIELD_KEYS,
} from '@/types/card';
import { UnifiedRupturaSchema, suggestCorrections } from '@/lib/validation';

interface VerificationFormProps {
  formData: UnifiedRupturaData;
  setFormData: React.Dispatch<React.SetStateAction<UnifiedRupturaData>>;
  confidences?: Record<string, number>;
  activeFieldKey: string | null;
  setActiveFieldKey: (fieldKey: string | null) => void;
  onSaveToExcel: (data: UnifiedRupturaData) => void;
  onReset: () => void;
  hasOrangeScanned: boolean;
  hasGreenScanned: boolean;
  orangeRawData?: Partial<OrangeCardData>;
  greenRawData?: Partial<GreenCardData>;
  sharedMismatches: Record<string, boolean>;
  onSwitchScanCard?: (card: CardType) => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  formData,
  setFormData,
  confidences = {},
  activeFieldKey,
  setActiveFieldKey,
  onSaveToExcel,
  onReset,
  hasOrangeScanned,
  hasGreenScanned,
  orangeRawData,
  greenRawData,
  sharedMismatches,
  onSwitchScanCard,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  const bothCardsScanned = hasOrangeScanned && hasGreenScanned;

  // Validar en tiempo real con UnifiedRupturaSchema
  useEffect(() => {
    const result = UnifiedRupturaSchema.safeParse(formData);

    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          errMap[path] = issue.message;
        }
      });
      setValidationErrors(errMap);
    } else {
      setValidationErrors({});
    }
  }, [formData]);

  const handleChange = (key: keyof UnifiedRupturaData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsSaved(false);
  };

  const handleApplySuggestion = (key: keyof UnifiedRupturaData, suggestedValue: string) => {
    handleChange(key, suggestedValue);
  };

  const hasAnyMismatch = SHARED_FIELD_KEYS.some((k) => sharedMismatches[k] && !formData[k]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bothCardsScanned) {
      return;
    }

    const result = UnifiedRupturaSchema.safeParse(formData);
    if (result.success && !hasAnyMismatch) {
      setIsSaved(true);
      onSaveToExcel(formData);
    }
  };

  const isValid = Object.keys(validationErrors).length === 0 && !hasAnyMismatch && bothCardsScanned;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-full">
      {/* Encabezado del Formulario Único */}
      <div className="pb-4 border-b border-slate-800 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-base font-extrabold text-white">
              Formulario Único — RUPTURAS TOTAL (HSK 63)
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {isValid ? (
              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Válido para Excel</span>
              </span>
            ) : !bothCardsScanned ? (
              <span className="flex items-center space-x-1 text-amber-400 text-xs font-semibold bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Falta escanear 1 tarjeta</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-amber-400 text-xs font-semibold bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{Object.keys(validationErrors).length} campo(s) a verificar</span>
              </span>
            )}
          </div>
        </div>

        {/* Indicadores de Estado de Escaneo de Ambas Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          {/* Tarjeta Verde (Inicial) */}
          <div
            onClick={() => onSwitchScanCard && onSwitchScanCard('verde')}
            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
              hasGreenScanned
                ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasGreenScanned ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <div className="text-left">
                <p className="text-xs font-bold text-white">Tarjeta Verde (Inicial)</p>
                <p className="text-[10px] text-slate-400">Datos de puesta en marcha</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                hasGreenScanned
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasGreenScanned ? '✓ Escaneada' : 'Pendiente'}
            </span>
          </div>

          {/* Tarjeta Naranja (Desmontaje) */}
          <div
            onClick={() => onSwitchScanCard && onSwitchScanCard('naranja')}
            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
              hasOrangeScanned
                ? 'bg-orange-950/40 border-orange-700/80 text-orange-200'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-orange-500/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasOrangeScanned ? 'bg-orange-400' : 'bg-slate-600'}`} />
              <div className="text-left">
                <p className="text-xs font-bold text-white">Tarjeta Naranja (Desmontaje)</p>
                <p className="text-[10px] text-slate-400">Datos de retiro y causa</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                hasOrangeScanned
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasOrangeScanned ? '✓ Escaneada' : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Mensaje de Ayuda si falta alguna tarjeta */}
        {!bothCardsScanned && (
          <div className="mt-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/50 p-2 rounded-lg flex items-center space-x-2">
            <ScanLine className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Es necesario escanear ambas tarjetas para validar los 5 campos compartidos (CC, Operación, No. Herramienta, Máquina y Husillo). Puedes escanear en cualquier orden.
            </span>
          </div>
        )}
      </div>

      {/* Formulario Dinámico */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto pr-1">
        
        {/* =========================================================================
            SECCIÓN 1: CAMPOS COMPARTIDOS (COTEJO Y VALIDACIÓN ENTRE AMBAS TARJETAS)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
                Campos Compartidos (Verificación Cruzada de Ambas Tarjetas)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              5 campos requeridos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Centro de Costos (C.C.) */}
            {renderSharedField(
              'centroCostos',
              '1) Centro de Costos (C.C.)',
              <Hash className="w-3.5 h-3.5 text-blue-400" />,
              formData.centroCostos,
              sharedMismatches.centroCostos,
              orangeRawData?.centroCostos,
              greenRawData?.centroCostos,
              validationErrors.centroCostos,
              confidences.centroCostos,
              activeFieldKey === 'centroCostos',
              (val) => handleChange('centroCostos', val),
              () => setActiveFieldKey('centroCostos'),
              4,
              'Ej: 4120',
              bothCardsScanned
            )}

            {/* 2. Operación */}
            {renderSharedField(
              'operacion',
              '2) Operación / AF',
              <Layers className="w-3.5 h-3.5 text-indigo-400" />,
              formData.operacion,
              sharedMismatches.operacion,
              orangeRawData?.operacion,
              greenRawData?.operacion,
              validationErrors.operacion,
              confidences.operacion,
              activeFieldKey === 'operacion',
              (val) => handleChange('operacion', val),
              () => setActiveFieldKey('operacion'),
              undefined,
              'Ej: OP-20 FRESADO CARA',
              bothCardsScanned
            )}

            {/* 3. Número de Herramienta */}
            {renderSharedField(
              'numeroHerramienta',
              '3) No. Herramienta / Broca',
              <Wrench className="w-3.5 h-3.5 text-amber-400" />,
              formData.numeroHerramienta,
              sharedMismatches.numeroHerramienta,
              orangeRawData?.numeroHerramienta,
              greenRawData?.numeroHerramienta,
              validationErrors.numeroHerramienta,
              confidences.numeroHerramienta,
              activeFieldKey === 'numeroHerramienta',
              (val) => handleChange('numeroHerramienta', val),
              () => setActiveFieldKey('numeroHerramienta'),
              undefined,
              'Ej: T-10452 o T10452',
              bothCardsScanned
            )}

            {/* 4. Máquina (1 al 10) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                sharedMismatches.maquina
                  ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500 shadow-md'
                  : activeFieldKey === 'maquina'
                  ? 'border-blue-400 bg-slate-800/90 shadow-md ring-1 ring-blue-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>4) Máquina (1 al 10)</span>
                </label>
                {bothCardsScanned && !sharedMismatches.maquina && formData.maquina ? (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    Coincide ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    {confidences.maquina ?? 99}% conf.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={formData.maquina}
                  onFocus={() => setActiveFieldKey('maquina')}
                  onChange={(e) => handleChange('maquina', e.target.value)}
                  className={`w-16 bg-slate-900 border text-white font-mono text-sm px-2.5 py-1.5 rounded-lg focus:outline-none ${
                    sharedMismatches.maquina
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                  placeholder="1-10"
                />
                <div className="flex flex-wrap gap-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleChange('maquina', m)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                        formData.maquina === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {sharedMismatches.maquina && (
                <div className="mt-2 text-[11px] text-red-300 bg-red-950/60 border border-red-800/80 p-2 rounded-lg space-y-1">
                  <p className="font-bold flex items-center space-x-1 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>No coincide la información entre ambas tarjetas. Por favor verifícala y captúrala correctamente.</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-300">
                    Naranja: &ldquo;{orangeRawData?.maquina || '—'}&rdquo; | Verde: &ldquo;{greenRawData?.maquina || '—'}&rdquo;
                  </p>
                </div>
              )}
              {validationErrors.maquina && !sharedMismatches.maquina && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.maquina}</p>
              )}
            </div>

            {/* 5. Husillo (1 al 4) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                sharedMismatches.husillo
                  ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500 shadow-md'
                  : activeFieldKey === 'husillo'
                  ? 'border-blue-400 bg-slate-800/90 shadow-md ring-1 ring-blue-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>5) Husillo (1 al 4)</span>
                </label>
                {bothCardsScanned && !sharedMismatches.husillo && formData.husillo ? (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    Coincide ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    {confidences.husillo ?? 97}% conf.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={formData.husillo}
                  onFocus={() => setActiveFieldKey('husillo')}
                  onChange={(e) => handleChange('husillo', e.target.value)}
                  className={`w-14 bg-slate-900 border text-white font-mono text-sm px-2.5 py-1.5 rounded-lg focus:outline-none ${
                    sharedMismatches.husillo
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-purple-500'
                  }`}
                  placeholder="1-4"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['1', '2', '3', '4'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleChange('husillo', h)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        formData.husillo === h
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      H-{h}
                    </button>
                  ))}
                </div>
              </div>

              {sharedMismatches.husillo && (
                <div className="mt-2 text-[11px] text-red-300 bg-red-950/60 border border-red-800/80 p-2 rounded-lg space-y-1">
                  <p className="font-bold flex items-center space-x-1 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>No coincide la información entre ambas tarjetas. Por favor verifícala y captúrala correctamente.</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-300">
                    Naranja: &ldquo;{orangeRawData?.husillo || '—'}&rdquo; | Verde: &ldquo;{greenRawData?.husillo || '—'}&rdquo;
                  </p>
                </div>
              )}
              {validationErrors.husillo && !sharedMismatches.husillo && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.husillo}</p>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECCIÓN 2: CAMPOS ÚNICOS TARJETA VERDE (INICIAL) — TEMA VERDE ESMERALDA
           ========================================================================= */}
        <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/15 space-y-3.5">
          <div className="flex items-center justify-between border-b border-emerald-800/50 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                Datos de Tarjeta Verde — Inicial
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-700/50">
              Puesta en marcha
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nombre de operador inicial (tarjeta verde) */}
            <div
              className={`p-3 rounded-xl border transition-all sm:col-span-2 ${
                activeFieldKey === 'nombreOperadorInicial'
                  ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-emerald-200 flex items-center space-x-1 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nombre de operador inicial (tarjeta verde)</span>
              </label>
              <input
                type="text"
                value={formData.nombreOperadorInicial}
                onFocus={() => setActiveFieldKey('nombreOperadorInicial')}
                onChange={(e) => handleChange('nombreOperadorInicial', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Nombre del operario que montó la herramienta"
              />
              {validationErrors.nombreOperadorInicial && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.nombreOperadorInicial}</p>
              )}
            </div>

            {/* Turno inicial (tarjeta verde) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeFieldKey === 'turnoInicial'
                  ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-emerald-200 flex items-center space-x-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Turno inicial (tarjeta verde)</span>
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={formData.turnoInicial}
                  onFocus={() => setActiveFieldKey('turnoInicial')}
                  onChange={(e) => handleChange('turnoInicial', e.target.value)}
                  className="w-12 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="1-3"
                />
                {['1', '2', '3'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleChange('turnoInicial', t)}
                    className={`px-2 py-1 rounded text-xs font-bold transition ${
                      formData.turnoInicial === t
                        ? 'bg-emerald-600 text-white shadow font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    T-{t}
                  </button>
                ))}
              </div>
              {validationErrors.turnoInicial && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.turnoInicial}</p>
              )}
            </div>

            {/* Fecha inicial (tarjeta verde) */}
            <div
              className={`p-3 rounded-xl border transition-all sm:col-span-2 ${
                activeFieldKey === 'fechaInicial'
                  ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-emerald-200 flex items-center space-x-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fecha inicial (tarjeta verde)</span>
              </label>
              <input
                type="text"
                value={formData.fechaInicial}
                onFocus={() => setActiveFieldKey('fechaInicial')}
                onChange={(e) => handleChange('fechaInicial', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="YYYY-MM-DD o DD/MM/AAAA"
              />
              {validationErrors.fechaInicial && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.fechaInicial}</p>
              )}
            </div>

            {/* Tiempo de vida útil inicial (tarjeta verde) - si aplica */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeFieldKey === 'tiempoVidaUtilInicial'
                  ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-emerald-200 flex items-center space-x-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vida útil inicial (tarjeta verde)</span>
              </label>
              <input
                type="text"
                value={formData.tiempoVidaUtilInicial || ''}
                onFocus={() => setActiveFieldKey('tiempoVidaUtilInicial')}
                onChange={(e) => handleChange('tiempoVidaUtilInicial', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Ej: 2800 pzs"
              />
            </div>
          </div>

          {/* Observaciones inicial (tarjeta verde) */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'observacionesInicial'
                ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <label className="text-xs font-bold text-emerald-200 flex items-center space-x-1 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Observaciones inicial (tarjeta verde)</span>
            </label>
            <textarea
              rows={2}
              value={formData.observacionesInicial || ''}
              onFocus={() => setActiveFieldKey('observacionesInicial')}
              onChange={(e) => handleChange('observacionesInicial', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-500"
              placeholder="Notas manuscritas de puesta en marcha o calidad..."
            />
          </div>
        </div>

        {/* =========================================================================
            SECCIÓN 3: CAMPOS ÚNICOS TARJETA NARANJA (DESMONTAJE) — TEMA NARANJA / ÁMBAR
           ========================================================================= */}
        <div className="p-4 rounded-xl border border-orange-800/60 bg-orange-950/15 space-y-3.5">
          <div className="flex items-center justify-between border-b border-orange-800/50 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">
                Datos de Tarjeta Naranja — Desmontaje
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-orange-300 bg-orange-900/40 px-2 py-0.5 rounded border border-orange-700/50">
              Retiro de herramienta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nombre de operador desmontaje (tarjeta naranja) */}
            <div
              className={`p-3 rounded-xl border transition-all sm:col-span-2 ${
                activeFieldKey === 'nombreOperadorDesmontaje'
                  ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-orange-200 flex items-center space-x-1 mb-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Nombre de operador desmontaje (tarjeta naranja)</span>
              </label>
              <input
                type="text"
                value={formData.nombreOperadorDesmontaje}
                onFocus={() => setActiveFieldKey('nombreOperadorDesmontaje')}
                onChange={(e) => handleChange('nombreOperadorDesmontaje', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder="Nombre del operario que desmontó la herramienta"
              />
              {validationErrors.nombreOperadorDesmontaje && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.nombreOperadorDesmontaje}</p>
              )}
            </div>

            {/* Turno desmontaje (tarjeta naranja) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeFieldKey === 'turnoDesmontaje'
                  ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-orange-200 flex items-center space-x-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Turno desmontaje (tarjeta naranja)</span>
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={formData.turnoDesmontaje}
                  onFocus={() => setActiveFieldKey('turnoDesmontaje')}
                  onChange={(e) => handleChange('turnoDesmontaje', e.target.value)}
                  className="w-12 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="1-3"
                />
                {['1', '2', '3'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleChange('turnoDesmontaje', t)}
                    className={`px-2 py-1 rounded text-xs font-bold transition ${
                      formData.turnoDesmontaje === t
                        ? 'bg-orange-500 text-slate-950 shadow font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    T-{t}
                  </button>
                ))}
              </div>
              {validationErrors.turnoDesmontaje && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.turnoDesmontaje}</p>
              )}
            </div>

            {/* Fecha desmontaje (tarjeta naranja) */}
            <div
              className={`p-3 rounded-xl border transition-all sm:col-span-2 ${
                activeFieldKey === 'fechaDesmontaje'
                  ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-orange-200 flex items-center space-x-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Fecha desmontaje (tarjeta naranja)</span>
              </label>
              <input
                type="text"
                value={formData.fechaDesmontaje}
                onFocus={() => setActiveFieldKey('fechaDesmontaje')}
                onChange={(e) => handleChange('fechaDesmontaje', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder="YYYY-MM-DD o DD/MM/AAAA"
              />
              {validationErrors.fechaDesmontaje && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.fechaDesmontaje}</p>
              )}
            </div>

            {/* Tiempo de vida útil desmontaje (tarjeta naranja) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeFieldKey === 'tiempoVidaUtilDesmontaje'
                  ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <label className="text-xs font-bold text-orange-200 flex items-center space-x-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Vida útil desmontaje (tarjeta naranja)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={7}
                  value={formData.tiempoVidaUtilDesmontaje}
                  onFocus={() => setActiveFieldKey('tiempoVidaUtilDesmontaje')}
                  onChange={(e) => handleChange('tiempoVidaUtilDesmontaje', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 pr-14"
                  placeholder="Ej: 1450"
                />
                <span className="absolute right-2.5 top-2.5 text-[11px] text-slate-400 font-mono">
                  pzs
                </span>
              </div>
              {validationErrors.tiempoVidaUtilDesmontaje && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.tiempoVidaUtilDesmontaje}</p>
              )}
            </div>
          </div>

          {/* Motivo de desmontaje (tarjeta naranja) con 12 casillas */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              activeFieldKey === 'motivoDesmontaje'
                ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-orange-200 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-orange-400" />
                <span>Motivo de desmontaje (tarjeta naranja)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                12 casillas oficiales
              </span>
            </div>

            {/* Selector de opciones oficiales de planta */}
            <div className="mb-2">
              <div className="relative">
                <select
                  value={
                    MOTIVOS_DESMONTAJE.includes(formData.motivoDesmontaje as any)
                      ? formData.motivoDesmontaje
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange('motivoDesmontaje', e.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 font-semibold appearance-none pr-8 cursor-pointer"
                >
                  <option value="">-- Elige un motivo oficial o escribe abajo --</option>
                  {MOTIVOS_DESMONTAJE.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Chips rápidos de motivos más frecuentes */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                'Rotura',
                'Despostilladura',
                'Formación de rebaba',
                'Fallo de máquina',
                'Rugosidad alta',
                'Diámetro grande',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChange('motivoDesmontaje', chip)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                    formData.motivoDesmontaje === chip
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-orange-500/60'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Entrada editable directa */}
            <input
              type="text"
              value={formData.motivoDesmontaje}
              onFocus={() => setActiveFieldKey('motivoDesmontaje')}
              onChange={(e) => handleChange('motivoDesmontaje', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
              placeholder="Motivo de desmontaje detectado..."
            />
            {validationErrors.motivoDesmontaje && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.motivoDesmontaje}</p>
            )}
          </div>

          {/* Observaciones desmontaje (tarjeta naranja) */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'observacionesDesmontaje'
                ? 'border-orange-400 bg-slate-800/90 shadow-md ring-1 ring-orange-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <label className="text-xs font-bold text-orange-200 flex items-center space-x-1 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span>Observaciones desmontaje (tarjeta naranja)</span>
            </label>
            <textarea
              rows={2}
              value={formData.observacionesDesmontaje || ''}
              onFocus={() => setActiveFieldKey('observacionesDesmontaje')}
              onChange={(e) => handleChange('observacionesDesmontaje', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 font-mono placeholder:text-slate-500"
              placeholder="Detalle o descripción de desgaste/falla al desmontar..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer</span>
          </button>

          <button
            type="submit"
            disabled={!isValid || isSaved}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
              isValid
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-blue-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {isSaved
                ? '¡Guardado en RUPTURAS TOTAL!'
                : !bothCardsScanned
                ? 'Escanea ambas tarjetas para guardar'
                : hasAnyMismatch
                ? 'Corrige campos que no coinciden'
                : 'Confirmar y Guardar en RUPTURAS TOTAL'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Función auxiliar para renderizar campos compartidos con soporte de discrepancia (mismatch en rojo)
function renderSharedField(
  key: SharedFieldKey,
  label: string,
  icon: React.ReactNode,
  value: string,
  isMismatch: boolean | undefined,
  orangeVal: string | undefined,
  greenVal: string | undefined,
  error: string | undefined,
  confidence: number | undefined,
  isActive: boolean,
  onChange: (val: string) => void,
  onFocus: () => void,
  maxLength?: number,
  placeholder?: string,
  bothScanned: boolean = false
) {
  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isMismatch
          ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500 shadow-md'
          : isActive
          ? 'border-blue-400 bg-slate-800/90 shadow-md ring-1 ring-blue-400'
          : 'border-slate-800 bg-slate-950/60'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <label
          className={`text-xs font-bold flex items-center space-x-1 ${
            isMismatch ? 'text-red-300' : 'text-slate-200'
          }`}
        >
          {icon}
          <span>{label}</span>
        </label>
        {bothScanned && !isMismatch && value ? (
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
            Coincide ✓
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">
            {confidence ?? 98}% conf.
          </span>
        )}
      </div>

      <input
        type="text"
        maxLength={maxLength}
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-900 border text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none ${
          isMismatch
            ? 'border-red-500 focus:border-red-400 placeholder:text-red-400/60'
            : 'border-slate-700 focus:border-blue-500'
        }`}
        placeholder={placeholder}
      />

      {/* Alerta de discrepancia solicitada por el usuario */}
      {isMismatch && (
        <div className="mt-2 text-[11px] text-red-300 bg-red-950/60 border border-red-800/80 p-2 rounded-lg space-y-1">
          <p className="font-bold flex items-center space-x-1 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>No coincide la información entre ambas tarjetas. Por favor verifícala y captúrala correctamente.</span>
          </p>
          <p className="text-[10px] font-mono text-slate-300">
            Naranja: &ldquo;{orangeVal || '—'}&rdquo; | Verde: &ldquo;{greenVal || '—'}&rdquo;
          </p>
        </div>
      )}

      {/* Sugerencias o errores normales si no hay mismatch */}
      {error && !isMismatch && (
        <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {suggestCorrections(key, value) && (
        <button
          type="button"
          onClick={() => {
            const sug = suggestCorrections(key, value);
            if (sug) {
              if (key === 'centroCostos' && !value.startsWith('4')) {
                onChange(`4${value.slice(1)}`);
              }
            }
          }}
          className="mt-1 text-[11px] text-amber-300 hover:text-amber-200 flex items-center space-x-1 underline"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{suggestCorrections(key, value)}</span>
        </button>
      )}
    </div>
  );
}
