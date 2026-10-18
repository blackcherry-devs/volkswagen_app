export type CardType = 'naranja' | 'verde';

// Lista oficial de opciones para Motivo de Desmontaje
export const MOTIVOS_DESMONTAJE = [
  'Rotura',
  'Formación de rebaba',
  'Rugosidad alta',
  'Rugosidad baja',
  'Diámetro grande',
  'Diámetro pequeño',
  'Ángulo de especificación',
  'Forma fuera de especificación',
  'Despostilladura',
  'Análisis de herramienta necesaria',
  'Fallo de operador',
  'Fallo de máquina',
] as const;

export type MotivoDesmontajeTipo = (typeof MOTIVOS_DESMONTAJE)[number];

// Catálogo numerado del 1 al 12 para Motivos de Desmontaje (Simplifica llenado y OCR)
export const MOTIVOS_DESMONTAJE_CATALOG: { id: number; name: string; shortName: string }[] = [
  { id: 1, name: 'Rotura', shortName: 'Rotura' },
  { id: 2, name: 'Formación de rebaba', shortName: 'F. rebaba' },
  { id: 3, name: 'Rugosidad alta', shortName: 'Rugosidad alta' },
  { id: 4, name: 'Rugosidad baja', shortName: 'Rugosidad baja' },
  { id: 5, name: 'Diámetro grande', shortName: 'Diámetro grande' },
  { id: 6, name: 'Diámetro pequeño', shortName: 'Diámetro pequeño' },
  { id: 7, name: 'Ángulo de especificación', shortName: 'Ángulo especif.' },
  { id: 8, name: 'Forma fuera de especificación', shortName: 'Forma fuera especif.' },
  { id: 9, name: 'Despostilladura', shortName: 'Despostilladura' },
  { id: 10, name: 'Análisis de herramienta necesaria', shortName: 'Análisis herram.' },
  { id: 11, name: 'Fallo de operador', shortName: 'Fallo de operador' },
  { id: 12, name: 'Fallo de máquina', shortName: 'Fallo de máquina' },
];

export function getMotivoNameByCode(code: number | string): string | null {
  const num = parseInt(String(code).trim(), 10);
  if (isNaN(num)) return null;
  const found = MOTIVOS_DESMONTAJE_CATALOG.find((m) => m.id === num);
  return found ? found.name : null;
}

export function getMotivoCodeByName(name: string): number | null {
  if (!name) return null;
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const found = MOTIVOS_DESMONTAJE_CATALOG.find((m) => {
    const mClean = m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sClean = m.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return mClean === clean || mClean.includes(clean) || clean.includes(mClean) || sClean === clean;
  });
  return found ? found.id : null;
}

// Mapeo oficial de Centro de Costos (CC) a Línea de Producción
export const CENTRO_COSTOS_LINEAS: Record<string, string> = {
  '4002': 'ZKG EA888',
  '4004': 'KW EA888',
  '4005': 'PL EA888',
  '4003': 'ZK EA888',
  '4101': 'AVS EA888 NS',
  '4102': 'AVS EA888 GW',
  '4103': 'AVS EA888 PN',
  '4201': 'ZKG EA211',
  '4202': 'KW EA211',
  '4204': 'PL EA211',
  '4205': 'ZK EA211',
};

export function getLineaFromCentroCostos(centroCostos?: string): string {
  if (!centroCostos) return '—';
  const cleanCC = String(centroCostos).trim();
  return CENTRO_COSTOS_LINEAS[cleanCC] || 'Sin Asignar';
}

export interface BoundingBox {
  id: string;
  label: string;
  x: number;      // 0.0 to 1.0 (normalized percentage of width)
  y: number;      // 0.0 to 1.0 (normalized percentage of height)
  width: number;  // 0.0 to 1.0
  height: number; // 0.0 to 1.0
  type: 'handwritten' | 'printed' | 'checkbox' | 'comb';
}

export interface CardTemplate {
  id: string;
  name: string;
  color: CardType;
  title: string;
  subtitle: string;
  aspectRatio: number; // ej: 0.5 (alto en proporción a ancho, etiqueta colgante HSK 63)
  fiducialMarkers: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
  fields: Record<string, BoundingBox>;
}

// Data model for Cartoncillo Naranja
export interface OrangeCardData {
  centroCostos: string;       // 4 dígitos iniciando con 4 (ej. 4120)
  operacion: string;          // Ej. OP-20 RECTIFICADO
  numeroHerramienta: string;  // Inicia con T/t + hasta 5 números (ej. T-10425)
  maquina: string;            // 1 al 10
  husillo: string;            // 1 al 4
  tiempoVidaUtil: string;     // 1 a 7 dígitos
  motivoDesmontaje: string;   // Motivo de desmontaje (de las 12 casillas)
  observaciones?: string;     // Observaciones ampliadas / detalles de falla
  fecha: string;              // YYYY-MM-DD o DD/MM/AAAA
  turno: string;              // 1, 2 o 3
  nombre: string;             // Nombre operario
}

// Data model for Cartoncillo Verde
export interface GreenCardData {
  centroCostos: string;       // 4 dígitos iniciando con 4
  operacion: string;
  numeroHerramienta: string;  // Inicia con T/t + hasta 5 números
  maquina: string;            // 1 al 10
  husillo: string;            // 1 al 4
  tiempoVidaUtil: string;     // 1 a 7 dígitos
  observaciones?: string;     // Observaciones de producción
  fecha: string;
  turno: string;
  nombre: string;
}

export const SHARED_FIELD_KEYS = [
  'centroCostos',
  'operacion',
  'numeroHerramienta',
  'maquina',
  'husillo',
] as const;

export type SharedFieldKey = (typeof SHARED_FIELD_KEYS)[number];

// Modelo unificado de datos (RUPTURAS TOTAL - Ambas tarjetas requeridas)
export interface UnifiedRupturaData {
  // 5 Campos Compartidos (Cotejados y validados entre ambas tarjetas)
  centroCostos: string;       // 4 dígitos iniciando con 4 (ej. 4120)
  operacion: string;          // Ej. OP-20 FRESADO CARA
  numeroHerramienta: string;  // Inicia con T + números (ej. T-10452)
  maquina: string;            // 1 al 10
  husillo: string;            // 1 al 4

  // Campos Únicos de Tarjeta Verde (Inicial)
  fechaInicial: string;
  turnoInicial: string;
  nombreOperadorInicial: string;
  tiempoVidaUtilInicial?: string;
  observacionesInicial?: string;

  // Campos Únicos de Tarjeta Naranja (Desmontaje)
  fechaDesmontaje: string;
  turnoDesmontaje: string;
  nombreOperadorDesmontaje: string;
  tiempoVidaUtilDesmontaje: string;
  motivoDesmontaje: string;
  observacionesDesmontaje?: string;
}

// Estructura de formulario vacío para escaneo en limpio
export const EMPTY_UNIFIED_DATA: UnifiedRupturaData = {
  centroCostos: '',
  operacion: '',
  numeroHerramienta: '',
  maquina: '',
  husillo: '',
  fechaInicial: '',
  turnoInicial: '',
  nombreOperadorInicial: '',
  tiempoVidaUtilInicial: '',
  observacionesInicial: '',
  fechaDesmontaje: '',
  turnoDesmontaje: '',
  nombreOperadorDesmontaje: '',
  tiempoVidaUtilDesmontaje: '',
  motivoDesmontaje: '',
  observacionesDesmontaje: '',
};

export type AnyCardData = OrangeCardData | GreenCardData | UnifiedRupturaData;

export interface ExtractionResult<T = AnyCardData> {
  cardType: CardType;
  timestamp: string;
  imageUrl: string;
  normalizedImageUrl?: string;
  data: T;
  confidences: Record<string, number>;
  fieldFlags: Record<string, string | null>;
  overallConfidence: number;
}

export interface SavedRecord {
  id: string;
  capturedAt: string;
  verifiedAt: string;
  naranjaImageUrl?: string;
  verdeImageUrl?: string;
  syncStatus: 'synced_excel' | 'pending_sync' | 'error';
  excelRowNumber?: number;
  data: UnifiedRupturaData;
}
