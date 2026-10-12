import base64
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .detector import warp_perspective_card
from .checkboxes import analyze_checkbox_roi

app = FastAPI(
    title="Volkswagen HSK 63 Computer Vision Service",
    description="Servicio de procesamiento de imágenes con OpenCV para detección de cartoncillos y casillas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "vw-vision-opencv", "version": "1.0.0"}

@app.post("/process-card")
async def process_card(
    file: UploadFile = File(...),
    card_type: str = Form("naranja")
):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen enviada")

        # 1. Corrección de perspectiva canónica de la zona de datos
        warped = warp_perspective_card(img, target_width=600, target_height=1200)

        # 2. Codificar imagen normalizada a JPEG base64
        _, buffer = cv2.imencode(".jpg", warped, [cv2.IMWRITE_JPEG_QUALITY, 90])
        warped_b64 = base64.b64encode(buffer).decode("utf-8")

        # 3. Mapeo de casillas de Husillo (1 a 4)
        checkbox_results = {}
        husillo_boxes = {
            "husillo_1": (410, 681, 18, 18),
            "husillo_2": (438, 681, 18, 18),
            "husillo_3": (466, 681, 18, 18),
            "husillo_4": (494, 681, 18, 18),
        }
        for h_key, (x, y, w, h) in husillo_boxes.items():
            roi = warped[y:y + h, x:x + w]
            res = analyze_checkbox_roi(roi, threshold_ratio=0.20)
            checkbox_results[h_key] = res

        # 4. Mapeo de las 12 casillas oficiales de Motivo de Desmontaje (Solo Tarjeta Naranja)
        motivos_detected = None
        if card_type == "naranja":
            motivos_boxes = {
                "Rotura": (82, 826, 14, 14),
                "Formación de rebaba": (82, 848, 14, 14),
                "Rugosidad alta": (82, 870, 14, 14),
                "Rugosidad baja": (82, 892, 14, 14),
                "Diámetro grande": (82, 914, 14, 14),
                "Diámetro pequeño": (82, 936, 14, 14),
                "Ángulo de especificación": (304, 826, 14, 14),
                "Forma fuera de especificación": (304, 848, 14, 14),
                "Despostilladura": (304, 870, 14, 14),
                "Análisis de herramientas necesario": (304, 892, 14, 14),
                "Fallo de operador": (304, 914, 14, 14),
                "Fallo de máquina": (304, 936, 14, 14),
            }

            highest_ink = 0.0
            detected_motivo = None
            motivos_results = {}

            for m_name, (x, y, w, h) in motivos_boxes.items():
                roi = warped[y:y + h, x:x + w]
                analysis = analyze_checkbox_roi(roi, threshold_ratio=0.20)
                motivos_results[m_name] = analysis
                if analysis["checked"] and analysis["ink_ratio"] > highest_ink:
                    highest_ink = analysis["ink_ratio"]
                    detected_motivo = m_name

            motivos_detected = {
                "selected_motivo": detected_motivo,
                "all_checkboxes": motivos_results
            }

        # 5. Inferencia opcional con Ollama GLM-OCR si está disponible
        ollama_data = call_ollama_glm_ocr(warped_b64, card_type)

        return {
            "success": True,
            "card_type": card_type,
            "dimensions": {"width": 600, "height": 1200},
            "warped_image": f"data:image/jpeg;base64,{warped_b64}",
            "checkboxes": checkbox_results,
            "motivos_desmontaje": motivos_detected,
            "ollama_ocr": ollama_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def call_ollama_glm_ocr(image_b64: str, card_type: str, ollama_url: str = "http://127.0.0.1:11434"):
    """
    Llama a la API local de Ollama para ejecutar el modelo GLM-OCR
    sobre la imagen normalizada del cartoncillo.
    """
    import urllib.request
    import json

    prompt = (
        f"Text Recognition: Extract all printed and handwritten text from this Volkswagen HSK 63 "
        f"{card_type.upper()} tool control card into a valid JSON object with keys: "
        f"centroCostos, operacion, numeroHerramienta, maquina, husillo, tiempoVidaUtil, fecha, turno, nombre, "
        f"{'motivoDesmontaje, ' if card_type == 'naranja' else ''}observaciones."
    )

    req_data = {
        "model": "glm-ocr",
        "prompt": prompt,
        "images": [image_b64],
        "stream": False,
        "options": {
            "temperature": 0.1
        }
    }

    try:
        req = urllib.request.Request(
            f"{ollama_url}/api/generate",
            data=json.dumps(req_data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            if resp.status == 200:
                result = json.loads(resp.read().decode("utf-8"))
                return {
                    "available": True,
                    "model": "glm-ocr",
                    "raw_response": result.get("response", "")
                }
    except Exception as ex:
        return {
            "available": False,
            "error": str(ex),
            "hint": "Inicia Ollama con 'ollama run glm-ocr' para habilitar OCR local"
        }
