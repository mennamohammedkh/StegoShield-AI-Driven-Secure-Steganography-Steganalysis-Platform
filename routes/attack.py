"""
/attack endpoint — applies image transformations to stego images
and measures how much hidden data survives.
"""

import os
import time
import json
import tempfile
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

router = APIRouter()

ATTACK_TYPES = {"jpeg_compression", "gaussian_noise", "resize", "brightness"}


def _apply_attack(img_path: str, attack_type: str, params: dict, out_path: str):
    """Apply the requested image attack and save result."""
    import cv2

    img = cv2.imread(img_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot read stego image.")

    if attack_type == "jpeg_compression":
        quality = int(params.get("quality", 75))
        cv2.imwrite(out_path, img, [cv2.IMWRITE_JPEG_QUALITY, quality])
        # Reload so we get the actual JPEG-degraded version
        img = cv2.imread(out_path)
        cv2.imwrite(out_path, img, [cv2.IMWRITE_PNG_COMPRESSION, 0])

    elif attack_type == "gaussian_noise":
        sigma = float(params.get("sigma", 10))
        noise = np.random.normal(0, sigma, img.shape).astype(np.float32)
        noisy = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        cv2.imwrite(out_path, noisy, [cv2.IMWRITE_PNG_COMPRESSION, 0])

    elif attack_type == "resize":
        scale  = float(params.get("scale", 0.5))
        h, w   = img.shape[:2]
        small  = cv2.resize(img, (max(1, int(w*scale)), max(1, int(h*scale))))
        result = cv2.resize(small, (w, h))
        cv2.imwrite(out_path, result, [cv2.IMWRITE_PNG_COMPRESSION, 0])

    elif attack_type == "brightness":
        delta  = int(params.get("delta", 30))
        bright = np.clip(img.astype(np.int32) + delta, 0, 255).astype(np.uint8)
        cv2.imwrite(out_path, bright, [cv2.IMWRITE_PNG_COMPRESSION, 0])

    else:
        raise ValueError(f"Unknown attack type: {attack_type}")


def _compute_ber(original_msg: str, recovered_msg: str) -> float:
    """Bit error rate between two strings (byte-level)."""
    ob = original_msg.encode("utf-8", errors="replace")
    rb = recovered_msg.encode("utf-8", errors="replace")
    length = max(len(ob), len(rb))
    if length == 0:
        return 0.0
    errors = 0
    for i in range(length):
        ob_byte = ob[i] if i < len(ob) else 0
        rb_byte = rb[i] if i < len(rb) else 0
        errors += bin(ob_byte ^ rb_byte).count("1")
    return round(errors / (length * 8), 4)


def _char_accuracy(original: str, recovered: str) -> float:
    if not original:
        return 1.0
    correct = sum(a == b for a, b in zip(original, recovered))
    return round(correct / max(len(original), len(recovered)), 4)


def _psnr(img1_path, img2_path) -> float:
    import cv2
    a = cv2.imread(img1_path).astype(np.float64)
    b = cv2.imread(img2_path).astype(np.float64)
    mse = np.mean((a - b) ** 2)
    return float("inf") if mse == 0 else round(10 * np.log10(255**2 / mse), 2)


@router.post("/attack")
async def attack(
    image        : UploadFile = File(...),
    message      : str        = Form(...),      # the ORIGINAL secret message
    attack_type  : str        = Form("jpeg_compression"),
    attack_params: str        = Form("{}"),     # JSON string
    payload      : float      = Form(0.2),
):
    """
    Apply an image attack to a stego image and measure data survival.
    The caller must provide the original message for comparison.
    """
    if attack_type not in ATTACK_TYPES:
        raise HTTPException(
            400,
            detail={
                "status"     : "error",
                "error_code" : "INVALID_ATTACK",
                "message"    : f"Unknown attack. Choose from: {sorted(ATTACK_TYPES)}",
            },
        )

    try:
        params = json.loads(attack_params)
    except json.JSONDecodeError:
        params = {}

    # Import Person 2's security module
    try:
        from security_api import StegoSecurity
        key_file = os.path.join(
            os.path.dirname(__file__), "..", "keys", "security_key.bin"
        )
        security = StegoSecurity(key_file=key_file, payload_bpp=payload)
    except ImportError as e:
        raise HTTPException(503, f"Security module not available: {e}")

    with tempfile.TemporaryDirectory() as tmp:
        ext        = os.path.splitext(image.filename or ".png")[1].lower() or ".png"
        stego_path = os.path.join(tmp, f"stego{ext}")
        attacked_path = os.path.join(tmp, "attacked.png")

        content = await image.read()
        with open(stego_path, "wb") as f:
            f.write(content)

        t0 = time.time()
        try:
            _apply_attack(stego_path, attack_type, params, attacked_path)
        except ValueError as e:
            raise HTTPException(
                400,
                detail={"status": "error", "error_code": "ATTACK_FAILED", "message": str(e)},
            )

        # Try to decode from the attacked image
        recovered = ""
        decode_error = None
        try:
            recovered = security.decode_image(attacked_path, payload_bpp=payload)
        except Exception as e:
            decode_error = str(e)

        elapsed_ms = int((time.time() - t0) * 1000)
        psnr_val   = _psnr(stego_path, attacked_path)
        ber        = _compute_ber(message, recovered)
        char_acc   = _char_accuracy(message, recovered)
        full_rec   = (recovered == message)

    return {
        "status"           : "success",
        "attack_type"      : attack_type,
        "attack_params"    : params,
        "attack_time_ms"   : elapsed_ms,
        "metrics"          : {
            "bit_error_rate"    : ber,
            "character_accuracy": char_acc,
            "full_recovery"     : full_rec,
            "psnr_after_attack" : psnr_val,
        },
        "extracted_preview": recovered[:80] if recovered else "",
        "decode_error"     : decode_error,
    }
