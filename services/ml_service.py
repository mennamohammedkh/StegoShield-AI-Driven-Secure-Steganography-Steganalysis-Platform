# services/ml_service.py
"""
ML Detection Service using YedroudjNet
Trained on JUNIWARD steganography (ALASKA2 dataset)
"""

import onnxruntime as ort
import numpy as np
import cv2
import os
from pathlib import Path

class SteganoDetector:
    """
    YedroudjNet-based steganalysis detector.
    Input: RGB image (any size) → converted to 512×512 grayscale
    Output: Probability of being STEGO (0=Clean, 1=Stego)
    """
    
    def __init__(self, model_dir: str = "services/models"):
        """
        Load YedroudjNet ONNX model.
        
        Args:
            model_dir: Directory containing:
                - YedroudjNet_JUNIWARD_Classification.onnx
                - YedroudjNet_JUNIWARD_Classification.onnx.data
        """
        model_path = Path(model_dir) / "YedroudjNet_JUNIWARD_Classification.onnx"
        
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                f"Make sure both .onnx and .onnx.data files are in {model_dir}"
            )
        
        # Load ONNX model (runtime handles the .data file automatically)
        self.session = ort.InferenceSession(str(model_path))
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        
        # Model expects: (batch, 1, 512, 512) - grayscale, 512x512
        print(f"✅ YedroudjNet model loaded")
        print(f"   Input: {self.session.get_inputs()[0].shape}")
        print(f"   Output: {self.session.get_outputs()[0].shape}")
    
    def preprocess(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for YedroudjNet.
        
        Steps:
        1. Load image (RGB)
        2. Convert to grayscale (1 channel)
        3. Resize to 512×512
        4. Normalize to [0, 1]
        5. Add batch dimension
        
        Returns: (1, 1, 512, 512) float32 array
        """
        # 1. Load image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        
        # 2. Convert BGR to RGB (OpenCV default is BGR)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # 3. Convert to grayscale (YedroudjNet expects 1 channel)
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # 4. Resize to 512×512 (model's expected input size)
        img = cv2.resize(img, (512, 512))
        
        # 5. Normalize: [0, 255] → [0, 1]
        img = img.astype(np.float32) / 255.0
        
        # 6. Add channel dimension: (512, 512) → (1, 512, 512)
        img = np.expand_dims(img, axis=0)
        
        # 7. Add batch dimension: (1, 512, 512) → (1, 1, 512, 512)
        img = np.expand_dims(img, axis=0)
        
        return img
    
    def predict(self, image_path: str) -> dict:
        """
        Predict if image contains hidden data.
        
        Returns:
            {
                "label": "CLEAN" or "STEGO",
                "confidence": float (0-1),
                "raw_probability": float,
                "model": "YedroudjNet_JUNIWARD"
            }
        """
        # Preprocess
        input_tensor = self.preprocess(image_path)
        
        # Run inference
        outputs = self.session.run(
            [self.output_name], 
            {self.input_name: input_tensor}
        )
        
        # Get logit and apply sigmoid
        logit = outputs[0][0][0]
        probability = 1.0 / (1.0 + np.exp(-logit))
        
        return {
            "label": "STEGO" if probability > 0.5 else "CLEAN",
            "confidence": probability if probability > 0.5 else 1 - probability,
            "raw_probability": float(probability),
            "logit": float(logit),
            "model": "YedroudjNet_JUNIWARD",
            "input_size": "512x512 grayscale"
        }
    
    def predict_batch(self, image_paths: list) -> list:
        """Predict multiple images (for efficiency)."""
        results = []
        for path in image_paths:
            results.append(self.predict(path))
        return results


# Singleton instance for FastAPI
_detector = None

def get_detector() -> SteganoDetector:
    """Lazy loader - model loads once on first API call."""
    global _detector
    if _detector is None:
        _detector = SteganoDetector()
    return _detector

def detect_image(image_path: str) -> dict:
    """Convenience function for API endpoint."""
    return get_detector().predict(image_path)


# ═══════════════════════════════════════════════════════════════════════════
# Self-test
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("  YedroudjNet SteganoDetector - Self Test")
    print("=" * 60)
    
    # Check if model exists
    model_path = Path("services/models/YedroudjNet_JUNIWARD_Classification.onnx")
    if not model_path.exists():
        print("❌ Model not found. Run this from the project root with:")
        print("   python -m services.ml_service")
        sys.exit(1)
    
    # Test with a sample image (you need to provide one)
    import glob
    test_images = glob.glob("uploads/*.png") + glob.glob("uploads/*.jpg")
    
    if test_images:
        detector = SteganoDetector()
        for img_path in test_images[:3]:
            result = detector.predict(img_path)
            print(f"\n📷 {img_path}")
            print(f"   Prediction: {result['label']}")
            print(f"   Confidence: {result['confidence']:.4f}")
            print(f"   Probability: {result['raw_probability']:.4f}")
    else:
        print("\n⚠️ No test images found in 'uploads/' folder")
        print("   Place test images there and run again.")
    
    print("\n✅ ML Service ready!")