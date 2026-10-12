import { CardType, OrangeCardData, GreenCardData, UnifiedRupturaData, ExtractionResult, MOTIVOS_DESMONTAJE } from '@/types/card';

// Muestras predefinidas realistas
export const SAMPLE_ORANGE_DATA: OrangeCardData = {
  centroCostos: '4120',
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
  centroCostos: '4120',
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
  centroCostos: '4120',
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

// Generador de SVG que simula fielmente la tarjeta colgante HSK 63 de Volkswagen de México
// Generador de SVG que simula fielmente la tarjeta colgante HSK 63 de Volkswagen de México
// Con las medidas físicas exactas (80 mm × 190 mm, Ø 55.5 mm) y los campos establecidos del proyecto.
export function generateMockCardSvg(type: CardType, data: OrangeCardData | GreenCardData): string {
  const isOrange = type === 'naranja';
  const bgColor = isOrange ? '#fa7542' : '#4ea87d';
  const strokeColor = isOrange ? '#c0392b' : '#236543';
  const inkColor = '#0f172a'; // Tinta bolígrafo oscuro industrial

  // Para el cartón naranja: Cuadrícula de 12 casillas marcables en 2 columnas
  const orangeMotivosCheckboxes = isOrange
    ? `
    <!-- Motivo de Desmontaje (12 casillas en 2 columnas) -->
    <g transform="translate(68, 1140)">
      <rect width="664" height="230" rx="8" fill="#ffffff" fill-opacity="0.95" stroke="#000000" stroke-width="2"/>
      <text x="16" y="24" font-family="sans-serif" font-size="14" font-weight="900" fill="#000000">
        MOTIVO DE DESMONTAJE (MARCAR CON X):
      </text>

      <!-- Columna 1 (6 casillas) -->
      ${MOTIVOS_DESMONTAJE.slice(0, 6)
        .map((motivo, i) => {
          const yPos = 42 + i * 28;
          const isChecked = (data as OrangeCardData).motivoDesmontaje === motivo;
          return `
            <g transform="translate(16, ${yPos})">
              <rect width="18" height="18" fill="#ffffff" stroke="#000000" stroke-width="2" rx="2"/>
              ${
                isChecked
                  ? '<line x1="3" y1="3" x2="15" y2="15" stroke="#000000" stroke-width="3"/><line x1="15" y1="3" x2="3" y2="15" stroke="#000000" stroke-width="3"/>'
                  : ''
              }
              <text x="26" y="14" font-family="sans-serif" font-size="13" font-weight="${
                isChecked ? 'bold' : 'normal'
              }" fill="#000000">${motivo}</text>
            </g>
          `;
        })
        .join('')}

      <!-- Columna 2 (6 casillas) -->
      ${MOTIVOS_DESMONTAJE.slice(6, 12)
        .map((motivo, i) => {
          const yPos = 42 + i * 28;
          const isChecked = (data as OrangeCardData).motivoDesmontaje === motivo;
          return `
            <g transform="translate(340, ${yPos})">
              <rect width="18" height="18" fill="#ffffff" stroke="#000000" stroke-width="2" rx="2"/>
              ${
                isChecked
                  ? '<line x1="3" y1="3" x2="15" y2="15" stroke="#000000" stroke-width="3"/><line x1="15" y1="3" x2="3" y2="15" stroke="#000000" stroke-width="3"/>'
                  : ''
              }
              <text x="26" y="14" font-family="sans-serif" font-size="13" font-weight="${
                isChecked ? 'bold' : 'normal'
              }" fill="#000000">${motivo}</text>
            </g>
          `;
        })
        .join('')}
    </g>
  `
    : '';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1900" width="800" height="1900">
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
      <circle cx="0" cy="0" r="277.5" fill="#0f172a" stroke="#000000" stroke-width="3" stroke-dasharray="10 6"/>
      <!-- Ranuras radiales de inserción -->
      ${Array.from({ length: 24 })
        .map((_, i) => {
          const angle = (i * 360) / 24;
          return `<line x1="0" y1="-277.5" x2="0" y2="-320" stroke="#ffffff" stroke-width="3" stroke-opacity="0.85" transform="rotate(${angle})" />`;
        })
        .join('')}
      <text x="0" y="-30" font-family="sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        CORTE CONO
      </text>
      <text x="0" y="10" font-family="sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
        HSK 63
      </text>
      <text x="0" y="45" font-family="sans-serif" font-size="18" font-weight="bold" fill="#60a5fa" text-anchor="middle">
        Ø 55.5 mm
      </text>
    </g>

    <!-- 4 Marcadores Fiduciales OpenCV (Colocados en esquinas despejadas sin tapar HSK ni C.C.) -->
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

    <!-- Encabezado Oficial Limpio (x=70 a x=420 con amplio margen sin colisión) -->
    <text x="70" y="744" font-family="sans-serif" font-size="20" font-weight="900" letter-spacing="2" fill="#000000">
      HSK 63
    </text>
    <text x="70" y="774" font-family="sans-serif" font-size="24" font-weight="900" letter-spacing="0.5" fill="#000000">
      VOLKSWAGEN
    </text>
    <text x="70" y="796" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="1" fill="#000000">
      DE MÉXICO
    </text>

    <!-- Centro de Costos C.C. con Cajetines (x=455 a x=725 sin colisión con fiducial) -->
    <g transform="translate(455, 750)">
      <text x="0" y="28" font-family="sans-serif" font-size="18" font-weight="900" fill="#000000">C.C.</text>
      <!-- 4 cajetines de Centro de Costos -->
      <g transform="translate(48, 0)">
        <rect x="0" y="0" width="36" height="40" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
        <rect x="42" y="0" width="36" height="40" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
        <rect x="84" y="0" width="36" height="40" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
        <rect x="126" y="0" width="36" height="40" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
        <!-- Manuscrito -->
        <text x="9" y="30" font-family="cursive, 'Brush Script MT', sans-serif" font-size="28" font-weight="bold" fill="${inkColor}">${data.centroCostos[0] || '4'}</text>
        <text x="51" y="30" font-family="cursive, 'Brush Script MT', sans-serif" font-size="28" font-weight="bold" fill="${inkColor}">${data.centroCostos[1] || '1'}</text>
        <text x="93" y="30" font-family="cursive, 'Brush Script MT', sans-serif" font-size="28" font-weight="bold" fill="${inkColor}">${data.centroCostos[2] || '2'}</text>
        <text x="135" y="30" font-family="cursive, 'Brush Script MT', sans-serif" font-size="28" font-weight="bold" fill="${inkColor}">${data.centroCostos[3] || '0'}</text>
      </g>
    </g>

    <!-- CAMPOS DE DATOS: ESPACIADOS DE FORMA EQUILIBRADA Y SIN COLISIONES -->
    <!-- 1. Operación -->
    <g transform="translate(70, 840)">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        Operación:
      </text>
      <line x1="130" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="145" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="30" font-weight="bold" fill="${inkColor}">
        ${data.operacion || 'OP-20 FRESADO CARA'}
      </text>
    </g>

    <!-- 2. No. Herramienta (T + 5 números) -->
    <g transform="translate(70, 900)">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        No. de Herramienta:
      </text>
      <!-- Cajetín T -->
      <rect x="205" y="0" width="32" height="32" fill="#ffffff" stroke="#000000" stroke-width="2" rx="3"/>
      <text x="214" y="23" font-family="sans-serif" font-size="19" font-weight="900" fill="#000000">T</text>
      <line x1="248" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="262" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="30" font-weight="bold" fill="${inkColor}">
        ${(data.numeroHerramienta || 'T-10452').replace(/^[Tt]-?/, '')}
      </text>
    </g>

    <!-- 3. Máquina (1 al 10) & Husillo (1 al 4) -->
    <g transform="translate(70, 960)">
      <text x="0" y="22" font-family="sans-serif" font-size="16" font-weight="bold" fill="#000000">
        Máquina (1-10):
      </text>
      <line x1="155" y1="26" x2="285" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="170" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="30" font-weight="bold" fill="${inkColor}">
        ${data.maquina || '3'}
      </text>

      <text x="315" y="22" font-family="sans-serif" font-size="16" font-weight="bold" fill="#000000">
        Husillo (1-4):
      </text>
      <!-- Casillas 1, 2, 3, 4 -->
      <g transform="translate(450, 0)">
        <rect x="0" y="0" width="28" height="28" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="8" y="20" font-size="16" font-family="sans-serif" font-weight="bold">1</text>
        ${data.husillo === '1' ? '<line x1="3" y1="3" x2="25" y2="25" stroke="#000000" stroke-width="3"/><line x1="25" y1="3" x2="3" y2="25" stroke="#000000" stroke-width="3"/>' : ''}

        <rect x="42" y="0" width="28" height="28" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="50" y="20" font-size="16" font-family="sans-serif" font-weight="bold">2</text>
        ${data.husillo === '2' ? '<line x1="45" y1="3" x2="67" y2="25" stroke="#000000" stroke-width="3"/><line x1="67" y1="3" x2="45" y2="25" stroke="#000000" stroke-width="3"/>' : ''}

        <rect x="84" y="0" width="28" height="28" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="92" y="20" font-size="16" font-family="sans-serif" font-weight="bold">3</text>
        ${data.husillo === '3' ? '<line x1="87" y1="3" x2="109" y2="25" stroke="#000000" stroke-width="3"/><line x1="109" y1="3" x2="87" y2="25" stroke="#000000" stroke-width="3"/>' : ''}

        <rect x="126" y="0" width="28" height="28" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="134" y="20" font-size="16" font-family="sans-serif" font-weight="bold">4</text>
        ${data.husillo === '4' ? '<line x1="129" y1="3" x2="151" y2="25" stroke="#000000" stroke-width="3"/><line x1="151" y1="3" x2="129" y2="25" stroke="#000000" stroke-width="3"/>' : ''}
      </g>
    </g>

    <!-- 4. Tiempo de vida útil -->
    <g transform="translate(70, 1020)">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        ${isOrange ? 'Tiempo de vida útil logrado:' : 'Tiempo de vida útil:'}
      </text>
      <line x1="315" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="330" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="30" font-weight="bold" fill="${inkColor}">
        ${data.tiempoVidaUtil || '1450'} pzs
      </text>
    </g>

    ${orangeMotivosCheckboxes}

    <!-- 5. SECCIÓN DE OBSERVACIONES (REDUCIDA A 2 LÍNEAS PARA DAR ESPACIO A NOMBRE) -->
    ${
      isOrange
        ? `
    <g transform="translate(68, 1335)">
      <text x="4" y="15" font-family="sans-serif" font-size="12" font-weight="900" fill="#000000">
        OBSERVACIONES / DETALLES DE FALLA:
      </text>
      <rect x="0" y="22" width="664" height="65" rx="6" fill="#ffffff" fill-opacity="0.92" stroke="#000000" stroke-width="1.5"/>
      <line x1="10" y1="52" x2="654" y2="52" stroke="#cbd5e1" stroke-width="1"/>
      <text x="14" y="44" font-family="cursive, 'Brush Script MT', sans-serif" font-size="22" font-weight="bold" fill="${inkColor}">
        ${(data as OrangeCardData).observaciones || 'Desgaste severo en filo principal tras 1450 ciclos de fresado.'}
      </text>
    </g>
    `
        : `
    <g transform="translate(68, 1100)">
      <text x="4" y="16" font-family="sans-serif" font-size="13" font-weight="900" fill="#000000">
        OBSERVACIONES DE PRODUCCIÓN / CALIDAD:
      </text>
      <rect x="0" y="24" width="664" height="95" rx="6" fill="#ffffff" fill-opacity="0.92" stroke="#000000" stroke-width="1.8"/>
      <line x1="12" y1="62" x2="652" y2="62" stroke="#cbd5e1" stroke-width="1.2"/>
      <text x="16" y="52" font-family="cursive, 'Brush Script MT', sans-serif" font-size="24" font-weight="bold" fill="${inkColor}">
        ${(data as GreenCardData).observaciones || 'Herramienta liberada para maquinado en serie, inspección OK.'}
      </text>
    </g>
    `
    }

    <!-- 6. FILA DE CONTROL: FECHA, TURNO Y NOMBRE (UNO ABAJO DEL OTRO CON AMPLIO ESPACIO) -->
    <!-- Fecha -->
    <g transform="translate(70, ${isOrange ? '1445' : '1240'})">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        Fecha:
      </text>
      <line x1="85" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="100" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="29" font-weight="bold" fill="${inkColor}">
        ${data.fecha || '09/10/2026'}
      </text>
    </g>

    <!-- Turno -->
    <g transform="translate(70, ${isOrange ? '1520' : '1315'})">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        Turno:
      </text>
      <g transform="translate(85, 0)">
        <rect x="0" y="0" width="30" height="30" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="9" y="21" font-size="16" font-family="sans-serif" font-weight="bold">1</text>
        ${data.turno === '1' ? '<line x1="3" y1="3" x2="27" y2="27" stroke="#000000" stroke-width="3"/><line x1="27" y1="3" x2="3" y2="27" stroke="#000000" stroke-width="3"/>' : ''}

        <rect x="50" y="0" width="30" height="30" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="59" y="21" font-size="16" font-family="sans-serif" font-weight="bold">2</text>
        ${data.turno === '2' ? '<line x1="53" y1="3" x2="77" y2="27" stroke="#000000" stroke-width="3"/><line x1="77" y1="3" x2="53" y2="27" stroke="#000000" stroke-width="3"/>' : ''}

        <rect x="100" y="0" width="30" height="30" fill="#ffffff" stroke="#000000" stroke-width="1.8" rx="3"/>
        <text x="109" y="21" font-size="16" font-family="sans-serif" font-weight="bold">3</text>
        ${data.turno === '3' ? '<line x1="103" y1="3" x2="127" y2="27" stroke="#000000" stroke-width="3"/><line x1="127" y1="3" x2="103" y2="27" stroke="#000000" stroke-width="3"/>' : ''}
      </g>
    </g>

    <!-- Nombre (Ubicado entre y=1595 e y=1630, perfectamente visible arriba de los marcadores inferiores) -->
    <g transform="translate(70, ${isOrange ? '1595' : '1390'})">
      <text x="0" y="22" font-family="sans-serif" font-size="17" font-weight="bold" fill="#000000">
        Nombre del Operador:
      </text>
      <line x1="220" y1="26" x2="660" y2="26" stroke="#000000" stroke-width="1.8" stroke-opacity="0.8"/>
      <text x="240" y="19" font-family="cursive, 'Brush Script MT', sans-serif" font-size="29" font-weight="bold" fill="${inkColor}">
        ${data.nombre || 'Carlos E. Mendoza'}
      </text>
    </g>
  </svg>
  `;

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
