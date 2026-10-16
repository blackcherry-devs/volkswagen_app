import { CardType } from '@/types/card';
import { getTemplate } from '@/lib/templates';
import { CardCorners, DEFAULT_CORNERS_NARANJA, DEFAULT_CORNERS_VERDE, interpolatePoint } from '@/lib/cornerDetection';

export interface CardCrops {
  regionA: string; // Base64: Cajetines numéricos (C.C. y No. de Herramienta)
  regionB: string; // Base64: Operación, Máquina y Tiempo de Vida Útil
  regionC: string; // Base64: Observaciones / Detalles manuscritos
  regionD: string; // Base64: Fecha y Nombre del Operador
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Canvas solo está disponible en el navegador'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para recortes ROI'));
    img.src = src;
  });
}

/**
 * Extrae recortes de alta resolución (ROI - Region of Interest) de las zonas de texto
 * del cartón para alimentar al modelo de visión con zooms nítidos libres de distorsión.
 */
export async function extractTextRegionCrops(
  imageSource: string | HTMLCanvasElement | HTMLImageElement,
  cardType: CardType,
  corners?: CardCorners
): Promise<CardCrops> {
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
    throw new Error('No se pudo inicializar el contexto de Canvas 2D');
  }

  const template = getTemplate(cardType);
  const activeCorners = corners || (cardType === 'naranja' ? DEFAULT_CORNERS_NARANJA : DEFAULT_CORNERS_VERDE);

  const xMin = template.fiducialMarkers?.topLeft?.x ?? 0.0525;
  const xMax = template.fiducialMarkers?.topRight?.x ?? 0.9475;
  const yMin = template.fiducialMarkers?.topLeft?.y ?? 0.3774;
  const yMax = template.fiducialMarkers?.bottomLeft?.y ?? 0.9642;

  // Proyecta un rectángulo normalizado (u, v, uw, vh) a coordenadas pixel reales en el canvas
  const cropSubRegion = (
    u: number,
    v: number,
    uw: number,
    vh: number,
    paddingRatio = 0.02
  ): string => {
    // Añadir margen de seguridad alrededor del texto
    const padU = uw * paddingRatio;
    const padV = vh * paddingRatio;

    const u0 = Math.max(0, u - padU);
    const v0 = Math.max(0, v - padV);
    const u1 = Math.min(1, u + uw + padU);
    const v1 = Math.min(1, v + vh + padV);

    const ptTL = interpolatePoint(activeCorners, u0, v0);
    const ptBR = interpolatePoint(activeCorners, u1, v1);

    const sx = Math.max(0, Math.round(ptTL.x * canvas.width));
    const sy = Math.max(0, Math.round(ptTL.y * canvas.height));
    const sw = Math.min(canvas.width - sx, Math.round((ptBR.x - ptTL.x) * canvas.width));
    const sh = Math.min(canvas.height - sy, Math.round((ptBR.y - ptTL.y) * canvas.height));

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(10, sw);
    cropCanvas.height = Math.max(10, sh);
    const cropCtx = cropCanvas.getContext('2d');

    if (cropCtx) {
      cropCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      return cropCanvas.toDataURL('image/jpeg', 0.92);
    }
    return '';
  };

  const getUV = (normX: number, normY: number, normW: number, normH: number) => ({
    u: (normX - xMin) / (xMax - xMin),
    v: (normY - yMin) / (yMax - yMin),
    uw: normW / (xMax - xMin),
    vh: normH / (yMax - yMin),
  });

  // --- REGIÓN A: Centro de Costos y No. de Herramienta ---
  // Abarca desde la cabecera / C.C. hasta No. de Herramienta
  const ccBox = template.fields?.centroCostos;
  const numBox = template.fields?.numeroHerramienta;
  const ccUV = ccBox ? getUV(ccBox.x, ccBox.y, ccBox.width, ccBox.height) : { u: 0.5, v: 0.04, uw: 0.45, vh: 0.08 };
  const numUV = numBox ? getUV(numBox.x, numBox.y, numBox.width, numBox.height) : { u: 0.05, v: 0.26, uw: 0.9, vh: 0.08 };

  const regA_U = 0.03;
  const regA_V = Math.max(0, ccUV.v - 0.02);
  const regA_UW = 0.94;
  const regA_VH = Math.max(0.25, (numUV.v + numUV.vh) - regA_V + 0.02);
  const regionA = cropSubRegion(regA_U, regA_V, regA_UW, regA_VH, 0.01);

  // --- REGIÓN B: Operación, Máquina y Tiempo de Vida Útil ---
  const opBox = template.fields?.operacion;
  const vidaBox = template.fields?.tiempoVidaUtil;
  const opUV = opBox ? getUV(opBox.x, opBox.y, opBox.width, opBox.height) : { u: 0.05, v: 0.16, uw: 0.9, vh: 0.07 };
  const vidaUV = vidaBox ? getUV(vidaBox.x, vidaBox.y, vidaBox.width, vidaBox.height) : { u: 0.05, v: 0.45, uw: 0.9, vh: 0.07 };

  const regB_U = 0.03;
  const regB_V = Math.max(0, opUV.v - 0.02);
  const regB_UW = 0.94;
  const regB_VH = Math.max(0.30, (vidaUV.v + vidaUV.vh) - regB_V + 0.02);
  const regionB = cropSubRegion(regB_U, regB_V, regB_UW, regB_VH, 0.01);

  // --- REGIÓN C: Observaciones / Detalles manuscritos ---
  const obsBox = template.fields?.observaciones;
  const obsUV = obsBox ? getUV(obsBox.x, obsBox.y, obsBox.width, obsBox.height) : { u: 0.04, v: 0.65, uw: 0.92, vh: 0.12 };
  const regionC = cropSubRegion(0.03, Math.max(0, obsUV.v - 0.02), 0.94, obsUV.vh + 0.04, 0.02);

  // --- REGIÓN D: Fecha y Nombre del Operador ---
  const fechaBox = template.fields?.fecha;
  const nomBox = template.fields?.nombre;
  const fechaUV = fechaBox ? getUV(fechaBox.x, fechaBox.y, fechaBox.width, fechaBox.height) : { u: 0.05, v: 0.78, uw: 0.9, vh: 0.06 };
  const nomUV = nomBox ? getUV(nomBox.x, nomBox.y, nomBox.width, nomBox.height) : { u: 0.05, v: 0.88, uw: 0.9, vh: 0.07 };

  const regD_U = 0.03;
  const regD_V = Math.max(0, fechaUV.v - 0.02);
  const regD_UW = 0.94;
  const regD_VH = Math.max(0.18, (nomUV.v + nomUV.vh) - regD_V + 0.03);
  const regionD = cropSubRegion(regD_U, regD_V, regD_UW, regD_VH, 0.01);

  return {
    regionA,
    regionB,
    regionC,
    regionD,
  };
}
