import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Stats as StatsType } from '../types';

interface StatItemProps {
  value: number;
  label: string;
  colorClass: string;
}

function StatItem({ value, label, colorClass }: StatItemProps) {
  return (
    <div className={`p-4 rounded-lg ${colorClass}`}>
      <span className="block text-3xl font-bold">{value}</span>
      <span className="text-sm uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}

interface StatsProps {
  refreshTrigger?: number;
}

export function Stats({ refreshTrigger }: StatsProps) {
  const [stats, setStats] = useState<StatsType | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Estadisticas</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <StatItem
            value={stats?.total_visitors ?? 0}
            label="Visitantes"
            colorClass="bg-gray-100 text-gray-800"
          />
          <StatItem
            value={stats?.vpn_visitors ?? 0}
            label="VPN"
            colorClass="bg-emerald-100 text-emerald-700"
          />
          <StatItem
            value={stats?.public_visitors ?? 0}
            label="Publico"
            colorClass="bg-blue-100 text-blue-700"
          />
          <StatItem
            value={stats?.total_images ?? 0}
            label="Imagenes"
            colorClass="bg-purple-100 text-purple-700"
          />
        </div>
      </div>
    </div>
  );
}
