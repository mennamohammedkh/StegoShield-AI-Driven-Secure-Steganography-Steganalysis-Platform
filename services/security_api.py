"""
StegoShield — Phase 4: Unified Security API
Person 2 → delivers to Person 3 (Backend Engineer)

One class that wraps AES-256 encryption + JUNIWARD steganography.
Person 3 only needs these imports:

    from security_api import StegoSecurity

    sec = StegoSecurity(key_file="security_key.bin")
    stego_path, psnr = sec.encode_image("cover.png", "My secret", "stego.png")
    message          = sec.decode_image("stego.png")
"""

import os
import cv2
import numpy as np
from typing import Optional, Tuple

# Internal modules (same package)
import sys
sys.path.insert(0, os.path.dirname(__file__))
from encryption import (
    generate_key, save_key, load_key,
    encrypt, decrypt, encrypted_size,
    KEY_SIZE,
)
from steganography_juniward import (
    embed, extract,
    get_capacity, compute_psnr, compute_ssim,
)


class StegoSecurity:
    """
    Unified interface for encryption + steganographic embedding.

    Person 3 (Backend) uses this class directly — no need to understand
    AES or JUNIWARD internals.

    Parameters
    ----------
    key_file    : str   Path to a .bin key file.
                        If it doesn't exist, a new key is generated and saved.
    payload_bpp : float Embedding rate in bits-per-pixel (default 0.2).
    """

    def __init__(
        self,
        key_file    : str   = "security_key.bin",
        payload_bpp : float = 0.2,
    ):
        self.payload_bpp = payload_bpp
        self.key_file    = key_file

        if os.path.exists(key_file):
            self._key = load_key(key_file)
            print(f"[StegoSecurity] Key loaded from {key_file}")
        else:
            self._key = generate_key()
            save_key(self._key, key_file)
            print(f"[StegoSecurity] New key generated → {key_file}")

    # ─── Key Management ───────────────────────────────────────────────────────

    def get_key(self) -> bytes:
        """Return the raw AES key bytes."""
        return self._key

    def get_key_hex(self) -> str:
        """Return the AES key as a hex string (for logging / storage)."""
        return self._key.hex()

    def set_key_from_hex(self, hex_str: str) -> None:
        """Load a key from a hex string (e.g. from env variable)."""
        from encryption import hex_to_key
        self._key = hex_to_key(hex_str)

    # ─── Encryption (standalone) ──────────────────────────────────────────────

    def encrypt_message(self, plaintext: str) -> bytes:
        """
        Encrypt a string with AES-256-CBC.

        Parameters
        ----------
        plaintext : str  The secret message.

        Returns
        -------
        bytes  IV + ciphertext (ready for embedding).
        """
        return encrypt(plaintext, self._key)

    def decrypt_message(self, cipher_bytes: bytes) -> str:
        """
        Decrypt bytes produced by encrypt_message().

        Parameters
        ----------
        cipher_bytes : bytes  IV + ciphertext.

        Returns
        -------
        str  Original plaintext.

        Raises
        ------
        ValueError  On wrong key or corrupted data.
        """
        return decrypt(cipher_bytes, self._key)

    # ─── Full Pipeline: Encode ─────────────────────────────────────────────────

    def encode_image(
        self,
        cover_image_path : str,
        message          : str,
        output_path      : str,
        payload_bpp      : Optional[float] = None,
    ) -> Tuple[str, float]:
        """
        Full pipeline: encrypt message → embed into cover image.

        Parameters
        ----------
        cover_image_path : str    Path to the cover image.
        message          : str    The secret text to hide.
        output_path      : str    Where to save the stego image.
        payload_bpp      : float  Optional override for embedding rate.

        Returns
        -------
        (output_path, psnr_db) : str, float

        Raises
        ------
        ValueError         On capacity or format errors.
        FileNotFoundError  If cover image not found.
        """
        bpp          = payload_bpp or self.payload_bpp
        cipher_bytes = self.encrypt_message(message)
        return embed(cover_image_path, cipher_bytes, output_path, bpp)

    # ─── Full Pipeline: Decode ────────────────────────────────────────────────

    def decode_image(
        self,
        stego_image_path : str,
        payload_bpp      : Optional[float] = None,
    ) -> str:
        """
        Full pipeline: extract embedded bytes → decrypt to plaintext.

        Parameters
        ----------
        stego_image_path : str    Path to the stego image.
        payload_bpp      : float  Optional override (must match encode).

        Returns
        -------
        str  The original secret message.

        Raises
        ------
        ValueError         On wrong payload, corrupted data, or bad key.
        FileNotFoundError  If stego image not found.
        """
        bpp          = payload_bpp or self.payload_bpp
        cipher_bytes = extract(stego_image_path, bpp)
        return self.decrypt_message(cipher_bytes)

    # ─── Capacity ─────────────────────────────────────────────────────────────

    def get_capacity(
        self,
        image_path  : str,
        payload_bpp : Optional[float] = None,
    ) -> int:
        """
        Return max message size (bytes) for the given image and payload.

        Parameters
        ----------
        image_path  : str    Path to the image.
        payload_bpp : float  Optional override.

        Returns
        -------
        int  Maximum plaintext bytes (conservative — accounts for encryption overhead).
        """
        bpp = payload_bpp or self.payload_bpp
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        raw_cap = get_capacity(rgb, bpp)
        # Subtract AES overhead: IV (16) + at most 1 block of padding (16)
        return max(0, raw_cap - 32)

    # ─── Quality Metrics ──────────────────────────────────────────────────────

    def get_psnr(
        self,
        cover_path : str,
        stego_path : str,
    ) -> float:
        """
        Compute PSNR between cover and stego image (dB, higher = better).
        Target: > 40 dB.
        """
        cover = cv2.cvtColor(cv2.imread(cover_path), cv2.COLOR_BGR2RGB)
        stego = cv2.cvtColor(cv2.imread(stego_path), cv2.COLOR_BGR2RGB)
        return compute_psnr(cover, stego)

    def get_ssim(
        self,
        cover_path : str,
        stego_path : str,
    ) -> float:
        """
        Compute SSIM between cover and stego image ([0, 1], higher = better).
        Target: > 0.95.
        """
        cover = cv2.cvtColor(cv2.imread(cover_path), cv2.COLOR_BGR2RGB)
        stego = cv2.cvtColor(cv2.imread(stego_path), cv2.COLOR_BGR2RGB)
        return compute_ssim(cover, stego)

    # ─── Info ─────────────────────────────────────────────────────────────────

    def info(self) -> dict:
        """Return a summary dict useful for API responses."""
        return {
            "encryption"    : "AES-256-CBC",
            "steganography" : "JUNIWARD (DWT db8 + STC)",
            "payload_bpp"   : self.payload_bpp,
            "key_file"      : self.key_file,
            "key_loaded"    : self._key is not None,
        }

    def __repr__(self) -> str:
        return (
            f"StegoSecurity(key_file={self.key_file!r}, "
            f"payload_bpp={self.payload_bpp})"
        )


# ══════════════════════════════════════════════════════════════════════════════
# SELF-TEST — Full round-trip
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import tempfile

    print("=" * 65)
    print("  StegoShield — Security API Full Round-Trip Test")
    print("=" * 65)

    with tempfile.TemporaryDirectory() as tmp:
        key_path   = os.path.join(tmp, "security_key.bin")
        cover_path = os.path.join(tmp, "cover.png")
        stego_path = os.path.join(tmp, "stego.png")

        # Create a synthetic cover image
        np.random.seed(7)
        cover_rgb = np.random.randint(30, 220, (512, 512, 3), dtype=np.uint8)
        for i in range(0, 512, 8):
            cover_rgb[i:i+2, :] = np.clip(cover_rgb[i:i+2, :].astype(int) + 60, 0, 255)
        cv2.imwrite(cover_path, cv2.cvtColor(cover_rgb, cv2.COLOR_RGB2BGR))

        # ── Create API instance ────────────────────────────────────────────────
        sec = StegoSecurity(key_file=key_path, payload_bpp=0.2)
        print(f"\n[1] API info      : {sec.info()}")

        # ── Capacity check ────────────────────────────────────────────────────
        cap = sec.get_capacity(cover_path)
        print(f"[2] Capacity      : {cap} bytes (after AES overhead)")

        # ── Encode ────────────────────────────────────────────────────────────
        message = "Top secret message: launch codes are 🔐 Alpha-Bravo-7-7!"
        assert len(message.encode()) <= cap, "Test message too long"

        out, psnr = sec.encode_image(cover_path, message, stego_path)
        ssim = sec.get_ssim(cover_path, stego_path)
        print(f"[3] Encode OK     : PSNR={psnr:.2f} dB  SSIM={ssim:.4f}")
        assert psnr > 35, f"PSNR too low: {psnr}"

        # ── Decode ────────────────────────────────────────────────────────────
        recovered = sec.decode_image(stego_path)
        print(f"[4] Decoded msg   : {recovered}")
        assert recovered == message, f"Round-trip FAILED: got {recovered!r}"
        print("    ✓  Messages match!")

        # ── Wrong key rejection ───────────────────────────────────────────────
        sec2 = StegoSecurity(key_file=os.path.join(tmp, "wrong_key.bin"))
        try:
            sec2.decode_image(stego_path)
            print("    ✗  Wrong key test FAILED")
        except ValueError as e:
            print(f"[5] Wrong key     : correctly rejected ✓")

        print("\n  Full round-trip PASSED!\n")

        # ── Show what Person 3 receives ───────────────────────────────────────
        print("-" * 65)
        print("  Person 3 usage example:")
        print("-" * 65)
        print("  from security_api import StegoSecurity")
        print()
        print("  sec = StegoSecurity(key_file='security_key.bin')")
        print()
        print("  # On POST /encode:")
        print("  path, psnr = sec.encode_image(cover, message, output)")
        print()
        print("  # On POST /decode:")
        print("  text = sec.decode_image(stego_path)")
        print()
        print("  # Capacity check before encoding:")
        print("  max_bytes = sec.get_capacity(image_path)")
        print("-" * 65)
