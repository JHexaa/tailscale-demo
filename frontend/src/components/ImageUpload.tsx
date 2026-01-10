import { useState, useCallback } from 'react';
import { api } from '../services/api';

interface ImageUploadProps {
  onUploadComplete: () => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El archivo excede 5MB' });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Tipo de archivo no permitido' });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setMessage(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const result = await api.uploadImage(file);
      setProgress(100);
      setMessage({ type: 'success', text: `"${result.image?.original_filename}" subida correctamente` });
      onUploadComplete();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al subir' });
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setTimeout(() => {
        setProgress(0);
        setMessage(null);
      }, 3000);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }, [handleUpload]);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Subir Imagen</h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          Max 5MB
        </span>
      </div>

      <div className="p-6">
        <label
          className={`
            block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          <svg
            className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-purple-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-gray-600">
            Arrastra una imagen aqui o{' '}
            <span className="text-purple-600 font-medium">selecciona un archivo</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">JPEG, PNG, GIF, WebP (max 5MB)</p>
        </label>

        {isUploading && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Subiendo...</p>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
