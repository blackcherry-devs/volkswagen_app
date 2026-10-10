import cv2
import numpy as np

def analyze_checkbox_roi(roi_bgr: np.ndarray, threshold_ratio: float = 0.20) -> dict:
    """
    Analiza una región recortada de una casilla (checkbox) con visión computacional pura.
    Evita depender de IA general y analiza la densidad de tinta en el interior de la casilla.
    """
    h, w = roi_bgr.shape[:2]
    if h < 10 or w < 10:
        return {"checked": False, "ink_ratio": 0.0}

    # Recortar un margen interno del 15% para no contar el borde negro impreso de la casilla
    margin_y = int(h * 0.15)
    margin_x = int(w * 0.15)
    inner = roi_bgr[margin_y:h - margin_y, margin_x:w - margin_x]

    gray = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    
    # Binarización Otsu para separar tinta oscura del fondo de papel claro
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    total_pixels = binary.shape[0] * binary.shape[1]
    ink_pixels = cv2.countNonZero(binary)

    ink_ratio = ink_pixels / float(total_pixels) if total_pixels > 0 else 0.0

    return {
        "checked": ink_ratio >= threshold_ratio,
        "ink_ratio": round(ink_ratio, 3),
        "threshold_used": threshold_ratio
    }
