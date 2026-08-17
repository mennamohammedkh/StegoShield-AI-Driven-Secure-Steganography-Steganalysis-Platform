// components/detect/DetectPage.jsx
import React, { useState } from 'react';
import { detectAPI } from '../../services/api';
import { ImageUploader, LoadingSpinner, ErrorAlert, ConfidenceBar, Card } from '../common';

export default function DetectPage() {
  const [image,   setImage]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const handleDetect = async () => {
    if (!image) return setError('Please upload an image to analyze.');
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await detectAPI(image);
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Detection failed.');
    } finally {
      setLoading(false);
    }
  };

  const isStego = result?.prediction === 'STEGO';
  const conf    = result?.confidence ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">AI Steganalysis Detection</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload any image. Our CNN model will determine whether hidden data is present.
        </p>
      </div>

      <Card title="Upload Image for Analysis" accent="purple">
        <ImageUploader onFileSelect={setImage} label="image to analyze" />
      </Card>

      <button onClick={handleDetect} disabled={loading || !image}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-base transition-colors">
        {loading ? <LoadingSpinner text="Analyzing…" /> : '🕵️ Detect Hidden Data'}
      </button>

      <ErrorAlert message={error} />

      {result?.status === 'pending' && (
        <Card title="⏳ Model Not Yet Available" accent="orange">
          <p className="text-gray-600 text-sm">
            The ML model (steganalysis.onnx) from Person 1 has not been integrated yet.
            Detection will be available once the model is delivered.
          </p>
        </Card>
      )}

      {result?.status === 'success' && (
        <Card title="Detection Result" accent={isStego ? 'orange' : 'green'}>
          <div className="space-y-4 text-center">
            <div className={`text-5xl py-4 rounded-xl ${isStego ? 'bg-red-50' : 'bg-green-50'}`}>
              {isStego ? '⚠️' : '✅'}
            </div>
            <p className={`text-2xl font-extrabold ${isStego ? 'text-red-600' : 'text-green-600'}`}>
              {isStego ? 'STEGO DETECTED' : 'CLEAN IMAGE'}
            </p>

            <div className="space-y-1 text-left">
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Confidence</span>
                <span>{(conf * 100).toFixed(1)}%</span>
              </div>
              <ConfidenceBar value={conf} color={isStego ? 'red' : 'green'} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Clean probability</p>
                <p className="text-lg font-bold text-green-700">
                  {(result.probabilities.clean * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Stego probability</p>
                <p className="text-lg font-bold text-red-700">
                  {(result.probabilities.stego * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-400 pt-2 space-y-0.5">
              <p>Model: CNN trained on ALASKA2 · Backend: {result.inference.backend}</p>
              <p>Inference time: {result.inference.time_ms} ms · Threshold: {result.inference.threshold_used}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
