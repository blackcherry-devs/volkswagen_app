import { CardType, MOTIVOS_DESMONTAJE, MotivoDesmontajeTipo } from '@/types/card';
import { getTemplate } from '@/lib/templates';
import { interpolatePoint, CardCorners, DEFAULT_CORNERS_NARANJA, DEFAULT_CORNERS_VERDE } from '@/lib/cornerDetection';

export interface CheckboxDetectionResult {
  husillo: string;              // '1' | '2' | '3' | '4' | ''
  turno: string;                // '1' | '2' | '3' | ''
  motivoDesmontaje?: string;    // Nombre del motivo seleccionado o ''
  densities: {
    husillo: Record<string, number>;
    turno: Record<string, number>;
    motivoDesmontaje?: Record<string, number>;
  };
}

/**
 * Carga una imagen base64 o URL a un elemento HTMLImageElement
 */
function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Canvas solo está disponible en el entorno del navegador'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen para detección de checkboxes'));
    img.src = src;
  });
}

/**
 * Evalúa la densidad de píxeles oscuros (tinta de pluma/marcador) dentro de un sub-recuadro del canvas.
 * Aplica un margen interior (inset) del 15% para evitar falsos positivos con el marco impreso.
 */
export function measureDarkPixelDensity(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  pixelW: number,
  pixelH: number,
  insetRatio = 0.15,
  darkThreshold = 115
): number {
  const insetX = Math.round(pixelW * insetRatio);
  const insetY = Math.round(pixelH * insetRatio);

  const sampleX = Math.max(0, Math.round(pixelX + insetX));
  const sampleY = Math.max(0, Math.round(pixelY + insetY));
  const sampleW = Math.max(1, Math.round(pixelW - insetX * 2));
  const sampleH = Math.max(1, Math.round(pixelH - insetY * 2));

  try {
    const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
    const data = imgData.data;
    let darkPixels = 0;
    const totalPixels = sampleW * sampleH;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Luminancia ITU-R BT.601
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      if (lum < darkThreshold) {
        darkPixels++;
      }
    }

    return totalPixels > 0 ? darkPixels / totalPixels : 0;
  } catch (err) {
    console.warn('[CheckboxDetector] Error leyendo ImageData:', err);
    return 0;
  }
}

/**
 * Detecta de forma algorítmica y 100% matemática el estado de todas las casillas de verificación
 * (husillos, turnos y motivos de desmontaje) midiendo la densidad de tinta con Canvas 2D local.
 */
export async function detectCheckboxesFromImage(
  imageSource: string | HTMLCanvasElement | HTMLImageElement,
  cardType: CardType,
  corners?: CardCorners,
  threshold = 0.08 // 8% de densidad de tinta dentro de la casilla es suficiente para considerarla marcada
): Promise<CheckboxDetectionResult> {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (typeof imageSource === 'object' && 'getContext' in imageSource) {
    canvas = imageSource as HTMLCanvasElement;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    canvas = document.createElement('canvas');
    let img: HTMLImageElement;
    if (typeof imageSource === 'string') {
      img = await loadHtmlImage(imageSource);
    } else {
      img = imageSource as HTMLImageElement;
    }
    canvas.width = img.naturalWidth || img.width || 800;
    canvas.height = img.naturalHeight || img.height || 1216;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }

  if (!ctx) {
    return {
      husillo: '',
      turno: '',
      motivoDesmontaje: cardType === 'naranja' ? '' : undefined,
      densities: { husillo: {}, turno: {}, motivoDesmontaje: {} },
    };
  }

  // 1. Obtener la plantilla activa (con coordenadas calibradas si existen en localStorage)
  const template = getTemplate(cardType);
  const activeCorners = corners || (cardType === 'naranja' ? DEFAULT_CORNERS_NARANJA : DEFAULT_CORNERS_VERDE);

  // Rangos de normalización basados en los marcadores fiduciales de la plantilla
  const xMin = template.fiducialMarkers?.topLeft?.x ?? 0.0525;
  const xMax = template.fiducialMarkers?.topRight?.x ?? 0.9475;
  const yMin = template.fiducialMarkers?.topLeft?.y ?? 0.3774;
  const yMax = template.fiducialMarkers?.bottomLeft?.y ?? 0.9642;

  // Función para proyectar cualquier punto de la plantilla al canvas utilizando las 4 esquinas
  const toCanvasPx = (normX: number, normY: number) => {
    const u = (normX - xMin) / (xMax - xMin);
    const v = (normY - yMin) / (yMax - yMin);
    const pt = interpolatePoint(activeCorners, u, v);
    return {
      x: pt.x * canvas.width,
      y: pt.y * canvas.height,
    };
  };

  const toCanvasDims = (normW: number, normH: number) => {
    const uw = normW / (xMax - xMin);
    const vh = normH / (yMax - yMin);
    const spanX = Math.abs(activeCorners.topRight.x - activeCorners.topLeft.x);
    const spanY = Math.abs(activeCorners.bottomLeft.y - activeCorners.topLeft.y);
    return {
      w: uw * spanX * canvas.width,
      h: vh * spanY * canvas.height,
    };
  };

  const result: CheckboxDetectionResult = {
    husillo: '',
    turno: '',
    motivoDesmontaje: cardType === 'naranja' ? '' : undefined,
    densities: { husillo: {}, turno: {}, motivoDesmontaje: {} },
  };

  // --- DETECCIÓN DE HUSILLO (1 a 4) ---
  const husilloBox = template.fields?.husillo;
  if (husilloBox) {
    const origin = toCanvasPx(husilloBox.x, husilloBox.y);
    const dims = toCanvasDims(husilloBox.width, husilloBox.height);

    // 4 casillas distribuidas horizontalmente
    const boxRatios = [
      { key: '1', relX: 0.00, relW: 0.20 },
      { key: '2', relX: 0.27, relW: 0.20 },
      { key: '3', relX: 0.54, relW: 0.20 },
      { key: '4', relX: 0.80, relW: 0.20 },
    ];

    let bestKey = '';
    let maxDensity = 0;

    for (const b of boxRatios) {
      const px = origin.x + dims.w * b.relX;
      const py = origin.y;
      const pw = dims.w * b.relW;
      const ph = dims.h;

      const density = measureDarkPixelDensity(ctx, px, py, pw, ph, 0.15);
      result.densities.husillo[b.key] = parseFloat(density.toFixed(3));

      if (density > threshold && density > maxDensity) {
        maxDensity = density;
        bestKey = b.key;
      }
    }

    result.husillo = bestKey;
  }

  // --- DETECCIÓN DE TURNO (1 a 3) ---
  const turnoBox = template.fields?.turno;
  if (turnoBox) {
    const origin = toCanvasPx(turnoBox.x, turnoBox.y);
    const dims = toCanvasDims(turnoBox.width, turnoBox.height);

    // 3 casillas distribuidas en la sección derecha de la etiqueta Turno
    const boxRatios = [
      { key: '1', relX: 0.18, relW: 0.22 },
      { key: '2', relX: 0.46, relW: 0.22 },
      { key: '3', relX: 0.74, relW: 0.22 },
    ];

    let bestKey = '';
    let maxDensity = 0;

    for (const b of boxRatios) {
      const px = origin.x + dims.w * b.relX;
      const py = origin.y;
      const pw = dims.w * b.relW;
      const ph = dims.h;

      const density = measureDarkPixelDensity(ctx, px, py, pw, ph, 0.15);
      result.densities.turno[b.key] = parseFloat(density.toFixed(3));

      if (density > threshold && density > maxDensity) {
        maxDensity = density;
        bestKey = b.key;
      }
    }

    result.turno = bestKey;
  }

  // --- DETECCIÓN DE MOTIVO DE DESMONTAJE (12 casillas en tarjeta Naranja) ---
  if (cardType === 'naranja') {
    const motivoBox = template.fields?.motivoDesmontaje;
    if (motivoBox) {
      const origin = toCanvasPx(motivoBox.x, motivoBox.y);
      const dims = toCanvasDims(motivoBox.width, motivoBox.height);

      let bestMotivo: MotivoDesmontajeTipo | '' = '';
      let maxDensity = 0;
      result.densities.motivoDesmontaje = {};

      // 2 columnas de 6 motivos cada una
      for (let i = 0; i < MOTIVOS_DESMONTAJE.length; i++) {
        const motivo = MOTIVOS_DESMONTAJE[i];
        const isCol2 = i >= 6;
        const rowIndex = isCol2 ? i - 6 : i;

        // Sub-coordenadas de la casilla dentro del contenedor
        const colRelX = isCol2 ? 0.51 : 0.024;
        const rowRelY = 0.19 + rowIndex * 0.13;
        const boxRelW = 0.055;
        const boxRelH = 0.105;

        const px = origin.x + dims.w * colRelX;
        const py = origin.y + dims.h * rowRelY;
        const pw = dims.w * boxRelW;
        const ph = dims.h * boxRelH;

        const density = measureDarkPixelDensity(ctx, px, py, pw, ph, 0.15);
        result.densities.motivoDesmontaje[motivo] = parseFloat(density.toFixed(3));

        if (density > threshold && density > maxDensity) {
          maxDensity = density;
          bestMotivo = motivo;
        }
      }

      result.motivoDesmontaje = bestMotivo;
    }
  }

  return result;
}
