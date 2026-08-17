"""
StegoShield — Phase 1: AES-256-CBC Encryption Module
Person 2: Security & Steganography Engineer

Provides symmetric encryption/decryption using AES-256 in CBC mode
with PKCS7 padding. Operates independently of all other modules.
"""

import os
import struct
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes


# ─── Constants ────────────────────────────────────────────────────────────────
KEY_SIZE   = 32   # 256 bits
IV_SIZE    = 16   # 128 bits (AES block size)
BLOCK_SIZE = 16


# ─── Key Management ──────────────────────────────────────────────────────────

def generate_key() -> bytes:
    """Generate a cryptographically secure 256-bit AES key."""
    return get_random_bytes(KEY_SIZE)


def save_key(key: bytes, filepath: str) -> None:
    """Save a key to a binary file."""
    with open(filepath, "wb") as f:
        f.write(key)
    print(f"[Crypto] Key saved → {filepath}")


def load_key(filepath: str) -> bytes:
    """Load a key from a binary file and validate its length."""
    with open(filepath, "rb") as f:
        key = f.read()
    if len(key) != KEY_SIZE:
        raise ValueError(f"Invalid key length: expected {KEY_SIZE} bytes, got {len(key)}")
    return key


def key_to_hex(key: bytes) -> str:
    """Convert key bytes to a hex string for display/logging."""
    return key.hex()


def hex_to_key(hex_str: str) -> bytes:
    """Convert a hex string back to key bytes."""
    key = bytes.fromhex(hex_str)
    if len(key) != KEY_SIZE:
        raise ValueError(f"Invalid key length from hex: expected {KEY_SIZE} bytes")
    return key


# ─── Core Encrypt / Decrypt ───────────────────────────────────────────────────

def encrypt(plaintext: str, key: bytes) -> bytes:
    """
    Encrypt a UTF-8 string using AES-256-CBC.

    Parameters
    ----------
    plaintext : str
        The secret message to encrypt.
    key : bytes
        32-byte AES key.

    Returns
    -------
    bytes
        IV (16 bytes) + ciphertext.  The IV is prepended so decrypt()
        can recover it without a separate channel.
    """
    if len(key) != KEY_SIZE:
        raise ValueError(f"Key must be {KEY_SIZE} bytes, got {len(key)}")

    iv        = get_random_bytes(IV_SIZE)
    cipher    = AES.new(key, AES.MODE_CBC, iv)
    padded    = pad(plaintext.encode("utf-8"), BLOCK_SIZE)
    ciphertext = cipher.encrypt(padded)

    # Prepend IV so the receiver can extract it
    return iv + ciphertext


def decrypt(ciphertext_with_iv: bytes, key: bytes) -> str:
    """
    Decrypt bytes produced by encrypt().

    Parameters
    ----------
    ciphertext_with_iv : bytes
        IV (16 bytes) followed by the ciphertext.
    key : bytes
        The same 32-byte AES key used for encryption.

    Returns
    -------
    str
        The original plaintext message.

    Raises
    ------
    ValueError
        On wrong key, corrupted data, or bad padding.
    """
    if len(key) != KEY_SIZE:
        raise ValueError(f"Key must be {KEY_SIZE} bytes, got {len(key)}")
    if len(ciphertext_with_iv) < IV_SIZE + BLOCK_SIZE:
        raise ValueError("Ciphertext too short — data may be corrupted")

    iv         = ciphertext_with_iv[:IV_SIZE]
    ciphertext = ciphertext_with_iv[IV_SIZE:]

    try:
        cipher  = AES.new(key, AES.MODE_CBC, iv)
        padded  = cipher.decrypt(ciphertext)
        plain   = unpad(padded, BLOCK_SIZE)
        return plain.decode("utf-8")
    except (ValueError, KeyError) as e:
        raise ValueError(f"Decryption failed — wrong key or corrupted data: {e}") from e


# ─── Utility: Byte-length reporting ──────────────────────────────────────────

def encrypted_size(message: str) -> int:
    """Return the byte size of the encrypted form of a given message."""
    msg_bytes = message.encode("utf-8")
    padded_len = ((len(msg_bytes) // BLOCK_SIZE) + 1) * BLOCK_SIZE
    return IV_SIZE + padded_len


# ─── Self-test ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  StegoShield — AES-256-CBC Encryption Self-Test")
    print("=" * 60)

    # 1. Key generation
    key = generate_key()
    print(f"\n[1] Generated key  : {key_to_hex(key)[:32]}...")

    # 2. Encrypt
    message = "Hello, StegoShield! This is a secret message. 🔐"
    cipher_bytes = encrypt(message, key)
    print(f"[2] Original msg   : {message}")
    print(f"    Encrypted size : {len(cipher_bytes)} bytes")

    # 3. Decrypt
    recovered = decrypt(cipher_bytes, key)
    print(f"[3] Decrypted msg  : {recovered}")
    assert recovered == message, "Round-trip FAILED"
    print("    ✓  Round-trip OK")

    # 4. Wrong-key detection
    bad_key = generate_key()
    try:
        decrypt(cipher_bytes, bad_key)
        print("    ✗  Wrong-key test FAILED (should have raised)")
    except ValueError as e:
        print(f"[4] Wrong-key correctly rejected: {e}")

    # 5. Key save / load
    save_key(key, "/tmp/test_key.bin")
    loaded = load_key("/tmp/test_key.bin")
    assert loaded == key
    print("[5] Key save/load  : ✓")

    print("\n  All tests passed!\n")
