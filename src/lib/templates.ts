import { CardTemplate, CardType } from '@/types/card';

export const LS_KEY_NARANJA_TEMPLATE = 'vw_card_template_naranja_v4';
export const LS_KEY_VERDE_TEMPLATE   = 'vw_card_template_verde_v4';

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
      x: 0.5269,
      y: 0.4038,
      width: 0.3401,
      height: 0.0440,
      type: 'comb',
    },
    operacion: {
      id: 'operacion',
      label: '2) Operación',
      x: 0.0883,
      y: 0.4742,
      width: 0.7876,
      height: 0.0381,
      type: 'handwritten',
    },
    numeroHerramienta: {
      id: 'numeroHerramienta',
      label: '3) No. de Herramienta',
      x: 0.0883,
      y: 0.5329,
      width: 0.7876,
      height: 0.0381,
      type: 'comb',
    },
    maquina: {
      id: 'maquina',
      label: '4) Máquina (1-10)',
      x: 0.0883,
      y: 0.5857,
      width: 0.3580,
      height: 0.0381,
      type: 'handwritten',
    },
    husillo: {
      id: 'husillo',
      label: '5) Husillo (1-4)',
      x: 0.4642,
      y: 0.5857,
      width: 0.4117,
      height: 0.0381,
      type: 'checkbox',
    },
    tiempoVidaUtil: {
      id: 'tiempoVidaUtil',
      label: '6) Tiempo Vida Logrado',
      x: 0.0883,
      y: 0.6385,
      width: 0.7876,
      height: 0.0381,
      type: 'handwritten',
    },
    motivoDesmontaje: {
      id: 'motivoDesmontaje',
      label: '10) Motivo de Desmontaje (12 Casillas)',
      x: 0.0883,
      y: 0.6825,
      width: 0.7876,
      height: 0.0880,
      type: 'checkbox',
    },
    observaciones: {
      id: 'observaciones',
      label: 'Observaciones / Falla',
      x: 0.0883,
      y: 0.7794,
      width: 0.7876,
      height: 0.0440,
      type: 'handwritten',
    },
    fecha: {
      id: 'fecha',
      label: '7) Fecha',
      x: 0.0883,
      y: 0.8322,
      width: 0.7876,
      height: 0.0323,
      type: 'handwritten',
    },
    turno: {
      id: 'turno',
      label: '8) Turno',
      x: 0.0883,
      y: 0.8674,
      width: 0.4654,
      height: 0.0323,
      type: 'checkbox',
    },
    nombre: {
      id: 'nombre',
      label: '9) Nombre',
      x: 0.0883,
      y: 0.8967,
      width: 0.7876,
      height: 0.0381,
      type: 'handwritten',
    },
  },
};

// Plantilla Cartoncillo Verde HSK 63 (9 campos oficiales del proyecto)
export const GREEN_CARD_TEMPLATE: CardTemplate = {
  id: 'VW-HSK63-GRN-V2',
  name: 'Tarjeta Colgante Verde HSK 63 (Estándar - 9 Campos)',
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
      x: 0.5269,
      y: 0.4038,
      width: 0.3401,
      height: 0.0440,
      type: 'comb',
    },
    operacion: {
      id: 'operacion',
      label: '2) Operación',
      x: 0.0883,
      y: 0.4742,
      width: 0.7876,
      height: 0.0411,
      type: 'handwritten',
    },
    numeroHerramienta: {
      id: 'numeroHerramienta',
      label: '3) No. de Herramienta',
      x: 0.0883,
      y: 0.5388,
      width: 0.7876,
      height: 0.0411,
      type: 'comb',
    },
    maquina: {
      id: 'maquina',
      label: '4) Máquina (1-10)',
      x: 0.0883,
      y: 0.6004,
      width: 0.3580,
      height: 0.0411,
      type: 'handwritten',
    },
    husillo: {
      id: 'husillo',
      label: '5) Husillo (1-4)',
      x: 0.4642,
      y: 0.6004,
      width: 0.4117,
      height: 0.0411,
      type: 'checkbox',
    },
    tiempoVidaUtil: {
      id: 'tiempoVidaUtil',
      label: '6) Tiempo de Vida Útil',
      x: 0.0883,
      y: 0.6591,
      width: 0.7876,
      height: 0.0411,
      type: 'handwritten',
    },
    observaciones: {
      id: 'observaciones',
      label: 'Observaciones de Producción / Calidad',
      x: 0.0883,
      y: 0.7177,
      width: 0.7876,
      height: 0.0675,
      type: 'handwritten',
    },
    fecha: {
      id: 'fecha',
      label: '7) Fecha',
      x: 0.0883,
      y: 0.8028,
      width: 0.7876,
      height: 0.0352,
      type: 'handwritten',
    },
    turno: {
      id: 'turno',
      label: '8) Turno',
      x: 0.0883,
      y: 0.8410,
      width: 0.4654,
      height: 0.0352,
      type: 'checkbox',
    },
    nombre: {
      id: 'nombre',
      label: '9) Nombre',
      x: 0.0883,
      y: 0.8762,
      width: 0.7876,
      height: 0.0411,
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
