# Sistema de Verificación y Cotejo de Cartoncillos HSK 63 - Volkswagen de México

Aplicación web para digitalización, lectura visual con IA local (**Ollama + LLaVA**) y cotejo en tiempo real de cartoncillos de herramientas (**Naranja** de desmontaje y **Verde** de seguimiento) contra la base maestra de Excel.

---

## 🔒 Privacidad y Seguridad Industrial (100% Local)

> **IMPORTANTE:** Ningún dato, fotografía de cartón, información de operadores ni parámetros de proceso salen a internet. Toda la inferencia de Inteligencia Artificial corre de forma estrictamente local en el hardware de la máquina a través de **Ollama** (puerto `127.0.0.1:11434`).

---

## 📋 Requisitos Previos

Asegúrate de tener instalado en tu computadora:

1. **Node.js** v18 o superior (se recomienda v20 LTS): [Descargar Node.js](https://nodejs.org/)
2. **Git**: [Descargar Git](https://git-scm.com/)
3. **Ollama** (para la IA visual LLaVA): [Descargar Ollama](https://ollama.com/download)
4. **Memoria RAM recomendada:** 16 GB de RAM (o mínimo 8 GB libres para cargar LLaVA 7B).

---

## 🚀 Guía de Instalación Rápida Paso a Paso

### Paso 1: Clonar el repositorio
Abre una terminal (PowerShell, Git Bash o CMD) y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO_GITHUB>
cd app-vw
```

### Paso 2: Instalar las dependencias de Node.js
```bash
npm install
```

---

### Paso 3: Instalar y preparar Ollama con el modelo LLaVA

1. Si aún no tienes Ollama instalado, descárgalo e instálalo desde [https://ollama.com/download](https://ollama.com/download) para tu sistema operativo (Windows / macOS / Linux).
2. Abre una terminal nueva y descarga el modelo de visión **LLaVA**:

```bash
ollama pull llava
```
*(Este comando descarga el modelo de visión LLaVA ~4.7 GB. Solo se hace una sola vez).*

3. Comprueba que Ollama esté corriendo ejecutando:
```bash
ollama list
```
*(Deberías ver `llava:latest` o `llava:7b` en la lista).*

---

### Paso 4: Iniciar la aplicación

En la carpeta del proyecto `app-vw`, ejecuta:

```bash
npm run dev
```

Abre tu navegador web e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🟢 ¿Cómo verificar que todo está listo?

1. En la esquina superior de la aplicación verás una píldora indicadora:
   - **Verde ("Ollama LLaVA: Conectado"):** Todo listo. El servidor Ollama está activo y el modelo LLaVA está cargado.
   - **Ámbar ("Ollama: Falta modelo llava"):** Ollama está corriendo pero falta ejecutar `ollama pull llava`.
   - **Gris ("Ollama: Local"):** Ollama no está abierto. Inícialo abriendo la app de Ollama o ejecutando `ollama serve`.

2. Haz clic en la píldora para abrir el **Modal de Diagnóstico y Configuración de Ollama** en cualquier momento.

---

## 📱 Uso de la Aplicación

1. **Seleccionar Tipo de Cartoncillo:** Elige entre **Tarjeta Naranja (Desmontaje)** o **Tarjeta Verde (Inicial/Seguimiento)**.
2. **Cargar o Escanear Cartón:**
   - Puedes usar el botón **Cámara** o **Galería / Archivo** para subir la foto del cartoncillo.
   - O presionar **Cargar Muestra Sintética** para pruebas inmediatas sin cámara.
3. **Extracción Automática:**
   - LLaVA analiza el cartón en local, interpretando tanto las etiquetas impresas como la escritura manuscrita con pluma y las casillas marcadas.
4. **Cotejo con Excel:**
   - Puedes arrastrar o cargar tu archivo `.xlsx` maestro para que el sistema valide automáticamente Centro de Costos, No. de Herramienta, Máquina y Husillo.
5. **Corrección y Confirmación:**
   - Si algún campo tiene baja confianza, se resalta en ámbar para que el operador lo valide antes de registrar.

---

## 🛠️ Variables de Entorno Opcionales

Si necesitas apuntar a una instancia remota de Ollama dentro de la misma red local, puedes crear un archivo `.env.local`:

```env
# URL de Ollama (por defecto es http://127.0.0.1:11434)
OLLAMA_HOST=http://127.0.0.1:11434

# Modelo por defecto (por defecto es llava)
OLLAMA_MODEL=llava
```

---

## 📦 Scripts Disponibles

- `npm run dev` : Inicia el servidor de desarrollo en `0.0.0.0:3000` (accesible en localhost y en la red WiFi local).
- `npm run dev:https` : Inicia con HTTPS experimental (útil para pruebas de cámara web en móviles en la misma red).
- `npm run build` : Genera la versión de producción optimizada.
- `npm run start` : Inicia el servidor en modo producción.
