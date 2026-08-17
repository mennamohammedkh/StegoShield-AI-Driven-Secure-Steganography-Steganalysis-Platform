from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@router.get("/info")
async def system_info():
    return {
        "name": "StegoShield",
        "version": "1.0.0",
        "endpoints": ["/encode", "/decode", "/detect", "/attack"],
        "encryption": "AES-256-CBC",
        "steganography": "JUNIWARD",
        "ml_model": "YedroudjNet"
    }