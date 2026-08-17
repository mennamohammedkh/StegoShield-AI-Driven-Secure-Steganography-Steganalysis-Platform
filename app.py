"""
StegoShield — Backend Orchestration Layer
Person 3: Backend & Frontend Engineer

FastAPI application that wires together:
  • Person 2's Security module  (encryption + steganography)
  • Person 1's ML module        (steganalysis detection)

This file contains ONLY orchestration logic — no crypto, no steganography,
no ML model code lives here.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add services directory to path so Person 2/1 modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "services"))

# Import route modules
from routes.encode  import router as encode_router
from routes.decode  import router as decode_router
from routes.detect  import router as detect_router
from routes.attack  import router as attack_router
from routes.health  import router as health_router          # ← أضيفي هذا السطر
from routes.health  import router as health_router
# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "StegoShield API",
    description = "AI-Driven Secure Steganography & Steganalysis System",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ─── CORS (allow React frontend) ──────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins     = origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api/v1", tags=["Health"])    # ← أضيفي هذا السطر
app.include_router(encode_router, prefix="/api/v1", tags=["Encode"])
app.include_router(decode_router, prefix="/api/v1", tags=["Decode"])
app.include_router(detect_router, prefix="/api/v1", tags=["Detect"])
app.include_router(attack_router, prefix="/api/v1", tags=["Attack"])

# ─── Global error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code = 500,
        content     = {
            "status"     : "error",
            "error_code" : "INTERNAL_ERROR",
            "message"    : str(exc),
        },
    )

# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host    = "0.0.0.0",
        port    = int(os.getenv("PORT", 8000)),
        reload  = True,
    )