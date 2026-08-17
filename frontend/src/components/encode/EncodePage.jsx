// components/encode/EncodePage.jsx
import React, { useState } from 'react';
import { encodeAPI } from '../../services/api';
import {
  ImageUploader, LoadingSpinner, ErrorAlert, SuccessAlert,
  MetricCard, Card
} from '../common';

export default function EncodePage() {
  const [image,   setImage]   = useState(null);
  const [message, setMessage] = useState('');
  const [key,     setKey]     = useState('');
  const [payload, setPayload] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const handleEncode = async () => {
    if (!image)   return setError('Please upload a cover image.');
    if (!message) return setError('Please enter a secret message.');
    setLoading(true); setError(null); setResult(null);

    try {
      const res  = await encodeAPI(image, message, key || null, payload);
      const url  = URL.createObjectURL(res.data);
      const psnr = res.headers['x-psnr']             || '—';
      const ms   = res.headers['x-encoding-time-ms'] || '—';
      const cap  = res.headers['x-capacity-bytes']   || '—';
      setResult({ url, psnr, ms, cap, size: res.data.size });
    } catch (e) {
      setError(e.message || 'Encoding failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Hide Secret Message</h1>
        <p className="text-gray-500 text-sm mt-1">
          Encrypt your message with AES-256 then embed it invisibly using JUNIWARD steganography.
        </p>
      </div>

      <Card title="Step 1 — Upload Cover Image" accent="blue">
        <ImageUploader onFileSelect={setImage} label="cover image" />
      </Card>

      <Card title="Step 2 — Secret Message" accent="blue">
        <textarea
          rows={4}
          placeholder="Type your secret message here…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {message.length} characters ({new Blob([message]).size} bytes)
        </p>
      </Card>

      <Card title="Step 3 — Settings (Optional)" accent="blue">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encryption Key
            </label>
            <input
              type="text"
              placeholder="Leave empty to use the system-generated key"
              value={key}
              onChange={e => setKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payload — <span className="text-blue-600 font-bold">{payload} bpp</span>
            </label>
            <input type="range" min={0.1} max={0.4} step={0.05}
              value={payload} onChange={e => setPayload(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0.1 — More secure</span>
              <span>0.4 — More capacity</span>
            </div>
          </div>
        </div>
      </Card>

      <button
        onClick={handleEncode}
        disabled={loading || !image || !message}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-base transition-colors"
      >
        {loading ? <LoadingSpinner text="Encoding…" /> : '🔒 Encode & Hide Message'}
      </button>

      <ErrorAlert message={error} />

      {result && (
        <Card title="✅ Encoding Successful" accent="green">
          <div className="space-y-4">
            <img src={result.url} alt="stego"
              className="mx-auto max-h-56 rounded-lg shadow object-contain"/>

            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="PSNR" value={`${result.psnr} dB`} sub="Higher = better" />
              <MetricCard label="Encode Time" value={`${result.ms} ms`} />
              <MetricCard label="Capacity" value={`${result.cap} B`} sub="at current bpp" />
            </div>

            <a href={result.url} download="stego.png"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold transition-colors">
              ⬇ Download Stego Image
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
