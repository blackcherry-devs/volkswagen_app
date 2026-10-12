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

// Verifica el estado del servidor local de Ollama y del modelo GLM-OCR
export async function checkOllamaStatus(ollamaUrl?: string): Promise<OllamaStatus> {
  try {
    const url = ollamaUrl ? `/api/ocr?url=${encodeURIComponent(ollamaUrl)}` : '/api/ocr';
    const res = await fetch(url);
    if (!res.ok) {
      return {
        online: false,
        modelAvailable: false,
        models: [],
        targetModel: 'glm-ocr',
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
      targetModel: 'glm-ocr',
      url: ollamaUrl || 'http://127.0.0.1:11434',
      error: error?.message || 'Error de conexión',
    };
  }
}

// Ejecuta el reconocimiento con Ollama GLM-OCR en local (o fallback a simulación si no está activo)
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

  if (onProgress) onProgress('Verificando disponibilidad de Ollama GLM-OCR en local...');

  try {
    // Intentar llamar a la API local de Ollama GLM-OCR
    if (onProgress) onProgress('Enviando imagen a Ollama (modelo: glm-ocr)...');

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageUri,
        cardType,
        ollamaUrl: options?.ollamaUrl || 'http://127.0.0.1:11434',
        model: options?.model || 'glm-ocr',
      }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      if (onProgress) onProgress('¡Texto extraído con éxito por Ollama GLM-OCR!');

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
        statusMessage: `Inferencia completada en local con Ollama (${data.model || 'glm-ocr'}) en ${
          data.durationMs ? `${data.durationMs}ms` : 'tiempo real'
        }`,
      };
    }

    // Si Ollama no está online o devolvió error, usar fallback inteligente
    console.warn('[OCR Service] Ollama no disponible, recurriendo a simulación:', data.error);
  } catch (err) {
    console.warn('[OCR Service] Error de conexión con endpoint Ollama:', err);
  }

  // Fallback a simulación
  if (onProgress) onProgress('Ollama no activo. Generando lectura simulada para demostración...');
  const simulated = await simulateExtractionPipeline(cardType, imageUri, onProgress);

  return {
    result: simulated,
    isRealOllama: false,
    statusMessage:
      'Ollama GLM-OCR no detectado en local (puerto 11434). Mostrando datos de prueba. Ejecuta "ollama run glm-ocr" para activar inferencia real.',
  };
}
