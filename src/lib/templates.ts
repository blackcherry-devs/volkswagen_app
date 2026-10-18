import { CardTemplate, CardType } from '@/types/card';

export const LS_KEY_NARANJA_TEMPLATE = 'vw_card_template_naranja_v6';
export const LS_KEY_VERDE_TEMPLATE   = 'vw_card_template_verde_v6';

// Plantilla Cartoncillo Naranja HSK 63 (Con arco superior de 40mm radio, hoyo de 55.5mm y 10 campos oficiales)
export const ORANGE_CARD_TEMPLATE: CardTemplate = {
  id: 'VW-HSK63-ORG-V2',
  name: 'Tarjeta Colgante Naranja HSK 63 (Desmontaje - 10 Campos)',
  color: 'naranja',
  title: 'HSK 63 VOLKSWAGEN DE MÉXICO',
  subtitle: 'CONTROL DE HERRAMIENTA & REGISTRO DE DESMONTAJE',
  aspectRatio: 80 / 190, // 80 mm ancho / 190 mm alto = 0.42105 (proporción física real)
  fiducialMarkers: {
    topLeft: { x: 0.0525, y: 0.3774 },
    topRight: { x: 0.9475, y: 0.3774 },
    bottomLeft: { x: 0.0525, y: 0.9642 },
    bottomRight: { x: 0.9475, y: 0.9642 },
  },
  fields: {
    centroCostos: {
      id: 'centroCostos',
      label: '1) Centro de Costos (C.C.)',
      x: 0.5419,
      y: 0.3858,
      width: 0.3251,
      height: 0.0410,
      type: 'comb',
    },
    operacion: {
      id: 'operacion',
      label: '2) Operación',
      x: 0.0793,
      y: 0.4592,
      width: 0.8526,
      height: 0.0351,
      type: 'handwritten',
    },
    numeroHerramienta: {
      id: 'numeroHerramienta',
      label: '3) No. de Herramienta',
      x: 0.0793,
      y: 0.5239,
      width: 0.8426,
      height: 0.0291,
      type: 'comb',
    },
    maquina: {
      id: 'maquina',
      label: '4) Máquina (1-10)',
      x: 0.0793,
      y: 0.5767,
      width: 0.3430,
      height: 0.0261,
      type: 'handwritten',
    },
    husillo: {
      id: 'husillo',
      label: '5) Husillo (1-4)',
      x: 0.6262,
      y: 0.5797,
      width: 0.2367,
      height: 0.0261,
      type: 'checkbox',
    },
    tiempoVidaUtil: {
      id: 'tiempoVidaUtil',
      label: '6) Tiempo Vida Logrado',
      x: 0.0793,
      y: 0.6235,
      width: 0.8276,
      height: 0.0381,
      type: 'handwritten',
    },
    motivoDesmontaje: {
      id: 'motivoDesmontaje',
      label: '10) Motivo de Desmontaje (N° 1-12)',
      x: 0.0883,
      y: 0.6550,
      width: 0.4500,
      height: 0.0260,
      type: 'comb',
    },
    observaciones: {
      id: 'observaciones',
      label: 'Observaciones / Falla',
      x: 0.0793,
      y: 0.7000,
      width: 0.8426,
      height: 0.0553,
      type: 'handwritten',
    },
    fecha: {
      id: 'fecha',
      label: '7) Fecha',
      x: 0.0823,
      y: 0.8130,
      width: 0.8326,
      height: 0.0263,
      type: 'handwritten',
    },
    turno: {
      id: 'turno',
      label: '8) Turno',
      x: 0.0823,
      y: 0.8580,
      width: 0.3254,
      height: 0.0263,
      type: 'checkbox',
    },
    nombre: {
      id: 'nombre',
      label: '9) Nombre',
      x: 0.0823,
      y: 0.9020,
      width: 0.8276,
      height: 0.0381,
      type: 'handwritten',
    },
  },
};

// Plantilla Cartoncillo Verde HSK 63 (8 campos oficiales, sin observaciones)
export const GREEN_CARD_TEMPLATE: CardTemplate = {
  id: 'VW-HSK63-GRN-V2',
  name: 'Tarjeta Colgante Verde HSK 63 (Estándar - 8 Campos)',
  color: 'verde',
  title: 'HSK 63 VOLKSWAGEN DE MÉXICO',
  subtitle: 'TARJETA DE CONTROL Y SEGUIMIENTO DE HERRAMIENTA',
  aspectRatio: 80 / 190, // 80 mm ancho / 190 mm alto = 0.42105
  fiducialMarkers: {
    topLeft: { x: 0.0525, y: 0.3774 },
    topRight: { x: 0.9475, y: 0.3774 },
    bottomLeft: { x: 0.0525, y: 0.9642 },
    bottomRight: { x: 0.9475, y: 0.9642 },
  },
  fields: {
    centroCostos: {
      id: 'centroCostos',
      label: '1) Centro de Costos (C.C.)',
      x: 0.5329,
      y: 0.3798,
      width: 0.3401,
      height: 0.0440,
      type: 'comb',
    },
    operacion: {
      id: 'operacion',
      label: '2) Operación',
      x: 0.0763,
      y: 0.4562,
      width: 0.8426,
      height: 0.0411,
      type: 'handwritten',
    },
    numeroHerramienta: {
      id: 'numeroHerramienta',
      label: '3) No. de Herramienta',
      x: 0.0733,
      y: 0.5208,
      width: 0.8376,
      height: 0.0411,
      type: 'comb',
    },
    maquina: {
      id: 'maquina',
      label: '4) Máquina (1-10)',
      x: 0.0733,
      y: 0.5800,
      width: 0.3580,
      height: 0.0321,
      type: 'handwritten',
    },
    husillo: {
      id: 'husillo',
      label: '5) Husillo (1-4)',
      x: 0.6292,
      y: 0.5800,
      width: 0.2317,
      height: 0.0321,
      type: 'checkbox',
    },
    tiempoVidaUtil: {
      id: 'tiempoVidaUtil',
      label: '6) Tiempo de Vida Útil',
      x: 0.0763,
      y: 0.6350,
      width: 0.8426,
      height: 0.0411,
      type: 'handwritten',
    },
    fecha: {
      id: 'fecha',
      label: '7) Fecha',
      x: 0.0763,
      y: 0.7250,
      width: 0.8376,
      height: 0.0292,
      type: 'handwritten',
    },
    turno: {
      id: 'turno',
      label: '8) Turno',
      x: 0.0763,
      y: 0.7950,
      width: 0.3304,
      height: 0.0292,
      type: 'checkbox',
    },
    nombre: {
      id: 'nombre',
      label: '9) Nombre',
      x: 0.0703,
      y: 0.8650,
      width: 0.8476,
      height: 0.0351,
      type: 'handwritten',
    },
  },
};

// Carga la plantilla activa: si el usuario calibró y guardó coordenadas en localStorage, usa esas
export function getTemplate(type: 'naranja' | 'verde'): CardTemplate {
  const base = type === 'naranja' ? ORANGE_CARD_TEMPLATE : GREEN_CARD_TEMPLATE;
  if (typeof window === 'undefined') return base;

  try {
    const key = type === 'naranja' ? LS_KEY_NARANJA_TEMPLATE : LS_KEY_VERDE_TEMPLATE;
    const raw = localStorage.getItem(key);
    if (!raw) return base;

    const custom = JSON.parse(raw);
    if (!custom || typeof custom !== 'object') return base;

    return {
      ...base,
      fiducialMarkers: {
        ...base.fiducialMarkers,
        ...(custom.fiducialMarkers || {}),
      },
      fields: {
        ...base.fields,
        ...(custom.fields || {}),
      },
    };
  } catch {
    return base;
  }
}

// Guarda permanentemente la plantilla calibrada en el navegador y emite evento global
export function saveTemplateToStorage(
  type: 'naranja' | 'verde',
  data: {
    fields?: Record<string, any>;
    fiducialMarkers?: {
      topLeft?: { x: number; y: number };
      topRight?: { x: number; y: number };
      bottomLeft?: { x: number; y: number };
      bottomRight?: { x: number; y: number };
    };
  }
): void {
  if (typeof window === 'undefined') return;
  const key = type === 'naranja' ? LS_KEY_NARANJA_TEMPLATE : LS_KEY_VERDE_TEMPLATE;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('vw-coordinates-updated', { detail: { cardType: type } }));
}

// Restablece la plantilla a los valores oficiales de fábrica
export function resetTemplateStorage(type: 'naranja' | 'verde'): void {
  if (typeof window === 'undefined') return;
  const key = type === 'naranja' ? LS_KEY_NARANJA_TEMPLATE : LS_KEY_VERDE_TEMPLATE;
  localStorage.removeItem(key);
  // Limpiar también legacy keys si existían
  localStorage.removeItem(`calibrator_fields_${type}_v2`);
  window.dispatchEvent(new CustomEvent('vw-coordinates-updated', { detail: { cardType: type } }));
}
