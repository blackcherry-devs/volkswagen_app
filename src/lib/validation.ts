import { z } from 'zod';
import { OrangeCardData, GreenCardData } from '@/types/card';

// Validación para el Cartoncillo Naranja (10 campos)
export const OrangeCardSchema = z.object({
  centroCostos: z
    .string()
    .trim()
    .regex(/^4\d{3}$/, {
      message: 'El Centro de Costos debe tener exactamente 4 dígitos y comenzar con 4 (ej: 4120)',
    }),
  operacion: z
    .string()
    .trim()
    .min(1, { message: 'La operación es obligatoria' }),
  numeroHerramienta: z
    .string()
    .trim()
    .regex(/^[Tt]-?\d{1,5}$/, {
      message: 'Debe comenzar con la letra "T" seguida de hasta 5 números (ej: T12345 o T-4021)',
    }),
  maquina: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 10;
    }, {
      message: 'La máquina debe ser un valor del 1 al 10 (máx. 10 máquinas)',
    }),
  husillo: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 4;
    }, {
      message: 'El husillo debe ser del 1 al 4 (máx. 4 husillos)',
    }),
  tiempoVidaUtil: z
    .string()
    .trim()
    .regex(/^\d{1,7}$/, {
      message: 'Debe ser un número de mínimo 1 y máximo 7 dígitos (ej: 1250)',
    }),
  fecha: z
    .string()
    .trim()
    .min(1, { message: 'La fecha es obligatoria' }),
  turno: z
    .string()
    .trim()
    .refine((val) => ['1', '2', '3', 'T1', 'T2', 'T3'].includes(val.toUpperCase()), {
      message: 'El turno debe ser 1, 2 o 3',
    }),
  nombre: z
    .string()
    .trim()
    .min(2, { message: 'El nombre del operador es obligatorio (mínimo 2 letras)' }),
  motivoDesmontaje: z
    .string()
    .trim()
    .min(3, { message: 'El motivo de desmontaje u observaciones es obligatorio' }),
  observaciones: z.string().trim().optional(),
});

// Validación para el Cartoncillo Verde (9 campos)
export const GreenCardSchema = z.object({
  centroCostos: z
    .string()
    .trim()
    .regex(/^4\d{3}$/, {
      message: 'El Centro de Costos debe tener exactamente 4 dígitos y comenzar con 4 (ej: 4120)',
    }),
  operacion: z
    .string()
    .trim()
    .min(1, { message: 'La operación es obligatoria' }),
  numeroHerramienta: z
    .string()
    .trim()
    .regex(/^[Tt]-?\d{1,5}$/, {
      message: 'Debe comenzar con la letra "T" seguida de hasta 5 números (ej: T12345 o T-4021)',
    }),
  maquina: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 10;
    }, {
      message: 'La máquina debe ser un valor del 1 al 10 (máx. 10 máquinas)',
    }),
  husillo: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 4;
    }, {
      message: 'El husillo debe ser del 1 al 4 (máx. 4 husillos)',
    }),
  tiempoVidaUtil: z
    .string()
    .trim()
    .regex(/^\d{1,7}$/, {
      message: 'Debe ser un número de mínimo 1 y máximo 7 dígitos (ej: 1250)',
    }),
  fecha: z
    .string()
    .trim()
    .min(1, { message: 'La fecha es obligatoria' }),
  nombre: z
    .string()
    .trim()
    .min(2, { message: 'El nombre del operador es obligatorio (mínimo 2 letras)' }),
  turno: z
    .string()
    .trim()
    .refine((val) => ['1', '2', '3', 'T1', 'T2', 'T3'].includes(val.toUpperCase()), {
      message: 'El turno debe ser 1, 2 o 3',
    }),
  observaciones: z.string().trim().optional(),
});

// Validación para el Formulario Único RUPTURAS TOTAL (Ambas tarjetas)
export const UnifiedRupturaSchema = z.object({
  // 5 Campos Compartidos (Validados entre ambas tarjetas)
  centroCostos: z
    .string()
    .trim()
    .regex(/^4\d{3}$/, {
      message: 'El Centro de Costos debe tener exactamente 4 dígitos y comenzar con 4 (ej: 4120)',
    }),
  operacion: z
    .string()
    .trim()
    .min(1, { message: 'La operación es obligatoria' }),
  numeroHerramienta: z
    .string()
    .trim()
    .regex(/^[Tt]-?\d{1,5}$/, {
      message: 'Debe comenzar con la letra "T" seguida de hasta 5 números (ej: T12345 o T-4021)',
    }),
  maquina: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 10;
    }, {
      message: 'La máquina debe ser un valor del 1 al 10 (máx. 10 máquinas)',
    }),
  husillo: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseInt(val.replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 4;
    }, {
      message: 'El husillo debe ser del 1 al 4 (máx. 4 husillos)',
    }),

  // Campos Únicos Tarjeta Verde (Inicial)
  fechaInicial: z.string().trim().min(1, { message: 'La fecha inicial es obligatoria' }),
  turnoInicial: z.string().trim().refine((val) => ['1', '2', '3', 'T1', 'T2', 'T3'].includes(val.toUpperCase()), {
    message: 'El turno inicial debe ser 1, 2 o 3',
  }),
  nombreOperadorInicial: z.string().trim().min(2, { message: 'El nombre del operador inicial es obligatorio (mínimo 2 letras)' }),
  tiempoVidaUtilInicial: z.string().trim().optional(),
  observacionesInicial: z.string().trim().optional(),

  // Campos Únicos Tarjeta Naranja (Desmontaje)
  fechaDesmontaje: z.string().trim().min(1, { message: 'La fecha de desmontaje es obligatoria' }),
  turnoDesmontaje: z.string().trim().refine((val) => ['1', '2', '3', 'T1', 'T2', 'T3'].includes(val.toUpperCase()), {
    message: 'El turno de desmontaje debe ser 1, 2 o 3',
  }),
  nombreOperadorDesmontaje: z.string().trim().min(2, { message: 'El nombre del operador de desmontaje es obligatorio (mínimo 2 letras)' }),
  tiempoVidaUtilDesmontaje: z.string().trim().regex(/^\d{1,7}$/, {
    message: 'Debe ser un número de mínimo 1 y máximo 7 dígitos (ej: 1450)',
  }),
  motivoDesmontaje: z.string().trim().min(3, { message: 'El motivo de desmontaje es obligatorio' }),
  observacionesDesmontaje: z.string().trim().optional(),
});

// Normalización de campos para comparación robusta
export function normalizeSharedValue(key: string, value: string): string {
  const clean = (value || '').trim();
  if (key === 'numeroHerramienta') {
    return clean.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  if (key === 'maquina' || key === 'husillo') {
    return clean.replace(/\D/g, '');
  }
  if (key === 'centroCostos') {
    return clean.replace(/\s+/g, '');
  }
  if (key === 'operacion') {
    return clean.toUpperCase().replace(/\s+/g, ' ');
  }
  return clean.toUpperCase();
}

// Comparación de los 5 campos compartidos
export function compareSharedFields(
  orangeData?: Partial<Record<string, string>>,
  greenData?: Partial<Record<string, string>>
): {
  mismatches: Record<string, boolean>;
  matchedValues: Record<string, string>;
} {
  const mismatches: Record<string, boolean> = {};
  const matchedValues: Record<string, string> = {};

  if (!orangeData || !greenData) {
    return { mismatches, matchedValues };
  }

  const keys = ['centroCostos', 'operacion', 'numeroHerramienta', 'maquina', 'husillo'];

  keys.forEach((key) => {
    const oVal = orangeData[key] || '';
    const gVal = greenData[key] || '';

    if (oVal && gVal) {
      const normO = normalizeSharedValue(key, oVal);
      const normG = normalizeSharedValue(key, gVal);
      if (normO === normG) {
        mismatches[key] = false;
        matchedValues[key] = oVal;
      } else {
        mismatches[key] = true;
        matchedValues[key] = ''; // REGLA: no capturar si no coinciden
      }
    }
  });

  return { mismatches, matchedValues };
}

// Ayudante inteligente para sugerir correcciones en OCR
export function suggestCorrections(key: string, value: string): string | null {
  const clean = value.trim();

  // Sugerencia para Centro de Costos: si tiene 4 dígitos pero no empieza con 4 (ej. OCR leyó "1120" en vez de "4120")
  if (key === 'centroCostos') {
    if (/^[0-9]{4}$/.test(clean) && !clean.startsWith('4')) {
      return `¿Quiso decir 4${clean.slice(1)}?`;
    }
    if (/^[A-Za-z0-9]{4}$/.test(clean)) {
      const fixed = clean.replace(/^[A-Za-z]/, '4');
      return `Sugerido: ${fixed}`;
    }
  }

  // Sugerencia para No. Herramienta: si falta la T inicial
  if (key === 'numeroHerramienta') {
    if (/^\d{1,5}$/.test(clean)) {
      return `¿Quiso decir T-${clean}?`;
    }
    if (/^[7ITl]-?\d{1,5}$/.test(clean)) {
      // OCR confunde a veces T con 7 o I
      return `¿Quiso decir T-${clean.slice(1).replace('-', '')}?`;
    }
  }

  // Sugerencia para Husillo: si es mayor a 4
  if (key === 'husillo') {
    const n = parseInt(clean);
    if (!isNaN(n) && (n < 1 || n > 4)) {
      return 'Husillos válidos: solo 1, 2, 3 o 4';
    }
  }

  // Sugerencia para Máquina: si es mayor a 10
  if (key === 'maquina') {
    const n = parseInt(clean);
    if (!isNaN(n) && (n < 1 || n > 10)) {
      return 'Máquinas válidas: del 1 al 10';
    }
  }

  return null;
}
