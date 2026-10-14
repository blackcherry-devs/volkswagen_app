'use client';

import React, { useState } from 'react';
import { Printer, Scissors, Ruler, ShieldCheck } from 'lucide-react';
import { CardType, MOTIVOS_DESMONTAJE } from '@/types/card';

interface PrintableCardDesignerProps {
  cardType: CardType;
  setCardType: (type: CardType) => void;
}

export const PrintableCardDesigner: React.FC<PrintableCardDesignerProps> = ({
  cardType,
  setCardType,
}) => {
  const [showDimensions, setShowDimensions] = useState(true);
  const [showFiducials, setShowFiducials] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const isOrange = cardType === 'naranja';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl print:bg-white print:border-none print:p-0 print:shadow-none">
      {/* Estilos de impresión globales: fuera del #printable-card para HTML válido */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 8mm;
          }
          /* Ocultar SOLO los elementos de UI — NO el cartoncillo */
          header,
          footer,
          nav,
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          body {
            background: white !important;
          }
          /* Asegurar tamaños físicos exactos del cartoncillo */
          #printable-card {
            width: 80mm !important;
            height: 190mm !important;
            min-width: 80mm !important;
            max-width: 80mm !important;
            min-height: 190mm !important;
            max-height: 190mm !important;
            border-top-left-radius: 40mm !important;
            border-top-right-radius: 40mm !important;
            border-bottom-left-radius: 2mm !important;
            border-bottom-right-radius: 2mm !important;
            border: 0.5mm solid #000000 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            margin: 0 auto !important;
            position: relative !important;
          }
          .print-hole {
            width: 55.5mm !important;
            height: 55.5mm !important;
            top: 12.25mm !important;
            left: 12.25mm !important;
          }
          .card-content-area {
            padding-top: 70mm !important;
            padding-left: 4mm !important;
            padding-right: 4mm !important;
            padding-bottom: 3mm !important;
            box-sizing: border-box !important;
          }
          .fiducial-marker { width: 3.5mm !important; height: 3.5mm !important; }
          .fiducial-top-left    { top: 70mm !important; left: 1mm !important; }
          .fiducial-top-right   { top: 70mm !important; right: 1mm !important; }
          .fiducial-bottom-left { bottom: 2mm !important; left: 1mm !important; }
          .fiducial-bottom-right{ bottom: 2mm !important; right: 1mm !important; }
        }
      `}} />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800 mb-6 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">
              Plantilla Imprimible HSK 63 ({isOrange ? 'Tarjeta Naranja' : 'Tarjeta Verde'})
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              80 mm × 190 mm • Ø 55.5 mm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Medidas físicas exactas del cartón (80×190mm) con los campos establecidos de operación y control de herramienta.
          </p>
          <div className="mt-2 inline-flex items-center space-x-2 bg-blue-950/40 border border-blue-800/60 rounded-lg px-2.5 py-1 text-[11px] text-blue-300">
            <span>💡 <strong>Para imprimir a escala 1:1 exacta:</strong> En el diálogo de impresión, selecciona <em>Escala: 100% (o Tamaño Real)</em> y activa <em>Gráficos de fondo</em>.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Tipo */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCardType('naranja')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isOrange
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              Tarjeta Naranja (Desmontaje - 10 Campos)
            </button>
            <button
              onClick={() => setCardType('verde')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isOrange
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Tarjeta Verde (Estándar - 9 Campos)
            </button>
          </div>

          {/* Toggle de Cotas / Medidas */}
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showDimensions
                ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Mostrar u ocultar flechas de acotación milimétrica"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{showDimensions ? 'Ocultar Cotas' : 'Ver Cotas (80×190mm)'}</span>
          </button>

          {/* Toggle de Marcadores OpenCV */}
          <button
            onClick={() => setShowFiducials(!showFiducials)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showFiducials
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Activar marcadores para escaneo automático por visión computacional"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{showFiducials ? 'Marcadores OpenCV: ON' : 'Marcadores: OFF'}</span>
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Tarjeta (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Visual Imprimible Vertical: 80 mm ancho x 190 mm alto */}
      <div className="flex justify-center p-6 bg-slate-950 rounded-xl overflow-x-auto print:bg-white print:p-0">
        <div className="relative flex items-center justify-center p-8 print:p-0">
          {/* COTA IZQUIERDA: 190 mm */}
          {showDimensions && (
            <div className="absolute -left-14 top-8 bottom-8 flex flex-col items-center justify-between text-blue-400 print:hidden select-none">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-blue-400" />
              <div className="h-full w-[1.5px] bg-blue-400/80 flex items-center justify-center">
                <span className="bg-slate-900 px-2 py-1 rounded text-xs font-bold border border-blue-500/50 shadow whitespace-nowrap -rotate-90">
                  190 mm
                </span>
              </div>
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-blue-400" />
            </div>
          )}

          {/* EL CARTONSILLO PRINCIPAL */}
          <div
            id="printable-card"
            className={`relative select-none ${
              isOrange
                ? 'bg-[#ff7b54] border-[#d9480f] text-black'
                : 'bg-[#40c057] border-[#2b8a3e] text-black'
            } border-2 shadow-2xl flex flex-col justify-between print:shadow-none print:m-0 print:border-2`}
            style={{
              width: '360px',
              height: '855px', // 360 * (190 / 80) = 855px (proporción matemática exacta 80mm : 190mm)
              borderTopLeftRadius: '180px', // 360 / 2 = 180px (radio superior de 40mm)
              borderTopRightRadius: '180px',
              borderBottomLeftRadius: '6px',
              borderBottomRightRadius: '6px',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. AGUJERO CIRCULAR SUPERIOR: 55.5 mm (Radio 27.75 mm) */}
            {/* Margen perimetral: (80mm - 55.5mm) / 2 = 12.25 mm a los lados y arriba */}
            <div
              className="print-hole absolute rounded-full border-2 border-dashed border-black/80 flex items-center justify-center bg-slate-950/20 print:bg-transparent"
              style={{
                width: '249.75px', // 360px * (55.5 / 80) = 249.75px
                height: '249.75px',
                top: '55.125px',   // 360px * (12.25 / 80) = 55.125px
                left: '55.125px',
              }}
            >
              <div className="text-center pointer-events-none relative z-10">
                <Scissors className="w-5 h-5 mx-auto text-black/70 mb-0.5" />
                <span className="text-[10px] font-bold text-black/80 uppercase tracking-wider block">
                  CORTE PARA CONO
                </span>
                <span className="text-[13px] font-black text-black block tracking-wide">
                  HSK 63
                </span>

                {/* Cota horizontal de 55.5 mm */}
                {showDimensions && (
                  <div className="mt-1 flex items-center justify-center space-x-1 bg-white/90 px-2 py-0.5 rounded border border-black/40 shadow-sm print:hidden">
                    <span className="text-[9px] font-black text-blue-900 font-mono">
                      ↔ 55.5 mm
                    </span>
                  </div>
                )}
              </div>

              {/* Ranuras radiales de inserción */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-3 bg-black/60 top-0 left-1/2 -translate-x-1/2 origin-[50%_125px]"
                  style={{ transform: `rotate(${i * (360 / 20)}deg)` }}
                />
              ))}
            </div>

            {/* 2. ZONA DE DATOS ESTABLECIDA CON LOS CAMPOS DEL PROYECTO (OPTIMIZADA PARA OCR) */}
            <div className="card-content-area pt-[315px] px-5 pb-4 flex flex-col justify-between h-full relative">
              {/* 4 Marcadores Fiduciales OpenCV (En los bordes externos sin tapar HSK ni C.C.) */}
              {showFiducials && (
                <>
                  <div className="fiducial-marker fiducial-top-left absolute top-[315px] left-1 w-4 h-4 bg-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-black" />
                    </div>
                  </div>
                  <div className="fiducial-marker fiducial-top-right absolute top-[315px] right-1 w-4 h-4 bg-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-black" />
                    </div>
                  </div>
                  <div className="fiducial-marker fiducial-bottom-left absolute bottom-2 left-1 w-4 h-4 bg-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-black" />
                    </div>
                  </div>
                  <div className="fiducial-marker fiducial-bottom-right absolute bottom-2 right-1 w-4 h-4 bg-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-black" />
                    </div>
                  </div>
                </>
              )}

              {/* Cabecera Limpia (Con margen lateral para evitar que los fiducials tapen el texto) */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <span className="text-[11px] font-black tracking-widest uppercase block text-black">
                    HSK 63
                  </span>
                  <span className="text-sm font-black tracking-tight block leading-tight text-black">
                    VOLKSWAGEN DE MÉXICO
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-black text-black">C.C.</span>
                  {/* Cajetines de Centro de Costos */}
                  <div className="flex space-x-0.5">
                    <div className="w-4.5 h-5.5 border-1.5 border-black bg-white rounded-sm flex items-center justify-center text-xs font-black">
                      4
                    </div>
                    <div className="w-4.5 h-5.5 border-1.5 border-black bg-white rounded-sm" />
                    <div className="w-4.5 h-5.5 border-1.5 border-black bg-white rounded-sm" />
                    <div className="w-4.5 h-5.5 border-1.5 border-black bg-white rounded-sm" />
                  </div>
                </div>
              </div>

              {/* CAMPOS ESTABLECIDOS: CON ESPACIADO EQUILIBRADO Y SIN SOLAPAMIENTOS */}
              <div className={`flex flex-col justify-between flex-1 ${isOrange ? 'space-y-2 mt-1' : 'space-y-4 mt-2'}`}>
                {/* 1. Operación */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[10.5px] text-black">Operación:</span>
                    <div className="flex-1 border-b border-black/70 ml-2.5 h-4.5" />
                  </div>
                </div>

                {/* 2. No. Herramienta (T + 5 números) */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[10.5px] text-black">No. de Herramienta:</span>
                    <div className="flex items-center ml-2 space-x-1.5 flex-1">
                      <div className="w-4.5 h-4.5 border-1.5 border-black bg-white rounded-sm flex items-center justify-center text-[9.5px] font-black">
                        T
                      </div>
                      <div className="flex-1 border-b border-black/70 h-4.5" />
                    </div>
                  </div>
                </div>

                {/* 3. Máquina (1 al 10) & Husillo (1 al 4) */}
                <div className="grid grid-cols-12 gap-2 items-baseline">
                  <div className="col-span-6 flex justify-between items-baseline">
                    <span className="font-bold text-[10px] text-black whitespace-nowrap">Máquina (1-10):</span>
                    <div className="flex-1 border-b border-black/70 ml-1.5 h-4.5" />
                  </div>
                  <div className="col-span-6 flex items-center space-x-1 justify-end">
                    <span className="font-bold text-[10px] text-black whitespace-nowrap">Husillo:</span>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4].map((h) => (
                        <div
                          key={h}
                          className="w-4 h-4 border border-black bg-white rounded-sm flex items-center justify-center text-[8.5px] font-black"
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Tiempo de vida útil logrado / Tiempo de vida útil */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[10.5px] text-black">
                      {isOrange ? 'Tiempo de vida útil logrado:' : 'Tiempo de vida útil:'}
                    </span>
                    <div className="flex-1 border-b border-black/70 ml-2 h-4.5" />
                  </div>
                </div>

                {/* 5. Motivo de Desmontaje con las 12 CASILLAS (SOLO EN TARJETA NARANJA) */}
                {isOrange ? (
                  <div>
                    <span className="font-black text-[9px] uppercase block mb-1 text-black">
                      Motivo de Desmontaje (Marcar con X):
                    </span>
                    {/* Cuadrícula de 2 columnas con las 12 casillas */}
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 bg-white/70 p-1.5 rounded border border-black/50 text-[8.5px]">
                      {MOTIVOS_DESMONTAJE.map((motivo) => (
                        <div key={motivo} className="flex items-center space-x-1">
                          <div className="w-3 h-3 border border-black bg-white rounded-none flex-shrink-0" />
                          <span className="leading-tight truncate font-medium text-black">{motivo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 6. SECCIÓN DE OBSERVACIONES (REDUCIDA A 2 LÍNEAS PARA DAR ESPACIO AL NOMBRE) */}
                <div>
                  <span className="font-bold text-[9.5px] text-black block mb-0.5">
                    {isOrange ? 'Observaciones / Detalles de falla:' : 'Observaciones de producción / calidad:'}
                  </span>
                  <div className={`w-full bg-white/75 border border-black/60 rounded p-1 flex flex-col justify-around ${isOrange ? 'h-9' : 'h-14'}`}>
                    <div className="border-b border-slate-300 w-full h-1/2" />
                    <div className="w-full h-1/2" />
                  </div>
                </div>

                {/* 7. CAMPOS DE CONTROL EN COLUMNA (UNO ABAJO DEL OTRO CON ESPACIO GENEROSO) */}
                <div className="space-y-2 pt-1">
                  {/* Fecha */}
                  <div className="flex items-baseline">
                    <span className="font-bold text-[10.5px] text-black w-14">Fecha:</span>
                    <div className="border-b border-black/70 flex-1 h-5" />
                  </div>

                  {/* Turno */}
                  <div className="flex items-center">
                    <span className="font-bold text-[10.5px] text-black w-14">Turno:</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3].map((t) => (
                        <div
                          key={t}
                          className="w-5 h-5 border border-black bg-white rounded-sm flex items-center justify-center text-[10px] font-black"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nombre */}
                  <div className="flex items-baseline">
                    <span className="font-bold text-[10.5px] text-black whitespace-nowrap mr-2">Nombre del Operador:</span>
                    <div className="border-b border-black/70 flex-1 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COTA INFERIOR: 80 mm */}
          {showDimensions && (
            <div className="absolute -bottom-6 left-8 right-8 flex items-center justify-between text-blue-400 print:hidden select-none">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-blue-400" />
              <div className="w-full h-[1.5px] bg-blue-400/80 flex items-center justify-center">
                <span className="bg-slate-900 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/50 shadow whitespace-nowrap">
                  80 mm
                </span>
              </div>
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-400" />
            </div>
          )}
        </div>
      </div>

      {/* Tabla Resumen de Especificaciones Técnicas */}
      <div className="print:hidden mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Ancho Total</span>
          <span className="text-white font-mono font-bold text-sm">80.0 mm</span>
          <span className="text-slate-400 text-[10px] block">Radio arco superior: 40.0 mm</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Alto Total</span>
          <span className="text-white font-mono font-bold text-sm">190.0 mm</span>
          <span className="text-slate-400 text-[10px] block">Proporción: 1 : 2.375</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Agujero Cono HSK 63</span>
          <span className="text-white font-mono font-bold text-sm">Ø 55.5 mm</span>
          <span className="text-slate-400 text-[10px] block">Margen perimetral: 12.25 mm</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Campos de Control</span>
          <span className="text-white font-mono font-bold text-sm">
            {isOrange ? '10 Campos Oficiales' : '9 Campos Oficiales'}
          </span>
          <span className="text-slate-400 text-[10px] block">Con cajetines y marcadores OpenCV</span>
        </div>
      </div>
    </div>
  );
};
