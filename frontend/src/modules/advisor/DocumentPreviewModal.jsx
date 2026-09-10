// frontend/src/modules/advisor/DocumentPreviewModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Check, FileText, AlertCircle, ZoomIn, ZoomOut,
  RotateCw, Image as ImageIcon
} from 'lucide-react';

export default function DocumentPreviewModal({
  isOpen,
  file,
  category = 'Document',
  targetId = '',
  targetType = 'advisor',
  onClose,
  onConfirm,
  isUploading = false
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setZoomLevel(1);
      setRotation(0);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name || '');
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(file, category, targetId, targetType);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Confirm {category}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {file.name} • {fileSizeMb} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Image Controls Toolbar */}
        {isImage && (
          <div className="flex items-center justify-between px-6 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 flex items-center gap-1.5 text-[11px]">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Image Inspection
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] px-1 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer ml-1"
                title="Rotate 90deg"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Centered Document / Image Preview Frame */}
        <div className="p-4 bg-slate-950 flex items-center justify-center">
          <div className="w-full h-56 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden relative shadow-inner">
            {previewUrl ? (
              isPdf ? (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  aria-label={file.name}
                  className="h-full w-full rounded-xl border border-slate-800 bg-white"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 p-4 text-center">
                    <FileText className="h-10 w-10 text-blue-400" />
                    <p className="text-xs font-bold text-white">PDF selected and ready to upload</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-400 underline">
                      Open PDF in a new tab
                    </a>
                  </div>
                </object>
              ) : isImage ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out',
                    maxHeight: '190px'
                  }}
                  className="max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                />
              ) : (
                <div className="p-4 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-[10px] text-slate-400">Ready to upload to Document Vault</p>
                </div>
              )
            ) : (
              <div className="text-slate-500 text-xs">Generating preview...</div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#1e293b] border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px]">Inspect document legibility before confirming upload.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel & Discard
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isUploading}
              className="px-5 py-2.5 bg-[#0078d4] hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-900/30 transition cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to Vault...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Use File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : modalContent;
}