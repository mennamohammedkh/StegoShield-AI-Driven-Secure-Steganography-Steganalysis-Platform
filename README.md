# StegoShield-AI-Driven-Secure-Steganography-Steganalysis-Platform
AI-driven secure steganography and steganalysis platform combining AES-256 encryption, adaptive image steganography, and CNN-based detection.
# 🛡️ StegoShield — AI-Driven Secure Steganography & Steganalysis Platform

> Hide data invisibly. Detect it intelligently. Secure it cryptographically.

StegoShield is a full-stack system that combines **AES-256 encryption**, **adaptive image steganography (JUNIWARD-inspired)**, and **AI-based steganalysis (CNN)** into one platform — letting you securely hide encrypted messages inside images, and detect whether an image contains hidden data at all.

---

## ✨ Key Features

- 🔐 **AES-256-CBC Encryption** — every hidden message is encrypted before embedding, with a random IV per message and PKCS7 padding.
- 🖼️ **JUNIWARD-Inspired Adaptive Steganography** — a deterministic embedding pipeline that computes a DWT (Discrete Wavelet Transform, db4) cost map from the image's green channel and embeds data in the least-detectable pixels of the blue channel, achieving:
  - **PSNR > 40 dB**
  - **SSIM > 0.95**
- 🤖 **AI Steganalysis (YedroudjNet CNN)** — a convolutional neural network trained on the ALASKA2/JUNIWARD dataset, served via ONNX Runtime, to classify images as **CLEAN** or **STEGO** with confidence scoring.
- ⚔️ **Robustness Attack Simulator** — tests how well hidden data survives real-world image transformations: JPEG compression, Gaussian noise, resizing, and brightness changes — reporting bit-error-rate, character accuracy, and PSNR degradation.
- 🚀 **FastAPI Backend** — clean REST API with `/encode`, `/decode`, `/detect`, and `/attack` endpoints, full error handling, and CORS support.
- 💻 **React Frontend** — drag-and-drop image upload, live encode/decode workflows, and an interactive attack-simulation dashboard.
- 🐳 **Dockerized** — one-command deployment via Docker Compose (backend + frontend).
- ✅ **Tested** — a 26-test automated suite covering encryption, steganography round-trips, and full API integration.

---

## 🧠 How It Works

```
Secret Message
      │
      ▼
 AES-256-CBC Encryption (random IV)
      │
      ▼
 JUNIWARD Cost Map (DWT on green channel)
      │
      ▼
 Adaptive LSB Embedding (blue channel)
      │
      ▼
   Stego Image (lossless PNG)
```

On the detection side, the **YedroudjNet CNN** independently analyzes any image (clean or stego) and predicts the presence of hidden data — without needing the encryption key.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Steganography & Crypto | Python, OpenCV, PyWavelets, PyCryptodome |
| Machine Learning | PyTorch, ONNX / ONNX Runtime, YedroudjNet CNN |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Axios, react-dropzone |
| Deployment | Docker, Docker Compose |
| Testing | Custom Python test suite (26 tests) |

---

## 📡 API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/v1/encode` | Encrypt a message and embed it into a cover image |
| `POST /api/v1/decode` | Extract and decrypt a hidden message from a stego image |
| `POST /api/v1/detect` | Run AI steganalysis to classify an image as CLEAN or STEGO |
| `POST /api/v1/attack` | Simulate an image attack and measure hidden-data survival |
| `GET  /api/v1/health` | Service health check |
| `GET  /api/v1/info` | System information and model status |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-username>/stegoshield.git
cd stegoshield

# Run with Docker Compose
docker-compose up --build
```

- Backend: `http://localhost:8000` (interactive docs at `/docs`)
- Frontend: `http://localhost:3000`

---

## 📊 Quality Targets

| Metric | Target | Achieved |
|---|---|---|
| PSNR (cover vs. stego) | > 40 dB | ✅ |
| SSIM (cover vs. stego) | > 0.95 | ✅ |
| Test suite | Pass | 26/26 ✅ |

---

## 👩‍💻 About

Built as an applied cybersecurity + AI project exploring the intersection of cryptography, digital signal processing, and deep learning — combining a deterministic, explainable steganography engine with a learned steganalysis detector.

---

## 📄 License

This project is available for educational and portfolio purposes.