"""
/encode endpoint — orchestrates Person 2's StegoSecurity module.
Receives image + message from React, returns stego image as PNG download.
"""

import os
import time
import tempfile
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter()

# Lazy import so missing deps give a clear error
def _get_security():
    try:
        from security_api import StegoSecurity
        key_file = os.path.join(
            os.path.dirname(__file__), "..", "keys", "security_key.bin"
        )
        os.makedirs(os.path.dirname(key_file), exist_ok=True)
        return StegoSecurity(key_file=key_file, payload_bpp=0.2)
    except ImportError as e:
        raise HTTPException(503, f"Security module not available: {e}")


SUPPORTED_FORMATS = {".png", ".jpg", ".jpeg", ".bmp"}


@router.post("/encode")
async def encode(
    image   : UploadFile = File(...),
    message : str        = Form(...),
    key     : str        = Form(None),
    payload : float      = Form(0.2),
):
    """
    Encrypt message with AES-256 then embed into cover image via JUNIWARD.
    Returns the stego image as a downloadable PNG file.
    """
    # ── Validate format ───────────────────────────────────────────────────────
    ext = os.path.splitext(image.filename or "")[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            400,
            detail={
                "status"     : "error",
                "error_code" : "INVALID_IMAGE_FORMAT",
                "message"    : f"Unsupported format '{ext}'. Use: PNG, JPEG, BMP",
            },
        )

    # ── Validate payload range ────────────────────────────────────────────────
    if not (0.05 <= payload <= 0.45):
        raise HTTPException(
            400,
            detail={
                "status"     : "error",
                "error_code" : "INVALID_PAYLOAD",
                "message"    : "Payload must be between 0.05 and 0.45 bpp",
            },
        )

    security = _get_security()

    with tempfile.TemporaryDirectory() as tmp:
        # Save uploaded image
        cover_path = os.path.join(tmp, f"cover{ext}")
        content = await image.read()
        with open(cover_path, "wb") as f:
            f.write(content)

        # Check capacity
        cap = security.get_capacity(cover_path, payload)
        if len(message.encode("utf-8")) > cap:
            raise HTTPException(
                400,
                detail={
                    "status"     : "error",
                    "error_code" : "PAYLOAD_TOO_LARGE",
                    "message"    : f"Message ({len(message.encode())} B) exceeds capacity ({cap} B) at {payload} bpp",
                    "max_bytes"  : cap,
                },
            )

        stego_path = os.path.join(tmp, "stego.png")
        t0 = time.time()

        try:
            _, psnr = security.encode_image(
                cover_path, message, stego_path, payload_bpp=payload
            )
        except ValueError as e:
            raise HTTPException(
                400,
                detail={"status": "error", "error_code": "ENCODING_FAILED", "message": str(e)},
            )
        except Exception as e:
            raise HTTPException(
                500,
                detail={"status": "error", "error_code": "ENCODING_FAILED", "message": str(e)},
            )

        elapsed_ms = int((time.time() - t0) * 1000)

        # Move stego to uploads dir so FileResponse can serve it after tmp cleanup
        out_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "stego_latest.png")
        import shutil
        shutil.copy2(stego_path, out_path)

    return FileResponse(
        out_path,
        media_type  = "image/png",
        filename    = "stego.png",
        headers     = {
            "X-PSNR"            : f"{psnr:.2f}",
            "X-Encoding-Time-MS": str(elapsed_ms),
            "X-Payload-BPP"     : str(payload),
            "X-Capacity-Bytes"  : str(cap),
            "Access-Control-Expose-Headers": "X-PSNR,X-Encoding-Time-MS,X-Payload-BPP,X-Capacity-Bytes",
        },
    )
