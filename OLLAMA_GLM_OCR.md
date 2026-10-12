# Implementación Local de Reconocimiento OCR con Ollama (GLM-OCR)
### Volkswagen de México • Digitalización de Cartoncillos HSK 63

Esta solución permite realizar el reconocimiento óptico de caracteres (**OCR**) tanto de texto impreso (etiquetas, números de máquina, operaciones) como manuscrito (bolígrafo en Centro de Costos, No. Herramienta, Vida Útil, Operador y Observaciones) **100% en local**, sin enviar imágenes ni datos confidenciales a servicios en la nube.

---

## 1. ¿Qué es GLM-OCR?
**GLM-OCR** es un modelo multimodal de visión-lenguaje ligero (~0.9B parámetros, ocupa aprox. 2.2 GB de almacenamiento) entrenado específicamente para extracción de texto manuscrito, formularios estructurados, tablas y casillas marcadas. Se ejecuta con alto rendimiento en procesadores Apple Silicon (M1/M2/M3/M4) e Intel a través de **Ollama**.

---

## 2. Instalación Rápida (1 solo paso)

En la raíz del proyecto, ejecuta el script automatizado:
```bash
./setup-ollama.sh
```

El script se encargará de:
1. Verificar si Ollama está instalado (y descargarlo si no lo está).
2. Iniciar el servicio local en `http://127.0.0.1:11434`.
3. Descargar el modelo `glm-ocr` (`ollama pull glm-ocr`).

---

## 3. Instalación Manual Paso a Paso

Si prefieres configurarlo manualmente en tu terminal:

### Paso 1: Instalar Ollama
- **Opción A (Instalador oficial):** Descarga la app desde [ollama.com/download](https://ollama.com/download) e instálala en tu Mac.
- **Opción B (Línea de comandos):**
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

### Paso 2: Descargar el Modelo GLM-OCR
Abre tu terminal y ejecuta:
```bash
ollama run glm-ocr
```
*(La primera vez descargará el modelo de ~2.2 GB. Una vez descargado, estará listo para responder consultas locales).*

### Paso 3: Verificar que el servicio esté respondiendo
En tu navegador o terminal:
```bash
curl http://127.0.0.1:11434/api/tags
```
Deberás ver una respuesta JSON listando `glm-ocr`.

---

## 4. Arquitectura de la Integración en la App

```
[ Cámara Móvil / Archivo ]
           │
           ▼
[ Frontend Next.js ] (src/app/page.tsx + src/lib/ocrService.ts)
           │
           ├── (POST /api/ocr)
           ▼
[ Next.js API Route ] (src/app/api/ocr/route.ts)
           │
           ├── Native Vision Endpoint (POST /api/generate)
           ▼
[ Ollama Local (http://127.0.0.1:11434) ]
   └── Modelo: glm-ocr
           │
           ▼ (Extracción de campos en JSON)
[ Formulario Único RUPTURAS TOTAL ] (Cotejo de 5 campos y resaltado de discrepancias en rojo)
```

### Opciones de Configuración (Variables de Entorno)
Puedes personalizar la dirección o modelo en `.env.local` si deseas usar un servidor Ollama en red local:
```env
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=glm-ocr
```

---

## 5. Fallback Inteligente y Modo Offline
Si Ollama no está activo en el momento de tomar la foto, la aplicación web:
- Muestra una insignia amarilla en la barra superior indicando `Ollama: No detectado`.
- Muestra una ventana emergente de ayuda con los comandos de terminal.
- Activa automáticamente una lectura calibrada de respaldo para que los operadores puedan continuar trabajando y editando los campos manualmente sin bloqueos.
