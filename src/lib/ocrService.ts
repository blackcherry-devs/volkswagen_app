import { CardType, ExtractionResult, OrangeCardData, GreenCardData } from '@/types/card';
import { simulateExtractionPipeline } from '@/lib/mockData';

export interface OllamaStatus {
  online: boolean;
  modelAvailable: boolean;
  models: string[];
  targetModel: string;
  url: string;
  error?: string;
}

// Verifica el estado del servidor local de Ollama y del modelo LLaVA
export async function checkOllamaStatus(ollamaUrl?: string): Promise<OllamaStatus> {
  try {
    const url = ollamaUrl ? `/api/ocr?url=${encodeURIComponent(ollamaUrl)}` : '/api/ocr';
    const res = await fetch(url);
    if (!res.ok) {
      return {
        online: false,
        modelAvailable: false,
        models: [],
        targetModel: 'llava',
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
      targetModel: 'llava',
      url: ollamaUrl || 'http://127.0.0.1:11434',
      error: error?.message || 'Error de conexión',
    };
  }
}

// Ejecuta el reconocimiento con Ollama LLaVA en local (o fallback a simulación si no está activo)
export async function runOcrRecognition(
  cardType: CardType,
  imageUri: string,
  options?: {
    ollamaUrl?: string;
    model?: string;
    onProgress?: (step: string) => void;
  }
): Promise<{
  result: ExtractionResult;
  isRealOllama: boolean;
  statusMessage?: string;
}> {
  const onProgress = options?.onProgress;

  if (onProgress) onProgress('Verificando disponibilidad de Ollama LLaVA en local...');

  try {
    // Intentar llamar a la API local de Ollama LLaVA
    if (onProgress) onProgress('Enviando imagen a Ollama (modelo: llava)...');

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageUri,
        cardType,
        ollamaUrl: options?.ollamaUrl || 'http://127.0.0.1:11434',
        model: options?.model || 'llava',
      }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      if (onProgress) onProgress('¡Texto extraído con éxito por Ollama LLaVA!');

      const extractionResult: ExtractionResult = {
        cardType,
        timestamp: new Date().toISOString(),
        imageUrl: imageUri,
        data: data.data,
        confidences: data.confidences || {},
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
        overallConfidence: 96,
      };

      return {
        result: extractionResult,
        isRealOllama: true,
        statusMessage: `Inferencia completada en local con Ollama (${data.model || 'llava'}) en ${
          data.durationMs ? `${data.durationMs}ms` : 'tiempo real'
        }`,
      };
    }

    // Si Ollama no está online o devolvió error
    console.warn('[OCR Service] Ollama no disponible:', data?.error);
  } catch (err) {
    console.warn('[OCR Service] Error de conexión con endpoint Ollama:', err);
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
