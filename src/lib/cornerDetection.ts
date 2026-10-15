export interface Point {
  x: number; // Coordenada normalizada de 0.0 a 1.0 (ancho)
  y: number; // Coordenada normalizada de 0.0 a 1.0 (alto)
}

export interface CardCorners {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

// Valores canónicos por defecto para cartoncillos HSK 63
export const DEFAULT_CORNERS_NARANJA: CardCorners = {
  topLeft: { x: 0.04, y: 0.05 },
  topRight: { x: 0.96, y: 0.05 },
  bottomLeft: { x: 0.04, y: 0.95 },
  bottomRight: { x: 0.96, y: 0.95 },
};

export const DEFAULT_CORNERS_VERDE: CardCorners = {
  topLeft: { x: 0.04, y: 0.05 },
  topRight: { x: 0.96, y: 0.05 },
  bottomLeft: { x: 0.04, y: 0.95 },
  bottomRight: { x: 0.96, y: 0.95 },
};

/**
 * Interpola bilinealmente un punto (u, v) en el rango [0, 1] hacia el cuadrilátero formado por las 4 esquinas.
 */
export function interpolatePoint(corners: CardCorners, u: number, v: number): Point {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = corners;
  const x = (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + (1 - u) * v * bl.x + u * v * br.x;
  const y = (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + (1 - u) * v * bl.y + u * v * br.y;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * Carga una imagen base64 o URL a un elemento HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen para detección'));
    img.src = src;
  });
}

/**
 * Detecta automáticamente las 4 esquinas/marcas del cartón analizando el color y contraste de la imagen.
 */
export async function detectCardCorners(
  imageUri: string,
  cardType: 'naranja' | 'verde'
): Promise<CardCorners> {
  try {
    const img = await loadImage(imageUri);
    const canvas = document.createElement('canvas');
    const targetW = 320;
    const targetH = Math.round(320 * (img.height / img.width));
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return cardType === 'naranja' ? { ...DEFAULT_CORNERS_NARANJA } : { ...DEFAULT_CORNERS_VERDE };

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    // Crear mapa de calor de píxeles pertenecientes al cartoncillo
    const mask = new Uint8Array(targetW * targetH);
    let totalCardPixels = 0;

    let minX = targetW;
    let maxX = 0;
    let minY = targetH;
    let maxY = 0;

    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const idx = (y * targetW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let isCard = false;
        if (cardType === 'naranja') {
          // Naranja industrial VW: Rojo alto, verde medio, azul bajo
          isCard = r > 115 && g > 55 && b < 140 && r > g * 1.15 && r > b * 1.45;
        } else {
          // Verde industrial VW: Verde dominante
          isCard = g > 85 && g > r * 1.08 && g > b * 1.05;
        }

        if (isCard) {
          mask[y * targetW + x] = 1;
          totalCardPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Si encontramos suficientes píxeles del cartón (> 4% de la foto)
    const cardRatio = totalCardPixels / (targetW * targetH);
    if (cardRatio > 0.04 && maxX > minX + 30 && maxY > minY + 30) {
      // Buscar esquinas dentro de las bandas superior e inferior del contorno
      const heightBand = Math.round((maxY - minY) * 0.15);

      // Top-Left & Top-Right en la banda superior
      let tlX = minX;
      let tlY = minY;
      let trX = maxX;
      let trY = minY;

      let minSumTL = Infinity;
      let maxSumTR = -Infinity;

      for (let y = minY; y <= minY + heightBand; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (mask[y * targetW + x]) {
            const sumTL = x + y;
            if (sumTL < minSumTL) {
              minSumTL = sumTL;
              tlX = x;
              tlY = y;
            }
            const diffTR = x - y;
            if (diffTR > maxSumTR) {
              maxSumTR = diffTR;
              trX = x;
              trY = y;
            }
          }
        }
      }

      // Bottom-Left & Bottom-Right en la banda inferior
      let blX = minX;
      let blY = maxY;
      let brX = maxX;
      let brY = maxY;

      let minDiffBL = Infinity;
      let maxSumBR = -Infinity;

      for (let y = maxY - heightBand; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (mask[y * targetW + x]) {
            const diffBL = x - y;
            if (diffBL < minDiffBL) {
              minDiffBL = diffBL;
              blX = x;
              blY = y;
            }
            const sumBR = x + y;
            if (sumBR > maxSumBR) {
              maxSumBR = sumBR;
              brX = x;
              brY = y;
            }
          }
        }
      }

      // Refinamiento de puntos oscuros (las 4 marcas de tinta en las esquinas)
      const refineCorner = (cx: number, cy: number): Point => {
        const radius = Math.round(targetW * 0.06);
        let darkestVal = 255;
        let bestX = cx;
        let bestY = cy;

        for (let dy = -radius; dy <= radius; dy++) {
          const py = cy + dy;
          if (py < 0 || py >= targetH) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const px = cx + dx;
            if (px < 0 || px >= targetW) continue;
            const pIdx = (py * targetW + px) * 4;
            const lum = data[pIdx] * 0.299 + data[pIdx + 1] * 0.587 + data[pIdx + 2] * 0.114;
            if (lum < darkestVal) {
              darkestVal = lum;
              bestX = px;
              bestY = py;
            }
          }
        }
        return {
          x: Math.max(0.01, Math.min(0.99, bestX / targetW)),
          y: Math.max(0.01, Math.min(0.99, bestY / targetH)),
        };
      };

      return {
        topLeft: refineCorner(tlX, tlY),
        topRight: refineCorner(trX, trY),
        bottomLeft: refineCorner(blX, blY),
        bottomRight: refineCorner(brX, brY),
      };
    }

    // Si la imagen ya es un cartón recortado que abarca casi toda la pantalla
    return cardType === 'naranja' ? { ...DEFAULT_CORNERS_NARANJA } : { ...DEFAULT_CORNERS_VERDE };
  } catch (error) {
    console.warn('[CornerDetection] Error detectando esquinas:', error);
    return cardType === 'naranja' ? { ...DEFAULT_CORNERS_NARANJA } : { ...DEFAULT_CORNERS_VERDE };
  }
}

/**
 * Corrige y endereza la perspectiva del cartón basándose en las 4 esquinas detectadas.
 * Produce una imagen limpia, recta y normalizada a alta resolución.
 */
export async function warpAndCropCard(
  imageUri: string,
  corners: CardCorners,
  targetWidth = 720,
  targetHeight = 1080
): Promise<string> {
  const img = await loadImage(imageUri);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return imageUri;

  const srcW = img.width;
  const srcH = img.height;

  // Cuadrícula de subdivisión 8x8 para una transformación de perspectiva fluida
  const steps = 8;
  const dw = targetWidth / steps;
  const dh = targetHeight / steps;

  for (let iy = 0; iy < steps; iy++) {
    for (let ix = 0; ix < steps; ix++) {
      // Coordenadas normalizadas de la celda [u, v]
      const u0 = ix / steps;
      const v0 = iy / steps;
      const u1 = (ix + 1) / steps;
      const v1 = (iy + 1) / steps;

      // Mapear los 4 vértices de la celda a la imagen original
      const p00 = interpolatePoint(corners, u0, v0);
      const p10 = interpolatePoint(corners, u1, v0);
      const p01 = interpolatePoint(corners, u0, v1);
      const p11 = interpolatePoint(corners, u1, v1);

      const dx0 = ix * dw;
      const dy0 = iy * dh;

      // Triángulo superior-izquierdo: p00, p10, p01
      renderTriangle(
        outCtx,
        img,
        p00.x * srcW, p00.y * srcH,
        p10.x * srcW, p10.y * srcH,
        p01.x * srcW, p01.y * srcH,
        dx0, dy0,
        dx0 + dw, dy0,
        dx0, dy0 + dh
      );

      // Triángulo inferior-derecho: p10, p11, p01
      renderTriangle(
        outCtx,
        img,
        p10.x * srcW, p10.y * srcH,
        p11.x * srcW, p11.y * srcH,
        p01.x * srcW, p01.y * srcH,
        dx0 + dw, dy0,
        dx0 + dw, dy0 + dh,
        dx0, dy0 + dh
      );
    }
  }

  return outCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Dibuja un triángulo texturizado con transformación afín
 */
function renderTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx0: number, sy0: number,
  sx1: number, sy1: number,
  sx2: number, sy2: number,
  dx0: number, dy0: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  // Matriz de transformación afín que mapea (sx, sy) a (dx, dy)
  const denom = sx0 * (sy1 - sy2) - sx1 * sy0 + sx2 * sy0 + sx1 * sy2 - sx2 * sy1;
  if (Math.abs(denom) > 1e-6) {
    const m11 = - (sy0 * (dx1 - dx2) - sy1 * dx0 + sy2 * dx0 + sy1 * dx2 - sy2 * dx1) / denom;
    const m12 = (sy1 * dy0 - sy2 * dy0 - sy0 * (dy1 - dy2) - sy1 * dy2 + sy2 * dy1) / denom;
    const m21 = (sx0 * (dx1 - dx2) - sx1 * dx0 + sx2 * dx0 + sx1 * dx2 - sx2 * dx1) / denom;
    const m22 = - (sx1 * dy0 - sx2 * dy0 - sx0 * (dy1 - dy2) - sx1 * dy2 + sx2 * dy1) / denom;
    const dx = (sx0 * (sy2 * dx1 - sy1 * dx2) + sy0 * (sx1 * dx2 - sx2 * dx1) + (sx2 * sy1 - sx1 * sy2) * dx0) / denom;
    const dy = (sx0 * (sy2 * dy1 - sy1 * dy2) + sy0 * (sx1 * dy2 - sx2 * dy1) + (sx2 * sy1 - sx1 * dy2) * dy0) / denom;

    ctx.transform(m11, m12, m21, m22, dx, dy);
    ctx.drawImage(img, 0, 0);
  }

  ctx.restore();
}
