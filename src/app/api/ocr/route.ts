import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llava';

// Función auxiliar para resolver el modelo exacto disponible en Ollama
async function resolveOllamaModel(ollamaUrl: string, requestedModel: string): Promise<string> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return requestedModel;
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name || m.model || '');
    
    // Si el modelo pedido existe exactamente, usarlo
    if (models.includes(requestedModel)) return requestedModel;

    // Si pidieron llava o llava:7b, buscar cualquier variación de llava instalada
    if (requestedModel.toLowerCase().includes('llava')) {
      const match = models.find((m) => m.toLowerCase().includes('llava'));
      if (match) return match;
    }

    return requestedModel;
  } catch {
    return requestedModel;
  }
}

// GET: Healthcheck para verificar si Ollama está corriendo y si llava está descargado
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ollamaUrl = searchParams.get('url') || DEFAULT_OLLAMA_URL;

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3 segundos timeout
    });

    if (!res.ok) {
      return NextResponse.json({
        online: false,
        modelAvailable: false,
        error: `Ollama respondió con código ${res.status}`,
        url: ollamaUrl,
      });
    }

    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name || m.model || '');
    const detectedLlava = models.find((m) => m.toLowerCase().includes('llava'));
    const modelAvailable = !!detectedLlava;

    return NextResponse.json({
      online: true,
      modelAvailable,
      models,
      targetModel: detectedLlava || DEFAULT_MODEL,
      url: ollamaUrl,
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      modelAvailable: false,
      error: error?.message || 'No se pudo conectar a Ollama',
      url: ollamaUrl,
    });
  }
}

// POST: Procesar imagen con Ollama LLaVA (vision model)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, cardType, ollamaUrl = DEFAULT_OLLAMA_URL, model = DEFAULT_MODEL } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó la imagen en formato base64' },
        { status: 400 }
      );
    }

    // Resolver el nombre exacto de modelo disponible en Ollama (ej. 'llava' vs 'llava:7b')
    const activeModel = await resolveOllamaModel(ollamaUrl, model);

    // Limpiar el encabezado data:image/...;base64, si viene incluido
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    // Construir prompt especializado para LLaVA según el tipo de cartón
    const prompt = buildOcrPrompt(cardType || 'naranja');

    console.log(`[Ollama LLaVA] Enviando solicitud a ${ollamaUrl}/api/generate con modelo ${activeModel}...`);

    // Llamada directa al endpoint nativo de visión de Ollama (/api/generate)
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        images: [cleanBase64],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 1024,
        },
      }),
      signal: AbortSignal.timeout(60000), // 60 segundos timeout para inferencia local
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Error de Ollama (${ollamaResponse.status}): ${errText}`,
          provider: 'ollama-llava',
        },
        { status: 502 }
      );
    }

    const result = await ollamaResponse.json();
    const rawOutput = result.response || '';

    // Extraer y normalizar los datos estructurados devueltos por GLM-OCR
    const extractedData = parseOcrResponse(rawOutput, cardType || 'naranja');

    // Confianzas simuladas / calibradas del modelo
    const confidences = calculateConfidences(extractedData);

    return NextResponse.json({
      success: true,
      provider: 'ollama-llava',
      model,
      data: extractedData,
      confidences,
      rawOutput,
      durationMs: result.total_duration ? Math.round(result.total_duration / 1e6) : undefined,
    });
  } catch (error: any) {
    console.error('[Ollama LLaVA Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al comunicarse con Ollama LLaVA',
        provider: 'ollama-llava',
      },
      { status: 500 }
    );
  }
}

// Prompt para LLaVA adaptado a los cartoncillos HSK 63 de Volkswagen de México
function buildOcrPrompt(cardType: string): string {
  const isOrange = cardType === 'naranja';

  if (isOrange) {
    return `You are a high-precision OCR system for Volkswagen de México factory cards.
Look at this HSK 63 Orange Tool Control Card (Cartoncillo Naranja de Desmontaje).
Read ONLY the real handwritten ballpoint pen text and printed characters physically present on the card.
DO NOT use placeholder names, sample numbers or fictitious data.
If a field is empty, not filled or not legible, set its value strictly to "".

Transcribe the fields into a valid JSON object with these exact keys:
{
  "centroCostos": "Read the 4 digits handwritten in the C.C. boxes at top-right (starts with 4)",
  "operacion": "Text handwritten after 'Operación:'",
  "numeroHerramienta": "Tool number written after 'No. de Herramienta:' (starts with T)",
  "maquina": "Number (1 to 10) written under 'Máquina'",
  "husillo": "Checked or written spindle box (1 to 4) under 'Husillo'",
  "tiempoVidaUtil": "Digits written under 'Tiempo de vida útil logrado'",
  "fecha": "Date handwritten on the card (format DD/MM/AAAA or YYYY-MM-DD)",
  "turno": "Shift number (1, 2 or 3) marked under 'Turno'",
  "nombre": "Operator name handwritten under 'Nombre del Operador'",
  "motivoDesmontaje": "Reason marked with an X among: Rotura, Formación de rebaba, Rugosidad alta, Rugosidad baja, Diámetro grande, Diámetro pequeño, Ángulo de especificación, Forma fuera de especificación, Despostilladura, Análisis de herramientas necesario, Fallo de operador, Fallo de máquina",
  "observaciones": "Any handwritten notes written under 'OBSERVACIONES / DETALLES DE FALLA'"
}

Return ONLY the raw JSON object. No explanations.`;
  }

  // Tarjeta Verde (Inicial / Seguimiento)
  return `You are a high-precision OCR system for Volkswagen de México factory cards.
Look at this HSK 63 Green Tool Control Card (Cartoncillo Verde Inicial / Seguimiento).
Read ONLY the real handwritten ballpoint pen text and printed characters physically present on the card.
DO NOT use placeholder names, sample numbers or fictitious data.
If a field is empty, not filled or not legible, set its value strictly to "".

Transcribe the fields into a valid JSON object with these exact keys:
{
  "centroCostos": "Read the 4 digits handwritten in the C.C. boxes at top-right (starts with 4)",
  "operacion": "Text handwritten after 'Operación:'",
  "numeroHerramienta": "Tool number written after 'No. de Herramienta:' (starts with T)",
  "maquina": "Number (1 to 10) written under 'Máquina'",
  "husillo": "Checked or written spindle box (1 to 4) under 'Husillo'",
  "tiempoVidaUtil": "Digits written under 'Tiempo de vida útil'",
  "fecha": "Date handwritten on the card (format DD/MM/AAAA or YYYY-MM-DD)",
  "turno": "Shift number (1, 2 or 3) marked under 'Turno'",
  "nombre": "Operator name handwritten under 'Nombre'",
  "observaciones": "Any handwritten notes written under 'OBSERVACIONES DE PRODUCCIÓN / CALIDAD'"
}

Return ONLY the raw JSON object. No explanations.`;
}

// Extrae el objeto JSON de la respuesta de texto del modelo de visión
function parseOcrResponse(rawText: string, cardType: string): any {
  let parsed: any = null;

  // 1. Intentar extraer JSON de bloque markdown (```json ... ``` o ``` ... ```)
  const mdMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const textToSearch = mdMatch ? mdMatch[1].trim() : rawText;

  // 2. Buscar el bloque JSON completo con match greedy (de { hasta el último })
  const jsonMatch = textToSearch.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // JSON malformado, intentar limpieza básica quitando trailing commas
      try {
        const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(cleaned);
      } catch {
        // Ignorar, se usará regex fallback
      }
    }
  }

  // 2. Si no se pudo parsear como JSON directo, extraer mediante expresiones regulares
  if (!parsed || typeof parsed !== 'object') {
    parsed = {};

    // Extraer Centro de Costos
    const ccMatch = rawText.match(/(?:centroCostos|c\.?c\.?|cc)["\s:]+([4]\d{3})/i);
    if (ccMatch) parsed.centroCostos = ccMatch[1];

    // Extraer No. Herramienta
    const toolMatch = rawText.match(/(?:numeroHerramienta|herramienta|broca|t)["\s:]+([Tt]-?\d{1,5})/i);
    if (toolMatch) parsed.numeroHerramienta = toolMatch[1];

    // Extraer Máquina
    const maqMatch = rawText.match(/(?:maquina|máquina|m)["\s:]+(\d{1,2})/i);
    if (maqMatch) parsed.maquina = maqMatch[1];

    // Extraer Husillo
    const husMatch = rawText.match(/(?:husillo|h)["\s:]+([1-4])/i);
    if (husMatch) parsed.husillo = husMatch[1];

    // Extraer Turno
    const turnoMatch = rawText.match(/(?:turno)["\s:]+([1-3])/i);
    if (turnoMatch) parsed.turno = turnoMatch[1];

    // Extraer Vida Útil
    const vidaMatch = rawText.match(/(?:tiempoVidaUtil|vidaUtil|vida)["\s:]+(\d{1,7})/i);
    if (vidaMatch) parsed.tiempoVidaUtil = vidaMatch[1];
  }

  // Normalizar campos para asegurar tipos de datos consistentes
  const cleanStr = (val: any, fallback = '') =>
    val !== undefined && val !== null ? String(val).trim() : fallback;

  // Centro de Costos: asegurar 4 dígitos
  let cc = cleanStr(parsed.centroCostos || parsed['c.c.'] || parsed['cc']);
  const ccDigits = cc.replace(/\D/g, '');
  if (ccDigits.length === 4 && ccDigits.startsWith('4')) {
    cc = ccDigits;
  }

  // No. Herramienta: asegurar formato T-XXXXX
  let numHerramienta = cleanStr(parsed.numeroHerramienta || parsed['herramienta']);
  if (/^\d+$/.test(numHerramienta)) {
    numHerramienta = `T-${numHerramienta}`;
  }

  const result: any = {
    centroCostos: cc,
    operacion: cleanStr(parsed.operacion || parsed['operación']),
    numeroHerramienta: numHerramienta,
    maquina: cleanStr(parsed.maquina || parsed['máquina']),
    husillo: cleanStr(parsed.husillo),
    tiempoVidaUtil: cleanStr(parsed.tiempoVidaUtil || parsed['vidaUtil']).replace(/\D/g, ''),
    fecha: cleanStr(parsed.fecha),
    turno: cleanStr(parsed.turno).replace(/\D/g, ''),
    nombre: cleanStr(parsed.nombre || parsed['operador']),
    observaciones: cleanStr(parsed.observaciones),
  };

  if (cardType === 'naranja') {
    result.motivoDesmontaje = cleanStr(
      parsed.motivoDesmontaje || parsed['motivo'] || parsed['motivo_desmontaje'] || ''
    );
  }

  return result;
}

// Asignar puntuaciones de confianza basadas en la coherencia de los campos
function calculateConfidences(data: any): Record<string, number> {
  const conf: Record<string, number> = {};

  conf.centroCostos = /^4\d{3}$/.test(data.centroCostos) ? 98 : 75;
  conf.operacion = (data.operacion || '').length > 3 ? 94 : 70;
  conf.numeroHerramienta = /^[Tt]-?\d{1,5}$/.test(data.numeroHerramienta) ? 97 : 72;
  conf.maquina = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(data.maquina) ? 99 : 68;
  conf.husillo = ['1', '2', '3', '4'].includes(data.husillo) ? 98 : 70;
  conf.tiempoVidaUtil = /^\d{1,7}$/.test(data.tiempoVidaUtil) ? 95 : 70;
  conf.fecha = (data.fecha || '').length >= 6 ? 96 : 70;
  conf.turno = ['1', '2', '3'].includes(data.turno) ? 98 : 75;
  conf.nombre = (data.nombre || '').length >= 3 ? 92 : 65;
  conf.motivoDesmontaje = 95;
  conf.observaciones = (data.observaciones || '').length > 0 ? 91 : 85;

  return conf;
}
