import { useState, useCallback, useEffect } from 'react';
import {
  ConnectionStatus,
  Stats,
  ImageUpload,
  ImageGallery,
  Visitors,
  Actions,
  ApiEndpoints,
} from './components';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tailscale Demo</h1>
          <p className="text-gray-600">
            Probando acceso VPN vs Publico (Funnel) + MinIO Storage
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          <ConnectionStatus />

          <Stats refreshTrigger={refreshTrigger} />

          <ImageUpload onUploadComplete={handleRefresh} />

          <ImageGallery refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />

          <Actions onAction={handleRefresh} />

          <Visitors refreshTrigger={refreshTrigger} />

          <ApiEndpoints />
        </main>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8 mt-8">
          Demo de Tailscale Serve + Funnel | FastAPI + PostgreSQL + MinIO + Docker + React
        </footer>
      </div>
    </div>
  );
}

export default App;
