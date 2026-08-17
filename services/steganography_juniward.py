"""
StegoShield — Phase 2: JUNIWARD Steganography Module
Person 2: Security & Steganography Engineer

JUNIWARD-inspired adaptive steganography:
  • DWT cost map computed from the GREEN channel (never modified)
  • LSB embedding into the BLUE channel
  • 100 % stable positions: green channel is identical in cover and stego,
    so the cost map — and therefore the selected bit positions — are
    perfectly reproduced at extraction time.

NO machine learning. All operations are deterministic.
"""

import os
import struct
import numpy as np
import pywt
import cv2
from typing import Tuple


# ─── Constants ────────────────────────────────────────────────────────────────
WAVELET     = "db4"
DWT_LEVELS  = 3
BETA        = 1.0
EPSILON     = 1e-10
HEADER_BITS = 32          # 4-byte uint32 stores message length
COST_CH     = 1           # Green channel → cost map (never modified)
EMBED_CH    = 0           # Blue channel  → data goes here


# ══════════════════════════════════════════════════════════════════════════════
# COST MAP  (JUNIWARD heuristic — DWT, signal processing only)
# ══════════════════════════════════════════════════════════════════════════════

def _compute_pixel_costs(channel: np.ndarray) -> np.ndarray:
    """
    Per-pixel embedding cost using DWT wavelet energies (JUNIWARD heuristic).

    rho[i] = 1 / (energy[i]^beta + epsilon)

    High energy (textured) → LOW cost  → preferred for embedding
    Low  energy (smooth)   → HIGH cost → avoided

    channel : uint8 array H×W — the GREEN channel of the image,
              which is never modified by embed(), so extract() sees
              the same values and produces the exact same cost map.
    """
    h, w   = channel.shape
    ch_f   = channel.astype(np.float64)
    coeffs = pywt.wavedec2(ch_f, WAVELET, level=DWT_LEVELS)

    energy = np.zeros((h, w), dtype=np.float64)
    count  = 0
    for detail in coeffs[1:]:
        for subband in detail:
            up = cv2.resize(np.abs(subband), (w, h), interpolation=cv2.INTER_LINEAR)
            energy += up
            count  += 1
    if count:
        energy /= count

    return 1.0 / (energy ** BETA + EPSILON)


def _select_positions(costs_flat: np.ndarray, n_bits: int) -> np.ndarray:
    """
    Select n_bits embedding positions from the cheapest 60 % pool.

    Steps:
      1. Find cheapest 60 % of positions (argpartition — fast).
      2. Sort that pool by flat index (deterministic, no ties).
      3. Return the first n_bits positions.

    Because costs come from the unmodified green channel, the pool is
    identical between embed and extract → positions are 100 % reproducible.
    """
    n_total   = len(costs_flat)
    pool_size = min(n_total, max(n_bits, int(n_total * 0.60)))

    if n_bits > pool_size:
        raise ValueError(f"Need {n_bits} positions, pool only has {pool_size}.")

    pool = np.argpartition(costs_flat, pool_size)[:pool_size]
    pool.sort()          # sort by index for deterministic ordering
    return pool[:n_bits]


# ══════════════════════════════════════════════════════════════════════════════
# BIT / BYTE HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _bytes_to_bits(data: bytes) -> np.ndarray:
    """bytes → 1-D uint8 bit array (MSB first)."""
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8)).astype(np.uint8)


def _bits_to_bytes(bits: np.ndarray) -> bytes:
    """1-D bit array → bytes (MSB first, zero-padded to multiple of 8)."""
    rem = len(bits) % 8
    if rem:
        bits = np.concatenate([bits, np.zeros(8 - rem, dtype=np.uint8)])
    return np.packbits(bits).tobytes()


# ══════════════════════════════════════════════════════════════════════════════
# CAPACITY
# ══════════════════════════════════════════════════════════════════════════════

def get_capacity(image: np.ndarray, payload_bpp: float = 0.2) -> int:
    """
    Maximum embeddable bytes (4-byte header excluded from result).

    Parameters
    ----------
    image       : H×W×3 uint8 array (BGR or RGB — only shape used).
    payload_bpp : bits per pixel embedding rate (0.05 – 0.45).
    """
    h, w       = image.shape[:2]
    total_bits = int(h * w * payload_bpp)
    return max(0, (total_bits - HEADER_BITS) // 8)


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def embed(cover_image_path: str,
          secret_data: bytes,
          output_path: str,
          payload_bpp: float = 0.2) -> Tuple[str, float]:
    """
    Hide encrypted bytes inside a cover image (JUNIWARD-inspired).

    Pipeline
    --------
    1. Load cover image as BGR uint8 (OpenCV native, lossless).
    2. Compute JUNIWARD cost map from the GREEN channel (channel 1).
    3. Select cheapest positions in the BLUE channel (channel 0).
    4. Write [4-byte length header | message] into blue-pixel LSBs.
    5. Save as lossless PNG — green channel unchanged.

    Parameters
    ----------
    cover_image_path : str    Path to cover image (PNG/BMP preferred).
    secret_data      : bytes  Encrypted payload to hide.
    output_path      : str    Output stego image path (.png).
    payload_bpp      : float  Bits per pixel (0.05 – 0.45).

    Returns
    -------
    (output_path, psnr_db) : str, float
    """
    if not os.path.exists(cover_image_path):
        raise FileNotFoundError(f"Cover image not found: {cover_image_path}")

    cover = cv2.imread(cover_image_path, cv2.IMREAD_COLOR)
    if cover is None:
        raise ValueError(f"Cannot read: {cover_image_path}")

    capacity = get_capacity(cover, payload_bpp)
    if len(secret_data) > capacity:
        h, w = cover.shape[:2]
        raise ValueError(
            f"Message {len(secret_data)} B > capacity {capacity} B "
            f"at {payload_bpp} bpp for {w}×{h} image."
        )

    # Cost map: GREEN channel (will not be touched)
    green_ch   = cover[:, :, COST_CH].astype(np.uint8)
    costs_flat = _compute_pixel_costs(green_ch).flatten()

    # Bit payload: 4-byte header + message
    header       = struct.pack(">I", len(secret_data))
    message_bits = _bytes_to_bits(header + secret_data)
    positions    = _select_positions(costs_flat, len(message_bits))

    # Embed into BLUE channel
    stego   = cover.copy()
    bf      = stego[:, :, EMBED_CH].flatten().astype(np.int32)
    for i, pos in enumerate(positions):
        bf[pos] = (int(bf[pos]) & ~1) | int(message_bits[i])
    stego[:, :, EMBED_CH] = bf.reshape(cover.shape[:2]).astype(np.uint8)

    # Save lossless PNG
    cv2.imwrite(output_path, stego, [cv2.IMWRITE_PNG_COMPRESSION, 0])

    # Quality metrics (convert to RGB for comparison)
    cover_rgb = cv2.cvtColor(cover, cv2.COLOR_BGR2RGB)
    stego_rgb = cv2.cvtColor(stego, cv2.COLOR_BGR2RGB)
    psnr = compute_psnr(cover_rgb, stego_rgb)

    print(f"[JUNIWARD] Embed OK  |  {payload_bpp} bpp  "
          f"|  msg={len(secret_data)} B  |  PSNR={psnr:.2f} dB")
    return output_path, psnr


def extract(stego_image_path: str, payload_bpp: float = 0.2) -> bytes:
    """
    Extract hidden bytes from a stego image produced by embed().

    Cost map recomputed from GREEN channel (identical to embed time,
    since green was never modified) → exact same positions selected.

    Parameters
    ----------
    stego_image_path : str    Path to stego PNG.
    payload_bpp      : float  Must match the value used at embed time.

    Returns
    -------
    bytes  Raw hidden data (still encrypted — pass to decrypt()).
    """
    if not os.path.exists(stego_image_path):
        raise FileNotFoundError(f"Stego image not found: {stego_image_path}")

    stego = cv2.imread(stego_image_path, cv2.IMREAD_COLOR)
    if stego is None:
        raise ValueError(f"Cannot read: {stego_image_path}")

    # Cost map from GREEN (unchanged), read data from BLUE
    green_ch   = stego[:, :, COST_CH].astype(np.uint8)
    costs_flat = _compute_pixel_costs(green_ch).flatten()
    blue_flat  = stego[:, :, EMBED_CH].flatten().astype(np.int32)

    # Step 1: read 32-bit length header
    hdr_pos  = _select_positions(costs_flat, HEADER_BITS)
    hdr_bits = np.array([int(blue_flat[p]) & 1 for p in hdr_pos], dtype=np.uint8)
    msg_len  = struct.unpack(">I", _bits_to_bytes(hdr_bits)[:4])[0]

    capacity = get_capacity(stego, payload_bpp)
    if msg_len == 0 or msg_len > capacity:
        raise ValueError(
            f"Invalid length header ({msg_len} B, capacity={capacity} B). "
            "Wrong payload_bpp or image not produced by JUNIWARD embed()."
        )

    # Step 2: read all data bits
    total_bits = HEADER_BITS + msg_len * 8
    all_pos    = _select_positions(costs_flat, total_bits)
    all_bits   = np.array([int(blue_flat[p]) & 1 for p in all_pos], dtype=np.uint8)

    result = _bits_to_bytes(all_bits[HEADER_BITS:])[:msg_len]
    print(f"[JUNIWARD] Extract OK  |  recovered={msg_len} bytes")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# QUALITY METRICS
# ══════════════════════════════════════════════════════════════════════════════

def compute_psnr(cover: np.ndarray, stego: np.ndarray) -> float:
    """Peak Signal-to-Noise Ratio in dB. Higher = better. Target: >40 dB."""
    mse = np.mean((cover.astype(np.float64) - stego.astype(np.float64)) ** 2)
    return float("inf") if mse == 0 else 10 * np.log10(255.0**2 / mse)


def compute_ssim(cover: np.ndarray, stego: np.ndarray) -> float:
    """Structural Similarity Index [0,1]. Higher = better. Target: >0.95."""
    c1, c2 = (0.01*255)**2, (0.03*255)**2
    a, b   = cover.astype(np.float64), stego.astype(np.float64)
    ma, mb = a.mean(), b.mean()
    va     = ((a-ma)**2).mean()
    vb     = ((b-mb)**2).mean()
    cab    = ((a-ma)*(b-mb)).mean()
    return float(((2*ma*mb+c1)*(2*cab+c2)) / ((ma**2+mb**2+c1)*(va+vb+c2)))


# ══════════════════════════════════════════════════════════════════════════════
# SELF-TEST
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import tempfile
    print("=" * 65)
    print("  StegoShield — JUNIWARD Self-Test")
    print("=" * 65)
    np.random.seed(42)
    cover = np.random.randint(50, 200, (512, 512, 3), dtype=np.uint8)
    with tempfile.TemporaryDirectory() as t:
        cp, sp = f"{t}/cover.png", f"{t}/stego.png"
        cv2.imwrite(cp, cover)
        secret = b"Hello JUNIWARD! Encrypted payload test." * 5
        _, psnr = embed(cp, secret, sp, 0.2)
        cover_rgb = cv2.cvtColor(cv2.imread(cp), cv2.COLOR_BGR2RGB)
        stego_rgb = cv2.cvtColor(cv2.imread(sp), cv2.COLOR_BGR2RGB)
        ssim = compute_ssim(cover_rgb, stego_rgb)
        print(f"PSNR={psnr:.2f} dB   SSIM={ssim:.4f}")
        rec = extract(sp, 0.2)
        assert rec == secret, f"MISMATCH: {rec[:20]}"
        print("✓  Round-trip PERFECT")
