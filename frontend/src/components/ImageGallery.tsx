import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Image } from '../types';

interface ImageGalleryProps {
  refreshTrigger?: number;
  onRefresh: () => void;
}

interface ImageModalProps {
  image: Image;
  onClose: () => void;
  onDelete: () => void;
}

function ImageModal({ image, onClose, onDelete }: ImageModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar esta imagen?')) return;

    setIsDeleting(true);
    try {
      await api.deleteImage(image.id);
      onDelete();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl hover:text-red-400 z-10 drop-shadow-lg"
        >
          &times;
        </button>

        <img
          src={image.url}
          alt={image.original_filename}
          className="max-w-full max-h-[70vh] object-contain bg-gray-900"
        />

        <div className="p-4 border-t border-gray-200">
          <p className="text-gray-700 mb-1">
            <span className="text-gray-500">Archivo:</span> {image.original_filename}
          </p>
          <p className="text-gray-700 mb-1">
            <span className="text-gray-500">Tamano:</span> {formatSize(image.file_size)}
          </p>
          <p className="text-gray-700 mb-4">
            <span className="text-gray-500">Subido:</span>{' '}
            {new Date(image.uploaded_at).toLocaleString('es-ES')}
          </p>

          <div className="flex gap-3">
            <a
              href={image.url}
              download={image.original_filename}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              Descargar
            </a>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageGallery({ refreshTrigger, onRefresh }: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getImages()
      .then((data) => setImages(data.images))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Galeria de Imagenes</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Actualizar
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay imagenes subidas</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.original_filename}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm truncate">{image.original_filename}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={onRefresh}
        />
      )}
    </div>
  );
}
