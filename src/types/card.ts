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
  'Análisis de herramientas necesario',
  'Fallo de operador',
  'Fallo de máquina',
] as const;

export type MotivoDesmontajeTipo = (typeof MOTIVOS_DESMONTAJE)[number];

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
