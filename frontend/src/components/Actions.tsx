import { useState } from 'react';
import { api } from '../services/api';

interface ActionsProps {
  onAction: () => void;
}

export function Actions({ onAction }: ActionsProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    setMessage(null);

    try {
      const visitor = await api.registerVisitor();
      setMessage({
        type: 'success',
        text: `Visita registrada! IP: ${visitor.ip_address}, Tipo: ${visitor.access_type}`,
      });
      onAction();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al registrar',
      });
    } finally {
      setIsRegistering(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Acciones</h2>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
          >
            {isRegistering ? 'Registrando...' : 'Registrar mi Visita'}
          </button>
          <button
            onClick={onAction}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200"
          >
            Actualizar Todo
          </button>
        </div>

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
