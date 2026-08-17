"""
/decode endpoint — extracts and decrypts hidden message from a stego image.
"""

import os
import time
import tempfile
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

router = APIRouter()


def _get_security(payload_bpp: float = 0.2):
    try:
        from security_api import StegoSecurity
        key_file = os.path.join(
            os.path.dirname(__file__), "..", "keys", "security_key.bin"
        )
        return StegoSecurity(key_file=key_file, payload_bpp=payload_bpp)
    except ImportError as e:
        raise HTTPException(503, f"Security module not available: {e}")


@router.post("/decode")
async def decode(
    image   : UploadFile = File(...),
    key     : str        = Form(None),
    payload : float      = Form(0.2),
):
    """
    Extract the hidden encrypted message from a stego image and decrypt it.
    """
    security = _get_security(payload)

    with tempfile.TemporaryDirectory() as tmp:
        ext        = os.path.splitext(image.filename or ".png")[1].lower() or ".png"
        stego_path = os.path.join(tmp, f"stego{ext}")
        content    = await image.read()
        with open(stego_path, "wb") as f:
            f.write(content)

        t0 = time.time()
        try:
            message = security.decode_image(stego_path, payload_bpp=payload)
        except ValueError as e:
            err = str(e)
            if "wrong key" in err.lower() or "decryption" in err.lower():
                code = "DECRYPTION_FAILED"
            elif "no hidden" in err.lower() or "invalid length" in err.lower():
                code = "NO_DATA_FOUND"
            else:
                code = "CORRUPTED_STEGO"
            raise HTTPException(
                400,
                detail={"status": "error", "error_code": code, "message": err},
            )
        except Exception as e:
            raise HTTPException(
                500,
                detail={"status": "error", "error_code": "DECODE_FAILED", "message": str(e)},
            )

        elapsed_ms = int((time.time() - t0) * 1000)

    return {
        "status"          : "success",
        "message"         : message,
        "message_length"  : len(message),
        "decoding_time_ms": elapsed_ms,
    }
