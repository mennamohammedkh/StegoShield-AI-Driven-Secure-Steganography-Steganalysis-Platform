"""
StegoShield — Test Suite (Person 2)
Covers: AES encryption, JUNIWARD steganography, Security API round-trip.
Run with:  python test_person2.py
"""

import os
import sys
import tempfile
import struct
import numpy as np
import cv2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "security"))
from encryption import (
    generate_key, save_key, load_key, encrypt, decrypt,
    key_to_hex, hex_to_key, encrypted_size, KEY_SIZE,
)
from steganography_juniward import (
    embed, extract, get_capacity, compute_psnr, compute_ssim,
)
from security_api import StegoSecurity


PASS = "  ✓  PASS"
FAIL = "  ✗  FAIL"


def make_cover(h=512, w=512, seed=0) -> tuple:
    """Return (cover_rgb, tmp_path) of a synthetic cover image."""
    np.random.seed(seed)
    img = np.random.randint(30, 220, (h, w, 3), dtype=np.uint8)
    for i in range(0, h, 8):
        img[i:i+2, :] = np.clip(img[i:i+2, :].astype(int) + 50, 0, 255)
    return img


def run_test(name: str, fn):
    try:
        fn()
        print(f"{PASS}  {name}")
        return True
    except Exception as e:
        print(f"{FAIL}  {name}")
        print(f"         → {e}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Encryption Tests
# ══════════════════════════════════════════════════════════════════════════════

def test_key_generation():
    key = generate_key()
    assert len(key) == KEY_SIZE
    key2 = generate_key()
    assert key != key2  # Keys must be random

def test_encrypt_decrypt_roundtrip():
    key = generate_key()
    msg = "Hello, StegoShield! 🔐"
    ct  = encrypt(msg, key)
    pt  = decrypt(ct, key)
    assert pt == msg

def test_encrypt_produces_different_ciphertext():
    key = generate_key()
    msg = "same message"
    ct1 = encrypt(msg, key)
    ct2 = encrypt(msg, key)
    assert ct1 != ct2  # Random IV → different ciphertext each time

def test_wrong_key_raises():
    key1 = generate_key()
    key2 = generate_key()
    ct   = encrypt("secret", key1)
    try:
        decrypt(ct, key2)
        assert False, "Should have raised"
    except ValueError:
        pass

def test_empty_message():
    key = generate_key()
    msg = ""
    ct  = encrypt(msg, key)
    pt  = decrypt(ct, key)
    assert pt == msg

def test_long_message():
    key = generate_key()
    msg = "A" * 10_000
    ct  = encrypt(msg, key)
    pt  = decrypt(ct, key)
    assert pt == msg

def test_unicode_message():
    key = generate_key()
    msg = "مرحبا! Hello! 你好! 🌍"
    ct  = encrypt(msg, key)
    pt  = decrypt(ct, key)
    assert pt == msg

def test_key_save_load(tmp_path=None):
    import tempfile
    with tempfile.TemporaryDirectory() as t:
        path = os.path.join(t, "key.bin")
        key  = generate_key()
        save_key(key, path)
        loaded = load_key(path)
        assert loaded == key

def test_key_hex_roundtrip():
    key = generate_key()
    h   = key_to_hex(key)
    k2  = hex_to_key(h)
    assert k2 == key


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — JUNIWARD Tests
# ══════════════════════════════════════════════════════════════════════════════

def test_capacity_positive():
    cover = make_cover()
    cap   = get_capacity(cover, 0.2)
    assert cap > 0

def test_capacity_scales_with_payload():
    cover = make_cover()
    c1 = get_capacity(cover, 0.1)
    c2 = get_capacity(cover, 0.4)
    assert c2 > c1

def test_embed_extract_roundtrip():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=1)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))

        secret = b"Round-trip test secret data 123!"
        embed(cp, secret, sp, 0.2)
        recovered = extract(sp, 0.2)
        assert recovered == secret

def test_psnr_above_threshold():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=2)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        _, psnr = embed(cp, b"test payload", sp, 0.2)
        assert psnr > 30, f"PSNR too low: {psnr}"

def test_stego_image_saved():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=3)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        embed(cp, b"exists?", sp, 0.2)
        assert os.path.exists(sp)

def test_different_payloads():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=4)
        cp = os.path.join(t, "c.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        secret = b"Test message for payload comparison"
        for bpp in [0.1, 0.2, 0.3, 0.4]:
            sp = os.path.join(t, f"s_{bpp}.png")
            embed(cp, secret, sp, bpp)
            rec = extract(sp, bpp)
            assert rec == secret, f"Failed at bpp={bpp}"

def test_binary_data_roundtrip():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=5)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        secret = bytes(range(256)) * 2   # all byte values
        embed(cp, secret, sp, 0.3)
        rec = extract(sp, 0.3)
        assert rec == secret

def test_psnr_metric():
    a = np.ones((100, 100, 3), dtype=np.uint8) * 128
    b = a.copy()
    b[0, 0] = 129
    psnr = compute_psnr(a, b)
    assert psnr > 50

def test_ssim_identical():
    a = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    ssim = compute_ssim(a, a)
    assert abs(ssim - 1.0) < 0.01


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 4 — Security API Tests
# ══════════════════════════════════════════════════════════════════════════════

def test_api_init_creates_key():
    with tempfile.TemporaryDirectory() as t:
        kf  = os.path.join(t, "k.bin")
        sec = StegoSecurity(key_file=kf)
        assert os.path.exists(kf)

def test_api_init_loads_existing_key():
    with tempfile.TemporaryDirectory() as t:
        kf    = os.path.join(t, "k.bin")
        sec1  = StegoSecurity(key_file=kf)
        key1  = sec1.get_key()
        sec2  = StegoSecurity(key_file=kf)
        assert sec2.get_key() == key1

def test_api_encrypt_decrypt():
    with tempfile.TemporaryDirectory() as t:
        sec = StegoSecurity(key_file=os.path.join(t, "k.bin"))
        msg = "API encrypt/decrypt test"
        ct  = sec.encrypt_message(msg)
        pt  = sec.decrypt_message(ct)
        assert pt == msg

def test_api_full_roundtrip():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=10)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))

        sec = StegoSecurity(key_file=os.path.join(t, "k.bin"), payload_bpp=0.2)
        msg = "Full round-trip test via StegoSecurity API!"
        sec.encode_image(cp, msg, sp)
        recovered = sec.decode_image(sp)
        assert recovered == msg

def test_api_wrong_key_rejected():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=11)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))

        sec1 = StegoSecurity(key_file=os.path.join(t, "k1.bin"))
        sec2 = StegoSecurity(key_file=os.path.join(t, "k2.bin"))
        sec1.encode_image(cp, "secret message", sp)
        try:
            sec2.decode_image(sp)
            assert False, "Should have raised"
        except ValueError:
            pass

def test_api_capacity_positive():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=12)
        cp  = os.path.join(t, "c.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        sec = StegoSecurity(key_file=os.path.join(t, "k.bin"))
        cap = sec.get_capacity(cp)
        assert cap > 0

def test_api_info_dict():
    with tempfile.TemporaryDirectory() as t:
        sec  = StegoSecurity(key_file=os.path.join(t, "k.bin"))
        info = sec.info()
        assert "AES-256-CBC"  in info["encryption"]
        assert "JUNIWARD"     in info["steganography"]
        assert info["key_loaded"] is True

def test_api_psnr_ssim():
    with tempfile.TemporaryDirectory() as t:
        cover = make_cover(seed=13)
        cp = os.path.join(t, "c.png")
        sp = os.path.join(t, "s.png")
        cv2.imwrite(cp, cv2.cvtColor(cover, cv2.COLOR_RGB2BGR))
        sec = StegoSecurity(key_file=os.path.join(t, "k.bin"))
        sec.encode_image(cp, "metrics test", sp)
        psnr = sec.get_psnr(cp, sp)
        ssim = sec.get_ssim(cp, sp)
        assert psnr > 30
        assert 0 < ssim <= 1


# ══════════════════════════════════════════════════════════════════════════════
# RUNNER
# ══════════════════════════════════════════════════════════════════════════════

def main():
    tests = [
        # Phase 1
        ("Key generation produces 32 bytes",         test_key_generation),
        ("Encrypt / decrypt round-trip",             test_encrypt_decrypt_roundtrip),
        ("Same plaintext → different ciphertext",    test_encrypt_produces_different_ciphertext),
        ("Wrong key raises ValueError",              test_wrong_key_raises),
        ("Empty message",                            test_empty_message),
        ("Long message (10 000 chars)",              test_long_message),
        ("Unicode / emoji message",                  test_unicode_message),
        ("Key save and load",                        test_key_save_load),
        ("Key hex round-trip",                       test_key_hex_roundtrip),
        # Phase 2
        ("Capacity > 0 at 0.2 bpp",                 test_capacity_positive),
        ("Capacity scales with payload",             test_capacity_scales_with_payload),
        ("JUNIWARD embed / extract round-trip",      test_embed_extract_roundtrip),
        ("PSNR > 30 dB after embedding",             test_psnr_above_threshold),
        ("Stego image file is saved",                test_stego_image_saved),
        ("Round-trip at 0.1, 0.2, 0.3, 0.4 bpp",   test_different_payloads),
        ("Binary data (all 256 byte values)",        test_binary_data_roundtrip),
        ("PSNR metric sanity check",                 test_psnr_metric),
        ("SSIM = 1.0 for identical images",          test_ssim_identical),
        # Phase 4
        ("API init creates key file",                test_api_init_creates_key),
        ("API loads existing key on re-init",        test_api_init_loads_existing_key),
        ("API encrypt / decrypt",                    test_api_encrypt_decrypt),
        ("API full encode / decode round-trip",      test_api_full_roundtrip),
        ("API wrong key → ValueError",               test_api_wrong_key_rejected),
        ("API capacity > 0",                         test_api_capacity_positive),
        ("API info() dict fields",                   test_api_info_dict),
        ("API PSNR and SSIM in range",               test_api_psnr_ssim),
    ]

    print("\n" + "=" * 65)
    print("  StegoShield — Person 2 Test Suite")
    print("=" * 65 + "\n")

    passed = failed = 0
    for name, fn in tests:
        ok = run_test(name, fn)
        if ok:
            passed += 1
        else:
            failed += 1

    total = passed + failed
    print("\n" + "=" * 65)
    print(f"  Results: {passed}/{total} passed  |  {failed} failed")
    print("=" * 65 + "\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
