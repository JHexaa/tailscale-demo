import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Visitor } from '../types';

interface VisitorsProps {
  refreshTrigger?: number;
}

export function Visitors({ refreshTrigger }: VisitorsProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVisitors()
      .then(setVisitors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Visitantes Recientes</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 font-semibold">IP</th>
              <th className="px-6 py-3 font-semibold">Tipo</th>
              <th className="px-6 py-3 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  <div className="animate-pulse">Cargando...</div>
                </td>
              </tr>
            ) : visitors.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                  No hay visitantes registrados
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {visitor.ip_address}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        visitor.access_type === 'vpn'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {visitor.access_type === 'vpn' ? 'VPN' : 'Publico'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(visitor.timestamp).toLocaleString('es-ES')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
