import { CardType, ExtractionResult, OrangeCardData, GreenCardData } from '@/types/card';
import { simulateExtractionPipeline } from '@/lib/mockData';
import { CardCorners } from '@/lib/cornerDetection';
import { detectCheckboxesFromImage, CheckboxDetectionResult } from '@/lib/checkboxDetector';
import { extractTextRegionCrops, CardCrops } from '@/lib/cropRoiExtractor';

export interface OllamaStatus {
  online: boolean;
  modelAvailable: boolean;
  models: string[];
  targetModel: string;
  url: string;
  error?: string;
}

// Verifica el estado del servidor local de Ollama
export async function checkOllamaStatus(ollamaUrl?: string): Promise<OllamaStatus> {
  try {
    const url = ollamaUrl ? `/api/ocr?url=${encodeURIComponent(ollamaUrl)}` : '/api/ocr';
    const res = await fetch(url);
    if (!res.ok) {
      return {
        online: false,
        modelAvailable: false,
        models: [],
        targetModel: 'qwen2.5-vl:7b',
        url: ollamaUrl || 'http://127.0.0.1:11434',
        error: `Servidor HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      online: false,
      modelAvailable: false,
      models: [],
      targetModel: 'qwen2.5-vl:7b',
      url: ollamaUrl || 'http://127.0.0.1:11434',
      error: error?.message || 'Error de conexión',
    };
  }
}

// Ejecuta el reconocimiento con la Arquitectura Híbrida:
// 1. Detección algorítmica de checkboxes (husillo, turno, motivos) mediante densidad de píxeles (<10ms)
// 2. Extracción de recortes ROI de alta resolución (Regiones A, B, C, D)
// 3. Inferencia de visión local con Ollama (qwen2.5-vl / LLaVA) sobre los recortes ROI nítidos
export async function runOcrRecognition(
  cardType: CardType,
  imageUri: string,
  options?: {
    ollamaUrl?: string;
    model?: string;
    corners?: CardCorners;
    forceRoi?: boolean;
    onProgress?: (step: string) => void;
  }
): Promise<{
  result: ExtractionResult;
  isRealOllama: boolean;
  statusMessage?: string;
}> {
  const onProgress = options?.onProgress;

  let checkboxResult: CheckboxDetectionResult | null = null;
  let crops: CardCrops | null = null;

  // Fase 1: Análisis algorítmico rápido de casillas (<10ms)
  if (typeof window !== 'undefined') {
    try {
      if (onProgress) onProgress('1/2: Analizando casillas marcadas...');
      checkboxResult = await detectCheckboxesFromImage(imageUri, cardType, options?.corners);
      console.log('[OCR Service] Casillas detectadas algorítmicamente:', checkboxResult);
    } catch (e) {
      console.warn('[OCR Service] Error en detección de casillas:', e);
    }

    // Solo extrae recortes pesados si se pide explícitamente el modo ROI
    if (options?.forceRoi) {
      try {
        if (onProgress) onProgress('Extrayendo recortes ROI de alta resolución...');
        crops = await extractTextRegionCrops(imageUri, cardType, options?.corners);
      } catch (e) {
        console.warn('[OCR Service] Error al extraer recortes ROI:', e);
      }
    }
  }

  try {
    if (onProgress) onProgress('2/2: Extrayendo datos con visión inteligente Qwen2.5-VL...');

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageUri,
        crops: crops || undefined,
        forceRoi: options?.forceRoi || false,
        cardType,
        ollamaUrl: options?.ollamaUrl || 'http://127.0.0.1:11434',
        model: options?.model || 'qwen2.5vl:latest',
      }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      if (onProgress) onProgress('¡Texto extraído con éxito por visión local!');

      // Fusionar resultados de checkboxes algorítmicos con texto extraído por Ollama de forma inteligente
      const mergedData = { ...data.data };
      const confidences = { ...(data.confidences || {}) };

      if (checkboxResult) {
        // Husillo: Si Ollama detectó un husillo válido con visión ('1' | '2' | '3' | '4'),
        // solo sobreescribir si el detector de densidad tiene un contraste dominante evidente
        if (checkboxResult.husillo) {
          const husilloDensities = Object.values(checkboxResult.densities.husillo || {});
          const maxD = Math.max(...husilloDensities, 0);
          const avgD = husilloDensities.length > 0
            ? husilloDensities.reduce((a, b) => a + b, 0) / husilloDensities.length
            : 0;
          if (!mergedData.husillo || (maxD > 0.12 && maxD > avgD * 1.35)) {
            mergedData.husillo = checkboxResult.husillo;
            confidences.husillo = 96;
          }
        }

        // Turno: Detección algorítmica muy confiable en las 3 casillas
        if (checkboxResult.turno) {
          if (!mergedData.turno || (confidences.turno ?? 0) < 80) {
            mergedData.turno = checkboxResult.turno;
            confidences.turno = 98;
          }
        }

        // Motivo de desmontaje (solo naranja)
        if (cardType === 'naranja') {
          const orange = mergedData as OrangeCardData;
          if (checkboxResult.motivoDesmontaje) {
            const motivoDensities = Object.values(checkboxResult.densities.motivoDesmontaje || {});
            const maxMD = Math.max(...motivoDensities, 0);
            const avgMD = motivoDensities.length > 0
              ? motivoDensities.reduce((a, b) => a + b, 0) / motivoDensities.length
              : 0;
            // Si la visión de Ollama no detectó o si el detector algorítmico tiene un pico de tinta claro
            if (!orange.motivoDesmontaje || (maxMD > 0.14 && maxMD > avgMD * 1.5)) {
              orange.motivoDesmontaje = checkboxResult.motivoDesmontaje;
              confidences.motivoDesmontaje = 96;
            }
          }
        }
      }

      const extractionResult: ExtractionResult = {
        cardType,
        timestamp: new Date().toISOString(),
        imageUrl: imageUri,
        data: mergedData,
        confidences,
        fieldFlags: {
          centroCostos: null,
          numeroHerramienta: null,
          maquina: null,
          husillo: null,
          tiempoVidaUtil: null,
          fecha: null,
          turno: null,
          nombre: null,
        },
        overallConfidence: 97,
      };

      return {
        result: extractionResult,
        isRealOllama: true,
        statusMessage: `Inferencia híbrida completada (${data.model || 'qwen2.5-vl'}) en ${
          data.durationMs ? `${data.durationMs}ms` : 'tiempo real'
        }`,
      };
    }

    console.warn('[OCR Service] Ollama no disponible o error:', data?.error);
  } catch (err) {
    console.warn('[OCR Service] Error de conexión con endpoint OCR:', err);
  }

  // Comprobar si la imagen es una muestra sintética SVG explícita o una foto real
  const isSyntheticSvg = imageUri.startsWith('data:image/svg') || imageUri.includes('<svg');

  if (isSyntheticSvg) {
    // Si el usuario cargó deliberadamente la tarjeta de muestra, simulamos la lectura
    if (onProgress) onProgress('Procesando cartón sintético de muestra...');
    const simulated = await simulateExtractionPipeline(cardType, imageUri, onProgress);
    return {
      result: simulated,
      isRealOllama: false,
      statusMessage: 'Cartón sintético de muestra cargado.',
    };
  }

  // Si es una foto real y Ollama NO está activo: NO inventar datos de mockup
  const emptyCardData =
    cardType === 'naranja'
      ? {
          centroCostos: '',
          operacion: '',
          numeroHerramienta: '',
          maquina: '',
          husillo: '',
          tiempoVidaUtil: '',
          motivoDesmontaje: '',
          observaciones: '',
          fecha: '',
          turno: '',
          nombre: '',
        }
      : {
          centroCostos: '',
          operacion: '',
          numeroHerramienta: '',
          maquina: '',
          husillo: '',
          tiempoVidaUtil: '',
          observaciones: '',
          fecha: '',
          turno: '',
          nombre: '',
        };

  return {
    result: {
      cardType,
      timestamp: new Date().toISOString(),
      imageUrl: imageUri,
      data: emptyCardData as any,
      confidences: {},
      fieldFlags: {},
      overallConfidence: 0,
    },
    isRealOllama: false,
    statusMessage:
      '⚠️ Ollama no está activo en tu máquina (puerto 11434). Tu foto fue recibida pero no se puede procesar sin el motor local. Inicia Ollama con "ollama run llava" para activar la extracción real.',
  };
}
