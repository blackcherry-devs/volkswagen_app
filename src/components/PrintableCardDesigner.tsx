'use client';

import React, { useState } from 'react';
import { Printer, Ruler, ShieldCheck } from 'lucide-react';
import { CardType } from '@/types/card';
import { generateCardSvgString } from '@/lib/mockData';

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

  // Genera el SVG idéntico al calibrador, en blanco (sin texto manuscrito) para impresión real
  const svgString = generateCardSvgString(cardType, null, {
    blank: true,
    showFiducials,
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl print:bg-white print:border-none print:p-0 print:shadow-none">
      {/* Estilos de impresión globales: escala 1:1 vectorial exacta (80 mm x 190 mm) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm auto;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #000000 !important;
          }
          /* Ocultar por completo todos los elementos excepto el contenedor del cartón */
          body * {
            visibility: hidden !important;
          }
          #printable-card-wrapper,
          #printable-card-wrapper * {
            visibility: visible !important;
          }
          #printable-card-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Asegurar tamaños físicos exactos del cartoncillo vectorial (80x190mm) */
          #printable-card {
            width: 80mm !important;
            height: 190mm !important;
            min-width: 80mm !important;
            max-width: 80mm !important;
            min-height: 190mm !important;
            max-height: 190mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            margin: 0 auto !important;
            position: relative !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          #printable-card svg {
            width: 80mm !important;
            height: 190mm !important;
            max-width: 80mm !important;
            max-height: 190mm !important;
            display: block !important;
            margin: 0 auto !important;
          }
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
            Diseño vectorial unificado 100% idéntico al Calibrador y a la Cámara.
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
      <div id="printable-card-wrapper" className="flex justify-center p-6 bg-slate-950 rounded-xl overflow-x-auto print:bg-white print:p-0">
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

          {/* EL CARTONSILLO PRINCIPAL (RENDERIZADO DIRECTAMENTE DESDE EL SVG OFICIAL) */}
          <div
            id="printable-card"
            className="relative select-none shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:m-0 print:border-none print:rounded-none"
            style={{
              width: '360px',
              height: '855px', // 360 * (190 / 80) = 855px (proporción matemática exacta 80mm : 190mm)
            }}
            dangerouslySetInnerHTML={{ __html: svgString }}
          />

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
          <span className="text-slate-400 text-[10px] block">Idéntico al calibrador e inspector</span>
        </div>
      </div>
    </div>
  );
};
