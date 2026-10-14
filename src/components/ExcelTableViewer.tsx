'use client';

import React from 'react';
import { Download, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SavedRecord, UnifiedRupturaData, getLineaFromCentroCostos } from '@/types/card';

interface ExcelTableViewerProps {
  savedRecords: SavedRecord[];
}

export const ExcelTableViewer: React.FC<ExcelTableViewerProps> = ({ savedRecords }) => {
  // Descarga del archivo Excel real (.xlsx) con SheetJS
  // REGLA: Generar UNA SOLA TABLA y UNA SOLA HOJA de nombre "RUPTURAS TOTAL"
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const dataForSheet = savedRecords.map((r, idx) => {
      const d = r.data;
      return {
        'Fila Excel': idx + 1,
        'ID Registro': r.id,
        'Fecha Captura': r.verifiedAt,
        'Línea de Producción': getLineaFromCentroCostos(d.centroCostos),
        'Centro de Costos (CC)': d.centroCostos,
        'Operación': d.operacion,
        'No. Herramienta': d.numeroHerramienta,
        'Máquina': d.maquina,
        'Husillo': d.husillo,
        // Columnas únicas de la Tarjeta Verde (Inicial)
        'Fecha Inicial (Verde)': d.fechaInicial,
        'Turno Inicial (Verde)': d.turnoInicial,
        'Operador Inicial (Verde)': d.nombreOperadorInicial,
        'Vida Útil Inicial (Verde)': d.tiempoVidaUtilInicial || '—',
        'Observaciones Inicial (Verde)': d.observacionesInicial || '—',
        // Columnas de la Tarjeta Naranja (Desmontaje)
        'Fecha Desmontaje (Naranja)': d.fechaDesmontaje,
        'Turno Desmontaje (Naranja)': d.turnoDesmontaje,
        'Operador Desmontaje (Naranja)': d.nombreOperadorDesmontaje,
        'Vida Útil Lograda (Naranja)': d.tiempoVidaUtilDesmontaje,
        'Motivo de Desmontaje (Naranja)': d.motivoDesmontaje,
        'Observaciones Desmontaje (Naranja)': d.observacionesDesmontaje || '—',
        'Estado': 'LOCAL ✓',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataForSheet);
    
    // Ancho de columnas optimizado
    ws['!cols'] = [
      { wch: 10 }, // Fila
      { wch: 14 }, // ID
      { wch: 18 }, // Fecha Captura
      { wch: 20 }, // Línea de Producción
      { wch: 16 }, // CC
      { wch: 22 }, // Operación
      { wch: 18 }, // No. Herramienta
      { wch: 10 }, // Máquina
      { wch: 10 }, // Husillo
      { wch: 18 }, // Fecha Inicial
      { wch: 16 }, // Turno Inicial
      { wch: 24 }, // Operador Inicial
      { wch: 18 }, // Vida Útil Inicial
      { wch: 30 }, // Observaciones Inicial
      { wch: 20 }, // Fecha Desmontaje
      { wch: 18 }, // Turno Desmontaje
      { wch: 24 }, // Operador Desmontaje
      { wch: 20 }, // Vida Útil Desmontaje
      { wch: 28 }, // Motivo Desmontaje
      { wch: 32 }, // Observaciones Desmontaje
      { wch: 18 }, // Estado Graph API
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'RUPTURAS TOTAL');

    // Descargar archivo binario
    XLSX.writeFile(wb, `VW_HSK63_RUPTURAS_TOTAL_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Encabezado y Botón de Descarga */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Libro Excel — Hoja Oficial: <span className="text-emerald-400 font-mono">RUPTURAS TOTAL</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tabla unificada con cotejo cruzado de cartoncillos (Verde Inicial + Naranja Desmontaje).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hoja única: <strong>RUPTURAS TOTAL</strong> ({savedRecords.length} filas)</span>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar RUPTURAS TOTAL (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Indicador local */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            <strong className="text-slate-200">Almacenamiento 100% Local:</strong> Los datos se guardan en sesión y se exportan como archivo <code className="text-emerald-400">.xlsx</code> directamente en tu equipo. Ningún dato sale de la planta.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center space-x-1 text-emerald-400 font-mono text-[11px] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local</span>
        </span>
      </div>

      {/* Tabla estilo Excel Unificada */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
        <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
          <thead className="bg-slate-900 border-b border-slate-800 font-mono uppercase text-[11px] text-slate-400">
            <tr>
              <th className="px-3 py-3 text-slate-500">Fila</th>
              <th className="px-3 py-3 text-blue-300">ID</th>
              <th className="px-3 py-3 text-amber-300 font-bold bg-amber-950/30 border-b-2 border-amber-500/50">Línea</th>
              <th className="px-3 py-3 text-blue-400 font-bold bg-blue-950/20">CC (Cotejado)</th>
              <th className="px-3 py-3 text-white font-bold bg-blue-950/20">No. Herramienta</th>
              <th className="px-3 py-3 text-slate-300 bg-blue-950/20">Operación</th>
              <th className="px-3 py-3 text-cyan-300 bg-blue-950/20">Máq.</th>
              <th className="px-3 py-3 text-purple-300 bg-blue-950/20">Hus.</th>
              {/* Columnas Tarjeta Verde */}
              <th className="px-3 py-3 text-emerald-400 bg-emerald-950/20">Fecha Inicial (Verde)</th>
              <th className="px-3 py-3 text-emerald-400 bg-emerald-950/20">Turno Inicial</th>
              <th className="px-3 py-3 text-emerald-300 bg-emerald-950/20">Operador Inicial (Verde)</th>
              <th className="px-3 py-3 text-emerald-400/80 bg-emerald-950/20">Obs. Inicial</th>
              {/* Columnas Tarjeta Naranja */}
              <th className="px-3 py-3 text-orange-400 bg-orange-950/20">Fecha Desmontaje (Naranja)</th>
              <th className="px-3 py-3 text-orange-400 bg-orange-950/20">Turno Desmontaje</th>
              <th className="px-3 py-3 text-orange-300 bg-orange-950/20">Operador Desmontaje (Naranja)</th>
              <th className="px-3 py-3 text-amber-300 bg-orange-950/20">Vida Útil (Pzs)</th>
              <th className="px-3 py-3 text-orange-300 bg-orange-950/20">Motivo Desmontaje</th>
              <th className="px-3 py-3 text-orange-400/80 bg-orange-950/20">Obs. Desmontaje</th>
              <th className="px-3 py-3 text-slate-400">Estado Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-sans">
            {savedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={19}
                  className="px-4 py-12 text-center text-slate-500 italic"
                >
                  No hay filas guardadas en RUPTURAS TOTAL todavía. Escanea ambas tarjetas (Naranja y Verde) y confirma el formulario.
                </td>
              </tr>
            ) : (
              savedRecords.map((record, index) => {
                const d = record.data;
                const linea = getLineaFromCentroCostos(d.centroCostos);
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-900/60 transition group font-mono text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-slate-500 font-bold">{index + 1}</td>
                    <td className="px-3 py-2.5 text-blue-400">{record.id}</td>
                    <td className="px-3 py-2.5 bg-amber-950/10 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                        {linea}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-blue-400 font-bold bg-blue-950/10">{d.centroCostos}</td>
                    <td className="px-3 py-2.5 font-bold text-white bg-blue-950/10">{d.numeroHerramienta}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-sans bg-blue-950/10">{d.operacion}</td>
                    <td className="px-3 py-2.5 text-cyan-300 bg-blue-950/10">M-{d.maquina}</td>
                    <td className="px-3 py-2.5 text-purple-300 bg-blue-950/10">H-{d.husillo}</td>
                    {/* Verde */}
                    <td className="px-3 py-2.5 text-emerald-300 bg-emerald-950/10">{d.fechaInicial}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-400 bg-emerald-950/10">T-{d.turnoInicial}</td>
                    <td className="px-3 py-2.5 text-slate-200 font-sans bg-emerald-950/10">{d.nombreOperadorInicial}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-sans max-w-[180px] truncate bg-emerald-950/10" title={d.observacionesInicial || ''}>
                      {d.observacionesInicial || '—'}
                    </td>
                    {/* Naranja */}
                    <td className="px-3 py-2.5 text-orange-300 bg-orange-950/10">{d.fechaDesmontaje}</td>
                    <td className="px-3 py-2.5 font-bold text-amber-400 bg-orange-950/10">T-{d.turnoDesmontaje}</td>
                    <td className="px-3 py-2.5 text-slate-200 font-sans bg-orange-950/10">{d.nombreOperadorDesmontaje}</td>
                    <td className="px-3 py-2.5 text-amber-300 font-bold bg-orange-950/10">{d.tiempoVidaUtilDesmontaje}</td>
                    <td className="px-3 py-2.5 text-orange-300 font-sans max-w-[180px] truncate bg-orange-950/10" title={d.motivoDesmontaje}>
                      {d.motivoDesmontaje}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 font-sans max-w-[180px] truncate bg-orange-950/10" title={d.observacionesDesmontaje || ''}>
                      {d.observacionesDesmontaje || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sincronizado</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
