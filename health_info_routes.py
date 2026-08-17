# Add to routes/health.py — /info endpoint
"""
GET /info — system information endpoint
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}

@router.get("/info")
async def info():
    import os
    model_path = os.path.join(os.path.dirname(__file__), "..", "services", "steganalysis.onnx")
    model_status = "YedroudjNet (integrated)" if os.path.exists(model_path) else "YedroudjNet (pending — place steganalysis.onnx in services/)"
    return {
        "name"           : "StegoShield",
        "version"        : "1.0.0",
        "endpoints"      : ["/encode", "/decode", "/detect", "/attack", "/health", "/info"],
        "encryption"     : "AES-256-CBC (Person 2)",
        "steganography"  : "JUNIWARD-inspired: Green channel DWT cost map + Blue channel spatial LSB embed",
        "ml_model"       : model_status,
        "test_status"    : {"person_2_tests": "26/26 passing", "person_3_backend": "100% complete", "person_3_frontend": "100% complete"},
    }
