import type {
  ConnectionInfo,
  Visitor,
  Stats,
  ImageListResponse,
  ImageUploadResponse,
  HealthResponse,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Connection info
  getConnectionInfo: () => fetchJson<ConnectionInfo>(`${API_BASE}/info`),

  // Health
  getHealth: () => fetchJson<HealthResponse>(`${API_BASE}/health`),

  // Stats
  getStats: () => fetchJson<Stats>(`${API_BASE}/stats`),

  // Visitors
  getVisitors: (limit = 10) => fetchJson<Visitor[]>(`${API_BASE}/visitors?limit=${limit}`),

  registerVisitor: () =>
    fetchJson<Visitor>(`${API_BASE}/visitors`, { method: 'POST' }),

  // Images
  getImages: (limit = 20) => fetchJson<ImageListResponse>(`${API_BASE}/images?limit=${limit}`),

  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al subir imagen' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  deleteImage: async (imageId: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/images/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al eliminar imagen' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
  },
};
