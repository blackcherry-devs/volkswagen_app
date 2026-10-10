'use client';

import React from 'react';
import { Camera, FileSpreadsheet, Printer, Sliders, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { CardType } from '@/types/card';

interface NavbarProps {
  activeTab: 'capture' | 'excel' | 'print' | 'calibrate';
  setActiveTab: (tab: 'capture' | 'excel' | 'print' | 'calibrate') => void;
  selectedCardType: CardType;
  setSelectedCardType: (type: CardType) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCardType,
  setSelectedCardType,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* 1. Identidad de Planta / Logo VW */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 flex-shrink-0">
            {/* Emblema Estilo VW Cromado / Industrial */}
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition" />
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center border-2 border-slate-600/80 shadow-inner">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-blue-400 text-sm sm:text-base tracking-tighter">
                  VW
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black tracking-tight text-white text-xs sm:text-sm lg:text-base leading-none">
                  VOLKSWAGEN
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                  DE MÉXICO
                </span>
                <span className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border border-blue-500/40 text-[9.5px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                  HSK 63
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 hidden md:flex items-center space-x-1.5 mt-0.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Control de Herramientas • Inspección OMR & OpenCV</span>
              </p>
            </div>
          </div>

          {/* 2. Selector de Cartoncillo (Píldora Moderna) */}
          <div className="flex items-center bg-slate-900/90 p-1 sm:p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
            <button
              onClick={() => setSelectedCardType('naranja')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                selectedCardType === 'naranja'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/50'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedCardType === 'naranja' ? 'bg-white' : 'bg-orange-500'}`} />
              <span>Naranja</span>
              <span className="text-[9.5px] opacity-75 font-mono hidden sm:inline">(Desmontaje)</span>
            </button>

            <button
              onClick={() => setSelectedCardType('verde')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                selectedCardType === 'verde'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedCardType === 'verde' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>Verde</span>
              <span className="text-[9.5px] opacity-75 font-mono hidden sm:inline">(Seguimiento)</span>
            </button>
          </div>

          {/* 3. Pestañas de Navegación de Escritorio */}
          <nav className="hidden lg:flex items-center space-x-1.5 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('capture')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'capture'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear y Validar</span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Libro Excel</span>
              {savedCount > 0 && (
                <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-sm">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'print'
                  ? 'bg-slate-800 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => setActiveTab('calibrate')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calibrate'
                  ? 'bg-purple-600/40 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Calibrador</span>
            </button>
          </nav>

        </div>
      </div>

      {/* 4. Barra Móvil Inferior / Flotante de Pestañas (Optimizado táctil para celular) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-950/95 py-2 px-1 border-t border-slate-800/90 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('capture')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'capture'
              ? 'text-blue-400 bg-blue-950/40 font-bold border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Escanear</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition relative ${
            activeTab === 'excel'
              ? 'text-emerald-400 bg-emerald-950/40 font-bold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Excel ({savedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('print')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'print'
              ? 'text-blue-400 bg-blue-950/40 font-bold border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Printer className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Imprimir</span>
        </button>

        <button
          onClick={() => setActiveTab('calibrate')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'calibrate'
              ? 'text-purple-400 bg-purple-950/40 font-bold border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Calibrar</span>
        </button>
      </div>
    </header>
  );
};
