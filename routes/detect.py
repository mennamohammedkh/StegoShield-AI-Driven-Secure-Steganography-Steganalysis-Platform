"""
/detect endpoint — runs steganalysis using Person 1's ONNX model.
Falls back to a placeholder response when the model file is not yet available.
"""

import os
import time
import tempfile
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

router = APIRouter()

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "services", "YedroudjNet_JUNIWARD_Classification.onnx"
)


def _load_model():
    """Load ONNX model if available, else return None."""
    if not os.path.exists(MODEL_PATH):
        return None
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(MODEL_PATH)
        return session
    except Exception:
        return None


def _preprocess(image_path: str) -> np.ndarray:
    """Preprocess for YedroudjNet: 512×512 grayscale, normalized to [0,1]"""
    import cv2
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot read image file.")
    
    # Convert to grayscale (YedroudjNet expects 1 channel)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Resize to 512×512 (YedroudjNet input size)
    img = cv2.resize(img, (512, 512))
    
    # Normalize to [0, 1]
    img = img.astype(np.float32) / 255.0
    
    # Add channel and batch dimensions: (512,512) → (1,1,512,512)
    img = np.expand_dims(img, axis=0)  # add channel dim
    img = np.expand_dims(img, axis=0)  # add batch dim
    
    return img


@router.post("/detect")
async def detect(
    image                : UploadFile = File(...),
    confidence_threshold : float      = Form(0.5),
):
    """
    Run CNN steganalysis on the uploaded image.
    Returns CLEAN or STEGO with confidence probability.
    """
    with tempfile.TemporaryDirectory() as tmp:
        ext        = os.path.splitext(image.filename or ".png")[1].lower() or ".png"
        img_path   = os.path.join(tmp, f"input{ext}")
        content    = await image.read()
        with open(img_path, "wb") as f:
            f.write(content)

        try:
            tensor = _preprocess(img_path)
        except ValueError as e:
            raise HTTPException(
                400,
                detail={"status": "error", "error_code": "PREPROCESSING_FAILED", "message": str(e)},
            )

        session = _load_model()
        t0 = time.time()

        if session is None:
            # ── Model not yet delivered by Person 1 — return placeholder ──────
            return {
                "status"     : "pending",
                "message"    : "ML model (steganalysis.onnx) not yet available. Waiting for Person 1.",
                "error_code" : "MODEL_NOT_LOADED",
            }

        # ── Run ONNX inference ────────────────────────────────────────────────
        try:
            input_name = session.get_inputs()[0].name
            outputs    = session.run(None, {input_name: tensor})
            logit      = float(outputs[0][0][0])
        except Exception as e:
            raise HTTPException(
                500,
                detail={"status": "error", "error_code": "INFERENCE_FAILED", "message": str(e)},
            )

        elapsed_ms = int((time.time() - t0) * 1000)

        # Sigmoid to probability
        prob_stego = float(1 / (1 + np.exp(-logit)))
        prob_clean = 1.0 - prob_stego
        prediction = "STEGO" if prob_stego >= confidence_threshold else "CLEAN"

    return {
        "status"        : "success",
        "prediction"    : prediction,
        "confidence"    : round(prob_stego if prediction == "STEGO" else prob_clean, 4),
        "probabilities" : {
            "clean": round(prob_clean, 4),
            "stego": round(prob_stego, 4),
        },
        "inference"     : {
            "backend"        : "ONNX Runtime",
            "time_ms"        : elapsed_ms,
            "threshold_used" : confidence_threshold,
        },
    }
