'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Save,
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
} from 'lucide-react';
import {
  CardType,
  OrangeCardData,
  GreenCardData,
  AnyCardData,
  MOTIVOS_DESMONTAJE,
} from '@/types/card';
import { OrangeCardSchema, GreenCardSchema, suggestCorrections } from '@/lib/validation';

interface VerificationFormProps {
  cardType: CardType;
  initialData: AnyCardData;
  confidences?: Record<string, number>;
  activeFieldKey: string | null;
  setActiveFieldKey: (fieldKey: string | null) => void;
  onSaveToExcel: (data: AnyCardData) => void;
  onReset: () => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  cardType,
  initialData,
  confidences = {},
  activeFieldKey,
  setActiveFieldKey,
  onSaveToExcel,
  onReset,
}) => {
  const [formData, setFormData] = useState<AnyCardData>(initialData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Sincronizar datos si initialData cambia
  useEffect(() => {
    setFormData(initialData);
    setIsSaved(false);
  }, [initialData]);

  // Validar en tiempo real con Zod
  useEffect(() => {
    const schema = cardType === 'naranja' ? OrangeCardSchema : GreenCardSchema;
    const result = schema.safeParse(formData);

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
  }, [formData, cardType]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplySuggestion = (key: string, suggestedValue: string) => {
    handleChange(key, suggestedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = cardType === 'naranja' ? OrangeCardSchema : GreenCardSchema;
    const result = schema.safeParse(formData);

    if (result.success) {
      setIsSaved(true);
      onSaveToExcel(formData);
    }
  };

  const isOrange = cardType === 'naranja';
  const isValid = Object.keys(validationErrors).length === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full">
      {/* Encabezado del Formulario */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOrange ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
            />
            <h2 className="text-base font-bold text-white">
              Formulario de Revisión — {isOrange ? 'Tarjeta Naranja HSK 63 (10 Campos)' : 'Tarjeta Verde HSK 63 (9 Campos)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Información extraída automáticamente por OCR. Corrige cualquier campo erróneo antes de guardar.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isValid ? (
            <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Válido</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-amber-400 text-xs font-semibold bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{Object.keys(validationErrors).length} campo(s) a revisar</span>
            </span>
          )}
        </div>
      </div>

      {/* Formulario con campos dinámicos */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Centro de Costos */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'centroCostos'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span>1) Centro de Costos (C.C.)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.centroCostos ?? 98}% conf.
              </span>
            </div>
            <input
              type="text"
              maxLength={4}
              value={formData.centroCostos}
              onFocus={() => setActiveFieldKey('centroCostos')}
              onChange={(e) => handleChange('centroCostos', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Ej: 4120"
            />
            {validationErrors.centroCostos && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{validationErrors.centroCostos}</span>
              </p>
            )}
            {suggestCorrections('centroCostos', formData.centroCostos) && (
              <button
                type="button"
                onClick={() =>
                  handleApplySuggestion(
                    'centroCostos',
                    formData.centroCostos.startsWith('4')
                      ? formData.centroCostos
                      : `4${formData.centroCostos.slice(1)}`
                  )
                }
                className="mt-1 text-[11px] text-amber-300 hover:text-amber-200 flex items-center space-x-1 underline"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{suggestCorrections('centroCostos', formData.centroCostos)}</span>
              </button>
            )}
          </div>

          {/* 2. Operación */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'operacion'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>2) Operación / AF</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.operacion ?? 92}% conf.
              </span>
            </div>
            <input
              type="text"
              value={formData.operacion}
              onFocus={() => setActiveFieldKey('operacion')}
              onChange={(e) => handleChange('operacion', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Ej: OP-20 FRESADO CARA"
            />
            {validationErrors.operacion && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.operacion}</p>
            )}
          </div>

          {/* 3. Número de Herramienta */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'numeroHerramienta'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>3) No. Herramienta / No. Broca</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.numeroHerramienta ?? 96}% conf.
              </span>
            </div>
            <input
              type="text"
              value={formData.numeroHerramienta}
              onFocus={() => setActiveFieldKey('numeroHerramienta')}
              onChange={(e) => handleChange('numeroHerramienta', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Ej: T-10452 o T10452"
            />
            {validationErrors.numeroHerramienta && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{validationErrors.numeroHerramienta}</span>
              </p>
            )}
          </div>

          {/* 4. Máquina / Estación */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'maquina'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>4) Máquina / Estación (1 al 10)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.maquina ?? 99}% conf.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={formData.maquina}
                onFocus={() => setActiveFieldKey('maquina')}
                onChange={(e) => handleChange('maquina', e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
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
            {validationErrors.maquina && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.maquina}</p>
            )}
          </div>

          {/* 5. Husillo / Spindel */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'husillo'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>5) Husillo / Spindel (1 al 4)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.husillo ?? 97}% conf.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={formData.husillo}
                onFocus={() => setActiveFieldKey('husillo')}
                onChange={(e) => handleChange('husillo', e.target.value)}
                className="w-14 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500"
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
            {validationErrors.husillo && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.husillo}</p>
            )}
          </div>

          {/* 6. Tiempo de Vida Útil Logrado */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'tiempoVidaUtil'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>6) Tiempo de Vida Útil Logrado</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.tiempoVidaUtil ?? 94}% conf.
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={7}
                value={formData.tiempoVidaUtil}
                onFocus={() => setActiveFieldKey('tiempoVidaUtil')}
                onChange={(e) => handleChange('tiempoVidaUtil', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 pr-16"
                placeholder="Ej: 1450"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                pzs / min
              </span>
            </div>
            {validationErrors.tiempoVidaUtil && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.tiempoVidaUtil}</p>
            )}
          </div>

          {/* 7. Fecha */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'fecha'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>7) Fecha</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.fecha ?? 99}% conf.
              </span>
            </div>
            <input
              type="text"
              value={formData.fecha}
              onFocus={() => setActiveFieldKey('fecha')}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="DD/MM/AAAA o YYYY-MM-DD"
            />
            {validationErrors.fecha && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.fecha}</p>
            )}
          </div>

          {/* Turno */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              activeFieldKey === 'turno'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isOrange ? '8) Turno (1-3)' : '9) Turno (1-3)'}</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {confidences.turno ?? 98}% conf.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={formData.turno}
                onFocus={() => setActiveFieldKey('turno')}
                onChange={(e) => handleChange('turno', e.target.value)}
                className="w-14 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="1-3"
              />
              <div className="flex flex-wrap gap-1.5">
                {['1', '2', '3'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleChange('turno', t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      formData.turno === t
                        ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    T-{t}
                  </button>
                ))}
              </div>
            </div>
            {validationErrors.turno && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.turno}</p>
            )}
          </div>
        </div>

        {/* Nombre del Operador */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            activeFieldKey === 'nombre'
              ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{isOrange ? '9) Nombre del Operador' : '8) Nombre'}</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {confidences.nombre ?? 91}% conf.
            </span>
          </div>
          <input
            type="text"
            value={formData.nombre}
            onFocus={() => setActiveFieldKey('nombre')}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Nombre y apellido del operador"
          />
          {validationErrors.nombre && (
            <p className="text-[11px] text-red-400 mt-1">{validationErrors.nombre}</p>
          )}
        </div>

        {/* 10) Motivo de Desmontaje / Observaciones con SELECTOR GUÍA DE 12 OPCIONES */}
        {isOrange && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              activeFieldKey === 'motivoDesmontaje'
                ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-orange-400" />
                <span>10) Motivo de Desmontaje (Casilla marcada)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {(confidences as any).motivoDesmontaje ?? 89}% conf.
              </span>
            </div>

            {/* Selector de opciones oficiales de planta */}
            <div className="mb-2">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Seleccionar motivo oficial predefinido:</span>
              </div>
              <div className="relative">
                <select
                  value={
                    MOTIVOS_DESMONTAJE.includes(
                      (formData as OrangeCardData).motivoDesmontaje as any
                    )
                      ? (formData as OrangeCardData).motivoDesmontaje
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange('motivoDesmontaje', e.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 font-semibold appearance-none pr-8 cursor-pointer"
                >
                  <option value="">-- Elige una opción o escribe abajo --</option>
                  {MOTIVOS_DESMONTAJE.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Chips rápidos de motivos más frecuentes para selección con 1 clic */}
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
                    (formData as OrangeCardData).motivoDesmontaje === chip
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-orange-500/60'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Área de texto manuscrita/editable para motivo detectado */}
            <input
              type="text"
              value={(formData as OrangeCardData).motivoDesmontaje || ''}
              onFocus={() => setActiveFieldKey('motivoDesmontaje')}
              onChange={(e) => handleChange('motivoDesmontaje', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
              placeholder="Motivo de desmontaje detectado..."
            />
            {validationErrors.motivoDesmontaje && (
              <p className="text-[11px] text-red-400 mt-1">
                {validationErrors.motivoDesmontaje}
              </p>
            )}
          </div>
        )}

        {/* CAMPO DE OBSERVACIONES MANUSCRITAS (DISPONIBLE PARA AMBOS: NARANJA Y VERDE) */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            activeFieldKey === 'observaciones'
              ? 'border-amber-400 bg-slate-800/90 shadow-md ring-1 ring-amber-400'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <FileText className={`w-3.5 h-3.5 ${isOrange ? 'text-orange-400' : 'text-emerald-400'}`} />
              <span>
                {isOrange
                  ? 'Observaciones / Detalles de falla (Manuscrito)'
                  : 'Observaciones de producción / calidad (Manuscrito)'}
              </span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {confidences.observaciones ?? 93}% conf.
            </span>
          </div>

          <textarea
            rows={2}
            value={formData.observaciones || ''}
            onFocus={() => setActiveFieldKey('observaciones')}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-500"
            placeholder={
              isOrange
                ? 'Texto manuscrito extraído de observaciones o detalle de falla...'
                : 'Texto manuscrito extraído de observaciones de producción...'
            }
          />
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
                ? isOrange
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isSaved ? '¡Guardado con Éxito!' : 'Confirmar y Guardar en Excel'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
