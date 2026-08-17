// components/attack/AttackPage.jsx
import React, { useState } from 'react';
import { attackAPI } from '../../services/api';
import { ImageUploader, LoadingSpinner, ErrorAlert, ConfidenceBar, Card, MetricCard } from '../common';

const ATTACKS = [
  { value: 'jpeg_compression', label: '📸 JPEG Compression',
    param: { name: 'quality', label: 'Quality (1–100)', min: 10, max: 100, default: 75 } },
  { value: 'gaussian_noise',   label: '〜 Gaussian Noise',
    param: { name: 'sigma',   label: 'Noise Sigma',    min: 1,  max: 50,  default: 10 } },
  { value: 'resize',           label: '⤡ Resize',
    param: { name: 'scale',   label: 'Scale factor',   min: 0.25, max: 0.9, step: 0.05, default: 0.5 } },
  { value: 'brightness',       label: '☀ Brightness',
    param: { name: 'delta',   label: 'Delta (−255–255)', min: -80, max: 80, default: 30 } },
];

export default function AttackPage() {
  const [image,      setImage]      = useState(null);
  const [message,    setMessage]    = useState('');
  const [payload,    setPayload]    = useState(0.2);
  const [attackType, setAttackType] = useState('jpeg_compression');
  const [paramVal,   setParamVal]   = useState(75);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);

  const currentAttack = ATTACKS.find(a => a.value === attackType);

  const handleAttack = async () => {
    if (!image)   return setError('Please upload a stego image.');
    if (!message) return setError('Please enter the original secret message for comparison.');
    setLoading(true); setError(null); setResult(null);

    const params = { [currentAttack.param.name]: paramVal };
    try {
      const res = await attackAPI(image, message, attackType, params, payload);
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Attack simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Robustness Attack Simulation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Apply image transformations to a stego image and measure how much hidden data survives.
        </p>
      </div>

      <Card title="Step 1 — Upload Stego Image" accent="orange">
        <ImageUploader onFileSelect={setImage} label="stego image" />
      </Card>

      <Card title="Step 2 — Original Message (for comparison)" accent="orange">
        <textarea rows={3} placeholder="Enter the original secret message…"
          value={message} onChange={e => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payload bpp used during encoding — <span className="text-orange-600 font-bold">{payload}</span>
          </label>
          <input type="range" min={0.1} max={0.4} step={0.05} value={payload}
            onChange={e => setPayload(parseFloat(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
      </Card>

      <Card title="Step 3 — Attack Configuration" accent="orange">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {ATTACKS.map(a => (
              <button key={a.value} onClick={() => { setAttackType(a.value); setParamVal(a.param.default); }}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  attackType === a.value
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {currentAttack && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {currentAttack.param.label}: <span className="text-orange-600 font-bold">{paramVal}</span>
              </label>
              <input type="range"
                min={currentAttack.param.min} max={currentAttack.param.max}
                step={currentAttack.param.step || 1}
                value={paramVal} onChange={e => setParamVal(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
          )}
        </div>
      </Card>

      <button onClick={handleAttack} disabled={loading || !image || !message}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-base transition-colors">
        {loading ? <LoadingSpinner text="Simulating…" /> : '⚔️ Simulate Attack'}
      </button>

      <ErrorAlert message={error} />

      {result && (
        <Card title={`Attack Results — ${currentAttack?.label}`} accent="orange">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Bit Error Rate" value={`${(result.metrics.bit_error_rate * 100).toFixed(1)}%`}
                sub={result.metrics.bit_error_rate < 0.05 ? 'Excellent' : 'Degraded'} />
              <MetricCard label="Char Accuracy"  value={`${(result.metrics.character_accuracy * 100).toFixed(0)}%`} />
              <MetricCard label="PSNR After"     value={`${result.metrics.psnr_after_attack} dB`} />
              <MetricCard label="Full Recovery"  value={result.metrics.full_recovery ? '✅ Yes' : '❌ No'} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Character Accuracy</p>
              <ConfidenceBar value={result.metrics.character_accuracy}
                color={result.metrics.character_accuracy > 0.9 ? 'green' : 'yellow'} />
            </div>

            {result.extracted_preview && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Extracted preview:</p>
                <p className="text-sm text-gray-700 font-mono">{result.extracted_preview}…</p>
              </div>
            )}
            {result.decode_error && (
              <p className="text-xs text-red-500">Decode error: {result.decode_error}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
