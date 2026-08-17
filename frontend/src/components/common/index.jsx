// components/common/index.jsx — all shared UI primitives

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Processing…' }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      {text}
    </span>
  );
}

// ─── Error Alert ──────────────────────────────────────────────────────────────
export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start mt-4">
      <span className="text-red-500 text-xl">⚠️</span>
      <div>
        <p className="font-semibold text-red-700">Error</p>
        <p className="text-red-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// ─── Success Alert ────────────────────────────────────────────────────────────
export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 items-start mt-4">
      <span className="text-green-500 text-xl">✅</span>
      <p className="text-green-700 text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Image Uploader (drag & drop) ────────────────────────────────────────────
export function ImageUploader({ onFileSelect, label = 'image', accept }) {
  const [preview, setPreview] = React.useState(null);
  const [fileName, setFileName] = React.useState('');

  const onDrop = useCallback((accepted) => {
    const file = accepted[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || { 'image/*': ['.png', '.jpg', '.jpeg', '.bmp'] },
    maxFiles: 1,
  });

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Upload {label}
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="preview"
              className="mx-auto max-h-40 rounded-lg object-contain shadow"/>
            <p className="text-xs text-gray-500">{fileName}</p>
            <p className="text-xs text-blue-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📸</div>
            <p className="text-gray-600 font-medium">
              {isDragActive ? 'Drop here!' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-xs text-gray-400">PNG, JPEG, BMP supported</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, color = 'blue' }) {
  const colors = {
    blue  : 'bg-blue-500',
    green : 'bg-green-500',
    red   : 'bg-red-500',
    yellow: 'bg-yellow-400',
  };
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-700 ${colors[color] || colors.blue}`}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
export function Card({ title, children, accent = 'blue' }) {
  const borders = { blue: 'border-blue-400', purple: 'border-purple-400',
                    green: 'border-green-400', orange: 'border-orange-400' };
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
      {title && (
        <div className={`border-l-4 ${borders[accent] || borders.blue} px-5 py-3 bg-gray-50`}>
          <h2 className="font-bold text-gray-700">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
