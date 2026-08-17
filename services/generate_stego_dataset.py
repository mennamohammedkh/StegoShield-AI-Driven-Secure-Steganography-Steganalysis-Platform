"""
StegoShield — Phase 3: Stego Dataset Generator
Person 2 → delivers to Person 1 (ML Engineer)

Generates stego images from clean images using JUNIWARD at multiple
payload rates, producing a balanced labelled dataset for CNN training.

Usage
-----
    python generate_stego_dataset.py \
        --clean_dir   dataset/clean \
        --stego_dir   dataset/stego \
        --key_file    secret_key_for_dataset.bin \
        --payloads    0.1 0.2 0.3 0.4 \
        --workers     4

Output
------
    dataset/stego/          ← generated stego images
    dataset/dataset.csv     ← mapping: original, stego, payload, msg_length
    secret_key_for_dataset.bin
"""

import os
import csv
import argparse
import struct
import random
import string
import time
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import List, Tuple

# Internal modules
import sys
sys.path.insert(0, os.path.dirname(__file__))
from encryption import generate_key, save_key, load_key, encrypt
from steganography_juniward import embed, get_capacity


# ─── Supported image extensions ───────────────────────────────────────────────
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff"}


# ─── Random message generator ─────────────────────────────────────────────────

def _random_message(min_chars: int = 20, max_chars: int = 500) -> str:
    """Generate a random ASCII message of random length."""
    length = random.randint(min_chars, max_chars)
    chars  = string.ascii_letters + string.digits + " .,!?-_"
    return "".join(random.choices(chars, k=length))


# ─── Single-image worker ──────────────────────────────────────────────────────

def _process_one(args: Tuple) -> dict | None:
    """
    Worker function: encrypt a random message and embed into one image.

    Returns a dict with CSV row data, or None on failure.
    """
    cover_path, stego_dir, key_bytes, payload_bpp = args

    stem     = Path(cover_path).stem
    out_name = f"{stem}_stego_p{str(payload_bpp).replace('.', '')}.png"
    out_path = os.path.join(stego_dir, out_name)

    try:
        import cv2, numpy as np
        cover = cv2.imread(cover_path)
        if cover is None:
            return None

        # Check capacity
        cover_rgb = cv2.cvtColor(cover, cv2.COLOR_BGR2RGB)
        capacity  = get_capacity(cover_rgb, payload_bpp)
        if capacity < 10:
            return None

        # Generate & encrypt a random message that fits
        max_msg = min(capacity, 400)
        message = _random_message(10, max(10, max_msg))
        while len(message.encode()) > capacity:
            message = message[:len(message) // 2]

        cipher_bytes = encrypt(message, key_bytes)
        if len(cipher_bytes) > capacity:
            # Fall back to shorter message
            message      = message[:20]
            cipher_bytes = encrypt(message, key_bytes)

        _, psnr = embed(cover_path, cipher_bytes, out_path, payload_bpp)

        return {
            "original_image" : os.path.basename(cover_path),
            "stego_image"    : out_name,
            "payload_bpp"    : payload_bpp,
            "msg_length"     : len(cipher_bytes),
            "psnr_db"        : round(psnr, 3),
            "label"          : 1,
        }
    except Exception as e:
        print(f"  [WARN] Skipped {cover_path} @ {payload_bpp}: {e}")
        return None


# ─── Main generation pipeline ────────────────────────────────────────────────

def generate_dataset(
    clean_dir  : str,
    stego_dir  : str,
    key_file   : str,
    payloads   : List[float],
    workers    : int = 4,
    limit      : int = None,
) -> str:
    """
    Generate stego images from all clean images.

    Parameters
    ----------
    clean_dir : str   Folder containing original clean images.
    stego_dir : str   Destination folder for stego images.
    key_file  : str   Path to save/load the AES key.
    payloads  : list  Payload values in bpp (e.g. [0.1, 0.2, 0.3, 0.4]).
    workers   : int   Parallel workers (CPU cores).
    limit     : int   Max images to process (None = all).

    Returns
    -------
    str  Path to the generated CSV file.
    """
    os.makedirs(stego_dir, exist_ok=True)

    # ── Key setup ─────────────────────────────────────────────────────────────
    if os.path.exists(key_file):
        key = load_key(key_file)
        print(f"[Dataset] Loaded existing key from {key_file}")
    else:
        key = generate_key()
        save_key(key, key_file)
        print(f"[Dataset] Generated new key → {key_file}")

    # ── Collect clean images ──────────────────────────────────────────────────
    all_images = sorted([
        os.path.join(clean_dir, f)
        for f in os.listdir(clean_dir)
        if Path(f).suffix.lower() in IMAGE_EXTS
    ])
    if limit:
        all_images = all_images[:limit]

    print(f"[Dataset] Found {len(all_images)} clean images")
    print(f"[Dataset] Payloads : {payloads}")
    print(f"[Dataset] Workers  : {workers}")

    # Build task list: each image × each payload
    tasks = [
        (img, stego_dir, key, p)
        for img in all_images
        for p in payloads
    ]
    total = len(tasks)
    print(f"[Dataset] Total tasks: {total}")

    # ── Parallel processing ───────────────────────────────────────────────────
    results = []
    t0 = time.time()

    with ProcessPoolExecutor(max_workers=workers) as exe:
        futures = {exe.submit(_process_one, t): t for t in tasks}
        done = 0
        for fut in as_completed(futures):
            done += 1
            row = fut.result()
            if row:
                results.append(row)
            if done % 50 == 0 or done == total:
                elapsed = time.time() - t0
                print(
                    f"  Progress: {done}/{total}  "
                    f"success={len(results)}  "
                    f"elapsed={elapsed:.1f}s"
                )

    # ── Write CSV ─────────────────────────────────────────────────────────────
    csv_path = os.path.join(os.path.dirname(stego_dir), "dataset.csv")
    fieldnames = ["original_image", "stego_image", "payload_bpp",
                  "msg_length", "psnr_db", "label"]

    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    elapsed = time.time() - t0
    print(f"\n[Dataset] Done!  {len(results)} stego images generated in {elapsed:.1f}s")
    print(f"[Dataset] CSV → {csv_path}")
    print(f"[Dataset] Key → {key_file}  (share with Person 1)")
    return csv_path


# ─── Payload breakdown report ─────────────────────────────────────────────────

def print_summary(csv_path: str) -> None:
    """Print a quick summary of the generated dataset."""
    from collections import Counter

    with open(csv_path) as f:
        rows = list(csv.DictReader(f))

    by_payload = Counter(r["payload_bpp"] for r in rows)
    psnrs = [float(r["psnr_db"]) for r in rows if r["psnr_db"]]
    avg_psnr = sum(psnrs) / len(psnrs) if psnrs else 0

    print("\n" + "=" * 50)
    print("  Dataset Summary")
    print("=" * 50)
    print(f"  Total stego images : {len(rows)}")
    print(f"  Average PSNR       : {avg_psnr:.2f} dB")
    print("  By payload:")
    for p, n in sorted(by_payload.items()):
        print(f"    {p} bpp  →  {n} images")
    print("=" * 50)


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="StegoShield — Stego Dataset Generator (Person 2 → Person 1)"
    )
    parser.add_argument("--clean_dir", default="dataset/clean",
                        help="Folder with clean cover images")
    parser.add_argument("--stego_dir", default="dataset/stego",
                        help="Destination folder for stego images")
    parser.add_argument("--key_file",  default="secret_key_for_dataset.bin",
                        help="Path to AES key file (created if missing)")
    parser.add_argument("--payloads",  nargs="+", type=float,
                        default=[0.1, 0.2, 0.3, 0.4],
                        help="Payload values in bpp")
    parser.add_argument("--workers",   type=int, default=4,
                        help="Parallel worker processes")
    parser.add_argument("--limit",     type=int, default=None,
                        help="Limit number of cover images (for testing)")

    args = parser.parse_args()

    csv_out = generate_dataset(
        clean_dir = args.clean_dir,
        stego_dir = args.stego_dir,
        key_file  = args.key_file,
        payloads  = args.payloads,
        workers   = args.workers,
        limit     = args.limit,
    )
    print_summary(csv_out)
