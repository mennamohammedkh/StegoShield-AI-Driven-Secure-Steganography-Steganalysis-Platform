// components/decode/DecodePage.jsx
import React, { useState } from 'react';
import { decodeAPI } from '../../services/api';
import { ImageUploader, LoadingSpinner, ErrorAlert, Card } from '../common';

export default function DecodePage() {
  const [image,   setImage]   = useState(null);
  const [key,     setKey]     = useState('');
  const [payload, setPayload] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  const handleDecode = async () => {
    if (!image) return setError('Please upload a stego image.');
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await decodeAPI(image, key || null, payload);
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Decoding failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Extract Secret Message</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a stego image to extract and decrypt the hidden message.
        </p>
      </div>

      <Card title="Step 1 — Upload Stego Image" accent="blue">
        <ImageUploader onFileSelect={setImage} label="stego image" />
      </Card>

      <Card title="Step 2 — Settings" accent="blue">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encryption Key
            </label>
            <input type="text"
              placeholder="Leave empty to use the system key"
              value={key}
              onChange={e => setKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-yellow-600 mt-1">
              ⚠ Using a wrong key will produce a decryption error.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payload used during encoding — <span className="text-blue-600 font-bold">{payload} bpp</span>
            </label>
            <input type="range" min={0.1} max={0.4} step={0.05}
              value={payload} onChange={e => setPayload(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </Card>

      <button onClick={handleDecode} disabled={loading || !image}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-base transition-colors">
        {loading ? <LoadingSpinner text="Decoding…" /> : '🔓 Extract Message'}
      </button>

      <ErrorAlert message={error} />

      {result && (
        <Card title="✅ Message Extracted" accent="green">
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-24">
              <p className="text-gray-800 text-sm whitespace-pre-wrap">{result.message}</p>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Length: {result.message_length} bytes</span>
              <span>Time: {result.decoding_time_ms} ms</span>
            </div>
            <button onClick={copyToClipboard}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">
              {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
