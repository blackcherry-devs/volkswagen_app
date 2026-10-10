'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2, Clock, Cloud, Table, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SavedRecord, OrangeCardData, GreenCardData } from '@/types/card';

interface ExcelTableViewerProps {
  savedRecords: SavedRecord[];
}

export const ExcelTableViewer: React.FC<ExcelTableViewerProps> = ({ savedRecords }) => {
  const [activeSheet, setActiveSheet] = useState<'naranja' | 'verde'>('naranja');

  const orangeRecords = savedRecords.filter((r) => r.cardType === 'naranja');
  const greenRecords = savedRecords.filter((r) => r.cardType === 'verde');

  const currentRecords = activeSheet === 'naranja' ? orangeRecords : greenRecords;

  // Descarga del archivo Excel real (.xlsx) con SheetJS
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Desmontajes Naranja
    const orangeDataForSheet = orangeRecords.map((r, idx) => {
      const d = r.data as OrangeCardData;
      return {
        'Fila Excel': idx + 1,
        'ID Registro': r.id,
        'Fecha Captura': r.verifiedAt,
        'Centro de Costos (CC)': d.centroCostos,
        'Operación': d.operacion,
        'No. Herramienta': d.numeroHerramienta,
        'Máquina': d.maquina,
        'Husillo': d.husillo,
        'Vida Útil Lograda': d.tiempoVidaUtil,
        'Fecha': d.fecha,
        'Turno': d.turno,
        'Nombre Operador': d.nombre,
        'Motivo de Desmontaje / Observaciones': d.motivoDesmontaje,
        'Estado Graph API': 'SINCRONIZADO',
      };
    });
    const wsOrange = XLSX.utils.json_to_sheet(orangeDataForSheet);
    XLSX.utils.book_append_sheet(wb, wsOrange, 'Desmontajes_Naranja');

    // Hoja 2: Herramientas Verde
    const greenDataForSheet = greenRecords.map((r, idx) => {
      const d = r.data as GreenCardData;
      return {
        'Fila Excel': idx + 1,
        'ID Registro': r.id,
        'Fecha Captura': r.verifiedAt,
        'Centro de Costos': d.centroCostos,
        'Operación': d.operacion,
        'No. Herramienta': d.numeroHerramienta,
        'Máquina': d.maquina,
        'Husillo': d.husillo,
        'Tiempo Vida Útil': d.tiempoVidaUtil,
        'Fecha': d.fecha,
        'Nombre Operador': d.nombre,
        'Turno': d.turno,
        'Estado Graph API': 'SINCRONIZADO',
      };
    });
    const wsGreen = XLSX.utils.json_to_sheet(greenDataForSheet);
    XLSX.utils.book_append_sheet(wb, wsGreen, 'Herramientas_Verde');

    // Descargar archivo binario
    XLSX.writeFile(wb, `VW_HSK63_Control_Herramientas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      {/* Encabezado y Selector de Hojas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Libro Excel — Conexión Microsoft Graph (SharePoint / OneDrive)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Destino final: Cada cartoncillo validado inserta una nueva fila en el Excel corporativo sin bloquearse si hay intermitencia.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Selector de Hoja de Cálculo */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSheet('naranja')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSheet === 'naranja'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              <span>Hoja: Desmontajes_Naranja</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                {orangeRecords.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSheet('verde')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSheet === 'verde'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span>Hoja: Herramientas_Verde</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                {greenRecords.length}
              </span>
            </button>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .XLSX</span>
          </button>
        </div>
      </div>

      {/* Alerta de Resiliencia / Microsoft Graph */}
      <div className="mb-4 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl flex items-center justify-between text-xs text-blue-200">
        <div className="flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            <strong>Integración Resiliente:</strong> Los registros se guardan primero en Supabase (PostgreSQL) y luego se sincronizan con Microsoft Graph API. Si Graph no responde, el registro se reintenta automáticamente.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center space-x-1 text-emerald-400 font-mono text-[11px] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>En línea</span>
        </span>
      </div>

      {/* Tabla estilo Excel */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 border-b border-slate-800 font-mono uppercase text-[11px] text-slate-400">
            <tr>
              <th className="px-3 py-2.5">Fila</th>
              <th className="px-3 py-2.5">Fecha</th>
              <th className="px-3 py-2.5">Turno</th>
              <th className="px-3 py-2.5">CC</th>
              <th className="px-3 py-2.5">No. Herramienta</th>
              <th className="px-3 py-2.5">Operación</th>
              <th className="px-3 py-2.5">Máquina</th>
              <th className="px-3 py-2.5">Husillo</th>
              <th className="px-3 py-2.5">Vida Útil</th>
              <th className="px-3 py-2.5">Nombre</th>
              {activeSheet === 'naranja' && (
                <th className="px-3 py-2.5">Motivo Desmontaje</th>
              )}
              <th className="px-3 py-2.5">Observaciones</th>
              <th className="px-3 py-2.5">Estado Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-sans">
            {currentRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={activeSheet === 'naranja' ? 13 : 12}
                  className="px-4 py-8 text-center text-slate-500 italic"
                >
                  No hay filas guardadas en esta hoja todavía. Escanea o carga un cartón y pulsa &ldquo;Confirmar y Guardar&rdquo;.
                </td>
              </tr>
            ) : (
              currentRecords.map((record, index) => {
                const isOrg = record.cardType === 'naranja';
                const d = record.data;
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-900/60 transition group font-mono text-[11px]"
                  >
                    <td className="px-3 py-2 text-slate-500 font-bold">{index + 1}</td>
                    <td className="px-3 py-2 text-slate-300">{d.fecha}</td>
                    <td className="px-3 py-2 font-bold text-amber-400">T-{d.turno}</td>
                    <td className="px-3 py-2 text-blue-400 font-bold">{d.centroCostos}</td>
                    <td className="px-3 py-2 font-bold text-white">{d.numeroHerramienta}</td>
                    <td className="px-3 py-2 text-slate-300 font-sans">{d.operacion}</td>
                    <td className="px-3 py-2 text-cyan-300">M-{d.maquina}</td>
                    <td className="px-3 py-2 text-purple-300">H-{d.husillo}</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">
                      {d.tiempoVidaUtil}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-sans">{d.nombre}</td>
                    {isOrg && (
                      <td className="px-3 py-2 text-slate-400 font-sans max-w-xs truncate" title={(d as OrangeCardData).motivoDesmontaje}>
                        {(d as OrangeCardData).motivoDesmontaje}
                      </td>
                    )}
                    <td className="px-3 py-2 text-slate-400 font-sans max-w-xs truncate" title={d.observaciones || '—'}>
                      {d.observaciones || '—'}
                    </td>
                    <td className="px-3 py-2">
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
