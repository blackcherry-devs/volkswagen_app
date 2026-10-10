import cv2
import numpy as np

def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Ordena 4 puntos en orden: Top-Left, Top-Right, Bottom-Right, Bottom-Left
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)] # Top-Left
    rect[2] = pts[np.argmax(s)] # Bottom-Right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)] # Top-Right
    rect[3] = pts[np.argmax(diff)] # Bottom-Left
    return rect

def warp_perspective_card(
    image: np.ndarray,
    target_width: int = 1200,
    target_height: int = 800
) -> np.ndarray:
    """
    Detecta los 4 marcadores de las esquinas o el contorno del cartoncillo
    y aplica la transformación de perspectiva homográfica canónica.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    card_contour = None

    # Buscar el contorno poligonal de 4 puntos más grande
    for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            card_contour = approx
            break

    if card_contour is not None:
        pts = card_contour.reshape(4, 2)
        rect = order_points(pts)
    else:
        # Si no detecta esquinas automáticamente, toma los márgenes del encuadre guiado
        h, w = image.shape[:2]
        rect = np.array([
            [w * 0.05, h * 0.05],
            [w * 0.95, h * 0.05],
            [w * 0.95, h * 0.95],
            [w * 0.05, h * 0.95]
        ], dtype="float32")

    dst = np.array([
        [0, 0],
        [target_width - 1, 0],
        [target_width - 1, target_height - 1],
        [0, target_height - 1]
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (target_width, target_height))
    return warped
