import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ConnectionInfo } from '../types';

export function ConnectionStatus() {
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getConnectionInfo()
      .then(setInfo)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!info) return null;

  const isVPN = info.is_vpn;
  const borderColor = isVPN ? 'border-l-emerald-500' : 'border-l-blue-500';
  const badgeColor = isVPN
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-blue-100 text-blue-700';

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Estado de Conexion</h2>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${badgeColor}`}>
          {isVPN ? 'VPN' : 'PUBLICO'}
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo de Acceso</label>
            <p className="text-gray-800 font-medium mt-1">{info.access_label}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Tu IP</label>
            <p className="text-gray-800 font-medium mt-1 font-mono">{info.ip_address}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Hora del Servidor</label>
            <p className="text-gray-800 font-medium mt-1">
              {new Date(info.server_time).toLocaleString('es-ES')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-gray-500 uppercase tracking-wide">User Agent</label>
          <p className="text-gray-600 text-sm mt-1 break-all">{info.user_agent}</p>
        </div>
      </div>
    </div>
  );
}
