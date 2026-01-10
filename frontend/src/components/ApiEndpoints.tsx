const endpoints = [
  { method: 'GET', path: '/api/info', description: 'Informacion de conexion' },
  { method: 'GET', path: '/api/health', description: 'Estado del servidor' },
  { method: 'GET', path: '/api/visitors', description: 'Lista de visitantes' },
  { method: 'POST', path: '/api/visitors', description: 'Registrar visita' },
  { method: 'GET', path: '/api/stats', description: 'Estadisticas' },
  { method: 'POST', path: '/api/images', description: 'Subir imagen (form-data: file)' },
  { method: 'GET', path: '/api/images', description: 'Lista de imagenes' },
  { method: 'DELETE', path: '/api/images/{id}', description: 'Eliminar imagen' },
];

export function ApiEndpoints() {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">API Endpoints</h2>
      </div>

      <div className="p-6">
        <ul className="space-y-3">
          {endpoints.map((endpoint) => (
            <li
              key={`${endpoint.method}-${endpoint.path}`}
              className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0"
            >
              <code className="px-3 py-1.5 bg-gray-900 text-emerald-400 rounded text-sm font-mono min-w-[220px]">
                {endpoint.method} {endpoint.path}
              </code>
              <span className="text-gray-600 text-sm">{endpoint.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
