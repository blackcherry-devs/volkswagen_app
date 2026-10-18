import { NextRequest, NextResponse } from 'next/server';
import { getMotivoNameByCode } from '@/types/card';

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-vl:7b';

// Función auxiliar para resolver el modelo exacto disponible en Ollama (qwen2.5-vl preferido -> llava fallback)
async function resolveOllamaModel(ollamaUrl: string, requestedModel: string): Promise<string> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return requestedModel;
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name || m.model || '');

    // 1. Prioridad máxima: Qwen2.5-VL (estado del arte en OCR manuscrito y visión)
    const qwenMatch = models.find((m) => m.toLowerCase().includes('qwen'));
    if (qwenMatch) return qwenMatch;

    // 2. Si LLaVA está disponible (fallback)
    const llavaMatch = models.find((m) => m.toLowerCase().includes('llava'));
    if (llavaMatch) return llavaMatch;

    // 3. Si hay algún otro modelo disponible
    return models[0] || requestedModel;
  } catch {
    return requestedModel;
  }
}

// Envía un prompt y una imagen a Ollama con timeout y reintentos limpios
async function queryOllamaVision(
  ollamaUrl: string,
  model: string,
  prompt: string,
  imageBase64: string,
  timeoutMs = 45000
): Promise<string> {
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      images: [cleanBase64],
      stream: false,
      options: {
        temperature: 0,
        num_predict: 512,
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return result.response || '';
}

// GET: Healthcheck para verificar si Ollama está corriendo y qué modelo está activo
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ollamaUrl = searchParams.get('url') || DEFAULT_OLLAMA_URL;

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
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
    const detectedModel = await resolveOllamaModel(ollamaUrl, DEFAULT_MODEL);
    const modelAvailable = models.length > 0;

    return NextResponse.json({
      online: true,
      modelAvailable,
      models,
      targetModel: detectedModel,
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

// POST: Procesar imagen o recortes ROI con el modelo de visión local
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      crops,
      cardType = 'naranja',
      ollamaUrl = DEFAULT_OLLAMA_URL,
      model = DEFAULT_MODEL,
    } = body;

    if (!imageBase64 && !crops) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó imagen base64 ni recortes de regiones' },
        { status: 400 }
      );
    }

    const activeModel = await resolveOllamaModel(ollamaUrl, model);
    const startTime = Date.now();
    let extractedData: any = {};
    let rawOutputCombined = '';

    const isQwen = activeModel.toLowerCase().includes('qwen');

    // ESTRATEGIA PRINCIPAL PARA QWEN2.5-VL: Inferencia directa sobre la tarjeta completa (1 única pasada en ~1s)
    if ((isQwen && imageBase64 && !body.forceRoi) || (!crops && imageBase64)) {
      console.log(`[OCR Full Qwen] Procesando tarjeta completa directamente con modelo ${activeModel}...`);
      const prompt = buildOcrPrompt(cardType);
      const rawOutput = await queryOllamaVision(ollamaUrl, activeModel, prompt, imageBase64);
      rawOutputCombined = rawOutput;
      extractedData = parseOcrResponse(rawOutput, cardType);
    } else if (crops && (crops.regionA || crops.regionB || crops.regionC || crops.regionD)) {
      // ESTRATEGIA SECUNDARIA: Pipeline de Recortes Enfocados (Crop ROI)
      console.log(`[OCR ROI] Procesando recortes enfocados con modelo ${activeModel}...`);

      const tasks: Promise<any>[] = [];

      // Región A: Cabecera e Identificación (C.C., Operación, No. de Herramienta)
      if (crops.regionA) {
        const promptA = `Look at this high-resolution crop of the tool card header:
Transcribe ONLY what is physically handwritten by human hand:
1. 'C.C.': Read the 4 handwritten digits inside the 4 boxes at the top right.
2. 'Operación': Read the handwritten text or digits written on the underline after 'Operación:'.
3. 'No. de Herramienta:': Read the tool number written on the line after the 'T' box.
STRICT RULE: Do NOT invent, extrapolate, or guess values. Transcribe ONLY what is visible. If blank, return "".
Return JSON only:
{"centroCostos": "", "operacion": "", "numeroHerramienta": ""}`;

        tasks.push(
          queryOllamaVision(ollamaUrl, activeModel, promptA, crops.regionA)
            .then((res) => {
              rawOutputCombined += `\n[Region A]: ${res}`;
              return parseJsonSafe(res);
            })
            .catch((err) => {
              console.warn('[OCR ROI Region A error]:', err.message);
              return {};
            })
        );
      }

      // Región B: Parámetros (Máquina, Husillo, Tiempo de Vida Útil)
      if (crops.regionB) {
        const promptB = `Look at this crop of the machine and tool life section:
Transcribe ONLY what is physically handwritten or marked:
1. 'Máquina': Read the single handwritten machine number written on the line after 'Máquina (1-10):'.
2. 'Husillo': Look at boxes 1, 2, 3, 4. Detect which boxes are marked with an X, checkmark, or stroke. One or more boxes can be marked. Return the marked numbers separated by comma (e.g. '1', '2', or '1, 2'). If none, return "".
3. 'Tiempo de vida útil': Read the piece count number written on the line for tool life ("Tiempo de vida útil" or "Tiempo de vida logrado").
STRICT RULE: Do NOT invent numbers. If a field is blank, return "".
Return JSON only:
{"maquina": "", "husillo": "", "tiempoVidaUtil": ""}`;

        tasks.push(
          queryOllamaVision(ollamaUrl, activeModel, promptB, crops.regionB)
            .then((res) => {
              rawOutputCombined += `\n[Region B]: ${res}`;
              return parseJsonSafe(res);
            })
            .catch((err) => {
              console.warn('[OCR ROI Region B error]:', err.message);
              return {};
            })
        );
      }

      // Región C: Observaciones
      if (crops.regionC) {
        const promptC = `Look at this crop containing the Observaciones box:
Transcribe the handwritten text written inside the white box.
STRICT RULE: Transcribe ONLY the actual handwritten words. Do NOT invent phrases or examples. If empty or blank, return "".
Return JSON only:
{"observaciones": ""}`;

        tasks.push(
          queryOllamaVision(ollamaUrl, activeModel, promptC, crops.regionC)
            .then((res) => {
              rawOutputCombined += `\n[Region C]: ${res}`;
              return parseJsonSafe(res);
            })
            .catch((err) => {
              console.warn('[OCR ROI Region C error]:', err.message);
              return {};
            })
        );
      }

      // Región D: Fecha, Turno y Nombre
      if (crops.regionD) {
        const promptD = `Look at this crop containing the control section:
1. 'Fecha': Read the handwritten date as written.
2. 'Turno': Look at boxes 1, 2, 3. If one has an X or cross, return its number ('1', '2', or '3').
3. 'Nombre': Read the handwritten operator name written on the line after 'Nombre'.
STRICT RULE: Transcribe ONLY what is physically written. Do NOT invent names, dates, or values.
Return JSON only:
{"fecha": "", "turno": "", "nombre": ""}`;

        tasks.push(
          queryOllamaVision(ollamaUrl, activeModel, promptD, crops.regionD)
            .then((res) => {
              rawOutputCombined += `\n[Region D]: ${res}`;
              return parseJsonSafe(res);
            })
            .catch((err) => {
              console.warn('[OCR ROI Region D error]:', err.message);
              return {};
            })
        );
      }

      // Región Motivos: Catálogo numerado 1 al 12 y cajetín N° MOTIVO (Tarjeta Naranja)
      if (crops.regionMotivos) {
        const promptMotivos = `Look at this crop of the Motivo de Desmontaje section. Notice there is a catalog numbered 1 to 12 and a large square box titled 'N° MOTIVO (DEL 1 AL 12)':
Read the handwritten number written inside the 'N° MOTIVO' box (a number from 1 to 12).
Catalog reference:
1 = Rotura
2 = Formación de rebaba
3 = Rugosidad alta
4 = Rugosidad baja
5 = Diámetro grande
6 = Diámetro pequeño
7 = Ángulo de especificación
8 = Forma fuera de especificación
9 = Despostilladura
10 = Análisis de herramienta necesaria
11 = Fallo de operador
12 = Fallo de máquina
Return the number (1-12) or the exact reason name. If blank, return "".
Return JSON only:
{"motivoDesmontaje": ""}`;

        tasks.push(
          queryOllamaVision(ollamaUrl, activeModel, promptMotivos, crops.regionMotivos)
            .then((res) => {
              rawOutputCombined += `\n[Region Motivos]: ${res}`;
              return parseJsonSafe(res);
            })
            .catch((err) => {
              console.warn('[OCR ROI Region Motivos error]:', err.message);
              return {};
            })
        );
      }

      // Ejecutar consultas de regiones
      const results = await Promise.all(tasks);
      for (const r of results) {
        Object.assign(extractedData, r);
      }
    } else {
      // ESTRATEGIA B: Fallback a imagen completa
      console.log(`[OCR Full] Enviando imagen completa a Ollama con modelo ${activeModel}...`);
      const prompt = buildOcrPrompt(cardType);
      const rawOutput = await queryOllamaVision(ollamaUrl, activeModel, prompt, imageBase64);
      rawOutputCombined = rawOutput;
      extractedData = parseOcrResponse(rawOutput, cardType);
    }

    // Normalizar datos extraídos
    const normalizedData = normalizeExtractedFields(extractedData, cardType);
    const confidences = calculateConfidences(normalizedData);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: 'ollama-vision',
      model: activeModel,
      data: normalizedData,
      confidences,
      rawOutput: rawOutputCombined,
      durationMs,
    });
  } catch (error: any) {
    console.error('[Ollama Vision Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al comunicarse con Ollama',
        provider: 'ollama-vision',
      },
      { status: 500 }
    );
  }
}

function parseJsonSafe(rawText: string): any {
  try {
    const mdMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const textToSearch = mdMatch ? mdMatch[1].trim() : rawText;
    const jsonMatch = textToSearch.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(cleaned);
    }
  } catch {}
  return {};
}

// Prompt de fallback para cuando se envía la tarjeta completa
function buildOcrPrompt(cardType: string): string {
  const isOrange = cardType === 'naranja';

  if (isOrange) {
    return `You are an expert industrial handwriting OCR transcription system for Volkswagen de México factory cards.
Carefully examine this cropped HSK 63 Orange Tool Control Card (Cartoncillo Naranja de Desmontaje) strictly in visual order from top to bottom:

1. Top-Right: 'C.C.' has 4 numbered boxes. Read the 4 handwritten digits inside the boxes.
2. 'Operación:': Read the handwritten text or digits written on the underline after 'Operación:'.
3. 'No. de Herramienta:': Read the tool ID or number written after the 'T' box.
4. 'Máquina (1-10):': Read the single machine number written on the line.
5. 'Husillo (1-4)': Look at the 4 square boxes labelled 1, 2, 3, 4. Detect which boxes contain a handwritten 'X', checkmark, or stroke. One or more boxes can be marked. Return the marked numbers separated by comma (e.g. "1" or "1, 2" or "2, 4").
6. 'Tiempo de vida útil logrado:': Read the number of pieces written on the line.
7. 'MOTIVO DE DESMONTAJE':
   Look at the 'MOTIVO DE DESMONTAJE' section. Notice there is a catalog numbered 1 to 12 and a large square box titled 'N° MOTIVO (DEL 1 AL 12)':
   Catalog:
   1: Rotura
   2: Formación de rebaba
   3: Rugosidad alta
   4: Rugosidad baja
   5: Diámetro grande
   6: Diámetro pequeño
   7: Ángulo de especificación
   8: Forma fuera de especificación
   9: Despostilladura
   10: Análisis de herramienta necesaria
   11: Fallo de operador
   12: Fallo de máquina
   Read the handwritten number (1-12) written inside the 'N° MOTIVO' box or any marked reason. Return the number (1-12) or the exact reason name.
8. 'OBSERVACIONES / DETALLES DE FALLA:': Read the handwritten text written inside the white box.
9. 'Fecha:': Read the handwritten date as written.
10. 'Turno:': Look at the shift checkboxes labelled 1°, 2°, 3°. Detect which checkbox has an 'X', checkmark, or stroke. Return ONLY "1", "2", or "3".
11. 'Nombre del Operador:': Read the full handwritten person name written on the line.

STRICT RULE: Transcribe ONLY what is physically written. Do NOT guess or invent numbers or text. If empty, return "".

Transcribe the fields into a valid JSON object with these exact keys:
{
  "centroCostos": "",
  "operacion": "",
  "numeroHerramienta": "",
  "maquina": "",
  "husillo": "",
  "tiempoVidaUtil": "",
  "motivoDesmontaje": "",
  "observaciones": "",
  "fecha": "",
  "turno": "",
  "nombre": ""
}

Return ONLY the raw JSON object. No explanations.`;
  }

  // Tarjeta Verde (Inicial / Seguimiento) - Nota: Observaciones ha sido retirada del diseño verde
  return `You are an expert industrial handwriting OCR transcription system for Volkswagen de México factory cards.
Carefully examine this cropped HSK 63 Green Tool Control Card (Cartoncillo Verde Inicial / Seguimiento) strictly in visual order from top to bottom:

1. Top-Right: 'C.C.' has 4 numbered boxes. Read the 4 handwritten digits inside the boxes.
2. 'Operación:': Read the handwritten text or digits written on the underline after 'Operación:'.
3. 'No. de Herramienta:': Read the tool ID or number written after the 'T' box.
4. 'Máquina (1-10):': Read the single machine number written on the line.
5. 'Husillo (1-4)': Look at the 4 square boxes labelled 1, 2, 3, 4. Detect which boxes contain a handwritten 'X', checkmark, or stroke. One or more boxes can be marked. Return the marked numbers separated by comma (e.g. "1" or "1, 2").
6. 'Tiempo de vida útil:': Read the number of pieces written on the line.
7. 'Fecha:': Read the handwritten date as written.
8. 'Turno:': Look at the shift checkboxes labelled 1°, 2°, 3°. Detect which checkbox has an 'X', checkmark, or stroke. Return ONLY "1", "2", or "3".
9. 'Nombre del Operador:': Read the full handwritten person name written on the line.

STRICT RULE: Transcribe ONLY what is physically written. Do NOT guess or invent numbers or text. If empty, return "".

Transcribe the fields into a valid JSON object with these exact keys:
{
  "centroCostos": "",
  "operacion": "",
  "numeroHerramienta": "",
  "maquina": "",
  "husillo": "",
  "tiempoVidaUtil": "",
  "fecha": "",
  "turno": "",
  "nombre": ""
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

  return normalizeExtractedFields(parsed, cardType);
}

function normalizeDate(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().replace(/[^\d/.-]/g, '');
  // Formato YYYY/MM/DD o YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Formato DD/MM/YYYY o DD-MM-YYYY (común en México)
  const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Formato DD/MM/YY
  const dmyShort = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShort) {
    const [, d, m, yy] = dmyShort;
    return `20${yy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return clean;
}

// Normaliza campos para asegurar tipos de datos consistentes y formatos oficiales
function normalizeExtractedFields(parsed: any, cardType: string): any {
  const cleanStr = (val: any, fallback = '') =>
    val !== undefined && val !== null ? String(val).trim() : fallback;

  // Centro de Costos: asegurar 4 dígitos
  let cc = cleanStr(parsed.centroCostos || parsed['c.c.'] || parsed['cc']);
  const ccDigits = cc.replace(/\D/g, '');
  if (ccDigits.length === 4 && ccDigits.startsWith('4')) {
    cc = ccDigits;
  } else if (ccDigits.length > 0 && ccDigits.startsWith('4')) {
    cc = ccDigits.padEnd(4, '0');
  }

  // Operación: limpiar prefijos como 'Operación:'
  let operacion = cleanStr(parsed.operacion || parsed['operación']).replace(/^operaci[oó]n:?\s*/i, '');

  // No. Herramienta: asegurar formato T-XXXXX
  let numHerramienta = cleanStr(parsed.numeroHerramienta || parsed['herramienta']).replace(/^no\.?\s*(?:de\s*)?herramienta:?\s*/i, '');
  if (/^\d+$/.test(numHerramienta)) {
    numHerramienta = `T-${numHerramienta}`;
  }

  // Máquina: extraer número del 1 al 10
  let maquina = cleanStr(parsed.maquina || parsed['máquina']);
  const maqMatch = maquina.match(/\b(10|[1-9])\b/);
  if (maqMatch) maquina = maqMatch[1];

  // Husillo: extraer uno o más dígitos del 1 al 4 (permite multiselección: ej. "1, 2")
  let husillo = cleanStr(parsed.husillo);
  const husDigits = [...new Set((husillo.match(/[1-4]/g) || []))].sort();
  if (husDigits.length > 0) {
    husillo = husDigits.join(', ');
  }

  // Turno: extraer dígito del 1 al 3 incluso si viene como "1°", "Turno 2", "T-3", etc.
  let turno = cleanStr(parsed.turno);
  const turnoMatch = turno.match(/(?:turno\s*|t-?)?([1-3])/i);
  if (turnoMatch) turno = turnoMatch[1];

  const result: any = {
    centroCostos: cc,
    operacion,
    numeroHerramienta: numHerramienta,
    maquina,
    husillo,
    tiempoVidaUtil: cleanStr(parsed.tiempoVidaUtil || parsed['vidaUtil']).replace(/\D/g, ''),
    fecha: normalizeDate(cleanStr(parsed.fecha)),
    turno,
    nombre: cleanStr(parsed.nombre || parsed['operador']),
    observaciones: cleanStr(parsed.observaciones),
  };

  if (cardType === 'verde') {
    delete result.observaciones;
  }

  if (cardType === 'naranja') {
    const rawVal = cleanStr(
      parsed.motivoDesmontaje || parsed['motivo'] || parsed['motivo_desmontaje'] || ''
    );

    // 1. Probar si el operador escribió un número del 1 al 12 en el cajetín "N° MOTIVO"
    const numMatch = rawVal.match(/\b(1[0-2]|[1-9])\b/);
    if (numMatch) {
      const code = parseInt(numMatch[1], 10);
      const nameFromCode = getMotivoNameByCode(code);
      if (nameFromCode) {
        result.motivoDesmontaje = nameFromCode;
        return result;
      }
    }

    // 2. Mapeo textual por si escribió o reconoció el nombre del defecto
    const rawMotivo = rawVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos para matching robusto

    const MOTIVOS_MAP: Record<string, string> = {
      rotura: 'Rotura',
      rebaba: 'Formación de rebaba',
      formacion: 'Formación de rebaba',
      'rugosidad alta': 'Rugosidad alta',
      'rugosidad baja': 'Rugosidad baja',
      'diametro grande': 'Diámetro grande',
      'diametro pequeno': 'Diámetro pequeño',
      'diametro peque': 'Diámetro pequeño',
      pequeno: 'Diámetro pequeño',
      pequeno_dim: 'Diámetro pequeño',
      angulo: 'Ángulo de especificación',
      especificacion: 'Forma fuera de especificación',
      forma: 'Forma fuera de especificación',
      despostilladura: 'Despostilladura',
      desportilladura: 'Despostilladura',
      despostillado: 'Despostilladura',
      desportillado: 'Despostilladura',
      chipping: 'Despostilladura',
      analisis: 'Análisis de herramienta necesaria',
      'analisis de herramienta': 'Análisis de herramienta necesaria',
      'analisis de herramientas': 'Análisis de herramienta necesaria',
      'herramienta necesaria': 'Análisis de herramienta necesaria',
      'fallo de operador': 'Fallo de operador',
      operador: 'Fallo de operador',
      'fallo de maquina': 'Fallo de máquina',
      maquina: 'Fallo de máquina',
    };

    let matched: string | null = null;
    for (const [key, canonical] of Object.entries(MOTIVOS_MAP)) {
      if (rawMotivo.includes(key) || key.includes(rawMotivo)) {
        matched = canonical;
        break;
      }
    }

    result.motivoDesmontaje = matched || rawVal;
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
  conf.husillo = (data.husillo || '').split(',').every((h: string) => ['1', '2', '3', '4'].includes(h.trim())) && (data.husillo || '').length > 0 ? 98 : 70;
  conf.tiempoVidaUtil = /^\d{1,7}$/.test(data.tiempoVidaUtil) ? 95 : 70;
  conf.fecha = (data.fecha || '').length >= 6 ? 96 : 70;
  conf.turno = ['1', '2', '3'].includes(data.turno) ? 98 : 75;
  conf.nombre = (data.nombre || '').length >= 3 ? 92 : 65;
  conf.motivoDesmontaje = 95;
  conf.observaciones = (data.observaciones || '').length > 0 ? 91 : 85;

  return conf;
}
