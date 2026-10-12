#!/bin/bash
# ==============================================================================
# Script de Instalación y Configuración de Ollama con GLM-OCR
# Volkswagen de México - Digitalización HSK 63
# ==============================================================================

set -e

echo "========================================================"
echo " Volkswagen HSK 63 • Configuración Local Ollama GLM-OCR "
echo "========================================================"
echo ""

# 1. Comprobar si Ollama está instalado
if command -v ollama &> /dev/null; then
    echo "✓ Ollama ya está instalado en tu sistema."
else
    echo "⚠️ Ollama no fue encontrado en el PATH."
    echo "Instalando Ollama para macOS..."
    if command -v brew &> /dev/null; then
        brew install ollama
    else
        curl -fsSL https://ollama.com/install.sh | sh
    fi
fi

# 2. Comprobar si el servicio Ollama está activo en el puerto 11434
echo ""
echo "Comprobando servicio local en http://127.0.0.1:11434..."
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo "Iniciando servicio de Ollama en segundo plano..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

# 3. Descargar el modelo GLM-OCR (0.9B parámetros, ~2.2 GB)
echo ""
echo "Descargando modelo 'glm-ocr' en Ollama..."
ollama pull glm-ocr

echo ""
echo "========================================================"
echo "✓ ¡Configuración completada con éxito!"
echo "Ollama está ejecutando el modelo GLM-OCR en http://127.0.0.1:11434"
echo ""
echo "Para verificar los modelos instalados:"
echo "  ollama list"
echo ""
echo "La aplicación web de Volkswagen conectará automáticamente"
echo "con tu instancia local para reconocer texto impreso y manuscrito."
echo "========================================================"
