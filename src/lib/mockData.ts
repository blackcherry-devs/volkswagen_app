import { CardType, OrangeCardData, GreenCardData, UnifiedRupturaData, ExtractionResult, MOTIVOS_DESMONTAJE, getMotivoCodeByName } from '@/types/card';

// ============================================================================
// CONSTANTES DE TAMAÑO DE FUENTE (FONT-SIZE) PARA TARJETAS / CARTONCILLOS
// Modifica fácilmente estos valores numéricos (en píxeles SVG) para cambiar
// el tamaño de la letra al imprimir o visualizar sin desalinear el diseño.
// ============================================================================
export const CARD_FONT_CONFIG = {
  // Tamaño principal de las etiquetas de campos ("Operación:", "No. de Herramienta:", etc.)
  fontSizeLabels: 26,

  // Tamaño de las 12 opciones de "Motivo de Desmontaje" en la tarjeta naranja (aumentado para OCR Qwen)
  fontSizeMotivos: 22,

  // Título del recuadro de motivos de desmontaje
  fontSizeMotivosTitle: 16,

  // Título de la sección de observaciones
  fontSizeObservacionesTitle: 18,

  // Encabezados superiores ("HSK 63", "VOLKSWAGEN", "DE MÉXICO", "C.C.")
  fontSizeHeaderHsk: 21,
  fontSizeHeaderTitle: 25,
  fontSizeHeaderSubtitle: 13,
  fontSizeCentroCostosLabel: 20,

  // Números en casillas de selección (Husillo 1-4, Turno 1-3)
  fontSizeOptionNumbers: 20,

  // Tamaño del texto simulado manuscrito / datos rellenados
  fontSizeHandwritten: 30,
};

// Muestras predefinidas realistas
export const SAMPLE_ORANGE_DATA: OrangeCardData = {
  centroCostos: '4002',
  operacion: 'OP-20 FRESADO CARA',
  numeroHerramienta: 'T-10452',
  maquina: '3',
  husillo: '2',
  tiempoVidaUtil: '1450',
  fecha: '2026-10-09',
  turno: '1',
  nombre: 'Carlos E. Mendoza',
  motivoDesmontaje: 'Rotura',
  observaciones: 'Desgaste severo en filo principal tras 1450 ciclos de fresado.',
};

export const SAMPLE_GREEN_DATA: GreenCardData = {
  centroCostos: '4002',
  operacion: 'OP-20 FRESADO CARA',
  numeroHerramienta: 'T-10452',
  maquina: '3',
  husillo: '2',
  tiempoVidaUtil: '2800',
  observaciones: 'Herramienta liberada para maquinado en serie, inspección OK.',
  fecha: '2026-10-01',
  nombre: 'Martín Silva Gómez',
  turno: '2',
};

// Muestra predefinida unificada (RUPTURAS TOTAL)
export const SAMPLE_UNIFIED_DATA: UnifiedRupturaData = {
  centroCostos: '4002',
  operacion: 'OP-20 FRESADO CARA',
  numeroHerramienta: 'T-10452',
  maquina: '3',
  husillo: '2',
  fechaInicial: '2026-10-01',
  turnoInicial: '2',
  nombreOperadorInicial: 'Martín Silva Gómez',
  tiempoVidaUtilInicial: '2800',
  observacionesInicial: 'Herramienta liberada para maquinado en serie, inspección OK.',
  fechaDesmontaje: '2026-10-09',
  turnoDesmontaje: '1',
  nombreOperadorDesmontaje: 'Carlos E. Mendoza',
  tiempoVidaUtilDesmontaje: '1450',
  motivoDesmontaje: 'Rotura',
  observacionesDesmontaje: 'Desgaste severo en filo principal tras 1450 ciclos de fresado.',
};

export interface CardSvgOptions {
  blank?: boolean;
  showFiducials?: boolean;
}

// Generador de SVG vectorial que define la tarjeta física HSK 63 de Volkswagen de México
// Escala matemática exacta: 800 x 1900 unidades = 80.0 mm x 190.0 mm (10 unidades = 1 mm)
export function generateCardSvgString(
  type: CardType,
  data?: Partial<OrangeCardData | GreenCardData> | null,
  options?: CardSvgOptions
): string {
  const isOrange = type === 'naranja';
  const blank = !!options?.blank;
  // Con Qwen2.5-VL los marcadores fiduciales ya no son necesarios en el cartón físico (por defecto false)
  const showFiducials = options?.showFiducials === true;
  const bgColor = isOrange ? '#fa7542' : '#4ea87d';
  const strokeColor = isOrange ? '#c0392b' : '#236543';
  const inkColor = '#0f172a'; // Tinta bolígrafo oscuro industrial

  // Código numérico del motivo (1 al 12) para visualización en mock / tarjeta
  const motivoCode = !blank && (data as OrangeCardData)?.motivoDesmontaje
    ? getMotivoCodeByName((data as OrangeCardData).motivoDesmontaje)
    : null;

  // Para el cartón naranja: Campo limpio de Motivo de Desmontaje con casilla (1 al 12)
  const orangeMotivosSection = isOrange
    ? `
    <!-- 5. Motivo de Desmontaje: Casilla 44x48 px sin 'N', con (1 - 12) en negro y grande -->
    <g transform="translate(70, 1280)">
      <text x="0" y="28" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Motivo de desmontaje:
      </text>
      <!-- Casilla amplia para escribir el número del motivo (44x48 px, igual que C.C.) -->
      <g transform="translate(290, -10)">
        <rect x="0" y="0" width="44" height="48" rx="4" fill="#ffffff" stroke="#000000" stroke-width="2.2"/>
        ${
          motivoCode
            ? `<text x="22" y="35" font-family="cursive, 'Brush Script MT', sans-serif" font-size="34" font-weight="bold" fill="${inkColor}" text-anchor="middle">${motivoCode}</text>`
            : ''
        }
      </g>
      <text x="350" y="28" font-family="sans-serif" font-size="22" font-weight="900" fill="#000000">
        (1 - 12)
      </text>
    </g>
  `
    : '';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1900" width="100%" height="100%">
    <!-- Silueta del Cartón HSK 63: 80 mm ancho x 190 mm alto (800 x 1900) -->
    <path d="
      M 0,400
      A 400,400 0 0,1 800,400
      L 800,1880
      Q 800,1900 780,1900
      L 20,1900
      Q 0,1900 0,1880
      Z
    " fill="${bgColor}" stroke="${strokeColor}" stroke-width="6"/>

    <!-- Agujero Circular Central HSK 63: Diámetro 55.5 mm (555 unidades, r=277.5) -->
    <g transform="translate(400, 400)">
      <circle cx="0" cy="0" r="277.5" fill="${blank ? '#ffffff' : '#0f172a'}" stroke="#000000" stroke-width="3" stroke-dasharray="10 6"/>
      <!-- Ranuras radiales de inserción -->
      ${Array.from({ length: 24 })
        .map((_, i) => {
          const angle = (i * 360) / 24;
          return `<line x1="0" y1="-277.5" x2="0" y2="-320" stroke="${blank ? '#000000' : '#ffffff'}" stroke-width="3" stroke-opacity="${blank ? '0.6' : '0.85'}" transform="rotate(${angle})" />`;
        })
        .join('')}
      <text x="0" y="-30" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHeaderHsk}" font-weight="900" fill="${blank ? '#000000' : '#ffffff'}" text-anchor="middle" letter-spacing="1">
        CORTE CONO
      </text>
      <text x="0" y="10" font-family="sans-serif" font-size="34" font-weight="900" fill="${blank ? '#000000' : '#ffffff'}" text-anchor="middle">
        HSK 63
      </text>
      <text x="0" y="45" font-family="sans-serif" font-size="18" font-weight="bold" fill="${blank ? '#1d4ed8' : '#60a5fa'}" text-anchor="middle">
        Ø 55.5 mm
      </text>
    </g>

    <!-- Marcadores Fiduciales Opcionales (Desactivados por defecto porque Qwen lee todo directamente) -->
    ${
      showFiducials
        ? `
    <!-- Top Left -->
    <rect x="25" y="700" width="34" height="34" fill="#000000"/>
    <rect x="33" y="708" width="18" height="18" fill="#ffffff"/>
    <rect x="38" y="713" width="8" height="8" fill="#000000"/>

    <!-- Top Right -->
    <rect x="741" y="700" width="34" height="34" fill="#000000"/>
    <rect x="749" y="708" width="18" height="18" fill="#ffffff"/>
    <rect x="754" y="713" width="8" height="8" fill="#000000"/>

    <!-- Bottom Left -->
    <rect x="25" y="1815" width="34" height="34" fill="#000000"/>
    <rect x="33" y="1823" width="18" height="18" fill="#ffffff"/>
    <rect x="38" y="1828" width="8" height="8" fill="#000000"/>

    <!-- Bottom Right -->
    <rect x="741" y="1815" width="34" height="34" fill="#000000"/>
    <rect x="749" y="1823" width="18" height="18" fill="#ffffff"/>
    <rect x="754" y="1828" width="8" height="8" fill="#000000"/>
    `
        : ''
    }

    <!-- Encabezado Oficial Volkswagen (x=70 a x=400) -->
    <text x="70" y="744" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHeaderHsk}" font-weight="900" letter-spacing="2" fill="#000000">
      HSK 63
    </text>
    <text x="70" y="774" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHeaderTitle}" font-weight="900" letter-spacing="0.5" fill="#000000">
      VOLKSWAGEN
    </text>
    <text x="70" y="796" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHeaderSubtitle}" font-weight="900" letter-spacing="1" fill="#000000">
      DE MÉXICO
    </text>

    <!-- Centro de Costos C.C. con Cajetines Ampliados (44x48 px) -->
    <g transform="translate(435, 740)">
      <text x="0" y="32" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeCentroCostosLabel}" font-weight="900" fill="#000000">C.C.</text>
      <!-- 4 cajetines de Centro de Costos -->
      <g transform="translate(54, 0)">
        <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
        <rect x="52" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
        <rect x="104" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
        <rect x="156" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
        ${
          !blank && data?.centroCostos
            ? `
        <text x="12" y="35" font-family="cursive, 'Brush Script MT', sans-serif" font-size="34" font-weight="bold" fill="${inkColor}">${data.centroCostos[0] || '4'}</text>
        <text x="64" y="35" font-family="cursive, 'Brush Script MT', sans-serif" font-size="34" font-weight="bold" fill="${inkColor}">${data.centroCostos[1] || '1'}</text>
        <text x="116" y="35" font-family="cursive, 'Brush Script MT', sans-serif" font-size="34" font-weight="bold" fill="${inkColor}">${data.centroCostos[2] || '2'}</text>
        <text x="168" y="35" font-family="cursive, 'Brush Script MT', sans-serif" font-size="34" font-weight="bold" fill="${inkColor}">${data.centroCostos[3] || '0'}</text>
        `
            : ''
        }
      </g>
    </g>

    <!-- CAMPOS DE DATOS: ESPACIADOS DE FORMA EQUILIBRADA Y SIN COLISIONES -->
    <!-- 1. Operación -->
    <g transform="translate(70, ${isOrange ? '880' : '880'})">
      <text x="0" y="22" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Operación:
      </text>
      <line x1="150" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.operacion
          ? `
      <text x="160" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.operacion}
      </text>
      `
          : ''
      }
    </g>

    <!-- 2. No. Herramienta (T + 5 números) -->
    <g transform="translate(70, ${isOrange ? '960' : '970'})">
      <text x="0" y="22" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        No. de Herramienta:
      </text>
      <!-- Cajetín T -->
      <rect x="255" y="-1" width="34" height="34" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
      <text x="265" y="23" font-family="sans-serif" font-size="20" font-weight="900" fill="#000000">T</text>
      <line x1="300" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.numeroHerramienta
          ? `
      <text x="312" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.numeroHerramienta.replace(/^[Tt]-?/, '')}
      </text>
      `
          : ''
      }
    </g>

    <!-- 3. Máquina (1 al 10) & Husillo (Separado holgadamente de Herramienta) -->
    <g transform="translate(70, ${isOrange ? '1070' : '1090'})">
      <text x="0" y="26" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Máquina (1-10):
      </text>
      <line x1="185" y1="30" x2="255" y2="30" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.maquina
          ? `
      <text x="195" y="23" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.maquina}
      </text>
      `
          : ''
      }

      <text x="270" y="26" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Husillo:
      </text>
      <!-- Casillas de Husillo 1, 2, 3, 4 ampliadas a 44x48 px (igual que Centro de Costos) -->
      <g transform="translate(365, -12)">
        <!-- Husillo 1 -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.husillo && String(data.husillo).includes('1') ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="3.5"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="3.5"/>' : ''}
          <text x="50" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">1</text>
        </g>

        <!-- Husillo 2 -->
        <g transform="translate(74, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.husillo && String(data.husillo).includes('2') ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="3.5"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="3.5"/>' : ''}
          <text x="50" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">2</text>
        </g>

        <!-- Husillo 3 -->
        <g transform="translate(148, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.husillo && String(data.husillo).includes('3') ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="3.5"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="3.5"/>' : ''}
          <text x="50" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">3</text>
        </g>

        <!-- Husillo 4 -->
        <g transform="translate(222, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.husillo && String(data.husillo).includes('4') ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="3.5"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="3.5"/>' : ''}
          <text x="50" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">4</text>
        </g>
      </g>
    </g>

    <!-- 4. Tiempo de vida útil (Con separación amplia respecto a Máquina y Husillo) -->
    <g transform="translate(70, ${isOrange ? '1190' : '1235'})">
      <text x="0" y="24" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        ${isOrange ? 'Tiempo de vida útil logrado:' : 'Tiempo de vida útil:'}
      </text>
      <line x1="${isOrange ? '355' : '265'}" y1="28" x2="660" y2="28" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.tiempoVidaUtil
          ? `
      <text x="${isOrange ? '365' : '275'}" y="21" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.tiempoVidaUtil} pzs
      </text>
      `
          : ''
      }
    </g>

    ${orangeMotivosSection}

    <!-- 5. SECCIÓN DE OBSERVACIONES (Solo presente en Tarjeta Naranja, ampliada con 4 renglones) -->
    ${
      isOrange
        ? `
    <g transform="translate(68, 1375)">
      <text x="4" y="18" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeObservacionesTitle}" font-weight="900" fill="#000000">
        OBSERVACIONES / DETALLES DE FALLA:
      </text>
      <rect x="0" y="26" width="664" height="105" rx="8" fill="#ffffff" fill-opacity="0.95" stroke="#000000" stroke-width="2"/>
      <!-- 4 renglones de escritura (3 líneas guía interiores) -->
      <line x1="12" y1="52" x2="652" y2="52" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="6 3"/>
      <line x1="12" y1="78" x2="652" y2="78" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="6 3"/>
      <line x1="12" y1="104" x2="652" y2="104" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="6 3"/>
      ${
        !blank && (data as OrangeCardData)?.observaciones
          ? `
      <text x="16" y="47" font-family="cursive, 'Brush Script MT', sans-serif" font-size="22" font-weight="bold" fill="${inkColor}">
        ${(data as OrangeCardData).observaciones}
      </text>
      `
          : ''
      }
    </g>
    `
        : ''
    }

    <!-- 6. FILA DE CONTROL: FECHA, TURNO Y NOMBRE (Con espacio amplio y limpio) -->
    <!-- Fecha -->
    <g transform="translate(70, ${isOrange ? '1575' : '1385'})">
      <text x="0" y="22" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Fecha:
      </text>
      <line x1="95" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.fecha
          ? `
      <text x="105" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.fecha}
      </text>
      `
          : ''
      }
    </g>

    <!-- Turno: Casillas ampliadas a 44x48 px (igual que Centro de Costos) -->
    <g transform="translate(70, ${isOrange ? '1655' : '1515'})">
      <text x="0" y="30" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Turno:
      </text>
      <g transform="translate(95, -10)">
        <!-- Turno 1 -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.turno === '1' ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="4"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="4"/>' : ''}
          <text x="52" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">1°</text>
        </g>

        <!-- Turno 2 -->
        <g transform="translate(100, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.turno === '2' ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="4"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="4"/>' : ''}
          <text x="52" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">2°</text>
        </g>

        <!-- Turno 3 -->
        <g transform="translate(200, 0)">
          <rect x="0" y="0" width="44" height="48" fill="#ffffff" stroke="#000000" stroke-width="2.2" rx="4"/>
          ${!blank && data?.turno === '3' ? '<line x1="6" y1="6" x2="38" y2="42" stroke="#000000" stroke-width="4"/><line x1="38" y1="6" x2="6" y2="42" stroke="#000000" stroke-width="4"/>' : ''}
          <text x="52" y="32" font-size="22" font-family="sans-serif" font-weight="900" fill="#000000">3°</text>
        </g>
      </g>
    </g>

    <!-- Nombre -->
    <g transform="translate(70, ${isOrange ? '1735' : '1645'})">
      <text x="0" y="22" font-family="sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeLabels}" font-weight="bold" fill="#000000">
        Nombre del Operador:
      </text>
      <line x1="285" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      ${
        !blank && data?.nombre
          ? `
      <text x="295" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="${CARD_FONT_CONFIG.fontSizeHandwritten}" font-weight="bold" fill="${inkColor}">
        ${data.nombre}
      </text>
      `
          : ''
      }
    </g>
  </svg>
  `;

  return svg;
}

export function generateMockCardSvg(
  type: CardType,
  data?: Partial<OrangeCardData | GreenCardData> | null,
  options?: CardSvgOptions
): string {
  const defaultData = type === 'naranja' ? SAMPLE_ORANGE_DATA : SAMPLE_GREEN_DATA;
  const svg = generateCardSvgString(type, data || defaultData, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Simula la extracción completa de OpenCV + Azure Document Intelligence + OpenAI
export async function simulateExtractionPipeline(
  type: CardType,
  imageUri: string,
  onProgress?: (step: string) => void
): Promise<ExtractionResult> {
  const steps = [
    'Detectando contorno de etiqueta HSK 63 y marcadores de esquina con OpenCV...',
    'Aislando región rectangular de datos bajo el hueco del cono...',
    'Aplicando corrección de perspectiva homográfica (warpPerspective)...',
    'Escaneando cuadrícula de las 12 casillas de Motivo de Desmontaje con OpenCV...',
    'Ejecutando OCR manuscrito en cajetines C.C. y campos de texto con Azure AI...',
    'Mapeando casilla detectada con OpenAI y validando con Zod (C.C. = 4xxx, T-xxxxx)...',
  ];

  for (const step of steps) {
    if (onProgress) onProgress(step);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const isOrange = type === 'naranja';
  const baseData = isOrange ? { ...SAMPLE_ORANGE_DATA } : { ...SAMPLE_GREEN_DATA };

  const confidences: Record<string, number> = isOrange
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
        motivoDesmontaje: 99, // Alta confianza porque es detección de casilla OpenCV
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
      };

  const fieldFlags: Record<string, string | null> = {
    centroCostos: null,
    numeroHerramienta: null,
    maquina: null,
    husillo: null,
    tiempoVidaUtil: null,
    fecha: null,
    turno: null,
    nombre: null,
    ...(isOrange ? { motivoDesmontaje: null } : {}),
  };

  return {
    cardType: type,
    timestamp: new Date().toISOString(),
    imageUrl: imageUri,
    data: baseData,
    confidences: confidences as any,
    fieldFlags: fieldFlags as any,
    overallConfidence: 97,
  };
}
